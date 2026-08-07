// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'

import type { ShiftPlanWeekResponse } from 'lib-common/generated/api-types/petajavesi'
import type LocalDate from 'lib-common/local-date'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import { shiftPlanningTexts as t } from 'lib-customizations/petajavesi/shiftPlanning'

interface Props {
  response: ShiftPlanWeekResponse
}

export default React.memo(function ChildrenTable({ response }: Props) {
  const weekDates = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    response.weekStart.addDays(i)
  )

  return (
    <Table data-qa="shift-planning-children-table">
      <Thead>
        <Tr>
          <Th>{t.children.name}</Th>
          <Th>{t.children.dateOfBirth}</Th>
          <Th>{t.children.assistance}</Th>
          {weekDates.map((date) => (
            <Th key={date.formatIso()}>{date.format('EEEEEE d.M.', 'fi')}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {response.children.map((child) => (
          <Tr key={child.id} data-qa={`shift-planning-child-${child.id}`}>
            <Td>
              {child.lastName} {child.firstName}
            </Td>
            <Td>{child.dateOfBirth.format()}</Td>
            <Td data-qa="child-assistance">
              {assistanceText(
                child.assistanceFactors,
                child.daycareAssistances
              )}
            </Td>
            {weekDates.map((date) => (
              <Td key={date.formatIso()}>
                {reservationText(child.reservations, date)}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
})

function assistanceText(
  factors: ShiftPlanWeekResponse['children'][number]['assistanceFactors'],
  daycareAssistances: ShiftPlanWeekResponse['children'][number]['daycareAssistances']
): string {
  const parts = [
    ...factors.map((f) => `${t.children.assistanceFactor} ${f.capacityFactor}`),
    ...daycareAssistances.map(
      (a) => t.children.daycareAssistanceLevels[a.level]
    )
  ]
  return parts.length > 0 ? parts.join(', ') : '–'
}

function reservationText(
  reservations: ShiftPlanWeekResponse['children'][number]['reservations'],
  date: LocalDate
): string {
  const dayReservations = reservations.filter((r) => r.date.isEqual(date))
  if (dayReservations.length === 0) return '–'
  return dayReservations
    .map((r) => `${r.startTime.format()}–${r.endTime.format()}`)
    .join(', ')
}
