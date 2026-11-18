// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice

import evaka.core.insertServiceNeedOptions
import evaka.core.invoicing.domain.FeeDecisionStatus
import evaka.core.placement.PlacementType
import evaka.core.serviceNeedTestFixtures
import evaka.core.shared.FeeDecisionId
import evaka.core.shared.InvoiceRowId
import evaka.core.shared.ServiceNeedOptionId
import evaka.core.shared.db.Database
import evaka.core.shared.dev.DevCareArea
import evaka.core.shared.dev.DevDaycare
import evaka.core.shared.dev.DevFeeDecision
import evaka.core.shared.dev.DevFeeDecisionChild
import evaka.core.shared.dev.DevInvoice
import evaka.core.shared.dev.DevInvoiceRow
import evaka.core.shared.dev.DevPerson
import evaka.core.shared.dev.DevPersonType
import evaka.core.shared.dev.insert
import evaka.core.shared.dev.resetDatabase
import evaka.core.shared.domain.FiniteDateRange
import evaka.core.shared.noopTracer
import evaka.core.snDefaultDaycare
import evaka.instance.petajavesi.AbstractPetajavesiIntegrationTest
import java.time.LocalDate
import kotlin.test.assertEquals
import org.jdbi.v3.core.Jdbi
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

/**
 * Laskurivin palveluntarpeen nimen haku: nimi tulee lähetetystä maksupäätöksestä, jonka voimassaolo
 * leikkaa laskurivin jaksoa, ja useasta osumasta valitaan myöhemmin alkanut.
 */
class ServiceNeedQueriesIntegrationTest : AbstractPetajavesiIntegrationTest() {
    @Autowired private lateinit var jdbi: Jdbi

    private lateinit var db: Database.Connection
    private val area = DevCareArea()
    private val daycare = DevDaycare(areaId = area.id)
    private val adult = DevPerson()
    private val child = DevPerson(dateOfBirth = LocalDate.of(2022, 5, 5))
    private val february = FiniteDateRange(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28))
    private val otherDaycareOption = serviceNeedTestFixtures.first {
        it.id != snDefaultDaycare.id && it.validPlacementType == PlacementType.DAYCARE
    }

    @BeforeEach
    fun beforeEach() {
        db = Database(jdbi, noopTracer()).connectWithManualLifecycle()
        db.transaction { tx ->
            tx.resetDatabase()
            tx.insert(area)
            tx.insert(daycare)
            tx.insert(adult, DevPersonType.ADULT)
            tx.insert(child, DevPersonType.CHILD)
            tx.insertServiceNeedOptions()
        }
    }

    @AfterEach
    fun afterEach() {
        db.close()
    }

    private fun Database.Transaction.feeDecision(
        validDuring: FiniteDateRange,
        status: FeeDecisionStatus = FeeDecisionStatus.SENT,
        optionId: ServiceNeedOptionId? = snDefaultDaycare.id,
    ): FeeDecisionId {
        val decision =
            DevFeeDecision(status = status, validDuring = validDuring, headOfFamilyId = adult.id)
        insert(decision)
        insert(
            DevFeeDecisionChild(
                feeDecisionId = decision.id,
                childId = child.id,
                placementUnitId = daycare.id,
                serviceNeedOptionId = optionId,
            )
        )
        return decision.id
    }

    private fun Database.Transaction.invoiceRow(period: FiniteDateRange = february): InvoiceRowId {
        val row =
            DevInvoiceRow(
                childId = child.id,
                unitId = daycare.id,
                periodStart = period.start,
                periodEnd = period.end,
            )
        insert(
            DevInvoice(
                headOfFamilyId = adult.id,
                areaId = area.id,
                periodStart = period.start,
                periodEnd = period.end,
                rows = listOf(row),
            )
        )
        return row.id
    }

    @Test
    fun `sent decision overlapping the row period gives the option name`() {
        val rowId = db.transaction { tx ->
            tx.feeDecision(FiniteDateRange(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30)))
            tx.invoiceRow()
        }
        assertEquals(
            mapOf(rowId to snDefaultDaycare.nameFi),
            db.read { it.getServiceNeedNamesByInvoiceRow(setOf(rowId)) },
        )
    }

    @Test
    fun `draft, non-overlapping and option-less decisions give nothing`() {
        val rowId = db.transaction { tx ->
            tx.feeDecision(february, status = FeeDecisionStatus.DRAFT)
            tx.feeDecision(FiniteDateRange(LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31)))
            tx.feeDecision(february, optionId = null)
            tx.invoiceRow()
        }
        assertEquals(emptyMap(), db.read { it.getServiceNeedNamesByInvoiceRow(setOf(rowId)) })
        assertEquals(emptyMap(), db.read { it.getServiceNeedNamesByInvoiceRow(emptySet()) })
    }

    @Test
    fun `the decision that started last wins and only requested rows are returned`() {
        val (rowId, otherRowId) =
            db.transaction { tx ->
                tx.feeDecision(FiniteDateRange(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 14)))
                tx.feeDecision(
                    FiniteDateRange(LocalDate.of(2026, 2, 15), LocalDate.of(2026, 3, 31)),
                    optionId = otherDaycareOption.id,
                )
                tx.invoiceRow() to tx.invoiceRow()
            }
        assertEquals(
            mapOf(rowId to otherDaycareOption.nameFi),
            db.read { it.getServiceNeedNamesByInvoiceRow(setOf(rowId)) },
        )
        assertEquals(
            setOf(rowId, otherRowId),
            db.read { it.getServiceNeedNamesByInvoiceRow(setOf(rowId, otherRowId)) }.keys,
        )
    }
}
