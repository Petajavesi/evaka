<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Työvuorosuunnittelu – Design Document

Tämä dokumentti kuvaa [requirements.md](./requirements.md)-vaatimusten teknisen toteutuksen
eVakan Petäjävesi-forkissa. Viittaukset muotoa (Req N.M) osoittavat vaatimuksen hyväksymiskriteeriin.

## 1. Yleiskuva

Lisäosa koostuu neljästä kerroksesta:

1. **Tietokanta**: uusi Flyway-migraatio `V891__shift_planning.sql`, joka lisää `user_role`-enumiin
   arvon `TYOVUOROSUUNNITTELIJA` sekä luo taulut `shift_plan` ja `shift_plan_shift`.
2. **Backend (service)**: uusi paketti `evaka.instance.petajavesi.shiftplanning`, joka sisältää
   REST-controllerin, kyselyt ja henkilöstötarvelaskennan. Ytimen (`evaka.core`) muutokset
   rajataan minimiin: `UserRole`, `Action`, `EmployeeFeatures` ja `SystemController`.
3. **Frontend (employee)**: uusi näkymä `frontend/src/employee-frontend/components/shift-planning/`,
   navigointipainike Headeriin sekä uusi instanssikansio `frontend/src/lib-customizations/petajavesi`.
4. **PDF**: tuloste eVakan olemassa olevalla `PdfGenerator`-palvelulla (Thymeleaf-template).

### 1.1 Keskeinen arkkitehtuurihavainto: Petäjäveden instanssi-wiring

Petäjävesi ajaa eVakan **espoo**-municipality-profiililla: `service/src/main/kotlin/evaka/Main.kt`
ei tunne `petajavesi`-instanssia, vaan Petäjäveden instanssikohtainen koodi
(`evaka.instance.petajavesi.invoice.*`) instantioidaan käsin `EspooConfig`-luokassa
(`service/src/main/kotlin/evaka/instance/espoo/EspooConfig.kt`).

`EspooInstance`-konfiguraatio skannaa vain paketin `evaka.instance.espoo`, joten uusi
`@RestController` paketissa `evaka.instance.petajavesi.shiftplanning` **ei tule automaattisesti
Spring-kontekstiin**. Ratkaisu: laajennetaan `EspooInstance`-luokan `@ComponentScan` ja
`@ConfigurationPropertiesScan` kattamaan myös `evaka.instance.petajavesi` (Req 10.3). Tämä on
pienin muutos, joka pitää kaiken uuden backend-koodin Petäjäveden paketissa.

Frontend valitaan build-aikana ympäristömuuttujalla `EVAKA_CUSTOMIZATIONS`
(`frontend/vite.config.ts`, alias `@evaka/customizations`). Petäjäveden nykyiset ylikirjoitukset
ovat `espoo`-kansiossa (ks. `README-petajavesi.md`); tämän työn yhteydessä luodaan oma
`petajavesi`-kansio (Req 10.2) ja deploy-konfiguraatioon vaihdetaan `EVAKA_CUSTOMIZATIONS=petajavesi`.

## 2. Tietokanta (Req 1, 8, 10.4)

Muutokset jaetaan kahteen migraatioon, koska PostgreSQL ei salli uuden enum-arvon
käyttöä samassa transaktiossa, jossa se lisätään, ja Flyway ajaa jokaisen migraation
omassa transaktiossaan:

- `V891__shift_planning.sql` — enum-arvo ja uudet taulut
- `V892__shift_planning_acl_role.sql` — `daycare_acl`- ja `daycare_acl_schedule`-taulujen
  `chk$valid_role`-tarkistusrajoitteiden päivitys sisältämään `TYOVUOROSUUNNITTELIJA`
  (ilman tätä roolia ei voi tallentaa yksikön ACL:ään; esikuva
  `archive/V259__early_childhood_education_secretary_acl.sql`)

Viimeisin nykyinen migraatio on `V590`, joten `V891` jättää tilaa upstream-numeroinnille.
Migraatioiden jälkeen ajetaan `service/list-migrations.sh`, joka päivittää `migrations.txt`
(lefthook tekee tämän myös pre-commitissa).

```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TYOVUOROSUUNNITTELIJA';

CREATE TABLE shift_plan (
    id uuid PRIMARY KEY DEFAULT ext.uuid_generate_v1mc(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    unit_id uuid NOT NULL REFERENCES daycare (id),
    week_start date NOT NULL,           -- viikon maanantai
    CONSTRAINT uniq$shift_plan$unit_week UNIQUE (unit_id, week_start),
    CONSTRAINT check$week_start_is_monday CHECK (extract(isodow FROM week_start) = 1)
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON shift_plan
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_updated_at();

CREATE TABLE shift_plan_shift (
    id uuid PRIMARY KEY DEFAULT ext.uuid_generate_v1mc(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    plan_id uuid NOT NULL REFERENCES shift_plan (id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employee (id),
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    CONSTRAINT check$shift_times CHECK (end_time > start_time)  -- Req 6.4 tietokantatasolla
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON shift_plan_shift
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_updated_at();

CREATE INDEX idx$shift_plan_shift$plan ON shift_plan_shift (plan_id);
```

Konventiot (uuid-oletus `ext.uuid_generate_v1mc()`, `timestamptz`-aikaleimat,
`trigger_refresh_updated_at`-triggeri) seuraavat tuoreinta esikuvaa
`V588__decision_reasoning.sql` (Req 8.3, 8.4). Roolin lisäyksen esikuva:
`archive/V258__early_childhood_education_secretary_role.sql`.

## 3. Backend

### 3.1 Ytimen muutokset (minimoidut)

| Tiedosto | Muutos |
|---|---|
| `evaka/core/shared/auth/UserRole.kt` | Uusi enum-arvo `TYOVUOROSUUNNITTELIJA`, lisätään `SCOPED_ROLES`-settiin (Req 1.1, 1.2) |
| `evaka/core/shared/security/Action.kt` | Uusi `Action.Global.SHIFT_PLANNING_PAGE` säännöllä `HasUnitRole(TYOVUOROSUUNNITTELIJA).inAnyUnit()` (esikuva `REPORTS_PAGE`) sekä uudet `Action.Unit`-actionit: `READ_SHIFT_PLAN`, `UPDATE_SHIFT_PLAN`, `DOWNLOAD_SHIFT_PLAN_PDF` säännöllä `HasUnitRole(TYOVUOROSUUNNITTELIJA).inUnit()` (Req 2.4, 3.1). Lisäksi `INSERT_ACL_TYOVUOROSUUNNITTELIJA` ja `UPDATE_ACL_TYOVUOROSUUNNITTELIJA` (ADMIN) roolin hallintaan |
| `evaka/core/shared/security/EmployeeFeatures.kt` | Uusi kenttä `shiftPlanning: Boolean` (Req 2.1) |
| `evaka/core/pis/SystemController.kt` | `employeeUser`-vastaukseen `shiftPlanning = permittedGlobalActions.contains(Action.Global.SHIFT_PLANNING_PAGE)` |
| `evaka/core/daycare/controllers/UnitAclController.kt` | Roolin myöntäminen vaatii roolikohtaiset action-mäppäykset (`AclUpdate.roleAddAction`/`updateAclAction`) ja poisto roolikohtaisen DELETE-endpointin — lisätty `TYOVUOROSUUNNITTELIJA`-mäppäykset ja endpoint `DELETE /employee/daycares/{unitId}/tyovuorosuunnittelija/{employeeId}` (Req 1.3, 1.4) |
| `evaka/Main.kt` | `EspooInstance`-skannaukseen `evaka.instance.petajavesi` (ks. 1.1) |
| `evaka/trevaka/security/TrevakaActionRuleMappingTest.kt` + `permissions/tampere-region.csv` | Oikeusdokumentaation golden-CSV sisältää kaikki actionit — uusille actioneille käännökset ja regeneroitu CSV |

Huomio: pelkkä `SCOPED_ROLES`-settiin lisääminen ei riitä roolin hallintaan —
`UnitAclController` vaatii roolikohtaiset actionit ja poistoendpointin (yllä), ja
tietokannan `chk$valid_role`-rajoitteet päivitetään migraatiossa `V892` (luku 2).

**Huomioitavaa**: `UserRole`-enumin laajennus voi rikkoa exhaustiivisia `when`-lausekkeita –
käännös (`./gradlew compileKotlin`) paljastaa nämä ja ne korjataan osana toteutusta.

### 3.2 Uusi paketti `evaka.instance.petajavesi.shiftplanning` (Req 10.3)

```
service/src/main/kotlin/evaka/instance/petajavesi/shiftplanning/
├── ShiftPlanningController.kt   -- REST-rajapinta
├── ShiftPlanQueries.kt          -- shift_plan / shift_plan_shift -kyselyt
├── ShiftPlanningService.kt      -- viikkodatan kokoaminen + henkilöstötarvelaskenta
├── StaffingCalculator.kt        -- puhdas laskentalogiikka (yksikkötestattava)
└── ShiftPlanPdfService.kt       -- PDF-muodostus
```

#### REST-rajapinta

Kaikki endpointit tarkistavat oikeudet `AccessControl`-palvelulla yllä määritellyillä actioneilla.

| Metodi | Polku | Kuvaus |
|---|---|---|
| `GET` | `/employee/shift-planning/units` | Yksiköt, joihin käyttäjällä on `TYOVUOROSUUNNITTELIJA`-rooli (`AccessControl.getAuthorizationFilter` / `filterPermittedObjects` actionilla `Action.Unit.READ_SHIFT_PLAN`) (Req 3.1) |
| `GET` | `/employee/shift-planning/units/{unitId}/weeks/{weekStart}` | Viikkodata: lasten varausajat, läsnäolot, tuen tiedot, henkilöstötarvetaulukko, käyttöaste, yksikön työntekijät ja tallennettu suunnitelma jos on (Req 3.2, 4, 5, 8.2) |
| `PUT` | `/employee/shift-planning/units/{unitId}/weeks/{weekStart}` | Suunnitelman tallennus: luo/päivittää `shift_plan`-rivin ja korvaa työvuorot transaktiossa (Req 6.1–6.3, 8.1) |
| `GET` | `/employee/shift-planning/units/{unitId}/weeks/{weekStart}/pdf` | PDF-tuloste; `404 NotFound` jos suunnitelmaa ei ole tallennettu (Req 9) |

`weekStart` validoidaan maanantaiksi. Työvuoron tallennuksessa validoidaan `end > start`;
rikkomuksesta palautetaan `400 BadRequest` (Req 6.4). Tallennus tapahtuu yhdessä
transaktiossa, joten epäonnistunut tallennus ei jätä osittaista tilaa (Req 8.5).

#### Viikkodatan lähteet (olemassa oleva core-koodi)

- **Varausajat**: taulu `attendance_reservation` (child_id, date, start_time, end_time).
  Yksikköön sijoitetut lapset ja heidän varauksensa haetaan samalla periaatteella kuin
  `AttendanceReservationController.getChildData(unitId, childIds, period)`
  (`evaka/core/reservations/`). Lapset rajataan yksikköön voimassa olevien sijoitusten
  (`placement`/`realized_placement`) kautta.
- **Läsnäolot**: taulu `child_attendance` (Req 3.2).
- **Tuen tiedot**: `assistance_factor` (capacity_factor, valid_during) ja `daycare_assistance`
  (level, valid_during), mallit `evaka/core/assistance/Assistance.kt`. Vain valitulle viikolle
  voimassa olevat rivit (`valid_during && viikko`) (Req 5.3).
- **Käyttöaste**: `evaka/core/occupancy/Occupancy.kt` -laskenta (`calculateDailyUnitOccupancyValues`),
  tyyppi CONFIRMED valitulle viikolle (Req 4.4).

#### Henkilöstötarvelaskenta (`StaffingCalculator`, Req 4, 5)

Puhdas funktio ilman tietokantariippuvuuksia:

1. Päivä jaetaan 30 minuutin kellonaikaväleihin (klo 06:00–18:00 oletusikkuna, laajenee
   varausten mukaan).
2. Kullekin välille lasketaan varausaikojen perusteella paikalla olevat lapset (Req 4.1).
3. Lapsen paino = ikäkerroin × tuen kerroin:
   - alle 3-vuotias: 1.75, muut 1.0 (eVakan occupancy-koodin vakiokertoimet)
   - kerrotaan `assistance_factor.capacity_factor`-arvolla, jos voimassa (Req 5.1)
4. `henkilostotarve = ceil(painotettu_lapsimäärä / mitoituskerroin)`, jossa mitoituskerroin
   on oletuksena **7** (varhaiskasvatuslain mitoitus; sama vakio kuin eVakan
   `occupancyCoefficientSeven`) (Req 4.2).

Vastaus sisältää per päivä ja per aikaväli: lapsimäärä, painotettu lapsimäärä ja
henkilöstötarve; frontend laskee näistä katteen ja erotuksen suunniteltuihin vuoroihin
nähden (Req 6.5).

#### KVTES liite 5 (Req 7)

Keskimääräinen yleistyöaika: **38 h 15 min / viikko** (KVTES liite 5, yleistyöaika).
Vakio määritellään backendin vastauksessa (`weeklyHourLimitMinutes = 2295`), jotta raja
on yhdessä paikassa. Frontend summaa työntekijän viikon vuorot ja näyttää
`suunniteltu / raja` sekä ylityshuomautuksen, kun summa ylittää rajan (Req 7.1–7.3).
Tässä vaiheessa ei toteuteta usean viikon tasoittumisjaksoa; raja tulkitaan viikkokohtaisesti
(dokumentoitu rajaus).

### 3.3 PDF-tuloste (Req 9)

`ShiftPlanPdfService` käyttää `evaka.core.pdfgen.PdfGenerator`-palvelua
(Thymeleaf `Template` + `Context` → `Page` → PDF-tavut), samaan tapaan kuin
`FeeDecisionService`. Template sijoitetaan polkuun
`src/main/resources/espoo/templates/shift-plan/shift-plan.html`, koska Petäjävesi ajaa
espoo-instanssia ja `EspooConfig` konfiguroi template-enginen prefiksillä
`espoo/templates/` (`pdfTemplateEngine("espoo")`).

Tulosteen sisältö per päivä:
- lapset: nimi, tuloaika, lähtöaika (varausajoista) (Req 9.2)
- työvuorot: työntekijän nimi, vuoron alku- ja loppuaika (Req 9.3)

Jos suunnitelmaa ei ole tallennettu, endpoint palauttaa virheen eikä muodosta tulostetta (Req 9.4).

### 3.4 Codegen

Backend-muutosten (`UserRole`, `EmployeeFeatures`, uudet API-tyypit) jälkeen ajetaan
eVakan codegen (`service`-projektin codegen-moduuli), joka päivittää
`frontend/src/lib-common/generated/api-types/*.ts` sekä generoidut API-clientit.

## 4. Frontend

### 4.1 Rooli käyttäjähallinnassa (Req 1.3, 1.4)

- `frontend/src/lib-common/api-types/employee-auth.ts`: `TYOVUOROSUUNNITTELIJA` lisätään
  käsin ylläpidettyyn `scopedRoles`-listaan → rooli tulee valittavaksi olemassa olevaan
  `DaycareRolesModal`-dialogiin (`components/employees/`).
- Roolin suomenkielinen nimi ("Työvuorosuunnittelija") lisätään employee-i18n:n
  roolinimiin (`lib-customizations/defaults/employee/i18n/fi.tsx`).

### 4.2 Navigointi ja reitti (Req 2)

- `components/Header.tsx`: uusi `NavLink`, joka renderöidään kun
  `user.accessibleFeatures.shiftPlanning` on tosi; `to="/shift-planning"`,
  `data-qa="shift-planning-nav"`, sijoitus samaan nav-riviin muiden välilehtien kanssa
  (Req 2.2, 2.3, 2.5).
- `router.tsx`: uusi reitti `/shift-planning` → `ShiftPlanningPage`, kääritty
  `EmployeeRoute`-komponenttiin (`requireAuth`). Sivukomponentti tarkistaa lisäksi
  `accessibleFeatures.shiftPlanning`-lipun ja backend palauttaa 403 ilman oikeutta —
  sisältöä ei näytetä ilman roolia (Req 2.4).

### 4.3 Suunnittelunäkymä `components/shift-planning/` (Req 3–7)

```
shift-planning/
├── ShiftPlanningPage.tsx      -- yksikön ja viikon valinta, sivurunko
├── StaffingNeedTable.tsx      -- kellonaikaväli × päivä -taulukko: tarve, kate, erotus
├── ChildrenTable.tsx          -- lapset, varausajat, tuen tieto -merkinnät
├── ShiftEditor.tsx            -- työvuorojen lisäys/muokkaus/poisto työntekijöittäin
├── WeeklyHoursSummary.tsx     -- KVTES-viikkotuntisumma ja ylityshuomautus
└── queries.ts                 -- react-query -kyselyt ja mutaatiot
```

- Yksikkövalitsin listaa vain endpointin palauttamat luvalliset yksiköt (Req 3.1).
- Viikkovalinta: viikkonavigaatio (edellinen/seuraava + viikkonumero), oletus seuraava viikko.
- Tyhjä viikko → tyhjä näkymä ja ilmoitus "Ei varauksia valitulle viikolle" (Req 3.3).
- Virhetilanteet (Req 3.4, 3.5): react-queryn välimuisti säilyttää edellisen onnistuneen
  vastauksen; jos refetch epäonnistuu mutta dataa on välimuistissa, näytetään data ja
  varoituspalkki "Tiedot voivat olla vanhentuneita". Ilman välimuistidataa näytetään
  virheilmoitus.
- Tallennus (Req 8.5): mutaation epäonnistuessa näytetään virheilmoitus ja näkymä lukitaan
  (muokkaukset estetään) kunnes tallennus onnistuu uudelleenyrityksellä.
- Kaikki UI rakennetaan `lib-components`-komponenteilla ja teemaväreillä (Req 10.1);
  taulukoissa käytetään eVakan `Table`-komponentteja, aikasyötöissä `TimeInput`ia.

### 4.4 Instanssikansio `lib-customizations/petajavesi` (Req 10.2, 10.3)

Luodaan `hameenkyro`-kansion rakennetta noudattaen:

```
petajavesi/
├── assets/ (favicon ym.)
├── PetajavesiLogo.png (+ .license)
├── citizen.tsx, common.tsx, employee.tsx, employeeMobile.tsx
├── enCustomizations.tsx, fiCustomizations.tsx
├── env.ts, featureFlags.tsx, mapConfig.tsx, shared.ts
└── petajavesi-theme.tsx
```

- Nykyiset Petäjävesi-ylikirjoitukset siirretään `espoo`-kansiosta tänne (mm.
  `loginPage.title: 'Petäjäveden kunnan varhaiskasvatus'`).
- Työvuorosuunnittelunäkymän suomenkieliset tekstit sijoitetaan tänne
  (`employee.tsx` → `translations.fi`), jolloin lisäosan tekstit ovat instanssin alla.
- Deploy: frontend-buildiin `EVAKA_CUSTOMIZATIONS=petajavesi`.

## 5. Testidata kehityskäyttöön (Req 11)

eVakan paikallinen kehitysympäristö alustaa datan `DevDataInitializer`-mekanismilla
(`evaka/core/shared/db/DevDataInitializer.kt`), joka ajaa `dev-data/reset-database.sql`- ja
`dev-data/dev-data.sql`-skriptit vain kun dev-profiili (`enable_dev_api`, ks. `Main.kt`) on
käytössä — tuotantoon data ei päädy (Req 11.5). Nykyinen dev-data sisältää yksiköt ja
ryhmät, mutta ei lapsia.

Lisätään uusi skripti `service/src/main/resources/dev-data/shift-planning-test-data.sql`,
joka ajetaan `ensureDevData`-funktiossa (`evaka/core/shared/dev/DataInitializers.kt`)
dev-data.sql:n jälkeen. Skripti luo:

- **30 testilasta**: `person`- ja `child`-rivit deterministisillä UUID:illa (idempotentti
  `ON CONFLICT DO NOTHING` -tyyliin, koska reset ajetaan joka käynnistyksellä).
  Ikäjakauma: 10 alle 3-vuotiasta ja 20 yli 3-vuotiasta — syntymäajat lasketaan
  suhteessa `current_date`-arvoon, jotta jakauma ei vanhene (Req 11.3).
- **Sijoitukset**: voimassa olevat `placement`-rivit dev-datan yksikköön
  ("Päiväkoti ja esikoulu A") ja `daycare_group_placement`-rivit sen ryhmiin (Req 11.1).
- **Varausajat**: `attendance_reservation`-rivit kuluvalle ja seuraavalle viikolle;
  päivämäärät lasketaan `date_trunc('week', current_date)`-pohjaisesti, joten data on
  aina ajantasaista (Req 11.2). Kellonajat vaihtelevat (esim. 7:00–15:00, 8:00–16:00,
  9:00–17:00), jotta henkilöstötarvetaulukkoon syntyy vaihtelua aikaväleittäin.
- **Tuen tiedot**: `assistance_factor`-rivit (esim. capacity_factor 2.0) kahdelle lapselle
  voimassaololla joka kattaa kuluvan ja seuraavan viikon (Req 11.4).

Skripti on core-puolen dev-datan jatke (ei Petäjävesi-pakettia), koska
`DevDataInitializer` on core-mekanismi ja data hyödyttää paikallista kehitystä yleisesti.

## 6. Testaus

- **Yksikkötestit (Kotlin)**: `StaffingCalculator` — lapsimäärän laskenta aikaväleittäin,
  ikä- ja tuen kertoimet, pyöristys ylöspäin, tyhjä viikko.
- **Integraatiotestit (Kotlin)**: controller-testit eVakan integraatiotestirunkoa käyttäen —
  pääsynvalvonta (403 ilman roolia, Req 2.4), suunnitelman tallennus/lataus (Req 8),
  validointivirhe `end <= start` (Req 6.4), PDF 404 ilman suunnitelmaa (Req 9.4).
- **Frontend-yksikkötestit (vitest)**: viikkotuntisumma ja KVTES-ylitysmerkintä (Req 7),
  kate/erotus-laskenta (Req 6.5).
- E2E-testit (Playwright) rajataan tämän vaiheen ulkopuolelle; `data-qa`-attribuutit
  lisätään kuitenkin valmiiksi keskeisiin elementteihin.

## 7. Rajaukset ja avoimet päätökset

- KVTES liite 5 tulkitaan viikkokohtaisena rajana (38 h 15 min); usean viikon
  tasoittumisjakso ei kuulu tähän vaiheeseen.
- Mitoituskerroin on vakio 7 (ei ryhmäkohtaista tai ikäryhmäkohtaista konfiguraatiota
  tässä vaiheessa); ikäpaino 1.75 alle 3-vuotiaille seuraa eVakan occupancy-laskentaa.
- `ADMIN`-roolille ei anneta pääsyä suunnittelunäkymään, koska vaatimus rajaa pääsyn
  suunnitteluoikeuden antaviin rooleihin (Req 2.1, 2.3). Kehityskäytössä admin voi
  myöntää roolin itselleen käyttäjähallinnasta.
- Päivitys 2026-07-31: yksikön johtaja (`UNIT_SUPERVISOR`) saa suunnitteluoikeudet
  automaattisesti omissa yksiköissään — `UNIT_SUPERVISOR` lisätty Action-sääntöihin
  SHIFT_PLANNING_PAGE, READ_SHIFT_PLAN, UPDATE_SHIFT_PLAN ja
  DOWNLOAD_SHIFT_PLAN_PDF. Ei tietokantamuutoksia: oikeus tulee action-säännöistä,
  ei ACL-riveistä, joten erillistä roolin lisäystä ei tarvita.
- Ryhmätason (daycare_group) suunnittelu ei kuulu tähän vaiheeseen; suunnittelu tehdään
  yksikkötasolla.

## Työvuorotoiveet (Req 13, lisätty 2026-08-01)

- **Kanta (V894):** `shift_wish` (employee_id, unit_id, date, start_time, end_time,
  status `shift_wish_status`: PENDING/APPROVED/REJECTED, resolved_by, resolved_at,
  resolved_start_time/resolved_end_time = hyväksytyt ajat jos muutettu).
  Uniikki (employee_id, unit_id, date, start_time, end_time).
- **Backend:** `ShiftWishController` (`/employee/shift-wishes`): GET /units
  (yksiköt joissa CREATE_SHIFT_WISH), GET / (omat toiveet ikkunassa),
  POST / (luonti, ikkunavalidointi), DELETE /{id} (oma PENDING).
  Suunnittelijan käsittely: `ShiftPlanningController` PUT
  /units/{unitId}/wishes/{wishId} (APPROVED lisää vuoron suunnitelmaan
  INSERT-semantiikalla + upsert shift_plan). getWeek-vastaukseen `wishes`.
- **Actionit:** Global.SHIFT_WISH_PAGE (STAFF inAnyUnit → EmployeeFeatures.shiftWishes),
  Unit.CREATE_SHIFT_WISH (STAFF), Unit.UPDATE_SHIFT_WISH
  (TYOVUOROSUUNNITTELIJA, UNIT_SUPERVISOR). Toiveet palautuvat getWeekissä
  READ_SHIFT_PLAN-oikeudella.
- **Frontend:** työntekijän sivu `components/shift-wishes/ShiftWishPage.tsx`
  (route /shift-wishes, header-tab "Työvuorot"); suunnittelijan toivepaneeli
  ShiftEditorissa: rivit ryhmitellään (date,start,end)-avaimella ja
  päällekkäiset toiveet korostetaan slotti-kohtaisilla väreillä + "N toivojaa"
  -merkinnällä. Hyväksyntä kutsuu resolve-endpointtia ja lisää vuoron myös
  editorin lokaaliin tilaan, jotta myöhempi koko viikon tallennus
  (replace-semantiikka) ei pyyhi sitä.

## Hyväksyttyjen toiveiden ensisijaisuus ehdotuksessa (Req 14, lisätty 2026-08-01)

- calc.ts: `approvedWishShifts(wishes)` poimii viikon hyväksytyt toiveet vuoroiksi
  (resolved-ajat voittavat alkuperäiset) ja `subtractShiftsFromNeed(staffingNeed,
  shifts)` vähentää tarpeesta aikaväleittäin välin kokonaan kattavat vuorot.
- ShiftEditor: "Luo ehdotus varauksista" rakentaa rivit järjestyksessä
  1) hyväksytyt toivevuorot (groupsFromPlan-ryhmittelyllä),
  2) suggestShiftGroups jäljelle jäävälle tarpeelle,
  3) suggestEmployeeAssignments tyhjiin riveihin — olemassa oleva
  hyväksyntäkierto (pendingAssignments) estää tallennuksen kunnes suunnittelija
  hyväksyy/hylkää; kohdennus ei ehdota työntekijää päällekkäin hänen
  hyväksytyn toivevuoronsa kanssa (varatut välit + jaksokertymä).
  Sama yhdistelmälogiikka esitäyttää rivit, kun tallennettua suunnitelmaa ei ole.
- Kaaviot/taulukko eivät vaatineet muutoksia: ne laskevat suunnitellun katteen
  editorin riveistä, joihin hyväksytyt toivevuorot nyt aina sisältyvät.

## Työntekijäkohtaiset PDF-tulosteet (Req 9.5-9.7, lisätty 2026-08-01)

- `ShiftPlanPdfService.renderEmployeeShiftPlanPdf(tx, unitId, weekStart, employeeId?)`:
  employeeId annettuna yhden työntekijän tuloste, muuten kaikki suunnitelmassa
  vuoroja saaneet aakkosjärjestyksessä. Template
  `shift-plan/shift-plan-employee.html` (A4 pysty): sivu per työntekijä
  (page-break-after), päivärivit ma-su, viikon yhteistunnit.
- Endpointit (DOWNLOAD_SHIFT_PLAN_PDF): GET
  /units/{unitId}/weeks/{weekStart}/pdf/employees ja .../pdf/employees/{employeeId}.
- UI: ShiftEditorin "Työntekijöille jaettavat listat" -osio (näkyy kun
  suunnitelma on tallennettu): "Lataa kaikkien listat" -linkki sekä
  työntekijävalinta + "Lataa työntekijän lista". Valittavana vain
  suunnitelmassa vuoroja saaneet työntekijät.

## Työntekijän omat vahvistetut vuorot (Req 13.8, lisätty 2026-08-01)

- `getOwnPlannedShifts(employeeId, range)` (ShiftWishQueries): omat rivit
  shift_plan_shift-taulusta yksikön nimellä. `ShiftWishesResponse` laajennettu
  kentillä `shiftsRange` (kuluvan viikon maanantai → toiveikkunan loppu, 4 viikkoa)
  ja `shifts`. Sama SHIFT_WISH_PAGE-oikeus — vain omat vuorot palautetaan.
- UI: ShiftWishPagen "Omat työvuorot" -osio yksikkövalinnasta riippumatta,
  viikoittain ryhmiteltynä, kuluva viikko merkitty; yksikkösarake näytetään
  vain jos vuoroja on useammasta yksiköstä.

## Tärkeät toiveet (Req 13.9-13.10, lisätty 2026-08-01)

- V895: shift_wish.important boolean. Raja (max 2 tärkeää / työntekijä /
  toiveikkuna, hylätyt eivät kuluta kiintiötä) valvotaan createWishissä
  (countImportantWishes, errorCode WISH_IMPORTANT_LIMIT) ja UI:ssa
  (checkbox disabloituu, käytetty-laskuri).
- UI: työntekijän lomakkeessa "★ Tärkeä toive" -checkbox + kiintiöinfo;
  tähti toiverivien päiväsarakkeessa. Suunnittelijan WishPanelissa tähti +
  oranssi "★ Tärkeä" -chip käsittelemättömillä tärkeillä toiveilla ja
  selite-infoboksi.
