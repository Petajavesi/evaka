// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications

import HelsinkiDateTime from '../../helsinki-date-time'
import { Id } from '../../id-type'
import { JsonOf } from '../../json'

export type ApplicationId = Id<'Application'>

export type ApplicationNoteId = Id<'ApplicationNote'>

export type ArchivedProcessId = Id<'ArchivedProcess'>

export type AreaId = Id<'Area'>

export type AssistanceActionId = Id<'AssistanceAction'>

export type AssistanceFactorId = string

export type AssistanceNeedDecisionGuardianId = string

export type AssistanceNeedDecisionId = string

export type AssistanceNeedPreschoolDecisionGuardianId = string

export type AssistanceNeedPreschoolDecisionId = string

export type AssistanceNeedVoucherCoefficientId = string

export type AttachmentId = string

export type BackupCareId = string

export type BackupPickupId = string

export type CalendarEventAttendeeId = string

export type CalendarEventTimeId = string

export type ChildDailyNoteId = string

export type ChildDocumentId = string

export type ChildImageId = string

export type ChildStickyNoteId = string

/**
* Generated from fi.espoo.evaka.shared.auth.CitizenAuthLevel
*/
export type CitizenAuthLevel =
  | 'WEAK'
  | 'STRONG'

/**
* Generated from fi.espoo.evaka.shared.security.CitizenFeatures
*/
export interface CitizenFeatures {
  childDocumentation: boolean
  composeNewMessage: boolean
  messages: boolean
  reservations: boolean
}

export type ClubTermId = string

/**
* Generated from fi.espoo.evaka.shared.domain.Coordinate
*/
export interface Coordinate {
  lat: number
  lon: number
}

export type DailyServicesTimeId = string

export type DailyServicesTimeNotificationId = string

/**
* Generated from fi.espoo.evaka.shared.auth.DaycareAclRow
*/
export interface DaycareAclRow {
  employee: DaycareAclRowEmployee
  groupIds: GroupId[]
  role: UserRole
}

/**
* Generated from fi.espoo.evaka.shared.auth.DaycareAclRowEmployee
*/
export interface DaycareAclRowEmployee {
  active: boolean
  email: string | null
  firstName: string
  hasStaffOccupancyEffect: boolean | null
  id: EmployeeId
  lastName: string
  temporary: boolean
}

export type DaycareAssistanceId = string

export type DaycareCaretakerId = string

export type DaycareId = string

export type DecisionId = string

export type DocumentTemplateId = string

/**
* Generated from fi.espoo.evaka.shared.security.EmployeeFeatures
*/
export interface EmployeeFeatures {
  applications: boolean
  assistanceNeedDecisionsReport: boolean
  createDraftInvoices: boolean
  createPlacements: boolean
  createUnits: boolean
  documentTemplates: boolean
  employees: boolean
  finance: boolean
  financeBasics: boolean
  holidayAndTermPeriods: boolean
  messages: boolean
  personSearch: boolean
  personalMobileDevice: boolean
  pinCode: boolean
  placementTool: boolean
  replacementInvoices: boolean
  reports: boolean
  settings: boolean
  submitPatuReport: boolean
  systemNotifications: boolean
  unitFeatures: boolean
  units: boolean
}

export type EmployeeId = string

export type EvakaUserId = string

export type FeeAlterationId = string

export type FeeDecisionId = string

export type FeeThresholdsId = string

export type FosterParentId = string

export type GroupId = string

export type GroupNoteId = string

export type GroupPlacementId = string

/**
* Generated from fi.espoo.evaka.shared.domain.HelsinkiDateTimeRange
*/
export interface HelsinkiDateTimeRange {
  end: HelsinkiDateTime
  start: HelsinkiDateTime
}

export type HolidayPeriodId = string

export type HolidayQuestionnaireId = string

export type IncomeId = string

export type IncomeStatementId = string

export type InvoiceCorrectionId = string

export type InvoiceId = string

export type InvoiceRowId = string

export type MessageAccountId = string

export type MessageContentId = string

export type MessageDraftId = string

export type MessageId = string

export type MessageThreadId = string

export type MobileDeviceId = string

/**
* Generated from fi.espoo.evaka.shared.domain.OfficialLanguage
*/
export const officialLanguages = [
  'FI',
  'SV'
] as const

export type OfficialLanguage = typeof officialLanguages[number]

export type OtherAssistanceMeasureId = string

export type PairingId = string

export type ParentshipId = string

export type PartnershipId = string

export type PaymentId = string

export type PedagogicalDocumentId = string

export type PersonId = string

/**
* Generated from fi.espoo.evaka.shared.security.PilotFeature
*/
export const pilotFeatures = [
  'MESSAGING',
  'MOBILE',
  'RESERVATIONS',
  'VASU_AND_PEDADOC',
  'MOBILE_MESSAGING',
  'PLACEMENT_TERMINATION',
  'REALTIME_STAFF_ATTENDANCE',
  'PUSH_NOTIFICATIONS',
  'SERVICE_APPLICATIONS'
] as const

export type PilotFeature = typeof pilotFeatures[number]

export type PlacementId = string

export type PlacementPlanId = string

export type PreschoolAssistanceId = string

export type PreschoolTermId = string

export type ServiceApplicationId = string

export type ServiceNeedId = string

export type ServiceNeedOptionId = Id<'ServiceNeedOption'>

export type ServiceNeedOptionVoucherValueId = string

export type StaffAttendanceExternalId = string

export type StaffAttendanceRealtimeId = string

/**
* Generated from fi.espoo.evaka.shared.domain.Translatable
*/
export interface Translatable {
  en: string
  fi: string
  sv: string
}

/**
* Generated from fi.espoo.evaka.shared.auth.UserRole
*/
export type UserRole =
  | 'END_USER'
  | 'CITIZEN_WEAK'
  | 'ADMIN'
  | 'REPORT_VIEWER'
  | 'DIRECTOR'
  | 'FINANCE_ADMIN'
  | 'FINANCE_STAFF'
  | 'SERVICE_WORKER'
  | 'MESSAGING'
  | 'UNIT_SUPERVISOR'
  | 'STAFF'
  | 'SPECIAL_EDUCATION_TEACHER'
  | 'EARLY_CHILDHOOD_EDUCATION_SECRETARY'
  | 'MOBILE'
  | 'GROUP_STAFF'

export type VoucherValueDecisionId = string


export function deserializeJsonHelsinkiDateTimeRange(json: JsonOf<HelsinkiDateTimeRange>): HelsinkiDateTimeRange {
  return {
    ...json,
    end: HelsinkiDateTime.parseIso(json.end),
    start: HelsinkiDateTime.parseIso(json.start)
  }
}
