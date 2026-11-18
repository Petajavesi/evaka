// SPDX-FileCopyrightText: 2017-2026 City of Espoo
// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import type { EmployeeMobileCustomizations } from 'lib-customizations/types'

import featureFlags from './featureFlags'
import { additionalStaffAttendanceTypes } from './shared'

const customizations: EmployeeMobileCustomizations = {
  appConfig: {},
  featureFlags,
  translations: {
    fi: {},
    sv: {}
  },
  additionalStaffAttendanceTypes
}

export default customizations
