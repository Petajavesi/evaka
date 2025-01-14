// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

import { wrapResult } from 'lib-common/api'
import {
  InvoiceDistinctiveParams,
  InvoiceStatus
} from 'lib-common/generated/api-types/invoicing'
import { DaycareId } from 'lib-common/generated/api-types/shared'
import LocalDate from 'lib-common/local-date'
import { Gap } from 'lib-components/white-space'

import { getUnits } from '../../generated/api-clients/daycare'
import { useTranslation } from '../../state/i18n'
import {
  InvoiceSearchFilters,
  InvoicingUiContext
} from '../../state/invoicing-ui'
import {
  AreaFilter,
  Filters,
  InvoiceDateFilter,
  InvoiceDistinctionsFilter,
  InvoiceStatusFilter,
  UnitFilter
} from '../common/Filters'

const getUnitsResult = wrapResult(getUnits)

const emptyFilters: InvoiceSearchFilters = {
  searchTerms: '',
  distinctiveDetails: [],
  area: [],
  status: 'DRAFT',
  startDate: undefined,
  endDate: undefined,
  useCustomDatesForInvoiceSending: false
}

export default React.memo(function InvoiceFilters() {
  const { i18n } = useTranslation()

  const {
    invoices: { setConfirmedSearchFilters },
    shared: { units, setUnits, availableAreas }
  } = useContext(InvoicingUiContext)

  const [searchFilters, _setSearchFilters] =
    useState<InvoiceSearchFilters>(emptyFilters)
  const setSearchFilters = useCallback(
    (value: React.SetStateAction<InvoiceSearchFilters>) => {
      _setSearchFilters(value)
      setConfirmedSearchFilters(undefined)
    },
    [setConfirmedSearchFilters]
  )
  const clearSearchFilters = useCallback(() => {
    _setSearchFilters(emptyFilters)
    setConfirmedSearchFilters(undefined)
  }, [setConfirmedSearchFilters])
  const confirmSearchFilters = useCallback(
    () => setConfirmedSearchFilters(searchFilters),
    [searchFilters, setConfirmedSearchFilters]
  )

  useEffect(() => {
    void getUnitsResult({ areaIds: null, type: 'DAYCARE', from: null }).then(
      setUnits
    )
  }, [setUnits])

  // remove selected unit filter if the unit is not included in the selected areas
  useEffect(() => {
    if (
      searchFilters.unit &&
      units.isSuccess &&
      !units.value.map(({ id }) => id).includes(searchFilters.unit)
    ) {
      setSearchFilters({ ...searchFilters, unit: undefined })
    }
  }, [units]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const selectUnit = useCallback(
    (unit?: DaycareId) => setSearchFilters((old) => ({ ...old, unit })),
    [setSearchFilters]
  )

  const toggleStatus = useCallback(
    (status: InvoiceStatus) => () =>
      setSearchFilters((old) => ({ ...old, status })),
    [setSearchFilters]
  )

  const toggleServiceNeed = useCallback(
    (id: InvoiceDistinctiveParams) => () =>
      setSearchFilters((old) =>
        old.distinctiveDetails.includes(id)
          ? {
              ...old,
              distinctiveDetails: old.distinctiveDetails.filter((v) => v !== id)
            }
          : {
              ...old,
              distinctiveDetails: [...old.distinctiveDetails, id]
            }
      ),
    [setSearchFilters]
  )

  const setStartDate = useCallback(
    (startDate: LocalDate | undefined) =>
      setSearchFilters((old) => ({ ...old, startDate })),
    [setSearchFilters]
  )

  const setEndDate = useCallback(
    (endDate: LocalDate | undefined) =>
      setSearchFilters((old) => ({ ...old, endDate })),
    [setSearchFilters]
  )

  const setUseCustomDatesForInvoiceSending = useCallback(
    (useCustomDatesForInvoiceSending: boolean) =>
      setSearchFilters((old) => ({ ...old, useCustomDatesForInvoiceSending })),
    [setSearchFilters]
  )

  return (
    <Filters
      searchPlaceholder={i18n.filters.freeTextPlaceholder}
      freeText={searchFilters.searchTerms}
      setFreeText={(s) =>
        setSearchFilters((prev) => ({ ...prev, searchTerms: s }))
      }
      onSearch={confirmSearchFilters}
      clearFilters={clearSearchFilters}
      column1={
        <>
          <AreaFilter
            areas={availableAreas.getOrElse([])}
            toggled={searchFilters.area}
            toggle={toggleArea}
          />
          <Gap size="L" />
          <UnitFilter
            units={units.getOrElse([])}
            selected={units
              .map((us) => us.find((unit) => unit.id === searchFilters.unit))
              .getOrElse(undefined)}
            select={selectUnit}
          />
        </>
      }
      column2={
        <Fragment>
          <InvoiceDistinctionsFilter
            toggled={searchFilters.distinctiveDetails}
            toggle={toggleServiceNeed}
          />
        </Fragment>
      }
      column3={
        <Fragment>
          <InvoiceStatusFilter
            toggled={searchFilters.status}
            toggle={toggleStatus}
          />
          <Gap size="L" />
          <InvoiceDateFilter
            startDate={searchFilters.startDate}
            setStartDate={setStartDate}
            endDate={searchFilters.endDate}
            setEndDate={setEndDate}
            searchByStartDate={searchFilters.useCustomDatesForInvoiceSending}
            setUseCustomDatesForInvoiceSending={
              setUseCustomDatesForInvoiceSending
            }
          />
        </Fragment>
      }
    />
  )
})
