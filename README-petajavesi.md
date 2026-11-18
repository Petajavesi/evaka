<!--
SPDX-FileCopyrightText: 2026 City of Petäjävesi

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# eVaka Petäjävesi

Tämä repo on Petäjäveden kunnan fork upstreamista [espoon-voltti/evaka](https://github.com/espoon-voltti/evaka).
Petäjäveden omat muutokset on eristetty omiin polkuihinsa, ja upstreamin omistamia tiedostoja muutetaan vain
poikkeuslistan `.petajavesi-exceptions` mukaisesti. Näin upstreamin tagien yhdistäminen aiheuttaa mahdollisimman
vähän konflikteja. Nykyinen upstream-taso on tiedostossa `.petajavesi-upstream-tag`.

## Rakenne

| Polku | Sisältö |
| --- | --- |
| `service/src/main/kotlin/evaka/Main.kt` | Instanssin valinta ympäristömuuttujalla `EVAKA_MUNICIPALITY`; oletus `petajavesi` (poikkeuslistalla) |
| `service/src/main/kotlin/evaka/instance/petajavesi/` | Spring-konfiguraatio (`PetajavesiConfig`, `PetajavesiProperties`), laskutus (`invoice/`), sähköpostit, viestit, PDF-pohjien konfiguraatio, oikeussäännöt, salasanavaatimukset |
| `service/src/main/resources/application-petajavesi_evaka.yaml` | Profiili `petajavesi_evaka`: sähköposti, OPH-tunnisteet, Suomi.fi-yhteystiedot ja Flyway-sijainnit `db/migration` + `petajavesi/db/migration` |
| `service/src/main/resources/petajavesi/templates/` | Petäjäveden omat päätös-PDF:ien pohjat: varhaiskasvatus, siirto, esiopetus ja maksupäätös. Tekstit vain suomeksi. Ks. hakemiston `README.md` |
| `service/src/main/resources/petajavesi/db/migration/` | Vain `afterMigrate`-callback (autovacuum-asetukset). Ei versioituja migraatioita |
| `service/src/test/kotlin/evaka/instance/petajavesi/` | Yksikkö- ja ominaisuustestit sekä laskutiedoston synteettinen golden-testi (odotus `service/src/test/resources/petajavesi/invoice-client/CorrectPetajavesiInvoice.txt`, keksitty aineisto `PetajavesiInvoiceFixtures`) |
| `service/src/integrationTest/kotlin/evaka/instance/petajavesi/` | Integraatiotestit Petäjäveden instanssilla ja profiililla |
| `frontend/src/lib-customizations/petajavesi/` | Käyttöliittymän customization: ympäristön päättely (`env.ts`), liput, käännökset, logo, teema, karttarajaus, Vitest-konfiguraatio ja testit |
| `bin/check-upstream-drift.sh` | Tarkistaa, että Petäjävesi-viittauksia ja eroja upstream-tagiin on vain sallituissa poluissa tai poikkeuslistalla |
| `bin/check-upstream-drift.test.sh` | Edellisen itsetesti |
| `bin/compare-templates.sh` | Listaa upstreamin Espoon pohjiin tulleet muutokset edellisen upstream-tagin jälkeen ja niiden vastineet Petäjäveden pohjissa |
| `.github/workflows/pet-build_and_deploy.yml` | CI: `upstream-drift`-työ, imagejen rakennus ja käyttöönotto pushista haaroihin |

Ympäristökohtainen konfiguraatio (ympäristömuuttujat, salaisuudet, Terragrunt) on erillisessä yksityisessä
infrarepossa.

## Paikallinen kehitys

Edellytykset: Docker Desktop, Node.js (Yarn corepackin kautta), JDK, sekä upstreamin ohjeet `README.md`,
`frontend/README.md` ja `frontend/src/lib-customizations/README.md`.

1. `cd compose && docker compose up --detach` käynnistää kannan, s3-mockin, valkeyn, sftp:n ja dummy-idp:n.
2. `pm2 start` käynnistää frontendin, apigw:n ja evaka-servicen; `pm2 logs` näyttää lokit.
3. Avaa <http://localhost:9099/login>.
4. Lopetus: `pm2 stop all && docker compose down`.

Backend käynnistyy Petäjäveden instanssina ilman lisäasetuksia (`EVAKA_MUNICIPALITY` oletus `petajavesi`).
Profiili `local` käyttää maksuintegraatiossa mock-asiakasta ja lataa kehitysdatan. Käynnistyslokissa näkyy rivi
`Active eVaka instance: petajavesi, Flyway locations: [db/migration, petajavesi/db/migration]`.

Frontend valitsee customizationin muuttujalla `EVAKA_CUSTOMIZATIONS`. Aseta se arvoon `petajavesi` sekä
kehityspalvelimelle että buildille; ilman muuttujaa käytetään upstreamin tapaan hakemistoa `espoo`.

Käännösten muokkaus: kuntalaisen suomenkieliset tekstit ovat tiedostossa
`frontend/src/lib-customizations/petajavesi/fiCustomizations.tsx`, englanninkieliset tiedostossa
`enCustomizations.tsx` ja työntekijän tekstit tiedostossa `employee.tsx`. Upstreamin oletustekstit ovat hakemistossa
`frontend/src/lib-customizations/defaults/`, ja Petäjäveden tiedostot ylikirjoittavat vain nimetyt avaimet.

Laskutuksen asetukset luetaan `PetajavesiProperties`-luokkaan (`petajavesi.invoice.sftp.*`):

| Ympäristömuuttuja | Merkitys |
| --- | --- |
| `PETAJAVESI_INVOICE_SFTP_HOST`, `_PORT`, `_USERNAME` | SFTP-palvelin |
| `PETAJAVESI_INVOICE_SFTP_PASSWORD` tai `_PRIVATE_KEY` | Täsmälleen toinen |
| `PETAJAVESI_INVOICE_SFTP_HOST_KEYS` | Palvelimen isäntäavaimet, pakollinen; isäntäavaimen tarkistusta ei ohiteta |
| `PETAJAVESI_INVOICE_SFTP_PREFIX` | Kohdehakemisto palvelimella |
| `EVAKA_BUCKET_INVOICES` | Valinnainen S3-ämpärin ylikirjoitus; oletus on `evaka.bucket.data` |

Ilman SFTP-asetuksia laskuaineisto tallennetaan vain S3:een ja SFTP-lähetys ohitetaan lokimerkinnällä.
Hetuttomien laskujen erillistä tiedostoa ei tehdä; ne palautetaan käsin lähetettävinä.

## Todennuslista ennen pushia

Jokaisen komennon paluukoodin on oltava 0.

```bash
bin/check-upstream-drift.test.sh && bin/check-upstream-drift.sh
(cd service && ./gradlew build -x integrationTest)
(cd service && ./gradlew integrationTest --tests 'evaka.instance.petajavesi.*')   # vaatii compose-kannan
(cd frontend && yarn install --immutable && yarn type-check && yarn lint)
(cd frontend && EVAKA_CUSTOMIZATIONS=petajavesi yarn test --config src/lib-customizations/petajavesi/vitest.config.ts)
(cd frontend && EVAKA_CUSTOMIZATIONS=petajavesi yarn build)
reuse lint   # jos työkalu on asennettu
```

Vertailuaineisto (golden-testit) ei ole tässä repossa. Kun se on saatavilla, aja lisäksi
`PETAJAVESI_BASELINE_DIR=<polku> ./gradlew test --tests 'evaka.instance.petajavesi.baseline.*' --rerun`
ja frontendin testit samalla muuttujalla. Ilman muuttujaa nämä testit ohittavat itsensä.
`PETAJAVESI_BASELINE_UPDATE=true` kirjoittaa aineiston uudelleen; käytä vain tietoisesti.

## Käyttöönotto

Sama menettely test- ja prod-ympäristöissä; prod vasta kun test on ollut vakaa. CI rakentaa imaget ja ottaa ne
käyttöön pushista, ja ympäristömuuttujat tulevat yksityisen infrarepon `env.hcl`-tiedostosta.

1. Ota talteen nykyiset image-viittaukset SSM-parametreista `evaka_service_image`, `evaka_frontend_image` ja
   `evaka_apigw_image` sekä kannan tilannevedokset (`service_need_option`, `flyway_schema_history`, autovacuum-asetukset).
   ECR säilyttää vain viisi tagattua imagea repositoriota kohti.
2. Push haaraan. CI ajaa `upstream-drift`-työn, rakentaa imaget ja ottaa ne käyttöön. Uusi image käynnistää
   Petäjäveden instanssin oletuksena, vaikka `EVAKA_MUNICIPALITY`-muuttujaa ei vielä ole; vanha
   `EVAKA_DATABASE_FLYWAY_LOCATIONS`-kiertotie on vielä voimassa. Lokissa:
   `Active eVaka instance: petajavesi, Flyway locations: [db/migration]`.
3. `terragrunt apply` infrarepossa: `EVAKA_MUNICIPALITY: "petajavesi"` lisätään ja Flyway-kiertotie
   poistetaan samassa muutoksessa. Lokissa: `Flyway locations: [db/migration, petajavesi/db/migration]`.
4. Tarkista: terveystarkistus läpi eikä uudelleenkäynnistyksiä, autovacuum-asetukset `pg_class.reloptions`-kyselyllä,
   `service_need_option` muuttumaton, sekä käsin: varhaiskasvatuspäätös-PDF, maksupäätös-PDF, laskuaineisto S3:ssa,
   sähköposti, työntekijän alatunniste ja kirjautumissivu.
5. Tuotannon ensimmäinen laskuajo verrataan käsin edellisen kuukauden tiedostoon ennen lähetystä.

Huomioita ECS-asetuksista: palvelut ajavat yhtä tehtävää, `deployment_minimum_healthy_percent` on 0 ja circuit
breaker ei palauta automaattisesti. Jokainen käyttöönotto katkaisee palvelun hetkeksi, ja epäonnistunut
käyttöönotto jättää palvelun alas kunnes rollback tehdään käsin.

### Rollback

Ainoa täysi rollback on edellinen image kaikille kolmelle komponentille ja edelliset ympäristömuuttujat yhdellä
applylla:

1. Palauta `env.hcl`: `EVAKA_MUNICIPALITY` pois ja `EVAKA_DATABASE_FLYWAY_LOCATIONS: "db/migration"` takaisin.
2. Aseta kolme SSM-parametria vanhoihin image-viittauksiin (`aws ssm put-parameter --overwrite`).
3. `terragrunt apply`.
4. Vasta sen jälkeen `git revert` ja push, jolloin CI rakentaa vanhan koodin uudella tagilla.

Vanhaa imagea ei saa käynnistää arvolla `EVAKA_MUNICIPALITY=petajavesi`, koska se ei tunne kuntaa.

## Upstream-päivityksen tarkistuslista

1. `git merge <tag>`. Upstreamin tiedostoissa pidetään upstreamin versio; vain poikkeuslistan tiedostot
   (`Main.kt`, `AsyncJobConfig.kt`, `CityLogo.tsx`, `Header.tsx`, `Footer.tsx`, `Invoices.tsx`) sovitetaan käsin.
2. Aja `bin/compare-templates.sh -p` ennen tagitiedoston päivitystä. Skripti näyttää Espoon pohjiin tulleet
   muutokset ja merkitsee ne, joilla on vastine Petäjäveden pohjissa. Siirrä käsin ne muutokset, jotka koskevat
   pohjien tietomallia tai rakennetta. Espoon omia tekstimuutoksia ei siirretä.
3. Päivitä `.petajavesi-upstream-tag` ja aja `bin/check-upstream-drift.sh`. Uusi eroava upstream-tiedosto joko
   palautetaan tai lisätään perusteltuna poikkeuslistalle.
4. Jos laskutiedoston golden-testi epäonnistuu, upstream on muuttanut laskun tietomallia tai generaattorin
   syötettä. Katselmoi ero (testi nimeää tavun ja rivin) ja päivitä odotustiedosto vain tietoisesti.
5. Vertaa upstreamin muutokset kopioituihin luokkiin: `EvakaEmailMessageProvider` →
   `PetajavesiEmailMessageProvider` (lähdetagi otsikossa), `EspooConfig` → `PetajavesiConfig` (uudet pakolliset
   beanit), `EspooActionRuleMapping`, `EspooPasswordSpecification`, `EspooIncomeCoefficientMultiplierProvider`,
   `InvoiceController.createDraftInvoices` → `PetajavesiInvoiceController`.
6. Vertaa `frontend/src/lib-customizations/espoo/` ja `defaults/` muutokset Petäjäveden customizationiin
   (liput, käännösavaimet, `CitizenCustomizations`- ja `EmployeeCustomizations`-tyypit).
7. Aja todennuslista.

## Tiedossa olevat Espoo-jäänteet

- Backend: tulolajit (`EspooIncomeTypesProvider`) ja laskun tuotteet (`EspooInvoiceProducts`, `PetajavesiInvoiceProducts`)
  ovat Espoon mukaiset; `PetajavesiActionRuleMapping` ja
  `PetajavesiIncomeCoefficientMultiplierProvider` ovat Espoon luokkien kopioita.
- Päätöspohjat: palveluseteleille, kerholle ja valmistavalle opetukselle ei ole pohjia, ja ruotsinkielinen päätös
  muodostetaan suomenkielisillä teksteillä.
- Frontend: ruotsinkieliset tekstit ovat Espoon, englanninkieliset osin Espoon, reittiopaslinkki osoittaa HSL:n
  palveluun, karttarajaus (`mapConfig`) on Espoon alue ja teema on kopio Espoon teemasta.
- Arkistointi- ja maksuintegraatio eivät ole käytössä (`FailingClient`).
