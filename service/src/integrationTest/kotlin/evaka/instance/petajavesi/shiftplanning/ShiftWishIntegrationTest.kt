// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.shiftplanning

import evaka.core.PureJdbiTest
import evaka.core.pdfgen.PdfGenerator
import evaka.core.shared.auth.UserRole
import evaka.core.shared.config.pdfTemplateEngine
import evaka.core.shared.dev.DevCareArea
import evaka.core.shared.dev.DevDaycare
import evaka.core.shared.dev.DevEmployee
import evaka.core.shared.dev.insert
import evaka.core.shared.domain.BadRequest
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
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class ShiftWishIntegrationTest : PureJdbiTest(resetDbBeforeEach = true) {
    private val accessControl = AccessControl(EspooActionRuleMapping(), noopTracer)
    private val wishController = ShiftWishController(accessControl)
    private val planningController =
        ShiftPlanningController(
            accessControl,
            ShiftPlanningService(),
            ShiftPlanPdfService(PdfGenerator(EvakaTemplateProvider(), pdfTemplateEngine("espoo"))),
        )

    // Torstai 2.7.2026 → toiveikkuna ma 6.7.–su 26.7.
    private val clock =
        MockEvakaClock(HelsinkiDateTime.of(LocalDate.of(2026, 7, 2), LocalTime.of(8, 0)))
    private val monday: LocalDate = LocalDate.of(2026, 7, 6)

    private val area = DevCareArea()
    private val unit = DevDaycare(areaId = area.id, name = "Toiveyksikkö")
    private val otherUnit = DevDaycare(areaId = area.id, name = "Toinen yksikkö")
    private val planner = DevEmployee(firstName = "Paula", lastName = "Suunnittelija")
    private val staff = DevEmployee(firstName = "Simo", lastName = "Kasvattaja")
    private val otherStaff = DevEmployee(firstName = "Sanna", lastName = "Kasvattaja")

    @BeforeEach
    fun setup() {
        db.transaction { tx ->
            tx.insert(area)
            tx.insert(unit)
            tx.insert(otherUnit)
            tx.insert(planner, unitRoles = mapOf(unit.id to UserRole.TYOVUOROSUUNNITTELIJA))
            tx.insert(staff, unitRoles = mapOf(unit.id to UserRole.STAFF))
            tx.insert(otherStaff, unitRoles = mapOf(unit.id to UserRole.STAFF))
        }
    }

    private fun createWish(
        user: evaka.core.shared.auth.AuthenticatedUser.Employee = staff.user,
        date: LocalDate = monday,
        startTime: LocalTime = LocalTime.of(8, 0),
        endTime: LocalTime = LocalTime.of(16, 0),
        important: Boolean = false,
    ) =
        wishController.createWish(
            dbInstance(),
            user,
            clock,
            ShiftWishCreateRequest(
                unitId = unit.id,
                date = date,
                startTime = startTime,
                endTime = endTime,
                important = important,
            ),
        )

    @Test
    fun `tarkeita toiveita mahtuu ikkunaan enintaan kaksi ja hylkays vapauttaa kiintion`() {
        createWish(date = monday, important = true)
        val second = createWish(date = monday.plusDays(1), important = true)
        assertThrows<BadRequest> { createWish(date = monday.plusDays(2), important = true) }
        // Normaali toive onnistuu, vaikka tärkeiden kiintiö on täynnä
        createWish(date = monday.plusDays(2))
        // Toisen työntekijän kiintiö on oma
        createWish(user = otherStaff.user, date = monday, important = true)

        planningController.resolveWish(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            second,
            ShiftWishResolveRequest(ShiftWishStatus.REJECTED, null, null),
        )
        val newImportant = createWish(date = monday.plusDays(3), important = true)
        val wishes = wishController.getOwnWishes(dbInstance(), staff.user, clock).wishes
        assertEquals(true, wishes.single { it.id == newImportant }.important)
    }

    @Test
    fun `tyontekija voi luoda ja poistaa oman toiveen ikkunan sisalla`() {
        val wishId = createWish()

        val response = wishController.getOwnWishes(dbInstance(), staff.user, clock)
        assertEquals(monday, response.window.start)
        assertEquals(monday.plusDays(20), response.window.end)
        assertEquals(listOf(wishId), response.wishes.map { it.id })
        assertEquals(ShiftWishStatus.PENDING, response.wishes.single().status)

        wishController.deleteWish(dbInstance(), staff.user, clock, wishId)
        assertEquals(
            emptyList(),
            wishController.getOwnWishes(dbInstance(), staff.user, clock).wishes,
        )
    }

    @Test
    fun `tyontekija nakee omat vahvistetut vuoronsa kuluvalta viikolta ja toiveikkunasta`() {
        val currentMonday = LocalDate.of(2026, 6, 29)
        // Suunnittelijan suoraan tallentama vuoro kuluvalle viikolle
        planningController.updatePlan(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            currentMonday,
            ShiftPlanUpdateRequest(
                listOf(
                    ShiftInput(
                        staff.id,
                        currentMonday.plusDays(3),
                        LocalTime.of(7, 0),
                        LocalTime.of(14, 0),
                    ),
                    ShiftInput(
                        otherStaff.id,
                        currentMonday.plusDays(3),
                        LocalTime.of(9, 0),
                        LocalTime.of(16, 0),
                    ),
                )
            ),
        )
        // Hyväksytty toive toiveikkunassa
        val wishId = createWish()
        planningController.resolveWish(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            wishId,
            ShiftWishResolveRequest(ShiftWishStatus.APPROVED, null, null),
        )

        val response = wishController.getOwnWishes(dbInstance(), staff.user, clock)
        assertEquals(currentMonday, response.shiftsRange.start)
        assertEquals(monday.plusDays(20), response.shiftsRange.end)
        // Vain omat vuorot, aikajärjestyksessä
        assertEquals(2, response.shifts.size)
        assertEquals(currentMonday.plusDays(3), response.shifts[0].date)
        assertEquals(LocalTime.of(7, 0), response.shifts[0].startTime)
        assertEquals(monday, response.shifts[1].date)
        assertEquals(unit.name, response.shifts[1].unitName)
    }

    @Test
    fun `toive ikkunan ulkopuolelle on kielletty`() {
        assertThrows<BadRequest> { createWish(date = monday.minusDays(1)) }
        assertThrows<BadRequest> { createWish(date = monday.plusDays(21)) }
    }

    @Test
    fun `sama toive kahdesti on kielletty`() {
        createWish()
        assertThrows<BadRequest> { createWish() }
    }

    @Test
    fun `toive yksikkoon ilman henkilokunnan roolia on kielletty`() {
        assertThrows<Forbidden> {
            wishController.createWish(
                dbInstance(),
                staff.user,
                clock,
                ShiftWishCreateRequest(
                    unitId = otherUnit.id,
                    date = monday,
                    startTime = LocalTime.of(8, 0),
                    endTime = LocalTime.of(16, 0),
                    important = false,
                ),
            )
        }
    }

    @Test
    fun `toisen tyontekijan toivetta ei voi poistaa`() {
        val wishId = createWish()
        assertThrows<NotFound> {
            wishController.deleteWish(dbInstance(), otherStaff.user, clock, wishId)
        }
    }

    @Test
    fun `suunnittelija nakee viikon toiveet viikkodatassa`() {
        createWish()
        createWish(user = otherStaff.user)

        val week = planningController.getWeek(dbInstance(), planner.user, clock, unit.id, monday)
        assertEquals(2, week.wishes.size)
        assertEquals(setOf(staff.id, otherStaff.id), week.wishes.map { it.employeeId }.toSet())
    }

    @Test
    fun `hyvaksynta lisaa vuoron suunnitelmaan muutetuin ajoin`() {
        val wishId = createWish()

        planningController.resolveWish(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            wishId,
            ShiftWishResolveRequest(
                status = ShiftWishStatus.APPROVED,
                startTime = null,
                endTime = LocalTime.of(15, 0),
            ),
        )

        val week = planningController.getWeek(dbInstance(), planner.user, clock, unit.id, monday)
        val shift = week.plan!!.shifts.single()
        assertEquals(staff.id, shift.employeeId)
        assertEquals(monday, shift.date)
        assertEquals(LocalTime.of(8, 0), shift.startTime)
        assertEquals(LocalTime.of(15, 0), shift.endTime)

        val wish = week.wishes.single()
        assertEquals(ShiftWishStatus.APPROVED, wish.status)
        assertEquals(LocalTime.of(8, 0), wish.resolvedStartTime)
        assertEquals(LocalTime.of(15, 0), wish.resolvedEndTime)

        // Käsiteltyä toivetta ei voi käsitellä uudelleen eikä poistaa
        assertThrows<BadRequest> {
            planningController.resolveWish(
                dbInstance(),
                planner.user,
                clock,
                unit.id,
                wishId,
                ShiftWishResolveRequest(ShiftWishStatus.REJECTED, null, null),
            )
        }
        assertThrows<NotFound> {
            wishController.deleteWish(dbInstance(), staff.user, clock, wishId)
        }
    }

    @Test
    fun `hylkays ei lisaa vuoroa suunnitelmaan`() {
        val wishId = createWish()

        planningController.resolveWish(
            dbInstance(),
            planner.user,
            clock,
            unit.id,
            wishId,
            ShiftWishResolveRequest(ShiftWishStatus.REJECTED, null, null),
        )

        val week = planningController.getWeek(dbInstance(), planner.user, clock, unit.id, monday)
        assertEquals(null, week.plan)
        assertEquals(ShiftWishStatus.REJECTED, week.wishes.single().status)
    }

    @Test
    fun `tyontekija ei voi kasitella toiveita`() {
        val wishId = createWish()
        assertThrows<Forbidden> {
            planningController.resolveWish(
                dbInstance(),
                staff.user,
                clock,
                unit.id,
                wishId,
                ShiftWishResolveRequest(ShiftWishStatus.APPROVED, null, null),
            )
        }
    }
}
