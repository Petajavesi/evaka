// SPDX-FileCopyrightText: 2017-2025 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import styled, { useTheme } from 'styled-components'

import { Result } from 'lib-common/api'
import { GroupInfo } from 'lib-common/generated/api-types/attendance'
import { EmployeeId } from 'lib-common/generated/api-types/shared'
import LocalDate from 'lib-common/local-date'
import LocalTime from 'lib-common/local-time'
import { useQueryResult } from 'lib-common/query'
import { LegacyButton } from 'lib-components/atoms/buttons/LegacyButton'
import {
  FixedSpaceColumn,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import { TabLinks } from 'lib-components/molecules/Tabs'
import { fontWeights } from 'lib-components/typography'
import { faChevronDown, faChevronUp } from 'lib-icons'
import { faPlus } from 'lib-icons'

import { routes } from '../App'
import { renderResult } from '../async-rendering'
import { PageWithNavigation } from '../common/PageWithNavigation'
import { useTranslation } from '../common/i18n'
import { UnitOrGroup, toUnitOrGroup } from '../common/unit-or-group'
import { unitInfoQuery } from '../units/queries'

import StaffListItem from './StaffListItem'
import { staffAttendanceQuery } from './queries'
import { toStaff } from './utils'

const StaticIconContainer = styled.div`
  position: fixed;
  bottom: 68px;
  right: 8px;
`

type PrimaryTab = 'today' | 'planned'
type StatusTab = 'present' | 'absent'

type Props = {
  unitOrGroup: UnitOrGroup
  primaryTab: PrimaryTab
} & (
  | {
      primaryTab: 'today'
      statusTab: StatusTab
    }
  | {
      primaryTab: 'planned'
    }
)

export default React.memo(function StaffAttendancesPage(props: Props) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const unitOrGroup = props.unitOrGroup
  const unitId = unitOrGroup.unitId
  const unitInfoResponse = useQueryResult(unitInfoQuery({ unitId }))

  const changeGroup = useCallback(
    (group: GroupInfo | undefined) => {
      void navigate(
        props.primaryTab === 'today'
          ? routes.staffAttendancesToday(
              toUnitOrGroup(unitId, group?.id),
              props.statusTab
            ).value
          : routes.staffAttendancesPlanned(toUnitOrGroup(unitId, group?.id))
              .value
      )
    },
    [navigate, props, unitId]
  )

  const selectedGroup = useMemo(
    () =>
      unitInfoResponse
        .map(({ groups }) =>
          unitOrGroup.type === 'unit'
            ? undefined
            : groups.find((g) => g.id === unitOrGroup.id)
        )
        .getOrElse(undefined),
    [unitOrGroup, unitInfoResponse]
  )

  const tabs = useMemo(
    () => [
      {
        id: 'today',
        link: routes.staffAttendancesToday(unitOrGroup, 'absent'),
        label: i18n.attendances.views.TODAY
      },
      {
        id: 'planned',
        link: routes.staffAttendancesPlanned(unitOrGroup),
        label: i18n.attendances.views.NEXT_DAYS
      }
    ],
    [unitOrGroup, i18n]
  )

  return (
    <PageWithNavigation
      unitOrGroup={unitOrGroup}
      selected="staff"
      selectedGroup={selectedGroup}
      onChangeGroup={changeGroup}
    >
      <TabLinks tabs={tabs} mobile />
      {props.primaryTab === 'today' ? (
        <StaffAttendancesToday
          unitOrGroup={unitOrGroup}
          tab={props.statusTab}
        />
      ) : (
        <StaffAttendancesPlanned unitOrGroup={unitOrGroup} />
      )}
    </PageWithNavigation>
  )
})

const StaffAttendancesToday = React.memo(function StaffAttendancesToday({
  unitOrGroup,
  tab
}: {
  unitOrGroup: UnitOrGroup
  tab: StatusTab
}) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()

  const staffAttendanceResponse = useQueryResult(
    staffAttendanceQuery({ unitId: unitOrGroup.unitId })
  )

  const navigateToExternalMemberArrival = useCallback(
    () => navigate(routes.externalStaffAttendances(unitOrGroup).value),
    [unitOrGroup, navigate]
  )

  const presentStaffCounts = useMemo(
    () =>
      staffAttendanceResponse.map(
        (res) =>
          res.staff.filter((s) =>
            unitOrGroup.type === 'unit'
              ? s.present
              : s.present === unitOrGroup.id
          ).length +
          res.extraAttendances.filter(
            (s) => unitOrGroup.type === 'unit' || s.groupId === unitOrGroup.id
          ).length
      ),
    [unitOrGroup, staffAttendanceResponse]
  )

  const tabs = useMemo(
    () => [
      {
        id: 'absent',
        link: routes.staffAttendancesToday(unitOrGroup, 'absent'),
        label: i18n.attendances.types.ABSENT
      },
      {
        id: 'present',
        link: routes.staffAttendancesToday(unitOrGroup, 'present'),
        label: (
          <>
            {i18n.attendances.types.PRESENT}
            <br />({presentStaffCounts.getOrElse('0')})
          </>
        )
      }
    ],
    [unitOrGroup, i18n, presentStaffCounts]
  )

  const filteredStaff = useMemo(
    () =>
      staffAttendanceResponse.map((res) =>
        tab === 'present'
          ? unitOrGroup.type === 'unit'
            ? [
                ...res.staff.filter((s) => s.present !== null),
                ...res.extraAttendances
              ]
            : [
                ...res.staff.filter((s) => s.present === unitOrGroup.id),
                ...res.extraAttendances.filter(
                  (s) => s.groupId === unitOrGroup.id
                )
              ]
          : res.staff.filter(
              (s) =>
                s.present === null &&
                (unitOrGroup.type === 'unit' ||
                  s.groupIds.includes(unitOrGroup.id))
            )
      ),
    [unitOrGroup, tab, staffAttendanceResponse]
  )

  return (
    <>
      <TabLinks tabs={tabs} mobile />
      {renderResult(filteredStaff, (staff) => (
        <FixedSpaceColumn spacing="zero">
          {staff.map((staffMember) => {
            const s = toStaff(staffMember)
            return (
              <StaffListItem
                {...s}
                key={s.id}
                unitOrGroup={unitOrGroup}
                occupancyEffect={staffMember.occupancyEffect}
              />
            )
          })}
        </FixedSpaceColumn>
      ))}
      <StaticIconContainer>
        <LegacyButton
          primary
          onClick={navigateToExternalMemberArrival}
          data-qa="add-external-member-btn"
        >
          <FontAwesomeIcon icon={faPlus} size="sm" />{' '}
          {i18n.attendances.staff.externalPerson}
        </LegacyButton>
      </StaticIconContainer>
    </>
  )
})

interface StaffMemberDay {
  employeeId: EmployeeId
  firstName: string
  lastName: string
  occupancyEffect: boolean
  plans: {
    start: LocalTime | null // null if started on previous day
    end: LocalTime | null // null if ends on the next day
  }[]
  confidence: 'full' | 'maybeInOtherGroup' | 'maybeInOtherUnit'
}

interface StaffMembersByDate {
  date: LocalDate
  staff: StaffMemberDay[]
}

const StaffAttendancesPlanned = React.memo(function StaffAttendancesPlanned({
  unitOrGroup
}: {
  unitOrGroup: UnitOrGroup
}) {
  const { i18n, lang } = useTranslation()
  const theme = useTheme()
  const today = LocalDate.todayInHelsinkiTz()

  const [expandedDate, setExpandedDate] = useState<LocalDate | null>(null)

  const staffAttendanceResponse = useQueryResult(
    staffAttendanceQuery({
      unitId: unitOrGroup.unitId,
      startDate: today,
      endDate: today.addDays(5)
    })
  )

  const staffMemberDays: Result<StaffMembersByDate[]> = useMemo(
    () =>
      staffAttendanceResponse.map((res) =>
        [1, 2, 3, 4, 5].map((i) => {
          const date = today.addDays(i)
          return {
            date,
            staff: res.staff
              .filter(
                (s) =>
                  unitOrGroup.type !== 'group' ||
                  s.groupIds.includes(unitOrGroup.id)
              )
              .map((s) => ({
                employeeId: s.employeeId,
                firstName: s.firstName,
                lastName: s.lastName,
                occupancyEffect: s.occupancyEffect,
                plans: s.plannedAttendances
                  .filter(
                    (p) =>
                      p.start.toLocalDate().isEqual(date) ||
                      p.end.toLocalDate().isEqual(date)
                  )
                  .map((p) => ({
                    start: p.start.toLocalDate().isEqual(date)
                      ? p.start.toLocalTime()
                      : null,
                    end: p.end.toLocalDate().isEqual(date)
                      ? p.end.toLocalTime()
                      : null
                  })),
                confidence:
                  s.unitIds.length > 1
                    ? 'maybeInOtherUnit'
                    : s.groupIds.length > 1
                      ? 'maybeInOtherGroup'
                      : 'full'
              }))
          }
        })
      ),
    [unitOrGroup, staffAttendanceResponse, today]
  )

  return renderResult(staffMemberDays, (days) => (
    <FixedSpaceColumn spacing="xxs">
      <HeaderRow>
        <DayRowCol1 />
        <DayRowCol2>{i18n.attendances.staff.plannedCount}</DayRowCol2>
        <div />
      </HeaderRow>
      {days.map(({ date, staff }) => (
        <>
          <DayRow
            key={date.formatIso()}
            onClick={() =>
              setExpandedDate(expandedDate?.isEqual(date) ? null : date)
            }
            $open={expandedDate?.isEqual(date) ?? false}
          >
            <DayRowCol1>{date.formatExotic('EEEEEE d.M.', lang)}</DayRowCol1>
            <DayRowCol2>
              {staff.filter(({ plans }) => plans.length > 0).length}
            </DayRowCol2>
            <div>
              <FontAwesomeIcon
                icon={expandedDate?.isEqual(date) ? faChevronUp : faChevronDown}
                color={theme.colors.main.m2}
                style={{ fontSize: '24px' }}
              />
            </div>
          </DayRow>

        </>
      ))}
    </FixedSpaceColumn>
  ))
})

const HeaderRow = styled(FixedSpaceRow)`
  padding: 16px 8px 8px;
  font-size: 14px;
  color: ${(p) => p.theme.colors.grayscale.g70};
  font-weight: ${fontWeights.bold};
  line-height: 1.3em;
  text-transform: uppercase;
  vertical-align: middle;
`
const DayRow = styled(FixedSpaceRow)<{ $open: boolean }>`
  border-left: 4px solid
    ${(p) => (p.$open ? p.theme.colors.main.m2 : 'transparent')};
  cursor: pointer;
  padding: 8px;
  background-color: ${(p) => p.theme.colors.grayscale.g0};
`

const DayRowCol1 = styled.div`
  width: 30%;
`

const DayRowCol2 = styled.div`
  width: 50%;
`
