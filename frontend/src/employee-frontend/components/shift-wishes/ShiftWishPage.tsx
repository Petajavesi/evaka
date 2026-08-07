// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import type FiniteDateRange from 'lib-common/finite-date-range'
import type {
  EmployeePlannedShift,
  ShiftPlanUnit,
  ShiftWish
} from 'lib-common/generated/api-types/petajavesi'
import type { DaycareId } from 'lib-common/generated/api-types/shared'
import type LocalDate from 'lib-common/local-date'
import LocalTime from 'lib-common/local-time'
import { useMutationResult, useQueryResult } from 'lib-common/query'
import { StaticChip } from 'lib-components/atoms/Chip'
import { AsyncButton } from 'lib-components/atoms/buttons/AsyncButton'
import { IconOnlyButton } from 'lib-components/atoms/buttons/IconOnlyButton'
import Select from 'lib-components/atoms/dropdowns/Select'
import Checkbox from 'lib-components/atoms/form/Checkbox'
import TimeInput from 'lib-components/atoms/form/TimeInput'
import { Container, ContentArea } from 'lib-components/layout/Container'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import {
  FixedSpaceColumn,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import { AlertBox, InfoBox } from 'lib-components/molecules/MessageBoxes'
import { H1, H3, InformationText, Label } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import { theme } from 'lib-customizations/common'
import { shiftWishTexts as t } from 'lib-customizations/petajavesi/shiftWishes'
import { faTrash } from 'lib-icons'

import { UserContext } from '../../state/user'
import { renderResult } from '../async-rendering'

import {
  createShiftWishMutation,
  deleteShiftWishMutation,
  ownShiftWishesQuery,
  shiftWishUnitsQuery
} from './queries'

export default React.memo(function ShiftWishPage() {
  const { user } = useContext(UserContext)
  const [unitId, setUnitId] = useState<DaycareId | null>(null)

  const unitsResult = useQueryResult(shiftWishUnitsQuery())
  const wishesResult = useQueryResult(ownShiftWishesQuery())

  if (!user?.accessibleFeatures.shiftWishes) {
    return (
      <Container>
        <ContentArea $opaque>
          <AlertBox message={t.loadError} data-qa="shift-wishes-forbidden" />
        </ContentArea>
      </Container>
    )
  }

  return (
    <Container>
      <FixedSpaceColumn>
        <ContentArea $opaque>
          <H1 $noMargin data-qa="shift-wishes-title">
            {t.title}
          </H1>
          <Gap $size="m" />
          {renderResult(unitsResult, (units) =>
            units.length === 0 ? (
              <InfoBox message={t.noUnits} data-qa="shift-wishes-no-units" />
            ) : (
              <UnitSelection
                units={units}
                unitId={unitId}
                setUnitId={setUnitId}
              />
            )
          )}
        </ContentArea>

        {renderResult(wishesResult, (response) => (
          <OwnShiftsSection
            shiftsRange={response.shiftsRange}
            shifts={response.shifts}
          />
        ))}

        {unitId !== null &&
          renderResult(wishesResult, (response) => (
            <WishesSection
              unitId={unitId}
              window={response.window}
              wishes={response.wishes}
            />
          ))}
      </FixedSpaceColumn>
    </Container>
  )
})

const UnitSelection = React.memo(function UnitSelection({
  units,
  unitId,
  setUnitId
}: {
  units: ShiftPlanUnit[]
  unitId: DaycareId | null
  setUnitId: (id: DaycareId | null) => void
}) {
  const selectedUnit = units.find((u) => u.id === unitId) ?? null

  useEffect(() => {
    if (unitId === null && units.length === 1) setUnitId(units[0].id)
  }, [unitId, units, setUnitId])

  return (
    <FixedSpaceColumn $spacing="xs">
      <Label>{t.unitLabel}</Label>
      <Select
        items={units}
        selectedItem={selectedUnit}
        onChange={(unit) => setUnitId(unit?.id ?? null)}
        getItemValue={(unit) => unit.id}
        getItemLabel={(unit) => unit.name}
        placeholder={t.unitPlaceholder}
        data-qa="shift-wishes-unit-select"
      />
    </FixedSpaceColumn>
  )
})

const statusColors = {
  PENDING: theme.colors.grayscale.g15,
  APPROVED: theme.colors.accents.a3emerald,
  REJECTED: theme.colors.status.danger
}

/** Tähtimerkintä tärkeälle toiveelle */
const ImportantStar = styled.span`
  color: ${theme.colors.accents.a5orangeLight};
  font-weight: bold;
`

/**
 * Työntekijän vahvistetut työvuorot kuluvalta viikolta ja toiveikkunan ajalta —
 * vuorot voi tarkistaa suoraan eVakasta ilman paperitulosteita
 */
const OwnShiftsSection = React.memo(function OwnShiftsSection({
  shiftsRange,
  shifts
}: {
  shiftsRange: FiniteDateRange
  shifts: EmployeePlannedShift[]
}) {
  const weekStarts = useMemo(() => {
    const starts: LocalDate[] = []
    for (
      let date = shiftsRange.start;
      !date.isAfter(shiftsRange.end);
      date = date.addDays(7)
    ) {
      starts.push(date)
    }
    return starts
  }, [shiftsRange])
  const showUnit = useMemo(
    () => new Set(shifts.map((shift) => shift.unitId)).size > 1,
    [shifts]
  )

  return (
    <ContentArea $opaque>
      <H3 $noMargin data-qa="own-shifts-title">
        {t.ownShifts}
      </H3>
      <Gap $size="xs" />
      <InformationText>{t.ownShiftsInfo}</InformationText>
      {weekStarts.map((weekStart, index) => {
        const weekShifts = shifts.filter(
          (shift) =>
            !shift.date.isBefore(weekStart) &&
            shift.date.isBefore(weekStart.addDays(7))
        )
        return (
          <React.Fragment key={weekStart.formatIso()}>
            <Gap $size="s" />
            <Label data-qa="own-shifts-week-label">
              {t.week} {weekStart.getIsoWeek()} ({weekStart.format('d.M.')}–
              {weekStart.addDays(6).format('d.M.yyyy')}){' '}
              {index === 0 ? t.currentWeekMarker : ''}
            </Label>
            <Gap $size="xs" />
            {weekShifts.length === 0 ? (
              <InformationText>{t.noShifts}</InformationText>
            ) : (
              <Table data-qa="own-shifts-table">
                <Thead>
                  <Tr>
                    <Th>{t.date}</Th>
                    <Th>{t.startTime}</Th>
                    <Th>{t.endTime}</Th>
                    {showUnit && <Th>{t.unit}</Th>}
                  </Tr>
                </Thead>
                <Tbody>
                  {weekShifts.map((shift, i) => (
                    <Tr key={i} data-qa="own-shift-row">
                      <Td>{shift.date.format('EEEEEE d.M.', 'fi')}</Td>
                      <Td>{shift.startTime.format()}</Td>
                      <Td>{shift.endTime.format()}</Td>
                      {showUnit && <Td>{shift.unitName}</Td>}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </React.Fragment>
        )
      })}
    </ContentArea>
  )
})

const WishesSection = React.memo(function WishesSection({
  unitId,
  window,
  wishes
}: {
  unitId: DaycareId
  window: FiniteDateRange
  wishes: ShiftWish[]
}) {
  const windowDates = useMemo(() => [...window.dates()], [window])
  const weekStarts = useMemo(
    () => [window.start, window.start.addDays(7), window.start.addDays(14)],
    [window]
  )
  const unitWishes = useMemo(
    () => wishes.filter((wish) => wish.unitId === unitId),
    [wishes, unitId]
  )

  return (
    <>
      <ContentArea $opaque>
        <InfoBox
          message={t.info(
            window.start.format('d.M.'),
            window.end.format('d.M.yyyy')
          )}
          data-qa="shift-wishes-info"
        />
        <AddWishForm
          unitId={unitId}
          windowDates={windowDates}
          usedImportant={
            // Kiintiö on työntekijäkohtainen yksiköstä riippumatta; hylätyt
            // eivät kuluta sitä (vastaa backendin countImportantWishes-laskentaa)
            wishes.filter(
              (wish) => wish.important && wish.status !== 'REJECTED'
            ).length
          }
        />
      </ContentArea>

      <ContentArea $opaque>
        <H3 $noMargin>{t.ownWishes}</H3>
        <Gap $size="s" />
        {unitWishes.length === 0 ? (
          <InformationText data-qa="shift-wishes-empty">
            {t.noWishes}
          </InformationText>
        ) : (
          weekStarts.map((weekStart) => (
            <WishWeek
              key={weekStart.formatIso()}
              weekStart={weekStart}
              wishes={unitWishes.filter(
                (wish) =>
                  !wish.date.isBefore(weekStart) &&
                  wish.date.isBefore(weekStart.addDays(7))
              )}
            />
          ))
        )}
      </ContentArea>
    </>
  )
})

const MAX_IMPORTANT_WISHES = 2

const AddWishForm = React.memo(function AddWishForm({
  unitId,
  windowDates,
  usedImportant
}: {
  unitId: DaycareId
  windowDates: LocalDate[]
  usedImportant: number
}) {
  const [date, setDate] = useState<LocalDate | null>(null)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('15:39')
  const [important, setImportant] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const importantQuotaFull = usedImportant >= MAX_IMPORTANT_WISHES

  const parsedStart = LocalTime.tryParse(startTime)
  const parsedEnd = LocalTime.tryParse(endTime)
  const invalidOrder =
    parsedStart !== undefined &&
    parsedEnd !== undefined &&
    !parsedStart.isBefore(parsedEnd)
  const valid =
    date !== null &&
    parsedStart !== undefined &&
    parsedEnd !== undefined &&
    !invalidOrder

  const { mutateAsync: createWish } = useMutationResult(createShiftWishMutation)

  return (
    <>
      {error !== null && (
        <AlertBox message={error} data-qa="shift-wish-save-error" />
      )}
      <FixedSpaceRow $alignItems="flex-end" $spacing="L">
        <FixedSpaceColumn $spacing="xs">
          <Label>{t.date}</Label>
          <Select
            items={windowDates}
            selectedItem={date}
            onChange={setDate}
            getItemValue={(d) => d.formatIso()}
            getItemLabel={(d) => d.format('EEEEEE d.M.', 'fi')}
            placeholder={t.datePlaceholder}
            data-qa="shift-wish-date-select"
          />
        </FixedSpaceColumn>
        <FixedSpaceColumn $spacing="xs">
          <Label>{t.startTime}</Label>
          <TimeInput
            value={startTime}
            onChange={setStartTime}
            data-qa="shift-wish-start-time"
          />
        </FixedSpaceColumn>
        <FixedSpaceColumn $spacing="xs">
          <Label>{t.endTime}</Label>
          <TimeInput
            value={endTime}
            onChange={setEndTime}
            info={
              invalidOrder
                ? { status: 'warning', text: t.invalidTime }
                : undefined
            }
            data-qa="shift-wish-end-time"
          />
        </FixedSpaceColumn>
        <Checkbox
          label={`★ ${t.important}`}
          checked={important}
          onChange={setImportant}
          disabled={!important && importantQuotaFull}
          data-qa="shift-wish-important-checkbox"
        />
        <AsyncButton
          primary
          text={t.save}
          disabled={!valid}
          onClick={() => {
            setError(null)
            return createWish({
              body: {
                unitId,
                date: date!,
                startTime: parsedStart!,
                endTime: parsedEnd!,
                important
              }
            })
          }}
          onSuccess={() => {
            setDate(null)
            setImportant(false)
          }}
          onFailure={(failure) =>
            setError(
              failure.errorCode === 'WISH_DUPLICATE'
                ? t.duplicateError
                : failure.errorCode === 'WISH_IMPORTANT_LIMIT'
                  ? t.importantLimitError
                  : t.saveError
            )
          }
          data-qa="shift-wish-save-button"
        />
      </FixedSpaceRow>
      <Gap $size="xs" />
      <InformationText data-qa="shift-wish-important-info">
        {t.importantInfo(usedImportant, MAX_IMPORTANT_WISHES)}
      </InformationText>
    </>
  )
})

const WishWeek = React.memo(function WishWeek({
  weekStart,
  wishes
}: {
  weekStart: LocalDate
  wishes: ShiftWish[]
}) {
  const { mutateAsync: deleteWish } = useMutationResult(deleteShiftWishMutation)

  return (
    <>
      <Gap $size="s" />
      <Label data-qa="shift-wish-week-label">
        {t.week} {weekStart.getIsoWeek()} ({weekStart.format('d.M.')}–
        {weekStart.addDays(6).format('d.M.yyyy')})
      </Label>
      <Gap $size="xs" />
      {wishes.length === 0 ? (
        <InformationText>{t.noWishes}</InformationText>
      ) : (
        <Table data-qa="shift-wish-table">
          <Thead>
            <Tr>
              <Th>{t.date}</Th>
              <Th>{t.startTime}</Th>
              <Th>{t.endTime}</Th>
              <Th>{t.status}</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {wishes.map((wish) => (
              <WishRow key={wish.id} wish={wish} onDelete={deleteWish} />
            ))}
          </Tbody>
        </Table>
      )}
    </>
  )
})

const WishRow = React.memo(function WishRow({
  wish,
  onDelete
}: {
  wish: ShiftWish
  onDelete: (arg: { wishId: ShiftWish['id'] }) => Promise<unknown>
}) {
  const modified =
    wish.status === 'APPROVED' &&
    wish.resolvedStartTime !== null &&
    wish.resolvedEndTime !== null &&
    (!wish.resolvedStartTime.isEqual(wish.startTime) ||
      !wish.resolvedEndTime.isEqual(wish.endTime))

  return (
    <Tr data-qa="shift-wish-row">
      <Td>
        {wish.important && (
          <ImportantStar
            title={t.important}
            data-qa="shift-wish-important-star"
          >
            ★{' '}
          </ImportantStar>
        )}
        {wish.date.format('EEEEEE d.M.', 'fi')}
      </Td>
      <Td>{wish.startTime.format()}</Td>
      <Td>{wish.endTime.format()}</Td>
      <Td>
        <StaticChip
          $color={statusColors[wish.status]}
          $fitContent
          data-qa="shift-wish-status"
          data-qa-status={wish.status}
        >
          {t.statuses[wish.status]}
        </StaticChip>
        {modified && (
          <InformationText data-qa="shift-wish-modified">
            {t.approvedWithChanges(
              `${wish.resolvedStartTime!.format()}–${wish.resolvedEndTime!.format()}`
            )}
          </InformationText>
        )}
      </Td>
      <Td>
        {wish.status === 'PENDING' && (
          <IconOnlyButton
            icon={faTrash}
            aria-label={t.removeWish}
            onClick={() => void onDelete({ wishId: wish.id })}
            data-qa="shift-wish-delete-button"
          />
        )}
      </Td>
    </Tr>
  )
})
