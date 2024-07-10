// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications

import FiniteDateRange from '../../finite-date-range'
import LocalDate from '../../local-date'
import TimeInterval from '../../time-interval'
import TimeRange from '../../time-range'
import { AbsenceCategory } from './absence'
import { AbsenceType } from './absence'
import { ChildServiceNeedInfo } from './absence'
import { DailyServiceTimesValue } from './dailyservicetimes'
import { HolidayPeriodEffect } from './holidayperiod'
import { JsonOf } from '../../json'
import { PlacementType } from './placement'
import { ScheduleType } from './placement'
import { UUID } from '../../types'
import { deserializeJsonChildServiceNeedInfo } from './absence'
import { deserializeJsonDailyServiceTimesValue } from './dailyservicetimes'
import { deserializeJsonHolidayPeriodEffect } from './holidayperiod'

/**
* Generated from fi.espoo.evaka.reservations.AbsenceInfo
*/
export interface AbsenceInfo {
  editable: boolean
  type: AbsenceType
}

/**
* Generated from fi.espoo.evaka.reservations.AbsenceRequest
*/
export interface AbsenceRequest {
  absenceType: AbsenceType
  childIds: UUID[]
  dateRange: FiniteDateRange
}

/**
* Generated from fi.espoo.evaka.reservations.AbsenceTypeResponse
*/
export interface AbsenceTypeResponse {
  absenceType: AbsenceType
  staffCreated: boolean
}

/**
* Generated from fi.espoo.evaka.reservations.UnitAttendanceReservations.Child
*/
export interface Child {
  dateOfBirth: LocalDate
  firstName: string
  id: UUID
  lastName: string
  preferredName: string
  serviceNeeds: ChildServiceNeedInfo[]
}

/**
* Generated from fi.espoo.evaka.reservations.ChildDatePresence
*/
export interface ChildDatePresence {
  absenceBillable: AbsenceType | null
  absenceNonbillable: AbsenceType | null
  attendances: TimeInterval[]
  childId: UUID
  date: LocalDate
  reservations: Reservation[]
  unitId: UUID
}

/**
* Generated from fi.espoo.evaka.reservations.UnitAttendanceReservations.ChildRecordOfDay
*/
export interface ChildRecordOfDay {
  absenceBillable: AbsenceTypeResponse | null
  absenceNonbillable: AbsenceTypeResponse | null
  attendances: TimeInterval[]
  backupGroupId: UUID | null
  childId: UUID
  dailyServiceTimes: DailyServiceTimesValue | null
  groupId: UUID | null
  inOtherUnit: boolean
  possibleAbsenceCategories: AbsenceCategory[]
  reservations: ReservationResponse[]
  scheduleType: ScheduleType
}

/**
* Generated from fi.espoo.evaka.reservations.AttendanceReservationController.ChildReservationInfo
*/
export interface ChildReservationInfo {
  absent: boolean
  childId: UUID
  dailyServiceTimes: DailyServiceTimesValue | null
  groupId: UUID | null
  isInHolidayPeriod: boolean
  outOnBackupPlacement: boolean
  reservations: ReservationResponse[]
  scheduleType: ScheduleType
}

/**
* Generated from fi.espoo.evaka.reservations.ConfirmedRangeDate
*/
export interface ConfirmedRangeDate {
  absenceType: AbsenceType | null
  dailyServiceTimes: DailyServiceTimesValue | null
  date: LocalDate
  reservations: ReservationResponse[]
  scheduleType: ScheduleType
}

/**
* Generated from fi.espoo.evaka.reservations.ConfirmedRangeDateUpdate
*/
export interface ConfirmedRangeDateUpdate {
  absenceType: AbsenceType | null
  date: LocalDate
  reservations: Reservation[]
}

/**
* Generated from fi.espoo.evaka.reservations.AttendanceReservationController.DailyChildReservationResult
*/
export interface DailyChildReservationResult {
  childReservations: ChildReservationInfo[]
  children: Record<UUID, ReservationChildInfo>
}


export namespace DailyReservationRequest {
  /**
  * Generated from fi.espoo.evaka.reservations.DailyReservationRequest.Absent
  */
  export interface Absent {
    type: 'ABSENT'
    childId: UUID
    date: LocalDate
  }

  /**
  * Generated from fi.espoo.evaka.reservations.DailyReservationRequest.Nothing
  */
  export interface Nothing {
    type: 'NOTHING'
    childId: UUID
    date: LocalDate
  }

  /**
  * Generated from fi.espoo.evaka.reservations.DailyReservationRequest.Present
  */
  export interface Present {
    type: 'PRESENT'
    childId: UUID
    date: LocalDate
  }

  /**
  * Generated from fi.espoo.evaka.reservations.DailyReservationRequest.Reservations
  */
  export interface Reservations {
    type: 'RESERVATIONS'
    childId: UUID
    date: LocalDate
    reservation: TimeRange
    secondReservation: TimeRange | null
  }
}

/**
* Generated from fi.espoo.evaka.reservations.DailyReservationRequest
*/
export type DailyReservationRequest = DailyReservationRequest.Absent | DailyReservationRequest.Nothing | DailyReservationRequest.Present | DailyReservationRequest.Reservations


/**
* Generated from fi.espoo.evaka.reservations.AttendanceReservationController.DayReservationStatisticsResult
*/
export interface DayReservationStatisticsResult {
  date: LocalDate
  groupStatistics: GroupReservationStatisticResult[]
}

/**
* Generated from fi.espoo.evaka.reservations.AttendanceReservationController.ExpectedAbsencesRequest
*/
export interface ExpectedAbsencesRequest {
  attendances: TimeRange[]
  childId: UUID
  date: LocalDate
}

/**
* Generated from fi.espoo.evaka.reservations.AttendanceReservationController.GroupReservationStatisticResult
*/
export interface GroupReservationStatisticResult {
  absentCount: number
  calculatedPresent: number
  groupId: UUID | null
  presentCount: number
}

/**
* Generated from fi.espoo.evaka.reservations.MonthSummary
*/
export interface MonthSummary {
  month: number
  reservedMinutes: number
  serviceNeedMinutes: number
  usedServiceMinutes: number
  year: number
}

/**
* Generated from fi.espoo.evaka.reservations.UnitAttendanceReservations.OperationalDay
*/
export interface OperationalDay {
  children: ChildRecordOfDay[]
  date: LocalDate
  dateInfo: UnitDateInfo
}


export namespace ReservableTimeRange {
  /**
  * Generated from fi.espoo.evaka.reservations.ReservableTimeRange.IntermittentShiftCare
  */
  export interface IntermittentShiftCare {
    type: 'INTERMITTENT_SHIFT_CARE'
    placementUnitOperationTime: TimeRange | null
  }

  /**
  * Generated from fi.espoo.evaka.reservations.ReservableTimeRange.Normal
  */
  export interface Normal {
    type: 'NORMAL'
    range: TimeRange
  }

  /**
  * Generated from fi.espoo.evaka.reservations.ReservableTimeRange.ShiftCare
  */
  export interface ShiftCare {
    type: 'SHIFT_CARE'
    range: TimeRange
  }
}

/**
* Generated from fi.espoo.evaka.reservations.ReservableTimeRange
*/
export type ReservableTimeRange = ReservableTimeRange.IntermittentShiftCare | ReservableTimeRange.Normal | ReservableTimeRange.ShiftCare



export namespace Reservation {
  /**
  * Generated from fi.espoo.evaka.reservations.Reservation.NoTimes
  */
  export interface NoTimes {
    type: 'NO_TIMES'
  }

  /**
  * Generated from fi.espoo.evaka.reservations.Reservation.Times
  */
  export interface Times {
    type: 'TIMES'
    range: TimeRange
  }
}

/**
* Generated from fi.espoo.evaka.reservations.Reservation
*/
export type Reservation = Reservation.NoTimes | Reservation.Times


/**
* Generated from fi.espoo.evaka.reservations.ReservationChild
*/
export interface ReservationChild {
  duplicateOf: UUID | null
  firstName: string
  id: UUID
  imageId: UUID | null
  lastName: string
  monthSummaries: MonthSummary[]
  preferredName: string
  upcomingPlacementType: PlacementType | null
}

/**
* Generated from fi.espoo.evaka.reservations.AttendanceReservationController.ReservationChildInfo
*/
export interface ReservationChildInfo {
  dateOfBirth: LocalDate
  firstName: string
  id: UUID
  lastName: string
  preferredName: string
}

/**
* Generated from fi.espoo.evaka.reservations.UnitAttendanceReservations.ReservationGroup
*/
export interface ReservationGroup {
  id: UUID
  name: string
}


export namespace ReservationResponse {
  /**
  * Generated from fi.espoo.evaka.reservations.ReservationResponse.NoTimes
  */
  export interface NoTimes {
    type: 'NO_TIMES'
    staffCreated: boolean
  }

  /**
  * Generated from fi.espoo.evaka.reservations.ReservationResponse.Times
  */
  export interface Times {
    type: 'TIMES'
    range: TimeRange
    staffCreated: boolean
  }
}

/**
* Generated from fi.espoo.evaka.reservations.ReservationResponse
*/
export type ReservationResponse = ReservationResponse.NoTimes | ReservationResponse.Times


/**
* Generated from fi.espoo.evaka.reservations.ReservationResponseDay
*/
export interface ReservationResponseDay {
  children: ReservationResponseDayChild[]
  date: LocalDate
  holiday: boolean
}

/**
* Generated from fi.espoo.evaka.reservations.ReservationResponseDayChild
*/
export interface ReservationResponseDayChild {
  absence: AbsenceInfo | null
  attendances: TimeInterval[]
  childId: UUID
  holidayPeriodEffect: HolidayPeriodEffect | null
  reservableTimeRange: ReservableTimeRange
  reservations: ReservationResponse[]
  scheduleType: ScheduleType
  shiftCare: boolean
  usedService: UsedServiceResult | null
}

/**
* Generated from fi.espoo.evaka.reservations.ReservationsResponse
*/
export interface ReservationsResponse {
  children: ReservationChild[]
  days: ReservationResponseDay[]
  reservableRange: FiniteDateRange
}

/**
* Generated from fi.espoo.evaka.reservations.UnitAttendanceReservations
*/
export interface UnitAttendanceReservations {
  children: Child[]
  days: OperationalDay[]
  groups: ReservationGroup[]
  unit: string
}

/**
* Generated from fi.espoo.evaka.reservations.UnitAttendanceReservations.UnitDateInfo
*/
export interface UnitDateInfo {
  isHoliday: boolean
  isInHolidayPeriod: boolean
  normalOperatingTimes: TimeRange | null
  shiftCareOpenOnHoliday: boolean
  shiftCareOperatingTimes: TimeRange | null
}

/**
* Generated from fi.espoo.evaka.reservations.UsedServiceResult
*/
export interface UsedServiceResult {
  reservedMinutes: number
  usedServiceMinutes: number
  usedServiceRanges: TimeRange[]
}


export function deserializeJsonAbsenceRequest(json: JsonOf<AbsenceRequest>): AbsenceRequest {
  return {
    ...json,
    dateRange: FiniteDateRange.parseJson(json.dateRange)
  }
}


export function deserializeJsonChild(json: JsonOf<Child>): Child {
  return {
    ...json,
    dateOfBirth: LocalDate.parseIso(json.dateOfBirth),
    serviceNeeds: json.serviceNeeds.map(e => deserializeJsonChildServiceNeedInfo(e))
  }
}


export function deserializeJsonChildDatePresence(json: JsonOf<ChildDatePresence>): ChildDatePresence {
  return {
    ...json,
    attendances: json.attendances.map(e => TimeInterval.parseJson(e)),
    date: LocalDate.parseIso(json.date),
    reservations: json.reservations.map(e => deserializeJsonReservation(e))
  }
}


export function deserializeJsonChildRecordOfDay(json: JsonOf<ChildRecordOfDay>): ChildRecordOfDay {
  return {
    ...json,
    attendances: json.attendances.map(e => TimeInterval.parseJson(e)),
    dailyServiceTimes: (json.dailyServiceTimes != null) ? deserializeJsonDailyServiceTimesValue(json.dailyServiceTimes) : null,
    reservations: json.reservations.map(e => deserializeJsonReservationResponse(e))
  }
}


export function deserializeJsonChildReservationInfo(json: JsonOf<ChildReservationInfo>): ChildReservationInfo {
  return {
    ...json,
    dailyServiceTimes: (json.dailyServiceTimes != null) ? deserializeJsonDailyServiceTimesValue(json.dailyServiceTimes) : null,
    reservations: json.reservations.map(e => deserializeJsonReservationResponse(e))
  }
}


export function deserializeJsonConfirmedRangeDate(json: JsonOf<ConfirmedRangeDate>): ConfirmedRangeDate {
  return {
    ...json,
    dailyServiceTimes: (json.dailyServiceTimes != null) ? deserializeJsonDailyServiceTimesValue(json.dailyServiceTimes) : null,
    date: LocalDate.parseIso(json.date),
    reservations: json.reservations.map(e => deserializeJsonReservationResponse(e))
  }
}


export function deserializeJsonConfirmedRangeDateUpdate(json: JsonOf<ConfirmedRangeDateUpdate>): ConfirmedRangeDateUpdate {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    reservations: json.reservations.map(e => deserializeJsonReservation(e))
  }
}


export function deserializeJsonDailyChildReservationResult(json: JsonOf<DailyChildReservationResult>): DailyChildReservationResult {
  return {
    ...json,
    childReservations: json.childReservations.map(e => deserializeJsonChildReservationInfo(e)),
    children: Object.fromEntries(Object.entries(json.children).map(
      ([k, v]) => [k, deserializeJsonReservationChildInfo(v)]
    ))
  }
}



export function deserializeJsonDailyReservationRequestAbsent(json: JsonOf<DailyReservationRequest.Absent>): DailyReservationRequest.Absent {
  return {
    ...json,
    date: LocalDate.parseIso(json.date)
  }
}

export function deserializeJsonDailyReservationRequestNothing(json: JsonOf<DailyReservationRequest.Nothing>): DailyReservationRequest.Nothing {
  return {
    ...json,
    date: LocalDate.parseIso(json.date)
  }
}

export function deserializeJsonDailyReservationRequestPresent(json: JsonOf<DailyReservationRequest.Present>): DailyReservationRequest.Present {
  return {
    ...json,
    date: LocalDate.parseIso(json.date)
  }
}

export function deserializeJsonDailyReservationRequestReservations(json: JsonOf<DailyReservationRequest.Reservations>): DailyReservationRequest.Reservations {
  return {
    ...json,
    date: LocalDate.parseIso(json.date),
    reservation: TimeRange.parseJson(json.reservation),
    secondReservation: (json.secondReservation != null) ? TimeRange.parseJson(json.secondReservation) : null
  }
}
export function deserializeJsonDailyReservationRequest(json: JsonOf<DailyReservationRequest>): DailyReservationRequest {
  switch (json.type) {
    case 'ABSENT': return deserializeJsonDailyReservationRequestAbsent(json)
    case 'NOTHING': return deserializeJsonDailyReservationRequestNothing(json)
    case 'PRESENT': return deserializeJsonDailyReservationRequestPresent(json)
    case 'RESERVATIONS': return deserializeJsonDailyReservationRequestReservations(json)
    default: return json
  }
}


export function deserializeJsonDayReservationStatisticsResult(json: JsonOf<DayReservationStatisticsResult>): DayReservationStatisticsResult {
  return {
    ...json,
    date: LocalDate.parseIso(json.date)
  }
}


export function deserializeJsonExpectedAbsencesRequest(json: JsonOf<ExpectedAbsencesRequest>): ExpectedAbsencesRequest {
  return {
    ...json,
    attendances: json.attendances.map(e => TimeRange.parseJson(e)),
    date: LocalDate.parseIso(json.date)
  }
}


export function deserializeJsonOperationalDay(json: JsonOf<OperationalDay>): OperationalDay {
  return {
    ...json,
    children: json.children.map(e => deserializeJsonChildRecordOfDay(e)),
    date: LocalDate.parseIso(json.date),
    dateInfo: deserializeJsonUnitDateInfo(json.dateInfo)
  }
}



export function deserializeJsonReservableTimeRangeIntermittentShiftCare(json: JsonOf<ReservableTimeRange.IntermittentShiftCare>): ReservableTimeRange.IntermittentShiftCare {
  return {
    ...json,
    placementUnitOperationTime: (json.placementUnitOperationTime != null) ? TimeRange.parseJson(json.placementUnitOperationTime) : null
  }
}

export function deserializeJsonReservableTimeRangeNormal(json: JsonOf<ReservableTimeRange.Normal>): ReservableTimeRange.Normal {
  return {
    ...json,
    range: TimeRange.parseJson(json.range)
  }
}

export function deserializeJsonReservableTimeRangeShiftCare(json: JsonOf<ReservableTimeRange.ShiftCare>): ReservableTimeRange.ShiftCare {
  return {
    ...json,
    range: TimeRange.parseJson(json.range)
  }
}
export function deserializeJsonReservableTimeRange(json: JsonOf<ReservableTimeRange>): ReservableTimeRange {
  switch (json.type) {
    case 'INTERMITTENT_SHIFT_CARE': return deserializeJsonReservableTimeRangeIntermittentShiftCare(json)
    case 'NORMAL': return deserializeJsonReservableTimeRangeNormal(json)
    case 'SHIFT_CARE': return deserializeJsonReservableTimeRangeShiftCare(json)
    default: return json
  }
}



export function deserializeJsonReservationTimes(json: JsonOf<Reservation.Times>): Reservation.Times {
  return {
    ...json,
    range: TimeRange.parseJson(json.range)
  }
}
export function deserializeJsonReservation(json: JsonOf<Reservation>): Reservation {
  switch (json.type) {
    case 'TIMES': return deserializeJsonReservationTimes(json)
    default: return json
  }
}


export function deserializeJsonReservationChildInfo(json: JsonOf<ReservationChildInfo>): ReservationChildInfo {
  return {
    ...json,
    dateOfBirth: LocalDate.parseIso(json.dateOfBirth)
  }
}



export function deserializeJsonReservationResponseTimes(json: JsonOf<ReservationResponse.Times>): ReservationResponse.Times {
  return {
    ...json,
    range: TimeRange.parseJson(json.range)
  }
}
export function deserializeJsonReservationResponse(json: JsonOf<ReservationResponse>): ReservationResponse {
  switch (json.type) {
    case 'TIMES': return deserializeJsonReservationResponseTimes(json)
    default: return json
  }
}


export function deserializeJsonReservationResponseDay(json: JsonOf<ReservationResponseDay>): ReservationResponseDay {
  return {
    ...json,
    children: json.children.map(e => deserializeJsonReservationResponseDayChild(e)),
    date: LocalDate.parseIso(json.date)
  }
}


export function deserializeJsonReservationResponseDayChild(json: JsonOf<ReservationResponseDayChild>): ReservationResponseDayChild {
  return {
    ...json,
    attendances: json.attendances.map(e => TimeInterval.parseJson(e)),
    holidayPeriodEffect: (json.holidayPeriodEffect != null) ? deserializeJsonHolidayPeriodEffect(json.holidayPeriodEffect) : null,
    reservableTimeRange: deserializeJsonReservableTimeRange(json.reservableTimeRange),
    reservations: json.reservations.map(e => deserializeJsonReservationResponse(e)),
    usedService: (json.usedService != null) ? deserializeJsonUsedServiceResult(json.usedService) : null
  }
}


export function deserializeJsonReservationsResponse(json: JsonOf<ReservationsResponse>): ReservationsResponse {
  return {
    ...json,
    days: json.days.map(e => deserializeJsonReservationResponseDay(e)),
    reservableRange: FiniteDateRange.parseJson(json.reservableRange)
  }
}


export function deserializeJsonUnitAttendanceReservations(json: JsonOf<UnitAttendanceReservations>): UnitAttendanceReservations {
  return {
    ...json,
    children: json.children.map(e => deserializeJsonChild(e)),
    days: json.days.map(e => deserializeJsonOperationalDay(e))
  }
}


export function deserializeJsonUnitDateInfo(json: JsonOf<UnitDateInfo>): UnitDateInfo {
  return {
    ...json,
    normalOperatingTimes: (json.normalOperatingTimes != null) ? TimeRange.parseJson(json.normalOperatingTimes) : null,
    shiftCareOperatingTimes: (json.shiftCareOperatingTimes != null) ? TimeRange.parseJson(json.shiftCareOperatingTimes) : null
  }
}


export function deserializeJsonUsedServiceResult(json: JsonOf<UsedServiceResult>): UsedServiceResult {
  return {
    ...json,
    usedServiceRanges: json.usedServiceRanges.map(e => TimeRange.parseJson(e))
  }
}
