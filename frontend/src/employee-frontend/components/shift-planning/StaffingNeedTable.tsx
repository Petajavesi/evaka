// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useMemo } from 'react'
import styled from 'styled-components'

import type {
  DailyStaffingNeed,
  ShiftPlanDailyOccupancy,
  ShiftPlanStaffAttendance
} from 'lib-common/generated/api-types/petajavesi'
import type LocalTime from 'lib-common/local-time'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import { InformationText } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import { shiftPlanningTexts as t } from 'lib-customizations/petajavesi/shiftPlanning'

import type { ParsedShift } from './calc'
import { actualCoverageAt, plannedCoverageAt } from './calc'

const ShortageTd = styled(Td)`
  color: ${(p) => p.theme.colors.status.danger};
  font-weight: 600;
`

interface Props {
  staffingNeed: DailyStaffingNeed[]
  occupancy: ShiftPlanDailyOccupancy[]
  shifts: ParsedShift[]
  staffAttendances: ShiftPlanStaffAttendance[]
}

export default React.memo(function StaffingNeedTable({
  staffingNeed,
  occupancy,
  shifts,
  staffAttendances
}: Props) {
  const hasActuals = staffAttendances.length > 0
  // Rivit = kaikkien päivien aikavälien unioni, sarakkeet = viikonpäivät
  const slotStarts = useMemo(() => {
    const seen = new Map<string, { start: LocalTime; end: LocalTime }>()
    staffingNeed.forEach((day) =>
      day.slots.forEach((slot) => {
        const key = slot.startTime.format()
        if (!seen.has(key)) {
          seen.set(key, { start: slot.startTime, end: slot.endTime })
        }
      })
    )
    return [...seen.values()].sort((a, b) => a.start.compareTo(b.start))
  }, [staffingNeed])

  const occupancyByDate = useMemo(
    () => new Map(occupancy.map((o) => [o.date.formatIso(), o.percentage])),
    [occupancy]
  )

  return (
    <>
      <InformationText data-qa="staffing-need-legend">
        {hasActuals ? t.staffingNeed.legendWithActual : t.staffingNeed.legend}
      </InformationText>
      <Gap $size="xs" />
      <Table data-qa="staffing-need-table">
        <Thead>
          <Tr>
            <Th>{t.staffingNeed.time}</Th>
            {staffingNeed.map((day) => (
              <Th key={day.date.formatIso()}>
                {day.date.format('EEEEEE d.M.', 'fi')}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          <Tr data-qa="occupancy-row">
            <Td>{t.staffingNeed.occupancy}</Td>
            {staffingNeed.map((day) => {
              const percentage = occupancyByDate.get(day.date.formatIso())
              return (
                <Td key={day.date.formatIso()}>
                  {percentage != null ? `${percentage.toFixed(1)} %` : '–'}
                </Td>
              )
            })}
          </Tr>
          {slotStarts.map(({ start, end }) => (
            <Tr
              key={start.format()}
              data-qa={`staffing-slot-${start.format()}`}
            >
              <Td>
                {start.format()}–{end.format()}
              </Td>
              {staffingNeed.map((day) => {
                const slot = day.slots.find((s) => s.startTime.isEqual(start))
                if (!slot) return <Td key={day.date.formatIso()}>–</Td>
                const planned = plannedCoverageAt(shifts, day.date, start, end)
                const actual = hasActuals
                  ? actualCoverageAt(staffAttendances, day.date, start, end)
                  : null
                const cellText =
                  actual !== null
                    ? `${slot.requiredStaff} / ${planned} / ${actual}`
                    : `${slot.requiredStaff} / ${planned}`
                const title = `${t.staffingNeed.childCount}: ${slot.childCount}, ${t.staffingNeed.weighted}: ${slot.weightedChildCount}, ${t.staffingNeed.difference}: ${planned - slot.requiredStaff}${actual !== null ? `, ${t.staffingNeed.actual}: ${actual}` : ''}`
                return planned < slot.requiredStaff ? (
                  <ShortageTd key={day.date.formatIso()} title={title}>
                    {cellText}
                  </ShortageTd>
                ) : (
                  <Td key={day.date.formatIso()} title={title}>
                    {cellText}
                  </Td>
                )
              })}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </>
  )
})
