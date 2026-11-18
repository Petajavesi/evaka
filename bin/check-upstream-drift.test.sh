#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2026 City of Petäjävesi
#
# SPDX-License-Identifier: LGPL-2.1-or-later

# Itsetesti upstream-drift-tarkistukselle: varmistaa, että tarkistus havaitsee
# Petäjävesi-merkkijonon upstreamin omistamassa tiedostossa, raportoi polun ja rivinumeron,
# päättyy nollasta poikkeavaan paluukoodiin eikä muuta työpuuta. Ajetaan ennen varsinaista
# tarkistusta, jotta rikkinäinen tarkistus ei anna väärää vihreää tulosta.

set -euo pipefail
cd "$(dirname "$0")/.."

probe=service/src/main/kotlin/evaka/core/PetajavesiDriftProbe.kt
if [ -e "$probe" ]; then
    echo "VIRHE: koetiedosto $probe on jo olemassa" >&2
    exit 2
fi
before=$(git status --porcelain)
cleanup() { rm -f "$probe"; }
trap cleanup EXIT

printf '// Petäjäveden koerivi\n' > "$probe"
set +e
output=$(bin/check-upstream-drift.sh 2>&1)
code=$?
set -e
rm -f "$probe"

if [ "$code" -eq 0 ]; then
    echo "VIRHE: tarkistus hyväksyi koetiedoston (paluukoodi 0)" >&2
    echo "$output"
    exit 1
fi
if ! grep -q "$probe:1:" <<<"$output"; then
    echo "VIRHE: tarkistus ei raportoinut polkua ja rivinumeroa '$probe:1:'" >&2
    echo "$output"
    exit 1
fi
after=$(git status --porcelain)
if [ "$before" != "$after" ]; then
    echo "VIRHE: tarkistus muutti työpuuta" >&2
    diff <(echo "$before") <(echo "$after") || true
    exit 1
fi
echo "OK: tarkistus havaitsi koetiedoston (paluukoodi $code), raportoi polun ja rivin eikä muuttanut työpuuta"
