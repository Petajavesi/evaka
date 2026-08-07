// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useMemo } from 'react'
import styled from 'styled-components'

import type { ShiftPlanWeekResponse } from 'lib-common/generated/api-types/petajavesi'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import { InformationText } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import { shiftPlanningTexts as t } from 'lib-customizations/petajavesi/shiftPlanning'

import type { ParsedShift } from './calc'
import {
  actualMinutesByEmployee,
  formatBalance,
  formatMinutes,
  plannedMinutesByEmployee
} from './calc'

const OverLimit = styled.span`
  color: ${(p) => p.theme.colors.status.danger};
  font-weight: 600;
`

interface Props {
  response: ShiftPlanWeekResponse
  shifts: ParsedShift[]
}

export default React.memo(function WeeklyHoursSummary({
  response,
  shifts
}: Props) {
  const minutesByEmployee = useMemo(
    () => plannedMinutesByEmployee(shifts),
    [shifts]
  )
  const actualByEmployee = useMemo(
    () => actualMinutesByEmployee(response.staffAttendances),
    [response.staffAttendances]
  )
  // Jakson suunniteltuun sisältyy tämän viikon tallennettu suunnitelma —
  // korvataan se muokkaustilan tuoreilla vuoroilla, jotta luku elää muokatessa
  const savedByEmployee = useMemo(
    () => plannedMinutesByEmployee(response.plan?.shifts ?? []),
    [response.plan]
  )
  const periodByEmployee = useMemo(
    () => new Map(response.periodMinutes.map((m) => [m.employeeId, m])),
    [response.periodMinutes]
  )
  const hasActuals = actualByEmployee.size > 0

  // Mukana kaikki, joille on työaikaa viikolla tai jaksolla
  const visibleEmployees = response.employees.filter(
    (employee) =>
      minutesByEmployee.has(employee.id) ||
      actualByEmployee.has(employee.id) ||
      periodByEmployee.has(employee.id)
  )
  if (visibleEmployees.length === 0) return null

  const period = response.balancingPeriod

  return (
    <>
      <InformationText data-qa="balancing-period-info">
        {t.weeklyHours.periodInfo(
          `${period.startDate.format('d.M.')}–${period.endDate.format('d.M.yyyy')}`,
          formatMinutes(response.weeklyHourLimitMinutes),
          formatMinutes(response.periodHourLimitMinutes)
        )}
      </InformationText>
      <Gap $size="xs" />
      <Table data-qa="weekly-hours-summary">
        <Thead>
          <Tr>
            <Th>{t.weeklyHours.employee}</Th>
            <Th>{t.weeklyHours.planned}</Th>
            {hasActuals && <Th>{t.weeklyHours.actual}</Th>}
            <Th>{t.weeklyHours.periodPlanned}</Th>
            <Th>{t.weeklyHours.periodActual}</Th>
            <Th>{t.weeklyHours.periodBalance}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {visibleEmployees.map((employee) => {
            const weekPlanned = minutesByEmployee.get(employee.id) ?? 0
            const weekActual = actualByEmployee.get(employee.id)
            const periodMinutes = periodByEmployee.get(employee.id)
            const periodPlanned =
              (periodMinutes?.plannedMinutes ?? 0) -
              (savedByEmployee.get(employee.id) ?? 0) +
              weekPlanned
            const periodActual = periodMinutes?.actualMinutes ?? 0
            const balance = periodPlanned - response.periodHourLimitMinutes
            return (
              <Tr key={employee.id} data-qa={`weekly-hours-${employee.id}`}>
                <Td>
                  {employee.lastName} {employee.firstName}
                </Td>
                <Td data-qa="planned-minutes">{formatMinutes(weekPlanned)}</Td>
                {hasActuals && (
                  <Td data-qa="actual-minutes">
                    {weekActual === undefined
                      ? t.weeklyHours.noActual
                      : formatMinutes(weekActual)}
                  </Td>
                )}
                <Td data-qa="period-planned-minutes">
                  {formatMinutes(periodPlanned)}
                </Td>
                <Td data-qa="period-actual-minutes">
                  {periodActual === 0
                    ? t.weeklyHours.noActual
                    : formatMinutes(periodActual)}
                </Td>
                <Td data-qa="period-balance">
                  {balance > 0 ? (
                    <OverLimit data-qa="period-over-limit-warning">
                      {formatBalance(balance)} — {t.weeklyHours.overLimit}
                    </OverLimit>
                  ) : (
                    formatBalance(balance)
                  )}
                </Td>
              </Tr>
            )
          })}
        </Tbody>
      </Table>
    </>
  )
})
