// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice

import evaka.core.invoicing.domain.InvoiceDetailed
import evaka.core.invoicing.integration.InvoiceIntegrationClient
import evaka.core.shared.domain.HelsinkiDateTime
import evaka.core.shared.sftp.SftpClient
import io.github.oshai.kotlinlogging.KotlinLogging

private val logger = KotlinLogging.logger {}

/**
 * Petäjävesi invoice client that delegates to the existing S3 client for archival,
 * and additionally sends the invoice file via SFTP.
 */
class PetajavesiInvoiceClient(
    private val s3Client: InvoiceIntegrationClient,
    private val sftpClient: SftpClient,
    private val sftpPrefix: String,
) : InvoiceIntegrationClient {

    override fun send(now: HelsinkiDateTime, invoices: List<InvoiceDetailed>): InvoiceIntegrationClient.SendResult {
        // 1. Send to S3 (existing behavior)
        val s3Result = s3Client.send(now, invoices)

        // 2. Additionally send succeeded invoices via SFTP
        if (s3Result.succeeded.isNotEmpty()) {
            try {
                val content = InvoiceFileGenerator.generate(s3Result.succeeded)
                val filename = InvoiceFileGenerator.filename(now, sftpPrefix)

                logger.info { "Sending ${s3Result.succeeded.size} invoices via SFTP as $filename" }
                content.inputStream().use { sftpClient.put(it, filename) }
                logger.info { "Successfully sent $filename via SFTP" }
            } catch (e: Exception) {
                logger.error(e) { "Failed to send invoices via SFTP" }
                throw e
            }
        }

        return s3Result
    }
}
