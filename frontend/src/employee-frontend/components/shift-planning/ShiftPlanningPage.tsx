// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'

import type {
  ShiftPlanUnit,
  ShiftPlanWeekResponse
} from 'lib-common/generated/api-types/petajavesi'
import type { DaycareId } from 'lib-common/generated/api-types/shared'
import LocalDate from 'lib-common/local-date'
import { useQueryResult } from 'lib-common/query'
import { Button } from 'lib-components/atoms/buttons/Button'
import Select from 'lib-components/atoms/dropdowns/Select'
import { Container, ContentArea } from 'lib-components/layout/Container'
import {
  FixedSpaceColumn,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import { AlertBox, InfoBox } from 'lib-components/molecules/MessageBoxes'
import { H1, H2, Label } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import { shiftPlanningTexts as t } from 'lib-customizations/petajavesi/shiftPlanning'

import { UserContext } from '../../state/user'
import { renderResult } from '../async-rendering'

import ChildrenTable from './ChildrenTable'
import ChildrenTimelineChart from './ChildrenTimelineChart'
import ShiftEditor from './ShiftEditor'
import { ViewModeToggle } from './chartCommon'
import { shiftPlanUnitsQuery, shiftPlanWeekQuery } from './queries'

function nextMonday(): LocalDate {
  return LocalDate.todayInHelsinkiTz().startOfWeek().addDays(7)
}

export default React.memo(function ShiftPlanningPage() {
  const { user } = useContext(UserContext)
  const [unitId, setUnitId] = useState<DaycareId | null>(null)
  const [weekStart, setWeekStart] = useState<LocalDate>(nextMonday)

  const unitsResult = useQueryResult(shiftPlanUnitsQuery())

  if (!user?.accessibleFeatures.shiftPlanning) {
    return (
      <Container>
        <ContentArea $opaque>
          <AlertBox message={t.loadError} data-qa="shift-planning-forbidden" />
        </ContentArea>
      </Container>
    )
  }

  return (
    <Container>
      <FixedSpaceColumn>
        <ContentArea $opaque>
          <H1 $noMargin data-qa="shift-planning-title">
            {t.title}
          </H1>
          <Gap $size="m" />
          {renderResult(unitsResult, (units) => (
            <UnitAndWeekSelection
              units={units}
              unitId={unitId}
              setUnitId={setUnitId}
              weekStart={weekStart}
              setWeekStart={setWeekStart}
            />
          ))}
        </ContentArea>

        {unitId !== null && (
          <WeekSection
            key={`${unitId}-${weekStart.formatIso()}`}
            unitId={unitId}
            weekStart={weekStart}
          />
        )}
      </FixedSpaceColumn>
    </Container>
  )
})

const UnitAndWeekSelection = React.memo(function UnitAndWeekSelection({
  units,
  unitId,
  setUnitId,
  weekStart,
  setWeekStart
}: {
  units: ShiftPlanUnit[]
  unitId: DaycareId | null
  setUnitId: (id: DaycareId | null) => void
  weekStart: LocalDate
  setWeekStart: (d: LocalDate) => void
}) {
  const selectedUnit = units.find((u) => u.id === unitId) ?? null

  useEffect(() => {
    if (unitId === null && units.length === 1) setUnitId(units[0].id)
  }, [unitId, units, setUnitId])

  return (
    <FixedSpaceRow $alignItems="flex-end" $spacing="L">
      <FixedSpaceColumn $spacing="xs">
        <Label>{t.unitLabel}</Label>
        <Select
          items={units}
          selectedItem={selectedUnit}
          onChange={(unit) => setUnitId(unit?.id ?? null)}
          getItemValue={(unit) => unit.id}
          getItemLabel={(unit) => unit.name}
          placeholder={t.unitPlaceholder}
          data-qa="shift-planning-unit-select"
        />
      </FixedSpaceColumn>
      <FixedSpaceRow $alignItems="center" $spacing="s">
        <Button
          appearance="inline"
          text={`« ${t.previousWeek}`}
          onClick={() => setWeekStart(weekStart.subDays(7))}
          data-qa="shift-planning-previous-week"
        />
        <Label data-qa="shift-planning-week-label">
          {t.week} {weekStart.getIsoWeek()} ({weekStart.format('d.M.')}–
          {weekStart.addDays(6).format('d.M.yyyy')})
        </Label>
        <Button
          appearance="inline"
          text={`${t.nextWeek} »`}
          onClick={() => setWeekStart(weekStart.addDays(7))}
          data-qa="shift-planning-next-week"
        />
      </FixedSpaceRow>
    </FixedSpaceRow>
  )
})

const WeekSection = React.memo(function WeekSection({
  unitId,
  weekStart
}: {
  unitId: DaycareId
  weekStart: LocalDate
}) {
  const weekResult = useQueryResult(shiftPlanWeekQuery({ unitId, weekStart }))

  // Req 3.4: säilytetään viimeisin onnistunut vastaus, jotta suunnittelua voi
  // jatkaa verkko-ongelman aikana välimuistidatalla
  const lastGoodRef = useRef<ShiftPlanWeekResponse | null>(null)
  useEffect(() => {
    if (weekResult.isSuccess) lastGoodRef.current = weekResult.value
  }, [weekResult])

  const staleData =
    weekResult.isFailure &&
    lastGoodRef.current !== null &&
    lastGoodRef.current.unitId === unitId &&
    lastGoodRef.current.weekStart.isEqual(weekStart)
      ? lastGoodRef.current
      : null

  if (staleData !== null) {
    return (
      <>
        <ContentArea $opaque>
          <AlertBox
            message={t.staleDataWarning}
            data-qa="shift-planning-stale-warning"
          />
        </ContentArea>
        <WeekContent response={staleData} />
      </>
    )
  }

  return renderResult(weekResult, (response) => (
    <WeekContent response={response} />
  ))
})

const WeekContent = React.memo(function WeekContent({
  response
}: {
  response: ShiftPlanWeekResponse
}) {
  const hasReservations = useMemo(
    () => response.children.some((child) => child.reservations.length > 0),
    [response.children]
  )

  return (
    <>
      {!hasReservations && (
        <ContentArea $opaque>
          <InfoBox
            message={t.noReservations}
            data-qa="shift-planning-no-reservations"
          />
        </ContentArea>
      )}

      <ContentArea $opaque>
        <H2 $noMargin>{t.staffingNeed.title}</H2>
        <Gap $size="s" />
        <ShiftEditor response={response} />
      </ContentArea>

      {response.children.length > 0 && <ChildrenSection response={response} />}
    </>
  )
})

const ChildrenSection = React.memo(function ChildrenSection({
  response
}: {
  response: ShiftPlanWeekResponse
}) {
  const [view, setView] = useState<'list' | 'chart'>('chart')

  return (
    <ContentArea $opaque>
      <H2 $noMargin>{t.children.title}</H2>
      <Gap $size="s" />
      <ViewModeToggle
        mode={view}
        onChange={setView}
        data-qa="children-view-toggle"
      />
      <Gap $size="s" />
      {view === 'list' ? (
        <ChildrenTable response={response} />
      ) : (
        <ChildrenTimelineChart
          planChildren={response.children}
          weekStart={response.weekStart}
        />
      )}
    </ContentArea>
  )
})
