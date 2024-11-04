// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { Fragment, useCallback, useContext } from 'react'

import { ProviderType } from 'lib-common/generated/api-types/daycare'
import LocalDate from 'lib-common/local-date'
import { useQueryResult } from 'lib-common/query'
import { DatePickerClearableDeprecated } from 'lib-components/molecules/DatePickerDeprecated'
import { Label } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'

import { useTranslation } from '../../state/i18n'
import { InvoicingUiContext } from '../../state/invoicing-ui'
import { renderResult } from '../async-rendering'
import {
  AreaFilter,
  DateFilter,
  Filters,
  ProviderTypeFilter,
  UnitFilter
} from '../common/Filters'
import { unitFilterQuery } from '../unit/queries'

export default React.memo(function IncomeStatementsFilters({
  onSearch
}: {
  onSearch: () => void
}) {
  const {
    incomeStatements: { searchFilters, setSearchFilters, clearSearchFilters },
    shared: { availableAreas }
  } = useContext(InvoicingUiContext)
  const unitsResult = useQueryResult(
    unitFilterQuery({ areaIds: null, type: 'DAYCARE', from: null })
  )

  const { i18n } = useTranslation()

  const toggleArea = useCallback(
    (code: string) => () => {
      setSearchFilters((old) =>
        old.area.includes(code)
          ? {
              ...old,
              area: old.area.filter((v) => v !== code)
            }
          : {
              ...old,
              area: [...old.area, code]
            }
      )
    },
    [setSearchFilters]
  )

  const setUnit = useCallback(
    (unit: string | undefined) => setSearchFilters((old) => ({ ...old, unit })),
    [setSearchFilters]
  )

  const setSentStartDate = useCallback(
    (sentStartDate: LocalDate | undefined) =>
      setSearchFilters((old) => ({ ...old, sentStartDate })),
    [setSearchFilters]
  )

  const setSentEndDate = useCallback(
    (sentEndDate: LocalDate | undefined) =>
      setSearchFilters((old) => ({ ...old, sentEndDate })),
    [setSearchFilters]
  )

  const setPlacementValidDate = useCallback(
    (placementValidDate: LocalDate | undefined) =>
      setSearchFilters((old) => ({ ...old, placementValidDate })),
    [setSearchFilters]
  )

  const toggleProviderType = (providerType: ProviderType) => () => {
    setSearchFilters({
      ...searchFilters,
      providerTypes: searchFilters.providerTypes.includes(providerType)
        ? searchFilters.providerTypes.filter((p) => p !== providerType)
        : [...searchFilters.providerTypes, providerType]
    })
  }

  return (
    <Filters
      clearFilters={clearSearchFilters}
      onSearch={onSearch}
      column1={
        <>
          <AreaFilter
            areas={availableAreas.getOrElse([])}
            toggled={searchFilters.area}
            toggle={toggleArea}
          />
          <Gap size="L" />
          {renderResult(unitsResult, (units) => (
            <UnitFilter
              units={units}
              select={setUnit}
              selected={units.find(({ id }) => id === searchFilters.unit)}
            />
          ))}
        </>
      }
      column2={
        <Fragment>
          <ProviderTypeFilter
            toggled={searchFilters.providerTypes}
            toggle={toggleProviderType}
          />
        </Fragment>
      }
      column3={
        <Fragment>
          <DateFilter
            title={i18n.filters.incomeStatementSent}
            startDate={searchFilters.sentStartDate}
            setStartDate={setSentStartDate}
            endDate={searchFilters.sentEndDate}
            setEndDate={setSentEndDate}
          />
          <Gap size="L" />
          <Label>{i18n.filters.incomeStatementPlacementValidDate}</Label>
          <DatePickerClearableDeprecated
            date={searchFilters.placementValidDate}
            onChange={setPlacementValidDate}
            onCleared={() => setPlacementValidDate(undefined)}
          />
        </Fragment>
      }
    />
  )
})
