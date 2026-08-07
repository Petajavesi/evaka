// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Queries } from 'lib-common/query'

import {
  getUnits,
  getWeek,
  resolveWish,
  updatePlan
} from '../../generated/api-clients/petajavesi'

const q = new Queries()

export const shiftPlanUnitsQuery = q.query(getUnits)

export const shiftPlanWeekQuery = q.query(getWeek)

export const updateShiftPlanMutation = q.mutation(updatePlan, [
  shiftPlanWeekQuery.prefix
])

export const resolveShiftWishMutation = q.mutation(resolveWish, [
  shiftPlanWeekQuery.prefix
])
