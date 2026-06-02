// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice

import evaka.core.invoicing.domain.InvoiceDetailed
import evaka.core.invoicing.domain.InvoiceRowDetailed
import evaka.core.invoicing.service.PetajavesiInvoiceProducts
import evaka.core.shared.domain.HelsinkiDateTime
import java.io.ByteArrayOutputStream
import java.nio.charset.Charset
import java.time.format.DateTimeFormatter
import kotlin.math.pow

/**
 * Generates ProE fixed-width invoice files for Petäjävesi.
 */
object InvoiceFileGenerator {
    private val cp1252Charset = Charset.forName("windows-1252")

    fun filename(now: HelsinkiDateTime, prefix: String): String {
        val timestamp = now.toLocalDateTime().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
        return "${prefix}Petajavesi_eVaka_${timestamp}.dat"
    }

    fun generate(invoices: List<InvoiceDetailed>): ByteArray {
        return ByteArrayOutputStream().use { outputStream ->
            outputStream.bufferedWriter(cp1252Charset).use { writer ->
                invoices.forEach { invoice ->
                    writer.write(formatInvoiceHeaderLine(invoice))
                    writer.newLine()
                    val ssn = invoice.headOfFamily.ssn ?: error("Invoice headOfFamily has no SSN")
                    invoice.rows.forEach { row ->
                        writer.write(formatInvoiceRow(ssn, row))
                        writer.newLine()
                        writer.write(formatServiceNeedDescription(ssn, row))
                        writer.newLine()
                        writer.write(formatLocationTimeDescription(ssn, row))
                        writer.newLine()
                    }
                }
            }
            outputStream.toByteArray()
        }
    }

    private fun formatInvoiceHeaderLine(invoice: InvoiceDetailed): String {
        val line = StringBuilder(" ".repeat(600))
        val fullName = "${invoice.headOfFamily.lastName} ${invoice.headOfFamily.firstName}"
        val postalArea = "${invoice.headOfFamily.postalCode} ${invoice.headOfFamily.postOffice.uppercase()}"
        val formattedDate = formatDate(invoice.invoiceDate.toString()) ?: "00000000"

        setField(line, 0, 11, invoice.headOfFamily.ssn.toString())
        setField(line, 11, 12, "L")
        setField(line, 14, 64, fullName)
        setField(line, 114, 144, invoice.headOfFamily.streetAddress)
        setField(line, 144, 174, postalArea)
        setField(line, 279, 280, "0")
        setField(line, 280, 281, "1")
        setField(line, 284, 285, "K")
        setField(line, 285, 293, formattedDate)
        setField(line, 368, 371, "EUR")
        setField(line, 547, 558, invoice.headOfFamily.ssn.toString())

        return line.toString()
    }

    private fun formatInvoiceRow(ssn: String, row: InvoiceRowDetailed): String {
        val line = StringBuilder(" ".repeat(265))
        val product = PetajavesiInvoiceProducts.findProduct(row.product)
        val formattedUnitPrice = formatNumber(row.unitPrice, 12, 2)
        val formattedUnitAmount = formatNumber(row.amount, 12, 4)
        val unitAmountPrefix = if (row.amount > 0) "+" else "-"
        val creditPosting = if (row.unitName == "Kintauden päiväkoti") "32950552013021" else "32950552023021"

        setField(line, 0, 11, ssn)
        setField(line, 11, 12, "1")
        setField(line, 12, 52, product.nameFi)
        setField(line, 52, 53, "+")
        setField(line, 53, 65, formattedUnitPrice)
        setField(line, 65, 68, "kk")
        setField(line, 68, 69, unitAmountPrefix)
        setField(line, 69, 81, formattedUnitAmount)
        setField(line, 81, 83, "00")
        setField(line, 204, 264, creditPosting)

        return line.toString()
    }

    private fun formatServiceNeedDescription(ssn: String, row: InvoiceRowDetailed): String {
        val line = StringBuilder(" ".repeat(200))
        val description = "${row.child.firstName} ${row.child.lastName} ${row.serviceNeed ?: ""}"

        setField(line, 0, 11, ssn)
        setField(line, 11, 12, "3")
        setField(line, 12, 89, description)

        return line.toString()
    }

    private fun formatLocationTimeDescription(ssn: String, row: InvoiceRowDetailed): String {
        val line = StringBuilder(" ".repeat(200))
        val periodStart = row.periodStart.format(DateTimeFormatter.ofPattern("dd."))
        val periodEnd = row.periodEnd.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
        val description = "${row.unitName}, ajalta: $periodStart-$periodEnd"

        setField(line, 0, 11, ssn)
        setField(line, 11, 12, "3")
        setField(line, 12, 89, description)

        return line.toString()
    }

    private fun setField(line: StringBuilder, startPos: Int, endPos: Int, value: String) {
        val fieldWidth = endPos - startPos
        val truncatedValue = if (value.length > fieldWidth) value.substring(0, fieldWidth) else value
        for (i in truncatedValue.indices) {
            if (startPos + i < line.length) {
                line[startPos + i] = truncatedValue[i]
            }
        }
    }

    private fun formatNumber(number: Int, totalDigits: Int = 12, decimalPlaces: Int = 2): String {
        val multiplier = 10.0.pow(decimalPlaces).toInt()
        val priceWithDecimals = number * multiplier
        return priceWithDecimals.toString().padStart(totalDigits, '0')
    }

    private fun formatDate(dateString: String): String? {
        val regex = Regex("""^\d{4}-\d{2}-\d{2}$""")
        return if (regex.matches(dateString)) dateString.replace("-", "") else null
    }
}
