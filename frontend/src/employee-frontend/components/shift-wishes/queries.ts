// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Queries } from 'lib-common/query'

import {
  createWish,
  deleteWish,
  getOwnWishes,
  getWishUnits
} from '../../generated/api-clients/petajavesi'

const q = new Queries()

export const shiftWishUnitsQuery = q.query(getWishUnits)

export const ownShiftWishesQuery = q.query(getOwnWishes)

export const createShiftWishMutation = q.mutation(createWish, [
  ownShiftWishesQuery
])

export const deleteShiftWishMutation = q.mutation(deleteWish, [
  ownShiftWishesQuery
])
