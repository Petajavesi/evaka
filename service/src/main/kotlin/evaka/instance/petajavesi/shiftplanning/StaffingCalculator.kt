// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.shiftplanning

import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.LocalTime

/** KVTES liite 5: keskimääräinen yleistyöaika 38 h 15 min / viikko */
const val WEEKLY_HOUR_LIMIT_MINUTES = 2295

/** Varhaiskasvatuslain mitoitus: 7 lasta yhtä kasvattajaa kohden */
val STAFFING_DIVISOR: BigDecimal = BigDecimal(7)

/** Alle 3-vuotiaan painokerroin (sama kuin eVakan occupancy-laskennassa) */
val UNDER_3_COEFFICIENT: BigDecimal = BigDecimal("1.75")

private const val SLOT_MINUTES = 15
private val DEFAULT_DAY_START = LocalTime.of(6, 0)
private val DEFAULT_DAY_END = LocalTime.of(18, 0)
private val LAST_SLOT_END = LocalTime.of(23, 59)

data class ChildPresence(
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val weight: BigDecimal,
)

data class StaffingSlot(
    val startTime: LocalTime,
    val endTime: LocalTime,
    val childCount: Int,
    val weightedChildCount: BigDecimal,
    val requiredStaff: Int,
)

data class DailyStaffingNeed(val date: LocalDate, val slots: List<StaffingSlot>)

/** Painokerroin lapselle: ikäkerroin kerrottuna mahdollisella tuen kertoimella */
fun childWeight(dateOfBirth: LocalDate, date: LocalDate, capacityFactor: BigDecimal?): BigDecimal {
    val ageCoefficient =
        if (dateOfBirth.plusYears(3) > date) UNDER_3_COEFFICIENT else BigDecimal.ONE
    return ageCoefficient * (capacityFactor ?: BigDecimal.ONE)
}

/**
 * Laskee henkilöstötarpeen 15 minuutin kellonaikaväleittäin jokaiselle päivälle. Väli kattaa
 * oletuksena klo 06:00–18:00 ja laajenee, jos varauksia on ikkunan ulkopuolella.
 */
fun calculateStaffingNeed(
    dates: List<LocalDate>,
    presences: List<ChildPresence>,
    staffingDivisor: BigDecimal = STAFFING_DIVISOR,
): List<DailyStaffingNeed> {
    val presencesByDate = presences.groupBy { it.date }
    return dates.sorted().map { date ->
        DailyStaffingNeed(date, dailySlots(presencesByDate[date] ?: emptyList(), staffingDivisor))
    }
}

private fun dailySlots(
    presences: List<ChildPresence>,
    staffingDivisor: BigDecimal,
): List<StaffingSlot> {
    val dayStart =
        floorToSlot(
            minOf(presences.minOfOrNull { it.startTime } ?: DEFAULT_DAY_START, DEFAULT_DAY_START)
        )
    val dayEnd =
        ceilToSlot(maxOf(presences.maxOfOrNull { it.endTime } ?: DEFAULT_DAY_END, DEFAULT_DAY_END))

    val slots = mutableListOf<StaffingSlot>()
    var slotStart = dayStart
    while (slotStart < dayEnd) {
        val slotEnd =
            if (slotStart >= LAST_SLOT_END.minusMinutes(SLOT_MINUTES.toLong())) LAST_SLOT_END
            else minOf(slotStart.plusMinutes(SLOT_MINUTES.toLong()), dayEnd)
        val present = presences.filter { it.startTime < slotEnd && it.endTime > slotStart }
        val weighted = present.sumOf { it.weight }
        val requiredStaff =
            if (present.isEmpty()) 0
            else
                weighted
                    .divide(staffingDivisor, 10, RoundingMode.HALF_UP)
                    .setScale(0, RoundingMode.CEILING)
                    .toInt()
        slots +=
            StaffingSlot(
                startTime = slotStart,
                endTime = slotEnd,
                childCount = present.size,
                weightedChildCount = weighted,
                requiredStaff = requiredStaff,
            )
        if (slotEnd == LAST_SLOT_END) break
        slotStart = slotEnd
    }
    return slots
}

private fun floorToSlot(time: LocalTime): LocalTime =
    LocalTime.of(time.hour, time.minute / SLOT_MINUTES * SLOT_MINUTES)

private fun ceilToSlot(time: LocalTime): LocalTime {
    val floored = floorToSlot(time)
    return when {
        floored == time -> time
        floored >= LocalTime.of(23, 45) -> LAST_SLOT_END
        else -> floored.plusMinutes(SLOT_MINUTES.toLong())
    }
}
