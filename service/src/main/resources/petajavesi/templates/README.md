<!--
SPDX-FileCopyrightText: 2026 City of Petäjävesi

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Petäjäveden päätöspohjat

Petäjäveden omat päätös-PDF:ien pohjat. `PetajavesiTemplateProvider` nimeää käytettävät pohjat ja
pohjamoottori lukee ne classpath-prefiksillä `petajavesi/templates/`. Espoon pohjiin ei ole
varapolkua.

| Päätös | Pohja |
| --- | --- |
| Varhaiskasvatus, osa-aikainen varhaiskasvatus ja esiopetukseen liittyvä toiminta | `daycare/decision` |
| Siirtohakemuksen päätös | `daycare/transfer/decision` |
| Esiopetus | `preschool/decision` |
| Maksupäätös | `fee-decision/decision` |

Hakemisto `shared/` sisältää yhteiset osat: sivupohjan, ylätunnisteen ja logon, perustelut,
oikaisuvaatimusohjeet ja hyväksymislomakkeen.

Petäjävedellä ei ole palveluseteleitä, kerhoa eikä valmistavaa opetusta, joten niille ei ole pohjia.
Tällaisen päätöksen muodostus päättyy virheeseen `UnsupportedOperationException`.

Tekstit ovat vain suomeksi tiedostoissa `*.properties`. Ruotsinkielinen päätös muodostetaan samoilla
suomenkielisillä teksteillä.

## Upstream-päivitykset

Pohjat on alun perin johdettu Espoon pohjista (`espoo/templates`), mutta ne eivät seuraa niitä
automaattisesti. Kun upstream muuttaa pohjien tietomallia tai rakennetta, muutos siirretään käsin.
`bin/compare-templates.sh` listaa Espoon pohjiin tulleet muutokset edellisen upstream-tagin jälkeen
ja kertoo, millä niistä on vastine tässä hakemistossa.
