// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'

import type LocalDate from 'lib-common/local-date'
import { SelectionChip } from 'lib-components/atoms/Chip'
import { FixedSpaceRow } from 'lib-components/layout/flex-helpers'
import { shiftPlanningTexts as t } from 'lib-customizations/petajavesi/shiftPlanning'

/** Päivävalinta kaavionäkymille: yksi valittu viikonpäivä kerrallaan */
export const DayChips = React.memo(function DayChips({
  dates,
  selected,
  onChange
}: {
  dates: LocalDate[]
  selected: LocalDate
  onChange: (date: LocalDate) => void
}) {
  return (
    <FixedSpaceRow $spacing="xs" data-qa="chart-day-chips">
      {dates.map((date) => (
        <SelectionChip
          key={date.formatIso()}
          text={date.format('EEEEEE d.M.', 'fi')}
          selected={selected.isEqual(date)}
          onChange={(checked) => checked && onChange(date)}
          hideIcon
          data-qa={`chart-day-chip-${date.formatIso()}`}
        />
      ))}
    </FixedSpaceRow>
  )
})

/** Lista/kaavio-vaihtopainikkeet (Req: molemmat esitystavat säilyvät) */
export const ViewModeToggle = React.memo(function ViewModeToggle({
  mode,
  onChange,
  'data-qa': dataQa
}: {
  mode: 'list' | 'chart'
  onChange: (mode: 'list' | 'chart') => void
  'data-qa'?: string
}) {
  return (
    <FixedSpaceRow $spacing="xs" data-qa={dataQa}>
      <SelectionChip
        text={t.viewMode.list}
        selected={mode === 'list'}
        onChange={(checked) => checked && onChange('list')}
        hideIcon
        data-qa="view-mode-list"
      />
      <SelectionChip
        text={t.viewMode.chart}
        selected={mode === 'chart'}
        onChange={(checked) => checked && onChange('chart')}
        hideIcon
        data-qa="view-mode-chart"
      />
    </FixedSpaceRow>
  )
})

/** Kellonaika desimaalitunteina chart.js:n lineaariselle asteikolle */
export function toDecimalHours(time: { hour: number; minute: number }): number {
  return time.hour + time.minute / 60
}

export function formatHourTick(value: number): string {
  const hour = Math.floor(value)
  const minute = Math.round((value - hour) * 60)
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
