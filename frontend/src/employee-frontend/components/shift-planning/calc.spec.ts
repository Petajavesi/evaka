// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { describe, expect, it } from 'vitest'

import type {
  DailyStaffingNeed,
  ShiftPlanStaffAttendance
} from 'lib-common/generated/api-types/petajavesi'
import type { EmployeeId } from 'lib-common/generated/api-types/shared'
import { randomId } from 'lib-common/id-type'
import LocalDate from 'lib-common/local-date'
import LocalTime from 'lib-common/local-time'

import type { DraftShiftGroup, ParsedShift } from './calc'
import {
  actualCoverageAt,
  approvedWishShifts,
  subtractShiftsFromNeed,
  actualMinutesByEmployee,
  formatBalance,
  formatMinutes,
  groupsFromPlan,
  hasInvalidTimeOrder,
  parseDraftGroup,
  plannedCoverageAt,
  plannedMinutesByEmployee,
  suggestEmployeeAssignments,
  suggestShiftGroups
} from './calc'

const monday = LocalDate.of(2026, 7, 6)
const tuesday = monday.addDays(1)
const employee1 = randomId<EmployeeId>()
const employee2 = randomId<EmployeeId>()

function draft(overrides: Partial<DraftShiftGroup> = {}): DraftShiftGroup {
  return {
    key: 'k',
    dates: [monday],
    startTime: '08:00',
    endTime: '16:00',
    employeeIds: [employee1],
    ...overrides
  }
}

function shift(
  employeeId: EmployeeId,
  date: LocalDate,
  start: string,
  end: string
): ParsedShift {
  return {
    employeeId,
    date,
    startTime: LocalTime.parse(start),
    endTime: LocalTime.parse(end)
  }
}

describe('parseDraftGroup', () => {
  it('tuottaa rivin jokaiselle päivä-työntekijä-yhdistelmälle', () => {
    const parsed = parseDraftGroup(
      draft({ dates: [monday, tuesday], employeeIds: [employee1, employee2] })
    )
    expect(parsed).not.toBeNull()
    expect(parsed).toHaveLength(4)
    expect(
      parsed?.map((s) => `${s.date.formatIso()}/${s.employeeId}`).sort()
    ).toEqual(
      [
        `${monday.formatIso()}/${employee1}`,
        `${monday.formatIso()}/${employee2}`,
        `${tuesday.formatIso()}/${employee1}`,
        `${tuesday.formatIso()}/${employee2}`
      ].sort()
    )
    expect(parsed?.[0].startTime.format()).toEqual('08:00')
  })

  it('vuoro ilman työntekijöitä tai päiviä tuottaa tyhjän listan (ei tallenneta)', () => {
    expect(parseDraftGroup(draft({ employeeIds: [] }))).toEqual([])
    expect(parseDraftGroup(draft({ dates: [] }))).toEqual([])
  })

  it('hylkää käänteisen ja nollan mittaisen aikajärjestyksen', () => {
    expect(parseDraftGroup(draft({ endTime: '07:00' }))).toBeNull()
    expect(parseDraftGroup(draft({ endTime: '08:00' }))).toBeNull()
  })

  it('hylkää puutteelliset kellonajat', () => {
    expect(parseDraftGroup(draft({ startTime: '' }))).toBeNull()
    expect(parseDraftGroup(draft({ endTime: 'abc' }))).toBeNull()
  })
})

describe('groupsFromPlan', () => {
  it('yhdistää samat kellonajat ja saman työntekijäjoukon jakavat päivät yhdeksi vuoroksi', () => {
    let n = 0
    const groups = groupsFromPlan(
      [
        // ma + ti sama vuoro samoilla henkilöillä -> yksi ryhmä kahdella päivällä
        shift(employee1, monday, '08:00', '16:00'),
        shift(employee2, monday, '08:00', '16:00'),
        shift(employee1, tuesday, '08:00', '16:00'),
        shift(employee2, tuesday, '08:00', '16:00'),
        // sama aikaväli mutta eri henkilöjoukko -> oma ryhmä
        shift(employee1, monday.addDays(2), '08:00', '16:00'),
        // eri aikaväli -> oma ryhmä
        shift(employee2, monday, '07:00', '15:00')
      ],
      () => `k${n++}`
    )
    expect(groups).toHaveLength(3)

    const shared = groups.find(
      (g) => g.startTime === '08:00' && g.employeeIds.length === 2
    )
    expect(shared?.dates.map((d) => d.formatIso())).toEqual([
      monday.formatIso(),
      tuesday.formatIso()
    ])
    expect(shared?.employeeIds).toHaveLength(2)
  })
})

describe('hasInvalidTimeOrder', () => {
  it('tunnistaa vain valmiin mutta väärän aikajärjestyksen', () => {
    expect(hasInvalidTimeOrder(draft({ endTime: '07:00' }))).toBe(true)
    expect(hasInvalidTimeOrder(draft({ endTime: '' }))).toBe(false)
    expect(hasInvalidTimeOrder(draft())).toBe(false)
  })
})

describe('plannedMinutesByEmployee', () => {
  it('summaa työntekijän viikon vuorot minuutteina', () => {
    const minutes = plannedMinutesByEmployee([
      shift(employee1, monday, '08:00', '16:00'), // 480
      shift(employee1, tuesday, '07:30', '15:45'), // 495
      shift(employee2, monday, '09:00', '12:00') // 180
    ])
    expect(minutes.get(employee1)).toEqual(975)
    expect(minutes.get(employee2)).toEqual(180)
  })

  it('KVTES-raja 2295 min ylittyy vasta kun summa on suurempi', () => {
    // 5 x 7:39 = 2295 min = täsmälleen yleistyöaika
    const exact = plannedMinutesByEmployee(
      [0, 1, 2, 3, 4].map((i) =>
        shift(employee1, monday.addDays(i), '08:00', '15:39')
      )
    )
    expect(exact.get(employee1)).toEqual(2295)
    expect((exact.get(employee1) ?? 0) > 2295).toBe(false)

    const over = plannedMinutesByEmployee([
      ...[0, 1, 2, 3, 4].map((i) =>
        shift(employee1, monday.addDays(i), '08:00', '15:39')
      ),
      shift(employee1, monday.addDays(5), '08:00', '08:01')
    ])
    expect((over.get(employee1) ?? 0) > 2295).toBe(true)
  })
})

describe('plannedCoverageAt', () => {
  const slotStart = LocalTime.parse('10:00')
  const slotEnd = LocalTime.parse('10:30')

  it('laskee välin kattavat vuorot oikealta päivältä', () => {
    const shifts = [
      shift(employee1, monday, '08:00', '16:00'),
      shift(employee2, monday, '10:30', '18:00'), // alkaa välin päättyessä -> ei kata
      shift(employee2, tuesday, '08:00', '16:00') // eri päivä
    ]
    expect(plannedCoverageAt(shifts, monday, slotStart, slotEnd)).toEqual(1)
  })

  it('vuoro joka päättyy välin alkaessa ei kata väliä', () => {
    const shifts = [shift(employee1, monday, '08:00', '10:00')]
    expect(plannedCoverageAt(shifts, monday, slotStart, slotEnd)).toEqual(0)
  })

  it('erotus lasketaan katteen ja tarpeen välillä', () => {
    const shifts = [
      shift(employee1, monday, '08:00', '16:00'),
      shift(employee2, monday, '09:00', '17:00')
    ]
    const coverage = plannedCoverageAt(shifts, monday, slotStart, slotEnd)
    const required = 3
    expect(coverage - required).toEqual(-1)
  })
})

function attendance(
  employeeId: EmployeeId,
  date: LocalDate,
  start: string,
  end: string | null
): ShiftPlanStaffAttendance {
  return {
    employeeId,
    date,
    startTime: LocalTime.parse(start),
    endTime: end !== null ? LocalTime.parse(end) : null
  }
}

describe('actualCoverageAt', () => {
  const slotStart = LocalTime.parse('10:00')
  const slotEnd = LocalTime.parse('10:15')

  it('laskee välin kattavat leimaukset oikealta päivältä', () => {
    const attendances = [
      attendance(employee1, monday, '07:45', '15:12'),
      attendance(employee2, monday, '10:15', '18:00'), // alkaa välin päättyessä -> ei kata
      attendance(employee2, tuesday, '08:00', '16:00') // eri päivä
    ]
    expect(actualCoverageAt(attendances, monday, slotStart, slotEnd)).toEqual(1)
  })

  it('avoin leimaus kattaa loppupäivän', () => {
    const attendances = [attendance(employee1, monday, '08:03', null)]
    expect(actualCoverageAt(attendances, monday, slotStart, slotEnd)).toEqual(1)
  })

  it('leimaus joka päättyy välin alkaessa ei kata väliä', () => {
    const attendances = [attendance(employee1, monday, '08:00', '10:00')]
    expect(actualCoverageAt(attendances, monday, slotStart, slotEnd)).toEqual(0)
  })
})

describe('actualMinutesByEmployee', () => {
  it('summaa työntekijän leimaukset ja ohittaa avoimet', () => {
    const attendances = [
      attendance(employee1, monday, '08:00', '16:07'),
      attendance(employee1, tuesday, '07:30', '15:30'),
      attendance(employee1, monday.addDays(2), '08:00', null), // avoin -> ohitetaan
      attendance(employee2, monday, '09:00', '17:00')
    ]
    const result = actualMinutesByEmployee(attendances)
    expect(result.get(employee1)).toEqual(487 + 480)
    expect(result.get(employee2)).toEqual(480)
  })
})

describe('formatMinutes', () => {
  it('muotoilee tunnit ja minuutit', () => {
    expect(formatMinutes(2295)).toEqual('38 h 15 min')
    expect(formatMinutes(480)).toEqual('8 h')
  })
})

describe('suggestEmployeeAssignments', () => {
  it('ehdottaa vuoron sille jolla on vähiten työaikaa jaksolla', () => {
    const drafts = [
      draft({ key: 'a', dates: [monday], employeeIds: [] }),
      draft({ key: 'b', dates: [tuesday], employeeIds: [] })
    ]
    const baseline = new Map([
      [employee1, 480],
      [employee2, 400]
    ])
    const result = suggestEmployeeAssignments(
      drafts,
      [employee1, employee2],
      baseline
    )
    // Ensimmäinen vuoro pienimmälle kertymälle (employee2, 400), jonka jälkeen
    // kertymä on 880 -> toinen vuoro employee1:lle (480)
    expect(result.get('a')).toEqual([employee2])
    expect(result.get('b')).toEqual([employee1])
  })

  it('ei ehdota samaa työntekijää päällekkäisiin vuoroihin', () => {
    const drafts = [
      draft({ key: 'a', dates: [monday], employeeIds: [] }),
      draft({ key: 'b', dates: [monday], employeeIds: [] })
    ]
    const result = suggestEmployeeAssignments(
      drafts,
      [employee1, employee2],
      new Map()
    )
    expect(result.get('a')).not.toEqual(result.get('b'))
    expect(new Set([...result.values()].flat()).size).toEqual(2)
  })

  it('jo kohdennettu vuoro varaa ajan eikä työntekijää ehdoteta uudelleen', () => {
    const drafts = [
      draft({ key: 'a', dates: [monday], employeeIds: [employee1] }),
      draft({
        key: 'b',
        dates: [monday],
        startTime: '10:00',
        endTime: '16:00',
        employeeIds: []
      })
    ]
    // employee1 olisi kertymältään pienempi, mutta on jo varattu klo 8-16
    const baseline = new Map([
      [employee1, 0],
      [employee2, 2000]
    ])
    const result = suggestEmployeeAssignments(
      drafts,
      [employee1, employee2],
      baseline
    )
    expect(result.get('b')).toEqual([employee2])
  })

  it('rivi jää ilman ehdotusta kun vapaita työntekijöitä ei ole', () => {
    const drafts = [
      draft({ key: 'a', dates: [monday], employeeIds: [] }),
      draft({ key: 'b', dates: [monday], employeeIds: [] })
    ]
    const result = suggestEmployeeAssignments(drafts, [employee1], new Map())
    expect(result.size).toEqual(1)
  })
})

describe('formatBalance', () => {
  it('muotoilee jakson saldon etumerkillä', () => {
    expect(formatBalance(0)).toEqual('±0 h')
    expect(formatBalance(90)).toEqual('+1 h 30 min')
    expect(formatBalance(-459)).toEqual('−7 h 39 min')
  })
})

/** Rakentaa päivän henkilöstötarpeen 15 min aikaväleinä annetuista jaksoista */
function needDay(
  date: LocalDate,
  segments: [string, string, number][]
): DailyStaffingNeed {
  const slots: DailyStaffingNeed['slots'] = []
  segments.forEach(([start, end, requiredStaff]) => {
    let current = LocalTime.parse(start)
    const endTime = LocalTime.parse(end)
    while (current.isBefore(endTime)) {
      const minutes = current.hour * 60 + current.minute + 15
      const next = LocalTime.of(Math.floor(minutes / 60), minutes % 60)
      slots.push({
        startTime: current,
        endTime: next,
        childCount: requiredStaff,
        weightedChildCount: requiredStaff,
        requiredStaff
      })
      current = next
    }
  })
  return { date, slots }
}

describe('suggestShiftGroups', () => {
  let n = 0
  const nextKey = () => `s${n++}`
  const times = (g: { startTime: string; endTime: string }) =>
    `${g.startTime}-${g.endTime}`

  it('tasainen tarve tuottaa yhden vuoron ilman työntekijöitä', () => {
    const groups = suggestShiftGroups(
      [
        needDay(monday, [
          ['06:00', '08:00', 0],
          ['08:00', '16:00', 1],
          ['16:00', '18:00', 0]
        ])
      ],
      nextKey
    )
    expect(groups.map(times)).toEqual(['08:00-16:00'])
    expect(groups[0].dates.map((d) => d.formatIso())).toEqual([
      monday.formatIso()
    ])
    expect(groups[0].employeeIds).toEqual([])
  })

  it('kerrostunut tarve tuottaa vuoron jokaiselle kerrokselle ja pitkä jakso jaetaan limittäin', () => {
    // Klo 6:30-17:00 vähintään 1, klo 8-16 kaksi työntekijää
    const groups = suggestShiftGroups(
      [
        needDay(monday, [
          ['06:00', '06:30', 0],
          ['06:30', '08:00', 1],
          ['08:00', '16:00', 2],
          ['16:00', '17:00', 1],
          ['17:00', '18:00', 0]
        ])
      ],
      nextKey
    )
    // Kerros 1: 06:30-17:00 (10,5 h) ei jakaudu kahdeksi vähintään 6 h vuoroksi
    // ilman limitystä -> kaksi limittäistä 6 h vuoroa; kerros 2: 08:00-16:00
    expect(groups.map(times)).toEqual([
      '06:30-12:30',
      '08:00-16:00',
      '11:00-17:00'
    ])
  })

  it('pitkä jakso jaetaan tavoitepituutta lähelle osuviin vuoroihin', () => {
    // 15 h jakautuu kahdeksi 7,5 h vuoroksi (tavoite 7 h 39 min)
    const groups = suggestShiftGroups(
      [needDay(monday, [['06:00', '21:00', 1]])],
      nextKey
    )
    expect(groups.map(times)).toEqual(['06:00-13:30', '13:30-21:00'])
  })

  it('lyhyt tarvepiikki venytetään kuuden tunnin vuoroksi', () => {
    const groups = suggestShiftGroups(
      [
        needDay(monday, [
          ['06:00', '08:00', 0],
          ['08:00', '08:30', 1],
          ['08:30', '18:00', 0]
        ])
      ],
      nextKey
    )
    expect(groups.map(times)).toEqual(['08:00-14:00'])
  })

  it('lyhyt notkahdus tarpeessa ei katkaise vuoroa', () => {
    const groups = suggestShiftGroups(
      [
        needDay(monday, [
          ['08:00', '12:00', 1],
          ['12:00', '12:45', 0], // alle tunnin notkahdus
          ['12:45', '16:00', 1]
        ])
      ],
      nextKey
    )
    expect(groups.map(times)).toEqual(['08:00-16:00'])
  })

  it('eri päivien samat vuorot yhdistyvät ryhmäksi, rinnakkaiset pysyvät erillään', () => {
    const day = (date: LocalDate): DailyStaffingNeed =>
      needDay(date, [['08:00', '12:00', 2]])
    const groups = suggestShiftGroups([day(monday), day(tuesday)], nextKey)
    // Kaksi rinnakkaista 08:00-12:00-vuoroa, kumpikin kahdelle päivälle
    expect(groups.map(times)).toEqual(['08:00-12:00', '08:00-12:00'])
    groups.forEach((group) => {
      expect(group.dates.map((d) => d.formatIso())).toEqual([
        monday.formatIso(),
        tuesday.formatIso()
      ])
    })
  })

  it('tyhjä tarve ei tuota vuoroja', () => {
    expect(
      suggestShiftGroups([needDay(monday, [['06:00', '18:00', 0]])], nextKey)
    ).toEqual([])
  })
})

describe('approvedWishShifts', () => {
  const wish = (
    overrides: Partial<Parameters<typeof approvedWishShifts>[0][number]> = {}
  ) => ({
    employeeId: employee1,
    date: monday,
    startTime: LocalTime.parse('08:00'),
    endTime: LocalTime.parse('16:00'),
    status: 'APPROVED',
    resolvedStartTime: null,
    resolvedEndTime: null,
    ...overrides
  })

  it('palauttaa vain hyväksytyt toiveet hyväksynnän mukaisin ajoin', () => {
    const shifts = approvedWishShifts([
      wish(),
      wish({ status: 'PENDING' }),
      wish({ status: 'REJECTED' }),
      wish({
        employeeId: employee2,
        resolvedStartTime: LocalTime.parse('09:00'),
        resolvedEndTime: LocalTime.parse('15:00')
      })
    ])
    expect(shifts).toHaveLength(2)
    expect(shifts[0].employeeId).toBe(employee1)
    expect(shifts[0].startTime.format()).toBe('08:00')
    expect(shifts[0].endTime.format()).toBe('16:00')
    expect(shifts[1].employeeId).toBe(employee2)
    expect(shifts[1].startTime.format()).toBe('09:00')
    expect(shifts[1].endTime.format()).toBe('15:00')
  })
})

describe('subtractShiftsFromNeed', () => {
  const requiredAt = (
    day: DailyStaffingNeed,
    time: string
  ): number | undefined =>
    day.slots.find((slot) => slot.startTime.format() === time)?.requiredStaff

  it('vähentää tarpeen vuoron kokonaan kattamilta väleiltä', () => {
    const need = [needDay(monday, [['08:00', '16:00', 2]])]
    const result = subtractShiftsFromNeed(need, [
      shift(employee1, monday, '08:00', '12:00')
    ])
    expect(requiredAt(result[0], '08:00')).toBe(1)
    expect(requiredAt(result[0], '11:45')).toBe(1)
    expect(requiredAt(result[0], '12:00')).toBe(2)
  })

  it('kohdistuu vain vuoron päivään eikä mene alle nollan', () => {
    const need = [
      needDay(monday, [['08:00', '10:00', 1]]),
      needDay(tuesday, [['08:00', '10:00', 1]])
    ]
    const result = subtractShiftsFromNeed(need, [
      shift(employee1, monday, '08:00', '10:00'),
      shift(employee2, monday, '08:00', '10:00')
    ])
    expect(result[0].slots.every((slot) => slot.requiredStaff === 0)).toBe(true)
    expect(result[1].slots.every((slot) => slot.requiredStaff === 1)).toBe(true)
  })

  it('ehdotus täyttää vain hyväksytyiltä toiveilta puuttuvan tarpeen', () => {
    let n = 0
    const nextKey = () => `x${n++}`
    const need = [needDay(monday, [['08:00', '16:00', 2]])]
    const remaining = subtractShiftsFromNeed(need, [
      shift(employee1, monday, '08:00', '16:00')
    ])
    const groups = suggestShiftGroups(remaining, nextKey)
    expect(groups.map((g) => `${g.startTime}-${g.endTime}`)).toEqual([
      '08:00-16:00'
    ])

    const fullyCovered = subtractShiftsFromNeed(need, [
      shift(employee1, monday, '08:00', '16:00'),
      shift(employee2, monday, '08:00', '16:00')
    ])
    expect(suggestShiftGroups(fullyCovered, nextKey)).toEqual([])
  })
})
