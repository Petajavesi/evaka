// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Profile } from '@node-saml/node-saml'
import express, { NextFunction, Request, Response } from 'express'

import { logAuditEvent } from '../logging.js'
import { fromCallback } from '../promise-utils.js'
import { UserType } from '../service-client.js'
import { Sessions } from '../session.js'

export function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user || !req.user.id) {
    logAuditEvent(`evaka.apigw.auth.not_found`, req, 'Could not find user')
    res.sendStatus(401)
    return
  }
  return next()
}

export interface EvakaSessionUser {
  // eVaka id
  id?: string | undefined
  userType?: UserType | undefined
  // all are optional because of legacy sessions
  roles?: string[] | undefined
  globalRoles?: string[] | undefined
  allScopedRoles?: string[] | undefined
  mobileEmployeeId?: string | undefined
}

export function createUserHeader(user: EvakaSessionUser): string {
  return JSON.stringify(
    ((): object => {
      switch (user.userType) {
        case 'CITIZEN_WEAK':
          return { type: 'citizen_weak', id: user.id }
        case 'CITIZEN_STRONG':
          return { type: 'citizen', id: user.id }
        case 'EMPLOYEE':
          return {
            type: 'employee',
            id: user.id,
            globalRoles: user.globalRoles,
            allScopedRoles: user.allScopedRoles
          }
        case 'MOBILE':
          return {
            type: 'mobile',
            id: user.id,
            employeeId: user.mobileEmployeeId
          }
        case 'SYSTEM':
          return { type: 'system' }
        case undefined:
          throw new Error('User type is undefined')
      }
    })()
  )
}

export const integrationUserHeader = JSON.stringify({ type: 'integration' })

export function createLogoutToken(profile: Profile) {
  return `${profile.nameID}:::${profile.sessionIndex}`
}

export const login = async (
  req: express.Request,
  user: Express.User
): Promise<void> => {
  await fromCallback<void>((cb) => req.logIn(user, cb))
  // Passport has now regenerated the active session and saved it, so we have a
  // guarantee that the session ID has changed and Redis has stored the new session data
}

export const logout = async (
  sessions: Sessions,
  req: express.Request,
  res: express.Response
): Promise<void> => {
  // Pre-emptively clear the cookie, so even if something fails later, we
  // will end up clearing the cookie in the response
  res.clearCookie(sessions.cookieName)

  const logoutToken = req.session?.logoutToken?.value

  await fromCallback<void>((cb) => req.logOut(cb))
  // Passport has now saved the previous session with null user and regenerated
  // the active session, so we have a guarantee that the ID has changed and
  // the old session data in Redis no longer includes the user

  if (logoutToken) {
    await sessions.consumeLogoutToken(logoutToken)
  }
  await fromCallback((cb) =>
    req.session ? req.session.destroy(cb) : cb(undefined)
  )
}
