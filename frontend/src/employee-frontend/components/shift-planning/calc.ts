// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import type {
  DailyStaffingNeed,
  ShiftPlanStaffAttendance
} from 'lib-common/generated/api-types/petajavesi'
import type { EmployeeId } from 'lib-common/generated/api-types/shared'
import type LocalDate from 'lib-common/local-date'
import LocalTime from 'lib-common/local-time'

/**
 * Muokattavana oleva vuoro: yksi tai useampi päivä, kellonaikaväli ja siihen
 * kohdennetut työntekijät. Kellonajat TimeInput-kenttien merkkijonoina (HH:mm).
 * (Req 12.1)
 */
export interface DraftShiftGroup {
  key: string
  dates: LocalDate[]
  startTime: string
  endTime: string
  employeeIds: EmployeeId[]
}

export interface ParsedShift {
  employeeId: EmployeeId
  date: LocalDate
  startTime: LocalTime
  endTime: LocalTime
}

/**
 * Hyväksytyt työvuorotoiveet vuoroina, hyväksynnässä mahdollisesti muutetuin
 * ajoin. Hyväksytyt toiveet ovat suunnittelussa ensisijaisia: vuoroehdotus
 * säilyttää ne ja täyttää vain jäljelle jäävän henkilöstötarpeen (Req 14).
 */
export function approvedWishShifts(
  wishes: {
    employeeId: EmployeeId
    date: LocalDate
    startTime: LocalTime
    endTime: LocalTime
    status: string
    resolvedStartTime: LocalTime | null
    resolvedEndTime: LocalTime | null
  }[]
): ParsedShift[] {
  return wishes
    .filter((wish) => wish.status === 'APPROVED')
    .map((wish) => ({
      employeeId: wish.employeeId,
      date: wish.date,
      startTime: wish.resolvedStartTime ?? wish.startTime,
      endTime: wish.resolvedEndTime ?? wish.endTime
    }))
}

/**
 * Vähentää henkilöstötarpeesta jo katetut vuorot: jokaisen aikavälin
 * requiredStaff pienenee välin kokonaan kattavien vuorojen määrällä (Req 14).
 */
export function subtractShiftsFromNeed(
  staffingNeed: DailyStaffingNeed[],
  shifts: ParsedShift[]
): DailyStaffingNeed[] {
  return staffingNeed.map((day) => {
    const dayShifts = shifts.filter((shift) => shift.date.isEqual(day.date))
    if (dayShifts.length === 0) return day
    return {
      ...day,
      slots: day.slots.map((slot) => {
        const covered = dayShifts.filter(
          (shift) =>
            minutesOfDay(shift.startTime) <= minutesOfDay(slot.startTime) &&
            minutesOfDay(shift.endTime) >= minutesOfDay(slot.endTime)
        ).length
        return covered === 0
          ? slot
          : {
              ...slot,
              requiredStaff: Math.max(0, slot.requiredStaff - covered)
            }
      })
    }
  })
}

/**
 * Tallennetun suunnitelman rivit ryhmiteltynä vuoroiksi: samat kellonajat ja saman
 * työntekijäjoukon jakavat päivät yhdistetään yhdeksi vuoroksi (Req 12.3)
 */
export function groupsFromPlan(
  shifts: {
    employeeId: EmployeeId
    date: LocalDate
    startTime: LocalTime
    endTime: LocalTime
  }[],
  nextKey: () => string
): DraftShiftGroup[] {
  // 1. vaihe: työntekijät koolle päivä + aikaväli -kohtaisesti
  const byDateAndTime = new Map<
    string,
    {
      date: LocalDate
      startTime: LocalTime
      endTime: LocalTime
      employeeIds: EmployeeId[]
    }
  >()
  shifts.forEach((shift) => {
    const key = `${shift.date.formatIso()}/${shift.startTime.format()}/${shift.endTime.format()}`
    const existing = byDateAndTime.get(key)
    if (existing) {
      existing.employeeIds.push(shift.employeeId)
    } else {
      byDateAndTime.set(key, {
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        employeeIds: [shift.employeeId]
      })
    }
  })

  // 2. vaihe: päivät koolle, kun aikaväli ja työntekijäjoukko ovat samat
  const groups = new Map<string, DraftShiftGroup>()
  ;[...byDateAndTime.values()].forEach((day) => {
    const employeeKey = [...day.employeeIds].sort().join(',')
    const key = `${day.startTime.format()}/${day.endTime.format()}/${employeeKey}`
    const existing = groups.get(key)
    if (existing) {
      existing.dates.push(day.date)
    } else {
      groups.set(key, {
        key: nextKey(),
        dates: [day.date],
        startTime: day.startTime.format(),
        endTime: day.endTime.format(),
        employeeIds: day.employeeIds
      })
    }
  })
  return [...groups.values()].map((group) => ({
    ...group,
    dates: group.dates.sort((a, b) =>
      a.isBefore(b) ? -1 : a.isEqual(b) ? 0 : 1
    )
  }))
}

/**
 * Palauttaa vuoron päivä- ja työntekijäkohtaiset rivit tallennusta/laskentaa varten
 * (Req 12.2), tai null jos kellonajat ovat puutteelliset/virheelliset. Ilman
 * työntekijöitä tai päiviä palautuu tyhjä lista (vuoroa ei tallenneta, Req 12.4).
 */
export function parseDraftGroup(group: DraftShiftGroup): ParsedShift[] | null {
  const startTime = LocalTime.tryParse(group.startTime)
  const endTime = LocalTime.tryParse(group.endTime)
  if (!startTime || !endTime || !endTime.isAfter(startTime)) return null
  return group.dates.flatMap((date) =>
    group.employeeIds.map((employeeId) => ({
      employeeId,
      date,
      startTime,
      endTime
    }))
  )
}

/** Onko vuoron kellonaikasyöte virheellinen (molemmat annettu mutta järjestys väärä) */
export function hasInvalidTimeOrder(draft: {
  startTime: string
  endTime: string
}): boolean {
  const startTime = LocalTime.tryParse(draft.startTime)
  const endTime = LocalTime.tryParse(draft.endTime)
  return !!startTime && !!endTime && !endTime.isAfter(startTime)
}

/** Työntekijän suunniteltu viikkotyöaika minuutteina (Req 7.1) */
export function plannedMinutesByEmployee(
  shifts: ParsedShift[]
): Map<EmployeeId, number> {
  const result = new Map<EmployeeId, number>()
  shifts.forEach((shift) => {
    const minutes = diffMinutes(shift.startTime, shift.endTime)
    result.set(shift.employeeId, (result.get(shift.employeeId) ?? 0) + minutes)
  })
  return result
}

/** Suunniteltu henkilöstökate kellonaikavälillä: montako vuoroa kattaa välin (Req 6.5) */
export function plannedCoverageAt(
  shifts: ParsedShift[],
  date: LocalDate,
  slotStart: LocalTime,
  slotEnd: LocalTime
): number {
  return shifts.filter(
    (shift) =>
      shift.date.isEqual(date) &&
      shift.startTime.isBefore(slotEnd) &&
      shift.endTime.isAfter(slotStart)
  ).length
}

/**
 * Toteutunut henkilöstökate kellonaikavälillä: montako leimausta kattaa välin.
 * Avoin leimaus (ulosleimaus puuttuu) tulkitaan päivän loppuun asti jatkuvaksi.
 */
export function actualCoverageAt(
  attendances: ShiftPlanStaffAttendance[],
  date: LocalDate,
  slotStart: LocalTime,
  slotEnd: LocalTime
): number {
  return attendances.filter(
    (attendance) =>
      attendance.date.isEqual(date) &&
      attendance.startTime.isBefore(slotEnd) &&
      (attendance.endTime === null || attendance.endTime.isAfter(slotStart))
  ).length
}

/**
 * Työntekijän toteutunut viikkotyöaika minuutteina leimauksista. Avoimet
 * leimaukset (ulosleimaus puuttuu) ohitetaan, koska kestoa ei vielä tiedetä.
 */
export function actualMinutesByEmployee(
  attendances: ShiftPlanStaffAttendance[]
): Map<EmployeeId, number> {
  const result = new Map<EmployeeId, number>()
  attendances.forEach((attendance) => {
    if (attendance.endTime === null) return
    const minutes = diffMinutes(attendance.startTime, attendance.endTime)
    result.set(
      attendance.employeeId,
      (result.get(attendance.employeeId) ?? 0) + minutes
    )
  })
  return result
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** Tasoittumisjakson saldon esitys: + ylitys, − alitus, ±0 tasan */
export function formatBalance(minutes: number): string {
  if (minutes === 0) return '±0 h'
  return minutes > 0
    ? `+${formatMinutes(minutes)}`
    : `−${formatMinutes(-minutes)}`
}

function diffMinutes(start: LocalTime, end: LocalTime): number {
  return end.hour * 60 + end.minute - (start.hour * 60 + start.minute)
}

/** Vuoroehdotuksen rajat (KVTES): työvuoron pituus 6–9 h, tavoitteena
 * yleistyöajan mukainen oletusvuoro 7 h 39 min. Lisäksi tarpeen notkahdus,
 * jonka yli vuoro jatkuu katkeamatta. */
export const TARGET_SHIFT_MINUTES = 7 * 60 + 39
const MAX_SHIFT_MINUTES = 9 * 60
const MIN_SHIFT_MINUTES = 6 * 60
const MERGE_GAP_MINUTES = 60
const GRID_MINUTES = 15

interface MinuteInterval {
  startMin: number
  endMin: number
}

/**
 * Luo vuoroehdotuksen henkilöstötarpeesta (= lasten tulo- ja lähtöajoista
 * lasketuista 15 min aikaväleistä). Työntekijöitä EI kohdenneta —
 * työvuorosuunnittelija valitsee ne itse jokaiseen vuoroon.
 *
 * Tarve puretaan kerroksiin: kerros k kattaa välit, joissa tarvitaan vähintään
 * k työntekijää, ja jokaisesta kerroksen yhtenäisestä jaksosta tulee yksi vuoro.
 * Lyhyet notkahdukset tarpeessa (< 1 h) eivät katkaise vuoroa. Yli 9 h jaksot
 * jaetaan useaan vuoroon niin, että vuorojen pituus on mahdollisimman lähellä
 * 7 h 39 min oletusvuoroa (tarvittaessa vuorot limittyvät, jotta 6 h
 * vähimmäispituus säilyy), ja alle 6 h vuorot venytetään 6 tuntiin päivän
 * tarveikkunan sisällä.
 */
export function suggestShiftGroups(
  staffingNeed: DailyStaffingNeed[],
  nextKey: () => string
): DraftShiftGroup[] {
  // Samaan kellonaikaväliin osuvat eri päivien vuorot yhdeksi ryhmäksi
  const byTime = new Map<
    string,
    { startTime: string; endTime: string; dates: LocalDate[] }
  >()
  staffingNeed.forEach((day) => {
    suggestDailyShifts(day).forEach((shift) => {
      const startTime = formatMinutesOfDay(shift.startMin)
      const endTime = formatMinutesOfDay(shift.endMin)
      const key = `${startTime}/${endTime}/${countBefore(byTime, day.date, startTime, endTime)}`
      const existing = byTime.get(key)
      if (existing) {
        existing.dates.push(day.date)
      } else {
        byTime.set(key, { startTime, endTime, dates: [day.date] })
      }
    })
  })
  return [...byTime.values()]
    .sort(
      (a, b) =>
        a.startTime.localeCompare(b.startTime) ||
        a.endTime.localeCompare(b.endTime)
    )
    .map((group) => ({
      key: nextKey(),
      dates: group.dates,
      startTime: group.startTime,
      endTime: group.endTime,
      employeeIds: []
    }))
}

/** Monesko saman kellonaikavälin vuoro tälle päivälle on jo kirjattu — näin
 * päivän rinnakkaiset identtiset vuorot päätyvät omiksi riveikseen */
function countBefore(
  byTime: Map<string, { dates: LocalDate[] }>,
  date: LocalDate,
  startTime: string,
  endTime: string
): number {
  let count = 0
  while (
    byTime
      .get(`${startTime}/${endTime}/${count}`)
      ?.dates.some((d) => d.isEqual(date))
  ) {
    count++
  }
  return count
}

function suggestDailyShifts(day: DailyStaffingNeed): MinuteInterval[] {
  const slots = day.slots
  if (slots.length === 0) return []
  const windowStart = minutesOfDay(slots[0].startTime)
  const windowEnd = minutesOfDay(slots[slots.length - 1].endTime)
  const maxRequired = Math.max(0, ...slots.map((slot) => slot.requiredStaff))

  const shifts: MinuteInterval[] = []
  for (let layer = 1; layer <= maxRequired; layer++) {
    const intervals: MinuteInterval[] = []
    let current: MinuteInterval | null = null
    slots.forEach((slot) => {
      if (slot.requiredStaff < layer) return
      const start = minutesOfDay(slot.startTime)
      const end = minutesOfDay(slot.endTime)
      if (current !== null && start - current.endMin <= MERGE_GAP_MINUTES) {
        current.endMin = end
      } else {
        if (current !== null) intervals.push(current)
        current = { startMin: start, endMin: end }
      }
    })
    if (current !== null) intervals.push(current)

    intervals
      .flatMap(splitLongInterval)
      .forEach((interval) =>
        shifts.push(extendToMinLength(interval, windowStart, windowEnd))
      )
  }
  return shifts.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
}

function splitLongInterval(interval: MinuteInterval): MinuteInterval[] {
  const length = interval.endMin - interval.startMin
  if (length <= MAX_SHIFT_MINUTES) return [interval]
  // Vuorojen määrä valitaan niin, että pituus osuu mahdollisimman lähelle
  // 7 h 39 min tavoitetta ylittämättä 9 h maksimia
  const parts = Math.max(
    Math.round(length / TARGET_SHIFT_MINUTES) || 1,
    Math.ceil(length / MAX_SHIFT_MINUTES)
  )
  if (length / parts >= MIN_SHIFT_MINUTES) {
    // Tasajako peräkkäisiin vuoroihin
    return Array.from({ length: parts }, (_, i) => ({
      startMin: interval.startMin + roundToGrid((i * length) / parts),
      endMin:
        i === parts - 1
          ? interval.endMin
          : interval.startMin + roundToGrid(((i + 1) * length) / parts)
    }))
  }
  // Tasajako alittaisi 6 h vähimmäispituuden: käytetään 6 h vuoroja, jotka
  // sijoitetaan tasavälein niin, että ne limittyvät ja kattavat koko jakson
  return Array.from({ length: parts }, (_, i) => {
    const startMin =
      i === parts - 1
        ? interval.endMin - MIN_SHIFT_MINUTES
        : interval.startMin +
          roundToGrid((i * (length - MIN_SHIFT_MINUTES)) / (parts - 1))
    return { startMin, endMin: startMin + MIN_SHIFT_MINUTES }
  })
}

function extendToMinLength(
  interval: MinuteInterval,
  windowStart: number,
  windowEnd: number
): MinuteInterval {
  if (interval.endMin - interval.startMin >= MIN_SHIFT_MINUTES) return interval
  const endMin = Math.min(windowEnd, interval.startMin + MIN_SHIFT_MINUTES)
  const startMin = Math.max(windowStart, endMin - MIN_SHIFT_MINUTES)
  return { startMin, endMin }
}

/**
 * Ehdottaa työntekijät vuoroihin, joissa ei vielä ole työntekijöitä. Ehdotus on
 * aina suunnittelijan erikseen hyväksyttävä tai muokattava — tämä funktio ei
 * tallenna mitään, vaan palauttaa ehdotuksen riveittäin (avain = vuoron key).
 *
 * Valintaperuste on tasoittumisjakson tasapaino: vuoro ehdotetaan sille
 * työntekijälle, jolla on vähiten suunniteltua työaikaa jaksolla
 * (baselineMinutes + tämän viikon jo kohdennetut vuorot). Työntekijää ei
 * koskaan ehdoteta kahteen päällekkäiseen vuoroon samana päivänä. Suurimmat
 * vuorokokonaisuudet kohdennetaan ensin. Jos vapaita työntekijöitä ei ole,
 * rivi jää ilman ehdotusta.
 */
export function suggestEmployeeAssignments(
  drafts: DraftShiftGroup[],
  employeeIds: EmployeeId[],
  baselineMinutes: Map<EmployeeId, number>
): Map<string, EmployeeId[]> {
  const running = new Map<EmployeeId, number>(
    employeeIds.map((id) => [id, baselineMinutes.get(id) ?? 0])
  )
  // Varatut kellonaikavälit työntekijä+päivä-kohtaisesti
  const busy = new Map<string, { startMin: number; endMin: number }[]>()
  const reserve = (
    employeeId: EmployeeId,
    dates: LocalDate[],
    interval: { startMin: number; endMin: number }
  ) =>
    dates.forEach((date) => {
      const key = `${employeeId}/${date.formatIso()}`
      const intervals = busy.get(key) ?? []
      intervals.push(interval)
      busy.set(key, intervals)
    })
  const isFree = (
    employeeId: EmployeeId,
    dates: LocalDate[],
    interval: { startMin: number; endMin: number }
  ) =>
    dates.every((date) =>
      (busy.get(`${employeeId}/${date.formatIso()}`) ?? []).every(
        (other) =>
          other.endMin <= interval.startMin || other.startMin >= interval.endMin
      )
    )

  const groupInterval = (group: DraftShiftGroup) => {
    const startTime = LocalTime.tryParse(group.startTime)
    const endTime = LocalTime.tryParse(group.endTime)
    if (!startTime || !endTime || !endTime.isAfter(startTime)) return null
    return { startMin: minutesOfDay(startTime), endMin: minutesOfDay(endTime) }
  }

  // Jo kohdennetut vuorot varaavat ajat ja kasvattavat kertymää
  drafts.forEach((group) => {
    if (group.employeeIds.length === 0) return
    const interval = groupInterval(group)
    if (interval === null) return
    const minutes = (interval.endMin - interval.startMin) * group.dates.length
    group.employeeIds.forEach((employeeId) => {
      reserve(employeeId, group.dates, interval)
      running.set(employeeId, (running.get(employeeId) ?? 0) + minutes)
    })
  })

  const unassigned = drafts
    .flatMap((group) => {
      if (group.employeeIds.length > 0 || group.dates.length === 0) return []
      const interval = groupInterval(group)
      return interval === null ? [] : [{ group, interval }]
    })
    .sort(
      (a, b) =>
        (b.interval.endMin - b.interval.startMin) * b.group.dates.length -
        (a.interval.endMin - a.interval.startMin) * a.group.dates.length
    )

  const result = new Map<string, EmployeeId[]>()
  unassigned.forEach(({ group, interval }) => {
    const candidates = employeeIds.filter((employeeId) =>
      isFree(employeeId, group.dates, interval)
    )
    if (candidates.length === 0) return
    const chosen = candidates.reduce((best, candidate) =>
      (running.get(candidate) ?? 0) < (running.get(best) ?? 0)
        ? candidate
        : best
    )
    result.set(group.key, [chosen])
    reserve(chosen, group.dates, interval)
    running.set(
      chosen,
      (running.get(chosen) ?? 0) +
        (interval.endMin - interval.startMin) * group.dates.length
    )
  })
  return result
}

function roundToGrid(minutes: number): number {
  return Math.round(minutes / GRID_MINUTES) * GRID_MINUTES
}

function minutesOfDay(time: LocalTime): number {
  return time.hour * 60 + time.minute
}

function formatMinutesOfDay(minutes: number): string {
  return LocalTime.of(Math.floor(minutes / 60), minutes % 60).format()
}
