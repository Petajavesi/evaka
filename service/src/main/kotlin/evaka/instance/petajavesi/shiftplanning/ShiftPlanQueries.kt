// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.shiftplanning

import evaka.core.assistance.DaycareAssistanceLevel
import evaka.core.shared.ChildId
import evaka.core.shared.DaycareId
import evaka.core.shared.EmployeeId
import evaka.core.shared.ShiftPlanId
import evaka.core.shared.ShiftPlanShiftId
import evaka.core.shared.db.Database
import evaka.core.shared.domain.FiniteDateRange
import evaka.core.shared.security.actionrule.AccessControlFilter
import evaka.core.shared.security.actionrule.forTable
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime

data class ShiftPlanUnit(val id: DaycareId, val name: String)

data class ShiftPlanChildRow(
    val id: ChildId,
    val firstName: String,
    val lastName: String,
    val dateOfBirth: LocalDate,
)

data class ShiftPlanReservationRow(
    val childId: ChildId,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
)

data class ShiftPlanAttendanceRow(
    val childId: ChildId,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime?,
)

data class ShiftPlanAssistanceFactorRow(
    val childId: ChildId,
    val validDuring: FiniteDateRange,
    val capacityFactor: BigDecimal,
)

data class ShiftPlanDaycareAssistanceRow(
    val childId: ChildId,
    val validDuring: FiniteDateRange,
    val level: DaycareAssistanceLevel,
)

data class ShiftPlanEmployee(val id: EmployeeId, val firstName: String, val lastName: String)

/**
 * Työntekijän toteutunut työaika: eVaka-mobiilin sisään/ulos-leimaus (staff_attendance_realtime).
 * endTime on null, jos ulosleimausta ei ole vielä tehty.
 */
data class ShiftPlanStaffAttendance(
    val employeeId: EmployeeId,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime?,
)

data class PlannedShift(
    val id: ShiftPlanShiftId,
    val employeeId: EmployeeId,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
)

data class ShiftInput(
    val employeeId: EmployeeId,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
)

data class PlannedShiftWithEmployee(
    val employeeId: EmployeeId,
    val firstName: String,
    val lastName: String,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
)

fun Database.Read.getShiftPlanningUnits(
    filter: AccessControlFilter<DaycareId>
): List<ShiftPlanUnit> =
    createQuery {
            sql(
                """
SELECT daycare.id, daycare.name
FROM daycare
WHERE ${predicate(filter.forTable("daycare"))}
ORDER BY daycare.name
"""
            )
        }
        .toList<ShiftPlanUnit>()

fun Database.Read.getShiftPlanChildren(
    unitId: DaycareId,
    week: FiniteDateRange,
): List<ShiftPlanChildRow> =
    createQuery {
            sql(
                """
SELECT DISTINCT p.id, p.first_name, p.last_name, p.date_of_birth
FROM placement pl
JOIN person p ON p.id = pl.child_id
WHERE pl.unit_id = ${bind(unitId)}
  AND daterange(pl.start_date, pl.end_date, '[]') && ${bind(week)}
ORDER BY p.last_name, p.first_name
"""
            )
        }
        .toList<ShiftPlanChildRow>()

fun Database.Read.getShiftPlanReservations(
    childIds: Set<ChildId>,
    week: FiniteDateRange,
): List<ShiftPlanReservationRow> =
    createQuery {
            sql(
                """
SELECT ar.child_id, ar.date, ar.start_time, ar.end_time
FROM attendance_reservation ar
WHERE ar.child_id = ANY(${bind(childIds)})
  AND between_start_and_end(${bind(week)}, ar.date)
  AND ar.start_time IS NOT NULL
ORDER BY ar.date, ar.start_time
"""
            )
        }
        .toList<ShiftPlanReservationRow>()

fun Database.Read.getShiftPlanAttendances(
    childIds: Set<ChildId>,
    week: FiniteDateRange,
): List<ShiftPlanAttendanceRow> =
    createQuery {
            sql(
                """
SELECT ca.child_id, ca.date, ca.start_time, ca.end_time
FROM child_attendance ca
WHERE ca.child_id = ANY(${bind(childIds)})
  AND between_start_and_end(${bind(week)}, ca.date)
ORDER BY ca.date, ca.start_time
"""
            )
        }
        .toList<ShiftPlanAttendanceRow>()

fun Database.Read.getShiftPlanAssistanceFactors(
    childIds: Set<ChildId>,
    week: FiniteDateRange,
): List<ShiftPlanAssistanceFactorRow> =
    createQuery {
            sql(
                """
SELECT af.child_id, af.valid_during, af.capacity_factor
FROM assistance_factor af
WHERE af.child_id = ANY(${bind(childIds)}) AND af.valid_during && ${bind(week)}
"""
            )
        }
        .toList<ShiftPlanAssistanceFactorRow>()

fun Database.Read.getShiftPlanDaycareAssistance(
    childIds: Set<ChildId>,
    week: FiniteDateRange,
): List<ShiftPlanDaycareAssistanceRow> =
    createQuery {
            sql(
                """
SELECT da.child_id, da.valid_during, da.level
FROM daycare_assistance da
WHERE da.child_id = ANY(${bind(childIds)}) AND da.valid_during && ${bind(week)}
"""
            )
        }
        .toList<ShiftPlanDaycareAssistanceRow>()

fun Database.Read.getShiftPlanUnitEmployees(unitId: DaycareId): List<ShiftPlanEmployee> =
    createQuery {
            sql(
                """
SELECT e.id, e.first_name, e.last_name
FROM daycare_acl acl
JOIN employee e ON e.id = acl.employee_id
WHERE acl.daycare_id = ${bind(unitId)} AND e.active
ORDER BY e.last_name, e.first_name
"""
            )
        }
        .toList<ShiftPlanEmployee>()

/** Työaikojen kolmen viikon tasoittumisjakso (KVTES liite 5) */
data class ShiftPlanBalancingPeriod(val startDate: LocalDate, val endDate: LocalDate)

/** Työntekijän suunniteltu ja toteutunut työaika koko tasoittumisjaksolta */
data class ShiftPlanPeriodEmployeeMinutes(
    val employeeId: EmployeeId,
    val plannedMinutes: Int,
    val actualMinutes: Int,
)

private data class EmployeeMinutes(val employeeId: EmployeeId, val minutes: Int)

fun Database.Read.getBalancingPeriodContaining(
    unitId: DaycareId,
    date: LocalDate,
): ShiftPlanBalancingPeriod? =
    createQuery {
            sql(
                """
SELECT start_date, end_date
FROM shift_plan_balancing_period
WHERE unit_id = ${bind(unitId)} AND between_start_and_end(daterange(start_date, end_date, '[]'), ${bind(date)})
"""
            )
        }
        .exactlyOneOrNull<ShiftPlanBalancingPeriod>()

/** Yksikön lähin olemassa oleva jakso, johon uudet jaksot ankkuroidaan */
fun Database.Read.getNearestBalancingPeriodStart(unitId: DaycareId, date: LocalDate): LocalDate? =
    createQuery {
            sql(
                """
SELECT start_date
FROM shift_plan_balancing_period
WHERE unit_id = ${bind(unitId)}
ORDER BY abs(start_date - ${bind(date)}), start_date
LIMIT 1
"""
            )
        }
        .exactlyOneOrNull<LocalDate>()

fun Database.Transaction.insertBalancingPeriod(
    unitId: DaycareId,
    startDate: LocalDate,
): ShiftPlanBalancingPeriod =
    createQuery {
            sql(
                """
INSERT INTO shift_plan_balancing_period (unit_id, start_date, end_date)
VALUES (${bind(unitId)}, ${bind(startDate)}, ${bind(startDate.plusDays(20))})
ON CONFLICT (unit_id, start_date) DO UPDATE SET updated_at = now()
RETURNING start_date, end_date
"""
            )
        }
        .exactlyOne<ShiftPlanBalancingPeriod>()

/**
 * Työntekijöiden suunnitellut ja toteutuneet työajat minuutteina koko tasoittumisjaksolta.
 * Suunniteltu summataan jakson viikkojen tallennetuista suunnitelmista ja toteutunut
 * leimauksista (avoimet leimaukset ohitetaan, koska kestoa ei vielä tiedetä).
 */
fun Database.Read.getBalancingPeriodMinutes(
    unitId: DaycareId,
    period: ShiftPlanBalancingPeriod,
): List<ShiftPlanPeriodEmployeeMinutes> {
    val planned =
        createQuery {
                sql(
                    """
SELECT s.employee_id, (SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))) / 60)::int AS minutes
FROM shift_plan_shift s
JOIN shift_plan p ON p.id = s.plan_id
WHERE p.unit_id = ${bind(unitId)}
  AND p.week_start BETWEEN ${bind(period.startDate)} AND ${bind(period.endDate)}
GROUP BY s.employee_id
"""
                )
            }
            .toList<EmployeeMinutes>()
    val actual =
        createQuery {
                sql(
                    """
SELECT sar.employee_id, (SUM(EXTRACT(EPOCH FROM (sar.departed - sar.arrived))) / 60)::int AS minutes
FROM staff_attendance_realtime sar
JOIN daycare_group dg ON dg.id = sar.group_id
WHERE dg.daycare_id = ${bind(unitId)}
  AND sar.departed IS NOT NULL
  AND (sar.arrived AT TIME ZONE 'Europe/Helsinki')::date
      BETWEEN ${bind(period.startDate)} AND ${bind(period.endDate)}
GROUP BY sar.employee_id
"""
                )
            }
            .toList<EmployeeMinutes>()

    val plannedByEmployee = planned.associate { it.employeeId to it.minutes }
    val actualByEmployee = actual.associate { it.employeeId to it.minutes }
    return (plannedByEmployee.keys + actualByEmployee.keys).map { employeeId ->
        ShiftPlanPeriodEmployeeMinutes(
            employeeId = employeeId,
            plannedMinutes = plannedByEmployee[employeeId] ?: 0,
            actualMinutes = actualByEmployee[employeeId] ?: 0,
        )
    }
}

/**
 * Yksikön työntekijöiden leimaukset viikon ajalta toteuman todentamiseen. Leimaus kohdistetaan
 * yksikköön ryhmän kautta, ja aikaleimat muunnetaan Suomen aikaan.
 */
fun Database.Read.getShiftPlanStaffAttendances(
    unitId: DaycareId,
    week: FiniteDateRange,
): List<ShiftPlanStaffAttendance> =
    createQuery {
            sql(
                """
SELECT sar.employee_id,
       (sar.arrived AT TIME ZONE 'Europe/Helsinki')::date AS date,
       (sar.arrived AT TIME ZONE 'Europe/Helsinki')::time AS start_time,
       (sar.departed AT TIME ZONE 'Europe/Helsinki')::time AS end_time
FROM staff_attendance_realtime sar
JOIN daycare_group dg ON dg.id = sar.group_id
WHERE dg.daycare_id = ${bind(unitId)}
  AND between_start_and_end(${bind(week)}, (sar.arrived AT TIME ZONE 'Europe/Helsinki')::date)
ORDER BY date, start_time, sar.employee_id
"""
            )
        }
        .toList<ShiftPlanStaffAttendance>()

fun Database.Read.getShiftPlanId(unitId: DaycareId, weekStart: LocalDate): ShiftPlanId? =
    createQuery {
            sql(
                "SELECT id FROM shift_plan WHERE unit_id = ${bind(unitId)} AND week_start = ${bind(weekStart)}"
            )
        }
        .exactlyOneOrNull<ShiftPlanId>()

fun Database.Read.getShiftPlanShifts(planId: ShiftPlanId): List<PlannedShift> =
    createQuery {
            sql(
                """
SELECT id, employee_id, date, start_time, end_time
FROM shift_plan_shift
WHERE plan_id = ${bind(planId)}
ORDER BY date, start_time, employee_id
"""
            )
        }
        .toList<PlannedShift>()

fun Database.Read.getShiftPlanUnitName(unitId: DaycareId): String? =
    createQuery { sql("SELECT name FROM daycare WHERE id = ${bind(unitId)}") }
        .exactlyOneOrNull<String>()

fun Database.Read.getShiftPlanShiftsWithEmployee(
    planId: ShiftPlanId
): List<PlannedShiftWithEmployee> =
    createQuery {
            sql(
                """
SELECT s.employee_id, e.first_name, e.last_name, s.date, s.start_time, s.end_time
FROM shift_plan_shift s
JOIN employee e ON e.id = s.employee_id
WHERE s.plan_id = ${bind(planId)}
ORDER BY s.date, s.start_time, e.last_name, e.first_name
"""
            )
        }
        .toList<PlannedShiftWithEmployee>()

fun Database.Transaction.upsertShiftPlan(unitId: DaycareId, weekStart: LocalDate): ShiftPlanId =
    createUpdate {
            sql(
                """
INSERT INTO shift_plan (unit_id, week_start)
VALUES (${bind(unitId)}, ${bind(weekStart)})
ON CONFLICT (unit_id, week_start) DO UPDATE SET updated_at = now()
RETURNING id
"""
            )
        }
        .executeAndReturnGeneratedKeys()
        .exactlyOne<ShiftPlanId>()

/** Lisää yksittäisen vuoron suunnitelmaan (toiveen hyväksyntä) */
fun Database.Transaction.insertShiftPlanShift(planId: ShiftPlanId, shift: ShiftInput) {
    execute {
        sql(
            """
INSERT INTO shift_plan_shift (plan_id, employee_id, date, start_time, end_time)
VALUES (${bind(planId)}, ${bind(shift.employeeId)}, ${bind(shift.date)}, ${bind(shift.startTime)}, ${bind(shift.endTime)})
"""
        )
    }
}

fun Database.Transaction.replaceShiftPlanShifts(planId: ShiftPlanId, shifts: List<ShiftInput>) {
    execute { sql("DELETE FROM shift_plan_shift WHERE plan_id = ${bind(planId)}") }
    shifts.forEach { shift ->
        execute {
            sql(
                """
INSERT INTO shift_plan_shift (plan_id, employee_id, date, start_time, end_time)
VALUES (${bind(planId)}, ${bind(shift.employeeId)}, ${bind(shift.date)}, ${bind(shift.startTime)}, ${bind(shift.endTime)})
"""
            )
        }
    }
}
