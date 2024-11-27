// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { OutgoingHttpHeaders } from 'node:http'

import type express from 'express'
import expressHttpProxy from 'express-http-proxy'
import _ from 'lodash'

import { evakaServiceUrl } from './config.js'
import { createServiceRequestHeaders } from './service-client.js'
import { Sessions } from './session.js'

interface ProxyOptions {
  sessions: Sessions | undefined
  path?: string | ((req: express.Request) => string)
  url?: string
}

export function createProxy({
  sessions,
  path,
  url = evakaServiceUrl
}: ProxyOptions) {
  return expressHttpProxy(url, {
    parseReqBody: false,
    proxyReqPathResolver: typeof path === 'string' ? () => path : path,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      const originalHeaders = lowercaseHeaderNames(proxyReqOpts.headers ?? {})

      // Remove sensitive headers
      delete originalHeaders['authorization']
      delete originalHeaders['x-user']

      const user = sessions?.getUser(srcReq)

      const serviceHeaders = lowercaseHeaderNames(
        createServiceRequestHeaders(srcReq, user)
      )
      proxyReqOpts.headers = {
        ...originalHeaders,
        ...serviceHeaders
      }
      return proxyReqOpts
    }
  })
}

function lowercaseHeaderNames(obj: OutgoingHttpHeaders): OutgoingHttpHeaders {
  return _.mapKeys(obj, (_, key) => key.toLowerCase())
}
