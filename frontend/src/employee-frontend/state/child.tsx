// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { Recipient } from 'lib-common/generated/api-types/messaging'
import { FeeAlteration } from '../types/fee-alteration'
import { ChildBackupCare } from '../types/child'
import { Loading, Result } from 'lib-common/api'
import { Parentship, PersonJSON } from 'lib-common/generated/api-types/pis'
import { VasuDocumentSummary } from '../components/vasu/api'
import { Action } from 'lib-common/generated/action'
import { PedagogicalDocument } from 'lib-common/generated/api-types/pedagogicaldocument'
import { PersonApplicationSummary } from 'lib-common/generated/api-types/application'
import { DaycarePlacementWithDetails } from 'lib-common/generated/api-types/placement'
import { AdditionalInformation } from 'lib-common/generated/api-types/daycare'
import { getPlacements } from '../api/child/placements'
import { useApiState, useRestApi } from 'lib-common/utils/useRestApi'
import { UUID } from 'lib-common/types'
import { getChildDetails } from '../api/person'
import { requireRole } from '../utils/roles'
import { getParentshipsByChild } from '../api/parentships'
import { UserContext } from './user'
import { ChildResponse } from 'lib-common/generated/api-types/daycare'

export interface ChildState {
  person: Result<PersonJSON>
  setPerson: (value: PersonJSON) => void
  permittedActions: Set<Action.Child | Action.Person>
  additionalInformation: Result<AdditionalInformation>
  setAdditionalInformation: (request: Result<AdditionalInformation>) => void
  feeAlterations: Result<FeeAlteration[]>
  setFeeAlterations: (result: Result<FeeAlteration[]>) => void
  placements: Result<DaycarePlacementWithDetails[]>
  loadPlacements: () => void
  parentships: Result<Parentship[]>
  backupCares: Result<ChildBackupCare[]>
  setBackupCares: (request: Result<ChildBackupCare[]>) => void
  guardians: Result<PersonJSON[]>
  setGuardians: (request: Result<PersonJSON[]>) => void
  applications: Result<PersonApplicationSummary[]>
  setApplications: (r: Result<PersonApplicationSummary[]>) => void
  recipients: Result<Recipient[]>
  setRecipients: (r: Result<Recipient[]>) => void
  vasus: Result<VasuDocumentSummary[]>
  setVasus: (r: Result<VasuDocumentSummary[]>) => void
  pedagogicalDocuments: Result<PedagogicalDocument[]>
  setPedagogicalDocuments: (r: Result<PedagogicalDocument[]>) => void
}

const emptyPermittedActions = new Set<Action.Child | Action.Person>()

const defaultState: ChildState = {
  person: Loading.of(),
  setPerson: () => undefined,
  permittedActions: emptyPermittedActions,
  additionalInformation: Loading.of(),
  setAdditionalInformation: () => undefined,
  feeAlterations: Loading.of(),
  setFeeAlterations: () => undefined,
  placements: Loading.of(),
  loadPlacements: () => undefined,
  parentships: Loading.of(),
  backupCares: Loading.of(),
  setBackupCares: () => undefined,
  guardians: Loading.of(),
  setGuardians: () => undefined,
  applications: Loading.of(),
  setApplications: () => undefined,
  recipients: Loading.of(),
  setRecipients: () => undefined,
  vasus: Loading.of(),
  setVasus: () => undefined,
  pedagogicalDocuments: Loading.of(),
  setPedagogicalDocuments: () => undefined
}

export const ChildContext = createContext<ChildState>(defaultState)

export const ChildContextProvider = React.memo(function ChildContextProvider({
  id,
  children
}: {
  id: UUID
  children: JSX.Element
}) {
  const { roles } = useContext(UserContext)

  const [childResponse, setChildResponse] = useState<Result<ChildResponse>>(
    Loading.of()
  )
  const [permittedActions, setPermittedActions] = useState<
    Set<Action.Child | Action.Person>
  >(emptyPermittedActions)

  const setFullChildResponse = useCallback(
    (response: Result<ChildResponse>) => {
      setPermittedActions(
        response
          .map(
            ({ permittedActions, permittedPersonActions }) =>
              new Set([...permittedActions, ...permittedPersonActions])
          )
          .getOrElse(emptyPermittedActions)
      )
      setChildResponse(response)
    },
    []
  )
  const loadChild = useRestApi(getChildDetails, setFullChildResponse)
  useEffect(() => loadChild(id), [loadChild, id])

  const person = useMemo(
    () => childResponse.map((response) => response.person),
    [childResponse]
  )
  const setPerson = useCallback(
    (person: PersonJSON) =>
      setChildResponse((prev) =>
        prev.map((child) => ({
          ...child,
          person
        }))
      ),
    []
  )

  const [additionalInformation, setAdditionalInformation] = useState<
    Result<AdditionalInformation>
  >(defaultState.additionalInformation)
  const [feeAlterations, setFeeAlterations] = useState<Result<FeeAlteration[]>>(
    defaultState.feeAlterations
  )
  const [placements, loadPlacements] = useApiState(
    () => getPlacements(id),
    [id]
  )
  const [parentships] = useApiState(
    async (): Promise<Result<Parentship[]>> =>
      requireRole(roles, 'SERVICE_WORKER', 'UNIT_SUPERVISOR', 'FINANCE_ADMIN')
        ? await getParentshipsByChild(id)
        : Loading.of(),
    [roles, id]
  )
  const [backupCares, setBackupCares] = useState<Result<ChildBackupCare[]>>(
    defaultState.backupCares
  )
  const [guardians, setGuardians] = useState<Result<PersonJSON[]>>(
    defaultState.guardians
  )
  const [applications, setApplications] = useState<
    Result<PersonApplicationSummary[]>
  >(defaultState.applications)
  const [vasus, setVasus] = useState<Result<VasuDocumentSummary[]>>(
    defaultState.vasus
  )

  const [recipients, setRecipients] = useState<Result<Recipient[]>>(
    defaultState.recipients
  )

  const [pedagogicalDocuments, setPedagogicalDocuments] = useState<
    Result<PedagogicalDocument[]>
  >(defaultState.pedagogicalDocuments)

  const value = useMemo(
    (): ChildState => ({
      person,
      setPerson,
      permittedActions,
      additionalInformation,
      setAdditionalInformation,
      feeAlterations,
      setFeeAlterations,
      placements,
      loadPlacements,
      parentships,
      backupCares,
      setBackupCares,
      guardians,
      setGuardians,
      vasus,
      setVasus,
      applications,
      setApplications,
      recipients,
      setRecipients,
      pedagogicalDocuments,
      setPedagogicalDocuments
    }),
    [
      person,
      setPerson,
      permittedActions,
      additionalInformation,
      feeAlterations,
      placements,
      loadPlacements,
      parentships,
      backupCares,
      guardians,
      vasus,
      applications,
      recipients,
      pedagogicalDocuments
    ]
  )

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>
})
