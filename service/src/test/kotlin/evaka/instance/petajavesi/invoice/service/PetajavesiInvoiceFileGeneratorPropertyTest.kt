// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice.service

import evaka.core.daycare.CareType
import evaka.core.daycare.domain.ProviderType
import evaka.core.invoicing.domain.InvoiceDetailed
import evaka.core.invoicing.domain.InvoiceRowDetailed
import evaka.core.invoicing.domain.InvoiceStatus
import evaka.core.invoicing.domain.PersonDetailed
import evaka.core.shared.AreaId
import evaka.core.shared.DaycareId
import evaka.core.shared.InvoiceId
import evaka.core.shared.InvoiceRowId
import evaka.core.shared.PersonId
import java.nio.charset.Charset
import java.time.LocalDate
import java.util.UUID
import kotlin.random.Random
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue
import org.junit.jupiter.api.Test

/**
 * Ominaisuustestit laskutiedoston muodostukselle. Toteutettu siemenellä alustetulla
 * satunnaisgeneraattorilla ja 100 iteraatiolla ilman uutta testikirjastoa, jotta upstreamin
 * `build.gradle.kts` pysyy muuttumattomana.
 */
class PetajavesiInvoiceFileGeneratorPropertyTest {
    private val cp1252: Charset = Charset.forName("windows-1252")
    private val iterations = 100
    private val alphabet =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ äöåÄÖÅé-.,0123456789"

    private fun Random.text(maxLength: Int): String =
        (0 until nextInt(0, maxLength + 1))
            .map { alphabet[nextInt(alphabet.length)] }
            .joinToString("")

    private fun Random.date(): LocalDate = LocalDate.of(2026, nextInt(1, 13), nextInt(1, 29))

    private fun Random.person(ssn: String?) =
        PersonDetailed(
            id = PersonId(UUID.randomUUID()),
            dateOfBirth = LocalDate.of(1985, 4, 12),
            dateOfDeath = null,
            firstName = text(30),
            lastName = text(30),
            ssn = ssn,
            streetAddress = text(45),
            postalCode = "41900",
            postOffice = text(20),
            residenceCode = "",
            email = "",
            phone = "",
            language = "fi",
            invoiceRecipientName = "",
            invoicingStreetAddress = "",
            invoicingPostalCode = "",
            invoicingPostOffice = "",
            restrictedDetailsEnabled = false,
            forceManualFeeDecisions = false,
        )

    private fun Random.unitName(): String =
        when (nextInt(3)) {
            0 -> "Kintauden päiväkoti"
            1 ->
                "Kintauden päiväkoti"
                    .let { it.substring(0, it.length - 1) + "T" } // yhdellä merkillä poikkeava
            else -> text(60)
        }

    private fun Random.row(): InvoiceRowDetailed {
        val start = date()
        return InvoiceRowDetailed(
            id = InvoiceRowId(UUID.randomUUID()),
            child = person(null),
            amount = nextInt(-50, 51),
            unitPrice = nextInt(-99999, 100000),
            periodStart = start,
            periodEnd = start.plusDays(nextInt(0, 31).toLong()),
            product = PetajavesiInvoiceProducts.Product.entries.random(this).key,
            unitId = DaycareId(UUID.randomUUID()),
            unitName = unitName(),
            unitProviderType = ProviderType.MUNICIPAL,
            daycareType = setOf(CareType.CENTRE),
            costCenter = "3295",
            subCostCenter = null,
            savedCostCenter = null,
            description = "",
            correctionId = null,
            note = null,
        )
    }

    private fun Random.invoice(rows: Int = nextInt(0, 6)) =
        InvoiceDetailed(
            id = InvoiceId(UUID.randomUUID()),
            status = InvoiceStatus.DRAFT,
            periodStart = LocalDate.of(2026, 2, 1),
            periodEnd = LocalDate.of(2026, 2, 28),
            dueDate = LocalDate.of(2026, 3, 31),
            invoiceDate = date(),
            agreementType = null,
            areaId = AreaId(UUID.randomUUID()),
            headOfFamily =
                person(ssn = "%06d-%03dA".format(nextInt(10000, 311299), nextInt(100, 999))),
            codebtor = null,
            rows = (0 until rows).map { row() },
            number = 5000000000L + nextInt(1, 100000),
            sentBy = null,
            sentAt = null,
            relatedFeeDecisions = emptyList(),
            revisionNumber = 0,
            replacedInvoiceId = null,
            replacementReason = null,
            replacementNotes = null,
            attachments = emptyList(),
        )

    private fun Random.serviceNeedNames(
        invoices: List<InvoiceDetailed>
    ): Map<InvoiceRowId, String> =
        invoices.flatMap { it.rows }.filter { nextBoolean() }.associate { it.id to text(40) }

    private fun lines(bytes: ByteArray): List<String> =
        bytes.toString(cp1252).split("\n").dropLast(1)

    // Kiinteämittaisen tietueen rakenne säilyy
    @Test
    fun `record structure`() {
        val random = Random(20261022)
        repeat(iterations) {
            val invoices = (1..random.nextInt(1, 5)).map { random.invoice() }
            val names = random.serviceNeedNames(invoices)
            val out = lines(PetajavesiInvoiceFileGenerator.generate(invoices, names))
            val expectedLengths = invoices.flatMap { inv ->
                listOf(600) + inv.rows.flatMap { listOf(265, 200, 200) }
            }
            assertEquals(expectedLengths, out.map { it.length })
            var i = 0
            for (invoice in invoices) {
                val l = out[i++]
                assertEquals("L", l.substring(11, 12))
                assertEquals("0", l.substring(279, 280))
                assertEquals("1", l.substring(280, 281))
                assertEquals("K", l.substring(284, 285))
                assertEquals("EUR", l.substring(368, 371))
                for (row in invoice.rows) {
                    val r = out[i++]
                    assertEquals("1", r.substring(11, 12))
                    assertEquals("+", r.substring(52, 53))
                    assertEquals("kk", r.substring(65, 67))
                    assertEquals("00", r.substring(81, 83))
                    assertEquals("3", out[i++].substring(11, 12))
                    assertEquals("3", out[i++].substring(11, 12))
                }
            }
        }
    }

    // Numero- ja päivämääräkenttien muotoilu on
    // määritelmän
    // mukainen. Luku rajataan niin, että `n * 10^desimaalit` mahtuu Int-tyyppiin, koska
    // generaattori
    // säilyttää lähtötilanteen Int-aritmetiikan (laskusummat ovat sentteinä alle 21 M€).
    @Test
    fun `number and date formatting`() {
        val random = Random(2)
        repeat(iterations) {
            val decimals = random.nextInt(0, 5)
            val width = random.nextInt(decimals + 2, 13)
            val multiplier = Math.pow(10.0, decimals.toDouble()).toLong()
            val fitsField = Math.pow(10.0, (width - decimals).toDouble()).toLong() - 1
            val fitsInt = Int.MAX_VALUE / multiplier
            val n = random.nextLong(0, minOf(fitsField, fitsInt) + 1).toInt()
            assertEquals(
                width,
                PetajavesiInvoiceFileGenerator.formatNumber(n, width, decimals).length,
            )
            val date = random.date()
            val formatted = PetajavesiInvoiceFileGenerator.formatDate(date.toString())
            assertEquals(date.toString().replace("-", ""), formatted)
            assertTrue(formatted!!.matches(Regex("\\d{8}")))
            assertNull(
                PetajavesiInvoiceFileGenerator.formatDate(
                    random.text(12).replace(Regex("\\d{4}-\\d{2}-\\d{2}"), "x")
                )
            )
            assertNull(PetajavesiInvoiceFileGenerator.formatDate("15.3.2026"))
            assertNull(PetajavesiInvoiceFileGenerator.formatDate(date.toString() + " "))
        }
    }

    // Tiedosto on häviöttä koodattavissa
    // CP1252-merkistöllä
    @Test
    fun `cp1252 round trip`() {
        val random = Random(3)
        repeat(iterations) {
            val invoices = (1..random.nextInt(1, 4)).map { random.invoice() }
            val bytes =
                PetajavesiInvoiceFileGenerator.generate(invoices, random.serviceNeedNames(invoices))
            val decoded = bytes.toString(cp1252)
            assertTrue(decoded.toByteArray(cp1252).contentEquals(bytes))
            assertTrue(decoded.none { it == '�' })
        }
    }

    // Kirjanpitotilin päättely on kaksihaarainen ja
    // täydellinen
    @Test
    fun `account inference`() {
        val random = Random(6)
        repeat(iterations) {
            val invoice = random.invoice(rows = random.nextInt(1, 6))
            val out = lines(PetajavesiInvoiceFileGenerator.generate(listOf(invoice), emptyMap()))
            invoice.rows.forEachIndexed { index, row ->
                val account = out[1 + index * 3].substring(204, 218)
                val expected =
                    if (row.unitName == "Kintauden päiväkoti") "32950552013021"
                    else "32950552023021"
                assertEquals(expected, account, "yksikkö '${row.unitName}'")
            }
        }
    }

    // Palveluntarpeen puuttuminen ei muuta tietuetta
    @Test
    fun `missing service need equals empty string`() {
        val random = Random(8)
        repeat(iterations) {
            val invoices =
                (1..random.nextInt(1, 4)).map { random.invoice(rows = random.nextInt(1, 4)) }
            val rowIds = invoices.flatMap { it.rows }.map { it.id }
            val missing = PetajavesiInvoiceFileGenerator.generate(invoices, emptyMap())
            val empty =
                PetajavesiInvoiceFileGenerator.generate(invoices, rowIds.associateWith { "" })
            assertTrue(missing.contentEquals(empty))
        }
    }
}
