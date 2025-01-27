// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import config from '../config'
import { DevPerson } from '../generated/api-types'

import { Page, TextInput } from './page'

export async function enduserLogin(page: Page, person: DevPerson) {
  if (!person.ssn) {
    throw new Error('Person does not have an SSN: cannot login')
  }

  const authUrl = `${config.apiUrl}/citizen/auth/sfi/login/callback?RelayState=%2Fapplications`
  if (!page.url.startsWith(config.enduserUrl)) {
    // We must be in the correct domain to be able to fetch()
    await page.goto(config.enduserLoginUrl)
  }

  await page.page.evaluate(
    ({ ssn, authUrl }: { ssn: string; authUrl: string }) => {
      const params = new URLSearchParams()
      params.append('preset', ssn)
      return fetch(authUrl, {
        method: 'POST',
        body: params,
        redirect: 'manual'
      }).then((response) => {
        if (response.status >= 400) {
          throw new Error(
            `Fetch to {authUrl} failed with status ${response.status}`
          )
        }
      })
    },
    { ssn: person.ssn, authUrl }
  )
  await page.goto(config.enduserUrl + '/applications')
}

export async function enduserLoginWeak(
  page: Page,
  credentials: { username: string; password: string }
) {
  await page.goto(config.enduserLoginUrl)
  await page.findByDataQa('weak-login').click()

  const form = page.findByDataQa('weak-login-form')
  await new TextInput(form.find('[id="username"]')).fill(credentials.username)
  await new TextInput(form.find('[id="password"]')).fill(credentials.password)
  await form.findByDataQa('login').click()
  await form.findByDataQa('login').waitUntilHidden()

  await page.findByDataQa('header-city-logo').waitUntilVisible()
}

export async function employeeLogin(
  page: Page,
  {
    externalId,
    firstName,
    lastName,
    email
  }: {
    externalId?: string | null
    firstName: string
    lastName: string
    email?: string | null
  }
) {
  const authUrl = `${config.apiUrl}/employee/auth/ad/login/callback?RelayState=%2Femployee`
  const preset = JSON.stringify({
    externalId,
    firstName,
    lastName,
    email: email ?? ''
  })

  if (!page.url.startsWith(config.employeeUrl)) {
    // We must be in the correct domain to be able to fetch()
    await page.goto(config.employeeLoginUrl)
  }

  await page.page.evaluate(
    ({ preset, authUrl }: { preset: string; authUrl: string }) => {
      const params = new URLSearchParams()
      params.append('preset', preset)
      return fetch(authUrl, {
        method: 'POST',
        body: params,
        redirect: 'manual'
      }).then((response) => {
        if (response.status >= 400) {
          throw new Error(
            `Fetch to {authUrl} failed with status ${response.status}`
          )
        }
      })
    },
    { preset, authUrl }
  )
}
