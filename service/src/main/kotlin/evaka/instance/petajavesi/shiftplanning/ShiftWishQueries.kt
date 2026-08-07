// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.shiftplanning

import evaka.core.shared.DaycareId
import evaka.core.shared.EmployeeId
import evaka.core.shared.ShiftWishId
import evaka.core.shared.db.Database
import evaka.core.shared.db.DatabaseEnum
import evaka.core.shared.domain.FiniteDateRange
import evaka.core.shared.domain.HelsinkiDateTime
import java.time.LocalDate
import java.time.LocalTime

enum class ShiftWishStatus : DatabaseEnum {
    PENDING,
    APPROVED,
    REJECTED;

    override val sqlType: String = "shift_wish_status"
}

/** Työntekijän oma työvuorotoive */
data class ShiftWish(
    val id: ShiftWishId,
    val unitId: DaycareId,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val status: ShiftWishStatus,
    val important: Boolean,
    val resolvedStartTime: LocalTime?,
    val resolvedEndTime: LocalTime?,
)

/** Toive työvuorosuunnittelijan näkymään */
data class ShiftWishWithEmployee(
    val id: ShiftWishId,
    val employeeId: EmployeeId,
    val firstName: String,
    val lastName: String,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val status: ShiftWishStatus,
    val important: Boolean,
    val resolvedStartTime: LocalTime?,
    val resolvedEndTime: LocalTime?,
)

data class ShiftWishRow(
    val id: ShiftWishId,
    val employeeId: EmployeeId,
    val unitId: DaycareId,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val status: ShiftWishStatus,
)

fun Database.Read.getOwnShiftWishes(
    employeeId: EmployeeId,
    window: FiniteDateRange,
): List<ShiftWish> =
    createQuery {
            sql(
                """
SELECT id, unit_id, date, start_time, end_time, status, important, resolved_start_time, resolved_end_time
FROM shift_wish
WHERE employee_id = ${bind(employeeId)} AND between_start_and_end(${bind(window)}, date)
ORDER BY date, start_time, end_time
"""
            )
        }
        .toList<ShiftWish>()

/** Työntekijän oma vahvistettu työvuoro tallennetuista suunnitelmista */
data class EmployeePlannedShift(
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val unitId: DaycareId,
    val unitName: String,
)

fun Database.Read.getOwnPlannedShifts(
    employeeId: EmployeeId,
    range: FiniteDateRange,
): List<EmployeePlannedShift> =
    createQuery {
            sql(
                """
SELECT s.date, s.start_time, s.end_time, p.unit_id, d.name AS unit_name
FROM shift_plan_shift s
JOIN shift_plan p ON p.id = s.plan_id
JOIN daycare d ON d.id = p.unit_id
WHERE s.employee_id = ${bind(employeeId)} AND between_start_and_end(${bind(range)}, s.date)
ORDER BY s.date, s.start_time
"""
            )
        }
        .toList<EmployeePlannedShift>()

fun Database.Read.getShiftWishesForUnitWeek(
    unitId: DaycareId,
    week: FiniteDateRange,
): List<ShiftWishWithEmployee> =
    createQuery {
            sql(
                """
SELECT w.id, w.employee_id, e.first_name, e.last_name, w.date, w.start_time, w.end_time,
       w.status, w.important, w.resolved_start_time, w.resolved_end_time
FROM shift_wish w
JOIN employee e ON e.id = w.employee_id
WHERE w.unit_id = ${bind(unitId)} AND between_start_and_end(${bind(week)}, w.date)
ORDER BY w.date, w.start_time, w.end_time, e.last_name, e.first_name
"""
            )
        }
        .toList<ShiftWishWithEmployee>()

fun Database.Read.getShiftWishRow(id: ShiftWishId): ShiftWishRow? =
    createQuery {
            sql(
                """
SELECT id, employee_id, unit_id, date, start_time, end_time, status
FROM shift_wish
WHERE id = ${bind(id)}
"""
            )
        }
        .exactlyOneOrNull<ShiftWishRow>()

/** Palauttaa null, jos työntekijällä on jo sama toive (uniikkirajoite) */
fun Database.Transaction.insertShiftWish(
    employeeId: EmployeeId,
    unitId: DaycareId,
    date: LocalDate,
    startTime: LocalTime,
    endTime: LocalTime,
    important: Boolean,
): ShiftWishId? =
    createQuery {
            sql(
                """
INSERT INTO shift_wish (employee_id, unit_id, date, start_time, end_time, important)
VALUES (${bind(employeeId)}, ${bind(unitId)}, ${bind(date)}, ${bind(startTime)}, ${bind(endTime)}, ${bind(important)})
ON CONFLICT (employee_id, unit_id, date, start_time, end_time) DO NOTHING
RETURNING id
"""
            )
        }
        .exactlyOneOrNull<ShiftWishId>()

/**
 * Työntekijän tärkeiden toiveiden määrä ikkunassa (hylätyt eivät kuluta
 * kiintiötä, jotta tilalle voi merkitä uuden tärkeän toiveen)
 */
fun Database.Read.countImportantWishes(employeeId: EmployeeId, window: FiniteDateRange): Int =
    createQuery {
            sql(
                """
SELECT count(*)
FROM shift_wish
WHERE employee_id = ${bind(employeeId)}
  AND between_start_and_end(${bind(window)}, date)
  AND important
  AND status <> 'REJECTED'
"""
            )
        }
        .exactlyOne<Int>()

/** Poistaa oman käsittelemättömän toiveen; palauttaa true jos rivi poistui */
fun Database.Transaction.deleteOwnPendingShiftWish(
    employeeId: EmployeeId,
    id: ShiftWishId,
): Boolean =
    createUpdate {
            sql(
                """
DELETE FROM shift_wish
WHERE id = ${bind(id)} AND employee_id = ${bind(employeeId)} AND status = 'PENDING'
"""
            )
        }
        .execute() > 0

fun Database.Transaction.resolveShiftWish(
    id: ShiftWishId,
    status: ShiftWishStatus,
    resolvedBy: EmployeeId,
    resolvedAt: HelsinkiDateTime,
    resolvedStartTime: LocalTime?,
    resolvedEndTime: LocalTime?,
) {
    createUpdate {
            sql(
                """
UPDATE shift_wish
SET status = ${bind(status)},
    resolved_by = ${bind(resolvedBy)},
    resolved_at = ${bind(resolvedAt)},
    resolved_start_time = ${bind(resolvedStartTime)},
    resolved_end_time = ${bind(resolvedEndTime)}
WHERE id = ${bind(id)}
"""
            )
        }
        .updateExactlyOne()
}
