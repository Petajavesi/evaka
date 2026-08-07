// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.shiftplanning

import evaka.core.PureJdbiTest
import evaka.core.pdfgen.PdfGenerator
import evaka.core.shared.auth.AuthenticatedUser
import evaka.core.shared.auth.UserRole
import evaka.core.shared.config.pdfTemplateEngine
import evaka.core.shared.dev.DevAssistanceFactor
import evaka.core.shared.dev.DevCareArea
import evaka.core.shared.dev.DevDaycare
import evaka.core.shared.dev.DevEmployee
import evaka.core.shared.dev.DevPerson
import evaka.core.shared.dev.DevPersonType
import evaka.core.shared.dev.DevPlacement
import evaka.core.shared.dev.DevReservation
import evaka.core.shared.dev.insert
import evaka.core.shared.domain.BadRequest
import evaka.core.shared.domain.FiniteDateRange
import evaka.core.shared.domain.Forbidden
import evaka.core.shared.domain.HelsinkiDateTime
import evaka.core.shared.domain.MockEvakaClock
import evaka.core.shared.domain.NotFound
import evaka.core.shared.security.AccessControl
import evaka.core.shared.template.EvakaTemplateProvider
import evaka.instance.espoo.EspooActionRuleMapping
import java.time.LocalDate
import java.time.LocalTime
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class ShiftPlanningIntegrationTest : PureJdbiTest(resetDbBeforeEach = true) {
    private val accessControl = AccessControl(EspooActionRuleMapping(), noopTracer)
    private val controller =
        ShiftPlanningController(
            accessControl,
            ShiftPlanningService(),
            ShiftPlanPdfService(PdfGenerator(EvakaTemplateProvider(), pdfTemplateEngine("espoo"))),
        )

    private val clock =
        MockEvakaClock(HelsinkiDateTime.of(LocalDate.of(2026, 7, 2), LocalTime.of(8, 0)))
    private val monday: LocalDate = LocalDate.of(2026, 7, 6)

    private val area = DevCareArea()
    private val unit = DevDaycare(areaId = area.id, name = "Suunnitteluyksikkö")
    private val otherUnit = DevDaycare(areaId = area.id, name = "Toinen yksikkö")
    private val planner = DevEmployee(firstName = "Paula", lastName = "Suunnittelija")
    private val staff = DevEmployee(firstName = "Simo", lastName = "Kasvattaja")
    private val childUnder3 =
        DevPerson(firstName = "Venla", lastName = "Testilä", dateOfBirth = monday.minusYears(2))
    private val childOver3 =
        DevPerson(firstName = "Onni", lastName = "Testilä", dateOfBirth = monday.minusYears(4))

    @BeforeEach
    fun setup() {
        db.transaction { tx ->
            tx.insert(area)
            tx.insert(unit)
            tx.insert(otherUnit)
            tx.insert(planner, unitRoles = mapOf(unit.id to UserRole.TYOVUOROSUUNNITTELIJA))
            tx.insert(staff, unitRoles = mapOf(unit.id to UserRole.STAFF))
            listOf(childUnder3, childOver3).forEach { child ->
                tx.insert(child, DevPersonType.CHILD)
                tx.insert(
                    DevPlacement(
                        childId = child.id,
                        unitId = unit.id,
                        startDate = monday.minusMonths(6),
                        endDate = monday.plusMonths(6),
                    )
                )
                tx.insert(
                    DevReservation(
                        childId = child.id,
                        date = monday,
                        startTime = LocalTime.of(8, 0),
                        endTime = LocalTime.of(16, 0),
                        createdBy = AuthenticatedUser.SystemInternalUser.evakaUserId,
                    )
                )
            }
            tx.insert(
                DevAssistanceFactor(
                    childId = childUnder3.id,
                    validDuring = FiniteDateRange(monday.minusMonths(1), monday.plusMonths(1)),
                    capacityFactor = 2.0,
                )
            )
        }
    }

    @Test
    fun `yksikkolistaus palauttaa vain yksikot joihin on tyovuorosuunnittelijan rooli`() {
        val units = controller.getUnits(dbInstance(), planner.user, clock)

        assertEquals(listOf(unit.id), units.map { it.id })
    }

    @Test
    fun `yksikkolistaus on tyhja ilman tyovuorosuunnittelijan roolia`() {
        val units = controller.getUnits(dbInstance(), staff.user, clock)

        assertEquals(emptyList(), units)
    }

    @Test
    fun `viikkodatan haku on kielletty ilman roolia`() {
        assertThrows<Forbidden> {
            controller.getWeek(dbInstance(), staff.user, clock, unit.id, monday)
        }
    }

    @Test
    fun `viikkodatan haku on kielletty toiseen yksikkoon`() {
        assertThrows<Forbidden> {
            controller.getWeek(dbInstance(), planner.user, clock, otherUnit.id, monday)
        }
    }

    @Test
    fun `viikon alun pitaa olla maanantai`() {
        assertThrows<BadRequest> {
            controller.getWeek(dbInstance(), planner.user, clock, unit.id, monday.plusDays(1))
        }
    }

    @Test
    fun `viikkodata sisaltaa lapset varauksineen ja henkilostotarpeen`() {
        val response = controller.getWeek(dbInstance(), planner.user, clock, unit.id, monday)

        assertEquals(2, response.children.size)
        assertNull(response.plan)
        assertEquals(2295, response.weeklyHourLimitMinutes)
        assertEquals(7, response.staffingDivisor)

        val venla = response.children.single { it.id == childUnder3.id }
        assertEquals(1, venla.reservations.size)
        assertEquals(1, venla.assistanceFactors.size)

        // maanantai: alle 3v tuen kertoimella (1.75 * 2.0 = 3.5) + yli 3v (1.0) = 4.5 -> 1
        // työntekijä
        val mondayNeed = response.staffingNeed.single { it.date == monday }
        val slot = mondayNeed.slots.single { it.startTime == LocalTime.of(10, 0) }
        assertEquals(2, slot.childCount)
        assertEquals(0, slot.weightedChildCount.compareTo(java.math.BigDecimal("4.5")))
        assertEquals(1, slot.requiredStaff)

        // tiistaina ei varauksia
        val tuesdayNeed = response.staffingNeed.single { it.date == monday.plusDays(1) }
        assertEquals(0, tuesdayNeed.slots.sumOf { it.childCount })

        assertEquals(listOf(staff.id, planner.id), response.employees.map { it.id })
    }

    @Test
    fun `tasoittumisjakso luodaan avatusta viikosta ja uudet jaksot ankkuroituvat siihen`() {
        // Ensimmäinen avaus luo jakson avatusta viikosta alkaen
        val first = controller.getWeek(dbInstance(), planner.user, clock, unit.id, monday)
        assertEquals(monday, first.balancingPeriod.startDate)
        assertEquals(monday.plusDays(20), first.balancingPeriod.endDate)
        assertEquals(3 * 2295, first.periodHourLimitMinutes)

        // Jakson sisään osuva viikko palauttaa saman jakson
        val second =
            controller.getWeek(dbInstance(), planner.user, clock, unit.id, monday.plusWeeks(2))
        assertEquals(monday, second.balancingPeriod.startDate)

        // Jakson jälkeinen viikko aloittaa seuraavan, edelliseen ankkuroituvan jakson
        val next =
            controller.getWeek(dbInstance(), planner.user, clock, unit.id, monday.plusWeeks(4))
        assertEquals(monday.plusWeeks(3), next.balancingPeriod.startDate)

        // Aiempi viikko saa taaksepäin lasketun jakson samasta rytmistä
        val previous =
            controller.getWeek(dbInstance(), planner.user, clock, unit.id, monday.minusWeeks(1))
        assertEquals(monday.minusWeeks(3), previous.balancingPeriod.startDate)
        assertEquals(monday.minusDays(1), previous.balancingPeriod.endDate)
    }

    @Test
    fun `jaksokertymat summaavat suunnitelmat ja leimaukset jakson viikoilta`() {
        // Suunnitelmat jakson kahdelle eri viikolle: 8 h ma + 7 h ma+1vk
        controller.updatePlan(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            monday,
            ShiftPlanUpdateRequest(
                listOf(ShiftInput(staff.id, monday, LocalTime.of(8, 0), LocalTime.of(16, 0)))
            ),
        )
        controller.updatePlan(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            monday.plusWeeks(1),
            ShiftPlanUpdateRequest(
                listOf(
                    ShiftInput(
                        staff.id,
                        monday.plusWeeks(1),
                        LocalTime.of(8, 0),
                        LocalTime.of(15, 0),
                    )
                )
            ),
        )
        // Leimaus jakson sisällä (7 h 39 min) ja avoin leimaus, joka ohitetaan.
        // Ryhmällinen yksikkö laukaisee käyttöastelaskennan, joka vaatii
        // palveluntarpeen oletuskertoimet.
        db.transaction { tx ->
            tx.insert(evaka.core.snDefaultDaycare)
            val group = evaka.core.shared.dev.DevDaycareGroup(daycareId = unit.id)
            tx.insert(group)
            tx.insert(
                evaka.core.shared.dev.DevStaffAttendance(
                    employeeId = staff.id,
                    groupId = group.id,
                    arrived = HelsinkiDateTime.of(monday, LocalTime.of(7, 21)),
                    departed = HelsinkiDateTime.of(monday, LocalTime.of(15, 0)),
                    occupancyCoefficient = java.math.BigDecimal("7.00"),
                    modifiedAt = HelsinkiDateTime.of(monday, LocalTime.of(15, 0)),
                    modifiedBy = planner.evakaUserId,
                )
            )
            tx.insert(
                evaka.core.shared.dev.DevStaffAttendance(
                    employeeId = staff.id,
                    groupId = group.id,
                    arrived = HelsinkiDateTime.of(monday.plusDays(1), LocalTime.of(8, 0)),
                    departed = null,
                    occupancyCoefficient = java.math.BigDecimal("7.00"),
                    modifiedAt = HelsinkiDateTime.of(monday.plusDays(1), LocalTime.of(8, 0)),
                    modifiedBy = planner.evakaUserId,
                )
            )
        }

        val response = controller.getWeek(dbInstance(), planner.user, clock, unit.id, monday)
        val minutes = response.periodMinutes.single { it.employeeId == staff.id }
        assertEquals(480 + 420, minutes.plannedMinutes)
        assertEquals(459, minutes.actualMinutes)
    }

    @Test
    fun `suunnitelman tallennus ja uudelleenlataus`() {
        val shifts =
            listOf(
                ShiftInput(staff.id, monday, LocalTime.of(7, 30), LocalTime.of(15, 0)),
                ShiftInput(planner.id, monday, LocalTime.of(9, 0), LocalTime.of(16, 30)),
            )
        controller.updatePlan(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            monday,
            ShiftPlanUpdateRequest(shifts),
        )

        val response = controller.getWeek(dbInstance(), planner.user, clock, unit.id, monday)
        val plan = assertNotNull(response.plan)
        assertEquals(2, plan.shifts.size)
        assertEquals(
            shifts.map { Triple(it.employeeId, it.startTime, it.endTime) },
            plan.shifts.map { Triple(it.employeeId, it.startTime, it.endTime) },
        )

        // uusi tallennus korvaa vuorot
        controller.updatePlan(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            monday,
            ShiftPlanUpdateRequest(
                listOf(ShiftInput(staff.id, monday, LocalTime.of(8, 0), LocalTime.of(16, 0)))
            ),
        )
        val updated = controller.getWeek(dbInstance(), planner.user, clock, unit.id, monday)
        assertEquals(1, assertNotNull(updated.plan).shifts.size)
    }

    @Test
    fun `tallennus on kielletty ilman roolia`() {
        assertThrows<Forbidden> {
            controller.updatePlan(
                dbInstance(),
                staff.user,
                clock,
                unit.id,
                monday,
                ShiftPlanUpdateRequest(emptyList()),
            )
        }
    }

    @Test
    fun `tyovuoron kaanteinen aikajarjestys estetaan`() {
        assertThrows<BadRequest> {
            controller.updatePlan(
                dbInstance(),
                planner.user,
                clock,
                unit.id,
                monday,
                ShiftPlanUpdateRequest(
                    listOf(ShiftInput(staff.id, monday, LocalTime.of(16, 0), LocalTime.of(8, 0)))
                ),
            )
        }
        assertThrows<BadRequest> {
            controller.updatePlan(
                dbInstance(),
                planner.user,
                clock,
                unit.id,
                monday,
                ShiftPlanUpdateRequest(
                    listOf(ShiftInput(staff.id, monday, LocalTime.of(8, 0), LocalTime.of(8, 0)))
                ),
            )
        }
    }

    @Test
    fun `pdf muodostuu tallennetusta suunnitelmasta`() {
        controller.updatePlan(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            monday,
            ShiftPlanUpdateRequest(
                listOf(ShiftInput(staff.id, monday, LocalTime.of(7, 30), LocalTime.of(15, 0)))
            ),
        )

        val response = controller.getPdf(dbInstance(), planner.user, clock, unit.id, monday)

        val pdf = assertNotNull(response.body)
        assertEquals("%PDF", pdf.copyOfRange(0, 4).decodeToString())
    }

    @Test
    fun `tyontekijakohtainen pdf muodostuu yhdelle ja kaikille tyontekijoille`() {
        controller.updatePlan(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            monday,
            ShiftPlanUpdateRequest(
                listOf(ShiftInput(staff.id, monday, LocalTime.of(7, 30), LocalTime.of(15, 0)))
            ),
        )

        val allResponse =
            controller.getEmployeesPdf(dbInstance(), planner.user, clock, unit.id, monday)
        val allPdf = assertNotNull(allResponse.body)
        assertEquals("%PDF", allPdf.copyOfRange(0, 4).decodeToString())

        val singleResponse =
            controller.getEmployeePdf(dbInstance(), planner.user, clock, unit.id, monday, staff.id)
        val singlePdf = assertNotNull(singleResponse.body)
        assertEquals("%PDF", singlePdf.copyOfRange(0, 4).decodeToString())
    }

    @Test
    fun `tyontekijakohtainen pdf palauttaa virheen jos tyontekijalla ei ole vuoroja`() {
        controller.updatePlan(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            monday,
            ShiftPlanUpdateRequest(
                listOf(ShiftInput(staff.id, monday, LocalTime.of(7, 30), LocalTime.of(15, 0)))
            ),
        )

        assertThrows<NotFound> {
            controller.getEmployeePdf(
                dbInstance(),
                planner.user,
                clock,
                unit.id,
                monday,
                planner.id,
            )
        }
    }

    @Test
    fun `pdf palauttaa virheen jos suunnitelmaa ei ole tallennettu`() {
        assertThrows<NotFound> {
            controller.getPdf(dbInstance(), planner.user, clock, unit.id, monday)
        }
    }

    @Test
    fun `pdf-lataus on kielletty ilman roolia`() {
        assertThrows<Forbidden> {
            controller.getPdf(dbInstance(), staff.user, clock, unit.id, monday)
        }
    }

    @Test
    fun `tyovuoron paivamaaran pitaa olla suunnitteluviikolla`() {
        assertThrows<BadRequest> {
            controller.updatePlan(
                dbInstance(),
                planner.user,
                clock,
                unit.id,
                monday,
                ShiftPlanUpdateRequest(
                    listOf(
                        ShiftInput(
                            staff.id,
                            monday.plusDays(7),
                            LocalTime.of(8, 0),
                            LocalTime.of(16, 0),
                        )
                    )
                ),
            )
        }
    }
}
