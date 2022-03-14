// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import FiniteDateRange from 'lib-common/finite-date-range'
import LocalDate from 'lib-common/local-date'

import { resetDatabase } from '../../dev-api'
import {
  careAreaFixture,
  DaycareBuilder,
  daycareFixture,
  daycareGroupFixture,
  enduserChildFixtureJari,
  enduserChildFixtureKaarina,
  enduserGuardianFixture,
  Fixture,
  HolidayPeriodBuilder,
  PersonBuilder
} from '../../dev-api/fixtures'
import CitizenCalendarPage from '../../pages/citizen/citizen-calendar'
import CitizenHeader from '../../pages/citizen/citizen-header'
import { Page } from '../../utils/page'
import { enduserLogin } from '../../utils/user'

let page: Page

const period = new FiniteDateRange(
  LocalDate.of(2035, 12, 18),
  LocalDate.of(2036, 1, 8)
)
const child = enduserChildFixtureJari
const mockedDate = LocalDate.of(2035, 12, 1)
let daycare: DaycareBuilder
let guardian: PersonBuilder

const holidayPeriodFixture = () =>
  Fixture.holidayPeriod().with({
    period,
    reservationDeadline: LocalDate.of(2035, 12, 6)
  })
const holidayQuestionnaireFixture = () =>
  Fixture.holidayQuestionnaire().with({
    absenceType: 'FREE_ABSENCE',
    active: new FiniteDateRange(LocalDate.today(), LocalDate.of(2035, 12, 6)),
    description: {
      en: 'Please submit your reservations for 18.12.2035 - 8.1.2036 asap',
      fi: 'Ystävällisesti pyydän tekemään varauksenne ajalle 18.12.2035 - 8.1.2036 heti kun mahdollista, kuitenkin viimeistään 6.12.',
      sv: 'Vänligen samma på svenska för 18.12.2035 - 8.1.2036'
    },
    periodOptionLabel: {
      en: 'My child is away for 8 weeks between',
      fi: 'Lapseni on poissa 8 viikkoa aikavälillä',
      sv: 'Mitt barn är borta 8 veckor mellan'
    },
    periodOptions: [
      new FiniteDateRange(
        LocalDate.of(2035, 12, 18),
        LocalDate.of(2035, 12, 25)
      ),
      new FiniteDateRange(LocalDate.of(2035, 12, 26), LocalDate.of(2036, 1, 1)),
      new FiniteDateRange(LocalDate.of(2036, 1, 2), LocalDate.of(2036, 1, 8))
    ]
  })

async function assertReservationState(
  calendar: CitizenCalendarPage,
  startDate: LocalDate,
  endDate: LocalDate,
  hasFreeAbsence: boolean
) {
  await calendar.waitUntilLoaded()

  let today = startDate
  while (today.isEqualOrBefore(endDate)) {
    if (hasFreeAbsence) {
      await calendar.assertReservations(today, [], false, true)
    } else {
      await calendar.assertNoReservationsOrAbsences(today)
    }
    today = today.addBusinessDays(1)
  }
}

beforeEach(async () => {
  await resetDatabase()
  page = await Page.open({ mockedTime: mockedDate.toSystemTzDate() })

  daycare = await Fixture.daycare()
    .with(daycareFixture)
    .careArea(await Fixture.careArea().with(careAreaFixture).save())
    .save()
  await Fixture.daycareGroup().with(daycareGroupFixture).daycare(daycare).save()

  guardian = await Fixture.person().with(enduserGuardianFixture).save()
  const child1 = await Fixture.person().with(child).save()
  await Fixture.child(child1.data.id).save()
  await Fixture.guardian(child1, guardian).save()
  await Fixture.placement()
    .child(child1)
    .daycare(daycare)
    .with({
      startDate: LocalDate.of(2022, 1, 1).formatIso(),
      endDate: LocalDate.of(2036, 6, 30).formatIso()
    })
    .save()
})

async function setupAnotherChild(
  startDate = LocalDate.of(2022, 1, 1),
  endDate = LocalDate.of(2036, 6, 30)
) {
  const child2 = await Fixture.person().with(enduserChildFixtureKaarina).save()
  await Fixture.child(child2.data.id).save()
  await Fixture.guardian(child2, guardian).save()
  await Fixture.placement()
    .child(child2)
    .daycare(daycare)
    .with({
      startDate: startDate.formatIso(),
      endDate: endDate.formatIso()
    })
    .save()

  return child2.data
}

describe('Holiday periods', () => {
  describe('Holiday period questionnaire is active', () => {
    beforeEach(async () => {
      const holidayPeriod = await holidayPeriodFixture().save()
      await holidayQuestionnaireFixture()
        .withHolidayPeriod(holidayPeriod)
        .save()
    })

    test('The holiday reservations banner is shown on calendar page', async () => {
      await enduserLogin(page)
      await new CitizenHeader(page).selectTab('calendar')
      const calendar = new CitizenCalendarPage(page, 'desktop')
      expect(await calendar.getHolidayBannerContent()).toEqual(
        'Ilmoita lomat ja tee varaukset 18.12.2035-08.01.2036 välille viimeistään 06.12.2035.'
      )
    })

    test('The calendar page should show a button for reporting holidays', async () => {
      await enduserLogin(page)
      await new CitizenHeader(page).selectTab('calendar')
      const calendar = new CitizenCalendarPage(page, 'desktop')
      await calendar.assertHolidayModalButtonVisible()
    })

    test('Holidays can be reported and cleared', async () => {
      const assertFreeAbsences = (hasFreeAbsences: boolean) =>
        assertReservationState(
          calendar,
          LocalDate.of(2035, 12, 26),
          LocalDate.of(2036, 1, 1),
          hasFreeAbsences
        )

      await enduserLogin(page)
      await new CitizenHeader(page).selectTab('calendar')
      const calendar = new CitizenCalendarPage(page, 'desktop')

      await assertFreeAbsences(false)

      let holidayModal = await calendar.openHolidayModal()
      await holidayModal.markHoliday(child, '26.12.2035 - 01.01.2036')

      await assertFreeAbsences(true)

      holidayModal = await calendar.openHolidayModal()
      await holidayModal.markNoHoliday(child)

      await assertFreeAbsences(false)
    })

    test('Holidays can be marked an cleared for two children', async () => {
      const assertFreeAbsences = (hasFreeAbsences: boolean) =>
        assertReservationState(
          calendar,
          LocalDate.of(2035, 12, 26),
          LocalDate.of(2036, 1, 1),
          hasFreeAbsences
        )

      const child2 = await setupAnotherChild()

      await enduserLogin(page)
      await new CitizenHeader(page).selectTab('calendar')
      const calendar = new CitizenCalendarPage(page, 'desktop')

      await assertFreeAbsences(false)

      let holidayModal = await calendar.openHolidayModal()
      await holidayModal.markHolidays([
        { child, option: '26.12.2035 - 01.01.2036' },
        { child: child2, option: '26.12.2035 - 01.01.2036' }
      ])

      await assertFreeAbsences(true)

      const dayView = await calendar.openDayView(LocalDate.of(2035, 12, 26))
      await dayView.assertAbsence(child.id, 'Poissa')
      await dayView.assertAbsence(child2.id, 'Poissa')

      holidayModal = await calendar.openHolidayModal()
      await holidayModal.markNoHolidays([child, child2])

      await assertFreeAbsences(false)
    })
  })

  describe('Holiday period questionnaire is inactive', () => {
    beforeEach(async () => {
      const holidayPeriod = await holidayPeriodFixture().save()
      await holidayQuestionnaireFixture()
        .withHolidayPeriod(holidayPeriod)
        .with({
          active: new FiniteDateRange(
            LocalDate.of(1990, 1, 1),
            LocalDate.of(1990, 1, 31)
          )
        })
        .save()
    })

    test('The holiday reservations banner is not shown on calendar page', async () => {
      await enduserLogin(page)
      await new CitizenHeader(page).selectTab('calendar')
      const calendar = new CitizenCalendarPage(page, 'desktop')
      await calendar.assertHolidayBannerNotVisible()
    })
  })

  describe('Child eligibility', () => {
    let holidayPeriod: HolidayPeriodBuilder
    beforeEach(async () => {
      holidayPeriod = await holidayPeriodFixture().save()
    })

    test('The holiday reservations banner is not shown if no child is eligible', async () => {
      await holidayQuestionnaireFixture()
        .withHolidayPeriod(holidayPeriod)
        .with({
          conditions: {
            continuousPlacement: new FiniteDateRange(
              LocalDate.of(1990, 1, 1),
              LocalDate.of(1990, 1, 31)
            )
          }
        })
        .save()

      await enduserLogin(page)
      await new CitizenHeader(page).selectTab('calendar')
      const calendar = new CitizenCalendarPage(page, 'desktop')
      await calendar.assertHolidayBannerNotVisible()
    })

    test('Holidays can be marked if one of two children is eligible', async () => {
      const placementConditionStart = LocalDate.of(2022, 1, 1)
      const placementConditionEnd = LocalDate.of(2022, 1, 31)

      await holidayQuestionnaireFixture()
        .withHolidayPeriod(holidayPeriod)
        .with({
          conditions: {
            continuousPlacement: new FiniteDateRange(
              placementConditionStart,
              placementConditionEnd
            )
          }
        })
        .save()

      const child2 = await setupAnotherChild(
        // Not eligible for a free holiday because the placement doesn't cover the required period
        placementConditionStart.addDays(1),
        LocalDate.of(2036, 6, 30)
      )

      await enduserLogin(page)
      await new CitizenHeader(page).selectTab('calendar')
      const calendar = new CitizenCalendarPage(page, 'desktop')
      const holidayModal = await calendar.openHolidayModal()

      await holidayModal.assertNotEligible(child2)
      await holidayModal.markHoliday(child, '26.12.2035 - 01.01.2036')

      await assertReservationState(
        calendar,
        LocalDate.of(2035, 12, 26),
        LocalDate.of(2036, 1, 1),
        true
      )

      const dayView = await calendar.openDayView(LocalDate.of(2035, 12, 26))
      await dayView.assertAbsence(child.id, 'Poissa')
      await dayView.assertNoReservation(child2.id)
    })
  })
})
