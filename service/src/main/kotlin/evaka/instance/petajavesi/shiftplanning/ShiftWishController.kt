// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.shiftplanning

import evaka.core.Audit
import evaka.core.AuditId
import evaka.core.shared.DaycareId
import evaka.core.shared.ShiftWishId
import evaka.core.shared.auth.AuthenticatedUser
import evaka.core.shared.db.Database
import evaka.core.shared.domain.BadRequest
import evaka.core.shared.domain.EvakaClock
import evaka.core.shared.domain.FiniteDateRange
import evaka.core.shared.domain.NotFound
import evaka.core.shared.security.AccessControl
import evaka.core.shared.security.Action
import java.time.LocalDate
import java.time.LocalTime
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/** Toiveita voi tehdä seuraavalle kolmelle viikolle seuraavasta maanantaista alkaen */
fun shiftWishWindow(today: LocalDate): FiniteDateRange {
    val nextMonday = today.plusDays((8 - today.dayOfWeek.value).toLong())
    return FiniteDateRange(nextMonday, nextMonday.plusDays(BALANCING_PERIOD_WEEKS * 7L - 1))
}

/** Tärkeitä (tähdellä merkittyjä) toiveita mahtuu toiveikkunaan enintään kaksi */
const val MAX_IMPORTANT_WISHES = 2

data class ShiftWishCreateRequest(
    val unitId: DaycareId,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val important: Boolean,
)

/**
 * Työntekijän Työvuorot-sivun tiedot: toiveikkuna omine toiveineen sekä omat
 * vahvistetut työvuorot kuluvalta viikolta ja toiveikkunan ajalta (paperitonta
 * vuorojen tarkistusta varten)
 */
data class ShiftWishesResponse(
    val window: FiniteDateRange,
    val wishes: List<ShiftWish>,
    val shiftsRange: FiniteDateRange,
    val shifts: List<EmployeePlannedShift>,
)

@RestController
@RequestMapping("/employee/shift-wishes")
class ShiftWishController(private val accessControl: AccessControl) {
    @GetMapping("/units")
    fun getWishUnits(
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
                            Action.Unit.CREATE_SHIFT_WISH,
                        )
                    tx.getShiftPlanningUnits(filter)
                }
            }
            .also { Audit.ShiftWishUnitsRead.log(meta = mapOf("count" to it.size)) }
    }

    @GetMapping
    fun getOwnWishes(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
    ): ShiftWishesResponse {
        val window = shiftWishWindow(clock.today())
        val today = clock.today()
        val currentMonday = today.minusDays(today.dayOfWeek.value - 1L)
        val shiftsRange = FiniteDateRange(currentMonday, window.end)
        return db.connect { dbc ->
                dbc.read { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Global.SHIFT_WISH_PAGE,
                    )
                    ShiftWishesResponse(
                        window = window,
                        wishes = tx.getOwnShiftWishes(user.id, window),
                        shiftsRange = shiftsRange,
                        shifts = tx.getOwnPlannedShifts(user.id, shiftsRange),
                    )
                }
            }
            .also { Audit.ShiftWishesReadOwn.log(meta = mapOf("count" to it.wishes.size)) }
    }

    @PostMapping
    fun createWish(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        @RequestBody body: ShiftWishCreateRequest,
    ): ShiftWishId {
        if (body.endTime <= body.startTime) {
            throw BadRequest("Wish end time must be after start time", errorCode = "WISH_TIME_ORDER")
        }
        val window = shiftWishWindow(clock.today())
        if (!window.includes(body.date)) {
            throw BadRequest(
                "Wish date must be within the next three weeks",
                errorCode = "WISH_OUTSIDE_WINDOW",
            )
        }
        return db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Unit.CREATE_SHIFT_WISH,
                        body.unitId,
                    )
                    if (
                        body.important &&
                            tx.countImportantWishes(user.id, window) >= MAX_IMPORTANT_WISHES
                    ) {
                        throw BadRequest(
                            "Too many important wishes in window",
                            errorCode = "WISH_IMPORTANT_LIMIT",
                        )
                    }
                    tx.insertShiftWish(
                        employeeId = user.id,
                        unitId = body.unitId,
                        date = body.date,
                        startTime = body.startTime,
                        endTime = body.endTime,
                        important = body.important,
                    ) ?: throw BadRequest("Duplicate wish", errorCode = "WISH_DUPLICATE")
                }
            }
            .also {
                Audit.ShiftWishCreate.log(
                    targetId = AuditId(it),
                    meta = mapOf("unitId" to body.unitId, "date" to body.date),
                )
            }
    }

    @DeleteMapping("/{wishId}")
    fun deleteWish(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        @PathVariable wishId: ShiftWishId,
    ) {
        db.connect { dbc ->
            dbc.transaction { tx ->
                accessControl.requirePermissionFor(tx, user, clock, Action.Global.SHIFT_WISH_PAGE)
                if (!tx.deleteOwnPendingShiftWish(user.id, wishId)) {
                    throw NotFound("Pending wish not found")
                }
            }
        }
        Audit.ShiftWishDelete.log(targetId = AuditId(wishId))
    }
}
