// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice

import evaka.core.invoicing.domain.InvoiceDetailed
import evaka.core.invoicing.integration.InvoiceIntegrationClient
import evaka.core.shared.domain.HelsinkiDateTime
import evaka.core.shared.sftp.SftpClient
import io.github.oshai.kotlinlogging.KotlinLogging
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest

private val logger = KotlinLogging.logger {}

/**
 * Petäjävesi invoice client that writes invoices to S3 and sends via SFTP.
 * Uses the same file content and naming as the original MockClient implementation.
 */
class PetajavesiInvoiceClient(
    private val s3Client: S3Client,
    private val bucketName: String,
    private val sftpClient: SftpClient,
    private val sftpPrefix: String,
) : InvoiceIntegrationClient {

    override fun send(now: HelsinkiDateTime, invoices: List<InvoiceDetailed>): InvoiceIntegrationClient.SendResult {
        logger.info { "Petäjävesi invoice client processing ${invoices.size} invoices" }

        val (withSSN, withoutSSN) = invoices.partition { it.headOfFamily.ssn != null }

        if (withSSN.isNotEmpty()) {
            val content = InvoiceFileGenerator.generate(withSSN)
            val timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
            val filename = "invoice_batch_succeeded_${timestamp}.txt"
            val s3Key = "invoices/$filename"

            // Write to S3
            try {
                val putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType("text/plain")
                    .contentEncoding("CP1252")
                    .build()
                s3Client.putObject(putObjectRequest, RequestBody.fromBytes(content))
                logger.info { "Written ${withSSN.size} invoices to S3: s3://$bucketName/$s3Key" }
            } catch (e: Exception) {
                logger.error(e) { "Failed to write invoices to S3" }
            }

            // Send via SFTP (same content, same filename)
            try {
                val sftpFilename = "$sftpPrefix$filename"
                logger.info { "Sending ${withSSN.size} invoices via SFTP as $sftpFilename" }
                content.inputStream().use { sftpClient.put(it, sftpFilename) }
                logger.info { "Successfully sent $sftpFilename via SFTP" }
            } catch (e: Exception) {
                logger.error(e) { "Failed to send invoices via SFTP" }
                throw e
            }
        }

        if (withoutSSN.isNotEmpty()) {
            val content = InvoiceFileGenerator.generate(withoutSSN)
            val timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
            val filename = "invoice_batch_manual_${timestamp}.txt"
            val s3Key = "invoices/$filename"

            try {
                val putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType("text/plain")
                    .contentEncoding("CP1252")
                    .build()
                s3Client.putObject(putObjectRequest, RequestBody.fromBytes(content))
                logger.info { "Written ${withoutSSN.size} manual invoices to S3: s3://$bucketName/$s3Key" }
            } catch (e: Exception) {
                logger.error(e) { "Failed to write manual invoices to S3" }
            }
        }

        return InvoiceIntegrationClient.SendResult(
            succeeded = withSSN,
            manuallySent = withoutSSN,
        )
    }
}
