// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice.service

import evaka.core.shared.domain.HelsinkiDateTime
import evaka.core.shared.sftp.SftpClient
import evaka.instance.petajavesi.invoice.service.PetajavesiInvoiceFixtures.invoiceA
import evaka.instance.petajavesi.invoice.service.PetajavesiInvoiceFixtures.invoiceB
import evaka.instance.petajavesi.invoice.service.PetajavesiInvoiceFixtures.invoiceWithoutSsn
import java.io.InputStream
import java.time.LocalDate
import java.time.LocalTime
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import software.amazon.awssdk.services.s3.model.PutObjectResponse

/** Laskuintegraation asiakas mockatuilla S3- ja SFTP-asiakkailla. */
class PetajavesiInvoiceIntegrationClientTest {
    private val now = HelsinkiDateTime.of(LocalDate.of(2026, 3, 15), LocalTime.of(12, 0))
    private val lookup = ServiceNeedNameLookup { PetajavesiInvoiceFixtures.serviceNeedNames }
    private val expectedFile = "invoice_batch_succeeded_20260315_120000.txt"

    private fun client(s3: S3Client, sftp: SftpClient?) =
        PetajavesiInvoiceIntegrationClient(s3, "evaka-invoices-test", sftp, "in/", lookup)

    private fun workingS3(): S3Client =
        mock<S3Client>().also {
            whenever(it.putObject(any<PutObjectRequest>(), any<RequestBody>()))
                .thenReturn(PutObjectResponse.builder().build())
        }

    private fun generated() =
        PetajavesiInvoiceFileGenerator.generate(
            PetajavesiInvoiceFixtures.sendable,
            PetajavesiInvoiceFixtures.serviceNeedNames,
        )

    /** Hetuttomat laskut palautetaan käsin lähetettävinä; niistä ei muodosteta tiedostoa. */
    @Test
    fun `invoices without ssn are returned as manually sent and produce no file`() {
        val s3 = workingS3()
        val sftp = mock<SftpClient>()

        val result = client(s3, sftp).send(now, PetajavesiInvoiceFixtures.all)

        assertEquals(listOf(invoiceA, invoiceB), result.succeeded)
        assertEquals(listOf(invoiceWithoutSsn), result.manuallySent)
        val request = argumentCaptor<PutObjectRequest>()
        val body = argumentCaptor<RequestBody>()
        verify(s3, times(1)).putObject(request.capture(), body.capture())
        assertEquals("evaka-invoices-test", request.firstValue.bucket())
        assertEquals("invoices/$expectedFile", request.firstValue.key())
        assertTrue(
            body.firstValue
                .contentStreamProvider()
                .newStream()
                .readAllBytes()
                .contentEquals(generated())
        )
        verify(sftp, times(1)).put(any<InputStream>(), eq("in/$expectedFile"))
    }

    // S3:een kirjoitettu ja SFTP:llä lähetetty sisältö on
    // sama, eikä S3-virhe muuta sitä
    @Test
    fun `sftp receives the same bytes as s3 and an s3 failure does not change them`() {
        val sent = argumentCaptor<InputStream>()
        val sftp = mock<SftpClient>()
        client(workingS3(), sftp).send(now, PetajavesiInvoiceFixtures.sendable)
        verify(sftp).put(sent.capture(), eq("in/$expectedFile"))
        assertTrue(sent.firstValue.readAllBytes().contentEquals(generated()))

        val failingS3 = mock<S3Client>()
        whenever(failingS3.putObject(any<PutObjectRequest>(), any<RequestBody>()))
            .thenThrow(RuntimeException("s3 down"))
        val sftpAfterFailure = mock<SftpClient>()
        val sentAfterFailure = argumentCaptor<InputStream>()

        val result =
            client(failingS3, sftpAfterFailure).send(now, PetajavesiInvoiceFixtures.sendable)

        assertEquals(PetajavesiInvoiceFixtures.sendable, result.succeeded)
        verify(sftpAfterFailure).put(sentAfterFailure.capture(), eq("in/$expectedFile"))
        assertTrue(sentAfterFailure.firstValue.readAllBytes().contentEquals(generated()))
    }

    @Test
    fun `without sftp configuration the file is written only to s3`() {
        val s3 = workingS3()

        val result = client(s3, null).send(now, PetajavesiInvoiceFixtures.sendable)

        assertEquals(PetajavesiInvoiceFixtures.sendable, result.succeeded)
        verify(s3, times(1)).putObject(any<PutObjectRequest>(), any<RequestBody>())
    }

    @Test
    fun `nothing is written when there are no sendable invoices`() {
        val s3 = workingS3()
        val sftp = mock<SftpClient>()

        val result = client(s3, sftp).send(now, listOf(invoiceWithoutSsn))

        assertEquals(emptyList(), result.succeeded)
        assertEquals(listOf(invoiceWithoutSsn), result.manuallySent)
        verify(s3, never()).putObject(any<PutObjectRequest>(), any<RequestBody>())
        verify(sftp, never()).put(any<InputStream>(), any<String>())
    }

    // SFTP-virhe etenee kutsujalle, jolloin laskuja ei
    // merkitä lähetetyiksi
    @Test
    fun `sftp failure propagates to the caller`() {
        val sftp = mock<SftpClient>()
        whenever(sftp.put(any<InputStream>(), any<String>()))
            .thenThrow(IllegalStateException("sftp down"))

        val error =
            assertFailsWith<IllegalStateException> {
                client(workingS3(), sftp).send(now, listOf(invoiceA))
            }
        assertEquals("sftp down", error.message)
    }
}
