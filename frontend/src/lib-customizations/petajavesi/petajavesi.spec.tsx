// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

/**
 * Petäjäveden customizationin pysyvät testit.
 * Toteutettu siemenellä alustetulla satunnaisgeneraattorilla ilman uutta testikirjastoa, jotta
 * upstreamin package.json pysyy muuttumattomana. Ajo: EVAKA_CUSTOMIZATIONS=petajavesi
 *   yarn test --config src/lib-customizations/petajavesi/vitest.config.ts
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { render, screen } from '@testing-library/react'
import mergeWith from 'lodash/mergeWith'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mergeCustomizer } from 'lib-customizations/common'
import enDefaults from 'lib-customizations/defaults/citizen/i18n/en'
import fiDefaults from 'lib-customizations/defaults/citizen/i18n/fi'
import svDefaults from 'lib-customizations/defaults/citizen/i18n/sv'
import { fi as employeeFiDefaults } from 'lib-customizations/defaults/employee/i18n/fi'
import { sv as employeeSvDefaults } from 'lib-customizations/defaults/employee/i18n/sv'

import espooCitizen from '../espoo/citizen'
import espooEmployee from '../espoo/employee'

const hosts = {
  prod: 'evaka.petajavesi.fi',
  test: 'evaka-test.petajavesi.fi',
  dev: 'evaka-dev.petajavesi.fi'
} as const

function stubHost(host: string) {
  vi.stubGlobal('location', {
    host,
    hostname: host.split(':')[0],
    protocol: 'https:',
    origin: `https://${host}`,
    href: `https://${host}/`,
    pathname: '/',
    search: '',
    hash: ''
  })
}

/** Deterministinen pseudosatunnaisgeneraattori (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  !React.isValidElement(v)

function leafPaths(
  obj: Record<string, unknown>,
  prefix: string[] = []
): string[][] {
  return Object.entries(obj).flatMap(([k, v]) =>
    isPlainObject(v) ? leafPaths(v, [...prefix, k]) : [[...prefix, k]]
  )
}

function get(obj: unknown, path: string[]): unknown {
  return path.reduce<unknown>(
    (acc, k) => (isPlainObject(acc) ? acc[k] : undefined),
    obj
  )
}

function setPath(
  target: Record<string, unknown>,
  path: string[],
  value: unknown
) {
  let cur = target
  for (const k of path.slice(0, -1)) {
    if (!isPlainObject(cur[k])) cur[k] = {}
    cur = cur[k] as Record<string, unknown>
  }
  cur[path[path.length - 1]] = value
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

// Ympäristön päättely isäntänimestä on täydellinen
describe('env()', () => {
  it('maps the three known hosts and everything else to default', async () => {
    const random = rng(14)
    for (const [expected, host] of Object.entries(hosts)) {
      stubHost(host)
      vi.resetModules()
      const { env } = await import('./env')
      expect(env()).toBe(expected)
    }
    for (let i = 0; i < 100; i++) {
      const label = Math.floor(random() * 1e9).toString(36)
      const host = [
        `${label}.petajavesi.fi`,
        `evaka.${label}.fi`,
        `localhost:${1000 + i}`,
        `evaka.petajavesi.fi.${label}`
      ][i % 4]
      stubHost(host)
      vi.resetModules()
      const { env } = await import('./env')
      expect(env()).toBe('default')
    }
  })
})

// Lippujen nimijoukko on sama jokaisessa ympäristössä
describe('featureFlags', () => {
  it('has the same flag names in every environment', async () => {
    const keySets: string[][] = []
    for (const host of [...Object.values(hosts), 'localhost:9099']) {
      stubHost(host)
      vi.resetModules()
      const { default: flags } = await import('./featureFlags')
      expect(flags).toBeDefined()
      keySets.push(Object.keys(flags).sort())
    }
    for (const keys of keySets) expect(keys).toEqual(keySets[0])
  })
})

// Käännösten syväyhdistäminen korvaa vain nimetyt avaimet
describe('deep merge of translations', () => {
  it('overrides only the named keys and keeps the key set', () => {
    const random = rng(15)
    const defaults: Record<string, unknown> = fiDefaults
    const paths = leafPaths(defaults).filter(
      (p) => typeof get(defaults, p) === 'string'
    )
    for (let i = 0; i < 100; i++) {
      const chosen = new Set<string>()
      const overrides: Record<string, unknown> = {}
      const count = 1 + Math.floor(random() * 20)
      for (let j = 0; j < count; j++) {
        const path = paths[Math.floor(random() * paths.length)]
        chosen.add(path.join('.'))
        setPath(overrides, path, `override-${i}-${j}`)
      }
      const merged = mergeWith({}, defaults, overrides, mergeCustomizer)
      for (const path of paths) {
        const key = path.join('.')
        if (chosen.has(key)) {
          expect(get(merged, path)).toBe(get(overrides, path))
        } else {
          expect(get(merged, path)).toBe(get(defaults, path))
        }
      }
      expect(
        leafPaths(merged)
          .map((p) => p.join('.'))
          .sort()
      ).toEqual(
        leafPaths(defaults)
          .map((p) => p.join('.'))
          .sort()
      )
    }
  })
})

// Yhdistetty käännöspuu ei sisällä tyhjiä arvoja eikä
// avaimen nimiä. Tarkennus: upstreamin oletuskäännöksissä ja Espoon customizationissa on
// tietoisesti tyhjiä arvoja (esim. components.treeDropdown.expandDropdown ja
// decisions.assistanceDecisions.decision.unitMayChange); ne periytyvät Petäjävedelle sellaisinaan
// eikä niitä lasketa poikkeamiksi. Petäjäveden omat ylikirjoitukset eivät saa olla tyhjiä.
describe('merged translations', () => {
  it('contain no empty strings and no key paths as values', async () => {
    stubHost(hosts.test)
    vi.resetModules()
    const citizen = await import('lib-customizations/citizen')
    const employee = await import('lib-customizations/employee')
    const trees: [string, Record<string, unknown>, unknown, unknown][] = [
      [
        'citizen.fi',
        citizen.translations.fi,
        fiDefaults,
        espooCitizen.translations.fi
      ],
      [
        'citizen.sv',
        citizen.translations.sv,
        svDefaults,
        espooCitizen.translations.sv
      ],
      [
        'citizen.en',
        citizen.translations.en,
        enDefaults,
        espooCitizen.translations.en
      ],
      [
        'employee.fi',
        employee.translations.fi,
        employeeFiDefaults,
        espooEmployee.translations.fi
      ],
      [
        'employee.sv',
        employee.translations.sv,
        employeeSvDefaults,
        espooEmployee.translations.sv
      ]
    ]
    for (const [name, tree, defaults, espooOverrides] of trees) {
      const offenders = leafPaths(tree)
        .filter((path) => {
          const value = get(tree, path)
          if (typeof value !== 'string') return false
          const inherited =
            get(defaults, path) === value || get(espooOverrides, path) === value
          return !inherited && (value.trim() === '' || value === path.join('.'))
        })
        .map((p) => `${name}:${p.join('.')}=${JSON.stringify(get(tree, p))}`)
      expect(offenders).toEqual([])
    }
  })
})

// Kuntalogo renderöityy ei-tyhjällä lähteellä ja vaihtoehtoisella tekstillä
describe('CityLogo', () => {
  it('renders an image with a source and alt text', async () => {
    stubHost(hosts.test)
    vi.resetModules()
    const { cityLogo } = await import('lib-customizations/employee')
    expect('src' in cityLogo).toBe(true)
    const { CityLogo } = await import('lib-components/atoms/CityLogo')
    render(<CityLogo />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBeTruthy()
    expect(img.getAttribute('alt')).toBeTruthy()
  })
})

// Jokaiseen Petäjäveden customization-tiedostoon viitataan
// ja jokaisella on lisenssitieto
describe('customization files', () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const libCustomizations = dirname(here)
  const frontendRoot = join(libCustomizations, '..', '..')

  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) {
        return name === 'baseline' ? [] : walk(path)
      }
      return [path]
    })
  }

  const isTestInfra = (path: string) =>
    path.endsWith('.spec.tsx') || path.endsWith('vitest.config.ts')
  const files = walk(here).filter(
    (path) => !path.endsWith('.license') && !isTestInfra(path)
  )
  const referencingSources = [
    ...walk(here).filter((path) => /\.tsx?$/.test(path) && !isTestInfra(path)),
    ...readdirSync(libCustomizations)
      .filter((name) => /\.tsx?$/.test(name))
      .map((name) => join(libCustomizations, name)),
    join(frontendRoot, 'vite.config.ts')
  ]
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n')

  it('exist', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('all carry REUSE license information', () => {
    const unlicensed = files.filter((path) => {
      if (existsSync(`${path}.license`)) return false
      const head = readFileSync(path, 'utf8').split('\n').slice(0, 5).join('\n')
      return !head.includes('SPDX-License-Identifier')
    })
    expect(unlicensed).toEqual([])
  })

  it('are all referenced by a module or the build', () => {
    const unreferenced = files.filter((path) => {
      const rel = relative(here, path).split('\\').join('/')
      const module = rel.replace(/\.tsx?$/, '')
      const candidates = [
        `'./${rel}'`,
        `'./${module}'`,
        `'@evaka/customizations/${module}'`,
        ...(rel.startsWith('assets/') ? [`/${rel}`] : [])
      ]
      return !candidates.some((candidate) =>
        referencingSources.includes(candidate)
      )
    })
    expect(unreferenced).toEqual([])
  })
})
