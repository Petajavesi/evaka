// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications

import type { DaycareId } from 'lib-common/generated/api-types/shared'
import type { EmployeeId } from 'lib-common/generated/api-types/shared'
import type { JsonCompatible } from 'lib-common/json'
import type { JsonOf } from 'lib-common/json'
import LocalDate from 'lib-common/local-date'
import type { ShiftPlanUnit } from 'lib-common/generated/api-types/petajavesi'
import type { ShiftPlanUpdateRequest } from 'lib-common/generated/api-types/petajavesi'
import type { ShiftPlanWeekResponse } from 'lib-common/generated/api-types/petajavesi'
import type { ShiftWishCreateRequest } from 'lib-common/generated/api-types/petajavesi'
import type { ShiftWishId } from 'lib-common/generated/api-types/shared'
import type { ShiftWishResolveRequest } from 'lib-common/generated/api-types/petajavesi'
import type { ShiftWishesResponse } from 'lib-common/generated/api-types/petajavesi'
import type { Uri } from 'lib-common/uri'
import { client } from '../../api/client'
import { deserializeJsonShiftPlanWeekResponse } from 'lib-common/generated/api-types/petajavesi'
import { deserializeJsonShiftWishesResponse } from 'lib-common/generated/api-types/petajavesi'
import { uri } from 'lib-common/uri'


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanningController.getEmployeePdf
*/
export function getEmployeePdf(
  request: {
    unitId: DaycareId,
    weekStart: LocalDate,
    employeeId: EmployeeId
  }
): { url: Uri } {
  return {
    url: uri`/employee/shift-planning/units/${request.unitId}/weeks/${request.weekStart.formatIso()}/pdf/employees/${request.employeeId}`.withBaseUrl(client.defaults.baseURL ?? '')
  }
}


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanningController.getEmployeesPdf
*/
export function getEmployeesPdf(
  request: {
    unitId: DaycareId,
    weekStart: LocalDate
  }
): { url: Uri } {
  return {
    url: uri`/employee/shift-planning/units/${request.unitId}/weeks/${request.weekStart.formatIso()}/pdf/employees`.withBaseUrl(client.defaults.baseURL ?? '')
  }
}


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanningController.getPdf
*/
export function getPdf(
  request: {
    unitId: DaycareId,
    weekStart: LocalDate
  }
): { url: Uri } {
  return {
    url: uri`/employee/shift-planning/units/${request.unitId}/weeks/${request.weekStart.formatIso()}/pdf`.withBaseUrl(client.defaults.baseURL ?? '')
  }
}


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanningController.getUnits
*/
export async function getUnits(): Promise<ShiftPlanUnit[]> {
  const { data: json } = await client.request<JsonOf<ShiftPlanUnit[]>>({
    url: uri`/employee/shift-planning/units`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanningController.getWeek
*/
export async function getWeek(
  request: {
    unitId: DaycareId,
    weekStart: LocalDate
  }
): Promise<ShiftPlanWeekResponse> {
  const { data: json } = await client.request<JsonOf<ShiftPlanWeekResponse>>({
    url: uri`/employee/shift-planning/units/${request.unitId}/weeks/${request.weekStart.formatIso()}`.toString(),
    method: 'GET'
  })
  return deserializeJsonShiftPlanWeekResponse(json)
}


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanningController.resolveWish
*/
export async function resolveWish(
  request: {
    unitId: DaycareId,
    wishId: ShiftWishId,
    body: ShiftWishResolveRequest
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/employee/shift-planning/units/${request.unitId}/wishes/${request.wishId}`.toString(),
    method: 'PUT',
    data: request.body satisfies JsonCompatible<ShiftWishResolveRequest>
  })
  return json
}


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftPlanningController.updatePlan
*/
export async function updatePlan(
  request: {
    unitId: DaycareId,
    weekStart: LocalDate,
    body: ShiftPlanUpdateRequest
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/employee/shift-planning/units/${request.unitId}/weeks/${request.weekStart.formatIso()}`.toString(),
    method: 'PUT',
    data: request.body satisfies JsonCompatible<ShiftPlanUpdateRequest>
  })
  return json
}


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftWishController.createWish
*/
export async function createWish(
  request: {
    body: ShiftWishCreateRequest
  }
): Promise<ShiftWishId> {
  const { data: json } = await client.request<JsonOf<ShiftWishId>>({
    url: uri`/employee/shift-wishes`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<ShiftWishCreateRequest>
  })
  return json
}


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftWishController.deleteWish
*/
export async function deleteWish(
  request: {
    wishId: ShiftWishId
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/employee/shift-wishes/${request.wishId}`.toString(),
    method: 'DELETE'
  })
  return json
}


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftWishController.getOwnWishes
*/
export async function getOwnWishes(): Promise<ShiftWishesResponse> {
  const { data: json } = await client.request<JsonOf<ShiftWishesResponse>>({
    url: uri`/employee/shift-wishes`.toString(),
    method: 'GET'
  })
  return deserializeJsonShiftWishesResponse(json)
}


/**
* Generated from evaka.instance.petajavesi.shiftplanning.ShiftWishController.getWishUnits
*/
export async function getWishUnits(): Promise<ShiftPlanUnit[]> {
  const { data: json } = await client.request<JsonOf<ShiftPlanUnit[]>>({
    url: uri`/employee/shift-wishes/units`.toString(),
    method: 'GET'
  })
  return json
}
