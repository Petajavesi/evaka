// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications

import FiniteDateRange from '../../finite-date-range'
import HelsinkiDateTime from '../../helsinki-date-time'
import LocalDate from '../../local-date'
import { Action } from '../action'
import { ApplicationId } from './shared'
import { DaycareId } from './shared'
import { EvakaUser } from './user'
import { GroupId } from './shared'
import { GroupPlacementId } from './shared'
import { JsonOf } from '../../json'
import { Language } from './daycare'
import { PersonId } from './shared'
import { PilotFeature } from './shared'
import { PlacementId } from './shared'
import { PlacementPlanId } from './shared'
import { ProviderType } from './daycare'
import { ServiceNeed } from './serviceneed'
import { ServiceNeedId } from './shared'
import { Unit } from './children'
import { deserializeJsonServiceNeed } from './serviceneed'

/**
* Generated from fi.espoo.evaka.placement.ChildBasics
*/
export interface ChildBasics {
  dateOfBirth: LocalDate
  firstName: string
  id: PersonId
  lastName: string
  socialSecurityNumber: string | null
}

/**
* Generated from fi.espoo.evaka.placement.ChildPlacement
*/
export interface ChildPlacement {
  childId: PersonId
  endDate: LocalDate
  id: PlacementId
  startDate: LocalDate
  terminatable: boolean
  terminatedBy: EvakaUser | null
  terminationRequestedDate: LocalDate | null
  type: PlacementType
  unitId: DaycareId
  unitName: string
}

/**
* Generated from fi.espoo.evaka.placement.PlacementControllerCitizen.ChildPlacementResponse
*/
export interface ChildPlacementResponse {
  placements: TerminatablePlacementGroup[]
}

/**
* Generated from fi.espoo.evaka.placement.DaycareBasics
*/
export interface DaycareBasics {
  area: string
  enabledPilotFeatures: PilotFeature[]
  id: DaycareId
  language: Language
  name: string
  providerType: ProviderType
}

/**
* Generated from fi.espoo.evaka.placement.DaycareGroupPlacement
*/
export interface DaycareGroupPlacement {
  daycarePlacementId: PlacementId
  endDate: LocalDate
  groupId: GroupId | null
  groupName: string | null
  id: GroupPlacementId | null
  startDate: LocalDate
}

/**
* Generated from fi.espoo.evaka.placement.DaycarePlacementWithDetails
*/
export interface DaycarePlacementWithDetails {
  child: ChildBasics
  daycare: DaycareBasics
  defaultServiceNeedOptionNameFi: string | null
  endDate: LocalDate
  groupPlacements: DaycareGroupPlacement[]
  id: PlacementId
  isRestrictedFromUser: boolean
  missingServiceNeedDays: number
  modifiedAt: HelsinkiDateTime | null
  modifiedBy: EvakaUser | null
  placeGuarantee: boolean
  serviceNeeds: ServiceNeed[]
  startDate: LocalDate
  terminatedBy: EvakaUser | null
  terminationRequestedDate: LocalDate | null
  type: PlacementType
}

/**
* Generated from fi.espoo.evaka.placement.GroupPlacementRequestBody
*/
export interface GroupPlacementRequestBody {
  endDate: LocalDate
  groupId: GroupId
  startDate: LocalDate
}

/**
* Generated from fi.espoo.evaka.placement.GroupTransferRequestBody
*/
export interface GroupTransferRequestBody {
  groupId: GroupId
  startDate: LocalDate
}

/**
* Generated from fi.espoo.evaka.placement.MissingGroupPlacement
*/
export interface MissingGroupPlacement {
  backup: boolean
  childId: PersonId
  dateOfBirth: LocalDate
  defaultServiceNeedOptionNameFi: string | null
  firstName: string
  fromUnits: string[]
  gap: FiniteDateRange
  lastName: string
  placementId: PlacementId
  placementPeriod: FiniteDateRange
  placementType: PlacementType | null
  serviceNeeds: MissingGroupPlacementServiceNeed[]
}

/**
* Generated from fi.espoo.evaka.placement.MissingGroupPlacementServiceNeed
*/
export interface MissingGroupPlacementServiceNeed {
  endDate: LocalDate
  nameFi: string
  startDate: LocalDate
}

/**
* Generated from fi.espoo.evaka.placement.PlacementCreateRequestBody
*/
export interface PlacementCreateRequestBody {
  childId: PersonId
  endDate: LocalDate
  placeGuarantee: boolean
  startDate: LocalDate
  type: PlacementType
  unitId: DaycareId
}

/**
* Generated from fi.espoo.evaka.placement.PlacementDraftChild
*/
export interface PlacementDraftChild {
  dob: LocalDate
  firstName: string
  id: PersonId
  lastName: string
}

/**
* Generated from fi.espoo.evaka.placement.PlacementDraftUnit
*/
export interface PlacementDraftUnit {
  id: DaycareId
  name: string
}

/**
* Generated from fi.espoo.evaka.placement.PlacementPlanChild
*/
export interface PlacementPlanChild {
  dateOfBirth: LocalDate
  firstName: string
  id: PersonId
  lastName: string
}

/**
* Generated from fi.espoo.evaka.placement.PlacementPlanConfirmationStatus
*/
export type PlacementPlanConfirmationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'REJECTED_NOT_CONFIRMED'

/**
* Generated from fi.espoo.evaka.placement.PlacementPlanDetails
*/
export interface PlacementPlanDetails {
  applicationId: ApplicationId
  child: PlacementPlanChild
  id: PlacementPlanId
  period: FiniteDateRange
  preschoolDaycarePeriod: FiniteDateRange | null
  rejectedByCitizen: boolean
  type: PlacementType
  unitAcceptDisabled: boolean
  unitConfirmationStatus: PlacementPlanConfirmationStatus
  unitId: DaycareId
  unitRejectOtherReason: string | null
  unitRejectReason: PlacementPlanRejectReason | null
}

/**
* Generated from fi.espoo.evaka.placement.PlacementPlanDraft
*/
export interface PlacementPlanDraft {
  child: PlacementDraftChild
  guardianHasRestrictedDetails: boolean
  period: FiniteDateRange
  placements: PlacementSummary[]
  preferredUnits: PlacementDraftUnit[]
  preschoolDaycarePeriod: FiniteDateRange | null
  type: PlacementType
}

/**
* Generated from fi.espoo.evaka.placement.PlacementPlanRejectReason
*/
export type PlacementPlanRejectReason =
  | 'OTHER'
  | 'REASON_1'
  | 'REASON_2'
  | 'REASON_3'

/**
* Generated from fi.espoo.evaka.placement.PlacementResponse
*/
export interface PlacementResponse {
  permittedPlacementActions: Partial<Record<PlacementId, Action.Placement[]>>
  permittedServiceNeedActions: Partial<Record<ServiceNeedId, Action.ServiceNeed[]>>
  placements: DaycarePlacementWithDetails[]
}

/**
* Generated from fi.espoo.evaka.placement.PlacementSummary
*/
export interface PlacementSummary {
  childId: PersonId
  endDate: LocalDate
  id: PlacementId
  startDate: LocalDate
  type: PlacementType
  unit: Unit
}

/**
* Generated from fi.espoo.evaka.placement.PlacementControllerCitizen.PlacementTerminationRequestBody
*/
export interface PlacementTerminationRequestBody {
  terminateDaycareOnly: boolean | null
  terminationDate: LocalDate
  type: TerminatablePlacementType
  unitId: DaycareId
}

/**
* Generated from fi.espoo.evaka.placement.PlacementType
*/
export type PlacementType =
  | 'CLUB'
  | 'DAYCARE'
  | 'DAYCARE_PART_TIME'
  | 'DAYCARE_FIVE_YEAR_OLDS'
  | 'DAYCARE_PART_TIME_FIVE_YEAR_OLDS'
  | 'PRESCHOOL'
  | 'PRESCHOOL_DAYCARE'
  | 'PRESCHOOL_DAYCARE_ONLY'
  | 'PRESCHOOL_CLUB'
  | 'PREPARATORY'
  | 'PREPARATORY_DAYCARE'
  | 'PREPARATORY_DAYCARE_ONLY'
  | 'TEMPORARY_DAYCARE'
  | 'TEMPORARY_DAYCARE_PART_DAY'
  | 'SCHOOL_SHIFT_CARE'

/**
* Generated from fi.espoo.evaka.placement.PlacementUpdateRequestBody
*/
export interface PlacementUpdateRequestBody {
  endDate: LocalDate
  startDate: LocalDate
}

/**
* Generated from fi.espoo.evaka.placement.ScheduleType
*/
export type ScheduleType =
  | 'RESERVATION_REQUIRED'
  | 'FIXED_SCHEDULE'
  | 'TERM_BREAK'

/**
* Generated from fi.espoo.evaka.placement.TerminatablePlacementGroup
*/
export interface TerminatablePlacementGroup {
  additionalPlacements: ChildPlacement[]
  endDate: LocalDate
  placements: ChildPlacement[]
  startDate: LocalDate
  terminatable: boolean
  type: TerminatablePlacementType
  unitId: DaycareId
  unitName: string
}

/**
* Generated from fi.espoo.evaka.placement.TerminatablePlacementType
*/
export type TerminatablePlacementType =
  | 'CLUB'
  | 'PREPARATORY'
  | 'DAYCARE'
  | 'PRESCHOOL'

/**
* Generated from fi.espoo.evaka.placement.TerminatedPlacement
*/
export interface TerminatedPlacement {
  child: ChildBasics
  connectedDaycareOnly: boolean
  currentDaycareGroupName: string | null
  endDate: LocalDate
  id: PlacementId
  terminatedBy: EvakaUser | null
  terminationRequestedDate: LocalDate | null
  type: PlacementType
}

/**
* Generated from fi.espoo.evaka.placement.UnitChildrenCapacityFactors
*/
export interface UnitChildrenCapacityFactors {
  assistanceNeedFactor: number
  childId: PersonId
  serviceNeedFactor: number
}


export function deserializeJsonChildBasics(json: JsonOf<ChildBasics>): ChildBasics {
  return {
    ...json,
    dateOfBirth: LocalDate.parseIso(json.dateOfBirth)
  }
}


export function deserializeJsonChildPlacement(json: JsonOf<ChildPlacement>): ChildPlacement {
  return {
    ...json,
    endDate: LocalDate.parseIso(json.endDate),
    startDate: LocalDate.parseIso(json.startDate),
    terminationRequestedDate: (json.terminationRequestedDate != null) ? LocalDate.parseIso(json.terminationRequestedDate) : null
  }
}


export function deserializeJsonChildPlacementResponse(json: JsonOf<ChildPlacementResponse>): ChildPlacementResponse {
  return {
    ...json,
    placements: json.placements.map(e => deserializeJsonTerminatablePlacementGroup(e))
  }
}


export function deserializeJsonDaycareGroupPlacement(json: JsonOf<DaycareGroupPlacement>): DaycareGroupPlacement {
  return {
    ...json,
    endDate: LocalDate.parseIso(json.endDate),
    startDate: LocalDate.parseIso(json.startDate)
  }
}


export function deserializeJsonDaycarePlacementWithDetails(json: JsonOf<DaycarePlacementWithDetails>): DaycarePlacementWithDetails {
  return {
    ...json,
    child: deserializeJsonChildBasics(json.child),
    endDate: LocalDate.parseIso(json.endDate),
    groupPlacements: json.groupPlacements.map(e => deserializeJsonDaycareGroupPlacement(e)),
    modifiedAt: (json.modifiedAt != null) ? HelsinkiDateTime.parseIso(json.modifiedAt) : null,
    serviceNeeds: json.serviceNeeds.map(e => deserializeJsonServiceNeed(e)),
    startDate: LocalDate.parseIso(json.startDate),
    terminationRequestedDate: (json.terminationRequestedDate != null) ? LocalDate.parseIso(json.terminationRequestedDate) : null
  }
}


export function deserializeJsonGroupPlacementRequestBody(json: JsonOf<GroupPlacementRequestBody>): GroupPlacementRequestBody {
  return {
    ...json,
    endDate: LocalDate.parseIso(json.endDate),
    startDate: LocalDate.parseIso(json.startDate)
  }
}


export function deserializeJsonGroupTransferRequestBody(json: JsonOf<GroupTransferRequestBody>): GroupTransferRequestBody {
  return {
    ...json,
    startDate: LocalDate.parseIso(json.startDate)
  }
}


export function deserializeJsonMissingGroupPlacement(json: JsonOf<MissingGroupPlacement>): MissingGroupPlacement {
  return {
    ...json,
    dateOfBirth: LocalDate.parseIso(json.dateOfBirth),
    gap: FiniteDateRange.parseJson(json.gap),
    placementPeriod: FiniteDateRange.parseJson(json.placementPeriod),
    serviceNeeds: json.serviceNeeds.map(e => deserializeJsonMissingGroupPlacementServiceNeed(e))
  }
}


export function deserializeJsonMissingGroupPlacementServiceNeed(json: JsonOf<MissingGroupPlacementServiceNeed>): MissingGroupPlacementServiceNeed {
  return {
    ...json,
    endDate: LocalDate.parseIso(json.endDate),
    startDate: LocalDate.parseIso(json.startDate)
  }
}


export function deserializeJsonPlacementCreateRequestBody(json: JsonOf<PlacementCreateRequestBody>): PlacementCreateRequestBody {
  return {
    ...json,
    endDate: LocalDate.parseIso(json.endDate),
    startDate: LocalDate.parseIso(json.startDate)
  }
}


export function deserializeJsonPlacementDraftChild(json: JsonOf<PlacementDraftChild>): PlacementDraftChild {
  return {
    ...json,
    dob: LocalDate.parseIso(json.dob)
  }
}


export function deserializeJsonPlacementPlanChild(json: JsonOf<PlacementPlanChild>): PlacementPlanChild {
  return {
    ...json,
    dateOfBirth: LocalDate.parseIso(json.dateOfBirth)
  }
}


export function deserializeJsonPlacementPlanDetails(json: JsonOf<PlacementPlanDetails>): PlacementPlanDetails {
  return {
    ...json,
    child: deserializeJsonPlacementPlanChild(json.child),
    period: FiniteDateRange.parseJson(json.period),
    preschoolDaycarePeriod: (json.preschoolDaycarePeriod != null) ? FiniteDateRange.parseJson(json.preschoolDaycarePeriod) : null
  }
}


export function deserializeJsonPlacementPlanDraft(json: JsonOf<PlacementPlanDraft>): PlacementPlanDraft {
  return {
    ...json,
    child: deserializeJsonPlacementDraftChild(json.child),
    period: FiniteDateRange.parseJson(json.period),
    placements: json.placements.map(e => deserializeJsonPlacementSummary(e)),
    preschoolDaycarePeriod: (json.preschoolDaycarePeriod != null) ? FiniteDateRange.parseJson(json.preschoolDaycarePeriod) : null
  }
}


export function deserializeJsonPlacementResponse(json: JsonOf<PlacementResponse>): PlacementResponse {
  return {
    ...json,
    placements: json.placements.map(e => deserializeJsonDaycarePlacementWithDetails(e))
  }
}


export function deserializeJsonPlacementSummary(json: JsonOf<PlacementSummary>): PlacementSummary {
  return {
    ...json,
    endDate: LocalDate.parseIso(json.endDate),
    startDate: LocalDate.parseIso(json.startDate)
  }
}


export function deserializeJsonPlacementTerminationRequestBody(json: JsonOf<PlacementTerminationRequestBody>): PlacementTerminationRequestBody {
  return {
    ...json,
    terminationDate: LocalDate.parseIso(json.terminationDate)
  }
}


export function deserializeJsonPlacementUpdateRequestBody(json: JsonOf<PlacementUpdateRequestBody>): PlacementUpdateRequestBody {
  return {
    ...json,
    endDate: LocalDate.parseIso(json.endDate),
    startDate: LocalDate.parseIso(json.startDate)
  }
}


export function deserializeJsonTerminatablePlacementGroup(json: JsonOf<TerminatablePlacementGroup>): TerminatablePlacementGroup {
  return {
    ...json,
    additionalPlacements: json.additionalPlacements.map(e => deserializeJsonChildPlacement(e)),
    endDate: LocalDate.parseIso(json.endDate),
    placements: json.placements.map(e => deserializeJsonChildPlacement(e)),
    startDate: LocalDate.parseIso(json.startDate)
  }
}


export function deserializeJsonTerminatedPlacement(json: JsonOf<TerminatedPlacement>): TerminatedPlacement {
  return {
    ...json,
    child: deserializeJsonChildBasics(json.child),
    endDate: LocalDate.parseIso(json.endDate),
    terminationRequestedDate: (json.terminationRequestedDate != null) ? LocalDate.parseIso(json.terminationRequestedDate) : null
  }
}
