// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice.service

import evaka.core.invoicing.domain.InvoiceDetailed
import evaka.core.invoicing.integration.InvoiceIntegrationClient
import evaka.core.shared.InvoiceRowId
import evaka.core.shared.domain.HelsinkiDateTime
import evaka.core.shared.sftp.SftpClient
import io.github.oshai.kotlinlogging.KotlinLogging
import java.time.format.DateTimeFormatter
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest

private val logger = KotlinLogging.logger {}

/** Hakee laskurivien palveluntarpeiden nimet; tuotannossa kantakysely, testeissä kiinteä kartta. */
fun interface ServiceNeedNameLookup {
    fun forRows(rowIds: Set<InvoiceRowId>): Map<InvoiceRowId, String>
}

/**
 * Petäjäveden ainoa laskuaineiston siirtoasiakas.
 *
 * - Laskut, joiden päämiehellä on henkilötunnus, kirjoitetaan yhtenä CP1252-tiedostona S3-ämpäriin
 *   aina, ja lähetetään SFTP:llä sisällöltään samana, jos SFTP on määritelty.
 * - S3-virhe kirjataan lokiin eikä keskeytä ajoa; SFTP-virhe keskeyttää ajon ennen
 *   `SendResult`-arvon palautusta, jolloin kutsuja ei merkitse laskuja lähetetyiksi.
 * - Henkilötunnuksettomista laskuista ei muodosteta tiedostoa: ne palautetaan
 *   `manuallySent`-kentässä (lähtötilanteen `manual`-tiedosto kaatui aina, koska tietueen jokainen
 *   kenttä vaatii hetun).
 * - Tiedostonimen aikaleima tulee `now`-parametrista, jotta ajo on toistettava.
 */
class PetajavesiInvoiceIntegrationClient(
    private val s3Client: S3Client,
    private val bucketName: String,
    private val sftpClient: SftpClient?,
    private val sftpPrefix: String,
    private val serviceNeedNames: ServiceNeedNameLookup,
) : InvoiceIntegrationClient {

    override fun send(
        now: HelsinkiDateTime,
        invoices: List<InvoiceDetailed>,
    ): InvoiceIntegrationClient.SendResult {
        logger.info { "Petäjävesi invoice client processing ${invoices.size} invoices" }

        val (withSSN, withoutSSN) = invoices.partition { it.headOfFamily.ssn != null }

        if (withSSN.isNotEmpty()) {
            val names = serviceNeedNames.forRows(withSSN.flatMap { it.rows }.map { it.id }.toSet())
            val content = PetajavesiInvoiceFileGenerator.generate(withSSN, names)
            val timestamp =
                now.toLocalDateTime().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
            val filename = "invoice_batch_succeeded_$timestamp.txt"
            val s3Key = "invoices/$filename"

            try {
                val putObjectRequest =
                    PutObjectRequest.builder()
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

            if (sftpClient == null) {
                logger.info {
                    "SFTP not configured: skipped sending $filename (${withSSN.size} invoices)"
                }
            } else {
                val sftpFilename = "$sftpPrefix$filename"
                try {
                    logger.info { "Sending ${withSSN.size} invoices via SFTP as $sftpFilename" }
                    content.inputStream().use { sftpClient.put(it, sftpFilename) }
                    logger.info { "Successfully sent $sftpFilename via SFTP" }
                } catch (e: Exception) {
                    logger.error(e) { "Failed to send invoices via SFTP" }
                    throw e
                }
            }
        }

        if (withoutSSN.isNotEmpty()) {
            logger.info {
                "${withoutSSN.size} invoices without head of family SSN are left for manual sending; no file is generated"
            }
        }

        return InvoiceIntegrationClient.SendResult(succeeded = withSSN, manuallySent = withoutSSN)
    }
}
