// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications

import type { DaycareAssistanceLevel } from './assistance'
import type { DaycareId } from './shared'
import type { EmployeeId } from './shared'
import FiniteDateRange from '../../finite-date-range'
import type { JsonOf } from '../../json'
import LocalDate from '../../local-date'
import LocalTime from '../../local-time'
import type { PersonId } from './shared'
import type { ShiftPlanId } from './shared'
import type { ShiftPlanShiftId } from './shared'
import type { ShiftWishId } from './shared'

/**
* Generated from evaka.instance.petajavesi.shiftplanning.DailyStaffingNeed
*/
export interface DailyStaffingNeed {
  date: LocalDate
  slots: StaffingSlot[]
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.EmployeePlannedShift
*/
export interface EmployeePlannedShift {
  date: LocalDate
  endTime: LocalTime
  startTime: LocalTime
  unitId: DaycareId
  unitName: string
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.PlannedShift
*/
export interface PlannedShift {
  date: LocalDate
  employeeId: EmployeeId
  endTime: LocalTime
  id: ShiftPlanShiftId
  startTime: LocalTime
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.SavedShiftPlan
*/
export interface SavedShiftPlan {
  id: ShiftPlanId
  shifts: PlannedShift[]
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftInput
*/
export interface ShiftInput {
  date: LocalDate
  employeeId: EmployeeId
  endTime: LocalTime
  startTime: LocalTime
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanAssistanceFactor
*/
export interface ShiftPlanAssistanceFactor {
  capacityFactor: number
  validDuring: FiniteDateRange
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanAttendance
*/
export interface ShiftPlanAttendance {
  date: LocalDate
  endTime: LocalTime | null
  startTime: LocalTime
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanBalancingPeriod
*/
export interface ShiftPlanBalancingPeriod {
  endDate: LocalDate
  startDate: LocalDate
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanChild
*/
export interface ShiftPlanChild {
  assistanceFactors: ShiftPlanAssistanceFactor[]
  attendances: ShiftPlanAttendance[]
  dateOfBirth: LocalDate
  daycareAssistances: ShiftPlanDaycareAssistance[]
  firstName: string
  id: PersonId
  lastName: string
  reservations: ShiftPlanReservation[]
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanDailyOccupancy
*/
export interface ShiftPlanDailyOccupancy {
  date: LocalDate
  percentage: number | null
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanDaycareAssistance
*/
export interface ShiftPlanDaycareAssistance {
  level: DaycareAssistanceLevel
  validDuring: FiniteDateRange
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanEmployee
*/
export interface ShiftPlanEmployee {
  firstName: string
  id: EmployeeId
  lastName: string
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanPeriodEmployeeMinutes
*/
export interface ShiftPlanPeriodEmployeeMinutes {
  actualMinutes: number
  employeeId: EmployeeId
  plannedMinutes: number
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanReservation
*/
export interface ShiftPlanReservation {
  date: LocalDate
  endTime: LocalTime
  startTime: LocalTime
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanStaffAttendance
*/
export interface ShiftPlanStaffAttendance {
  date: LocalDate
  employeeId: EmployeeId
  endTime: LocalTime | null
  startTime: LocalTime
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanUnit
*/
export interface ShiftPlanUnit {
  id: DaycareId
  name: string
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanUpdateRequest
*/
export interface ShiftPlanUpdateRequest {
  shifts: ShiftInput[]
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanWeekResponse
*/
export interface ShiftPlanWeekResponse {
  balancingPeriod: ShiftPlanBalancingPeriod
  children: ShiftPlanChild[]
  employees: ShiftPlanEmployee[]
  occupancy: ShiftPlanDailyOccupancy[]
  periodHourLimitMinutes: number
  periodMinutes: ShiftPlanPeriodEmployeeMinutes[]
  plan: SavedShiftPlan | null
  staffAttendances: ShiftPlanStaffAttendance[]
  staffingDivisor: number
  staffingNeed: DailyStaffingNeed[]
  unitId: DaycareId
  weekStart: LocalDate
  weeklyHourLimitMinutes: number
  wishes: ShiftWishWithEmployee[]
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftWish
*/
export interface ShiftWish {
  date: LocalDate
  endTime: LocalTime
  id: ShiftWishId
  important: boolean
  resolvedEndTime: LocalTime | null
  resolvedStartTime: LocalTime | null
  startTime: LocalTime
  status: ShiftWishStatus
  unitId: DaycareId
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftWishCreateRequest
*/
export interface ShiftWishCreateRequest {
  date: LocalDate
  endTime: LocalTime
  important: boolean
  startTime: LocalTime
  unitId: DaycareId
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftWishResolveRequest
*/
export interface ShiftWishResolveRequest {
  endTime: LocalTime | null
  startTime: LocalTime | null
  status: ShiftWishStatus
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftWishStatus
*/
export type ShiftWishStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftWishWithEmployee
*/
export interface ShiftWishWithEmployee {
  date: LocalDate
  employeeId: EmployeeId
  endTime: LocalTime
  firstName: string
  id: ShiftWishId
  important: boolean
  lastName: string
  resolvedEndTime: LocalTime | null
  resolvedStartTime: LocalTime | null
  startTime: LocalTime
  status: ShiftWishStatus
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftWishesResponse
*/
export interface ShiftWishesResponse {
  shifts: EmployeePlannedShift[]
  shiftsRange: FiniteDateRange
  window: FiniteDateRange
  wishes: ShiftWish[]
}

/**
* Generated from evaka.instance.petajavesi.shiftplanning.StaffingSlot
*/
export interface StaffingSlot {
  childCount: number
  endTime: LocalTime
  requiredStaff: number
  startTime: LocalTime
  weightedChildCount: number
}


export function deserializeJsonDailyStaffingNeed(json: JsonOf<DailyStaffingNeed>): DailyStaffingNeed {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    slots: json.slots.map(e => deserializeJsonStaffingSlot(e))
  }
}


export function deserializeJsonEmployeePlannedShift(json: JsonOf<EmployeePlannedShift>): EmployeePlannedShift {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    endTime: LocalTime.parseIso(json.endTime),
    startTime: LocalTime.parseIso(json.startTime)
  }
}


export function deserializeJsonPlannedShift(json: JsonOf<PlannedShift>): PlannedShift {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    endTime: LocalTime.parseIso(json.endTime),
    startTime: LocalTime.parseIso(json.startTime)
  }
}


export function deserializeJsonSavedShiftPlan(json: JsonOf<SavedShiftPlan>): SavedShiftPlan {
  return {
    ...json,
    shifts: json.shifts.map(e => deserializeJsonPlannedShift(e))
  }
}


export function deserializeJsonShiftInput(json: JsonOf<ShiftInput>): ShiftInput {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    endTime: LocalTime.parseIso(json.endTime),
    startTime: LocalTime.parseIso(json.startTime)
  }
}


export function deserializeJsonShiftPlanAssistanceFactor(json: JsonOf<ShiftPlanAssistanceFactor>): ShiftPlanAssistanceFactor {
  return {
    ...json,
    validDuring: FiniteDateRange.parseJson(json.validDuring)
  }
}


export function deserializeJsonShiftPlanAttendance(json: JsonOf<ShiftPlanAttendance>): ShiftPlanAttendance {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    endTime: (json.endTime != null) ? LocalTime.parseIso(json.endTime) : null,
    startTime: LocalTime.parseIso(json.startTime)
  }
}


export function deserializeJsonShiftPlanBalancingPeriod(json: JsonOf<ShiftPlanBalancingPeriod>): ShiftPlanBalancingPeriod {
  return {
    ...json,
    endDate: LocalDate.parseIso(json.endDate),
    startDate: LocalDate.parseIso(json.startDate)
  }
}


export function deserializeJsonShiftPlanChild(json: JsonOf<ShiftPlanChild>): ShiftPlanChild {
  return {
    ...json,
    assistanceFactors: json.assistanceFactors.map(e => deserializeJsonShiftPlanAssistanceFactor(e)),
    attendances: json.attendances.map(e => deserializeJsonShiftPlanAttendance(e)),
    dateOfBirth: LocalDate.parseIso(json.dateOfBirth),
    daycareAssistances: json.daycareAssistances.map(e => deserializeJsonShiftPlanDaycareAssistance(e)),
    reservations: json.reservations.map(e => deserializeJsonShiftPlanReservation(e))
  }
}


export function deserializeJsonShiftPlanDailyOccupancy(json: JsonOf<ShiftPlanDailyOccupancy>): ShiftPlanDailyOccupancy {
  return {
    ...json,
    date: LocalDate.parseIso(json.date)
  }
}


export function deserializeJsonShiftPlanDaycareAssistance(json: JsonOf<ShiftPlanDaycareAssistance>): ShiftPlanDaycareAssistance {
  return {
    ...json,
    validDuring: FiniteDateRange.parseJson(json.validDuring)
  }
}


export function deserializeJsonShiftPlanReservation(json: JsonOf<ShiftPlanReservation>): ShiftPlanReservation {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    endTime: LocalTime.parseIso(json.endTime),
    startTime: LocalTime.parseIso(json.startTime)
  }
}


export function deserializeJsonShiftPlanStaffAttendance(json: JsonOf<ShiftPlanStaffAttendance>): ShiftPlanStaffAttendance {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    endTime: (json.endTime != null) ? LocalTime.parseIso(json.endTime) : null,
    startTime: LocalTime.parseIso(json.startTime)
  }
}


export function deserializeJsonShiftPlanUpdateRequest(json: JsonOf<ShiftPlanUpdateRequest>): ShiftPlanUpdateRequest {
  return {
    ...json,
    shifts: json.shifts.map(e => deserializeJsonShiftInput(e))
  }
}


export function deserializeJsonShiftPlanWeekResponse(json: JsonOf<ShiftPlanWeekResponse>): ShiftPlanWeekResponse {
  return {
    ...json,
    balancingPeriod: deserializeJsonShiftPlanBalancingPeriod(json.balancingPeriod),
    children: json.children.map(e => deserializeJsonShiftPlanChild(e)),
    occupancy: json.occupancy.map(e => deserializeJsonShiftPlanDailyOccupancy(e)),
    plan: (json.plan != null) ? deserializeJsonSavedShiftPlan(json.plan) : null,
    staffAttendances: json.staffAttendances.map(e => deserializeJsonShiftPlanStaffAttendance(e)),
    staffingNeed: json.staffingNeed.map(e => deserializeJsonDailyStaffingNeed(e)),
    weekStart: LocalDate.parseIso(json.weekStart),
    wishes: json.wishes.map(e => deserializeJsonShiftWishWithEmployee(e))
  }
}


export function deserializeJsonShiftWish(json: JsonOf<ShiftWish>): ShiftWish {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    endTime: LocalTime.parseIso(json.endTime),
    resolvedEndTime: (json.resolvedEndTime != null) ? LocalTime.parseIso(json.resolvedEndTime) : null,
    resolvedStartTime: (json.resolvedStartTime != null) ? LocalTime.parseIso(json.resolvedStartTime) : null,
    startTime: LocalTime.parseIso(json.startTime)
  }
}


export function deserializeJsonShiftWishCreateRequest(json: JsonOf<ShiftWishCreateRequest>): ShiftWishCreateRequest {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    endTime: LocalTime.parseIso(json.endTime),
    startTime: LocalTime.parseIso(json.startTime)
  }
}


export function deserializeJsonShiftWishResolveRequest(json: JsonOf<ShiftWishResolveRequest>): ShiftWishResolveRequest {
  return {
    ...json,
    endTime: (json.endTime != null) ? LocalTime.parseIso(json.endTime) : null,
    startTime: (json.startTime != null) ? LocalTime.parseIso(json.startTime) : null
  }
}


export function deserializeJsonShiftWishWithEmployee(json: JsonOf<ShiftWishWithEmployee>): ShiftWishWithEmployee {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    endTime: LocalTime.parseIso(json.endTime),
    resolvedEndTime: (json.resolvedEndTime != null) ? LocalTime.parseIso(json.resolvedEndTime) : null,
    resolvedStartTime: (json.resolvedStartTime != null) ? LocalTime.parseIso(json.resolvedStartTime) : null,
    startTime: LocalTime.parseIso(json.startTime)
  }
}


export function deserializeJsonShiftWishesResponse(json: JsonOf<ShiftWishesResponse>): ShiftWishesResponse {
  return {
    ...json,
    shifts: json.shifts.map(e => deserializeJsonEmployeePlannedShift(e)),
    shiftsRange: FiniteDateRange.parseJson(json.shiftsRange),
    window: FiniteDateRange.parseJson(json.window),
    wishes: json.wishes.map(e => deserializeJsonShiftWish(e))
  }
}


export function deserializeJsonStaffingSlot(json: JsonOf<StaffingSlot>): StaffingSlot {
  return {
    ...json,
    endTime: LocalTime.parseIso(json.endTime),
    startTime: LocalTime.parseIso(json.startTime)
  }
}
