// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { UUID } from '../../types'
import { Failure, Result, Success } from 'lib-common/api'
import { AssistanceBasis, AssistanceNeed } from '../../types/child'
import { client } from '../client'
import { JsonOf } from 'lib-common/json'
import LocalDate from 'lib-common/local-date'

export interface AssistanceNeedRequest {
  startDate: LocalDate
  endDate: LocalDate
  capacityFactor: number
  description: string
  bases: AssistanceBasis[]
  otherBasis: string
}

export async function createAssistanceNeed(
  childId: UUID,
  assistanceNeedData: AssistanceNeedRequest
): Promise<Result<AssistanceNeed>> {
  return client
    .post<JsonOf<AssistanceNeed>>(`/children/${childId}/assistance-needs`, {
      ...assistanceNeedData,
      startDate: assistanceNeedData.startDate.formatIso(),
      endDate: assistanceNeedData.endDate.formatIso()
    })
    .then((res) => res.data)
    .then((data) => ({
      ...data,
      startDate: LocalDate.parseIso(data.startDate),
      endDate: LocalDate.parseIso(data.endDate),
      bases: new Set(data.bases)
    }))
    .then((v) => Success.of(v))
    .catch((e) => Failure.fromError(e))
}

export async function getAssistanceNeeds(
  childId: UUID
): Promise<Result<AssistanceNeed[]>> {
  return client
    .get<JsonOf<AssistanceNeed[]>>(`/children/${childId}/assistance-needs`)
    .then((res) =>
      res.data.map((data) => ({
        ...data,
        startDate: LocalDate.parseIso(data.startDate),
        endDate: LocalDate.parseIso(data.endDate),
        bases: new Set(data.bases)
      }))
    )
    .then((v) => Success.of(v))
    .catch((e) => Failure.fromError(e))
}

export async function updateAssistanceNeed(
  assistanceNeedId: UUID,
  assistanceNeedData: AssistanceNeedRequest
): Promise<Result<AssistanceNeed>> {
  return client
    .put<JsonOf<AssistanceNeed>>(`/assistance-needs/${assistanceNeedId}`, {
      ...assistanceNeedData,
      startDate: assistanceNeedData.startDate.formatIso(),
      endDate: assistanceNeedData.endDate.formatIso()
    })
    .then((res) => res.data)
    .then((data) => ({
      ...data,
      startDate: LocalDate.parseIso(data.startDate),
      endDate: LocalDate.parseIso(data.endDate),
      bases: new Set(data.bases)
    }))
    .then((v) => Success.of(v))
    .catch((e) => Failure.fromError(e))
}

export async function removeAssistanceNeed(
  assistanceNeedId: UUID
): Promise<Result<null>> {
  return client
    .delete(`/assistance-needs/${assistanceNeedId}`)
    .then(() => Success.of(null))
    .catch((e) => Failure.fromError(e))
}
