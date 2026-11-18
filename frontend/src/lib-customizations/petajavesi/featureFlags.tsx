// SPDX-FileCopyrightText: 2017-2026 City of Espoo
// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import type { FeatureFlags } from 'lib-customizations/types'

import type { Env } from './env'
import { env } from './env'

type Features = {
  default: FeatureFlags
} & Record<Env, FeatureFlags>

// Yksi perusjoukko ja ympäristökohtaiset poikkeamat (vesilahti/featureFlags.tsx-malli). Arvot ovat
// lähtötilanteen mukaiset; erot lähtötilanteeseen: lippu `decisionReasoningOptions` on poistettu
// (ei ole BaseFeatureFlags-tyypin jäsen eikä yksikään komponentti lue sitä), prod-lohkoon on lisätty
// `employeeLanguageSelection: true` kuten muihin lohkoihin, ja `dev`-lohko on lisätty test-lohkon
// arvoilla.
const baseFeatures: FeatureFlags = {
  environmentLabel: null,
  citizenShiftCareAbsence: true,
  assistanceActionOther: true,
  daycareApplication: {
    dailyTimes: true,
    serviceNeedOption: true
  },
  preschoolApplication: {
    connectedDaycarePreferredStartDate: true,
    serviceNeedOption: true
  },
  decisionDraftMultipleUnits: false,
  preschool: true,
  preparatory: true,
  urgencyAttachments: true,
  financeDecisionHandlerSelect: false,
  feeDecisionPreschoolClubFilter: false,
  placementGuarantee: true,
  voucherUnitPayments: false,
  voucherValueSeparation: true,
  extendedPreschoolTerm: true,
  citizenAttendanceSummary: false,
  intermittentShiftCare: false,
  noAbsenceType: false,
  discussionReservations: true,
  jamixIntegration: false,
  nekkuIntegration: false,
  forceUnpublishDocumentTemplate: false,
  invoiceDisplayAccountNumber: true,
  serviceApplications: true,
  multiSelectDeparture: true,
  archiveIntegration: {
    childDocuments: true
  },
  aromiIntegration: true,
  citizenChildDocumentTypes: true,
  decisionChildDocumentTypes: false,
  showCitizenApplicationPreschoolTerms: false,
  missingQuestionnaireAnswerMarkerEnabled: false,
  absenceApplications: true,
  showMetadataToCitizen: false,
  placementDesktop: true,
  hideClubApplication: true,
  employeeLanguageSelection: true
}

const features: Features = {
  default: {
    ...baseFeatures,
    environmentLabel: 'Local'
  },
  dev: {
    ...baseFeatures,
    environmentLabel: 'Dev',
    showMetadataToCitizen: true
  },
  test: {
    ...baseFeatures,
    environmentLabel: 'Test',
    showMetadataToCitizen: true
  },
  prod: {
    ...baseFeatures
  }
}

const featureFlags = features[env()]

export default featureFlags
