// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.shiftplanning

import evaka.core.Audit
import evaka.core.AuditId
import evaka.core.shared.DaycareId
import evaka.core.shared.auth.AuthenticatedUser
import evaka.core.shared.db.Database
import evaka.core.shared.domain.BadRequest
import evaka.core.shared.domain.EvakaClock
import evaka.core.shared.domain.FiniteDateRange
import evaka.core.shared.EmployeeId
import evaka.core.shared.ShiftWishId
import evaka.core.shared.domain.NotFound
import evaka.core.shared.security.AccessControl
import evaka.core.shared.security.Action
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class ShiftPlanUpdateRequest(val shifts: List<ShiftInput>)

/**
 * Toiveen käsittely: APPROVED lisää vuoron viikon suunnitelmaan; kellonaikoja voi
 * muuttaa hyväksynnän yhteydessä (startTime/endTime, oletuksena toiveen ajat)
 */
data class ShiftWishResolveRequest(
    val status: ShiftWishStatus,
    val startTime: LocalTime?,
    val endTime: LocalTime?,
)

@RestController
@RequestMapping("/employee/shift-planning")
class ShiftPlanningController(
    private val accessControl: AccessControl,
    private val shiftPlanningService: ShiftPlanningService,
    private val shiftPlanPdfService: ShiftPlanPdfService,
) {
    @GetMapping("/units")
    fun getUnits(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
    ): List<ShiftPlanUnit> {
        return db.connect { dbc ->
                dbc.read { tx ->
                    val filter =
                        accessControl.requireAuthorizationFilter(
                            tx,
                            user,
                            clock,
                            Action.Unit.READ_SHIFT_PLAN,
                        )
                    tx.getShiftPlanningUnits(filter)
                }
            }
            .also { Audit.ShiftPlanUnitsRead.log(meta = mapOf("count" to it.size)) }
    }

    @GetMapping("/units/{unitId}/weeks/{weekStart}")
    fun getWeek(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        @PathVariable unitId: DaycareId,
        @PathVariable weekStart: LocalDate,
    ): ShiftPlanWeekResponse {
        validateWeekStart(weekStart)
        return db.connect { dbc ->
                // Transaktio, koska viikon sisältävä tasoittumisjakso luodaan
                // tarvittaessa ensimmäisellä avauksella
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Unit.READ_SHIFT_PLAN,
                        unitId,
                    )
                    shiftPlanningService.getWeekData(tx, clock.today(), unitId, weekStart)
                }
            }
            .also {
                Audit.ShiftPlanRead.log(
                    targetId = AuditId(unitId),
                    meta = mapOf("weekStart" to weekStart),
                )
            }
    }

    @PutMapping("/units/{unitId}/weeks/{weekStart}")
    fun updatePlan(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        @PathVariable unitId: DaycareId,
        @PathVariable weekStart: LocalDate,
        @RequestBody body: ShiftPlanUpdateRequest,
    ) {
        validateWeekStart(weekStart)
        val week = FiniteDateRange(weekStart, weekStart.plusDays(6))
        body.shifts.forEach { shift ->
            if (shift.endTime <= shift.startTime) {
                throw BadRequest(
                    "Shift end time must be after start time",
                    errorCode = "SHIFT_TIME_ORDER",
                )
            }
            if (!week.includes(shift.date)) {
                throw BadRequest("Shift date must be within the plan week")
            }
        }
        db.connect { dbc ->
            dbc.transaction { tx ->
                accessControl.requirePermissionFor(
                    tx,
                    user,
                    clock,
                    Action.Unit.UPDATE_SHIFT_PLAN,
                    unitId,
                )
                val planId = tx.upsertShiftPlan(unitId, weekStart)
                tx.replaceShiftPlanShifts(planId, body.shifts)
            }
        }
        Audit.ShiftPlanUpdate.log(
            targetId = AuditId(unitId),
            meta = mapOf("weekStart" to weekStart, "shiftCount" to body.shifts.size),
        )
    }

    @PutMapping("/units/{unitId}/wishes/{wishId}")
    fun resolveWish(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        @PathVariable unitId: DaycareId,
        @PathVariable wishId: ShiftWishId,
        @RequestBody body: ShiftWishResolveRequest,
    ) {
        if (body.status == ShiftWishStatus.PENDING) {
            throw BadRequest("Wish must be resolved to APPROVED or REJECTED")
        }
        db.connect { dbc ->
            dbc.transaction { tx ->
                accessControl.requirePermissionFor(
                    tx,
                    user,
                    clock,
                    Action.Unit.UPDATE_SHIFT_WISH,
                    unitId,
                )
                val wish = tx.getShiftWishRow(wishId) ?: throw NotFound("Wish not found")
                if (wish.unitId != unitId) throw NotFound("Wish not found")
                if (wish.status != ShiftWishStatus.PENDING) {
                    throw BadRequest("Wish is already resolved", errorCode = "WISH_RESOLVED")
                }
                val startTime = body.startTime ?: wish.startTime
                val endTime = body.endTime ?: wish.endTime
                if (endTime <= startTime) {
                    throw BadRequest(
                        "Shift end time must be after start time",
                        errorCode = "SHIFT_TIME_ORDER",
                    )
                }
                if (body.status == ShiftWishStatus.APPROVED) {
                    val weekStart = wish.date.minusDays(wish.date.dayOfWeek.value - 1L)
                    val planId = tx.upsertShiftPlan(unitId, weekStart)
                    tx.insertShiftPlanShift(
                        planId,
                        ShiftInput(
                            employeeId = wish.employeeId,
                            date = wish.date,
                            startTime = startTime,
                            endTime = endTime,
                        ),
                    )
                }
                tx.resolveShiftWish(
                    id = wishId,
                    status = body.status,
                    resolvedBy = user.id,
                    resolvedAt = clock.now(),
                    resolvedStartTime =
                        if (body.status == ShiftWishStatus.APPROVED) startTime else null,
                    resolvedEndTime =
                        if (body.status == ShiftWishStatus.APPROVED) endTime else null,
                )
            }
        }
        Audit.ShiftWishResolve.log(
            targetId = AuditId(wishId),
            meta = mapOf("status" to body.status),
        )
    }

    @GetMapping(
        "/units/{unitId}/weeks/{weekStart}/pdf",
        produces = [MediaType.APPLICATION_PDF_VALUE],
    )
    fun getPdf(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        @PathVariable unitId: DaycareId,
        @PathVariable weekStart: LocalDate,
    ): ResponseEntity<ByteArray> {
        validateWeekStart(weekStart)
        return db.connect { dbc ->
                dbc.read { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Unit.DOWNLOAD_SHIFT_PLAN_PDF,
                        unitId,
                    )
                    shiftPlanPdfService.renderShiftPlanPdf(tx, unitId, weekStart)
                }
            }
            .let { pdf ->
                ResponseEntity.ok()
                    .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                            .filename("tyovuorosuunnitelma-$weekStart.pdf")
                            .build()
                            .toString(),
                    )
                    .body(pdf)
            }
            .also {
                Audit.ShiftPlanPdfDownload.log(
                    targetId = AuditId(unitId),
                    meta = mapOf("weekStart" to weekStart),
                )
            }
    }

    /** Kaikkien työntekijöiden työvuorolistat, yksi työntekijä per sivu */
    @GetMapping(
        "/units/{unitId}/weeks/{weekStart}/pdf/employees",
        produces = [MediaType.APPLICATION_PDF_VALUE],
    )
    fun getEmployeesPdf(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        @PathVariable unitId: DaycareId,
        @PathVariable weekStart: LocalDate,
    ): ResponseEntity<ByteArray> =
        employeePdfResponse(db, user, clock, unitId, weekStart, employeeId = null)

    /** Yksittäisen työntekijän työvuorolista hänelle itselleen jaettavaksi */
    @GetMapping(
        "/units/{unitId}/weeks/{weekStart}/pdf/employees/{employeeId}",
        produces = [MediaType.APPLICATION_PDF_VALUE],
    )
    fun getEmployeePdf(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        @PathVariable unitId: DaycareId,
        @PathVariable weekStart: LocalDate,
        @PathVariable employeeId: EmployeeId,
    ): ResponseEntity<ByteArray> = employeePdfResponse(db, user, clock, unitId, weekStart, employeeId)

    private fun employeePdfResponse(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        unitId: DaycareId,
        weekStart: LocalDate,
        employeeId: EmployeeId?,
    ): ResponseEntity<ByteArray> {
        validateWeekStart(weekStart)
        return db.connect { dbc ->
                dbc.read { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Unit.DOWNLOAD_SHIFT_PLAN_PDF,
                        unitId,
                    )
                    shiftPlanPdfService.renderEmployeeShiftPlanPdf(tx, unitId, weekStart, employeeId)
                }
            }
            .let { pdf ->
                val filename =
                    if (employeeId != null) "tyovuorot-tyontekija-$weekStart.pdf"
                    else "tyovuorot-tyontekijoittain-$weekStart.pdf"
                ResponseEntity.ok()
                    .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString(),
                    )
                    .body(pdf)
            }
            .also {
                Audit.ShiftPlanPdfDownload.log(
                    targetId = AuditId(unitId),
                    meta =
                        mapOf(
                            "weekStart" to weekStart,
                            "perEmployee" to true,
                            "employeeId" to employeeId,
                        ),
                )
            }
    }

    private fun validateWeekStart(weekStart: LocalDate) {
        if (weekStart.dayOfWeek != DayOfWeek.MONDAY) {
            throw BadRequest("weekStart must be a Monday")
        }
    }
}
