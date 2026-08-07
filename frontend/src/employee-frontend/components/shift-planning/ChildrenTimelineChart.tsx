// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import type { ChartData, ChartOptions } from 'chart.js'
import React, { useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { useTheme } from 'styled-components'

import type { ShiftPlanChild } from 'lib-common/generated/api-types/petajavesi'
import type LocalDate from 'lib-common/local-date'
import { InformationText } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import { shiftPlanningTexts as t } from 'lib-customizations/petajavesi/shiftPlanning'

import { DayChips, formatHourTick, toDecimalHours } from './chartCommon'

interface Props {
  planChildren: ShiftPlanChild[]
  weekStart: LocalDate
}

interface TimelineRow {
  name: string
  assistance: string | null
  start: number
  end: number
  startLabel: string
  endLabel: string
}

export default React.memo(function ChildrenTimelineChart({
  planChildren,
  weekStart
}: Props) {
  const theme = useTheme()
  const dates = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((i) => weekStart.addDays(i)),
    [weekStart]
  )
  const [selectedDate, setSelectedDate] = useState(dates[0])

  const rows: TimelineRow[] = useMemo(
    () =>
      planChildren
        .flatMap((child) => {
          // Valittuna päivänä voimassa oleva tuen tieto (Req 5.2)
          const assistanceParts = [
            ...child.assistanceFactors
              .filter((f) => f.validDuring.includes(selectedDate))
              .map((f) => `${t.children.assistanceFactor} ${f.capacityFactor}`),
            ...child.daycareAssistances
              .filter((a) => a.validDuring.includes(selectedDate))
              .map((a) => t.children.daycareAssistanceLevels[a.level])
          ]
          const assistance =
            assistanceParts.length > 0 ? assistanceParts.join(', ') : null
          return child.reservations
            .filter((reservation) => reservation.date.isEqual(selectedDate))
            .map((reservation) => ({
              name: `${child.lastName} ${child.firstName}`,
              assistance,
              start: toDecimalHours(reservation.startTime),
              end: toDecimalHours(reservation.endTime),
              startLabel: reservation.startTime.format(),
              endLabel: reservation.endTime.format()
            }))
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'fi')),
    [planChildren, selectedDate]
  )

  const { data, options } = useMemo(() => {
    const minHour = Math.min(6, ...rows.map((row) => Math.floor(row.start)))
    const maxHour = Math.max(18, ...rows.map((row) => Math.ceil(row.end)))

    const data: ChartData<'bar', [number, number][], string> = {
      // Tuen tarve merkitään nimeen tekstillä (ei pelkällä värillä)
      labels: rows.map((row) =>
        row.assistance !== null
          ? `${row.name} ${t.chart.assistanceMarker}`
          : row.name
      ),
      datasets: [
        {
          data: rows.map((row) => [row.start, row.end]),
          backgroundColor: rows.map((row) =>
            row.assistance !== null
              ? theme.colors.accents.a2orangeDark
              : theme.colors.main.m2
          ),
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 12
        }
      ]
    }

    const options: ChartOptions<'bar'> = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: minHour,
          max: maxHour,
          title: { display: true, text: t.chart.timeAxis },
          ticks: {
            stepSize: 1,
            callback: (value) =>
              typeof value === 'number' ? formatHourTick(value) : ''
          },
          grid: { color: theme.colors.grayscale.g15 }
        },
        y: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => {
              const row = rows[item.dataIndex]
              return `${row.startLabel}–${row.endLabel}`
            },
            afterLabel: (item) => {
              const row = rows[item.dataIndex]
              return row.assistance !== null
                ? `${t.children.assistance}: ${row.assistance}`
                : ''
            }
          }
        }
      }
    }
    return { data, options }
  }, [rows, theme])

  return (
    <div data-qa="children-timeline-chart">
      <DayChips
        dates={dates}
        selected={selectedDate}
        onChange={setSelectedDate}
      />
      <Gap $size="s" />
      {rows.length === 0 ? (
        <InformationText data-qa="timeline-no-reservations">
          {t.chart.noReservationsForDay}
        </InformationText>
      ) : (
        <div style={{ height: `${rows.length * 24 + 90}px` }}>
          <Bar data={data} options={options} />
        </div>
      )}
    </div>
  )
})
