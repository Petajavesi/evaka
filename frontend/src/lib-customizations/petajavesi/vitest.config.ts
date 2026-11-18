// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// Petäjäveden omat Vitest-testit. Erillinen konfiguraatio, jotta upstreamin `frontend/vitest.config.ts`
// pysyy muuttumattomana. Ajo frontend-hakemistosta:
//   EVAKA_CUSTOMIZATIONS=petajavesi yarn test --config src/lib-customizations/petajavesi/vitest.config.ts
// Ilman EVAKA_CUSTOMIZATIONS-muuttujaa customization-alias osoittaa upstreamin tapaan hakemistoon `espoo`.
//
// Vertailuaineiston snapshot-testit (hakemisto baseline/, ei julkisessa repossa) lukevat snapshotit
// hakemistosta $PETAJAVESI_BASELINE_DIR/frontend/__snapshots__ ja ohittavat itsensä ilman muuttujaa.

import { basename, dirname, join } from 'node:path'

import { defineConfig } from 'vitest/config'

const frontendRoot = new URL('../../../', import.meta.url).pathname
const customizations = process.env.EVAKA_CUSTOMIZATIONS || 'espoo'
const baselineDir = process.env.PETAJAVESI_BASELINE_DIR

export default defineConfig({
  root: frontendRoot,
  test: {
    name: 'petajavesi',
    environment: 'jsdom',
    include: ['src/lib-customizations/petajavesi/**/*.spec.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    resolveSnapshotPath: (testPath, snapExtension) =>
      baselineDir
        ? join(
            baselineDir,
            'frontend',
            '__snapshots__',
            basename(testPath) + snapExtension
          )
        : join(
            dirname(testPath),
            '__snapshots__',
            basename(testPath) + snapExtension
          ),
    alias: {
      Icons: `${frontendRoot}src/lib-icons/free-icons`,
      '@evaka/customizations': `${frontendRoot}src/lib-customizations/${customizations}`
    }
  }
})
