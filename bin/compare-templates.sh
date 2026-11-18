#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2026 City of Petäjävesi
#
# SPDX-License-Identifier: LGPL-2.1-or-later

# Listaa upstreamin Espoon päätöspohjiin (service/src/main/resources/espoo/templates) tulleet
# muutokset edellisen upstream-tagin jälkeen ja kertoo, millä muuttuneista tiedostoista on vastine
# Petäjäveden omissa pohjissa (service/src/main/resources/petajavesi/templates). Petäjäveden pohjat
# eivät seuraa Espoon pohjia automaattisesti: vastineelliset muutokset käydään läpi ja siirretään
# käsin, jos ne koskevat pohjien tietomallia tai rakennetta.
#
# Käyttö upstream-yhdistämisen jälkeen, ENNEN kuin .petajavesi-upstream-tag päivitetään:
#   bin/compare-templates.sh            vertaa tiedoston .petajavesi-upstream-tag tagia HEADiin
#   bin/compare-templates.sh <tagi>     vertaa annettua tagia HEADiin
#   bin/compare-templates.sh <a> <b>    vertaa kahta tagia
# Lisää valitsin -p nähdäksesi vastineellisten tiedostojen diffin. Ei muuta työpuuta; paluukoodi 0.

set -euo pipefail
cd "$(dirname "$0")/.."

ESPOO=service/src/main/resources/espoo/templates
PJV=service/src/main/resources/petajavesi/templates

show_patch=false
if [ "${1:-}" = "-p" ]; then
    show_patch=true
    shift
fi
from=${1:-$(grep -v '^#' .petajavesi-upstream-tag | grep -v '^[[:space:]]*$' | head -1)}
to=${2:-HEAD}

# Espoon tiedoston vastine Petäjäveden puussa: sama polku, kieliriippumaton tekstinippu tai logo.
counterpart() {
    local rel=$1 candidate
    for candidate in "$rel" "${rel/_fi.properties/.properties}" "${rel/espoo-logo/petajavesi-logo}"; do
        if [ -f "$PJV/$candidate" ]; then
            echo "$candidate"
            return
        fi
    done
}

changed=$(git diff --name-only "$from" "$to" -- "$ESPOO")
if [ -z "$changed" ]; then
    echo "Espoon pohjissa ei muutoksia välillä $from..$to."
    exit 0
fi

echo "== Espoon pohjien muutokset välillä $from..$to"
declare -a relevant=()
while IFS= read -r file; do
    rel=${file#"$ESPOO"/}
    target=$(counterpart "$rel")
    if [ -n "$target" ]; then
        echo "   KÄY LÄPI    $rel  ->  petajavesi/templates/$target"
        relevant+=("$file")
    else
        echo "   ei vastinetta  $rel"
    fi
done <<<"$changed"

if $show_patch && [ ${#relevant[@]} -gt 0 ]; then
    git --no-pager diff "$from" "$to" -- "${relevant[@]}"
fi
