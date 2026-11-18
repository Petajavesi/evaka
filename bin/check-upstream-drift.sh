#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2026 City of Petäjävesi
#
# SPDX-License-Identifier: LGPL-2.1-or-later

# Upstream-drift-tarkistus (Petajavesi/evaka-fork). Varmistaa, että Petäjäveden muutokset pysyvät
# omissa poluissaan eivätkä upstreamin (espoon-voltti/evaka) omistamat tiedostot eroa tagista
# .petajavesi-upstream-tag muuten kuin .petajavesi-exceptions-listan sallimissa tiedostoissa.
#
# Tarkistukset:
#   1. Petäjävesi-merkkijonot (etäjäve, etajave, petajavesi.fi, Pet.j.ve) hakemistoissa service,
#      frontend ja apigw vain sallituissa Petäjävesi-poluissa tai poikkeuslistan tiedostoissa.
#   2. Ero upstream-tagiin samoissa hakemistoissa vain sallituissa poluissa tai poikkeuslistalla,
#      ja jokainen poikkeuslistan tiedosto eroaa oikeasti (kaksisuuntainen).
#   3. Versionhallinnassa ei ole build/-hakemistoja.
# Skripti on vain lukeva. Paluukoodi on nollasta poikkeava, jos yksikin tarkistus epäonnistuu.
# Ajetaan repojuuresta: bin/check-upstream-drift.sh

set -euo pipefail
cd "$(dirname "$0")/.."

UPSTREAM_TAG=$(grep -v '^#' .petajavesi-upstream-tag | grep -v '^[[:space:]]*$' | head -1)
EXCEPTIONS_FILE=.petajavesi-exceptions
PATTERNS='etäjäve|etajave|petajavesi\.fi|Pet.j.ve'
# Petäjäveden omat polut.
ALLOWED='^(service/src/main/kotlin/evaka/instance/petajavesi/|service/src/main/resources/petajavesi/|service/src/main/resources/application-petajavesi_evaka\.yaml|service/src/test/kotlin/evaka/instance/petajavesi/|service/src/test/resources/petajavesi/|service/src/integrationTest/kotlin/evaka/instance/petajavesi/|frontend/src/lib-customizations/petajavesi/)'

if ! git rev-parse --verify --quiet "$UPSTREAM_TAG^{commit}" >/dev/null; then
    echo "VIRHE: upstream-tagia '$UPSTREAM_TAG' ei löydy. Aja: git fetch --tags upstream (CI: actions/checkout fetch-depth: 0)" >&2
    exit 2
fi

exceptions=$(grep -v '^#' "$EXCEPTIONS_FILE" | grep -v '^[[:space:]]*$' | cut -f1 | sort -u)
is_exception() { grep -qxF "$1" <<<"$exceptions"; }
is_allowed() { [[ "$1" =~ $ALLOWED ]]; }

status=0

echo "== 1/3 Petäjävesi-merkkijonot upstreamin omistamissa tiedostoissa (tagi $UPSTREAM_TAG)"
hits=0
while IFS= read -r line; do
    file=${line%%:*}
    if is_allowed "$file" || is_exception "$file"; then continue; fi
    echo "   $line"
    hits=$((hits + 1))
done < <(git grep -I -n -i -E --untracked "$PATTERNS" -- service frontend apigw || true)
if [ "$hits" -gt 0 ]; then
    echo "VIRHE: $hits Petäjävesi-osumaa sallittujen polkujen ja poikkeuslistan ulkopuolella" >&2
    status=1
else
    echo "   OK: 0 osumaa"
fi

echo "== 2/3 Ero upstream-tagiin"
changed=$( (git diff --name-only "$UPSTREAM_TAG" -- service frontend apigw; git ls-files --others --exclude-standard -- service frontend apigw) | sort -u)
unexpected=0
while IFS= read -r file; do
    [ -z "$file" ] && continue
    if is_allowed "$file" || is_exception "$file"; then continue; fi
    echo "   eroaa, ei listalla: $file"
    unexpected=$((unexpected + 1))
done <<<"$changed"
stale=0
while IFS= read -r file; do
    [ -z "$file" ] && continue
    if ! grep -qxF "$file" <<<"$changed"; then
        echo "   poikkeuslistalla, mutta ei eroa tagista: $file"
        stale=$((stale + 1))
    fi
done <<<"$exceptions"
if [ "$unexpected" -gt 0 ] || [ "$stale" -gt 0 ]; then
    echo "VIRHE: $unexpected odottamatonta eroa, $stale vanhentunutta poikkeusta" >&2
    status=1
else
    echo "   OK: erot vain sallituissa poluissa ja poikkeuslistalla ($(grep -c . <<<"$exceptions") poikkeusta)"
fi

echo "== 3/3 Käännösartefaktit versionhallinnassa"
artifacts=$(git ls-files | grep -E '(^|/)build/' || true)
if [ -n "$artifacts" ]; then
    echo "$artifacts" | sed 's/^/   /'
    echo "VIRHE: build/-hakemistoja versionhallinnassa" >&2
    status=1
else
    echo "   OK: ei yhtään"
fi

exit $status
