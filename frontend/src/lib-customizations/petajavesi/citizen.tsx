// SPDX-FileCopyrightText: 2017-2026 City of Espoo
// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// Rakenne muiden kuntien customizationien mukainen (vrt. vesilahti/citizen.tsx). Ruotsinkielinen sisältö on
// kopioitu sellaisenaan espoo/citizen.tsx-tiedostosta; se sisältää Espoon yhteystietoja,
// ks. README-petajavesi.md 'Tiedossa oleva Espoo-jäänne käyttöliittymässä'.

import styled from 'styled-components'

import { FixedSpaceColumn } from 'lib-components/layout/flex-helpers'
import { P } from 'lib-components/typography'
import type { CitizenCustomizations } from 'lib-customizations/types'

import PetajavesiLogo from './PetajavesiLogo.svg'
import enCustomizations from './enCustomizations'
import featureFlags from './featureFlags'
import fiCustomizations from './fiCustomizations'
import mapConfig from './mapConfig'

const MultiLineCheckboxLabel = styled(FixedSpaceColumn).attrs({
  $spacing: 'zero'
})`
  margin-top: -6px;
`

const customizations: CitizenCustomizations = {
  appConfig: {},
  langs: ['fi', 'sv', 'en'],
  translations: {
    fi: fiCustomizations,
    sv: {
      applications: {
        editor: {
          heading: {
            info: {
              DAYCARE: (
                <>
                  <P>
                    Plats inom småbarnspedagogiken kan ansökas året om. Lämna in
                    ansökan senast fyra månader före barnet behöver en plats. Om
                    barnet behöver en plats i brådskande ordning på grund av
                    arbete eller studier, ska du ansöka om plats senast två
                    veckor i förväg.
                  </P>
                  <P>
                    Du får ett skriftligt beslut om plats inom
                    småbarnspedagogiken till tjänsten{' '}
                    <a
                      href="https://www.suomi.fi/meddelanden"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Suomi.fi-meddelanden
                    </a>{' '}
                    eller per post, om du inte använder Suomi.fi-tjänsten.
                  </P>
                  <P>
                    Klientavgiften för kommunal småbarnspedagogik och
                    servicesedelns självriskandel beräknas som en procentuell
                    andel av familjens bruttoinkomster. Utöver inkomsterna
                    påverkas avgiften också av familjens storlek och den
                    överenskomna tiden i småbarnspedagogik.
                  </P>
                  <P>
                    Servicesedel daghem kan ta ut en extra avgift.{' '}
                    <a
                      href="https://www.espoo.fi/sv/fostran-och-utbildning/smabarnspedagogik/ansokan-till-privat-smabarnspedagogik"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Uppgift om en eventuell extra avgift finns här.
                    </a>{' '}
                    Familjen ska lämna in en inkomstutredning senast två veckor
                    efter att barnet har börjat i småbarnspedagogiken.
                  </P>
                  <P>
                    <a
                      href="https://www.espoo.fi/sv/fostran-och-utbildning/smabarnspedagogik/klientavgifterna-smabarnspedagogik"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Här hittar du mer information om klientavgifterna inom den
                      kommunala småbarnspedagogiken och småbarnspedagogiken som
                      köpt tjänst och om inlämnande av inkomstutredning.
                    </a>
                  </P>
                  <P>
                    <a
                      href="https://www.espoo.fi/sv/fostran-och-utbildning/smabarnspedagogik/avgifter-i-servicesedeldaghem"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Här hittar du mer information om klientavgifterna för
                      småbarnspedagogik vid servicesedeldaghem och om
                      upprättande av inkomstutredningen.
                    </a>
                  </P>
                  <P $fitted={true}>
                    * Informationen markerad med en stjärna är obligatorisk
                  </P>
                </>
              ),
              PRESCHOOL: (
                <>
                  <P>
                    Barn deltar i förskoleundervisning året innan läroplikten
                    inleds. Förskoleundervisningen är kostnadsfri. Anmälan till
                    förskoleundervisning under läsåret 2026–2027 pågår 8–20
                    januari 2026. Den finsk- och den svenskspråkiga
                    förskoleundervisningen börjar den 13 augusti 2026.
                  </P>
                  <P>
                    Du får ett skriftligt beslut om plats inom
                    småbarnspedagogiken till tjänsten{' '}
                    <a
                      href="https://www.suomi.fi/meddelanden"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Suomi.fi-meddelanden
                    </a>{' '}
                    .
                  </P>
                  <P $fitted={true}>
                    * Informationen markerad med en stjärna är obligatorisk
                  </P>
                </>
              )
            }
          },
          serviceNeed: {
            startDate: {
              header: {
                DAYCARE: 'Inledande av småbarnspedagogik'
              },
              info: {
                DAYCARE: [
                  'Observera att du ska reservera ungefär 1–2 veckor för barnets invänjning och träning vid enheten för småbarnspedagogik. Under tillvänjningen lär barnet känna enheten för småbarnspedagogik tillsammans med vårdnadshavaren före den egentliga första dagen i småbarnspedagogik. Enheten för småbarnspedagogik kontaktar dig för att komma överens om invänjningen och annat som rör starten i småbarnspedagogiken. För invänjningstiden tas ingen avgift för småbarnspedagogik ut.',
                  'Ange som startdatum i ansökan det datum då barnet för första gången stannar kvar i småbarnspedagogiken utan sin vårdnadshavare efter invänjningen.  Avgiften för småbarnspedagogik räknas först från det officiella startdatumet som vårdnadshavaren har bekräftat.',
                  <a
                    key="link"
                    href="https://www.espoo.fi/sv/fostran-och-utbildning/smabarnspedagogik/mottagande-av-plats-och-inledande-av-smabarnspedagogik"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Läs mer om barnets start i småbarnspedagogiken här
                  </a>
                ],
                PRESCHOOL: [
                  'Den finsk- och den svenskspråkiga förskoleundervisningen börjar den 13 augusti 2026. Om du behöver småbarnspedagogik i början av augusti före förskoleundervisningen börjar, ska du ansöka om det med denna ansökan genom att kryssa för ”Jag ansöker också om småbarnspedagogik i samband med förskolan”.'
                ]
              },
              label: {
                PRESCHOOL: 'Önskat startdatum'
              },
              instructions: {
                DAYCARE: (
                  <>
                    Du kan senarelägga det önskade startdatumet så länge
                    behandlingen av ansökan ännu inte har börjat. Om du vill
                    ändra startdatumet efter detta ska du kontakta
                    småbarnspedagogikens servicehandledning (tfn 09 816 27600).
                  </>
                ),
                PRESCHOOL: (
                  <>
                    Du kan senarelägga det önskade startdatumet så länge
                    behandlingen av ansökan ännu inte har börjat. Om du vill
                    ändra startdatumet efter detta ska du kontakta
                    småbarnspedagogikens servicehandledning (tfn 09 816 27600).
                  </>
                )
              }
            },
            urgent: {
              attachmentsMessage: {
                text: (
                  <>
                    <P $fitted>
                      Om du behöver en plats inom småbarnspedagogiken för att du
                      hittat ett jobb eller fått en studieplats med kort varsel,
                      ska du ansöka om platsen senast två veckor innan den
                      behövs. Bifoga i ansökan ett arbets- eller studieintyg för
                      båda föräldrarna som bor i samma hushåll. Vi rekommenderar
                      att man skickar in bilagorna elektroniskt, eftersom vi kan
                      börja behandla ansökan först när de nödvändiga bilagorna
                      har kommit fram.
                    </P>
                    <P>
                      Om du inte kan lägga till bilagorna till ansökan
                      elektroniskt, posta de till Småbarnspedagogikens
                      servicehandledning, PB 32, 02070 Esbo stad.
                    </P>
                  </>
                ),
                subtitle:
                  'Bifoga här ett arbets- eller studieintyg för båda föräldrarna.'
              }
            },
            partTime: {
              true: 'Deltid (högst 5 h/dag och högst 25 h/vecka)',
              false: 'Heldag'
            },
            dailyTime: {
              connectedDaycareInfo: (
                <>
                  <P>
                    Om det behövs, ska du ansöka om avgiftsbelagd
                    småbarnspedagogik i samband med förskolan för barnet. Denna
                    småbarnspedagogik ordnas på morgonen före förskolan och
                    efter förskolan enligt öppettiderna för enheten för
                    förskoleundervisning. (Tiden för förskoleundervisning vid
                    enheterna är i regel kl. 9–13). Om du behöver
                    småbarnspedagogik i början av augusti innan förskolan
                    börjar, beakta detta när du väljer önskat startdatum.
                  </P>
                  <P>
                    Småbarnspedagogik i samband med förskolan ansöks vid samma
                    enhet där du ansöker om förskoleundervisning.
                  </P>
                  <P>
                    När du söker till privata enheter för förskoleundervisning
                    ansöker du om småbarnspedagogik i samband med förskolan
                    direkt hos enheten (exklusive servicesedelenheter).
                    Enheterna informerar kunderna om ansökningssättet. Om det i
                    ansökan om förskoleplats har ansökts om småbarnspedagogik i
                    en privat enhet, ändrar servicehanledningen ansökan till
                    bara ansökan om förskoleplats.
                  </P>
                  <P>
                    Du får ett separat skriftligt beslut om platsen inom
                    småbarnspedagogiken. Beslutet kommer till tjänsten
                    Suomi.fi-meddelanden eller per post om du inte har tagit
                    tjänsten Suomi.fi-meddelanden i bruk.
                  </P>
                </>
              ),
              instructions: {
                DAYCARE:
                  'Ange vilka tider barnet oftast behöver småbarnspedagogik. Tiden preciseras i serviceavtalet när småbarnspedagogiken börjar.'
              }
            },
            shiftCare: {
              label: 'Skiftvård',
              instructions:
                'Skiftvård är småbarnspedagogik som ordnas utöver småbarnspedagogiken på dagtid på kvällar, nätter och veckoslut samt på söckenhelger och helgdagar i skiftdaghem.',
              attachmentsMessage: {
                DAYCARE: (
                  <>
                    <P $fitted>
                      Skiftvården är avsedd för barn vars båda föräldrar arbetar
                      skift eller studerar på kvällstid eller under veckoslut
                      som sin huvudsyssla. Rätten till skiftvård upphör om
                      barnet inte längre behöver skiftvård på grund av
                      vårdnadshavarens arbete eller studier. Då ska
                      vårdnadshavaren ansöka om en ny plats inom
                      småbarnspedagogik för barnet.{' '}
                    </P>
                    <P>
                      Bifoga till ansökan arbetsgivarens intyg om regelbundet
                      skiftarbete eller ett intyg från läroanstalten om studier
                      på kvällstid eller under veckoslut, som är en huvudsyssla.
                      Lämna in ett intyg för båda vårdnadshavarna som bor i
                      samma hushåll.{' '}
                    </P>
                    <P>
                      Om du inte kan lägga till bilagorna till ansökan
                      elektroniskt, posta de till Småbarnspedagogikens
                      servicehandledning, PB 32, 02070 Esbo stad.
                    </P>
                  </>
                ),
                PRESCHOOL: (
                  <>
                    <P>
                      Skiftvården är avsedd för barn vars båda föräldrar arbetar
                      skift eller studerar på kvällstid eller under veckoslut
                      som sin huvudsyssla. Rätten till skiftvård upphör om
                      barnet inte längre behöver skiftvård på grund av
                      vårdnadshavarens arbete eller studier.
                    </P>
                    <P>
                      I skiftvård ges förskoleundervisning ungefär fyra timmar i
                      taget mellan kl. 8.00 och 16.00. Vi planerar den närmare
                      tidpunkten för förskoleundervisningen utifrån barnets
                      tider i daghemmet. I planeringen tar man hänsyn till att
                      barnet inte behöver tillbringa alltför långa tider i
                      daghemmet.
                    </P>
                    <P>
                      Bifoga till ansökan arbetsgivarens intyg om regelbundet
                      skiftarbete eller ett intyg från läroanstalten om studier
                      på kvällstid eller under veckoslut, som är en huvudsyssla.
                      Lämna in ett intyg för båda vårdnadshavarna som bor i
                      samma hushåll.
                    </P>
                    <P>
                      Om du inte kan lägga till bilagorna till ansökan
                      elektroniskt, posta de till Småbarnspedagogikens
                      servicehandledning, PB 32, 02070 Esbo stad.
                    </P>
                  </>
                )
              },
              attachmentsSubtitle:
                'Bifoga intyg för båda vårdnadshavarna om skiftarbete eller studier på kvällstid eller under veckoslut'
            },
            assistanceNeed: 'Stödbehov',
            assistanceNeeded: {
              DAYCARE: 'Barnet behöver stöd för utvecklingen eller lärandet',
              PRESCHOOL:
                'Välj detta alternativ om barnet behöver stöd för sin utveckling, sitt lärande och/eller sitt välbefinnande under',
              CLUB: 'Barnet behöver stöd för utvecklingen eller lärandet'
            },
            assistanceNeedInstructions: {
              DAYCARE:
                'Kryssa för denna punkt om ditt barn behöver stöd för sin utveckling, sitt lärande eller sitt välbefinnande. Stöd ges i barnets vardag som en del av småbarnspedagogiken. Om barnet har stödbehov, kontaktar specialläraren inom småbarnspedagogiken den sökande. På så sätt kan vi ta hänsyn till barnets behov och anvisa barnet en lämplig plats inom småbarnspedagogiken.',
              PRESCHOOL: null
            },
            assistanceNeedExtraInstructions: {
              PRESCHOOL: (
                <P>
                  Kryssa för denna punkt om barnet behöver stöd för sin uppväxt
                  och/eller sitt lärande under förskoleåret. Stöd ges i barnets
                  vardag som en del av förskoleundervisningen och
                  småbarnspedagogiken. Kryssa för denna punkt också om det finns
                  någon annan särskild anledning som direkt påverkar ordnandet
                  av förskoleundervisningen och vid vilken enhet
                  förskoleundervisningen bör ordnas för barnet. Om barnet har
                  behov av stöd för lärande och/eller deltagande i
                  förskoleundervisningen, kommer specialläraren inom
                  småbarnspedagogik att. På så sätt kan vi ta hänsyn till
                  barnets behov och anvisa barnet en lämplig plats inom
                  förskoleundervisningen.
                </P>
              )
            },
            preparatory:
              'Barnet behöver stöd med att lära sig finska och ja barnets nuvarande daghem har rekommenderat att barnet deltar i undervisning som förbereder för grundläggande utbildning. Jag ansöker också till undervisning som förbereder för grundläggande utbildning. Gäller inte svenskspråkig förskoleundervisning.',
            preparatoryInfo: null,
            preparatoryExtraInstructions: (
              <>
                <P>
                  Plats inom undervisning som förbereder för grundläggande
                  utbildning och som genomförs inom förskoleundervisningen kan
                  sökas för barn som ännu inte kan finska eller som kan lite
                  finska. Undervisning som förbereder för grundläggande
                  utbildning för barn i förskoleåldern ordnas i kommunala,
                  finskspråkiga förskolegrupper.
                </P>
                <P>
                  Barn med förlängd läroplikt har inte rätt att delta i
                  undervisning som förbereder för grundläggande utbildning. Om
                  barnet har ett beslut om förlängd läroplikt eller får ett
                  sådant beslut senare ändras barnets placering till en
                  placering inom förskoleundervisning.
                </P>
              </>
            )
          },
          unitPreference: {
            title: 'Önskemål i ansökan',
            siblingBasis: {
              title: 'Ansökan med syskongrund',
              info: {
                DAYCARE: (
                  <>
                    <P $fitted>
                      Barnet har en syskongrund till den enhet för
                      småbarnspedagogik där barnets syskon går vid den tidpunkt
                      då barnet ska börja i småbarnspedagogiken.
                    </P>
                    <P>
                      Som syskon räknas alla barn som bor på samma adress. Vi
                      strävar efter att placera syskon vid samma enhet för
                      småbarnspedagogik, om detta är familjens önskemål. Om du
                      ansöker om en plats för syskon som ännu inte deltar i
                      småbarnspedagogik, ange detta i fältet för
                      tilläggsinformation.
                    </P>
                    <P>
                      Fyll i dessa uppgifter endast om syskongrunden ska
                      användas. Välj också i menyn endan den enhet för
                      småbarnspedagogik där barnets syskon har en plats som
                      primärt önskemål.
                    </P>
                  </>
                ),
                PRESCHOOL: (
                  <>
                    <P>Förskoleeleven ansöker med syskongrund:</P>
                    <ol type="a">
                      <li>
                        Till ett daghem i det egna serviceområdet som ger
                        förskoleundervisning, där ett syskon till förskoleeleven
                        har en plats vid tidpunkten för beslutet och under det
                        kommande förskoleåret.
                      </li>
                      <li>
                        Till en närskola som anvisats av kommunen, där ett
                        syskon till förskoleeleven kommer att gå under det
                        kommande läsåret.
                      </li>
                    </ol>
                    <P>
                      Välj om syskongrunden ska användas enligt punkt a eller b,
                      om båda syskongrunderna existerar. Fyll i dessa uppgifter
                      endast om syskongrunden ska användas. Utöver detta, välj i
                      menyn endan den enhet där barnets syskon har en plats som
                      primärt önskemål.
                    </P>
                  </>
                )
              },
              checkbox: {
                PRESCHOOL:
                  'Jag ansöker i första hand till samma enhet där barnets syskon har en plats.'
              }
            },
            units: {
              info: {
                DAYCARE: (
                  <>
                    <P $fitted>
                      Du kan ansöka till 1–3 enheter i önskad ordning.
                      Önskemålen i ansökan garanterar inte en plats vid den
                      önskade enheten, men chansen att få den önskade platsen är
                      desto större ju fler alternativ du anger.
                    </P>
                    <P>
                      Ansök om servicesedel genom att ange den önskade
                      servicesedelsenheten som önskemål i ansökan. Kontrollera
                      före ansökan vilken enhet ger småbarnspedagogik på
                      svenska.När du ansöker om en plats vid en
                      servicesedelsenhet får också ledaren för enheten besked om
                      din ansökan
                    </P>
                    <P>
                      Du ser läget för samtliga enheter för småbarnspedagogik
                      genom att klicka på ‘Enheterna på kartan’.
                    </P>
                  </>
                ),
                PRESCHOOL: (
                  <>
                    <P>
                      Du kan söka till 1–3 olika enheter i valfri ordning.
                      Önskemålen i ansökan garanterar inte en plats vid den
                      önskade enheten, men chansen att få den önskade platsen är
                      desto större ju fler alternativ du anger.
                    </P>
                    <P>
                      Ansök om servicesedel genom att ange den önskade
                      servicesedelsenheten som önskemål i ansökan. När du
                      ansöker om en plats vid en servicesedelsenhet får också
                      ledaren för enheten besked om din ansökan. Svenskspråkig
                      förskola ordnas inte i servicesedelenheter.
                    </P>
                  </>
                )
              },
              mapLink: 'Enheterna på kartan',
              select: {
                label: (_maxUnits: number) => 'Sök enheter'
              },
              preferences: {
                info: (maxUnits: number) =>
                  maxUnits === 1
                    ? 'Välj en enhet'
                    : `Välj 1–${maxUnits} enheter för småbarnspedagogik i valfri ordning. Du kan ändra ordningen med pilarna.`
              }
            }
          },
          contactInfo: {
            info: (
              <P>
                Personuppgifterna hämtas från befolkningsdatassystemet och kan
                inte ändras i ansökan. Om personuppgifterna innehåller fel, ska
                du uppdatera uppgifterna på{' '}
                <a
                  href="https://dvv.fi/sv/privatpersoner"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Myndigheten för digitalisering och befolkningsdatas
                </a>{' '}
                webbplats. Om din adress kommer att ändras inom kort, kan du
                lägga till din kommande adress i ett separat fält i ansökan.
                Lägg till den kommande adressen både för barnet och för
                vårdnadshavaren. I vårt system är en adressuppgift officiell
                först när den har uppdaterats i befolkningsdatasystemet. Vi
                skickar besluten om platser inom förskoleundervisningen och
                småbarnspedagogiken automatiskt också till den vårdnadshavare
                som finns i barnets uppgifter i befolkningsdatasystemet och som
                bor på en annan adress.
              </P>
            ),
            futureAddressInfo:
              'Vi använder den adress som finns i befolkningsdatasystemet som officiell adress. Din adress i befolkningsdatasystemet ändras när du gör en flyttanmälan till posten eller Myndigheten för digitalisering och befolkningsdata.',
            emailInfoText:
              'När du har angett en e-postadress får du notiser om nya meddelanden som du har fått i småbarnspedagogikens ärendehanteringstjänst eVaka. Den förhandsifyllda e-postadressen har hämtats från klientuppgifterna i eVaka. Om du ändrar den uppdateras adressen när du skickar in ansökan.',
            secondGuardianInfoTitle: 'Den andra vårdnadshavarens uppgifter',
            secondGuardianNotFound:
              'Enligt uppgift som vi har fått från befolkningsdatasystemet har barnet ingen andra vårdnadshavare.',
            otherChildrenInfo:
              'Barn under 18 år som bor i samma hushåll påverkar klientavgifterna inom småbarnspedagogiken.',
            areExtraChildren:
              'I samma hushåll bor andra barn som är under 18 år (t.ex. makens/makans/sambos barn)'
          },
          additionalDetails: {
            dietLabel: 'Specialkost',
            dietInfo:
              'För vissa specialdieter behövs ett läkarintyg som ska lämnas till enheten för småbarnspedagogik. Undantag är låglaktoskost eller laktosfri kost, kost anpassad efter religiös övertygelse och vegetarisk kost (lakto-ovo).'
          },
          verification: {
            serviceNeed: {
              dailyTime: {
                shiftCare: 'Skiftvård',
                withShiftCare: 'Behov av skiftvård',
                withoutShiftCare: 'Behöver inte skiftvård'
              },
              assistanceNeed: {
                assistanceNeed:
                  'Behov av stöd i anslutning till utveckling eller lärande'
              }
            }
          }
        },
        creation: {
          daycare4monthWarning: (
            <>
              En ny ansökan behandlas inom 4 månader.
              <br />
              <br />
              En överföringsansökan har ingen bestämd behandlingstid. Beslut
              fattas när det finns lediga platser och möjlighet att ordna plats.
            </>
          )
        }
      },
      income: {
        assure: (
          <MultiLineCheckboxLabel>
            <span>
              Jag försäkrar att de uppgifter jag lämnat in är riktiga och jag
              har bekantat mig med avgifter för småbarnspedagogik:{' '}
            </span>
            <a
              href="https://www.espoo.fi/sv/fostran-och-utbildning/smabarnspedagogik/klientavgifterna-smabarnspedagogik#section-59617"
              target="_blank"
              rel="noreferrer"
            >
              Avgifter för småbarnspedagogik | Esbo stad (espoo.fi)
            </a>
          </MultiLineCheckboxLabel>
        ),
        incomeType: {
          grossIncome: 'Fastställande av avgiften enligt inkomster'
        },
        grossIncome: {
          title: 'Att fylla i uppgifterna om inkomster',
          estimate: 'Uppskattning av mina bruttolön (före skatt)'
        }
      },
      decisions: {
        assistanceDecisions: {
          decision: {
            motivationForDecision:
              'Motivering för barnets stödbehov och arrangemang för stöd under lovtider',
            unitMayChange: ''
          }
        }
      }
    },
    en: enCustomizations
  },
  cityLogo: {
    src: PetajavesiLogo,
    alt: 'Petajavesi Logo'
  },
  routeLinkRootUrl: 'https://reittiopas.hsl.fi/reitti/',
  mapConfig,
  featureFlags,
  getMaxPreferredUnits() {
    return 3
  }
}

export default customizations
