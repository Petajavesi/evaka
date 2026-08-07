// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export type Env = 'dev' | 'test' | 'prod'

export const env = (): Env | 'default' => {
  if (window.location.host === 'evaka.petajavesi.fi') {
    return 'prod'
  }

  if (window.location.host === 'evaka-test.petajavesi.fi') {
    return 'test'
  }

  if (window.location.host === 'evaka-dev.petajavesi.fi') {
    return 'dev'
  }

  return 'default'
}
