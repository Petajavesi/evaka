// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import type { FeatureFlags } from 'lib-customizations/types'

import type { Env } from './env'
import { env } from './env'

type Features = {
  default: FeatureFlags
} & Record<Env, FeatureFlags>

const features: Features = {
  default: {
    environmentLabel: 'Local',
    citizenShiftCareAbsence: true,
    assistanceActionOther: true,
    daycareApplication: {
      dailyTimes: true,
      serviceNeedOption: true // Petäjävesi: changed false -> true
    },
    preschoolApplication: {
      connectedDaycarePreferredStartDate: true,
      serviceNeedOption: true // Petäjävesi: changed false -> true
    },
    decisionDraftMultipleUnits: false,
    preschool: true,
    preparatory: true,
    urgencyAttachments: true,
    financeDecisionHandlerSelect: false,
    feeDecisionPreschoolClubFilter: false,
    placementGuarantee: true,
    voucherUnitPayments: false, // Petäjävesi: changed true -> false
    voucherValueSeparation: true,
    extendedPreschoolTerm: true,
    citizenAttendanceSummary: false,
    intermittentShiftCare: false,
    noAbsenceType: false,
    discussionReservations: true,
    jamixIntegration: false, // Petäjävesi: changed true -> false
    nekkuIntegration: false,
    forceUnpublishDocumentTemplate: false, // Petäjävesi: changed true -> false
    invoiceDisplayAccountNumber: true,
    serviceApplications: true, // Petäjävesi: changed true -> false
    multiSelectDeparture: true,
    aromiIntegration: true,
    citizenChildDocumentTypes: true,
    decisionChildDocumentTypes: false, // Petäjävesi: changed true -> false
    showCitizenApplicationPreschoolTerms: false, // Petäjävesi: changed true -> false
    missingQuestionnaireAnswerMarkerEnabled: false,
    absenceApplications: true,
    showMetadataToCitizen: false, // Petäjävesi: changed true -> false
    placementDesktop: true,
    hideClubApplication: true, // Petäjävesi: added
    employeeLanguageSelection: true
  },
  test: { // Petäjävesi: renamed from staging
    environmentLabel: 'Test', // Petäjävesi: renamed from 'Staging'
    citizenShiftCareAbsence: true,
    assistanceActionOther: true,
    daycareApplication: {
      dailyTimes: true,
      serviceNeedOption: true // Petäjävesi: changed false -> true
    },
    preschoolApplication: {
      connectedDaycarePreferredStartDate: true,
      serviceNeedOption: true // Petäjävesi: changed false -> true
    },
    decisionDraftMultipleUnits: false,
    preschool: true,
    preparatory: true,
    urgencyAttachments: true,
    financeDecisionHandlerSelect: false,
    feeDecisionPreschoolClubFilter: false,
    placementGuarantee: true,
    extendedPreschoolTerm: true,
    citizenAttendanceSummary: false,
    voucherUnitPayments: false,
    voucherValueSeparation: true,
    intermittentShiftCare: false,
    noAbsenceType: false,
    discussionReservations: true,
    jamixIntegration: false,
    nekkuIntegration: false,
    forceUnpublishDocumentTemplate: false, // Petäjävesi: changed true -> false
    invoiceDisplayAccountNumber: true,
    serviceApplications: true,
    multiSelectDeparture: true,
    aromiIntegration: true,
    citizenChildDocumentTypes: true,
    decisionChildDocumentTypes: false, // Petäjävesi: changed true -> false
    showCitizenApplicationPreschoolTerms: false, // Petäjävesi: changed true -> false
    missingQuestionnaireAnswerMarkerEnabled: false,
    absenceApplications: true,
    showMetadataToCitizen: true, // Petäjävesi: changed true -> false
    placementDesktop: true,
    hideClubApplication: true, // Petäjävesi: added
    employeeLanguageSelection: true
  },
  prod: {
    environmentLabel: null,
    citizenShiftCareAbsence: true,
    assistanceActionOther: true,
    daycareApplication: {
      dailyTimes: true,
      serviceNeedOption: true // Petäjävesi: changed false -> true
    },
    preschoolApplication: {
      connectedDaycarePreferredStartDate: true,
      serviceNeedOption: true // Petäjävesi: changed false -> true
    },
    decisionDraftMultipleUnits: false,
    preschool: true,
    preparatory: true,
    urgencyAttachments: true,
    financeDecisionHandlerSelect: false,
    feeDecisionPreschoolClubFilter: false,
    placementGuarantee: true,
    extendedPreschoolTerm: true,
    citizenAttendanceSummary: false,
    voucherUnitPayments: false,
    voucherValueSeparation: true,
    intermittentShiftCare: false,
    noAbsenceType: false,
    discussionReservations: true,
    jamixIntegration: false, // Petäjävesi: added
    nekkuIntegration: false, // Petäjävesi: added
    forceUnpublishDocumentTemplate: false,
    invoiceDisplayAccountNumber: true,
    serviceApplications: true, // Petäjävesi: changed false -> true
    multiSelectDeparture: true,
    aromiIntegration: true,
    citizenChildDocumentTypes: true,
    decisionChildDocumentTypes: false, // Petäjävesi: changed true -> false
    showCitizenApplicationPreschoolTerms: false,
    missingQuestionnaireAnswerMarkerEnabled: false,
    absenceApplications: true,
    showMetadataToCitizen: false,
    placementDesktop: true,
    hideClubApplication: true, // Petäjävesi: added
  }
}

const featureFlags = features[env()]

export default featureFlags
