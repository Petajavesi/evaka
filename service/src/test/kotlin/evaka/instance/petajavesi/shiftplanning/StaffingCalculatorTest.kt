// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.shiftplanning

import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import kotlin.test.assertEquals
import org.junit.jupiter.api.Test

class StaffingCalculatorTest {
    private val monday = LocalDate.of(2026, 7, 6)

    private fun presence(
        start: String,
        end: String,
        weight: BigDecimal = BigDecimal.ONE,
        date: LocalDate = monday,
    ) = ChildPresence(date, LocalTime.parse(start), LocalTime.parse(end), weight)

    private fun slotAt(need: DailyStaffingNeed, start: String): StaffingSlot =
        need.slots.single { it.startTime == LocalTime.parse(start) }

    @Test
    fun `tyhja viikko tuottaa nollatarpeen oletusikkunalle`() {
        val result = calculateStaffingNeed(listOf(monday), emptyList())

        assertEquals(1, result.size)
        val day = result.single()
        assertEquals(LocalTime.of(6, 0), day.slots.first().startTime)
        assertEquals(LocalTime.of(18, 0), day.slots.last().endTime)
        assertEquals(48, day.slots.size)
        assertEquals(0, day.slots.sumOf { it.requiredStaff })
        assertEquals(0, day.slots.sumOf { it.childCount })
    }

    @Test
    fun `yksi lapsi nakyy vain varauksen kattamissa valeissa`() {
        val result = calculateStaffingNeed(listOf(monday), listOf(presence("08:00", "16:00")))

        val day = result.single()
        assertEquals(0, slotAt(day, "07:30").childCount)
        assertEquals(1, slotAt(day, "08:00").childCount)
        assertEquals(1, slotAt(day, "08:00").requiredStaff)
        assertEquals(1, slotAt(day, "15:30").childCount)
        assertEquals(0, slotAt(day, "16:00").childCount)
        assertEquals(0, slotAt(day, "16:00").requiredStaff)
    }

    @Test
    fun `seitseman lasta vaatii yhden ja kahdeksan lasta kaksi tyontekijaa`() {
        val seven = List(7) { presence("08:00", "16:00") }
        val eight = List(8) { presence("08:00", "16:00") }

        val seitseman = calculateStaffingNeed(listOf(monday), seven).single()
        val kahdeksan = calculateStaffingNeed(listOf(monday), eight).single()

        assertEquals(1, slotAt(seitseman, "10:00").requiredStaff)
        assertEquals(2, slotAt(kahdeksan, "10:00").requiredStaff)
    }

    @Test
    fun `alle 3-vuotiaan paino nostaa henkilostotarvetta`() {
        // 7 x 1.0 = 7.0 -> 1 työntekijä; + 1.75 = 8.75 -> 2 työntekijää
        val presences =
            List(7) { presence("08:00", "16:00") } +
                presence("08:00", "16:00", weight = BigDecimal("1.75"))

        val day = calculateStaffingNeed(listOf(monday), presences).single()

        assertEquals(BigDecimal("8.75"), slotAt(day, "10:00").weightedChildCount)
        assertEquals(2, slotAt(day, "10:00").requiredStaff)
    }

    @Test
    fun `tuen kerroin lasketaan painotettuun lapsimaaraan`() {
        val presences =
            List(6) { presence("08:00", "16:00") } +
                presence("08:00", "16:00", weight = BigDecimal("2.00"))

        val day = calculateStaffingNeed(listOf(monday), presences).single()

        assertEquals(0, BigDecimal("8.00").compareTo(slotAt(day, "10:00").weightedChildCount))
        assertEquals(2, slotAt(day, "10:00").requiredStaff)
    }

    @Test
    fun `ikkuna laajenee oletusta aikaisempiin ja myohaisempiin varauksiin`() {
        val result = calculateStaffingNeed(listOf(monday), listOf(presence("05:10", "18:50")))

        val day = result.single()
        assertEquals(LocalTime.of(5, 0), day.slots.first().startTime)
        assertEquals(LocalTime.of(19, 0), day.slots.last().endTime)
        assertEquals(1, slotAt(day, "05:00").childCount)
        assertEquals(1, slotAt(day, "18:45").childCount)
    }

    @Test
    fun `paivat lasketaan erikseen`() {
        val tuesday = monday.plusDays(1)
        val result =
            calculateStaffingNeed(
                listOf(monday, tuesday),
                listOf(presence("08:00", "16:00", date = monday)),
            )

        assertEquals(2, result.size)
        assertEquals(1, slotAt(result[0], "10:00").childCount)
        assertEquals(0, slotAt(result[1], "10:00").childCount)
    }

    @Test
    fun `childWeight yhdistaa ikakertoimen ja tuen kertoimen`() {
        val date = LocalDate.of(2026, 7, 6)
        val under3 = date.minusYears(2)
        val over3 = date.minusYears(4)
        val exactly3 = date.minusYears(3)

        assertEquals(BigDecimal("1.75"), childWeight(under3, date, null))
        assertEquals(BigDecimal.ONE, childWeight(over3, date, null))
        // Täsmälleen 3 vuotta täyttänyt lasketaan yli 3-vuotiaaksi
        assertEquals(BigDecimal.ONE, childWeight(exactly3, date, null))
        assertEquals(0, BigDecimal("3.50").compareTo(childWeight(under3, date, BigDecimal("2.00"))))
    }
}
