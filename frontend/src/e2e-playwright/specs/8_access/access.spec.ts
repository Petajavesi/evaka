// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Fixture } from 'e2e-test-common/dev-api/fixtures'
import { newBrowserContext } from '../../browser'
import config from 'e2e-test-common/config'
import { Page } from 'playwright'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from 'e2e-test-common/dev-api/data-init'
import EmployeeNav from 'e2e-playwright/pages/employee/employee-nav'
import ChildInformationPage from 'e2e-playwright/pages/employee/child-information-page'

let fixtures: AreaAndPersonFixtures
let page: Page
let nav: EmployeeNav
let childInfo: ChildInformationPage

beforeAll(async () => {
  ;[fixtures] = await initializeAreaAndPersonData()
})
beforeEach(async () => {
  page = await (await newBrowserContext()).newPage()
  await page.goto(config.employeeUrl)
  nav = new EmployeeNav(page)
  childInfo = new ChildInformationPage(page)
})
afterEach(async () => {
  await page.close()
})
afterAll(async () => {
  await Fixture.cleanup()
})

describe('Child information page', () => {
  test('Admin sees every tab', async () => {
    await nav.login('admin')
    await nav.tabsVisible({
      applications: true,
      units: true,
      search: true,
      finance: true,
      reports: true,
      messages: true
    })
  })

  test('Service worker sees applications, units, search and reports tabs', async () => {
    await nav.login('serviceWorker')
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
    await nav.login('financeAdmin')
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
    await nav.login('director')
    await nav.tabsVisible({
      applications: false,
      units: false,
      search: false,
      finance: false,
      reports: true,
      messages: false
    })
  })

  test('Staff sees only the units tab', async () => {
    await nav.login('staff')
    await nav.tabsVisible({
      applications: false,
      units: true,
      search: false,
      finance: false,
      reports: false,
      messages: false
    })
  })

  test('Unit supervisor sees units, reports and messaging tabs', async () => {
    await nav.login('unitSupervisor')
    await nav.tabsVisible({
      applications: false,
      units: true,
      search: false,
      finance: false,
      reports: true,
      messages: true
    })
  })
})

describe('Child information page sections', () => {
  test('Admin sees every collapsible sections', async () => {
    await nav.login('admin')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: true,
      guardians: true,
      fridgeParents: true,
      placements: true,
      serviceNeed: true,
      assistance: true,
      backupCare: true,
      familyContacts: true,
      childApplications: true,
      messageBlocklist: true,
      backupPickup: true
    })
  })

  test('Service worker sees guardians, parents, placements, backup care, service need, assistance, applicaitons and family contact sections ', async () => {
    await nav.login('serviceWorker')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: false,
      guardians: true,
      fridgeParents: true,
      placements: true,
      serviceNeed: true,
      assistance: true,
      backupCare: true,
      familyContacts: true,
      childApplications: true,
      messageBlocklist: false,
      backupPickup: false
    })
  })

  test('FinanceAdmin sees fee alterations, guardians, parents, placements backup cares and service need sections', async () => {
    await nav.login('financeAdmin')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: true,
      guardians: true,
      fridgeParents: true,
      placements: true,
      serviceNeed: true,
      assistance: false,
      backupCare: true,
      familyContacts: false,
      childApplications: false,
      messageBlocklist: false,
      backupPickup: false
    })
  })

  test('Staff sees family contacts, placements, backup care and service need sections', async () => {
    await nav.login('staff')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: false,
      guardians: false,
      fridgeParents: false,
      placements: true,
      serviceNeed: true,
      assistance: false,
      backupCare: true,
      familyContacts: true,
      childApplications: false,
      messageBlocklist: false,
      backupPickup: false
    })
  })

  test('Unit supervisor sees guardians, parents, placements, backup care, service need assistance, applications and family contacts sections', async () => {
    await nav.login('unitSupervisor')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: false,
      guardians: true,
      fridgeParents: true,
      placements: true,
      serviceNeed: true,
      assistance: true,
      backupCare: true,
      familyContacts: true,
      childApplications: true,
      messageBlocklist: false,
      backupPickup: false
    })
  })

  test('Special education techer sees family contacts, backup pickups, placements, backup care, service need and assistance sections', async () => {
    await nav.login('specialEducationTeacher')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: false,
      guardians: false,
      fridgeParents: false,
      placements: true,
      serviceNeed: true,
      assistance: true,
      backupCare: true,
      familyContacts: true,
      childApplications: false,
      messageBlocklist: false,
      backupPickup: true
    })
  })
})
