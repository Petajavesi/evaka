// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.shiftplanning

import evaka.core.assistance.DaycareAssistanceLevel
import evaka.core.occupancy.OccupancyType
import evaka.core.occupancy.calculateDailyUnitOccupancyValues
import evaka.core.shared.ChildId
import evaka.core.shared.DaycareId
import evaka.core.shared.ShiftPlanId
import evaka.core.shared.db.Database
import evaka.core.shared.domain.FiniteDateRange
import evaka.core.shared.security.actionrule.AccessControlFilter
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.time.temporal.ChronoUnit
import org.springframework.stereotype.Service

/** Tasoittumisjakson pituus viikkoina (KVTES liite 5) */
const val BALANCING_PERIOD_WEEKS = 3

data class ShiftPlanChild(
    val id: ChildId,
    val firstName: String,
    val lastName: String,
    val dateOfBirth: LocalDate,
    val reservations: List<ShiftPlanReservation>,
    val attendances: List<ShiftPlanAttendance>,
    val assistanceFactors: List<ShiftPlanAssistanceFactor>,
    val daycareAssistances: List<ShiftPlanDaycareAssistance>,
)

data class ShiftPlanReservation(
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
)

data class ShiftPlanAttendance(
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime?,
)

data class ShiftPlanAssistanceFactor(
    val validDuring: FiniteDateRange,
    val capacityFactor: BigDecimal,
)

data class ShiftPlanDaycareAssistance(
    val validDuring: FiniteDateRange,
    val level: DaycareAssistanceLevel,
)

data class ShiftPlanDailyOccupancy(val date: LocalDate, val percentage: Double?)

data class SavedShiftPlan(val id: ShiftPlanId, val shifts: List<PlannedShift>)

data class ShiftPlanWeekResponse(
    val unitId: DaycareId,
    val weekStart: LocalDate,
    val children: List<ShiftPlanChild>,
    val staffingNeed: List<DailyStaffingNeed>,
    val occupancy: List<ShiftPlanDailyOccupancy>,
    val employees: List<ShiftPlanEmployee>,
    val staffAttendances: List<ShiftPlanStaffAttendance>,
    val plan: SavedShiftPlan?,
    val weeklyHourLimitMinutes: Int,
    val staffingDivisor: Int,
    val balancingPeriod: ShiftPlanBalancingPeriod,
    val periodMinutes: List<ShiftPlanPeriodEmployeeMinutes>,
    val periodHourLimitMinutes: Int,
    val wishes: List<ShiftWishWithEmployee>,
)

@Service
class ShiftPlanningService {
    fun getWeekData(
        tx: Database.Transaction,
        today: LocalDate,
        unitId: DaycareId,
        weekStart: LocalDate,
    ): ShiftPlanWeekResponse {
        val week = FiniteDateRange(weekStart, weekStart.plusDays(6))
        val balancingPeriod = getOrCreateBalancingPeriod(tx, unitId, weekStart)

        val childRows = tx.getShiftPlanChildren(unitId, week)
        val childIds = childRows.map { it.id }.toSet()
        val reservations = tx.getShiftPlanReservations(childIds, week).groupBy { it.childId }
        val attendances = tx.getShiftPlanAttendances(childIds, week).groupBy { it.childId }
        val assistanceFactors =
            tx.getShiftPlanAssistanceFactors(childIds, week).groupBy { it.childId }
        val daycareAssistances =
            tx.getShiftPlanDaycareAssistance(childIds, week).groupBy { it.childId }

        val children = childRows.map { child ->
            ShiftPlanChild(
                id = child.id,
                firstName = child.firstName,
                lastName = child.lastName,
                dateOfBirth = child.dateOfBirth,
                reservations =
                    (reservations[child.id] ?: emptyList()).map {
                        ShiftPlanReservation(it.date, it.startTime, it.endTime)
                    },
                attendances =
                    (attendances[child.id] ?: emptyList()).map {
                        ShiftPlanAttendance(it.date, it.startTime, it.endTime)
                    },
                assistanceFactors =
                    (assistanceFactors[child.id] ?: emptyList()).map {
                        ShiftPlanAssistanceFactor(it.validDuring, it.capacityFactor)
                    },
                daycareAssistances =
                    (daycareAssistances[child.id] ?: emptyList()).map {
                        ShiftPlanDaycareAssistance(it.validDuring, it.level)
                    },
            )
        }

        val dateOfBirthByChild = childRows.associate { it.id to it.dateOfBirth }
        val presences =
            reservations.values.flatten().map { reservation ->
                val factor =
                    assistanceFactors[reservation.childId]
                        ?.firstOrNull { it.validDuring.includes(reservation.date) }
                        ?.capacityFactor
                ChildPresence(
                    date = reservation.date,
                    startTime = reservation.startTime,
                    endTime = reservation.endTime,
                    weight =
                        childWeight(
                            dateOfBirth = dateOfBirthByChild.getValue(reservation.childId),
                            date = reservation.date,
                            capacityFactor = factor,
                        ),
                )
            }
        val staffingNeed = calculateStaffingNeed(week.dates().toList(), presences)

        val occupancy =
            tx.calculateDailyUnitOccupancyValues(
                    today = today,
                    queryPeriod = week,
                    type = OccupancyType.CONFIRMED,
                    unitFilter = AccessControlFilter.PermitAll,
                    unitIds = setOf(unitId),
                )
                .firstOrNull()
                ?.occupancies
                .let { occupancies ->
                    week
                        .dates()
                        .map { date ->
                            ShiftPlanDailyOccupancy(date, occupancies?.get(date)?.percentage)
                        }
                        .toList()
                }

        val planId = tx.getShiftPlanId(unitId, weekStart)
        val plan = planId?.let { SavedShiftPlan(it, tx.getShiftPlanShifts(it)) }

        return ShiftPlanWeekResponse(
            unitId = unitId,
            weekStart = weekStart,
            children = children,
            staffingNeed = staffingNeed,
            occupancy = occupancy,
            employees = tx.getShiftPlanUnitEmployees(unitId),
            staffAttendances = tx.getShiftPlanStaffAttendances(unitId, week),
            plan = plan,
            weeklyHourLimitMinutes = WEEKLY_HOUR_LIMIT_MINUTES,
            staffingDivisor = STAFFING_DIVISOR.toInt(),
            balancingPeriod = balancingPeriod,
            periodMinutes = tx.getBalancingPeriodMinutes(unitId, balancingPeriod),
            periodHourLimitMinutes = BALANCING_PERIOD_WEEKS * WEEKLY_HOUR_LIMIT_MINUTES,
            wishes = tx.getShiftWishesForUnitWeek(unitId, week),
        )
    }

    /**
     * Hakee viikon sisältävän tasoittumisjakson tai luo sen. Uusi jakso ankkuroidaan
     * yksikön lähimpään olemassa olevaan jaksoon niin, että jaksot muodostavat
     * yhtenäisen kolmen viikon rytmin; yksikön ensimmäinen jakso alkaa avatusta viikosta.
     */
    private fun getOrCreateBalancingPeriod(
        tx: Database.Transaction,
        unitId: DaycareId,
        weekStart: LocalDate,
    ): ShiftPlanBalancingPeriod {
        tx.getBalancingPeriodContaining(unitId, weekStart)?.let {
            return it
        }
        val periodDays = (BALANCING_PERIOD_WEEKS * 7).toLong()
        val startDate =
            tx.getNearestBalancingPeriodStart(unitId, weekStart)?.let { anchor ->
                val daysFromAnchor = ChronoUnit.DAYS.between(anchor, weekStart)
                anchor.plusDays(Math.floorDiv(daysFromAnchor, periodDays) * periodDays)
            } ?: weekStart
        return tx.insertBalancingPeriod(unitId, startDate)
    }
}
