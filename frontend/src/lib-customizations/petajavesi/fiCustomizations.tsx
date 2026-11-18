// SPDX-FileCopyrightText: 2017-2026 City of Espoo
// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// Petäjäveden suomenkieliset tekstit: siirretty hakemistoista espoo/citizen.tsx (translations.fi)
// ja defaults/citizen/i18n/fi.tsx (paikalliset muutokset tagiin v20260731). Vain poikkeavat avaimet;
// muut periytyvät oletuksista syväyhdistämisellä.

import styled from 'styled-components'

import ExternalLink from 'lib-components/atoms/ExternalLink'
import UnorderedList from 'lib-components/atoms/UnorderedList'
import { FixedSpaceColumn } from 'lib-components/layout/flex-helpers'
import { H1, H2, H3, P } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'
import type { Translations } from 'lib-customizations/citizen'
import type { DeepPartial } from 'lib-customizations/types'

const MultiLineCheckboxLabel = styled(FixedSpaceColumn).attrs({
  $spacing: 'zero'
})`
  margin-top: -6px;
`

const fi: DeepPartial<Translations> = {
  footer: {
    cityLabel: '© Petäjäveden kunta',
    privacyPolicyLink: (
      <a
        href="https://www.petajavesi.fi/asiointi/tietopalvelu/tietosuojaselosteet"
        target="_blank"
        rel="noreferrer"
      >
        Tietosuojaseloste
      </a>
    ),
    sendFeedbackLink: (
      <a
        href="https://www.petajavesi.fi/asiointi/palaute"
        target="_blank"
        rel="noreferrer"
      >
        Anna palautetta
      </a>
    )
  },
  loginPage: {
    title: 'Petäjäveden kunnan varhaiskasvatus',
    applying: {
      title: 'Kuntalaisen kirjautuminen',
      infoBullets: [
        'hakea lapsellesi varhaiskasvatus- tai esiopetuspaikkaa tai tarkastella aiemmin tekemääsi hakemusta',
        'tarkastella lapsesi varhaiskasvatukseen tai esiopetukseen liittyviä kuvia ja muita dokumentteja',
        'ilmoittaa omat tai lapsesi tulotiedot',
        'hyväksyä tai hylätä päätöksen, jos olet hakemuksen tekijä'
      ]
    },
    login: {
      infoBoxText: (
        <>
          <P>
            Mikäli kirjautuminen tästä ei onnistu, katso ohjeet{' '}
            <a
              href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/evaka"
              target="_blank"
              rel="noreferrer"
            >
              eVaka | Petäjäveden kunta
            </a>
            . Voit kirjautua myös käyttämällä vahvaa tunnistautumista.
          </P>
        </>
      )
    }
  },
  applications: {
    editor: {
      heading: {
        info: {
          DAYCARE: (
            <>
              <P>
                Varhaiskasvatuspaikkaa voi hakea ympäri vuoden. Jätä hakemus
                viimeistään neljä kuukautta ennen kuin tarvitset paikan. Mikäli
                tarvitset lapselle varhaiskasvatusta kiireellisesti työn tai
                opiskelujen vuoksi, hae paikkaa viimeistään kaksi viikkoa
                etukäteen.
              </P>
              <P>
                Saat kirjallisen päätöksen varhaiskasvatuspaikasta{' '}
                <a
                  href="https://www.suomi.fi/viestit"
                  target="_blank"
                  rel="noreferrer"
                >
                  Suomi.fi-viestit
                </a>{' '}
                -palveluun tai postitse, mikäli et ole ottanut Suomi.fi
                -palvelua käyttöön.
              </P>
              <P>
                Kunnallisen varhaiskasvatuksen asiakasmaksu ja palvelusetelin
                omavastuuosuus määräytyvät prosenttiosuutena perheen
                bruttotuloista. Tulojen lisäksi maksuihin vaikuttaa perheen koko
                ja sovittu varhaiskasvatusaika.
              </P>
              <P>
                Palvelusetelipäiväkodit voivat periä lisämaksun,{' '}
                <a
                  href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/varhaiskasvatuspalveluihin-hakeminen"
                  target="_blank"
                  rel="noreferrer"
                >
                  tieto mahdollisesta lisämaksusta löytyy täältä
                </a>
                . Perheen tulee toimittaa tuloselvitys bruttotuloistaan
                viimeistään kaksi viikkoa siitä, kun lapsi on aloittanut
                varhaiskasvatuksessa.
              </P>
              <P>
                <a
                  href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/asiakasmaksut"
                  target="_blank"
                  rel="noreferrer"
                >
                  Lisätietoa kunnallisen varhaiskasvatuksen asiakasmaksuista ja
                  tuloselvityksen toimittamisesta löydät täältä.
                </a>
              </P>
              <P>
                <a
                  href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/asiakasmaksut"
                  target="_blank"
                  rel="noreferrer"
                >
                  Lisätietoa palvelusetelivarhaiskasvatuksen maksuista sekä
                  tuloselvityksen tekemisestä löydät täältä.
                </a>
              </P>
              <P $fitted={true}>* Tähdellä merkityt tiedot ovat pakollisia</P>
            </>
          ),
          PRESCHOOL: (
            <>
              <P>
                Esiopetukseen osallistutaan oppivelvollisuuden alkamista
                edeltävänä vuonna. Esiopetus on maksutonta. Lukuvuoden 2026–2027
                esiopetukseen ilmoittaudutaan 1.3.2026 mennessä Esiopetus alkaa
                12.8.2026.
              </P>
              <P>
                Päätökset tulevat{' '}
                <a
                  href="https://www.suomi.fi/viestit"
                  target="_blank"
                  rel="noreferrer"
                >
                  Suomi.fi-viestit
                </a>{' '}
                -palveluun.
              </P>
              <P $fitted>* Tähdellä merkityt tiedot ovat pakollisia</P>
            </>
          )
        },
        title: {
          DAYCARE: 'Varhaiskasvatushakemus'
        }
      },
      serviceNeed: {
        startDate: {
          info: {
            DAYCARE: [
              'Huomaa, että sinun tulee varata noin 1-2 viikkoa aikaa lapsen tutustumiselle ja harjoittelulle varhaiskasvatusyksikössä. Tutustumisjaksolla lapsi tutustuu varhaiskasvatuspaikkaan yhdessä huoltajan kanssa ennen varhaiskasvatuksen varsinaista aloituspäivää. Varhaiskasvatusyksikkö ottaa sinuun yhteyttä tutustumiseen ja aloittamiseen liittyvien asioiden sopimiseksi. Tutustumisajalta ei peritä varhaiskasvatusmaksua.',
              'Valitse hakemukseen aloituspäiväksi päivämäärä, jolloin lapsi jää ensimmäistä kertaa varhaiskasvatukseen tutustumisen jälkeen ilman huoltajaa. Varhaiskasvatuksen maksu alkaa vasta virallisesta huoltajan vahvistamasta aloituspäivästä.',
              <a
                key="link"
                href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus"
                target="_blank"
                rel="noreferrer"
              >
                Lue lisää lapsen aloittamisesta varhaiskasvatuksesta täältä.
              </a>
            ],
            PRESCHOOL: [
              'Esiopetus alkaa 12.8.2026. Jos tarvitset varhaiskasvatusta esiopetuksen lisäksi, hae sitä tällä hakemuksella "Haen myös esiopetukseen liittyvää varhaiskasvatusta".'
            ]
          },
          instructions: {
            DAYCARE: (
              <>
                Voit muuttaa toivottua aloituspäivää myöhemmäksi niin kauan kuin
                hakemusta ei ole otettu käsittelyyn. Jos haluat tämän jälkeen
                muuttaa aloituspäivää, sinun tulee ottaa yhteyttä päiväkodin
                johtajaan (puh. 040 700 1879).
              </>
            ),
            PRESCHOOL: (
              <>
                Voit muuttaa toivottua aloituspäivää myöhemmäksi niin kauan kuin
                hakemusta ei ole otettu käsittelyyn. Jos haluat tämän jälkeen
                muuttaa aloituspäivää, sinun tulee ottaa yhteyttä päiväkodin
                johtajaan (puh. 040 700 1879).
              </>
            )
          }
        },
        urgent: {
          attachmentsMessage: {
            text: (
              <>
                <P $fitted>
                  Jos tarvitset varhaiskasvatuspaikkaa äkillisen työllistymisen
                  tai opiskelun vuoksi, hae paikkaa viimeistään kaksi viikkoa
                  ennen tarpeen alkamista. Liitä hakemukseen työ- tai
                  opiskelutodistus molemmilta samassa taloudessa asuvilta
                  huoltajilta. Suosittelemme toimittamaan liitteet sähköisesti,
                  sillä voimme ottaa hakemuksen käsittelyyn vasta sitten, kun
                  tarvittavat liitteet ovat saapuneet perille.
                </P>
              </>
            )
          }
        },
        partTime: {
          true: 'Osapäiväinen (max 5h/pv ja max 25h/vko)',
          false: 'Kokopäiväinen'
        },
        dailyTime: {
          connectedDaycareInfo: (
            <>
              <P>
                Hae lapselle tarvittaessa esiopetukseen liittyvää maksullista
                varhaiskasvatusta. Liittyvää varhaiskasvatusta järjestetään
                aamuisin ennen esiopetusta ja esiopetuksen jälkeen
                esiopetusyksikön aukioloaikojen mukaisesti. (Esiopetusaika
                yksiköissä on pääsääntöisesti klo 9-13).
              </P>
              <P>
                Jos tarvitset varhaiskasvatusta elokuun alusta ennen
                esiopetuksen alkua, huomioi tämä toivotun aloituspäivämäärän
                valinnassa.
              </P>
              <P>
                Liittyvää varhaiskasvatusta haetaan samasta yksiköstä
                (kunnallinen, palveluseteli) josta haet esiopetusta.
              </P>
              <P>
                Yksityisiin esiopetusyksiköihin haettaessa, liittyvä
                varhaiskasvatus haetaan suoraan yksiköstä (pois lukien
                palveluseteliyksiköt), yksiköt informoivat asiakkaita
                hakutavasta. Jos esiopetushakemuksessa on haettu liityvää
                varhaiskasvatusta yksityisestä yksiköstä, palveluohjaus muuttaa
                hakemuksen vain esiopetushakemukseksi.
              </P>
              <P>
                Saat varhaiskasvatuspaikasta erillisen kirjallisen päätöksen.
                Päätös tulee{' '}
                <a
                  href="https://www.suomi.fi/viestit"
                  target="_blank"
                  rel="noreferrer"
                >
                  Suomi.fi-viestit
                </a>{' '}
                -palveluun.
              </P>
            </>
          ),
          instructions: {
            DAYCARE:
              'Ilmoita lapsen yleisimmin tarvitsema varhaiskasvatusaika. Aika tarkennetaan palvelusopimuksessa varhaiskasvatuksen alkaessa.'
          }
        },
        shiftCare: {
          label: 'Vuorohoito',
          instructions:
            'Vuorohoito on varhaiskasvatusta, jota järjestetään päivällä tapahtuvan varhaiskasvatuksen lisäksi iltaisin, öisin, viikonloppuisin sekä arki- ja juhlapyhinä vuorohoitopäiväkodeissa.',
          attachmentsMessage: {
            DAYCARE: (
              <>
                <P>
                  Vuorohoito on tarkoitettu lapsille, joiden molemmat huoltajat
                  ovat vuorotyössä tai opiskelevat pääsääntöisesti iltaisin tai
                  viikonloppuisin. Oikeus vuorohoitoon päättyy, mikäli lapsi ei
                  enää tarvitse vuorohoitoa huoltajan työssäkäynnin tai
                  opiskelun vuoksi, tällöin huoltajan tulee hakea lapselleen
                  uutta varhaiskasvatuspaikkaa.
                </P>
                <P>
                  Liitä hakemukseen työnantajan todistus säännöllisestä
                  vuorotyöstä tai oppilaitoksen edustajan todistus päätoimisesta
                  ilta- tai viikonloppuopiskelusta. Toimita todistus molemmilta
                  samassa taloudessa asuvilta huoltajilta.
                </P>
              </>
            ),
            PRESCHOOL: (
              <>
                <P>
                  Vuorohoito on tarkoitettu lapsille, joiden molemmat huoltajat
                  ovat vuorotyössä tai opiskelevat pääsääntöisesti iltaisin tai
                  viikonloppuisin. Oikeus vuorohoitoon päättyy, mikäli lapsi ei
                  enää tarvitse vuorohoitoa huoltajan työssäkäynnin tai
                  opiskelun vuoksi.
                </P>
                <P>
                  Vuorohoidossa esiopetusta annetaan klo 8.00–16.00 välillä noin
                  neljä tuntia kerrallaan. Suunnittelemme tarkemman esiopetuksen
                  ajankohdan lapsen läsnäoloaikojen pohjalta. Suunnittelussa
                  huomioidaan, ettei lapsi joudu viettämään päiväkodissa liian
                  pitkää aikaa.
                </P>
                <P>
                  Liitä hakemukseen työnantajan todistus säännöllisestä
                  vuorotyöstä tai oppilaitoksen edustajan todistus päätoimisesta
                  ilta- tai viikonloppuopiskelusta. Toimita todistus molemmilta
                  samassa taloudessa asuvilta huoltajilta.
                </P>
              </>
            )
          },
          attachmentsSubtitle:
            'Lisää tähän molemmilta huoltajilta todistus vuorotyöstä tai todistus opiskelusta iltaisin/viikonloppuisin'
        },
        preparatory:
          'Lapsi tarvitsee tukea suomen kielen oppimisessa ja lapselle on suositeltu valmistavaa esiopetusta nykyisestä päiväkodista. Haen myös perusopetukseen valmistavaan opetukseen. Ei koske ruotsinkielistä esiopetusta.',
        preparatoryInfo: null,
        preparatoryExtraInstructions: (
          <>
            <P>
              Esiopetuksessa toteutettavaan perusopetukseen valmistavaan
              opetukseen voivat hakeutua lapset, joilla ei ole vielä suomen
              kielen taitoa tai jotka osaavat jo jonkin verran suomea.
              Esiopetusikäisten perusopetukseen valmistavaa opetusta
              järjestetään kunnallisissa suomenkielisissä esiopetusryhmissä.
            </P>
            <P>
              Pidennetyn oppivelvollisuuden piirissä olevilla lapsilla ei ole
              oikeutta perusopetukseen valmistavaan opetukseen. Mikäli lapsella
              on tai hänelle myöhemmin myönnetään pidennetyn oppivelvollisuuden
              päätös, lapsen sijoitus muutetaan esiopetussijoitukseksi
            </P>
          </>
        ),
        assistanceNeeded: {
          DAYCARE: 'Lapsella on kehitykseen tai oppimiseen liittyvä tuen tarve',
          PRESCHOOL:
            'Valitse tämä kohta, jos lapsi tarvitsee kehitykselleen, oppimiselleen ja/tai hyvinvoinnille tukea.',
          CLUB: 'Lapsella on kehitykseen tai oppimiseen liittyvä tuen tarve'
        },
        assistanceNeedInstructions: {
          DAYCARE:
            'Valitse tämä kohta, jos lapsesi tarvitsee tukea kehitykseen, oppimiseen tai hyvinvointiin. Tukea annetaan lapsen arjessa osana varhaiskasvatusta. Jos lapsella on oppimisen ja/tai esiopetukseen osallistumisen tuen tarvetta, varhaiskasvatuksen erityisopettaja ottaa hakijaan yhteyttä. Näin voimme huomioida lapsen tarpeet ja osoittaa hänelle sopivan varhaiskasvatuspaikan.',
          PRESCHOOL: null
        },
        assistanceNeedExtraInstructions: {
          PRESCHOOL: (
            <P>
              Tukea annetaan lapsen arjessa osana esiopetusta ja
              varhaiskasvatusta. Valitse tämä kohta myös, jos lapsella on muu
              erityinen syy, jolla on suoranaista vaikutusta esiopetuksen
              järjestämiseen ja siihen, missä yksikössä lapsen esiopetus tulee
              järjestää. Jos lapsella on oppimisen ja/tai esiopetukseen
              osallistumisen tuen tarvetta, varhaiskasvatuksen erityisopettaja
              ottaa hakijaan yhteyttä. Näin voimme huomioida lapsen tarpeet ja
              osoittaa hänelle sopivan esiopetuspaikan.
            </P>
          )
        }
      },
      unitPreference: {
        siblingBasis: {
          title: 'Haku sisarusperusteella',
          info: {
            DAYCARE: (
              <>
                <P $fitted>
                  Lapsella on sisarusperuste varhaiskasvatuspaikkaan, jossa
                  hänen sisaruksensa on silloin, kun lapsen varhaiskasvatus
                  alkaa.
                </P>
                <P>
                  Sisaruksiksi katsotaan kaikki samassa osoitteessa asuvat
                  lapset. Pyrimme sijoittamaan sisarukset samaan
                  varhaiskasvatuspaikkaan, jos perhe niin toivoo. Jos haet
                  paikkaa sisaruksille, jotka eivät vielä ole
                  varhaiskasvatuksessa, kirjoita tieto lisätietokenttään.
                </P>
                <P>
                  Täytä nämä tiedot vain, jos käytät sisarusperustetta. Valitse
                  lisäksi alla olevasta valikosta ensisijaiseksi hakutoiveeksi
                  sama varhaiskasvatusyksikkö, jossa lapsen sisarus on.
                </P>
              </>
            ),
            PRESCHOOL: (
              <>
                <P>Esioppilaalla on sisarusperuste:</P>
                <ol type="a">
                  <li>
                    Oman palvelualueen päiväkotiin, jossa esioppilaalla on
                    sisarus, jolla on päätöksentekohetkellä ja tulevana
                    esiopetusvuonna paikka esiopetuspäiväkodissa.
                  </li>
                </ol>
                <P>
                  Täytä nämä tiedot vain, jos käytät sisarusperustetta. Valitse
                  lisäksi alla olevasta valikosta ensisijaiseksi hakutoiveeksi
                  sama yksikkö, jossa lapsen sisarus on.
                </P>
              </>
            )
          }
        },
        units: {
          info: {
            DAYCARE: (
              <>
                <P $fitted>
                  Voit hakea 1-2 paikkaa toivomassasi järjestyksessä.
                  Hakutoiveet eivät takaa paikkaa toivotussa yksikössä, mutta
                  mahdollisuus toivotun paikan saamiseen kasvaa, kun annat
                  useamman vaihtoehdon.
                </P>
                <P>
                  Näet eri varhaiskasvatusyksiköiden sijainnin valitsemalla
                  ‘Yksiköt kartalla’.
                </P>
              </>
            ),
            PRESCHOOL: (
              <>
                <P>
                  Voit hakea 1-2 eri yksikköön toivomassasi järjestyksessä.
                  Hakutoiveet eivät takaa paikkaa toivotusta yksiköstä, mutta
                  mahdollisuus toivotun paikan saamiseen kasvaa, kun annat
                  useamman vaihtoehdon.
                </P>
                <P>
                  Näet eri varhaiskasvatusyksiköiden sijainnin valitsemalla
                  ‘Yksiköt kartalla’.
                </P>
              </>
            )
          },
          select: {
            label: (maxUnits: number): string =>
              maxUnits === 1 ? 'Hae yksikköä' : 'Hae yksiköitä'
          },
          preferences: {
            info: (maxUnits: number) =>
              maxUnits === 1
                ? 'Valitse yksi varhaiskasvatusyksikkö'
                : `Valitse 1-${maxUnits} varhaiskasvatusyksikköä toivomassasi järjestyksessä. Voit muuttaa järjestystä nuolien avulla.`
          },
          serviceVoucherLink:
            'https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/toimintayksikot'
        }
      },
      contactInfo: {
        info: (
          <P>
            Henkilötiedot tulevat väestötiedoista, eikä niitä voi muuttaa tällä
            hakemuksella. Jos henkilötiedoissa on virheitä, päivitäthän tiedot{' '}
            <a
              href="https://dvv.fi/henkiloasiakkaat"
              target="_blank"
              rel="noreferrer"
            >
              Digi- ja Väestötietoviraston sivuilla
            </a>
            . Jos osoitteesi on muuttumassa, voit lisätä tulevan osoitteen
            erilliseen kohtaan hakemuksella. Lisää tuleva osoite sekä lapselle
            että huoltajalle. Pidämme osoitetietoa virallisena vasta, kun se on
            päivittynyt väestötietojärjestelmään. Toimitamme päätökset
            esiopetus- ja varhaiskasvatuspaikoista automaattisesti myös
            väestötiedoista löytyvälle huoltajalle, joka asuu eri osoitteessa.
          </P>
        ),
        futureAddressInfo:
          'Käytämme virallisena osoitteena väestötiedoista saatavaa osoitetta. Osoitteesi väestötiedoissa muuttuu, kun teet muuttoilmoituksen postiin tai digi- ja väestötietovirastoon.',
        emailInfoText:
          'Sähköpostiosoitteen avulla saat ilmoituksen uusista viesteistä, jotka saapuvat sinulle varhaiskasvatuksen asiointipalvelu eVakaan. Esitäytetty sähköpostiosoite on haettu eVakan asiakastiedoista. Mikäli muokkaat sitä, päivitetään vanha sähköpostiosoite, kun lähetät hakemuksen.',
        secondGuardianNotFound:
          'Väestötietojärjestelmästä saamamme tiedon mukaan lapsella ei ole toista huoltajaa.',
        otherChildrenInfo:
          'Samassa taloudessa asuvat alle 18-vuotiaat lapset vaikuttavat varhaiskasvatuksen asiakasmaksuun.',
        areExtraChildren:
          'Samassa taloudessa asuu muita alle 18-vuotiaita lapsia (esim. aviopuolison / avopuolison lapset)'
      },
      additionalDetails: {
        dietInfo:
          'Osaan erityisruokavalioista tarvitset erikseen lääkärintodistuksen, joka sinun tulee toimittaa varhaiskasvatuspaikkaan. Poikkeuksena ovat vähälaktoosinen tai laktoositon ruokavalio, uskonnollisiin syihin perustuva ruokavalio tai kasvisruokavalio (lakto-ovo).'
      },
      verification: {
        serviceNeed: {
          dailyTime: {
            shiftCare: 'Vuorohoito',
            withShiftCare: 'Tarvitaan vuorohoitoa',
            withoutShiftCare: 'Ei tarvita vuorohoitoa'
          },
          assistanceNeed: {
            assistanceNeed: 'Kehitykseen tai oppimiseen liittyvä tuen tarve'
          }
        }
      },
      actions: {
        allowOtherGuardianAccess: (
          <span>
            Ymmärrän, että tieto hakemuksesta menee myös lapsen toiselle
            huoltajalle. Jos tieto ei saa mennä toiselle huoltajalle, ole
            yhteydessä päiväkodin johtajaan. Palveluohjauksen yhteystiedot
            löydät{' '}
            <a
              href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/varhaiskasvatuspalveluihin-hakeminen"
              target="_blank"
              rel="noreferrer"
            >
              täältä
            </a>
            .
          </span>
        )
      },
      fee: {
        info: {
          DAYCARE: (
            <P>
              Kunnallisen varhaiskasvatuksen asiakasmaksut määräytyvät
              prosenttiosuutena perheen bruttotuloista. Maksut vaihtelevat
              perheen koon ja tulojen sekä varhaiskasvatusajan mukaan
              maksuttomasta varhaiskasvatuksesta enintään 311 euron
              kuukausimaksuun lasta kohden. Perhe toimittaa tuloselvityksen
              bruttotuloistaan tuloselvityslomakkeella, viimeistään kahden
              viikon kuluessa siitä, kun lapsi on aloittanut
              varhaiskasvatuksessa.
            </P>
          )
        },
        links: (
          <P>
            Lisätietoa varhaiskasvatuksen maksuista löydät täältä:
            <br />
            <a
              href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/asiakasmaksut"
              target="_blank"
              rel="noopener noreferrer"
            >
              Maksut varhaiskasvatuksessa
            </a>
          </P>
        )
      }
    },
    creation: {
      daycare4monthWarning: (
        <>
          Uuden hakemuksen käsittelyaika on 4 kuukautta.
          <br />
          <br />
          Siirtohakemuksella ei ole käsittelyaikaa. Päätökset tehdään hakija- ja
          paikkatilanteen salliessa.
        </>
      ),
      daycareLabel: 'Varhaiskasvatushakemus',
      daycareInfo:
        'Varhaiskasvatushakemuksella haetaan kunnallista varhaiskasvatuspaikkaa päiväkotiin.',
      preschoolLabel: 'Ilmoittautuminen esiopetukseen',
      preschoolInfo:
        'Maksutonta esiopetusta on neljä tuntia päivässä. Tämän lisäksi lapselle voidaan hakea maksullista liittyvää varhaiskasvatusta, jota tarjotaan esiopetuspaikoissa aamulla ennen esiopetuksen alkua ja iltapäivisin esiopetuksen jälkeen. Hakemuksen liittyvään varhaiskasvatukseen voi tehdä esiopetukseen ilmoittautumisen yhteydessä tai erillisenä hakemuksena opetuksen jo alettua.',
      preschoolDaycareInfo:
        'Tällä lomakkeella voit myös hakea liittyvää varhaiskasvatusta lapsille, jotka ilmoitetaan / on ilmoitettu esiopetukseen.',
      clubInfo: 'Kerhohakemuskella haetaan kunnallisiin kerhoihin',
      transferApplicationInfo: {
        DAYCARE:
          'Lapsella on jo paikka Petäjäveden varhaiskasvatuksessa. Tällä hakemuksella voit hakea siirtoa toiseen varhaiskasvatusta tarjoavaan yksikköön Petäjävedellä.'
      },
      applicationInfo: (
        <P>
          Hakemukseen voi tehdä muutoksia niin kauan kuin hakemusta ei ole
          otettu käsittelyyn. Tämän jälkeen muutokset hakemukseen tehdään
          ottamalla yhteyttä päiväkodin johtajaan (puh. 040 700 1879). Voit
          perua jo tehdyn hakemuksen ilmoittamalla siitä sähköpostilla
          varhaiskasvatuksen palveluohjaukseen{' '}
          <a href="mailto:varhaiskasvatus@petajavesi.fi">
            varhaiskasvatus@petajavesi.fi
          </a>
          .
        </P>
      )
    }
  },
  income: {
    assure: (
      <MultiLineCheckboxLabel>
        <span>
          Vakuutan antamani tiedot oikeiksi ja olen tutustunut
          asiakasmaksuperusteisiin: *
        </span>
        <a
          href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/asiakasmaksut"
          target="_blank"
          rel="noreferrer"
        >
          Lasten varhaiskasvatuksesta perittävät maksut | Petäjäveden kunta
        </a>
      </MultiLineCheckboxLabel>
    ),
    incomeType: {
      grossIncome: 'Maksun määritteleminen tulojen mukaan'
    },
    grossIncome: {
      title: 'Tulotietojen täyttäminen',
      estimate: 'Arvio palkkatuloistani (ennen veroja)'
    },
    description: (
      <>
        <P>
          Tällä sivulla voit lähettää selvitykset varhaiskasvatusmaksuun
          vaikuttavista omista ja lastesi tuloista. Voit myös tarkastella
          palauttamiasi tuloselvityksiä ja muokata tai poistaa niitä, kunnes
          viranomainen on käsitellyt tiedot. Lomakkeen käsittelyn jälkeen voit
          päivittää tulotietojasi toimittamalla uuden lomakkeen.
        </P>

        <P>
          Kunnallisen varhaiskasvatuksen asiakasmaksut määräytyvät
          prosenttiosuutena perheen bruttotuloista. Maksut vaihtelevat perheen
          koon ja tulojen sekä varhaiskasvatusajan mukaan. Tarkista
          asiakastiedotteen taulukosta (jonka löydät{' '}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/asiakasmaksut"
          >
            täältä
          </a>
          ) tarvitseeko sinun toimittaa tuloselvitystä, vai kuuluuko perheenne
          automaattisesti korkeimman varhaiskasvatusmaksun piiriin.
        </P>
        <P>
          Lisätietoja maksuista:{' '}
          <a href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/asiakasmaksut">
            Maksut varhaiskasvatuksessa
          </a>
        </P>
        <strong>Tärkeää</strong>
        <ul>
          <li>
            Maksu määräytyy kaikkien samassa osoitteessa asuvien aikuisten
            tulojen perusteella. Sinun ja mahdollisen samassa osoitteessa asuvan
            puolisosi on ilmoitettava tulonne erikseen.
          </li>
        </ul>
      </>
    ),
    formDescription: (
      <>
        <P>
          Tuloselvitys liitteineen palautetaan kahden viikon kuluessa
          varhaiskasvatuksen aloittamisesta. Maksu voidaan määrätä
          puutteellisilla tulotiedoilla korkeimpaan maksuun. Puutteellisia
          tulotietoja ei korjata takautuvasti oikaisuvaatimusajan jälkeen.
        </P>
        <P>
          Asiakasmaksu peritään päätöksen mukaisesta varhaiskasvatuksen
          alkamispäivästä lähtien.
        </P>
        <P>
          Asiakkaan on viipymättä ilmoitettava tulojen ja perhekoon muutoksista
          varhaiskasvatuksen laskentasihteerille. Viranomainen on tarvittaessa
          oikeutettu perimään varhaiskasvatusmaksuja myös takautuvasti.
        </P>
        <P>
          <strong>Huomioitavaa:</strong>
        </P>
        <Gap $size="xs" />
        <UnorderedList>
          <li>
            Maksu voidaan tarkistaa kesken toimintavuotta, mikäli perheen
            tilanteessa, tuloissa tai lapsen palveluntarpeessa tapahtuu muutos.
            Maksua voidaan muuttaa myös lainsäädännön muutosten tai
            hyvinvointilautakunnan päätösten mukaisesti.
          </li>
          <li>
            Jos perheen tuloissa tapahtuu olennaisia (+/-10 %) muutoksia, on
            uusi tuloselvitys tehtävä välittömästi.
          </li>
        </UnorderedList>
        <P>
          Katso voimassaolevat tulorajat{' '}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/asiakasmaksut"
          >
            tästä
          </a>
          .
        </P>
        <P>* Tähdellä merkityt tiedot ovat pakollisia</P>
      </>
    )
  },
  decisions: {
    assistanceDecisions: {
      decision: {
        motivationForDecision:
          'Perustelut lapsen tuen tasolle ja tuen järjestelyt loma-aikoina',
        unitMayChange: '',
        appealInstructions: (
          <>
            <H3>Oikaisuvaatimusoikeus</H3>
            <P>
              Oikaisuvaatimuksen saa tehdä se, johon päätös on kohdistettu tai
              jonka oikeuteen, velvollisuuteen tai etuun päätös välittömästi
              vaikuttaa (asianosainen).
            </P>
            <H3>Oikaisuvaatimusaika</H3>
            <P>
              Oikaisuvaatimus on tehtävä 30 päivän kuluessa päätöksen
              tiedoksisaannista.
            </P>
            <H3>Tiedoksisaanti</H3>
            <P>
              Asianosaisen katsotaan saaneen päätöksestä tiedon, jollei muuta
              näytetä, seitsemän päivän kuluttua kirjeen lähettämisestä tai
              saantitodistukseen tai tiedoksiantotodistukseen merkittynä
              päivänä. Käytettäessä tavallista sähköistä tiedoksiantoa
              asianosaisen katsotaan saaneen päätöksestä tiedon, jollei muuta
              näytetä kolmantena päivänä viestin lähettämisestä.
              Tiedoksisaantipäivää ei lueta määräaikaan. Jos määräajan viimeinen
              päivä on pyhäpäivä, itsenäisyyspäivä, vapunpäivä, joulu- tai
              juhannusaatto tai arkilauantai, saa tehtävän toimittaa
              ensimmäisenä arkipäivänä sen jälkeen.
            </P>
            <H3>Oikaisuviranomainen</H3>
            <P>Oikaisu tehdään Länsi- ja Sisä-Suomen aluehallintovirastolle.</P>
            <P>
              Länsi- ja Sisä-Suomen aluehallintovirasto
              <br />
              Käyntiosoite: Vapaudenkatu 58, 40100 Jyväskylä
              <br />
              Virastoaika: ma-pe 8.00–16.15
              <br />
              Postiosoite: PL 5, 13035 AVI
              <br />
              Sähköposti: kirjaamo.lansi@avi.fi
              <br />
              Puhelin: 0295 016 000
            </P>
            <H3>Oikaisuvaatimuksen muoto ja sisältö</H3>
            <P>
              Oikaisuvaatimus on tehtävä kirjallisesti. Myös sähköinen asiakirja
              täyttää vaatimuksen kirjallisesta muodosta.
            </P>
            <P $noMargin>Oikaisuvaatimuksessa on ilmoitettava</P>
            <ul>
              <li>
                Oikaisuvaatimuksen tekijän nimi, kotikunta, postiosoite,
                puhelinnumero ja muut asian hoitamiseksi tarvittavat
                yhteystiedot
              </li>
              <li>päätös, johon haetaan oikaisua</li>
              <li>
                miltä osin päätökseen haetaan oikaisua ja mitä oikaisua siihen
                vaaditaan tehtäväksi
              </li>
              <li>vaatimuksen perusteet</li>
            </ul>
            <P>
              Jos oikaisuvaatimuspäätös voidaan antaa tiedoksi sähköisenä
              viestinä, yhteystietona pyydetään ilmoittamaan myös
              sähköpostiosoite.
            </P>
            <P>
              Jos oikaisuvaatimuksen tekijän puhevaltaa käyttää hänen laillinen
              edustajansa tai asiamiehensä tai jos oikaisuvaatimuksen laatijana
              on joku muu henkilö, oikaisuvaatimuksessa on ilmoitettava myös
              tämän nimi ja kotikunta.
            </P>
            <P $noMargin>Oikaisuvaatimukseen on liitettävä</P>
            <ul>
              <li>
                päätös, johon haetaan oikaisua, alkuperäisenä tai jäljennöksenä
              </li>
              <li>
                todistus siitä, minä päivänä päätös on annettu tiedoksi, tai muu
                selvitys oikaisuvaatimusajan alkamisen ajankohdasta
              </li>
              <li>
                asiakirjat, joihin oikaisuvaatimuksen tekijä vetoaa
                oikaisuvaatimuksensa tueksi, jollei niitä ole jo aikaisemmin
                toimitettu viranomaiselle.
              </li>
            </ul>
            <H3>Oikaisuvaatimuksen toimittaminen</H3>
            <P>
              Oikaisuvaatimuskirjelmä on toimitettava oikaisuvaatimusajan
              kuluessa oikaisuvaatimusviranomaiselle. Oikaisuvaatimuskirjelmän
              tulee olla perillä oikaisuvaatimusajan viimeisenä päivänä ennen
              viraston aukiolon päättymistä. Oikaisuvaatimuksen lähettäminen
              postitse tai sähköisesti tapahtuu lähettäjän omalla vastuulla.
            </P>
          </>
        )
      }
    },
    applicationDecisions: {
      warnings: {
        doubleRejectWarning: {
          text: 'Olet hylkäämässä tarjotun esiopetus paikan. Liittyvän varhaiskasvatuksen paikka merkitään samalla hylätyksi.'
        }
      }
    },
    assistancePreschoolDecisions: {
      appealInstructions: (
        <>
          <P>
            Tähän päätökseen tyytymätön voi tehdä kirjallisen
            oikaisuvaatimuksen. Päätökseen ei saa hakea muutosta valittamalla
            tuomioistuimeen.
          </P>

          <H3>Oikaisuvaatimusoikeus</H3>
          <P>
            Oikaisuvaatimuksen saa tehdä se, johon päätös on kohdistettu tai
            jonka oikeuteen, velvollisuuteen tai etuun päätös välittömästi
            vaikuttaa (asianosainen).
          </P>

          <H3>Oikaisuvaatimusaika</H3>
          <P>
            Oikaisuvaatimus on tehtävä 14 päivän kuluessa päätöksen
            tiedoksisaannista.
          </P>
          <P>
            Oikaisuvaatimus on toimitettava Länsi- ja Sisä-Suomen
            aluehallintovirastolle viimeistään määräajan viimeisenä päivänä
            ennen Länsi- ja Sisä-Suomen aluehallintoviraston aukioloajan
            päättymistä.
          </P>
          <P>
            Asianosaisen katsotaan saaneen päätöksestä tiedon, jollei muuta
            näytetä, seitsemän päivän kuluttua kirjeen lähettämisestä tai
            saantitodistukseen tai tiedoksiantotodistukseen merkittynä päivänä.
          </P>
          <P>
            Käytettäessä tavallista sähköistä tiedoksiantoa asianosaisen
            katsotaan saaneen päätöksestä tiedon, jollei muuta näytetä,
            kolmantena päivänä viestin lähettämisestä.
          </P>
          <P>
            Tiedoksisaantipäivää ei lueta oikaisuvaatimusaikaan. Jos
            oikaisuvaatimusajan viimeinen päivä on pyhäpäivä, itsenäisyyspäivä,
            vapunpäivä, joulu- tai juhannusaatto tai arkilauantai, saa
            oikaisuvaatimuksen tehdä ensimmäisenä arkipäivänä sen jälkeen.
          </P>

          <H3>Oikaisuviranomainen</H3>
          <P>
            Viranomainen, jolle oikaisuvaatimus tehdään, on Länsi- ja
            Sisä-Suomen aluehallintovirasto
          </P>
          <P>
            Postiosoite: PL 5, 13035 AVI
            <br />
            Jyväskylä toimipaikan käyntiosoite: Vapaudenkatu 58, 40100 Jyväskylä
            <br />
            Sähköpostiosoite: kirjaamo.lansi@avi.fi
            <br />
            Puhelinvaihde: 0295 016 000
            <br />
            Virastoaika: ma-pe 8.00–16.15
          </P>
          <H3>Oikaisuvaatimuksen muoto ja sisältö</H3>
          <P>
            Oikaisuvaatimus on tehtävä kirjallisesti. Myös sähköinen asiakirja
            täyttää vaatimuksen kirjallisesta muodosta.
          </P>
          <P $noMargin>Oikaisuvaatimuksessa on ilmoitettava</P>
          <ul>
            <li>päätös, johon vaaditaan oikaisua,</li>
            <li>millaista oikaisua päätökseen vaaditaan,</li>
            <li>millä perusteilla oikaisua vaaditaan</li>
          </ul>
          <P>
            Oikaisuvaatimuksessa on lisäksi ilmoitettava tekijän nimi,
            kotikunta, postiosoite, puhelinnumero ja muut asian hoitamiseksi
            tarvittavat yhteystiedot.
          </P>
          <P>
            Jos oikaisuvaatimuspäätös voidaan antaa tiedoksi sähköisenä
            viestinä, yhteystietona pyydetään ilmoittamaan myös
            sähköpostiosoite.
          </P>
          <P>
            Jos oikaisuvaatimuksen tekijän puhevaltaa käyttää hänen laillinen
            edustajansa tai asiamiehensä tai jos oikaisuvaatimuksen laatijana on
            joku muu henkilö, oikaisuvaatimuksessa on ilmoitettava myös tämän
            nimi ja kotikunta.
          </P>
          <P $noMargin>Oikaisuvaatimukseen on liitettävä</P>
          <ul>
            <li>
              päätös, johon haetaan oikaisua, alkuperäisenä tai jäljennöksenä
            </li>
            <li>
              todistus siitä, minä päivänä päätös on annettu tiedoksi, tai muu
              selvitys oikaisuvaatimusajan alkamisen ajankohdasta
            </li>
            <li>
              asiakirjat, joihin oikaisuvaatimuksen tekijä vetoaa
              oikaisuvaatimuksensa tueksi, jollei niitä ole jo aikaisemmin
              toimitettu viranomaiselle.
            </li>
          </ul>
        </>
      )
    }
  },
  map: {
    mainInfo:
      'Tässä näkymässä voit hakea kartalta Petäjäveden varhaiskasvatus- ja esiopetuspaikkoja.',
    privateUnitInfo: (
      <span>
        Tietoa päiväkodeista löydät{' '}
        <ExternalLink
          text="täältä."
          href="https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/varhaiskasvatuspalveluihin-hakeminen"
          newTab
        />
      </span>
    ),
    serviceVoucherLink:
      'https://www.petajavesi.fi/lapset-ja-nuoret/varhaiskasvatus/varhaiskasvatuspalveluihin-hakeminen'
  },
  applicationsList: {
    summary: (
      <P $width="800px">
        Lapsen huoltaja voi tehdä lapselle hakemuksen varhaiskasvatukseen tai
        ilmoittaa lapsen esiopetukseen. Huoltajan lasten tiedot haetaan tähän
        näkymään automaattisesti Väestötietojärjestelmästä.
      </P>
    )
  },
  accessibilityStatement: (
    <>
      <H1>Saavutettavuusseloste</H1>
      <P>
        Tämä saavutettavuusseloste koskee Petäjäveden kunnan varhaiskasvatuksen
        eVaka-verkkopalvelua osoitteessa{' '}
        <a href="https://www.petajavesi.fi/">petäjävesi.fi</a>. Petäjäveden
        kunta pyrkii takaamaan verkkopalvelun saavutettavuuden, parantamaan
        käyttäjäkokemusta jatkuvasti ja soveltamaan asianmukaisia
        saavutettavuusstandardeja.
      </P>
      <H2>Palvelun vaatimustenmukaisuus</H2>
      <P>
        Verkkopalvelu täyttää lain asettamat kriittiset
        saavutettavuusvaatimukset WCAG v2.1 -tason AA mukaisesti. Palvelu ei ole
        vielä kaikilta osin vaatimusten mukainen.
      </P>
      <H2>Toimet saavutettavuuden tukemiseksi</H2>
      <P>
        Verkkopalvelun saavutettavuus varmistetaan muun muassa seuraavilla
        toimenpiteillä:
      </P>
      <ul>
        <li>
          Saavutettavuus huomioidaan alusta lähtien suunnitteluvaiheessa, mm.
          valitsemalla palvelun värit ja kirjaisinten koot saavutettavasti.
        </li>
        <li>
          Palvelun elementit on määritelty semantiikaltaan johdonmukaisesti.
        </li>
        <li>Palvelua testataan jatkuvasti ruudunlukijalla.</li>
        <li>
          Erilaiset käyttäjät testaavat palvelua ja antavat saavutettavuudesta
          palautetta.
        </li>
        <li>
          Sivuston saavutettavuudesta huolehditaan jatkuvalla valvonnalla
          tekniikan tai sisällön muuttuessa.
        </li>
      </ul>
      <P>
        Tätä selostetta päivitetään sivuston muutosten ja saavutettavuuden
        tarkistusten yhteydessä.
      </P>
      <H2>Tunnetut saavutettavuusongelmat</H2>
      <P>
        Käyttäjät saattavat edelleen kohdata sivustolla joitakin ongelmia.
        Seuraavassa on kuvaus tunnetuista saavutettavuusongelmista. Jos huomaat
        sivustolla ongelman, joka ei ole luettelossa, otathan meihin yhteyttä.
      </P>
      <ul>
        <li>
          Palvelun päivämäärävalitsinta ja monivalintojen alasvetovalikkoa ei
          ole optimoitu käytettäväksi ruudunlukijalla.
        </li>
        <li>
          Palvelun yksikkökartassa ei pysty liikkumaan
          näppäimistöllä/ruudunlukijalla, mutta yksikköjä voi selata samassa
          näkymässä olevalta listalta. Palvelussa käytetty kartta on kolmannen
          osapuolen tuottama.
        </li>
      </ul>
      <H2>Kolmannet osapuolet</H2>
      <P>
        Verkkopalvelussa käytetään seuraavia kolmannen osapuolen palveluita,
        joiden saavutettavuudesta emme voi vastata.
      </P>
      <ul>
        <li>Suomi.fi-tunnistautuminen</li>
        <li>Leaflet-karttapalvelu</li>
      </ul>
      <H2>Vaihtoehtoiset asiointitavat</H2>
      <P>
        <ExternalLink
          href="https://www.petajavesi.fi/asiointi/yhteispalvelupiste"
          text="Petäjäveden kunnan asiointipisteistä"
        />{' '}
        saa apua sähköiseen asiointiin. Asiointipisteiden palveluneuvojat
        auttavat käyttäjiä, joille digipalvelut eivät ole saavutettavissa.
      </P>
      <H2>Anna palautetta</H2>
      <P>
        Jos huomaat saavutettavuuspuutteen verkkopalvelussamme, kerro siitä
        meille. Voit antaa palautetta{' '}
        <ExternalLink
          href="https://www.petajavesi.fi/suojattu-viestipalvelu"
          text="verkkolomakkeella"
        />{' '}
        tai sähköpostitse{' '}
        <a href="mailto:varhaiskasvatus@petajavesi.fi">
          varhaiskasvatus@petajavesi.fi
        </a>
        .
      </P>
      <H2>Valvontaviranomainen</H2>
      <P>
        Jos huomaat sivustolla saavutettavuusongelmia, anna ensin palautetta
        meille sivuston ylläpitäjille. Vastauksessa voi mennä 14 päivää. Jos et
        ole tyytyväinen saamaasi vastaukseen, tai et saa vastausta lainkaan
        kahden viikon aikana, voit antaa palautteen Etelä-Suomen
        aluehallintovirastoon. Etelä-Suomen aluehallintoviraston sivulla
        kerrotaan tarkasti, miten valituksen voi tehdä, ja miten asia
        käsitellään.
      </P>

      <P>
        <strong>Valvontaviranomaisen yhteystiedot </strong>
        <br />
        Länsi- ja Sisä-Suomen aluehallintovirasto <br />
        Saavutettavuuden valvonnan yksikkö
        <br />
        <ExternalLink
          href="https://www.saavutettavuusvaatimukset.fi"
          text="www.saavutettavuusvaatimukset.fi"
        />
        <br />
        <a href="mailto:saavutettavuus@avi.fi">saavutettavuus@avi.fi</a>
        <br />
        puhelinnumero vaihde 0295 016 000
        <br />
        Avoinna: ma-pe klo 8.00–16.15
      </P>
    </>
  )
}

export default fi
