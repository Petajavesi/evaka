package fi.espoo.evaka.invoicing.integration

import fi.espoo.evaka.invoicing.domain.InvoiceDetailed
import fi.espoo.evaka.invoicing.domain.InvoiceRowDetailed
import fi.espoo.evaka.invoicing.service.PetajavesiInvoiceProducts
import io.github.oshai.kotlinlogging.KotlinLogging
import tools.jackson.databind.json.JsonMapper
import java.io.ByteArrayOutputStream
import java.nio.charset.Charset
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.math.pow
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest

private val logger = KotlinLogging.logger {}

interface InvoiceIntegrationClient {
    data class SendResult(
        val succeeded: List<InvoiceDetailed> = listOf(),
        val failed: List<InvoiceDetailed> = listOf(),
        val manuallySent: List<InvoiceDetailed> = listOf(),
    )

    fun send(invoices: List<InvoiceDetailed>): SendResult

    class MockClient(
        s3Client: S3Client,
        private val jsonMapper: JsonMapper,
        private val bucketEnv: fi.espoo.evaka.BucketEnv,
        private val outputDirectory: String = "invoices",
        private val filenamePrefix: String = "invoice_batch"
    ) : InvoiceIntegrationClient {
        private val s3Client = s3Client
        
        override fun send(invoices: List<InvoiceDetailed>): SendResult {
            logger.info { "Invoice integration client processing ${invoices.size} invoices" }
            
            val (withSSN, withoutSSN) = invoices.partition { invoice -> 
                invoice.headOfFamily.ssn != null 
            }
            
            // Write succeeded invoices to S3
            if (withSSN.isNotEmpty()) {
                writeInvoicesToS3(invoices, "succeeded")
            }
            
            // Write manually sent invoices to S3
            if (withoutSSN.isNotEmpty()) {
                writeInvoicesToS3(invoices, "manual")
            }
            
            return InvoiceIntegrationClient.SendResult(
                succeeded = withSSN, 
                manuallySent = withoutSSN
            )
        }
        
            private fun writeInvoicesToS3(invoices: List<InvoiceDetailed>, type: String) {
                try {
                    // Generate S3 key (path) with timestamp
                    val timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
                    val filename = "${filenamePrefix}_${type}_${timestamp}.txt"
                    val bucketName = System.getenv("EVAKA_BUCKET_INVOICES")
                    val s3Key = "invoices/$filename"
                    
                    // Create content in memory
                    val cp1252Charset = Charset.forName("windows-1252")
                    val content = ByteArrayOutputStream().use { outputStream ->
                        outputStream.bufferedWriter(cp1252Charset).use { writer ->
                            invoices.forEach { invoice ->
                                logger.info { "Processing invoice ID: ${invoice.id}" }
                                logger.info { "Invoice content: ${invoice}" }

                                val headerLine = formatInvoiceHeaderLine(invoice)
                                writer.write(headerLine)
                                writer.newLine()
                                invoice.rows.forEach { row ->
                                    val rowLine = formatInvoiceRow(invoice.headOfFamily.ssn.toString(), row)
                                    writer.write(rowLine)
                                    writer.newLine()
                                    val descriptionLine = formatServiceNeedDescription(invoice.headOfFamily.ssn.toString(), row)
                                    writer.write(descriptionLine)
                                    writer.newLine()
                                    val locationTimeLine = formatLocationTimeDescription(invoice.headOfFamily.ssn.toString(), row)
                                    writer.write(locationTimeLine)
                                    writer.newLine()
                                }
                            }
                        }
                        outputStream.toByteArray()
                    }
                    
                    // Upload to S3
                    val putObjectRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(s3Key)
                        .contentType("text/plain")
                        .contentEncoding("CP1252")
                        .build()
                    
                    s3Client.putObject(putObjectRequest, RequestBody.fromBytes(content))
                    
                    logger.info { "Written ${invoices.size} invoices to S3: s3://${bucketName}/${s3Key}" }
                    
                } catch (e: Exception) {
                    logger.error(e) { "Failed to write invoices to S3" }
                }
            }
        
        private fun formatInvoiceHeaderLine(invoice: InvoiceDetailed): String {
            // Create a fixed-width line
            val line = StringBuilder(" ".repeat(600))

            val fullName = "${invoice.headOfFamily.lastName} ${invoice.headOfFamily.firstName}"
            val postalArea =
                "${invoice.headOfFamily.postalCode} ${invoice.headOfFamily.postOffice.uppercase()}"
            val formattedDate =
                formatDate(invoice.invoiceDate.toString())
                    ?: "00000000" // Default to 0 if date is invalid

            setField(line, 0, 11, invoice.headOfFamily.ssn.toString()) // L1
            setField(line, 11, 12, "L") // L2
            setField(line, 14, 64, fullName) // L4
            setField(line, 114, 144, invoice.headOfFamily.streetAddress) // L6
            setField(line, 144, 174, postalArea) // L7
            setField(line, 279, 280, "0") // L13
            setField(line, 280, 281, "1") // L14
            setField(line, 284, 285, "K") // L18
            setField(line, 285, 293, formattedDate) // L19
            setField(line, 368, 371, "EUR") // 28
            setField(line, 547, 558, invoice.headOfFamily.ssn.toString()) // L37
            
            return line.toString()
        }

        private fun formatInvoiceRow(ssn: String, row: InvoiceRowDetailed): String {
            // Create a fixed-width line
            val line = StringBuilder(" ".repeat(265))
            val product = PetajavesiInvoiceProducts.findProduct(row.product)
            val formattedUnitPrice = formatNumber(row.unitPrice, 12, 2)
            val formattedUnitAmount = formatNumber(row.amount, 12, 4)
            val unitAmountPrefix = if (row.amount > 0) "+" else "-"
            val creditPosting = if (row.unitName == "Kintauden päiväkoti") "32950552013021" else "32950552023021" //TODO: handle with unit ID

            setField(line, 0, 11, ssn) // R1
            setField(line, 11, 12, "1") // R2
            setField(line, 12, 52, product.nameFi) // R3
            setField(line, 52, 53, "+") // R4
            setField(line, 53, 65, formattedUnitPrice) // R5
            setField(line, 65, 68, "kk") // R6
            setField(line, 68, 69, unitAmountPrefix) // R7
            setField(line, 69, 81, formattedUnitAmount) // R8
            setField(line, 81, 83, "00") // R9
            setField(line, 204, 264, creditPosting) // R13

            return line.toString()
        }

        private fun formatServiceNeedDescription(ssn: String, row: InvoiceRowDetailed): String {
            // Create a fixed-width line for the description
            val line = StringBuilder(" ".repeat(200))
            val description = "${row.child.firstName} ${row.child.lastName} ${row.serviceNeed?:""}"

            setField(line, 0, 11, ssn) // T1
            setField(line, 11, 12, "3") // T2
            setField(line, 12, 89, description) // T3

            return line.toString()
        }

        private fun formatLocationTimeDescription(ssn: String, row: InvoiceRowDetailed): String {
            // Create a fixed-width line for the description
            val line = StringBuilder(" ".repeat(200))
            val periodStart = row.periodStart.format(DateTimeFormatter.ofPattern("dd."))
            val periodEnd = row.periodEnd.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
            val description = "${row.unitName}, ajalta: $periodStart-$periodEnd"

            setField(line, 0, 11, ssn) // T1
            setField(line, 11, 12, "3") // T2
            setField(line, 12, 89, description) // T3

            return line.toString()
        }
        
        private fun setField(line: StringBuilder, startPos: Int, endPos: Int, value: String) {
            val fieldWidth = endPos - startPos
            val truncatedValue = if (value.length > fieldWidth) {
                value.substring(0, fieldWidth)
            } else {
                value
            }
            
            // Replace characters in the line
            for (i in truncatedValue.indices) {
                if (startPos + i < line.length) {
                    line[startPos + i] = truncatedValue[i]
                }
            }
        }

        private fun formatNumber(number: Int, totalDigits: Int = 12, decimalPlaces: Int = 2): String {
            // Multiply by 10^decimalPlaces to shift decimal positions
            val multiplier = 10.0.pow(decimalPlaces).toInt()
            val priceWithDecimals = number * multiplier
            
            return priceWithDecimals.toString().padStart(totalDigits, '0')
        }

        private fun formatDate(dateString: String): String? {
            // Check if the input matches yyyy-mm-dd pattern
            val regex = Regex("""^\d{4}-\d{2}-\d{2}$""")
            
            return if (regex.matches(dateString)) {
                dateString.replace("-", "")
            } else {
                null
            }
        }
    }
}

