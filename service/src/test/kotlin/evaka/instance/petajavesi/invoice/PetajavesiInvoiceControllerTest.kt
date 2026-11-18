// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice

import evaka.core.shared.domain.HelsinkiDateTime
import evaka.core.shared.domain.MockEvakaClock
import java.time.LocalDate
import java.time.LocalTime
import java.time.YearMonth
import kotlin.random.Random
import kotlin.test.assertEquals
import org.junit.jupiter.api.Test

class PetajavesiInvoiceControllerTest {
    // Laskuluonnosten kohdekuukausi on määritelmän
    // mukainen
    @Test
    fun `target month`() {
        val random = Random(9)
        repeat(100) {
            val today = LocalDate.of(2026, 1, 1).plusDays(random.nextInt(0, 3 * 365).toLong())
            val clock =
                MockEvakaClock(HelsinkiDateTime.of(today, LocalTime.of(random.nextInt(0, 24), 0)))
            val year = random.nextInt(2020, 2031)
            val month = random.nextInt(1, 13)
            assertEquals(YearMonth.of(year, month), targetMonth(clock, year, month))
            val previous = YearMonth.from(today).minusMonths(1)
            assertEquals(previous, targetMonth(clock, null, null))
            assertEquals(previous, targetMonth(clock, year, null))
            assertEquals(previous, targetMonth(clock, null, month))
        }
    }
}
