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
import java.time.LocalDate
import java.util.UUID

/**
 * Keksitty laskuaineisto laskutiedoston testeihin (vrt. Oulun ja Turun `TestInvoiceCreator`).
 * Henkilöt, hetut ja osoitteet ovat kuvitteellisia. Aineisto kattaa Kintauden päiväkodin oman
 * kirjanpitotilin, hyvitysrivin, negatiivisen määrän, puuttuvan palveluntarpeen, kenttien leveydet
 * ylittävät nimet sekä CP1252-merkistön reunan.
 */
object PetajavesiInvoiceFixtures {
    private fun id(n: Int): UUID = UUID.fromString("00000000-0000-0000-0001-%012d".format(n))

    private val serviceNeedByRow = linkedMapOf<InvoiceRowId, String?>()

    /** Laskurivin tunniste -> palveluntarpeen nimi niille riveille, joilla nimi on. */
    val serviceNeedNames: Map<InvoiceRowId, String>
        get() = serviceNeedByRow.filterValues { it != null }.mapValues { it.value!! }

    fun person(
        n: Int,
        firstName: String,
        lastName: String,
        ssn: String?,
        streetAddress: String = "Suutarintie 4",
        postalCode: String = "41900",
        postOffice: String = "Petäjävesi",
    ) =
        PersonDetailed(
            id = PersonId(id(n)),
            dateOfBirth = LocalDate.of(1985, 4, 12),
            dateOfDeath = null,
            firstName = firstName,
            lastName = lastName,
            ssn = ssn,
            streetAddress = streetAddress,
            postalCode = postalCode,
            postOffice = postOffice,
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

    private fun row(
        n: Int,
        child: PersonDetailed,
        product: PetajavesiInvoiceProducts.Product,
        amount: Int,
        unitPrice: Int,
        unitName: String,
        serviceNeed: String?,
        periodStart: LocalDate = LocalDate.of(2026, 2, 1),
        periodEnd: LocalDate = LocalDate.of(2026, 2, 28),
    ): InvoiceRowDetailed {
        serviceNeedByRow[InvoiceRowId(id(n))] = serviceNeed
        return InvoiceRowDetailed(
            id = InvoiceRowId(id(n)),
            child = child,
            amount = amount,
            unitPrice = unitPrice,
            periodStart = periodStart,
            periodEnd = periodEnd,
            product = product.key,
            unitId = DaycareId(id(900 + n)),
            unitName = unitName,
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

    private fun invoice(n: Int, headOfFamily: PersonDetailed, rows: List<InvoiceRowDetailed>) =
        InvoiceDetailed(
            id = InvoiceId(id(n)),
            status = InvoiceStatus.DRAFT,
            periodStart = LocalDate.of(2026, 2, 1),
            periodEnd = LocalDate.of(2026, 2, 28),
            dueDate = LocalDate.of(2026, 3, 31),
            invoiceDate = LocalDate.of(2026, 3, 15),
            agreementType = null,
            areaId = AreaId(id(800)),
            headOfFamily = headOfFamily,
            codebtor = null,
            rows = rows,
            number = 5000000000L + n,
            sentBy = null,
            sentAt = null,
            relatedFeeDecisions = emptyList(),
            revisionNumber = 0,
            replacedInvoiceId = null,
            replacementReason = null,
            replacementNotes = null,
            attachments = emptyList(),
        )

    /**
     * Lasku useilla riveillä: Kintauden päiväkoti (oma kirjanpitotili), hyvitysrivi, negatiivinen
     * määrä, puuttuva palveluntarve.
     */
    val invoiceA: InvoiceDetailed =
        invoice(
            1,
            person(10, "Maija Annikki", "Mallikas", "120485-123A"),
            listOf(
                row(
                    11,
                    person(20, "Veeti", "Mallikas", null),
                    PetajavesiInvoiceProducts.Product.DAYCARE,
                    1,
                    29500,
                    "Kintauden päiväkoti",
                    "Kokopäiväinen vähintään 35 h",
                ),
                row(
                    12,
                    person(21, "Aada Sofia", "Mallikas", null),
                    PetajavesiInvoiceProducts.Product.PRESCHOOL_WITH_DAYCARE,
                    1,
                    17200,
                    "Pikku-Ponnen päiväkoti",
                    "Esiopetusta täydentävä varhaiskasvatus",
                ),
                row(
                    13,
                    person(20, "Veeti", "Mallikas", null),
                    PetajavesiInvoiceProducts.Product.SICK_LEAVE_50,
                    5,
                    -1475,
                    "Kintauden päiväkoti",
                    "Kokopäiväinen vähintään 35 h",
                    periodStart = LocalDate.of(2026, 2, 9),
                    periodEnd = LocalDate.of(2026, 2, 13),
                ),
                row(
                    14,
                    person(21, "Aada Sofia", "Mallikas", null),
                    PetajavesiInvoiceProducts.Product.ABSENCE,
                    -1,
                    17200,
                    "Pikku-Ponnen päiväkoti",
                    null,
                ),
            ),
        )

    /**
     * Lasku, jossa nimi, osoite ja yksikön nimi ylittävät kenttien leveydet (50, 30 ja 40 merkkiä)
     * ja merkistö on CP1252:n reunalla.
     */
    val invoiceB: InvoiceDetailed =
        invoice(
            2,
            person(
                30,
                "Anna-Kristiina Johanna Elisabet Ingeborg",
                "Hämäläinen-Åkerlund-Öhman",
                "010180-9876",
                streetAddress = "Pitkänpuoleisen kyläntien varsi 1234 B 56",
                postalCode = "41920",
                postOffice = "Kintaus",
            ),
            listOf(
                row(
                    31,
                    person(40, "Édouard Väinö", "Hämäläinen-Åkerlund-Öhman", null),
                    PetajavesiInvoiceProducts.Product.TEMPORARY_CARE,
                    2,
                    3000,
                    "Petäjäveden kirkonkylän vuorohoitopäiväkoti Aamurusko",
                    "Tilapäinen varhaiskasvatus, osapäiväinen",
                )
            ),
        )

    /** Lasku ilman päämiehen hetua: palautetaan käsin lähetettävänä, tiedostoa ei muodosteta. */
    val invoiceWithoutSsn: InvoiceDetailed =
        invoice(
            3,
            person(50, "Tuntematon", "Testaaja", null),
            listOf(
                row(
                    51,
                    person(60, "Lapsi", "Testaaja", null),
                    PetajavesiInvoiceProducts.Product.DAYCARE,
                    1,
                    29500,
                    "Pikku-Ponnen päiväkoti",
                    "Kokopäiväinen vähintään 35 h",
                )
            ),
        )

    /** Laskut, joista tiedosto muodostetaan. */
    val sendable: List<InvoiceDetailed> = listOf(invoiceA, invoiceB)

    val all: List<InvoiceDetailed> = listOf(invoiceA, invoiceB, invoiceWithoutSsn)
}
