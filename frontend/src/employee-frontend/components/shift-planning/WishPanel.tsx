// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useMemo, useState } from 'react'
import styled from 'styled-components'

import type { ShiftWishWithEmployee } from 'lib-common/generated/api-types/petajavesi'
import type { DaycareId } from 'lib-common/generated/api-types/shared'
import LocalTime from 'lib-common/local-time'
import { useMutationResult } from 'lib-common/query'
import { StaticChip } from 'lib-components/atoms/Chip'
import { AsyncButton } from 'lib-components/atoms/buttons/AsyncButton'
import TimeInput from 'lib-components/atoms/form/TimeInput'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import { FixedSpaceRow } from 'lib-components/layout/flex-helpers'
import { AlertBox, InfoBox } from 'lib-components/molecules/MessageBoxes'
import { InformationText } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import { theme } from 'lib-customizations/common'
import { shiftPlanningTexts } from 'lib-customizations/petajavesi/shiftPlanning'

import { resolveShiftWishMutation } from './queries'

const t = shiftPlanningTexts.wishes

// Slotti-kohtaiset korostusvärit: samaa vuoroa (sama päivä ja kellonajat)
// toivoneiden rivit merkitään samalla värillä, jotta päällekkäiset toiveet
// erottuvat suunnittelijalle
const slotColors = [
  theme.colors.accents.a8lightBlue,
  theme.colors.accents.a7mint,
  theme.colors.accents.a5orangeLight,
  theme.colors.accents.a9pink,
  theme.colors.accents.a10powder,
  theme.colors.accents.a4violet
]

const statusColors = {
  PENDING: theme.colors.grayscale.g15,
  APPROVED: theme.colors.accents.a3emerald,
  REJECTED: theme.colors.status.danger
}

/** Tähtimerkintä työntekijälle tärkeälle toiveelle */
const ImportantStar = styled.span`
  color: ${theme.colors.accents.a5orangeLight};
  font-weight: bold;
`

const slotKey = (wish: ShiftWishWithEmployee) =>
  `${wish.date.formatIso()}|${wish.startTime.formatIso()}|${wish.endTime.formatIso()}`

export interface ApprovedWishShift {
  employeeId: ShiftWishWithEmployee['employeeId']
  date: ShiftWishWithEmployee['date']
  startTime: LocalTime
  endTime: LocalTime
}

export default React.memo(function WishPanel({
  unitId,
  wishes,
  disabled,
  onApproved
}: {
  unitId: DaycareId
  wishes: ShiftWishWithEmployee[]
  disabled: boolean
  onApproved: (shift: ApprovedWishShift) => void
}) {
  const [error, setError] = useState<string | null>(null)

  // Saman vuoron käsittelemättömät toiveet saavat yhteisen korostusvärin
  const slotColorByKey = useMemo(() => {
    const pendingCounts = new Map<string, number>()
    wishes
      .filter((wish) => wish.status === 'PENDING')
      .forEach((wish) => {
        const key = slotKey(wish)
        pendingCounts.set(key, (pendingCounts.get(key) ?? 0) + 1)
      })
    const colors = new Map<string, { color: string; count: number }>()
    let colorIndex = 0
    wishes.forEach((wish) => {
      const key = slotKey(wish)
      const count = pendingCounts.get(key) ?? 0
      if (count >= 2 && !colors.has(key)) {
        colors.set(key, {
          color: slotColors[colorIndex % slotColors.length],
          count
        })
        colorIndex++
      }
    })
    return colors
  }, [wishes])

  const hasSharedSlots = slotColorByKey.size > 0
  const hasPending = wishes.some((wish) => wish.status === 'PENDING')

  if (wishes.length === 0) {
    return (
      <InformationText data-qa="wish-panel-empty">{t.empty}</InformationText>
    )
  }

  return (
    <>
      {error !== null && (
        <AlertBox message={error} data-qa="wish-resolve-error" />
      )}
      {wishes.some((wish) => wish.important && wish.status === 'PENDING') && (
        <InfoBox message={t.importantInfo} data-qa="wish-important-info" />
      )}
      {hasSharedSlots && (
        <InfoBox message={t.sharedSlotInfo} data-qa="wish-shared-slot-info" />
      )}
      {hasPending && (
        <InformationText data-qa="wish-approve-info">
          {t.approveAddsShiftInfo}
        </InformationText>
      )}
      <Gap $size="s" />
      <Table data-qa="wish-panel-table">
        <Thead>
          <Tr>
            <Th>{t.date}</Th>
            <Th>{t.employee}</Th>
            <Th>{t.time}</Th>
            <Th>{t.status}</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {wishes.map((wish) => (
            <WishRow
              key={wish.id}
              unitId={unitId}
              wish={wish}
              slotHighlight={slotColorByKey.get(slotKey(wish)) ?? null}
              disabled={disabled}
              onApproved={onApproved}
              onError={setError}
            />
          ))}
        </Tbody>
      </Table>
    </>
  )
})

const WishRow = React.memo(function WishRow({
  unitId,
  wish,
  slotHighlight,
  disabled,
  onApproved,
  onError
}: {
  unitId: DaycareId
  wish: ShiftWishWithEmployee
  slotHighlight: { color: string; count: number } | null
  disabled: boolean
  onApproved: (shift: ApprovedWishShift) => void
  onError: (message: string | null) => void
}) {
  const [startTime, setStartTime] = useState(wish.startTime.format())
  const [endTime, setEndTime] = useState(wish.endTime.format())

  const parsedStart = LocalTime.tryParse(startTime)
  const parsedEnd = LocalTime.tryParse(endTime)
  const invalidOrder =
    parsedStart !== undefined &&
    parsedEnd !== undefined &&
    !parsedStart.isBefore(parsedEnd)
  const valid =
    parsedStart !== undefined && parsedEnd !== undefined && !invalidOrder

  const { mutateAsync: resolve } = useMutationResult(resolveShiftWishMutation)

  const pending = wish.status === 'PENDING'
  const modified =
    wish.status === 'APPROVED' &&
    wish.resolvedStartTime !== null &&
    wish.resolvedEndTime !== null &&
    (!wish.resolvedStartTime.isEqual(wish.startTime) ||
      !wish.resolvedEndTime.isEqual(wish.endTime))
  const rowStyle =
    slotHighlight !== null && pending
      ? { backgroundColor: `${slotHighlight.color}40` }
      : undefined

  return (
    <Tr style={rowStyle} data-qa="wish-row" data-qa-status={wish.status}>
      <Td>
        {wish.important && (
          <ImportantStar title={t.important} data-qa="wish-important-star">
            ★{' '}
          </ImportantStar>
        )}
        {wish.date.format('EEEEEE d.M.', 'fi')}
      </Td>
      <Td>
        {wish.lastName} {wish.firstName}
      </Td>
      <Td>
        {pending ? (
          <FixedSpaceRow $spacing="xs" $alignItems="center">
            <TimeInput
              value={startTime}
              onChange={setStartTime}
              readonly={disabled}
              data-qa="wish-start-time"
            />
            <span>–</span>
            <TimeInput
              value={endTime}
              onChange={setEndTime}
              readonly={disabled}
              info={
                invalidOrder
                  ? {
                      status: 'warning',
                      text: shiftPlanningTexts.shifts.invalidTime
                    }
                  : undefined
              }
              data-qa="wish-end-time"
            />
          </FixedSpaceRow>
        ) : modified ? (
          <>
            <s>
              {wish.startTime.format()}–{wish.endTime.format()}
            </s>{' '}
            {wish.resolvedStartTime!.format()}–{wish.resolvedEndTime!.format()}
            <div>
              <InformationText data-qa="wish-modified-marker">
                {t.modifiedMarker}
              </InformationText>
            </div>
          </>
        ) : (
          <>
            {wish.startTime.format()}–{wish.endTime.format()}
          </>
        )}
      </Td>
      <Td>
        <FixedSpaceRow $spacing="xs" $alignItems="center">
          {pending && wish.important && (
            <StaticChip
              $color={theme.colors.accents.a5orangeLight}
              $fitContent
              data-qa="wish-important-chip"
            >
              ★ {t.important}
            </StaticChip>
          )}
          {pending && slotHighlight !== null ? (
            <StaticChip
              $color={slotHighlight.color}
              $fitContent
              data-qa="wish-shared-slot-chip"
            >
              {t.sharedSlot(slotHighlight.count)}
            </StaticChip>
          ) : (
            <StaticChip
              $color={statusColors[wish.status]}
              $fitContent
              data-qa="wish-status-chip"
              data-qa-status={wish.status}
            >
              {wish.status === 'PENDING'
                ? t.pending
                : wish.status === 'APPROVED'
                  ? t.approved
                  : t.rejected}
            </StaticChip>
          )}
        </FixedSpaceRow>
      </Td>
      <Td>
        {pending && (
          <FixedSpaceRow $spacing="xs">
            <AsyncButton
              primary
              text={t.approve}
              disabled={disabled || !valid}
              onClick={() => {
                onError(null)
                // Kutsutaan onApproved heti mutaation onnistuttua eikä
                // AsyncButtonin onSuccessissa: tilan päivittyminen unmounttaa
                // painikkeen ennen onSuccess-viivettä, jolloin callback jäisi
                // ajamatta eikä vuoro päätyisi editorin riveihin
                return resolve({
                  unitId,
                  wishId: wish.id,
                  body: {
                    status: 'APPROVED',
                    startTime: parsedStart!,
                    endTime: parsedEnd!
                  }
                }).then((result) => {
                  if (result.isSuccess) {
                    onApproved({
                      employeeId: wish.employeeId,
                      date: wish.date,
                      startTime: parsedStart!,
                      endTime: parsedEnd!
                    })
                  }
                  return result
                })
              }}
              onSuccess={() => undefined}
              onFailure={() => onError(t.resolveError)}
              data-qa="wish-approve-button"
            />
            <AsyncButton
              text={t.reject}
              disabled={disabled}
              onClick={() => {
                onError(null)
                return resolve({
                  unitId,
                  wishId: wish.id,
                  body: { status: 'REJECTED', startTime: null, endTime: null }
                })
              }}
              onFailure={() => onError(t.resolveError)}
              data-qa="wish-reject-button"
            />
          </FixedSpaceRow>
        )}
      </Td>
    </Tr>
  )
})
