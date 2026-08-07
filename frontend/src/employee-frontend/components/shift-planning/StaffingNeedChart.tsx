// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import type { ChartData, ChartOptions } from 'chart.js'
import React, { useMemo, useState } from 'react'
import { Chart } from 'react-chartjs-2'
import { useTheme } from 'styled-components'

import type {
  DailyStaffingNeed,
  ShiftPlanStaffAttendance
} from 'lib-common/generated/api-types/petajavesi'
import { Gap } from 'lib-components/white-space'
import { shiftPlanningTexts as t } from 'lib-customizations/petajavesi/shiftPlanning'

import type { ParsedShift } from './calc'
import { actualCoverageAt, plannedCoverageAt } from './calc'
import { DayChips } from './chartCommon'

interface Props {
  staffingNeed: DailyStaffingNeed[]
  shifts: ParsedShift[]
  staffAttendances: ShiftPlanStaffAttendance[]
}

export default React.memo(function StaffingNeedChart({
  staffingNeed,
  shifts,
  staffAttendances
}: Props) {
  const theme = useTheme()
  const dates = useMemo(() => staffingNeed.map((d) => d.date), [staffingNeed])
  const [selectedDate, setSelectedDate] = useState(dates[0])

  const day =
    staffingNeed.find((d) => d.date.isEqual(selectedDate)) ?? staffingNeed[0]

  const { data, options } = useMemo(() => {
    const labels = day.slots.map((slot) => slot.startTime.format())
    const required = day.slots.map((slot) => slot.requiredStaff)
    const planned = day.slots.map((slot) =>
      plannedCoverageAt(shifts, day.date, slot.startTime, slot.endTime)
    )
    // Toteuma piirretään vain, jos viikolla on leimauksia (menneet viikot)
    const hasActuals = staffAttendances.length > 0
    const actual = hasActuals
      ? day.slots.map((slot) =>
          actualCoverageAt(
            staffAttendances,
            day.date,
            slot.startTime,
            slot.endTime
          )
        )
      : null

    const data: ChartData<'bar' | 'line', number[], string> = {
      labels,
      datasets: [
        {
          type: 'bar',
          label: t.staffingNeed.required,
          data: required,
          backgroundColor: theme.colors.main.m2,
          borderRadius: { topLeft: 4, topRight: 4 },
          borderSkipped: 'bottom',
          categoryPercentage: 0.9,
          barPercentage: 0.9,
          maxBarThickness: 18
        },
        {
          type: 'line',
          label: t.staffingNeed.planned,
          data: planned,
          borderColor: theme.colors.accents.a2orangeDark,
          backgroundColor: theme.colors.accents.a2orangeDark,
          borderWidth: 2,
          stepped: 'middle',
          pointRadius: 0,
          pointHoverRadius: 5
        },
        // Katkoviiva erottaa toteuman suunnitelmasta myös ilman värinäköä
        ...(actual !== null
          ? [
              {
                type: 'line' as const,
                label: t.staffingNeed.actual,
                data: actual,
                borderColor: theme.colors.accents.a1greenDark,
                backgroundColor: theme.colors.accents.a1greenDark,
                borderWidth: 2,
                borderDash: [6, 4],
                stepped: 'middle' as const,
                pointRadius: 0,
                pointHoverRadius: 5
              }
            ]
          : [])
      ]
    }

    const options: ChartOptions<'bar' | 'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: false,
            callback: function (_value, index) {
              const label = labels[index]
              return label.endsWith(':00') ? label : ''
            }
          }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: t.chart.employeesAxis },
          ticks: { precision: 0 },
          grid: { color: theme.colors.grayscale.g15 }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: { boxWidth: 12, boxHeight: 12 }
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const index = items[0]?.dataIndex
              if (index === undefined) return ''
              const slot = day.slots[index]
              return `${t.chart.timeAxis} ${slot.startTime.format()}–${slot.endTime.format()}`
            }
          }
        }
      }
    }
    return { data, options }
  }, [day, shifts, staffAttendances, theme])

  return (
    <div data-qa="staffing-need-chart">
      <DayChips dates={dates} selected={day.date} onChange={setSelectedDate} />
      <Gap $size="s" />
      <div style={{ height: '280px' }}>
        <Chart type="bar" data={data} options={options} />
      </div>
    </div>
  )
})
