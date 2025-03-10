// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import orderBy from 'lodash/orderBy'
import range from 'lodash/range'
import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'

import { useTranslation } from 'employee-frontend/state/i18n'
import {
  RegionalSurveyReportAgeStatisticsResult,
  RegionalSurveyReportResult,
  RegionalSurveyReportYearlyStatisticsResult
} from 'lib-common/generated/api-types/reports'
import LocalDate from 'lib-common/local-date'
import { constantQuery, useQueryResult } from 'lib-common/query'
import Title from 'lib-components/atoms/Title'
import { Button } from 'lib-components/atoms/buttons/Button'
import ReturnButton from 'lib-components/atoms/buttons/ReturnButton'
import Combobox from 'lib-components/atoms/dropdowns/Combobox'
import Container, { ContentArea } from 'lib-components/layout/Container'
import {
  FixedSpaceColumn,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import { H2, Label } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'

import { renderResult } from '../async-rendering'
import { FlexRow } from '../common/styled/containers'

import ReportDownload from './ReportDownload'
import { FilterLabel, FilterRow } from './common'
import {
  tampereRegionalSurveyAgeReport,
  tampereRegionalSurveyMonthlyReport,
  tampereRegionalSurveyYearlyReport
} from './queries'

interface ReportQueryParams {
  year: number
}

interface ReportSelection {
  monthlyStatistics: boolean
  ageStatistics: boolean
  yearlyStatistics: boolean
}

const emptyReportSelection = {
  monthlyStatistics: false,
  ageStatistics: false,
  yearlyStatistics: false
}

const emptyMonthlyValue: RegionalSurveyReportResult = {
  monthlyCounts: [],
  year: 0
}

const emptyAgeValue: RegionalSurveyReportAgeStatisticsResult = {
  ageStatistics: [],
  year: 0
}

const emptyYearlyValue: RegionalSurveyReportYearlyStatisticsResult = {
  yearlyStatistics: [],
  year: 0
}

export default React.memo(function TampereRegionalSurveyReport() {
  const { i18n } = useTranslation()
  const t = i18n.reports.tampereRegionalSurvey
  const today = LocalDate.todayInHelsinkiTz()

  const [selectedYear, setSelectedYear] = useState<number | null>(
    today.year - 1
  )

  const yearOptions = range(
    LocalDate.todayInSystemTz().year,
    LocalDate.todayInSystemTz().year - 4,
    -1
  )

  const [activeParams, setActiveParams] = useState<ReportQueryParams | null>(
    null
  )

  const [reportSelection, setReportSelection] =
    useState<ReportSelection>(emptyReportSelection)

  const monthlyStatisticsResult = useQueryResult(
    activeParams && reportSelection.monthlyStatistics
      ? tampereRegionalSurveyMonthlyReport(activeParams)
      : constantQuery(emptyMonthlyValue)
  )

  const ageStatisticsResult = useQueryResult(
    activeParams && reportSelection.ageStatistics
      ? tampereRegionalSurveyAgeReport(activeParams)
      : constantQuery(emptyAgeValue)
  )

  const yearlyStatisticsResult = useQueryResult(
    activeParams && reportSelection.yearlyStatistics
      ? tampereRegionalSurveyYearlyReport(activeParams)
      : constantQuery(emptyYearlyValue)
  )

  const fetchMonthlyResults = useCallback(() => {
    if (selectedYear) {
      setReportSelection({ ...reportSelection, monthlyStatistics: true })
      setActiveParams({ year: selectedYear })
    }
  }, [selectedYear, reportSelection])

  const fetchAgeResults = useCallback(() => {
    if (selectedYear) {
      setReportSelection({ ...reportSelection, ageStatistics: true })
      setActiveParams({ year: selectedYear })
    }
  }, [selectedYear, reportSelection])

  const fetchYearlyResults = useCallback(() => {
    if (selectedYear) {
      setReportSelection({ ...reportSelection, yearlyStatistics: true })
      setActiveParams({ year: selectedYear })
    }
  }, [selectedYear, reportSelection])

  const changeYear = useCallback(
    (newYear: number | null) => {
      if (selectedYear !== newYear) {
        setSelectedYear(newYear)
        setReportSelection(emptyReportSelection)
      }
    },
    [selectedYear]
  )

  const sortedMonthlyReportResult = useMemo(
    () =>
      monthlyStatisticsResult.map((result) => {
        return {
          year: result.year,
          monthlyCounts: orderBy(result.monthlyCounts, [(r) => r.month])
        }
      }),
    [monthlyStatisticsResult]
  )

  return (
    <Container>
      <ReturnButton label={i18n.common.goBack} />
      <ContentArea opaque>
        <Title size={1}>{t.title}</Title>
        <FilterRow>
          <FilterLabel>{i18n.reports.common.period}</FilterLabel>
          <FlexRow>
            <Combobox
              fullWidth
              items={yearOptions}
              selectedItem={selectedYear}
              onChange={changeYear}
              placeholder={i18n.common.year}
            />
          </FlexRow>
        </FilterRow>
        <Gap size="m" />
        <FixedSpaceColumn spacing="xs">
          {!!selectedYear && <H2>{`${t.reportLabel} ${selectedYear}`}</H2>}
          <ReportRow spacing="L" alignItems="center" fullWidth>
            <ReportLabel>{t.monthlyReport}</ReportLabel>
            <Button
              primary
              disabled={!selectedYear}
              text={i18n.common.search}
              onClick={fetchMonthlyResults}
              data-qa="fetch-monthly-button"
            />
            {renderResult(sortedMonthlyReportResult, (result) => {
              return result.monthlyCounts.length > 0 &&
                result.year === selectedYear ? (
                <ReportDownload
                  data={result.monthlyCounts.map((row) => ({
                    ...row,
                    month: i18n.common.datetime.months[row.month - 1] ?? ''
                  }))}
                  columns={[
                    {
                      label: t.monthlyColumns.month,
                      value: (row) => row.month
                    },
                    {
                      label: t.monthlyColumns.municipalOver3FullTimeCount,
                      value: (row) => row.municipalOver3FullTimeCount
                    },
                    {
                      label: t.monthlyColumns.municipalOver3PartTimeCount,
                      value: (row) => row.municipalOver3PartTimeCount
                    },
                    {
                      label: t.monthlyColumns.municipalUnder3FullTimeCount,
                      value: (row) => row.municipalUnder3FullTimeCount
                    },
                    {
                      label: t.monthlyColumns.municipalUnder3PartTimeCount,
                      value: (row) => row.municipalUnder3PartTimeCount
                    },
                    {
                      label: t.monthlyColumns.familyOver3Count,
                      value: (row) => row.familyOver3Count
                    },
                    {
                      label: t.monthlyColumns.familyUnder3Count,
                      value: (row) => row.familyUnder3Count
                    },
                    {
                      label: t.monthlyColumns.municipalShiftCareCount,
                      value: (row) => row.municipalShiftCareCount
                    },
                    {
                      label: t.monthlyColumns.assistanceCount,
                      value: (row) => row.assistanceCount
                    }
                  ]}
                  filename={`${t.reportLabel} ${selectedYear} - ${t.monthlyReport}.csv`}
                />
              ) : null
            })}
          </ReportRow>
          <ReportRow spacing="L" alignItems="center" fullWidth>
            <ReportLabel>{t.ageStatisticsReport}</ReportLabel>
            <Button
              primary
              disabled={!selectedYear}
              text={i18n.common.search}
              onClick={fetchAgeResults}
              data-qa="fetch-age-button"
            />
            {renderResult(ageStatisticsResult, (result) => {
              return result.ageStatistics.length > 0 &&
                result.year === selectedYear ? (
                <ReportDownload
                  data={result.ageStatistics}
                  columns={[
                    {
                      label: t.ageStatisticColumns.voucherUnder3Count,
                      value: (row) => row.voucherUnder3Count
                    },
                    {
                      label: t.ageStatisticColumns.voucherOver3Count,
                      value: (row) => row.voucherOver3Count
                    },
                    {
                      label: t.ageStatisticColumns.purchasedUnder3Count,
                      value: (row) => row.purchasedUnder3Count
                    },
                    {
                      label: t.ageStatisticColumns.purchasedOver3Count,
                      value: (row) => row.purchasedOver3Count
                    },
                    {
                      label: t.ageStatisticColumns.clubUnder3Count,
                      value: (row) => row.clubUnder3Count
                    },
                    {
                      label: t.ageStatisticColumns.clubOver3Count,
                      value: (row) => row.clubOver3Count
                    },
                    {
                      label: t.ageStatisticColumns.nonNativeLanguageUnder3Count,
                      value: (row) => row.nonNativeLanguageUnder3Count
                    },
                    {
                      label: t.ageStatisticColumns.nonNativeLanguageOver3Count,
                      value: (row) => row.nonNativeLanguageOver3Count
                    },
                    {
                      label: t.ageStatisticColumns.effectiveCareDaysUnder3Count,
                      value: (row) => row.effectiveCareDaysUnder3Count
                    },
                    {
                      label: t.ageStatisticColumns.effectiveCareDaysOver3Count,
                      value: (row) => row.effectiveCareDaysOver3Count
                    },
                    {
                      label:
                        t.ageStatisticColumns
                          .effectiveFamilyDaycareDaysUnder3Count,
                      value: (row) => row.effectiveFamilyDaycareDaysUnder3Count
                    },
                    {
                      label:
                        t.ageStatisticColumns
                          .effectiveFamilyDaycareDaysOver3Count,
                      value: (row) => row.effectiveFamilyDaycareDaysOver3Count
                    }
                  ]}
                  filename={`${t.reportLabel} ${selectedYear} - ${t.ageStatisticsReport}.csv`}
                />
              ) : null
            })}
          </ReportRow>
          <ReportRow spacing="L" alignItems="center" fullWidth>
            <ReportLabel>{t.yearlyStatisticsReport}</ReportLabel>
            <Button
              primary
              disabled={!selectedYear}
              text={i18n.common.search}
              onClick={fetchYearlyResults}
              data-qa="fetch-yearly-button"
            />
            {renderResult(yearlyStatisticsResult, (result) => {
              return result.yearlyStatistics.length > 0 &&
                result.year === selectedYear ? (
                <ReportDownload
                  data={result.yearlyStatistics}
                  columns={[
                    {
                      label: t.yearlyStatisticsColumns.voucherTotalCount,
                      value: (row) => row.voucherTotalCount
                    },
                    {
                      label: t.yearlyStatisticsColumns.voucherAssistanceCount,
                      value: (row) => row.voucherAssistanceCount
                    },
                    {
                      label: t.yearlyStatisticsColumns.voucher5YearOldCount,
                      value: (row) => row.voucher5YearOldCount
                    },
                    {
                      label: t.yearlyStatisticsColumns.purchased5YearlOldCount,
                      value: (row) => row.purchased5YearOldCount
                    },
                    {
                      label: t.yearlyStatisticsColumns.municipal5YearOldCount,
                      value: (row) => row.municipal5YearOldCount
                    },
                    {
                      label: t.yearlyStatisticsColumns.familyCare5YearOldCount,
                      value: (row) => row.familyCare5YearOldCount
                    },
                    {
                      label: t.yearlyStatisticsColumns.club5YearOldCount,
                      value: (row) => row.club5YearOldCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns.preschoolDaycareUnitCareCount,
                      value: (row) => row.preschoolDaycareUnitCareCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns
                          .preschoolDaycareSchoolCareCount,
                      value: (row) => row.preschoolDaycareSchoolCareCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns
                          .preschoolDaycareFamilyCareCount,
                      value: (row) => row.preschoolDaycareFamilyCareCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns
                          .preschoolDaycareSchoolShiftCareCount,
                      value: (row) => row.preschoolDaycareSchoolShiftCareCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns
                          .preschoolDaycareUnitShiftCareCount,
                      value: (row) => row.preschoolDaycareUnitShiftCareCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns.voucherGeneralAssistanceCount,
                      value: (row) => row.voucherGeneralAssistanceCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns.voucherSpecialAssistanceCount,
                      value: (row) => row.voucherSpecialAssistanceCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns
                          .voucherEnhancedAssistanceCount,
                      value: (row) => row.voucherEnhancedAssistanceCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns
                          .municipalGeneralAssistanceCount,
                      value: (row) => row.municipalGeneralAssistanceCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns
                          .municipalSpecialAssistanceCount,
                      value: (row) => row.municipalSpecialAssistanceCount
                    },
                    {
                      label:
                        t.yearlyStatisticsColumns
                          .municipalEnhancedAssistanceCount,
                      value: (row) => row.municipalEnhancedAssistanceCount
                    }
                  ]}
                  filename={`${t.reportLabel} ${selectedYear} - ${t.yearlyStatisticsReport}.csv`}
                />
              ) : null
            })}
          </ReportRow>
        </FixedSpaceColumn>
      </ContentArea>
    </Container>
  )
})

const ReportLabel = styled(Label)`
  width: 200px;
`

const ReportRow = styled(FixedSpaceRow)`
  min-height: 105px;
`
