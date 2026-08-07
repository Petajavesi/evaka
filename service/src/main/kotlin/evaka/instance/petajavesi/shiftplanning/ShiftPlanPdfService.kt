// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.shiftplanning

import evaka.core.pdfgen.Page
import evaka.core.pdfgen.PdfGenerator
import evaka.core.pdfgen.Template
import evaka.core.shared.DaycareId
import evaka.core.shared.EmployeeId
import evaka.core.shared.db.Database
import evaka.core.shared.domain.FiniteDateRange
import evaka.core.shared.domain.NotFound
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.time.temporal.WeekFields
import java.util.Locale
import org.springframework.stereotype.Service
import org.thymeleaf.context.Context

private val FI_LOCALE = Locale.of("fi", "FI")
private val DATE_FORMAT = DateTimeFormatter.ofPattern("d.M.yyyy")
private val TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm")

/** Viikkomatriisin rivi: nimi ja kellonajat päiväsarakkeittain (ma–su) */
data class ShiftPlanPdfWeekRow(val name: String, val cells: List<String>)

/** Työntekijäkohtaisen tulosteen päivärivi */
data class ShiftPlanPdfDayRow(val day: String, val times: String)

/** Yksi työntekijä = yksi sivu työntekijäkohtaisessa tulosteessa */
data class ShiftPlanEmployeePdfPage(
    val name: String,
    val rows: List<ShiftPlanPdfDayRow>,
    val total: String,
)

@Service
class ShiftPlanPdfService(private val pdfGenerator: PdfGenerator) {
    fun renderShiftPlanPdf(tx: Database.Read, unitId: DaycareId, weekStart: LocalDate): ByteArray {
        val planId =
            tx.getShiftPlanId(unitId, weekStart)
                ?: throw NotFound("No saved shift plan for unit $unitId week $weekStart")
        val unitName = tx.getShiftPlanUnitName(unitId) ?: throw NotFound("Unit not found")
        val week = FiniteDateRange(weekStart, weekStart.plusDays(6))
        val weekDates = week.dates().toList()

        // Työvuorot: rivi per työntekijä, solu = päivän vuorojen kellonajat
        val shiftsByEmployee =
            tx.getShiftPlanShiftsWithEmployee(planId).groupBy { "${it.lastName} ${it.firstName}" }
        val employeeRows =
            shiftsByEmployee.entries
                .sortedBy { it.key }
                .map { (name, shifts) ->
                    val byDate = shifts.groupBy { it.date }
                    ShiftPlanPdfWeekRow(
                        name = name,
                        cells =
                            weekDates.map { date ->
                                (byDate[date] ?: emptyList())
                                    .sortedBy { it.startTime }
                                    .joinToString("\n") {
                                        "${it.startTime.format(TIME_FORMAT)}–${it.endTime.format(TIME_FORMAT)}"
                                    }
                            },
                    )
                }

        // Lapset: rivi per lapsi, solu = päivän varausten kellonajat
        val childRows = tx.getShiftPlanChildren(unitId, week)
        val reservationsByChild =
            tx.getShiftPlanReservations(childRows.map { it.id }.toSet(), week).groupBy {
                it.childId
            }
        val childWeekRows = childRows.map { child ->
            val byDate = (reservationsByChild[child.id] ?: emptyList()).groupBy { it.date }
            ShiftPlanPdfWeekRow(
                name = "${child.lastName} ${child.firstName}",
                cells =
                    weekDates.map { date ->
                        (byDate[date] ?: emptyList())
                            .sortedBy { it.startTime }
                            .joinToString("\n") {
                                "${it.startTime.format(TIME_FORMAT)}–${it.endTime.format(TIME_FORMAT)}"
                            }
                    },
            )
        }

        val context =
            Context().apply {
                locale = FI_LOCALE
                setVariable("unitName", unitName)
                setVariable(
                    "weekNumber",
                    weekStart.get(WeekFields.ISO.weekOfWeekBasedYear()).toString(),
                )
                setVariable(
                    "weekRange",
                    "${weekStart.format(DATE_FORMAT)}–${week.end.format(DATE_FORMAT)}",
                )
                setVariable("dayHeaders", weekDates.map { dayHeader(it) })
                setVariable("employeeRows", employeeRows)
                setVariable("childRows", childWeekRows)
            }
        return pdfGenerator.render(Page(Template("shift-plan/shift-plan"), context))
    }

    /**
     * Työntekijäkohtainen työvuorolista työntekijöille jaettavaksi: yksi työntekijä
     * per sivu. Kun employeeId on annettu, tulosteessa on vain kyseinen työntekijä.
     */
    fun renderEmployeeShiftPlanPdf(
        tx: Database.Read,
        unitId: DaycareId,
        weekStart: LocalDate,
        employeeId: EmployeeId?,
    ): ByteArray {
        val planId =
            tx.getShiftPlanId(unitId, weekStart)
                ?: throw NotFound("No saved shift plan for unit $unitId week $weekStart")
        val unitName = tx.getShiftPlanUnitName(unitId) ?: throw NotFound("Unit not found")
        val week = FiniteDateRange(weekStart, weekStart.plusDays(6))
        val weekDates = week.dates().toList()

        val shiftsByEmployee = tx.getShiftPlanShiftsWithEmployee(planId).groupBy { it.employeeId }
        val includedIds =
            if (employeeId != null) {
                if (!shiftsByEmployee.containsKey(employeeId)) {
                    throw NotFound("No shifts for employee $employeeId in plan")
                }
                listOf(employeeId)
            } else {
                shiftsByEmployee.entries
                    .sortedBy { (_, shifts) ->
                        "${shifts.first().lastName} ${shifts.first().firstName}"
                    }
                    .map { it.key }
            }

        val pages =
            includedIds.map { id ->
                val shifts = shiftsByEmployee.getValue(id)
                val byDate = shifts.groupBy { it.date }
                ShiftPlanEmployeePdfPage(
                    name = "${shifts.first().lastName} ${shifts.first().firstName}",
                    rows =
                        weekDates.map { date ->
                            ShiftPlanPdfDayRow(
                                day = dayHeader(date),
                                times =
                                    (byDate[date] ?: emptyList())
                                        .sortedBy { it.startTime }
                                        .joinToString("\n") {
                                            "${it.startTime.format(TIME_FORMAT)}–${it.endTime.format(TIME_FORMAT)}"
                                        },
                            )
                        },
                    total =
                        formatTotal(
                            shifts.sumOf {
                                java.time.Duration.between(it.startTime, it.endTime).toMinutes()
                            }
                        ),
                )
            }

        val context =
            Context().apply {
                locale = FI_LOCALE
                setVariable("unitName", unitName)
                setVariable(
                    "weekNumber",
                    weekStart.get(WeekFields.ISO.weekOfWeekBasedYear()).toString(),
                )
                setVariable(
                    "weekRange",
                    "${weekStart.format(DATE_FORMAT)}–${week.end.format(DATE_FORMAT)}",
                )
                setVariable("pages", pages)
            }
        return pdfGenerator.render(Page(Template("shift-plan/shift-plan-employee"), context))
    }

    private fun formatTotal(minutes: Long): String =
        if (minutes % 60 == 0L) "${minutes / 60} h" else "${minutes / 60} h ${minutes % 60} min"

    private fun dayHeader(date: LocalDate): String {
        val dayName =
            date.dayOfWeek.getDisplayName(TextStyle.SHORT, FI_LOCALE).replaceFirstChar {
                it.uppercase(FI_LOCALE)
            }
        return "$dayName ${date.dayOfMonth}.${date.monthValue}."
    }
}
