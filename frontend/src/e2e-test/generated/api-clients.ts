// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications

import { ApplicationDetails } from 'lib-common/generated/api-types/application'
import { Autocomplete } from './api-types'
import { Caretaker } from './api-types'
import { ChildDailyNoteBody } from 'lib-common/generated/api-types/note'
import { ChildStickyNoteBody } from 'lib-common/generated/api-types/note'
import { Citizen } from './api-types'
import { ClubTerm } from 'lib-common/generated/api-types/daycare'
import { CreateVasuTemplateBody } from './api-types'
import { DailyReservationRequest } from 'lib-common/generated/api-types/reservations'
import { DaycareAclInsert } from './api-types'
import { DaycarePlacementPlan } from 'lib-common/generated/api-types/application'
import { Decision } from 'lib-common/generated/api-types/decision'
import { DecisionRequest } from './api-types'
import { DevAbsence } from './api-types'
import { DevApplicationWithForm } from './api-types'
import { DevAssistanceFactor } from './api-types'
import { DevAssistanceNeedDecision } from './api-types'
import { DevAssistanceNeedPreschoolDecision } from './api-types'
import { DevBackupCare } from './api-types'
import { DevBackupPickup } from './api-types'
import { DevCalendarEvent } from './api-types'
import { DevCalendarEventAttendee } from './api-types'
import { DevCareArea } from './api-types'
import { DevChild } from './api-types'
import { DevChildAttendance } from './api-types'
import { DevChildDocument } from './api-types'
import { DevCreateIncomeStatements } from './api-types'
import { DevDailyServiceTimeNotification } from './api-types'
import { DevDailyServiceTimes } from './api-types'
import { DevDaycare } from './api-types'
import { DevDaycareAssistance } from './api-types'
import { DevDaycareGroup } from './api-types'
import { DevDaycareGroupAcl } from './api-types'
import { DevDaycareGroupPlacement } from './api-types'
import { DevDocumentTemplate } from './api-types'
import { DevEmployee } from './api-types'
import { DevEmployeePin } from './api-types'
import { DevFamilyContact } from './api-types'
import { DevFosterParent } from './api-types'
import { DevFridgeChild } from './api-types'
import { DevFridgePartner } from './api-types'
import { DevGuardian } from './api-types'
import { DevHoliday } from './api-types'
import { DevIncome } from './api-types'
import { DevMobileDevice } from './api-types'
import { DevOtherAssistanceMeasure } from './api-types'
import { DevParentship } from './api-types'
import { DevPayment } from './api-types'
import { DevPedagogicalDocument } from './api-types'
import { DevPerson } from './api-types'
import { DevPersonalMobileDevice } from './api-types'
import { DevPlacement } from './api-types'
import { DevPreschoolAssistance } from './api-types'
import { DevPreschoolTerm } from './api-types'
import { DevServiceNeed } from './api-types'
import { DevStaffAttendance } from './api-types'
import { DevStaffAttendancePlan } from './api-types'
import { DevTerminatePlacementRequest } from './api-types'
import { DevUpsertStaffOccupancyCoefficient } from './api-types'
import { DevVardaReset } from './api-types'
import { DevVardaServiceNeed } from './api-types'
import { Email } from './api-types'
import { Employee } from 'lib-common/generated/api-types/pis'
import { FeeDecision } from 'lib-common/generated/api-types/invoicing'
import { FeeThresholds } from 'lib-common/generated/api-types/invoicing'
import { FixedPeriodQuestionnaireBody } from 'lib-common/generated/api-types/holidayperiod'
import { GroupNoteBody } from 'lib-common/generated/api-types/note'
import { HolidayPeriodBody } from 'lib-common/generated/api-types/holidayperiod'
import { IncomeNotification } from 'lib-common/generated/api-types/invoicing'
import { Invoice } from 'lib-common/generated/api-types/invoicing'
import { JsonCompatible } from 'lib-common/json'
import { JsonOf } from 'lib-common/json'
import { Pairing } from 'lib-common/generated/api-types/pairing'
import { PlacementPlan } from './api-types'
import { PostPairingChallengeReq } from 'lib-common/generated/api-types/pairing'
import { PostPairingReq } from 'lib-common/generated/api-types/pairing'
import { PostPairingResponseReq } from 'lib-common/generated/api-types/pairing'
import { PostVasuDocBody } from './api-types'
import { ServiceNeedOption } from 'lib-common/generated/api-types/serviceneed'
import { SfiMessage } from './api-types'
import { StaffMemberAttendance } from 'lib-common/generated/api-types/attendance'
import { UUID } from 'lib-common/types'
import { VoucherValueDecision } from './api-types'
import { VtjPerson } from './api-types'
import { createUrlSearchParams } from 'lib-common/api'
import { deserializeJsonApplicationDetails } from 'lib-common/generated/api-types/application'
import { deserializeJsonDecision } from 'lib-common/generated/api-types/decision'
import { deserializeJsonEmployee } from 'lib-common/generated/api-types/pis'
import { deserializeJsonPairing } from 'lib-common/generated/api-types/pairing'
import { deserializeJsonStaffMemberAttendance } from 'lib-common/generated/api-types/attendance'
import { deserializeJsonVtjPerson } from './api-types'
import { devClient } from '../dev-api'
import { uri } from 'lib-common/uri'


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.addAbsence
*/
export async function addAbsence(
  request: {
    body: DevAbsence
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/absence`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevAbsence>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.addAclRoleForDaycare
*/
export async function addAclRoleForDaycare(
  request: {
    daycareId: UUID,
    body: DaycareAclInsert
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/daycares/${request.daycareId}/acl`.toString(),
    method: 'PUT',
    data: request.body satisfies JsonCompatible<DaycareAclInsert>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.addCalendarEvent
*/
export async function addCalendarEvent(
  request: {
    body: DevCalendarEvent
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/calendar-event`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevCalendarEvent>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.addCalendarEventAttendee
*/
export async function addCalendarEventAttendee(
  request: {
    body: DevCalendarEventAttendee
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/calendar-event-attendee`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevCalendarEventAttendee>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.addDailyServiceTime
*/
export async function addDailyServiceTime(
  request: {
    body: DevDailyServiceTimes
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/daily-service-time`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevDailyServiceTimes>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.addDailyServiceTimeNotification
*/
export async function addDailyServiceTimeNotification(
  request: {
    body: DevDailyServiceTimeNotification
  }
): Promise<number> {
  const { data: json } = await devClient.request<JsonOf<number>>({
    url: uri`/daily-service-time-notification`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevDailyServiceTimeNotification>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.addPayment
*/
export async function addPayment(
  request: {
    body: DevPayment
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/payments`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevPayment>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.addStaffAttendance
*/
export async function addStaffAttendance(
  request: {
    body: DevStaffAttendance
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/realtime-staff-attendance`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevStaffAttendance>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.addStaffAttendancePlan
*/
export async function addStaffAttendancePlan(
  request: {
    body: DevStaffAttendancePlan
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/staff-attendance-plan`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevStaffAttendancePlan>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.cleanUpMessages
*/
export async function cleanUpMessages(): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/messages/clean-up`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createApplicationPlacementPlan
*/
export async function createApplicationPlacementPlan(
  request: {
    applicationId: UUID,
    body: DaycarePlacementPlan
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/applications/${request.applicationId}/actions/create-placement-plan`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DaycarePlacementPlan>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createApplications
*/
export async function createApplications(
  request: {
    body: DevApplicationWithForm[]
  }
): Promise<UUID[]> {
  const { data: json } = await devClient.request<JsonOf<UUID[]>>({
    url: uri`/applications`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevApplicationWithForm[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createAssistanceFactors
*/
export async function createAssistanceFactors(
  request: {
    body: DevAssistanceFactor[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/assistance-factors`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevAssistanceFactor[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createAssistanceNeedDecisions
*/
export async function createAssistanceNeedDecisions(
  request: {
    body: DevAssistanceNeedDecision[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/assistance-need-decisions`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevAssistanceNeedDecision[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createAssistanceNeedPreschoolDecisions
*/
export async function createAssistanceNeedPreschoolDecisions(
  request: {
    body: DevAssistanceNeedPreschoolDecision[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/assistance-need-preschool-decisions`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevAssistanceNeedPreschoolDecision[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createBackupCares
*/
export async function createBackupCares(
  request: {
    body: DevBackupCare[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/backup-cares`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevBackupCare[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createBackupPickup
*/
export async function createBackupPickup(
  request: {
    body: DevBackupPickup[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/backup-pickup`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevBackupPickup[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createCareAreas
*/
export async function createCareAreas(
  request: {
    body: DevCareArea[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/care-areas`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevCareArea[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createChildDocument
*/
export async function createChildDocument(
  request: {
    body: DevChildDocument
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/child-documents`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevChildDocument>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createChildren
*/
export async function createChildren(
  request: {
    body: DevChild[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/children`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevChild[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createClubTerm
*/
export async function createClubTerm(
  request: {
    body: ClubTerm
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/club-term`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<ClubTerm>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDaycareAssistances
*/
export async function createDaycareAssistances(
  request: {
    body: DevDaycareAssistance[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/daycare-assistances`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevDaycareAssistance[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDaycareCaretakers
*/
export async function createDaycareCaretakers(
  request: {
    body: Caretaker[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/daycare-caretakers`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<Caretaker[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDaycareGroupAclRows
*/
export async function createDaycareGroupAclRows(
  request: {
    body: DevDaycareGroupAcl[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/daycare-group-acl`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevDaycareGroupAcl[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDaycareGroupPlacement
*/
export async function createDaycareGroupPlacement(
  request: {
    body: DevDaycareGroupPlacement[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/daycare-group-placements`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevDaycareGroupPlacement[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDaycareGroups
*/
export async function createDaycareGroups(
  request: {
    body: DevDaycareGroup[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/daycare-groups`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevDaycareGroup[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDaycarePlacements
*/
export async function createDaycarePlacements(
  request: {
    body: DevPlacement[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/daycare-placements`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevPlacement[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDaycares
*/
export async function createDaycares(
  request: {
    body: DevDaycare[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/daycares`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevDaycare[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDecisionPdf
*/
export async function createDecisionPdf(
  request: {
    id: UUID
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/decisions/${request.id}/actions/create-pdf`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDecisions
*/
export async function createDecisions(
  request: {
    body: DecisionRequest[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/decisions`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DecisionRequest[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDefaultPlacementPlan
*/
export async function createDefaultPlacementPlan(
  request: {
    applicationId: UUID
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/applications/${request.applicationId}/actions/create-default-placement-plan`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDefaultServiceNeedOptions
*/
export async function createDefaultServiceNeedOptions(): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/service-need-options`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createDocumentTemplate
*/
export async function createDocumentTemplate(
  request: {
    body: DevDocumentTemplate
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/document-templates`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevDocumentTemplate>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createEmployee
*/
export async function createEmployee(
  request: {
    body: DevEmployee
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/employee`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevEmployee>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createEmployeePins
*/
export async function createEmployeePins(
  request: {
    body: DevEmployeePin[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/employee-pin`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevEmployeePin[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createFamilyContact
*/
export async function createFamilyContact(
  request: {
    body: DevFamilyContact[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/family-contact`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevFamilyContact[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createFeeDecisions
*/
export async function createFeeDecisions(
  request: {
    body: FeeDecision[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/fee-decisions`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<FeeDecision[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createFeeThresholds
*/
export async function createFeeThresholds(
  request: {
    body: FeeThresholds
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/fee-thresholds`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<FeeThresholds>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createFosterParent
*/
export async function createFosterParent(
  request: {
    body: DevFosterParent[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/foster-parent`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevFosterParent[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createFridgeChild
*/
export async function createFridgeChild(
  request: {
    body: DevFridgeChild[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/fridge-child`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevFridgeChild[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createFridgePartner
*/
export async function createFridgePartner(
  request: {
    body: DevFridgePartner[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/fridge-partner`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevFridgePartner[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createHoliday
*/
export async function createHoliday(
  request: {
    body: DevHoliday
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/holiday`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevHoliday>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createHolidayPeriod
*/
export async function createHolidayPeriod(
  request: {
    id: UUID,
    body: HolidayPeriodBody
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/holiday-period/${request.id}`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<HolidayPeriodBody>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createHolidayQuestionnaire
*/
export async function createHolidayQuestionnaire(
  request: {
    id: UUID,
    body: FixedPeriodQuestionnaireBody
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/holiday-period/questionnaire/${request.id}`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<FixedPeriodQuestionnaireBody>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createIncome
*/
export async function createIncome(
  request: {
    body: DevIncome
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/income`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevIncome>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createIncomeNotification
*/
export async function createIncomeNotification(
  request: {
    body: IncomeNotification
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/income-notifications`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<IncomeNotification>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createIncomeStatements
*/
export async function createIncomeStatements(
  request: {
    body: DevCreateIncomeStatements
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/income-statements`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevCreateIncomeStatements>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createInvoices
*/
export async function createInvoices(
  request: {
    body: Invoice[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/invoices`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<Invoice[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createMessageAccounts
*/
export async function createMessageAccounts(): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/message-account/upsert-all`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createOtherAssistanceMeasures
*/
export async function createOtherAssistanceMeasures(
  request: {
    body: DevOtherAssistanceMeasure[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/other-assistance-measures`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevOtherAssistanceMeasure[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createParentships
*/
export async function createParentships(
  request: {
    body: DevParentship[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/parentship`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevParentship[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createPedagogicalDocumentAttachment
*/
export async function createPedagogicalDocumentAttachment(
  request: {
    pedagogicalDocumentId: UUID,
    employeeId: UUID
  }
): Promise<string> {
  const params = createUrlSearchParams(
    ['employeeId', request.employeeId]
  )
  const { data: json } = await devClient.request<JsonOf<string>>({
    url: uri`/pedagogical-document-attachment/${request.pedagogicalDocumentId}`.toString(),
    method: 'POST',
    params
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createPedagogicalDocuments
*/
export async function createPedagogicalDocuments(
  request: {
    body: DevPedagogicalDocument[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/pedagogical-document`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevPedagogicalDocument[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createPerson
*/
export async function createPerson(
  request: {
    body: DevPerson
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/person/create`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevPerson>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createPlacementPlan
*/
export async function createPlacementPlan(
  request: {
    applicationId: UUID,
    body: PlacementPlan
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/placement-plan/${request.applicationId}`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<PlacementPlan>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createPreschoolAssistances
*/
export async function createPreschoolAssistances(
  request: {
    body: DevPreschoolAssistance[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/preschool-assistances`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevPreschoolAssistance[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createPreschoolTerm
*/
export async function createPreschoolTerm(
  request: {
    body: DevPreschoolTerm
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/preschool-term`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevPreschoolTerm>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createServiceNeedOption
*/
export async function createServiceNeedOption(
  request: {
    body: ServiceNeedOption[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/service-need-option`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<ServiceNeedOption[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createServiceNeeds
*/
export async function createServiceNeeds(
  request: {
    body: DevServiceNeed[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/service-need`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevServiceNeed[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createVardaReset
*/
export async function createVardaReset(
  request: {
    body: DevVardaReset
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/varda/reset-child`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevVardaReset>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createVardaServiceNeed
*/
export async function createVardaServiceNeed(
  request: {
    body: DevVardaServiceNeed
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/varda/varda-service-need`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevVardaServiceNeed>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createVasuDocument
*/
export async function createVasuDocument(
  request: {
    body: PostVasuDocBody
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/vasu/doc`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<PostVasuDocBody>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createVasuTemplate
*/
export async function createVasuTemplate(
  request: {
    body: CreateVasuTemplateBody
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/vasu/template`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<CreateVasuTemplateBody>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createVoucherValueDecisions
*/
export async function createVoucherValueDecisions(
  request: {
    body: VoucherValueDecision[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/value-decisions`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<VoucherValueDecision[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.createVoucherValues
*/
export async function createVoucherValues(): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/voucher-values`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.deleteDaycareCostCenter
*/
export async function deleteDaycareCostCenter(
  request: {
    daycareId: UUID
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/daycare/${request.daycareId}/cost-center`.toString(),
    method: 'DELETE'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.deleteVasuTemplates
*/
export async function deleteVasuTemplates(): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/vasu/templates`.toString(),
    method: 'DELETE'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.digitransitAutocomplete
*/
export async function digitransitAutocomplete(): Promise<Autocomplete> {
  const { data: json } = await devClient.request<JsonOf<Autocomplete>>({
    url: uri`/digitransit/autocomplete`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.forceFullVtjRefresh
*/
export async function forceFullVtjRefresh(
  request: {
    person: UUID
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/persons/${request.person}/force-full-vtj-refresh`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.getApplication
*/
export async function getApplication(
  request: {
    applicationId: UUID
  }
): Promise<ApplicationDetails> {
  const { data: json } = await devClient.request<JsonOf<ApplicationDetails>>({
    url: uri`/applications/${request.applicationId}`.toString(),
    method: 'GET'
  })
  return deserializeJsonApplicationDetails(json)
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.getApplicationDecisions
*/
export async function getApplicationDecisions(
  request: {
    applicationId: UUID
  }
): Promise<Decision[]> {
  const { data: json } = await devClient.request<JsonOf<Decision[]>>({
    url: uri`/applications/${request.applicationId}/decisions`.toString(),
    method: 'GET'
  })
  return json.map(e => deserializeJsonDecision(e))
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.getCitizen
*/
export async function getCitizen(
  request: {
    ssn: string
  }
): Promise<Citizen> {
  const { data: json } = await devClient.request<JsonOf<Citizen>>({
    url: uri`/citizen/ssn/${request.ssn}`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.getCitizens
*/
export async function getCitizens(): Promise<Citizen[]> {
  const { data: json } = await devClient.request<JsonOf<Citizen[]>>({
    url: uri`/citizen`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.getEmployees
*/
export async function getEmployees(): Promise<Employee[]> {
  const { data: json } = await devClient.request<JsonOf<Employee[]>>({
    url: uri`/employee`.toString(),
    method: 'GET'
  })
  return json.map(e => deserializeJsonEmployee(e))
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.getMessages
*/
export async function getMessages(): Promise<SfiMessage[]> {
  const { data: json } = await devClient.request<JsonOf<SfiMessage[]>>({
    url: uri`/messages`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.getSentEmails
*/
export async function getSentEmails(): Promise<Email[]> {
  const { data: json } = await devClient.request<JsonOf<Email[]>>({
    url: uri`/emails`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.getStaffAttendances
*/
export async function getStaffAttendances(): Promise<StaffMemberAttendance[]> {
  const { data: json } = await devClient.request<JsonOf<StaffMemberAttendance[]>>({
    url: uri`/realtime-staff-attendance`.toString(),
    method: 'GET'
  })
  return json.map(e => deserializeJsonStaffMemberAttendance(e))
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.getVtjPerson
*/
export async function getVtjPerson(
  request: {
    ssn: string
  }
): Promise<VtjPerson> {
  const { data: json } = await devClient.request<JsonOf<VtjPerson>>({
    url: uri`/vtj-persons/${request.ssn}`.toString(),
    method: 'GET'
  })
  return deserializeJsonVtjPerson(json)
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.insertChild
*/
export async function insertChild(
  request: {
    body: DevPerson
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/child`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevPerson>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.insertGuardians
*/
export async function insertGuardians(
  request: {
    body: DevGuardian[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/guardian`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevGuardian[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postAttendances
*/
export async function postAttendances(
  request: {
    body: DevChildAttendance[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/attendances`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevChildAttendance[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postChildDailyNote
*/
export async function postChildDailyNote(
  request: {
    childId: UUID,
    body: ChildDailyNoteBody
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/children/${request.childId}/child-daily-notes`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<ChildDailyNoteBody>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postChildStickyNote
*/
export async function postChildStickyNote(
  request: {
    childId: UUID,
    body: ChildStickyNoteBody
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/children/${request.childId}/child-sticky-notes`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<ChildStickyNoteBody>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postDigitransitQuery
*/
export async function postDigitransitQuery(
  request: {
    body: string
  }
): Promise<string> {
  const { data: json } = await devClient.request<JsonOf<string>>({
    url: uri`/digitransit/query`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<string>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postGroupNote
*/
export async function postGroupNote(
  request: {
    groupId: UUID,
    body: GroupNoteBody
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/daycare-groups/${request.groupId}/group-notes`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<GroupNoteBody>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postMobileDevice
*/
export async function postMobileDevice(
  request: {
    body: DevMobileDevice
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/mobile/devices`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevMobileDevice>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postPairing
*/
export async function postPairing(
  request: {
    body: PostPairingReq
  }
): Promise<Pairing> {
  const { data: json } = await devClient.request<JsonOf<Pairing>>({
    url: uri`/mobile/pairings`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<PostPairingReq>
  })
  return deserializeJsonPairing(json)
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postPairingChallenge
*/
export async function postPairingChallenge(
  request: {
    body: PostPairingChallengeReq
  }
): Promise<Pairing> {
  const { data: json } = await devClient.request<JsonOf<Pairing>>({
    url: uri`/mobile/pairings/challenge`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<PostPairingChallengeReq>
  })
  return deserializeJsonPairing(json)
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postPairingResponse
*/
export async function postPairingResponse(
  request: {
    id: UUID,
    body: PostPairingResponseReq
  }
): Promise<Pairing> {
  const { data: json } = await devClient.request<JsonOf<Pairing>>({
    url: uri`/mobile/pairings/${request.id}/response`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<PostPairingResponseReq>
  })
  return deserializeJsonPairing(json)
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postPersonalMobileDevice
*/
export async function postPersonalMobileDevice(
  request: {
    body: DevPersonalMobileDevice
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/mobile/personal-devices`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevPersonalMobileDevice>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.postReservations
*/
export async function postReservations(
  request: {
    body: DailyReservationRequest[]
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/reservations`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DailyReservationRequest[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.publishVasuDocument
*/
export async function publishVasuDocument(
  request: {
    documentId: UUID
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/vasu/doc/publish/${request.documentId}`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.putDigitransitAutocomplete
*/
export async function putDigitransitAutocomplete(
  request: {
    body: Autocomplete
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/digitransit/autocomplete`.toString(),
    method: 'PUT',
    data: request.body satisfies JsonCompatible<Autocomplete>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.rejectDecisionByCitizen
*/
export async function rejectDecisionByCitizen(
  request: {
    id: UUID
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/decisions/${request.id}/actions/reject-by-citizen`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.resetDatabase
*/
export async function resetDatabase(): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/reset-db`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.revokeSharingPermission
*/
export async function revokeSharingPermission(
  request: {
    docId: UUID
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/vasu/revokeSharingPermission/${request.docId}`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.runJobs
*/
export async function runJobs(): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/run-jobs`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.setTestMode
*/
export async function setTestMode(
  request: {
    enabled: boolean
  }
): Promise<void> {
  const params = createUrlSearchParams(
    ['enabled', request.enabled.toString()]
  )
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/test-mode`.toString(),
    method: 'POST',
    params
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.simpleAction
*/
export async function simpleAction(
  request: {
    applicationId: UUID,
    action: string
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/applications/${request.applicationId}/actions/${request.action}`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.terminatePlacement
*/
export async function terminatePlacement(
  request: {
    body: DevTerminatePlacementRequest
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/placement/terminate`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevTerminatePlacementRequest>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.upsertPerson
*/
export async function upsertPerson(
  request: {
    body: DevPerson
  }
): Promise<UUID> {
  const { data: json } = await devClient.request<JsonOf<UUID>>({
    url: uri`/person`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevPerson>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.upsertStaffOccupancyCoefficient
*/
export async function upsertStaffOccupancyCoefficient(
  request: {
    body: DevUpsertStaffOccupancyCoefficient
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/occupancy-coefficient`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DevUpsertStaffOccupancyCoefficient>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.shared.dev.DevApi.upsertVtjPerson
*/
export async function upsertVtjPerson(
  request: {
    body: VtjPerson
  }
): Promise<void> {
  const { data: json } = await devClient.request<JsonOf<void>>({
    url: uri`/vtj-persons`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<VtjPerson>
  })
  return json
}
