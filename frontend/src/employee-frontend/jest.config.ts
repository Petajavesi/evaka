// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  displayName: 'employee-frontend',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testRunner: 'jest-circus/runner',
  moduleNameMapper: {
    Icons: '<rootDir>/../lib-icons/free-icons',
    '\\.css$': '<rootDir>/utils/mocks/styleMock.js',
    '\\.svg$': '<rootDir>/utils/mocks/fileMock.js',
    '@evaka/customizations/(.*)': '<rootDir>/../lib-customizations/espoo/$1'
  }
}
export default config
