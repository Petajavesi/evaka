// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { initializeAreaAndPersonData } from 'e2e-test-common/dev-api/data-init'
import { resetDatabase } from 'e2e-test-common/dev-api'
import { employeeLogin } from '../../utils/user'
import { UUID } from 'lib-common/types'
import config from '../../../e2e-test-common/config'
import { waitUntilEqual, waitUntilFalse, waitUntilTrue } from '../../utils'
import FridgeHeadInformationPage, {
  IncomesSection
} from '../../pages/employee/fridge-head-information-page'
import ErrorModal from '../../pages/employee/error-modal'
import { Page } from '../../utils/page'
import { Fixture } from '../../../e2e-test-common/dev-api/fixtures'

let page: Page
let personId: UUID
let incomesSection: IncomesSection

beforeEach(async () => {
  await resetDatabase()

  const fixtures = await initializeAreaAndPersonData()
  personId = fixtures.enduserGuardianFixture.id

  const financeAdmin = await Fixture.employeeFinanceAdmin().save()

  page = await Page.open()
  await employeeLogin(page, financeAdmin.data)
  await page.goto(config.employeeUrl + '/profile/' + personId)

  const fridgeHeadInformationPage = new FridgeHeadInformationPage(page)
  await fridgeHeadInformationPage.openIncomesCollapsible()
  incomesSection = fridgeHeadInformationPage.incomesSection()
})

describe('Income', () => {
  it('Create a new max fee accepted income', async () => {
    await incomesSection.openNewIncomeForm()

    await incomesSection.fillIncomeStartDate('1.1.2020')
    await incomesSection.fillIncomeEndDate('31.1.2020')
    await incomesSection.chooseIncomeEffect('MAX_FEE_ACCEPTED')
    await incomesSection.save()

    await waitUntilEqual(() => incomesSection.incomeListItemCount(), 1)
  })

  it('Create a new income with multiple values.', async () => {
    await incomesSection.openNewIncomeForm()

    await incomesSection.fillIncomeStartDate('1.1.2020')
    await incomesSection.fillIncomeEndDate('31.1.2020')
    await incomesSection.chooseIncomeEffect('INCOME')

    await incomesSection.fillIncome('MAIN_INCOME', '5000')
    await incomesSection.fillIncome('SECONDARY_INCOME', '100,50')
    await incomesSection.fillIncome('ALL_EXPENSES', '35,75')
    await incomesSection.save()

    await waitUntilEqual(() => incomesSection.incomeListItemCount(), 1)
    await waitUntilEqual(() => incomesSection.getIncomeSum(), '5100,50 €')
    await waitUntilEqual(() => incomesSection.getExpensesSum(), '35,75 €')
  })

  test('Income editor save button is disabled with invalid values', async () => {
    await incomesSection.openNewIncomeForm()

    // not a number
    await incomesSection.fillIncome('MAIN_INCOME', 'asd')
    await waitUntilTrue(() => incomesSection.saveIsDisabled())

    // too many decimals
    await incomesSection.fillIncome('MAIN_INCOME', '123,123')
    await waitUntilTrue(() => incomesSection.saveIsDisabled())

    await incomesSection.fillIncome('MAIN_INCOME', '100')
    await waitUntilFalse(() => incomesSection.saveIsDisabled())

    // inverted date range
    await incomesSection.fillIncomeStartDate('31.1.2020')
    await incomesSection.fillIncomeEndDate('1.1.2020')
    await waitUntilTrue(() => incomesSection.saveIsDisabled())
  })

  it('Existing income item can have its values updated.', async () => {
    // create new income item
    await incomesSection.openNewIncomeForm()

    await incomesSection.fillIncomeStartDate('1.1.2020')
    await incomesSection.fillIncomeEndDate('31.1.2020')
    await incomesSection.chooseIncomeEffect('INCOME')
    await incomesSection.fillIncome('MAIN_INCOME', '5000')
    await incomesSection.save()

    await waitUntilEqual(() => incomesSection.getIncomeSum(), '5000 €')
    await waitUntilEqual(() => incomesSection.getExpensesSum(), '0 €')

    // edit existing item
    await incomesSection.edit()

    await incomesSection.fillIncome('SECONDARY_INCOME', '200')
    await incomesSection.fillIncome('ALL_EXPENSES', '300')
    await incomesSection.fillIncome('MAIN_INCOME', '')
    await incomesSection.save()

    await waitUntilEqual(() => incomesSection.getIncomeSum(), '200 €')
    await waitUntilEqual(() => incomesSection.getExpensesSum(), '300 €')
  })

  it('Income coefficients are saved and affect the sum.', async () => {
    await incomesSection.openNewIncomeForm()

    await incomesSection.fillIncomeStartDate('1.1.2020')
    await incomesSection.fillIncomeEndDate('31.1.2020')

    await incomesSection.chooseIncomeEffect('INCOME')

    await incomesSection.fillIncome('MAIN_INCOME', '100000')
    await incomesSection.chooseCoefficient('MAIN_INCOME', 'YEARLY')

    await incomesSection.fillIncome('ALIMONY', '50')
    await incomesSection.fillIncome('ALL_EXPENSES', '35,75')

    await incomesSection.save()

    await waitUntilEqual(() => incomesSection.getIncomeSum(), '8380 €') // (100000 / 12) + 50
    await waitUntilEqual(() => incomesSection.getExpensesSum(), '35,75 €')
  })

  it('Non-contiguous incomes warning', async () => {
    await incomesSection.openNewIncomeForm()
    await incomesSection.fillIncomeStartDate('1.1.2020')
    await incomesSection.fillIncomeEndDate('31.1.2020')
    await incomesSection.chooseIncomeEffect('MAX_FEE_ACCEPTED')
    await incomesSection.save()

    await incomesSection.openNewIncomeForm()
    await incomesSection.fillIncomeStartDate('1.3.2020')
    await incomesSection.fillIncomeEndDate('31.3.2020')
    await incomesSection.chooseIncomeEffect('MAX_FEE_ACCEPTED')
    await incomesSection.save()

    const errorModal = new ErrorModal(page)
    await errorModal.ensureTitle('Tulotiedot puuttuvat joiltain päiviltä')
  })

  it('Overlapping incomes error', async () => {
    await incomesSection.openNewIncomeForm()
    await incomesSection.fillIncomeStartDate('1.1.2020')
    await incomesSection.fillIncomeEndDate('31.3.2020')
    await incomesSection.chooseIncomeEffect('MAX_FEE_ACCEPTED')
    await incomesSection.save()

    await incomesSection.openNewIncomeForm()
    await incomesSection.fillIncomeStartDate('1.2.2020')
    await incomesSection.fillIncomeEndDate('30.4.2020')
    await incomesSection.chooseIncomeEffect('MAX_FEE_ACCEPTED')
    await incomesSection.saveFailing()

    const errorModal = new ErrorModal(page)
    await errorModal.ensureText(
      'Ajanjaksolle on jo tallennettu tulotietoja! Tarkista tulotietojen voimassaoloajat.'
    )
  })
})
