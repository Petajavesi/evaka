<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Työvuorosuunnittelu – Tehtävälista

Toteutusjärjestyksessä. Viittaukset: (Req N) = [requirements.md](./requirements.md),
tarkemmat perustelut [design.md](./design.md).

## Vaihe 1: Tietokanta ja rooli

- [x] 1.1 Luo migraatio `service/src/main/resources/db/migration/V891__shift_planning.sql`:
      `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TYOVUOROSUUNNITTELIJA'` sekä taulut
      `shift_plan` ja `shift_plan_shift` design-dokumentin skeeman mukaisesti
      (Req 1.1, 8.1, 8.3, 10.4)
- [x] 1.1b Luo migraatio `V892__shift_planning_acl_role.sql`: `daycare_acl`- ja
      `daycare_acl_schedule`-taulujen `chk$valid_role`-rajoitteet kattamaan uusi rooli
      (erillinen migraatio, koska uutta enum-arvoa ei voi käyttää samassa transaktiossa)
      (Req 1.3)
- [x] 1.2 Aja `service/list-migrations.sh` → `migrations.txt` päivittyy
- [x] 1.3 Lisää `TYOVUOROSUUNNITTELIJA` enumiin `evaka/core/shared/auth/UserRole.kt` ja
      `SCOPED_ROLES`-settiin (Req 1.1, 1.2)
- [x] 1.4 Käännä service (`./gradlew compileKotlin compileTestKotlin
      compileIntegrationTestKotlin`) — kääntyi puhtaasti, ei rikkoutuneita
      `when`-lausekkeita
- [x] 1.5 Varmista migraation ajo paikallisesti — ajettu `./gradlew flywayMigrate`,
      rajoitteet savutestattu (maanantai-check, aikajärjestys-check, ACL-rajoite)

## Vaihe 1b: Testidata kehityskäyttöön

- [x] 1b.1 Luo `service/src/main/resources/dev-data/shift-planning-test-data.sql`:
      30 testilasta (10 alle 3 v → Ryhmä 1, 20 yli 3 v → Ryhmä 2; syntymäajat suhteessa
      `current_date`), sijoitukset yksikköön "Päiväkoti ja esikoulu A" (Req 11.1, 11.3)
- [x] 1b.2 Varausajat kuluvalle ja seuraavalle viikolle (ma–pe)
      `date_trunc('week', current_date)` -pohjaisesti; 4 vaihtelevaa kellonaikaprofiilia,
      joka viides lapsi poissa perjantaisin (Req 11.2)
- [x] 1b.3 `assistance_factor` (kerroin 2.00) lapsille 5 ja 15 — yksi kummastakin
      ikäryhmästä (Req 11.4)
- [x] 1b.4 Kytketty `ensureDevData`-listan viimeiseksi
      (`evaka/core/shared/dev/DataInitializers.kt`) — ajetaan vain dev-profiililla
      tyhjään kantaan (Req 11.5)
- [x] 1b.5 Skripti ajettu ja varmistettu paikallista kantaa vasten: 30 lasta oikeissa
      ryhmissä, 288 varausta kahdelle viikolle, 2 tuen kerrointa. UI-tason tarkistus
      (yksikön viikkokalenteri) tehdään savutestissä 8.3

## Vaihe 2: Pääsynvalvonta ja feature-lippu

- [x] 2.1 Lisää `Action.Global.SHIFT_PLANNING_PAGE` sääntönä
      `HasUnitRole(TYOVUOROSUUNNITTELIJA).inAnyUnit()` (`evaka/core/shared/security/Action.kt`) (Req 2.1)
- [x] 2.2 Lisää `Action.Unit.READ_SHIFT_PLAN`, `UPDATE_SHIFT_PLAN`, `DOWNLOAD_SHIFT_PLAN_PDF`
      sääntönä `HasUnitRole(TYOVUOROSUUNNITTELIJA).inUnit()` (Req 2.4, 3.1)
- [x] 2.2b Roolin hallinta ACL:ssä (toteutuksessa havaittu lisätarve): uudet actionit
      `Action.Unit.INSERT_ACL_TYOVUOROSUUNNITTELIJA` ja `UPDATE_ACL_TYOVUOROSUUNNITTELIJA`
      (ADMIN), mäppäykset `UnitAclController.AclUpdate`-luokkaan sekä uusi
      DELETE-endpoint `/employee/daycares/{unitId}/tyovuorosuunnittelija/{employeeId}`
      — ilman näitä roolin myöntäminen/poisto heittäisi BadRequest (Req 1.3, 1.4)
- [x] 2.2c Päivitetty Tampere-region oikeusdokumentaation golden-CSV
      (`TrevakaActionRuleMappingTest` + `permissions/tampere-region.csv`): 6 uutta
      action-riviä ja suomenkieliset käännökset
- [x] 2.3 Lisää `shiftPlanning: Boolean` luokkaan `EmployeeFeatures` ja täytä se
      `SystemController.employeeUser`-metodissa `SHIFT_PLANNING_PAGE`-actionista (Req 2.1)
- [x] 2.4 Laajenna `EspooInstance`-konfiguraation component scan kattamaan
      `evaka.instance.petajavesi` (`evaka/Main.kt`) (Req 10.3)
- [x] 2.5 Varmistus: koko yksikkötestisarja vihreä; `UnitAclControllerIntegrationTest`
      ja `AclIntegrationTest` vihreät (evaka_it-kannasta siivottu samat aiemman
      kokeilun jäänteet kuin evaka_localista)

## Vaihe 3: Backend-toiminnallisuus (paketti `evaka.instance.petajavesi.shiftplanning`)

- [x] 3.0 Perustyypit (toteutuksessa havaittu lisätarve): typed id:t `ShiftPlanId` ja
      `ShiftPlanShiftId` (`evaka/core/shared/Id.kt`) sekä Audit-eventit `ShiftPlanRead`,
      `ShiftPlanUnitsRead`, `ShiftPlanUpdate` (`evaka/core/Audit.kt`)
- [x] 3.1 `StaffingCalculator.kt`: puhdas henkilöstötarvelaskenta — 30 min aikavälit
      (oletusikkuna 06–18, laajenee varausten mukaan), ikäpaino (alle 3 v = 1.75), tuen
      kerroin, `ceil(painotettu / 7)`; vakiot `WEEKLY_HOUR_LIMIT_MINUTES = 2295` ja
      `STAFFING_DIVISOR = 7` (Req 4.1, 4.2, 5.1)
- [x] 3.2 Yksikkötestit `StaffingCalculator`ille: 8 testiä (tyhjä viikko, välikohtainen
      läsnäolo, pyöristys 7/8 lasta, ikäpaino, tuen kerroin, ikkunan laajeneminen,
      päiväkohtaisuus, `childWeight`-rajatapaukset) — vihreät
- [x] 3.3 `ShiftPlanQueries.kt`: yksikkölistaus AccessControlFilter-predikaatilla,
      viikkodatan haut (lapset sijoituksista, varaukset, läsnäolot, tuen tiedot,
      työntekijät ACL:stä) sekä `upsertShiftPlan` (ON CONFLICT) + `replaceShiftPlanShifts`
      (Req 3.2, 5.3, 8.1, 8.2)
- [x] 3.4 `ShiftPlanningService.kt` (@Service): viikkodatan kokoaminen — lapset,
      henkilöstötarvetaulukko, käyttöaste (`calculateDailyUnitOccupancyValues`,
      CONFIRMED), tallennettu suunnitelma, KVTES-raja ja mitoitusjakaja vastaukseen
      (Req 4.3, 4.4, 5.2, 7.3)
- [x] 3.5 `ShiftPlanningController.kt`: kolme endpointtia (units GET, viikkodata GET,
      suunnitelma PUT) AccessControl-tarkistuksin; PUT validoi `end > start` (400,
      errorCode SHIFT_TIME_ORDER), päivämäärät viikolle ja `weekStart` = maanantai;
      tallennus yhdessä transaktiossa. PDF GET lisätään vaiheessa 4 PDF-palvelun kanssa
      (Req 2.4, 3.1, 6.1–6.4, 8.1, 8.5)
- [x] 3.6 Integraatiotestit (`ShiftPlanningIntegrationTest`, 10 testiä): yksikkölistaus
      roolin mukaan, Forbidden ilman roolia / toiseen yksikköön, maanantaivalidointi,
      viikkodatan sisältö (painotettu lapsimäärä 4.5 → 1 työntekijä), tallennus +
      uudelleenlataus + korvaus, aikajärjestys- ja viikkovalidoinnit — vihreät
      (Req 2.4, 3.3, 6.4, 8.2)

## Vaihe 4: PDF-tuloste

- [x] 4.1 Thymeleaf-template `src/main/resources/espoo/templates/shift-plan/shift-plan.html`:
      per päivä työvuorot (työntekijän nimi, tulo, lähtö) ja lapset (nimi, tulo, lähtö
      varausajoista); espoo-resurssipolku koska Petäjävesi ajaa espoo-instanssin
      template-engineä (`pdfTemplateEngine("espoo")`) (Req 9.2, 9.3)
- [x] 4.2 `ShiftPlanPdfService.kt` (@Service): PDF `PdfGenerator`-palvelulla
      (`Template("shift-plan/shift-plan")` + Thymeleaf Context); NotFound jos
      suunnitelmaa ei ole tallennettu; ajat ja päivämäärät formatoidaan suomeksi
      palvelussa (Req 9.1, 9.4)
- [x] 4.2b Controller-endpoint `GET .../weeks/{weekStart}/pdf`
      (`Action.Unit.DOWNLOAD_SHIFT_PLAN_PDF`, Content-Disposition attachment,
      Audit.ShiftPlanPdfDownload) — siirretty vaiheesta 3 tänne
- [x] 4.3 Integraatiotestit: PDF muodostuu tallennetusta suunnitelmasta (%PDF-alkuinen
      sisältö), NotFound ilman suunnitelmaa, Forbidden ilman roolia — vihreät

## Vaihe 5: Codegen ja frontendin perusta

- [x] 5.0 Codegen-laajennus (toteutuksessa havaittu lisätarve): codegen skannasi vain
      `evaka.core`-paketin — lisätty `evaka.instance.petajavesi`-skannaus ja
      pakettimäppäys (`service/codegen/.../ApiFiles.kt`) → syntyy
      `lib-common/generated/api-types/petajavesi.ts` ja
      `employee-frontend/generated/api-clients/petajavesi.ts`
- [x] 5.1 Codegen ajettu: `UserRole` + `EmployeeFeatures.shiftPlanning` (shared.ts),
      `deleteTyovuorosuunnittelija`-client (daycare.ts), shift-planning-tyypit,
      -clientit ja PDF-URL-helperi deserialisaattoreineen; `codegenCheck` vihreä
- [x] 5.2 `TYOVUOROSUUNNITTELIJA` lisätty `scopedRoles`-listaan
      (`lib-common/api-types/employee-auth.ts`) → rooli valittavissa
      `DaycareRolesModal`issa; poisto Työntekijät-sivulla toimii geneerisellä
      `deleteEmployeeDaycareRoles`-endpointilla ilman muutoksia (Req 1.3, 1.4)
- [x] 5.2b Yksikön käyttöoikeussivu (toteutuksessa havaittu lisätarve):
      `DaycareAclRole`-tyyppi, `AddAclModal`-roolivaihtoehto
      (INSERT_ACL_TYOVUOROSUUNNITTELIJA-oikeudella), rooli poisto-mutaatio ja
      muokkaus/järjestys-mäppäykset (`UnitAccessControl.tsx`, `unit/queries.ts`)
- [x] 5.3 Roolinimi lisätty employee-i18n:ään: fi "Työvuorosuunnittelija",
      sv "Arbetsskiftsplanerare"
- [x] 5.4 Varmistus typed-eslintillä (muutetut tiedostot puhtaita). Huom: koko projektin
      `yarn type-check` on rikki jo HEAD:ssä tästä työstä riippumatta
      (lib-components ⇄ lib-customizations tsconfig-viittaussykli, tuotu commitissa
      "Use modern JSX transform in TypeScript compilation")

## Vaihe 6: Instanssikansio `lib-customizations/petajavesi`

- [x] 6.1 Luotu kansio `lib-customizations/petajavesi` kopioimalla `espoo`-kansio,
      joka oli tässä forkissa jo valmiiksi Petäjävesi-sisältöinen (logo, tekstit,
      featureFlags) — sama tiedostorakenne kuin muissa instanssikansioissa;
      Espoon logo poistettu assetseista (Req 10.2)
- [x] 6.2 Petäjävesi-ylikirjoitukset (mm. `loginPage.title`, PetajavesiLogo) ovat nyt
      petajavesi-kansiossa. `espoo`-kansio jätetty toistaiseksi ennalleen, jotta
      vanhat deployt eivät hajoa — siivotaan kun deploy on todettu toimivaksi
      petajavesi-kansiolla. Työvuorosuunnittelun fi-tekstit lisätään vaiheessa 7
      näkymän yhteydessä (Req 10.3)
- [x] 6.3 Build varmistettu: `EVAKA_CUSTOMIZATIONS=petajavesi ICONS=free yarn build`
      onnistuu. Deploy-workflow päivitetty (`pet-build_and_deploy.yml`:
      build-context ja EVAKA_CUSTOMIZATIONS → petajavesi); `README-petajavesi.md`
      päivitetty (petajavesi-kansio, paikalliskehitys, shift-planning-viittaukset)

## Vaihe 7: Suunnittelunäkymä

- [x] 7.0 Työvuorosuunnittelun UI-tekstit sijoitettu Petäjäveden instanssikansioon
      (`lib-customizations/petajavesi/shiftPlanning.ts`, suora import — toimii kaikilla
      EVAKA_CUSTOMIZATIONS-arvoilla); Header-navigaation nimi lisätty defaults-i18n:ään
      (fi "Työvuorosuunnittelu", sv "Arbetsskiftsplanering") (Req 10.3)
- [x] 7.1 Header: NavLink lipulla `accessibleFeatures.shiftPlanning`,
      `to="/shift-planning"`, `data-qa="shift-planning-nav"`, samassa nav-rivissä
      raporttien ja viestien välissä (Req 2.2, 2.3, 2.5)
- [x] 7.2 Reitti `/shift-planning` → `ShiftPlanningPage` (`EmployeeRoute` requireAuth +
      feature-lipputarkistus sivulla; backend palauttaa 403 ilman roolia) (Req 2.4)
- [x] 7.3 `ShiftPlanningPage.tsx`: yksikkövalitsin (vain endpointin palauttamat
      luvalliset yksiköt, autovalinta jos yksi), viikkonavigaatio edellinen/seuraava +
      viikkonumero, oletuksena seuraava viikko; tyhjän viikon InfoBox (Req 3.1–3.3)
- [x] 7.4 Virhekäsittely: viimeisin onnistunut vastaus säilytetään ref:ssä — refetch-
      virheessä näytetään data + AlertBox-varoitus vanhentuneista tiedoista; ilman
      välimuistidataa renderResult näyttää virheen (Req 3.4, 3.5)
- [x] 7.5 `StaffingNeedTable.tsx`: aikaväli × viikonpäivä -taulukko, solussa
      "tarve / suunniteltu" (punainen kun vajausta, title-tooltipissa lapsimäärä,
      painotettu määrä ja erotus); käyttöasterivi ylimpänä (Req 4.3, 4.4, 6.5)
- [x] 7.6 `ChildrenTable.tsx`: lapset, syntymäaika, tuen tiedot (kerroin + tuen taso)
      ja varausajat päivittäin (Req 5.2)
- [x] 7.7 `ShiftEditor.tsx`: vuorojen lisäys/muokkaus/poisto (työntekijä- ja
      päivävalinnat, TimeInput-kentät); virheellinen aikajärjestys estää tallennuksen
      ja näyttää varoituksen kentässä (Req 6.1–6.4)
- [x] 7.8 `WeeklyHoursSummary.tsx`: suunniteltu viikkotyöaika / KVTES-raja (backendin
      `weeklyHourLimitMinutes`) + punainen ylityshuomautus (Req 7.1–7.3)
- [x] 7.9 Tallennus replace-all-semantiikalla (poisto = tallennus ilman vuoroa, ei
      palaudu); tallennusvirhe lukitsee muokkauksen (AlertBox + kentät disabled)
      kunnes uusi tallennus onnistuu (Req 6.6, 8.5)
- [x] 7.10 PDF-latauslinkki näkyy kun tallennettu suunnitelma on olemassa; muuten
      ohjeteksti "Tallenna suunnitelma ennen PDF-latausta" (Req 9.1)
- [x] 7.11 Vitest-testit (`calc.spec.ts`, 10 testiä): parsinta, aikajärjestys,
      viikkominuuttisumma + KVTES-rajatapaus (tasan 2295 ei ylitä), kate/erotus,
      formatointi — vihreät (Req 6.5, 7)
- [x] 7.12 UI rakennettu lib-components-komponenteilla (Container/ContentArea, Table,
      Select, TimeInput, AsyncButton, AlertBox/InfoBox, teemavärit); data-qa-attribuutit
      kaikissa keskeisissä elementeissä. Lint puhdas, tyyppitarkistus puhdas omien
      tiedostojen osalta, build OK petajavesi-kustomoinnilla (Req 10.1)
- [x] 7.13 Bonus: korjattu ennestään rikkinäinen `yarn type-check`
      (lib-components ⇄ lib-customizations tsconfig-sykli TS6202) poistamalla
      commitissa e192790b24 lisätty viittaus — tyyppitarkistus ajautuu nyt;
      jäljellä 41 ennestään ollutta virhettä kuntakustomointitiedostoissa
      (eivät liity tähän työhön)

## Vaihe 8: Viimeistely

- [x] 8.1 Lint ja formatointi: frontend eslint+prettier puhdas, service ktfmt ajettu
      uusille tiedostoille
- [x] 8.2 Lisenssiotsikot: SPDX-otsikot tarkistettu kaikista uusista tiedostoista
      käsin (`reuse`-työkalua ei ole asennettu paikallisesti — CI tarkistaa)
- [x] 8.3 Backend-savutesti paikallisesti: service käynnistyy, migraatiot V891+V892
      ajautuvat sovelluksen omalla Flywaylla, `shift_plan`-taulut syntyvät ja
      `/employee/shift-planning/units` vastaa 401 ilman kirjautumista (controller
      rekisteröityi EspooInstance-scanin kautta). Huom: pm2:n service-prosessi oli
      rekisteröity vanhasta checkoutista (`~/code/evaka_pet_tyovuorosuunnittelu`) —
      poistettu ja rekisteröity uudelleen tästä työhakemistosta.
      UI-tason läpikävely (roolin myöntäminen → nav-painike → suunnitelma → PDF)
      jää käyttäjälle: `pm2 start` compose-kansiossa ja kirjaudu dev-loginilla
- [x] 8.4 `README-petajavesi.md` päivitetty (vaiheessa 6)

## Vaihe 9: Vuoropohjainen henkilöstön kohdentaminen (Req 12, lisätty 2026-07-04)

- [x] 9.1 `calc.ts` uudistettu vuoropohjaiseksi: `DraftShiftGroup` (päivä + aikaväli +
      työntekijälista), `groupsFromPlan` (tallennettujen rivien ryhmittely vuoroiksi,
      Req 12.3) ja `parseDraftGroup` (rivi per valittu työntekijä, Req 12.2; tyhjä
      työntekijälista → ei tallenneta, Req 12.4)
- [x] 9.2 `ShiftEditor.tsx`: vuororivi = päivävalinta + kellonajat + työntekijöiden
      **monivalinta** (lib-components `MultiSelect`); huomautus jos vuoroon ei ole
      valittu ketään; kate ja viikkotyöaika lasketaan valituista työntekijöistä
      (Req 12.1, 12.5)
- [x] 9.3 Testidata: 5 kasvattajaa (Hoitaja Aino/Maija/Tuula/Pekka/Ville) STAFF-roolilla
      yksikköön "Päiväkoti ja esikoulu A" (`shift-planning-test-data.sql` + ajettu
      paikalliseen kantaan) — henkilöstövalitsimessa on nyt aitoa valittavaa
- [x] 9.4 Vitest-testit päivitetty (12 testiä): parseDraftGroup monella työntekijällä,
      tyhjä työntekijälista, groupsFromPlan-ryhmittely — vihreät; tyyppitarkistus ja
      build (petajavesi) puhtaat
- [x] 9.5 requirements.md: uusi Requirement 12 hyväksymiskriteereineen
- [x] 9.6 Päivien monivalinta (Req 12.1, 12.6, lisätty 2026-07-04): vuororivin
      päivävalinta muutettu monivalinnaksi — samat henkilöt ja kellonajat voi
      kohdentaa usealle päivälle kerralla; uusi vuoro esitäytetään arkipäivillä
      (ma–pe). `DraftShiftGroup.date` → `dates: LocalDate[]`; `groupsFromPlan`
      yhdistää tallennetut rivit vuoroiksi kun kellonajat ja työntekijäjoukko
      täsmäävät; huomautus jos päiviä ei ole valittu (Req 12.4). Testit (12 kpl),
      tyyppitarkistus ja build vihreät
- [x] 9.7 Graafiset esitystavat (lisätty 2026-07-04): Lista/Kaavio-vaihtopainikkeet
      (SelectionChip) sekä henkilöstötarpeelle että lapsille — listanäkymä säilyy.
      `StaffingNeedChart` (chart.js, eVakan raporttien tapaan): päivävalinta
      chipeillä, tarve pylväinä (teeman m2-sininen) + suunniteltu kate porrasviivana
      (a2orangeDark) — väripari validoitu dataviz-tarkistimella (CVD ΔE 105, kaikki
      tarkistukset PASS); hover-tooltip näyttää aikavälin ja molemmat arvot.
      `ChildrenTimelineChart`: lasten varausajat vaakajanoina (Gantt) päivävalinnalla.
      Chart.js-rekisteröintiin lisätty BarElement, CategoryScale ja Legend
- [x] 9.8 Tuen tarpeen merkintä aikajanakaavioon (lisätty 2026-07-04): valittuna
      päivänä voimassa oleva tuen tieto merkitään lapsen nimeen "(tuki)"-tekstillä,
      jana värjätään oranssiksi (teksti + väri, ei pelkkä väri) ja tooltip näyttää
      tuen sisällön (kerroin ja/tai taso). Testidataan lisätty daycare_assistance-
      tasot neljälle lapselle (yleinen/tehostettu/erityinen tuki) — myös
      seed-skriptiin (Req 5.2, 11.4)
- [x] 9.9 PDF uudistettu viikkomatriisiksi (lisätty 2026-07-04): vaaka-A4, kaksi
      taulukkoa — Työvuorot (rivi/työntekijä) ja Lasten varausajat (rivi/lapsi),
      sarakkeet ma–su, soluissa kellonajat. Otsikkorivi toistuu sivun vaihtuessa,
      rivit eivät katkea sivunvaihdossa, lapset omalle sivulleen. Korvaa aiemman
      päiväkohtaisen listamuodon, joka paisui monisivuiseksi (Req 9.2, 9.3)

## Vaihe 10: Toteuma ja 15 min aikavälit (lisätty 2026-07-27)

- [x] 10.1 Aikaväliresoluutio 30 min → 15 min: `SLOT_MINUTES = 15`
      (`StaffingCalculator.kt`), pyöristysrajat päivitetty (23:45),
      yksikkötestit päivitetty (48 slottia oletusikkunalle) — vihreät
- [x] 10.2 Toteuma suunnitelman rinnalle: työntekijöiden eVaka-mobiilileimaukset
      (`staff_attendance_realtime`) mukaan viikkovastaukseen — uusi kysely
      `getShiftPlanStaffAttendances` (leimaus kohdistetaan yksikköön ryhmän
      kautta, aikaleimat Suomen aikaan) ja `staffAttendances`-kenttä
      `ShiftPlanWeekResponse`en. Codegen ajettu. Integraatiotestit vihreät
- [x] 10.3 Frontend: `actualCoverageAt` + `actualMinutesByEmployee` (calc.ts,
      avoin leimaus kattaa loppupäivän / ohitetaan minuuttisummasta),
      StaffingNeedTable-soluihin kolmas luku (tarve / suunniteltu / toteuma) ja
      selite, StaffingNeedChart-kaavioon toteuma tummanvihreänä katkoviivana
      (erottuu myös ilman värinäköä), WeeklyHoursSummary-tauluun
      Toteutunut-sarake. Toteuma näytetään vain kun viikolla on leimauksia.
      Vitest-testit (16 kpl) vihreät, lint puhdas
- [x] 10.4 Testidata: 50 leimausta (10 kasvattajaa × ma–pe) edelliselle viikolle
      paikalliseen kantaan ja seed-skriptiin; sisään 06:30–08:30, ulos
      14:00–16:30 minuutin tarkkuudella. Seed-skriptin lasten varaukset
      laajennettu kattamaan myös edellinen viikko toteumavertailua varten
- [x] 10.5 Vuoroehdotus lasten tulo- ja lähtöajoista (lisätty 2026-07-27):
      `suggestShiftGroups` (calc.ts) purkaa henkilöstötarpeen kerroksiin
      (kerros k = välit joissa tarve ≥ k), yhdistää alle tunnin notkahdukset,
      jakaa yli 8 h jaksot tasan ja venyttää alle 4 h vuorot 4 tuntiin.
      Ehdotus esitäytetään automaattisesti kun viikolla ei ole tallennettua
      suunnitelmaa, ja "Luo ehdotus varauksista" -painike luo sen uudelleen.
      Työntekijöitä EI kohdenneta automaattisesti — suunnittelija valitsee ne
      (ilman työntekijää olevia vuoroja ei tallenneta, InfoBox ohjeistaa).
      Vitest-testit (22 kpl) vihreät

## Vaihe 11: KVTES-vuoropituudet ja kolmen viikon tasoittumisjakso (lisätty 2026-07-27)

- [x] 11.1 Vuoroehdotuksen pituusrajat KVTES:n mukaisiksi: vuoron pituus 6–9 h,
      tavoitteena yleistyöajan oletusvuoro 7 h 39 min. Pitkät jaksot jaetaan
      niin monta vuoroon, että pituus osuu lähimmäs tavoitetta (max 9 h);
      jos tasajako alittaisi 6 h, käytetään limittäisiä 6 h vuoroja. Uuden
      käsin lisättävän vuoron esitäyttö 08:00–15:39. Vitest-testit päivitetty
- [x] 11.2 Migraatio `V893__shift_plan_balancing_period.sql`: yksikkökohtainen
      kolmen viikon tasoittumisjakso (start_date ma, end_date = start+20 pv,
      ei päällekkäisiä jaksoja, gist-exclude). migrations.txt päivitetty
- [x] 11.3 Backend: jakso haetaan tai luodaan viikkodatan haussa (getWeek nyt
      transaktio) — uusi jakso ankkuroidaan yksikön lähimpään olemassa olevaan
      jaksoon yhtenäiseen kolmen viikon rytmiin, ensimmäinen jakso alkaa
      avatusta viikosta. Vastaukseen balancingPeriod, periodMinutes
      (työntekijän suunniteltu + toteutunut koko jaksolta) ja
      periodHourLimitMinutes (3 × 2295). Integraatiotestit ankkuroinnille ja
      jaksokertymille — vihreät
- [x] 11.4 Viikkotyöaika-osio (KVTES liite 5) tasoittumisjaksopohjaiseksi:
      selite jakson päivämääristä ja rajoista, sarakkeet Suunniteltu/Toteutunut
      (viikko) ja (jakso) sekä Jakson saldo (+ylitys punaisella / −alitus).
      Jakson suunniteltuun yhdistetään muokkaustilan tallentamattomat vuorot.
      Viikoittainen ylitysvaroitus korvattu jakson saldolla, koska viikko-
      kohtaiset ylitykset tasoittuvat jakson sisällä
- [x] 11.5 Testidata: leimaukset laajennettu kuluvalle ja seuraavalle viikolle
      (yht. 150 leimausta kolmelle viikolle paikallisessa kannassa) ja
      seed-skriptiin
- [x] 11.6 Työntekijäehdotus hyväksyntäkierrolla (lisätty 2026-07-27):
      "Ehdota työntekijät" -painike täyttää tyhjät vuororivit —
      `suggestEmployeeAssignments` (calc.ts) valitsee työntekijän, jolla on
      vähiten suunniteltua työaikaa tasoittumisjaksolla (periodMinutes-baseline
      + viikon jo kohdennetut vuorot), eikä ehdota ketään päällekkäisiin
      vuoroihin; suurimmat vuorokokonaisuudet kohdennetaan ensin. Ehdotus EI
      tallennu automaattisesti: tallennus on lukittu, kunnes suunnittelija
      painaa "Hyväksy ehdotus" tai "Hylkää ehdotus" (hylkäys tyhjentää
      ehdotetut työntekijät), ja rivejä voi muokata vapaasti ennen
      hyväksyntää. Ehdotetut rivit merkitään "Ehdotettu — hyväksy tai
      muokkaa" -tekstillä. Vitest-testit (28 kpl) vihreät; UI-kierto
      varmistettu Playwrightilla (ehdotus → tallennus lukittu → hyväksyntä →
      tallennus vapautuu)

## Ylläpitomuutos 2026-07-31: johtajalle automaattiset oikeudet

- [x] Yksikön johtaja (UNIT_SUPERVISOR) saa työvuorosuunnitteluoikeudet
      automaattisesti omissa yksiköissään ilman erillistä
      TYOVUOROSUUNNITTELIJA-roolia: UNIT_SUPERVISOR lisätty sääntöihin
      SHIFT_PLANNING_PAGE, READ/UPDATE_SHIFT_PLAN ja DOWNLOAD_SHIFT_PLAN_PDF,
      tampere-region.csv päivitetty (Johtaja-sarake). Ei tietokantamuutoksia.
      Verifioitu Playwrightilla (Essi Esimies, pelkkä UNIT_SUPERVISOR-rooli)

## Vaihe 12: Työvuorotoiveet (Req 13, valmis 2026-08-01)

- [x] 12.1 Migraatio V894: shift_wish + shift_wish_status (PENDING/APPROVED/
      REJECTED, resolved_by/at, resolved_start/end_time), migrations.txt
- [x] 12.2 Backend: ShiftWishController (/employee/shift-wishes: units, omat
      toiveet + ikkuna, luonti ikkunavalidoinnilla, oman PENDING-toiveen
      poisto), resolve ShiftPlanningControllerissa (APPROVED lisää vuoron
      suunnitelmaan INSERT-semantiikalla), toiveet getWeek-vastaukseen.
      Actionit SHIFT_WISH_PAGE (STAFF), CREATE_SHIFT_WISH (STAFF),
      UPDATE_SHIFT_WISH (TYOVUOROSUUNNITTELIJA+UNIT_SUPERVISOR),
      EmployeeFeatures.shiftWishes, audit-eventit, ShiftWishId.
      Integraatiotestit (9 kpl) vihreät
- [x] 12.3 Codegen + tampere-region.csv regenerointi + testinimet
- [x] 12.4 Työntekijän Työvuorot-välilehti: route /shift-wishes, header-tab
      (i18n.header.shiftWishes), ShiftWishPage (yksikkövalinta, toivelomake,
      viikoittainen listaus statuksineen, poisto), tekstit
      lib-customizations/petajavesi/shiftWishes.ts
- [x] 12.5 Suunnittelijan toivepaneeli (WishPanel ShiftEditorissa): saman
      vuoron (päivä+ajat) käsittelemättömät toiveet ryhmitellään slotti-
      kohtaisella värillä ("N toivoo samaa vuoroa" -chip + rivin taustaväri),
      kellonaikoja voi muokata ennen hyväksyntää, hyväksyntä tallentaa vuoron
      heti backendiin JA lisää sen editorin riveihin (replace-tallennus ei
      pyyhi sitä). HUOM: onApproved kutsutaan mutaation promiseketjussa eikä
      AsyncButtonin onSuccessissa — tilan päivitys unmounttaa painikkeen ennen
      onSuccess-viivettä (bugi löytyi ja korjattiin verifioinnissa)
- [x] 12.6 Verifioitu Playwrightilla: Kaisa Kasvattaja loi toiveet, kolmen
      toivojan sama vuoro korostui, Seppo Sorsa hyväksyi muutetuin ajoin ja
      hylkäsi, koko suunnitelman tallennus säilytti hyväksytyt vuorot,
      työntekijälle statukset ja "Hyväksytty muutettuna" -merkintä

## Vaihe 13: Hyväksyttyjen toiveiden ensisijaisuus ehdotuksessa (Req 14, valmis 2026-08-01)

- [x] 13.1 calc.ts: approvedWishShifts + subtractShiftsFromNeed, vitest-testit
      (32 kpl vihreitä)
- [x] 13.2 ShiftEditor: "Luo ehdotus varauksista" säilyttää hyväksytyt
      toivevuorot, täyttää vain jäljelle jäävän tarpeen ja ehdottaa lopuksi
      työntekijät hyväksyntäkierrolla; sama logiikka esitäyttöön ilman
      tallennettua suunnitelmaa. suggestionInfo-teksti päivitetty
- [x] 13.3 Verifioitu Playwrightilla: hyväksytyt vuorot (Aino 08-16,
      Kaisa 08-15) säilyivät ehdotuksessa, työntekijäehdotus lukitsi
      tallennuksen kunnes hyväksytty, tallennettu suunnitelma sisälsi
      hyväksytyt toivevuorot muuttumattomina

## Vaihe 14: Työntekijäkohtaiset PDF-tulosteet (Req 9.5-9.7, valmis 2026-08-01)

- [x] 14.1 renderEmployeeShiftPlanPdf + shift-plan-employee.html (sivu per
      työntekijä, päivärivit, viikkosumma), PlannedShiftWithEmployee sai
      employeeId:n
- [x] 14.2 Endpointit getEmployeesPdf / getEmployeePdf + codegen;
      integraatiotestit (yksi+kaikki muodostuvat, NotFound ilman vuoroja)
- [x] 14.3 UI: "Työntekijöille jaettavat listat" -osio ShiftEditoriin
- [x] 14.4 Verifioitu Playwrightilla: molemmat PDF:t latautuvat (200, %PDF,
      content-disposition), sisältö tarkistettu (Ainon päivärivit ja 14 h 45
      min; kaikkien tulosteessa työntekijät aakkosjärjestyksessä omine
      sivuineen)

## Vaihe 15: Työntekijän omat vahvistetut vuorot (Req 13.8, valmis 2026-08-01)

- [x] 15.1 getOwnPlannedShifts + ShiftWishesResponse.shiftsRange/shifts,
      integraatiotesti (oma vuoro suunnitelmasta + hyväksytystä toiveesta,
      toisen työntekijän vuorot eivät näy)
- [x] 15.2 UI: "Omat työvuorot" -osio Työvuorot-sivulle (kuluva + 3 viikkoa,
      kuluva viikko merkitty, yksikkösarake vain monen yksikön tilanteessa)
- [x] 15.3 Takautuva testidata: viikon 29 hoitoajat (136 varausta), toiveet
      viikoille 29-31 (13-14/viikko + päällekkäiset slotit) suoraan kantaan
      (menneet viikot eivät kuulu toiveikkunaan, joten UI-luonti ei onnistuisi)
- [x] 15.4 Verifioitu Playwrightilla: Seppo hyväksyi Tuulan viikon 31 toiveet,
      Tuulan Omat työvuorot näytti vko 31 (kuluva: 4 vuoroa, ml. hyväksytyt
      toiveet) ja vko 32 (3 vuoroa suunnitelmasta), vkot 33-34 tyhjät

## Vaihe 16: Tärkeät toiveet (Req 13.9-13.10, valmis 2026-08-01)

- [x] 16.1 V895 shift_wish.important + insert/select-päivitykset +
      countImportantWishes (hylätyt eivät kuluta kiintiötä)
- [x] 16.2 createWish-validointi (WISH_IMPORTANT_LIMIT, max 2/ikkuna/työntekijä),
      integraatiotesti kiintiölle (raja, normaalit eivät kulu, per työntekijä,
      hylkäys vapauttaa)
- [x] 16.3 UI: työntekijän checkbox + kiintiöinfo + tähdet, suunnittelijan
      tähti + "★ Tärkeä" -chip + selite
- [x] 16.4 Verifioitu Playwrightilla: Kaisa merkitsi 2 tärkeää (laskuri 2/2,
      checkbox disabloitui), Sepon toivepaneelissa tähdet ja chipit näkyivät.
      Huom. AsyncButton on success-tilassa ~3 s tallennuksen jälkeen eikä ota
      uutta klikkausta — peräkkäiset pikasyötöt vaativat odotuksen
