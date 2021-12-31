// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import config from 'e2e-test-common/config'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from 'e2e-test-common/dev-api/data-init'
import EmployeeNav from 'e2e-playwright/pages/employee/employee-nav'
import ChildInformationPage from 'e2e-playwright/pages/employee/child-information'
import { resetDatabase } from 'e2e-test-common/dev-api'
import { employeeLogin } from 'e2e-playwright/utils/user'
import { Fixture } from 'e2e-test-common/dev-api/fixtures'
import { Page } from '../../utils/page'

let fixtures: AreaAndPersonFixtures
let page: Page
let nav: EmployeeNav
let childInfo: ChildInformationPage

beforeAll(async () => {
  await resetDatabase()
  fixtures = await initializeAreaAndPersonData()
  await Fixture.placement()
    .with({
      childId: fixtures.enduserChildFixtureJari.id,
      unitId: fixtures.daycareFixture.id
    })
    .save()
})
beforeEach(async () => {
  page = await Page.open()
  nav = new EmployeeNav(page)
  childInfo = new ChildInformationPage(page)
})

describe('Child information page', () => {
  test('Admin sees every tab, except messaging', async () => {
    const admin = await Fixture.employeeAdmin().save()
    await employeeLogin(page, admin.data)
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: true,
      units: true,
      search: true,
      finance: true,
      reports: true,
      messages: false
    })
  })

  test('Service worker sees applications, units, search and reports tabs', async () => {
    const serviceWorker = await Fixture.employeeServiceWorker().save()
    await employeeLogin(page, serviceWorker.data)
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: true,
      units: true,
      search: true,
      finance: false,
      reports: true,
      messages: false
    })
  })

  test('FinanceAdmin sees units, search, finance and reports tabs', async () => {
    const financeAdmin = await Fixture.employeeFinanceAdmin().save()
    await employeeLogin(page, financeAdmin.data)
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: false,
      units: true,
      search: true,
      finance: true,
      reports: true,
      messages: false
    })
  })

  test('Director sees only the reports tab', async () => {
    const director = await Fixture.employeeDirector().save()
    await employeeLogin(page, director.data)
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: false,
      units: false,
      search: false,
      finance: false,
      reports: true,
      messages: false
    })
  })

  test('Reports sees only the reports tab', async () => {
    const reportViewer = await Fixture.employeeReportViewer().save()
    await employeeLogin(page, reportViewer.data)
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: false,
      units: false,
      search: false,
      finance: false,
      reports: true,
      messages: false
    })
  })

  test('Staff sees only the units and messaging tabs', async () => {
    const staff = await Fixture.employeeStaff(fixtures.daycareFixture.id).save()
    await employeeLogin(page, staff.data)
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: false,
      units: true,
      search: false,
      finance: false,
      reports: false,
      messages: true
    })
  })

  test('Unit supervisor sees units, search, reports and messaging tabs', async () => {
    const unitSupervisor = await Fixture.employeeUnitSupervisor(
      fixtures.daycareFixture.id
    ).save()
    await employeeLogin(page, unitSupervisor.data)
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: false,
      units: true,
      search: true,
      finance: false,
      reports: true,
      messages: true
    })
  })
})

describe('Child information page sections', () => {
  test('Admin sees every collapsible section', async () => {
    const admin = await Fixture.employeeAdmin().save()
    await employeeLogin(page, admin.data)
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.assertCollapsiblesVisible({
      feeAlterations: true,
      guardians: true,
      placements: true,
      assistanceNeed: true,
      backupCares: true,
      familyContacts: true,
      applications: true,
      messageBlocklist: true,
      dailyServiceTimes: true,
      vasuAndLeops: true,
      pedagogicalDocuments: true
    })
  })

  test('Service worker sees the correct sections', async () => {
    const serviceWorker = await Fixture.employeeServiceWorker().save()
    await employeeLogin(page, serviceWorker.data)
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.assertCollapsiblesVisible({
      feeAlterations: false,
      guardians: true,
      placements: true,
      assistanceNeed: true,
      backupCares: true,
      familyContacts: false,
      applications: true,
      messageBlocklist: false,
      dailyServiceTimes: true,
      vasuAndLeops: false,
      pedagogicalDocuments: false
    })
  })

  test('Finance admin sees the correct sections', async () => {
    const financeAdmin = await Fixture.employeeFinanceAdmin().save()
    await employeeLogin(page, financeAdmin.data)
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.assertCollapsiblesVisible({
      feeAlterations: true,
      guardians: true,
      placements: true,
      assistanceNeed: false,
      backupCares: true,
      familyContacts: false,
      applications: false,
      messageBlocklist: false,
      dailyServiceTimes: true,
      vasuAndLeops: false,
      pedagogicalDocuments: false
    })
  })

  test('Staff sees the correct sections', async () => {
    const staff = await Fixture.employeeStaff(fixtures.daycareFixture.id).save()
    await employeeLogin(page, staff.data)
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.assertCollapsiblesVisible({
      feeAlterations: false,
      guardians: false,
      placements: true,
      assistanceNeed: false,
      backupCares: true,
      familyContacts: true,
      applications: false,
      messageBlocklist: false,
      dailyServiceTimes: true,
      vasuAndLeops: false,
      pedagogicalDocuments: true
    })
  })

  test('Unit supervisor sees the correct sections', async () => {
    const unitSupervisor = await Fixture.employeeUnitSupervisor(
      fixtures.daycareFixture.id
    ).save()
    await employeeLogin(page, unitSupervisor.data)
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.assertCollapsiblesVisible({
      feeAlterations: false,
      guardians: true,
      placements: true,
      assistanceNeed: true,
      backupCares: true,
      familyContacts: true,
      applications: false,
      messageBlocklist: false,
      dailyServiceTimes: true,
      vasuAndLeops: true,
      pedagogicalDocuments: true
    })
  })

  test('Special education teacher sees the correct sections', async () => {
    const specialEducationTeacher =
      await Fixture.employeeSpecialEducationTeacher(
        fixtures.daycareFixture.id
      ).save()
    await employeeLogin(page, specialEducationTeacher.data)
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.assertCollapsiblesVisible({
      feeAlterations: false,
      guardians: false,
      placements: true,
      assistanceNeed: true,
      backupCares: true,
      familyContacts: true,
      applications: false,
      messageBlocklist: false,
      dailyServiceTimes: true,
      vasuAndLeops: true,
      pedagogicalDocuments: true
    })
  })
})
