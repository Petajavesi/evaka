// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications

import DateRange from '../../date-range'
import LocalDate from '../../local-date'
import { CreationModificationMetadata } from './pis'
import { DaycareId } from './shared'
import { FeeAlterationId } from './shared'
import { FeeAlterationType } from './invoicing'
import { FeeDecisionId } from './shared'
import { FeeDecisionStatus } from './invoicing'
import { IncomeEffect } from './invoicing'
import { IncomeId } from './shared'
import { JsonOf } from '../../json'
import { ParentshipId } from './shared'
import { PartnershipId } from './shared'
import { PersonId } from './shared'
import { PlacementId } from './shared'
import { PlacementType } from './placement'
import { ServiceNeedId } from './shared'
import { VoucherValueDecisionId } from './shared'
import { VoucherValueDecisionStatus } from './invoicing'
import { deserializeJsonCreationModificationMetadata } from './pis'

/**
* Generated from fi.espoo.evaka.timeline.Timeline
*/
export interface Timeline {
  children: TimelineChildDetailed[]
  feeDecisions: TimelineFeeDecision[]
  firstName: string
  incomes: TimelineIncome[]
  lastName: string
  partners: TimelinePartnerDetailed[]
  personId: PersonId
  valueDecisions: TimelineValueDecision[]
}

/**
* Generated from fi.espoo.evaka.timeline.TimelineChildDetailed
*/
export interface TimelineChildDetailed {
  childId: PersonId
  creationModificationMetadata: CreationModificationMetadata
  dateOfBirth: LocalDate
  feeAlterations: TimelineFeeAlteration[]
  firstName: string
  id: ParentshipId
  incomes: TimelineIncome[]
  lastName: string
  originApplicationAccessible: boolean
  placements: TimelinePlacement[]
  range: DateRange
  serviceNeeds: TimelineServiceNeed[]
}

/**
* Generated from fi.espoo.evaka.timeline.TimelineFeeAlteration
*/
export interface TimelineFeeAlteration {
  absolute: boolean
  amount: number
  id: FeeAlterationId
  notes: string
  range: DateRange
  type: FeeAlterationType
}

/**
* Generated from fi.espoo.evaka.timeline.TimelineFeeDecision
*/
export interface TimelineFeeDecision {
  id: FeeDecisionId
  range: DateRange
  status: FeeDecisionStatus
  totalFee: number
}

/**
* Generated from fi.espoo.evaka.timeline.TimelineIncome
*/
export interface TimelineIncome {
  effect: IncomeEffect
  id: IncomeId
  range: DateRange
}

/**
* Generated from fi.espoo.evaka.timeline.TimelinePartnerDetailed
*/
export interface TimelinePartnerDetailed {
  children: TimelineChildDetailed[]
  creationModificationMetadata: CreationModificationMetadata
  feeDecisions: TimelineFeeDecision[]
  firstName: string
  id: PartnershipId
  incomes: TimelineIncome[]
  lastName: string
  originApplicationAccessible: boolean
  partnerId: PersonId
  range: DateRange
  valueDecisions: TimelineValueDecision[]
}

/**
* Generated from fi.espoo.evaka.timeline.TimelinePlacement
*/
export interface TimelinePlacement {
  id: PlacementId
  range: DateRange
  type: PlacementType
  unit: TimelinePlacementUnit
}

/**
* Generated from fi.espoo.evaka.timeline.TimelinePlacementUnit
*/
export interface TimelinePlacementUnit {
  id: DaycareId
  name: string
}

/**
* Generated from fi.espoo.evaka.timeline.TimelineServiceNeed
*/
export interface TimelineServiceNeed {
  id: ServiceNeedId
  name: string
  range: DateRange
}

/**
* Generated from fi.espoo.evaka.timeline.TimelineValueDecision
*/
export interface TimelineValueDecision {
  id: VoucherValueDecisionId
  range: DateRange
  status: VoucherValueDecisionStatus
}


export function deserializeJsonTimeline(json: JsonOf<Timeline>): Timeline {
  return {
    ...json,
    children: json.children.map(e => deserializeJsonTimelineChildDetailed(e)),
    feeDecisions: json.feeDecisions.map(e => deserializeJsonTimelineFeeDecision(e)),
    incomes: json.incomes.map(e => deserializeJsonTimelineIncome(e)),
    partners: json.partners.map(e => deserializeJsonTimelinePartnerDetailed(e)),
    valueDecisions: json.valueDecisions.map(e => deserializeJsonTimelineValueDecision(e))
  }
}


export function deserializeJsonTimelineChildDetailed(json: JsonOf<TimelineChildDetailed>): TimelineChildDetailed {
  return {
    ...json,
    creationModificationMetadata: deserializeJsonCreationModificationMetadata(json.creationModificationMetadata),
    dateOfBirth: LocalDate.parseIso(json.dateOfBirth),
    feeAlterations: json.feeAlterations.map(e => deserializeJsonTimelineFeeAlteration(e)),
    incomes: json.incomes.map(e => deserializeJsonTimelineIncome(e)),
    placements: json.placements.map(e => deserializeJsonTimelinePlacement(e)),
    range: DateRange.parseJson(json.range),
    serviceNeeds: json.serviceNeeds.map(e => deserializeJsonTimelineServiceNeed(e))
  }
}


export function deserializeJsonTimelineFeeAlteration(json: JsonOf<TimelineFeeAlteration>): TimelineFeeAlteration {
  return {
    ...json,
    range: DateRange.parseJson(json.range)
  }
}


export function deserializeJsonTimelineFeeDecision(json: JsonOf<TimelineFeeDecision>): TimelineFeeDecision {
  return {
    ...json,
    range: DateRange.parseJson(json.range)
  }
}


export function deserializeJsonTimelineIncome(json: JsonOf<TimelineIncome>): TimelineIncome {
  return {
    ...json,
    range: DateRange.parseJson(json.range)
  }
}


export function deserializeJsonTimelinePartnerDetailed(json: JsonOf<TimelinePartnerDetailed>): TimelinePartnerDetailed {
  return {
    ...json,
    children: json.children.map(e => deserializeJsonTimelineChildDetailed(e)),
    creationModificationMetadata: deserializeJsonCreationModificationMetadata(json.creationModificationMetadata),
    feeDecisions: json.feeDecisions.map(e => deserializeJsonTimelineFeeDecision(e)),
    incomes: json.incomes.map(e => deserializeJsonTimelineIncome(e)),
    range: DateRange.parseJson(json.range),
    valueDecisions: json.valueDecisions.map(e => deserializeJsonTimelineValueDecision(e))
  }
}


export function deserializeJsonTimelinePlacement(json: JsonOf<TimelinePlacement>): TimelinePlacement {
  return {
    ...json,
    range: DateRange.parseJson(json.range)
  }
}


export function deserializeJsonTimelineServiceNeed(json: JsonOf<TimelineServiceNeed>): TimelineServiceNeed {
  return {
    ...json,
    range: DateRange.parseJson(json.range)
  }
}


export function deserializeJsonTimelineValueDecision(json: JsonOf<TimelineValueDecision>): TimelineValueDecision {
  return {
    ...json,
    range: DateRange.parseJson(json.range)
  }
}
