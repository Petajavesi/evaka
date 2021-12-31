// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from 'e2e-test-common/dev-api/data-init'
import { daycareGroupFixture, Fixture } from 'e2e-test-common/dev-api/fixtures'
import {
  insertDaycareGroupFixtures,
  resetDatabase
} from 'e2e-test-common/dev-api'
import ChildInformationPage from '../../pages/employee/child-information'
import { PersonDetail } from 'e2e-test-common/dev-api/types'
import { employeeLogin } from 'e2e-playwright/utils/user'
import { Page } from '../../utils/page'
import LocalDate from 'lib-common/local-date'
import CreateApplicationModal from '../../pages/employee/applications/create-application-modal'

let childInformationPage: ChildInformationPage

let fixtures: AreaAndPersonFixtures
let page: Page
let createApplicationModal: CreateApplicationModal

beforeEach(async () => {
  await resetDatabase()
  fixtures = await initializeAreaAndPersonData()
  await insertDaycareGroupFixtures([daycareGroupFixture])
  const admin = await Fixture.employeeAdmin().save()

  page = await Page.open()
  await employeeLogin(page, admin.data)

  childInformationPage = new ChildInformationPage(page)
  await childInformationPage.navigateToChild(
    fixtures.enduserChildFixtureJari.id
  )

  const applications = await childInformationPage.openCollapsible(
    'applications'
  )
  createApplicationModal = await applications.openCreateApplicationModal()
})

const formatPersonName = (person: PersonDetail) =>
  `${person.lastName} ${person.firstName}`

const formatPersonAddress = ({
  streetAddress,
  postalCode,
  postOffice
}: PersonDetail) =>
  `${streetAddress ?? ''}, ${postalCode ?? ''} ${postOffice ?? ''}`

describe('Employee - paper application', () => {
  test('Paper application can be created for guardian and child with ssn', async () => {
    const applicationEditPage = await createApplicationModal.submit()
    await applicationEditPage.assertGuardian(
      formatPersonName(fixtures.enduserGuardianFixture),
      fixtures.enduserGuardianFixture.ssn ?? '',
      formatPersonAddress(fixtures.enduserGuardianFixture)
    )
  })

  test('Paper application can be created for other guardian and child with ssn', async () => {
    await createApplicationModal.selectGuardian('Ville Vilkas')
    const applicationEditPage = await createApplicationModal.submit()

    await applicationEditPage.assertGuardian(
      formatPersonName(fixtures.enduserChildJariOtherGuardianFixture),
      fixtures.enduserChildJariOtherGuardianFixture.ssn ?? '',
      formatPersonAddress(fixtures.enduserChildJariOtherGuardianFixture)
    )
  })

  test('Paper application can be created for other non guardian vtj person and child with ssn', async () => {
    await createApplicationModal.selectVtjPersonAsGuardian('270372-905L') // From service mock-vtj-data.json
    const applicationEditPage = await createApplicationModal.submit()

    await applicationEditPage.assertGuardian(
      'Korhonen-Hämäläinen Sirkka-Liisa Marja-Leena Minna-Mari Anna-Kaisa',
      '270372-905L',
      'Kamreerintie 2, 00370 Espoo'
    )
  })

  test('Paper application can be created with new guardian person', async () => {
    await createApplicationModal.selectCreateNewPersonAsGuardian(
      'Testi',
      'Testinen',
      '01.11.1980',
      'Katuosoite A1',
      '02200',
      'Espoo',
      '123456789',
      'testi.testinen@evaka.test'
    )
    const applicationEditPage = await createApplicationModal.submit()

    await applicationEditPage.assertGuardian(
      'Testinen Testi',
      '',
      'Katuosoite A1, 02200 Espoo'
    )
  })

  test('Service worker fills paper application with minimal info and saves it', async () => {
    const applicationEditPage = await createApplicationModal.submit()

    await applicationEditPage.fillStartDate(LocalDate.today().format())
    await applicationEditPage.fillTimes()
    await applicationEditPage.pickUnit(fixtures.daycareFixture.name)
    await applicationEditPage.fillApplicantPhoneAndEmail(
      '123456',
      'email@evaka.test'
    )
    const applicationViewPage = await applicationEditPage.saveApplication()
    await applicationViewPage.waitUntilLoaded()
  })

  test('Service worker fills paper application with second guardian contact info and agreement status', async () => {
    const applicationEditPage = await createApplicationModal.submit()

    await applicationEditPage.fillStartDate(LocalDate.today().format())
    await applicationEditPage.fillTimes()
    await applicationEditPage.pickUnit(fixtures.daycareFixture.name)
    await applicationEditPage.fillApplicantPhoneAndEmail(
      '123456',
      'email@evaka.test'
    )

    await applicationEditPage.fillSecondGuardianContactInfo(
      '654321',
      'second-email@evaka.test'
    )
    await applicationEditPage.setGuardianAgreementStatus('AGREED')

    const applicationViewPage = await applicationEditPage.saveApplication()
    await applicationViewPage.waitUntilLoaded()
  })
})
