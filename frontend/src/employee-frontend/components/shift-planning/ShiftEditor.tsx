// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useMemo, useState } from 'react'

import type {
  ShiftPlanEmployee,
  ShiftPlanWeekResponse
} from 'lib-common/generated/api-types/petajavesi'
import type { EmployeeId } from 'lib-common/generated/api-types/shared'
import type LocalDate from 'lib-common/local-date'
import { useMutationResult } from 'lib-common/query'
import AddButton from 'lib-components/atoms/buttons/AddButton'
import { AsyncButton } from 'lib-components/atoms/buttons/AsyncButton'
import { Button } from 'lib-components/atoms/buttons/Button'
import { IconOnlyButton } from 'lib-components/atoms/buttons/IconOnlyButton'
import LinkButton from 'lib-components/atoms/buttons/LinkButton'
import Select from 'lib-components/atoms/dropdowns/Select'
import MultiSelect from 'lib-components/atoms/form/MultiSelect'
import TimeInput from 'lib-components/atoms/form/TimeInput'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import { FixedSpaceRow } from 'lib-components/layout/flex-helpers'
import { AlertBox, InfoBox } from 'lib-components/molecules/MessageBoxes'
import { H3, InformationText } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import { shiftPlanningTexts as t } from 'lib-customizations/petajavesi/shiftPlanning'
import { faTrash } from 'lib-icons'

import {
  getEmployeePdf,
  getEmployeesPdf,
  getPdf
} from '../../generated/api-clients/petajavesi'

import StaffingNeedChart from './StaffingNeedChart'
import StaffingNeedTable from './StaffingNeedTable'
import WeeklyHoursSummary from './WeeklyHoursSummary'
import type { ApprovedWishShift } from './WishPanel'
import WishPanel from './WishPanel'
import type { DraftShiftGroup } from './calc'
import {
  approvedWishShifts,
  groupsFromPlan,
  hasInvalidTimeOrder,
  parseDraftGroup,
  plannedMinutesByEmployee,
  subtractShiftsFromNeed,
  suggestEmployeeAssignments,
  suggestShiftGroups
} from './calc'
import { ViewModeToggle } from './chartCommon'
import { updateShiftPlanMutation } from './queries'

let draftKeyCounter = 0
const nextDraftKey = () => `draft-${draftKeyCounter++}`

interface Props {
  response: ShiftPlanWeekResponse
}

export default React.memo(function ShiftEditor({ response }: Props) {
  const weekDates = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((i) => response.weekStart.addDays(i)),
    [response.weekStart]
  )

  // Ilman tallennettua suunnitelmaa vuororivit esitäytetään ehdotuksella, joka
  // lasketaan lasten tulo- ja lähtöajoista. Hyväksytyt työvuorotoiveet ovat
  // ensisijaisia: ne säilytetään ja ehdotus täyttää vain jäljelle jäävän
  // tarpeen (Req 14).
  const [drafts, setDrafts] = useState<DraftShiftGroup[]>(() => {
    const fromPlan = groupsFromPlan(response.plan?.shifts ?? [], nextDraftKey)
    if (fromPlan.length > 0) return fromPlan
    const approved = approvedWishShifts(response.wishes)
    return [
      ...groupsFromPlan(approved, nextDraftKey),
      ...suggestShiftGroups(
        subtractShiftsFromNeed(response.staffingNeed, approved),
        nextDraftKey
      )
    ]
  })
  const [showSuggestionInfo, setShowSuggestionInfo] = useState(
    () =>
      (response.plan?.shifts ?? []).length === 0 &&
      response.staffingNeed.some((day) =>
        day.slots.some((slot) => slot.requiredStaff > 0)
      )
  )
  // Req 8.5: tallennusvirheen jälkeen muokkaus on estetty kunnes tallennus onnistuu
  const [saveBlocked, setSaveBlocked] = useState(false)

  // Työntekijäehdotus odottaa suunnittelijan hyväksyntää: rivit, joihin ehdotus
  // lisättiin. Tallennus on estetty, kunnes ehdotus on hyväksytty tai hylätty.
  const [pendingAssignments, setPendingAssignments] =
    useState<Set<string> | null>(null)

  // Työntekijän suunniteltu työaika tasoittumisjaksolla ilman tämän viikon
  // vuoroja — ehdotus tasaa kertymiä jakson sisällä
  const assignmentBaseline = useMemo(() => {
    const savedWeek = plannedMinutesByEmployee(response.plan?.shifts ?? [])
    return new Map(
      response.employees.map((employee) => [
        employee.id,
        (response.periodMinutes.find((m) => m.employeeId === employee.id)
          ?.plannedMinutes ?? 0) - (savedWeek.get(employee.id) ?? 0)
      ])
    )
  }, [response])

  // "Luo ehdotus varauksista" (Req 14): hyväksytyt toivevuorot säilytetään,
  // ehdotus täyttää vain niiltä puuttuvan tarpeen, ja lopuksi tyhjiin
  // vuoroihin ehdotetaan työntekijät (hyväksyntäkierto, Req 11.6)
  const suggestFromReservations = () => {
    const approved = approvedWishShifts(response.wishes)
    const combined = [
      ...groupsFromPlan(approved, nextDraftKey),
      ...suggestShiftGroups(
        subtractShiftsFromNeed(response.staffingNeed, approved),
        nextDraftKey
      )
    ]
    const assignments = suggestEmployeeAssignments(
      combined,
      response.employees.map((employee) => employee.id),
      assignmentBaseline
    )
    setDrafts(
      combined.map((group) => {
        const suggested = assignments.get(group.key)
        return suggested !== undefined
          ? { ...group, employeeIds: suggested }
          : group
      })
    )
    setShowSuggestionInfo(true)
    setPendingAssignments(
      assignments.size > 0 ? new Set(assignments.keys()) : null
    )
  }

  const suggestEmployees = () => {
    const assignments = suggestEmployeeAssignments(
      drafts,
      response.employees.map((employee) => employee.id),
      assignmentBaseline
    )
    if (assignments.size === 0) return
    setDrafts((prev) =>
      prev.map((group) => {
        const suggested = assignments.get(group.key)
        return suggested !== undefined
          ? { ...group, employeeIds: suggested }
          : group
      })
    )
    setPendingAssignments(new Set(assignments.keys()))
  }

  const rejectAssignments = () => {
    if (pendingAssignments === null) return
    setDrafts((prev) =>
      prev.map((group) =>
        pendingAssignments.has(group.key)
          ? { ...group, employeeIds: [] }
          : group
      )
    )
    setPendingAssignments(null)
  }

  const parsedShifts = useMemo(
    () => drafts.flatMap((group) => parseDraftGroup(group) ?? []),
    [drafts]
  )
  const hasInvalidDrafts = drafts.some(
    (group) => parseDraftGroup(group) === null
  )

  const { mutateAsync: savePlan } = useMutationResult(updateShiftPlanMutation)

  const updateDraft = (key: string, patch: Partial<DraftShiftGroup>) =>
    setDrafts((prev) =>
      prev.map((group) => (group.key === key ? { ...group, ...patch } : group))
    )

  const editingDisabled = saveBlocked
  const [needView, setNeedView] = useState<'list' | 'chart'>('chart')

  // Työntekijäkohtaiset tulosteet: valittavana tallennetussa suunnitelmassa
  // vuoroja saaneet työntekijät
  const planEmployees = useMemo(() => {
    const idsInPlan = new Set(
      (response.plan?.shifts ?? []).map((shift) => shift.employeeId)
    )
    return response.employees.filter((employee) => idsInPlan.has(employee.id))
  }, [response])
  const [pdfEmployeeId, setPdfEmployeeId] = useState<EmployeeId | null>(null)
  const selectedPdfEmployee =
    planEmployees.find((employee) => employee.id === pdfEmployeeId) ?? null

  return (
    <>
      <ViewModeToggle
        mode={needView}
        onChange={setNeedView}
        data-qa="staffing-need-view-toggle"
      />
      <Gap $size="s" />
      {needView === 'list' ? (
        <StaffingNeedTable
          staffingNeed={response.staffingNeed}
          occupancy={response.occupancy}
          shifts={parsedShifts}
          staffAttendances={response.staffAttendances}
        />
      ) : (
        <StaffingNeedChart
          staffingNeed={response.staffingNeed}
          shifts={parsedShifts}
          staffAttendances={response.staffAttendances}
        />
      )}

      <Gap $size="m" />
      <H3 $noMargin>{t.wishes.title}</H3>
      <Gap $size="s" />
      {/* Toiveen hyväksyntä tallentuu heti backendiin; vuoro lisätään myös
          editorin riveihin, jotta koko viikon tallennus (replace) ei pyyhi sitä */}
      <WishPanel
        unitId={response.unitId}
        wishes={response.wishes}
        disabled={editingDisabled}
        onApproved={(shift: ApprovedWishShift) =>
          setDrafts((prev) => [
            ...prev,
            {
              key: nextDraftKey(),
              dates: [shift.date],
              startTime: shift.startTime.format(),
              endTime: shift.endTime.format(),
              employeeIds: [shift.employeeId]
            }
          ])
        }
      />

      <Gap $size="m" />
      <H3 $noMargin>{t.shifts.title}</H3>
      <Gap $size="s" />

      {saveBlocked && (
        <AlertBox message={t.saveError} data-qa="shift-planning-save-error" />
      )}

      {showSuggestionInfo && (
        <InfoBox
          message={t.shifts.suggestionInfo}
          data-qa="shift-suggestion-info"
        />
      )}

      {pendingAssignments !== null && (
        <>
          <InfoBox
            message={t.shifts.assignmentPendingInfo}
            data-qa="assignment-pending-info"
          />
          <FixedSpaceRow $spacing="m">
            <Button
              primary
              text={t.shifts.acceptAssignments}
              onClick={() => setPendingAssignments(null)}
              data-qa="accept-assignments-button"
            />
            <Button
              text={t.shifts.rejectAssignments}
              onClick={rejectAssignments}
              data-qa="reject-assignments-button"
            />
          </FixedSpaceRow>
          <Gap $size="s" />
        </>
      )}

      {drafts.length > 0 && (
        <Table data-qa="shift-editor-table">
          <Thead>
            <Tr>
              <Th>{t.shifts.days}</Th>
              <Th>{t.shifts.startTime}</Th>
              <Th>{t.shifts.endTime}</Th>
              <Th>{t.shifts.employees}</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {drafts.map((group) => (
              <ShiftGroupRow
                key={group.key}
                group={group}
                employees={response.employees}
                weekDates={weekDates}
                disabled={editingDisabled}
                suggested={pendingAssignments?.has(group.key) ?? false}
                onChange={(patch) => updateDraft(group.key, patch)}
                onRemove={() =>
                  setDrafts((prev) => prev.filter((g) => g.key !== group.key))
                }
              />
            ))}
          </Tbody>
        </Table>
      )}

      <Gap $size="s" />
      <FixedSpaceRow $spacing="L" $alignItems="center">
        <AddButton
          text={t.shifts.addShift}
          disabled={editingDisabled}
          onClick={() =>
            setDrafts((prev) => [
              ...prev,
              {
                key: nextDraftKey(),
                // Esitäyttö arkipäivillä (Req 12.6) ja KVTES-oletusvuorolla
                dates: weekDates.slice(0, 5),
                startTime: '08:00',
                endTime: '15:39',
                employeeIds: []
              }
            ])
          }
          data-qa="add-shift-button"
        />
        <Button
          appearance="inline"
          text={t.shifts.suggest}
          disabled={editingDisabled}
          onClick={suggestFromReservations}
          data-qa="suggest-shifts-button"
        />
        <Button
          appearance="inline"
          text={t.shifts.suggestEmployees}
          disabled={
            editingDisabled ||
            pendingAssignments !== null ||
            !drafts.some((group) => group.employeeIds.length === 0)
          }
          onClick={suggestEmployees}
          data-qa="suggest-employees-button"
        />
        <AsyncButton
          primary
          text={t.shifts.save}
          disabled={hasInvalidDrafts || pendingAssignments !== null}
          onClick={() =>
            savePlan({
              unitId: response.unitId,
              weekStart: response.weekStart,
              body: {
                shifts: parsedShifts.map((shift) => ({
                  employeeId: shift.employeeId,
                  date: shift.date,
                  startTime: shift.startTime,
                  endTime: shift.endTime
                }))
              }
            })
          }
          onSuccess={() => setSaveBlocked(false)}
          onFailure={() => setSaveBlocked(true)}
          data-qa="save-shift-plan-button"
        />
        {response.plan !== null ? (
          <LinkButton
            href={getPdf({
              unitId: response.unitId,
              weekStart: response.weekStart
            }).url.toString()}
            data-qa="download-pdf-button"
          >
            {t.shifts.downloadPdf}
          </LinkButton>
        ) : (
          <span data-qa="pdf-requires-save">{t.shifts.pdfRequiresSave}</span>
        )}
      </FixedSpaceRow>

      {response.plan !== null && planEmployees.length > 0 && (
        <>
          <Gap $size="m" />
          <H3 $noMargin>{t.shifts.printoutsTitle}</H3>
          <Gap $size="s" />
          <FixedSpaceRow $spacing="L" $alignItems="center">
            <LinkButton
              href={getEmployeesPdf({
                unitId: response.unitId,
                weekStart: response.weekStart
              }).url.toString()}
              data-qa="download-employees-pdf-button"
            >
              {t.shifts.downloadEmployeesPdf}
            </LinkButton>
            <Select
              items={planEmployees}
              selectedItem={selectedPdfEmployee}
              onChange={(employee) => setPdfEmployeeId(employee?.id ?? null)}
              getItemValue={(employee) => employee.id}
              getItemLabel={(employee) =>
                `${employee.lastName} ${employee.firstName}`
              }
              placeholder={t.shifts.employeePdfPlaceholder}
              data-qa="employee-pdf-select"
            />
            {selectedPdfEmployee !== null && (
              <LinkButton
                href={getEmployeePdf({
                  unitId: response.unitId,
                  weekStart: response.weekStart,
                  employeeId: selectedPdfEmployee.id
                }).url.toString()}
                data-qa="download-employee-pdf-button"
              >
                {t.shifts.downloadEmployeePdf}
              </LinkButton>
            )}
          </FixedSpaceRow>
        </>
      )}

      <Gap $size="m" />
      <H3 $noMargin>{t.weeklyHours.title}</H3>
      <Gap $size="s" />
      <WeeklyHoursSummary response={response} shifts={parsedShifts} />
    </>
  )
})

const ShiftGroupRow = React.memo(function ShiftGroupRow({
  group,
  employees,
  weekDates,
  disabled,
  suggested,
  onChange,
  onRemove
}: {
  group: DraftShiftGroup
  employees: ShiftPlanEmployee[]
  weekDates: LocalDate[]
  disabled: boolean
  suggested: boolean
  onChange: (patch: Partial<DraftShiftGroup>) => void
  onRemove: () => void
}) {
  const selectedEmployees = useMemo(
    () =>
      group.employeeIds.flatMap(
        (id) => employees.find((employee) => employee.id === id) ?? []
      ),
    [group.employeeIds, employees]
  )
  const selectedDates = useMemo(
    () =>
      weekDates.filter((date) =>
        group.dates.some((selected) => selected.isEqual(date))
      ),
    [group.dates, weekDates]
  )
  const invalidOrder = hasInvalidTimeOrder(group)

  return (
    <Tr data-qa="shift-row">
      <Td style={{ minWidth: '260px' }}>
        <MultiSelect
          value={selectedDates}
          options={weekDates}
          getOptionId={(date) => date.formatIso()}
          getOptionLabel={(date) => date.format('EEEEEE d.M.', 'fi')}
          onChange={(dates) => onChange({ dates })}
          placeholder={t.shifts.daysPlaceholder}
          closeMenuOnSelect={false}
          data-qa="shift-date-multiselect"
        />
        {group.dates.length === 0 && (
          <InformationText data-qa="shift-no-days-warning">
            {t.shifts.noDays}
          </InformationText>
        )}
      </Td>
      <Td>
        <TimeInput
          value={group.startTime}
          onChange={(startTime) => onChange({ startTime })}
          readonly={disabled}
          data-qa="shift-start-time"
        />
      </Td>
      <Td>
        <TimeInput
          value={group.endTime}
          onChange={(endTime) => onChange({ endTime })}
          readonly={disabled}
          info={
            invalidOrder
              ? { status: 'warning', text: t.shifts.invalidTime }
              : undefined
          }
          data-qa="shift-end-time"
        />
      </Td>
      <Td style={{ minWidth: '320px' }}>
        <MultiSelect
          value={selectedEmployees}
          options={employees}
          getOptionId={(employee) => employee.id}
          getOptionLabel={(employee) =>
            `${employee.lastName} ${employee.firstName}`
          }
          onChange={(selected) =>
            onChange({ employeeIds: selected.map((employee) => employee.id) })
          }
          placeholder={t.shifts.employeesPlaceholder}
          data-qa="shift-employee-multiselect"
        />
        {group.employeeIds.length === 0 && (
          <InformationText data-qa="shift-no-employees-warning">
            {t.shifts.noEmployees}
          </InformationText>
        )}
        {suggested && group.employeeIds.length > 0 && (
          <InformationText data-qa="suggested-employee-marker">
            {t.shifts.suggestedEmployeeMarker}
          </InformationText>
        )}
      </Td>
      <Td>
        <IconOnlyButton
          icon={faTrash}
          aria-label={t.shifts.removeShift}
          disabled={disabled}
          onClick={onRemove}
          data-qa="remove-shift-button"
        />
      </Td>
    </Tr>
  )
})
