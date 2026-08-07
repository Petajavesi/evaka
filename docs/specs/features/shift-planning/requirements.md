<!--
SPDX-FileCopyrightText: 2017-2026 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Requirements Document

## Introduction

Työvuorosuunnittelu on eVakan työntekijäpuolelle (evaka/employee) rakennettava lisäosa, jonka avulla
yksikön työvuorosuunnittelija voi suunnitella henkilöstön työvuorot lasten varhaiskasvatukseen ilmoittautumisten
(varausaikojen) ja läsnäolojen perusteella. Lisäosa tulkitsee, kuinka monta lasta on tulossa varhaiskasvatukseen
seuraavalla viikolla, ja muodostaa kellonajan mukaan jäsennellyn taulukon tarvittavasta henkilöstömäärästä.
Suunnittelija kohdentaa sopivat työntekijät tarvittaviin työvuoroihin. Lasten tuen tieto otetaan huomioon
henkilöstömitoituksessa ja näytetään suunnittelunäkymässä. Työvuorot tulkitaan KVTES liitteen 5 mukaisesti
keskimääräisen yleistyöajan perusteella, ja suunnitelmasta voidaan tulostaa PDF-luettelo.

Lisäosa toteutetaan käyttäen eVakan olemassa olevia järjestelmätietoja (yksiköiden ja ryhmien tiedot,
käyttö- ja täyttöaste, lasten lukumäärä, varausajat, läsnäolot, tuen tieto) ja eVakan visuaalista ilmettä.
Kaikki mahdollinen koodi sijoitetaan "petajavesi"-instanssin alle: backendissä Petäjäveden instanssikohtaiseen
sijaintiin ja frontendissä uuteen `frontend/src/lib-customizations/petajavesi`-kansioon.

## Glossary

- **Tyovuorosuunnittelu_Lisaosa**: Tämä lisäosa kokonaisuutena; eVakan työntekijäpuolen toiminnallisuus työvuorojen suunnitteluun.
- **Tyovuorosuunnittelija**: Uusi eVakan käyttäjärooli (UserRole), joka aktivoi työvuorosuunnittelu-lisäosan ja jolla on pääsy suunnittelunäkymään. Lisäksi yksikkörooli `UNIT_SUPERVISOR` (Johtaja) antaa saman oikeuden automaattisesti omissa yksiköissä (päivitetty 2026-07-31).
- **Suunnittelunakyma**: Työntekijäpuolen näkymä, jossa työvuorosuunnittelu tehdään.
- **Yksikko**: eVakan varhaiskasvatusyksikkö (daycare).
- **Ryhma**: Yksikön sisäinen lapsiryhmä (daycare_group).
- **Varausaika**: Huoltajan ilmoittama lapsen läsnäolon alkamis- ja päättymiskellonaika (taulu `attendance_reservation`).
- **Lasnaolo**: Lapsen toteutunut läsnäolo (taulu `child_attendance`).
- **Kayttoaste**: Yksikön/ryhmän käyttö- ja täyttöaste eli kuormitus (eVakan occupancy/RealtimeOccupancy-laskenta).
- **Tuen_tieto**: Lapsen tuen tarvetta kuvaava tieto, joka vaikuttaa henkilöstömitoitukseen (taulut `assistance_factor`, `daycare_assistance`).
- **Henkilostotarve**: Tiettynä kellonaikana tarvittava työntekijöiden lukumäärä, joka lasketaan paikalla olevien lasten ja tuen tiedon perusteella.
- **Tyovuoro**: Yksittäisen työntekijän suunniteltu työvuoro, jolla on alkamis- ja päättymiskellonaika sekä päivämäärä.
- **Tyovuorosuunnitelma**: Yhden yksikön yhden viikon työvuorojen kokonaisuus, joka tallennetaan tietokantaan.
- **Keskimaarainen_yleistyoaika**: KVTES liitteen 5 mukainen keskimääräinen yleistyöaika, jota käytetään työvuorojen pituuden ja jaksotuksen tulkintaan.
- **KVTES_Liite5**: Kunnallisen virka- ja työehtosopimuksen liite 5, joka määrittää työaikamuodon säännöt.
- **Henkiloston_mitoitus_kerroin**: Kerroin, joka määrittää kuinka monta lasta yhtä työntekijää kohden sallitaan ja jota tuen tieto muuttaa.
- **Petajavesi_Instanssi**: eVakan asiakaskohtainen instanssi, jonka alle lisäosan instanssikohtainen koodi sijoitetaan.
- **PDF_Tuloste**: Suunnitelmasta muodostettava PDF-dokumentti, joka listaa lasten tulo- ja lähtöajat sekä työntekijän nimen ja tämän tulo- ja lähtöajat.

## Requirements

### Requirement 1: Työvuorosuunnittelija-käyttäjärooli

**User Story:** Pääkäyttäjänä haluan hallita uutta Työvuorosuunnittelija-roolia olemassa olevassa käyttäjähallinnassa, jotta voin myöntää työvuorosuunnitteluoikeuden oikeille työntekijöille.

#### Acceptance Criteria

1. THE Tyovuorosuunnittelu_Lisaosa SHALL lisätä eVakan `UserRole`-enumiin uuden arvon `TYOVUOROSUUNNITTELIJA`.
2. THE Tyovuorosuunnittelu_Lisaosa SHALL määritellä roolin `TYOVUOROSUUNNITTELIJA` yksikkösidonnaiseksi rooliksi (UserRole.SCOPED_ROLES), jotta oikeus rajautuu työntekijälle määriteltyihin yksiköihin.
3. WHEN pääkäyttäjä lisää työntekijälle roolin `TYOVUOROSUUNNITTELIJA` olemassa olevassa käyttäjähallinnassa, THE Tyovuorosuunnittelu_Lisaosa SHALL tallentaa roolin kyseiselle työntekijälle valittuun yksikköön.
4. WHEN pääkäyttäjä poistaa työntekijältä roolin `TYOVUOROSUUNNITTELIJA`, THE Tyovuorosuunnittelu_Lisaosa SHALL poistaa kyseisen työntekijän työvuorosuunnitteluoikeuden kyseisestä yksiköstä.

### Requirement 2: Pääsynvalvonta ja navigointipainike

**User Story:** Työvuorosuunnittelijana haluan nähdä yläpalkissa "Työvuorosuunnittelu"-painikkeen, jotta pääsen suunnittelunäkymään, kun minulla on tarvittava oikeus.

*Päivitetty 2026-07-31: suunnitteluoikeuden antaa rooli `TYOVUOROSUUNNITTELIJA` **tai** yksikkörooli `UNIT_SUPERVISOR` (Johtaja) — johtaja saa oikeuden automaattisesti omiin yksiköihinsä ilman erillistä roolia. Alla "suunnitteluoikeuden antava rooli" tarkoittaa kumpaa tahansa näistä.*

#### Acceptance Criteria

1. WHERE kirjautuneella työntekijällä on suunnitteluoikeuden antava rooli vähintään yhdessä yksikössä, THE Tyovuorosuunnittelu_Lisaosa SHALL asettaa työntekijän `EmployeeFeatures.shiftPlanning`-ominaisuuden arvoon tosi.
2. WHILE työntekijän `EmployeeFeatures.shiftPlanning` on tosi, THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää yläpalkissa (Header) "Työvuorosuunnittelu"-navigointipainikkeen, joka ohjaa reitille `/shift-planning` ja jolla on tunniste `data-qa="shift-planning-nav"`.
3. IF kirjautuneella työntekijällä ei ole suunnitteluoikeuden antavaa roolia missään yksikössä, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL jättää "Työvuorosuunnittelu"-navigointipainikkeen näyttämättä.
4. IF työntekijä, jolla ei ole suunnitteluoikeuden antavaa roolia, avaa reitin `/shift-planning`, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL estää suunnittelunäkymän sisällön näyttämisen ja palauttaa pääsynvalvontavirheen.
5. THE Tyovuorosuunnittelu_Lisaosa SHALL sijoittaa "Työvuorosuunnittelu"-painikkeen samaan navigointiriviin olemassa olevien välilehtien (hakemukset, yksiköt, asiakastiedot, talous, raportointi, viestit) kanssa.

### Requirement 3: Suunnitteluviikon ja yksikön valinta

**User Story:** Työvuorosuunnittelijana haluan valita yksikön ja suunnitteluviikon, jotta voin suunnitella oikean yksikön työvuorot oikealle ajanjaksolle.

#### Acceptance Criteria

1. WHEN työvuorosuunnittelija avaa suunnittelunäkymän, THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää valittavaksi ne yksiköt, joihin työvuorosuunnittelijalla on suunnitteluoikeuden antava rooli (`TYOVUOROSUUNNITTELIJA` tai `UNIT_SUPERVISOR`, ks. Req 2).
2. WHEN työvuorosuunnittelija valitsee yksikön ja kalenteriviikon, THE Tyovuorosuunnittelu_Lisaosa SHALL ladata kyseisen yksikön kyseisen viikon lasten varausajat ja läsnäolotiedot suunnittelun pohjaksi.
3. IF työvuorosuunnittelija valitsee viikon, jolle ei ole yhtään varausaikaa valitussa yksikössä, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää suunnittelunäkymän tyhjänä ja ilmoittaa, että varauksia ei ole.
4. IF varausaikojen ja läsnäolotietojen lataus epäonnistuu verkko- tai palvelinvirheen vuoksi JA aiemmin ladattuja tietoja on välimuistissa saatavilla, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL sallia suunnittelun jatkamisen välimuistissa olevilla tiedoilla JA näyttää selkeän huomautuksen siitä, että tiedot voivat olla vanhentuneita.
5. IF varausaikojen ja läsnäolotietojen lataus epäonnistuu verkko- tai palvelinvirheen vuoksi JA välimuistissa ei ole saatavilla aiemmin ladattuja tietoja, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää virheilmoituksen.

### Requirement 4: Henkilöstötarpeen laskenta kellonajan mukaan

**User Story:** Työvuorosuunnittelijana haluan nähdä kellonajoittain jäsennellyn taulukon tarvittavasta henkilöstömäärästä, jotta tiedän kuinka monta työntekijää tarvitaan minäkin hetkenä.

#### Acceptance Criteria

1. WHEN valitun yksikön ja viikon varausajat on ladattu, THE Tyovuorosuunnittelu_Lisaosa SHALL laskea jokaiselle päivälle kellonaikaväleittäin paikalla olevien lasten lukumäärän varausaikojen perusteella.
2. WHEN paikalla olevien lasten lukumäärä kellonaikavälille on laskettu, THE Tyovuorosuunnittelu_Lisaosa SHALL laskea kyseiselle kellonaikavälille tarvittavan henkilöstötarpeen jakamalla lasten painotetun lukumäärän henkilöstön mitoituskertoimella ja pyöristämällä ylöspäin.
3. THE Tyovuorosuunnittelu_Lisaosa SHALL esittää henkilöstötarpeen kellonajan mukaan jäsenneltynä taulukkona suunnittelunäkymässä.
4. WHERE eVakan käyttö- ja täyttöasteen (Kayttoaste) laskenta on saatavilla valitulle yksikölle ja viikolle, THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää käyttö- ja täyttöasteen suunnittelunäkymässä henkilöstötarpeen rinnalla.

### Requirement 5: Lasten tuen tiedon huomiointi

**User Story:** Työvuorosuunnittelijana haluan että lasten tuen tieto otetaan huomioon henkilöstötarpeessa ja näkyy suunnittelunäkymässä, jotta mitoitus vastaa todellista tuen tarvetta.

#### Acceptance Criteria

1. WHEN henkilöstötarvetta lasketaan kellonaikavälille, THE Tyovuorosuunnittelu_Lisaosa SHALL ottaa paikalla olevien lasten tuen tiedon (`assistance_factor` ja `daycare_assistance`) mukaan lasten painotettuun lukumäärään.
2. WHERE paikalla olevalla lapsella on voimassa oleva tuen tieto valittuna päivänä, THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää kyseisen tuen tiedon suunnittelunäkymässä lapsen kohdalla.
3. THE Tyovuorosuunnittelu_Lisaosa SHALL käyttää tuen tiedosta vain valitun yksikön ja viikon ajalle voimassa olevia tietoja.

### Requirement 6: Työvuorojen kohdentaminen työntekijöille

**User Story:** Työvuorosuunnittelijana haluan valita ketkä työntekijät tulevat töihin ja mihin aikaan, jotta voin kattaa lasketun henkilöstötarpeen.

#### Acceptance Criteria

1. WHEN työvuorosuunnittelija lisää työvuoron työntekijälle, THE Tyovuorosuunnittelu_Lisaosa SHALL tallentaa työvuoron päivämäärän sekä alkamis- ja päättymiskellonajan kyseiselle työntekijälle valitussa yksikössä.
2. WHEN työvuorosuunnittelija muokkaa työvuoron kellonaikoja, THE Tyovuorosuunnittelu_Lisaosa SHALL päivittää työvuoron ja laskea suunnitelman henkilöstökatteen uudelleen.
3. WHEN työvuorosuunnittelija poistaa työvuoron, THE Tyovuorosuunnittelu_Lisaosa SHALL poistaa työvuoron suunnitelmasta ja laskea suunnitelman henkilöstökatteen uudelleen.
4. IF työvuoron päättymiskellonaika ei ole tiukasti alkamiskellonajan jälkeen (eli päättymisaika on sama tai aiempi kuin alkamisaika), THEN THE Tyovuorosuunnittelu_Lisaosa SHALL estää työvuoron tallennuksen ja palauttaa validointivirheen.
5. WHILE työvuoroja kohdennetaan, THE Tyovuorosuunnittelu_Lisaosa SHALL esittää jokaiselle kellonaikavälille suunnitellun henkilöstökatteen ja lasketun henkilöstötarpeen erotuksen.
6. IF työvuoro on poistettu mutta henkilöstökatteen uudelleenlaskenta epäonnistuu, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL säilyttää työvuoron poistettuna eikä palauta poistoa.

### Requirement 7: KVTES liite 5 -tulkinta (keskimääräinen yleistyöaika)

**User Story:** Työvuorosuunnittelijana haluan että työvuorot noudattavat KVTES liitteen 5 mukaista keskimääräistä yleistyöaikaa, jotta suunnitelma on työehtosopimuksen mukainen.

#### Acceptance Criteria

1. THE Tyovuorosuunnittelu_Lisaosa SHALL laskea työntekijän suunnitellun työajan suunnitteluviikolla työvuorojen kellonaikojen summana.
2. IF työntekijän suunniteltu viikkotyöaika ylittää KVTES liitteen 5 mukaisen keskimääräisen yleistyöajan viikkotuntirajan, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL merkitä kyseisen työntekijän suunnitelmaan ylityksen huomautuksella.
3. THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää jokaisen suunnitellun työntekijän kohdalla suunnitellun viikkotyöajan ja keskimääräisen yleistyöajan viikkotuntirajan.

### Requirement 8: Työvuorosuunnitelman tallennus ja lataus

**User Story:** Työvuorosuunnittelijana haluan että tekemäni suunnitelma tallentuu, jotta voin jatkaa työtä myöhemmin ja muut näkevät saman suunnitelman.

#### Acceptance Criteria

1. WHEN työvuorosuunnittelija tallentaa suunnitelman, THE Tyovuorosuunnittelu_Lisaosa SHALL tallentaa yksikön, viikon ja työvuorot uuteen tietokantatauluun.
2. WHEN työvuorosuunnittelija avaa aiemmin tallennetun yksikön ja viikon, THE Tyovuorosuunnittelu_Lisaosa SHALL ladata aiemmin tallennetut työvuorot näkyviin.
3. THE Tyovuorosuunnittelu_Lisaosa SHALL tallentaa jokaiseen luotuun riviin yksilöivän tunnisteen oletuksella `ext.uuid_generate_v1mc()` sekä aikaleimat `created_at` ja `updated_at` tyyppiä `timestamptz`.
4. WHEN työvuorosuunnitelman riviä päivitetään, THE Tyovuorosuunnittelu_Lisaosa SHALL päivittää rivin `updated_at`-aikaleiman.
5. IF suunnitelman tallennus tietokantaan epäonnistuu yhteysongelman tai eheysrajoitteen vuoksi, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää virheilmoituksen JA estää työvuorosuunnittelijaa jatkamasta työtä, kunnes tallennus onnistuu.

### Requirement 9: PDF-tuloste

**User Story:** Työvuorosuunnittelijana haluan tulostaa suunnitelmasta PDF-luettelon, jotta voin jakaa sen henkilöstölle paperilla.

#### Acceptance Criteria

1. WHEN työvuorosuunnittelija pyytää PDF-tulostetta tallennetusta suunnitelmasta, THE Tyovuorosuunnittelu_Lisaosa SHALL muodostaa PDF-dokumentin eVakan olemassa olevalla `PdfGenerator`-palvelulla.
2. THE PDF_Tuloste SHALL sisältää jokaisen päivän osalta lasten tulo- ja lähtöajat.
3. THE PDF_Tuloste SHALL sisältää jokaisen suunnitellun työvuoron osalta työntekijän nimen sekä työntekijän tulo- ja lähtöajan.
4. IF PDF-tulostetta pyydetään yksikölle ja viikolle, jolle ei ole tallennettua suunnitelmaa, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL palauttaa virheen eikä muodosta tyhjää tulostetta.

*Laajennettu 2026-08-01: työntekijöille jaettavat listat*

5. WHEN työvuorosuunnittelija pyytää yksittäisen työntekijän tulostetta, THE Tyovuorosuunnittelu_Lisaosa SHALL muodostaa PDF:n, jossa on kyseisen työntekijän viikon vuorot päiväriveinä (ma–su, tyhjät päivät viivalla) sekä viikon yhteistuntimäärä.
6. WHEN työvuorosuunnittelija pyytää kaikkien työntekijöiden tulosteita, THE Tyovuorosuunnittelu_Lisaosa SHALL muodostaa yhden PDF:n, jossa jokaisen suunnitelmassa vuoroja saaneen työntekijän lista on omalla sivullaan työntekijöille jaettavaksi.
7. IF yksittäisen työntekijän tulostetta pyydetään työntekijälle, jolla ei ole vuoroja viikon suunnitelmassa, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL palauttaa virheen.

### Requirement 10: Visuaalinen ilme ja Petäjäveden instanssikohtainen sijoittelu

**User Story:** Ylläpitäjänä haluan että lisäosa noudattaa eVakan ilmettä ja että instanssikohtainen koodi on Petäjäveden alla, jotta lisäosa on yhtenäinen ja oikein paketoitu.

#### Acceptance Criteria

1. THE Tyovuorosuunnittelu_Lisaosa SHALL käyttää eVakan olemassa olevia `lib-components`-komponentteja ja teemavärejä suunnittelunäkymän ulkoasussa.
2. THE Tyovuorosuunnittelu_Lisaosa SHALL luoda frontendiin uuden kansion `frontend/src/lib-customizations/petajavesi`, joka noudattaa olemassa olevan instanssikansion (esim. `hameenkyro`) rakennetta.
3. THE Tyovuorosuunnittelu_Lisaosa SHALL sijoittaa lisäosan instanssikohtaisen koodin Petäjäveden instanssin alle frontendissä ja backendissä.
4. THE Tyovuorosuunnittelu_Lisaosa SHALL toteuttaa tietokantamuutokset Flyway-versiomigaationa hakemistoon `service/src/main/resources/db/migration/` käyttäen versiota `V891` (eVakan virallinen tuotantoryhmä käyttää juoksevaa numerointia, joten korkeampi numero välttää tulevat ristiriidat).

### Requirement 11: Testidata kehityskäyttöön

**User Story:** Kehittäjänä haluan että kehitysympäristöön alustetaan 30 testilasta varauksineen, jotta työvuorosuunnittelua voi kehittää ja testata realistisella lapsimäärällä.

#### Acceptance Criteria

1. THE Tyovuorosuunnittelu_Lisaosa SHALL lisätä kehitysympäristön alustusdataan (dev-data) 30 testilapsen henkilötiedot ja voimassa olevat sijoitukset yksikköön ja ryhmiin.
2. THE Tyovuorosuunnittelu_Lisaosa SHALL luoda testilapsille varausajat (Varausaika) vähintään kuluvalle ja seuraavalle kalenteriviikolle siten, että päivämäärät lasketaan suhteessa kuluvaan päivään eivätkä vanhene ajan kuluessa.
3. THE Tyovuorosuunnittelu_Lisaosa SHALL sisällyttää testilapsiin ikäjakauman, jossa on sekä alle 3-vuotiaita että 3 vuotta täyttäneitä lapsia, jotta ikäkertoimien vaikutus henkilöstötarpeeseen on testattavissa.
4. THE Tyovuorosuunnittelu_Lisaosa SHALL asettaa vähintään kahdelle testilapselle voimassa olevan tuen tiedon (`assistance_factor`), jotta tuen kertoimen vaikutus henkilöstötarpeeseen on testattavissa.
5. WHERE kehitysympäristön dev-profiili (`enable_dev_api`) ei ole käytössä, THE Tyovuorosuunnittelu_Lisaosa SHALL jättää testidatan alustamatta.

### Requirement 12: Vuoropohjainen henkilöstön kohdentaminen

**User Story:** Työvuorosuunnittelijana haluan määritellä vuoron (yksi tai useampi viikonpäivä ja kellonajat) ja valita siihen henkilöstöstä yhden tai useamman työntekijän, jotta voin kohdentaa samat henkilöt useille päiville yhdellä kertaa.

#### Acceptance Criteria

1. WHEN työvuorosuunnittelija luo vuoron, THE Tyovuorosuunnittelu_Lisaosa SHALL antaa valita vuorolle yhden tai useamman viikonpäivän monivalinnalla, alkamis- ja päättymiskellonajan sekä yhden tai useamman työntekijän yksikön henkilöstöstä monivalinnalla.
2. WHEN vuoroon on valittu useita päiviä ja/tai työntekijöitä, THE Tyovuorosuunnittelu_Lisaosa SHALL tallentaa jokaiselle päivä–työntekijä-yhdistelmälle oman työvuororivin (olemassa oleva `shift_plan_shift`-malli).
3. WHEN aiemmin tallennettu suunnitelma avataan, THE Tyovuorosuunnittelu_Lisaosa SHALL ryhmitellä samat kellonajat ja saman työntekijäjoukon jakavat päivät yhdeksi vuoroksi, jossa valitut päivät ja työntekijät näkyvät monivalinnoissa.
4. IF vuoroon ei ole valittu yhtään työntekijää tai yhtään päivää, THEN THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää vuoron kohdalla huomautuksen eikä sisällytä vuoroa tallennukseen.
5. THE Tyovuorosuunnittelu_Lisaosa SHALL laskea henkilöstökatteen ja viikkotyöajan vuoroihin valittujen päivien ja työntekijöiden perusteella (Req 6.5, 7).
6. WHEN työvuorosuunnittelija lisää uuden vuoron, THE Tyovuorosuunnittelu_Lisaosa SHALL esitäyttää päivävalinnan arkipäivillä (ma–pe), jotta koko viikon vuoron luonti onnistuu vähin askelin.

### Requirement 13: Työntekijöiden työvuorotoiveet (lisätty 2026-08-01)

**User Story:** Työntekijänä haluan toivoa työvuoroja seuraavalle kolmelle viikolle, ja työvuorosuunnittelijana haluan nähdä toiveet suunnittelunäkymässä ja hyväksyä, hylätä tai muuttaa ne, jotta toiveet voidaan huomioida suunnitelmassa.

#### Acceptance Criteria

1. THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää työntekijälle (yksikkörooli Henkilökunta/STAFF) uuden "Työvuorot"-välilehden, jolla työntekijä voi tehdä työvuorotoiveita.
2. THE Tyovuorosuunnittelu_Lisaosa SHALL sallia toiveet vain seuraavalle kolmelle viikolle (alkaen seuraavasta maanantaista, 21 päivää).
3. WHEN työntekijä luo toiveen, THE Tyovuorosuunnittelu_Lisaosa SHALL tallentaa yksikön, päivän sekä alkamis- ja päättymiskellonajan; työntekijä voi poistaa oman käsittelemättömän toiveensa.
4. THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää työntekijälle toiveen käsittelytilan (odottaa / hyväksytty / hylätty) sekä hyväksynnässä mahdollisesti muutetut kellonajat.
5. WHEN työvuorosuunnittelija avaa viikon suunnittelunäkymän, THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää viikon toiveet, ja SHALL korostaa värein toiveet, joissa useampi työntekijä on toivonut samaa vuoroa (sama päivä ja kellonajat), niin että samaa vuoroa toivoneet erottuvat toisistaan.
6. WHEN työvuorosuunnittelija hyväksyy toiveen, THE Tyovuorosuunnittelu_Lisaosa SHALL lisätä vastaavan työvuoron viikon suunnitelmaan (kellonaikoja voi muuttaa ennen hyväksyntää) ja merkitä toiveen hyväksytyksi; hylkäys merkitsee toiveen hylätyksi lisäämättä vuoroa.
7. THE Tyovuorosuunnittelu_Lisaosa SHALL sijoittaa toteutuksen Petäjäveden instanssin alle (backend `evaka.instance.petajavesi`, frontend-tekstit `lib-customizations/petajavesi`) siltä osin kuin mahdollista; ydinkoodiin kosketaan vain oikeusmäärittelyjen (Action, EmployeeFeatures), Id-tyyppien, Auditin, reitityksen ja headerin osalta.
8. *(lisätty 2026-08-01)* THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää työntekijälle Työvuorot-välilehdellä "Omat työvuorot" -osiossa hänen vahvistetut työvuoronsa tallennetuista suunnitelmista kuluvalta viikolta ja toiveikkunan kolmelta viikolta viikoittain ryhmiteltynä (päivä, kellonajat, yksikkö jos vuoroja on useasta yksiköstä), jotta työntekijä voi tarkistaa vuoronsa ilman paperitulosteita.
9. *(lisätty 2026-08-01)* WHEN työntekijä luo toiveen, THE Tyovuorosuunnittelu_Lisaosa SHALL antaa valita, onko toive normaali vai tärkeä (tähdellä ★ merkitty, esim. tärkeä meno); tärkeitä toiveita SHALL mahtua kolmen viikon toiveikkunaan enintään kaksi työntekijää kohden (hylätty tärkeä toive vapauttaa kiintiön), ja raja SHALL valvotaan sekä käyttöliittymässä että palvelimella.
10. *(lisätty 2026-08-01)* THE Tyovuorosuunnittelu_Lisaosa SHALL näyttää tärkeän toiveen tähtimerkinnän sekä työntekijän omissa toiveissa että työvuorosuunnittelijan toivepaneelissa ("★ Tärkeä" -merkintä ja selite), jotta suunnittelija voi toteuttaa tärkeät toiveet ensisijaisesti.

### Requirement 14: Hyväksyttyjen toiveiden ensisijaisuus vuoroehdotuksessa (lisätty 2026-08-01)

**User Story:** Työvuorosuunnittelijana haluan, että vuoroehdotus rakentuu työntekijöiden hyväksyttyjen toiveiden päälle, jotta toiveet toteutuvat ensisijaisesti ja ehdotus täyttää vain puuttuvat vuorot.

#### Acceptance Criteria

1. WHEN työvuorosuunnittelija painaa "Luo ehdotus varauksista", THE Tyovuorosuunnittelu_Lisaosa SHALL säilyttää viikon hyväksytyt työvuorotoiveet vuororiveinä (hyväksynnässä mahdollisesti muutetuin ajoin) eikä korvata niitä ehdotuksella.
2. WHEN vuoroehdotus lasketaan, THE Tyovuorosuunnittelu_Lisaosa SHALL vähentää henkilöstötarpeesta hyväksyttyjen toivevuorojen kattaman osuuden aikaväleittäin ja ehdottaa uusia vuoroja vain jäljelle jäävään tarpeeseen.
3. WHEN vuoroehdotus on luotu, THE Tyovuorosuunnittelu_Lisaosa SHALL ehdottaa työntekijät ilman työntekijää oleviin vuoroihin (Req 11.6 mukaisella hyväksyntäkierrolla: tallennus on estetty, kunnes suunnittelija hyväksyy tai hylkää ehdotuksen), eikä SHALL ehdota työntekijää päällekkäin hänen hyväksytyn toivevuoronsa kanssa.
4. THE Tyovuorosuunnittelu_Lisaosa SHALL sisällyttää hyväksytyt toivevuorot henkilöstökatteen kaavioihin ja taulukkoon suunniteltuna katteena.
5. WHERE viikolle ei ole tallennettua suunnitelmaa, THE Tyovuorosuunnittelu_Lisaosa SHALL esitäyttää vuororivit samalla logiikalla: hyväksytyt toivevuorot ensin ja ehdotus vain jäljelle jäävään tarpeeseen.
