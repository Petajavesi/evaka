// SPDX-FileCopyrightText: 2017-2026 City of Espoo
// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// Petäjäveden englanninkieliset tekstit: siirretty hakemistoista espoo/citizen.tsx (translations.en)
// ja defaults/citizen/i18n/en.tsx (paikalliset muutokset tagiin v20260731).

import styled from 'styled-components'

import { FixedSpaceColumn } from 'lib-components/layout/flex-helpers'
import { H3, P } from 'lib-components/typography'
import type { Translations } from 'lib-customizations/citizen'
import type { DeepPartial } from 'lib-customizations/types'

const MultiLineCheckboxLabel = styled(FixedSpaceColumn).attrs({
  $spacing: 'zero'
})`
  margin-top: -6px;
`

const en: DeepPartial<Translations> = {
  applications: {
    editor: {
      heading: {
        title: {
          DAYCARE: 'Early childhood education and service voucher application'
        },
        info: {
          DAYCARE: (
            <>
              <P>
                You can apply for a place in early childhood education all year
                round. Submit your application no later than four months before
                your child needs the place. If your child urgently needs early
                childhood education due to your work or studies, you must apply
                for a place no later than two weeks before needing the place.
              </P>
              <P>
                You will receive a written decision on the early childhood
                education place through the{' '}
                <a
                  href="https://www.suomi.fi/messages"
                  target="_blank"
                  rel="noreferrer"
                >
                  Suomi.fi Messages
                </a>{' '}
                service.
              </P>
              <P>
                The client fee for municipal early childhood education and the
                service voucher client charge are calculated as a percentage of
                your family’s gross income. In addition to your income, the fee
                depends on your family’s size and the agreed hours of early
                childhood education.
              </P>
              <P>
                Service voucher day care centres may charge an additional fee.{' '}
                <a
                  href="https://www.espoo.fi/en/childcare-and-education/early-childhood-education/applying-private-early-childhood-education"
                  target="_blank"
                  rel="noreferrer"
                >
                  Here you can find information about the additional fees.
                </a>{' '}
                You must provide information about your family’s gross income no
                later than two weeks after your child’s early childhood
                education has started.
              </P>
              <P>
                <a
                  href="https://www.espoo.fi/en/childcare-and-education/early-childhood-education/early-childhood-education-fees"
                  target="_blank"
                  rel="noreferrer"
                >
                  Here you can find more information about the fees for
                  municipal and outsourced early childhood education and how to
                  submit an income statement.
                </a>
              </P>
              <P>
                <a
                  href="https://www.espoo.fi/en/childcare-and-education/early-childhood-education/fees-service-voucher-day-care-centres"
                  target="_blank"
                  rel="noreferrer"
                >
                  Here you can find more information about the fees charged at
                  service voucher day care centres and how to submit an income
                  statement.
                </a>
              </P>
              <P $fitted={true}>* Information marked with a star is required</P>
            </>
          ),
          PRESCHOOL: (
            <>
              <P>
                Children attend pre-primary education during the year before the
                start of compulsory education. Pre-primary education is free of
                charge. Enrolment for pre-primary education for the school year
                2026–2027 takes place between 8 and 20 January 2026. Finnish and
                Swedish pre-primary education starts on 13 August 2026.
              </P>
              <P>
                The decisions will be sent to the{' '}
                <a
                  href="https://www.suomi.fi/messages"
                  target="_blank"
                  rel="noreferrer"
                >
                  Suomi.fi Messages
                </a>{' '}
                service.
              </P>
              <P $fitted={true}>* Information marked with a star is required</P>
            </>
          )
        }
      },
      serviceNeed: {
        title: 'Need for services',
        startDate: {
          header: {
            DAYCARE: 'Start of early childhood education'
          },
          info: {
            DAYCARE: [
              'Please note that you have to reserve about 1–2 weeks for familiarisation and orientation at the day care centre. During the familiarisation period, children familiarise themselves with the day care centre together with their guardians before early childhood education officially starts. The day care centre staff will contact you to discuss the familiarisation period and the start of early childhood education. No fee is charged for the duration of the familiarisation period.',
              'Your desired start date should be the date when your child stays at the day care centre without a guardian for the first time after the familiarisation period. Early childhood education fees will not be charged until the official start date confirmed by the guardian.',
              <a
                key="link"
                href="https://www.espoo.fi/en/childcare-and-education/early-childhood-education/accepting-place-and-starting-early-childhood-education"
                target="_blank"
                rel="noreferrer"
              >
                Read more about the start of early childhood education here.
              </a>
            ],
            PRESCHOOL: [
              'Finnish and Swedish pre-primary education starts on 13 August 2026. If your child needs early childhood education at the beginning of August before pre-primary education starts, you can apply for it on this application by selecting  I also apply for early childhood education related to pre-primary education.'
            ]
          },
          instructions: {
            DAYCARE: (
              <>
                You can postpone your desired start date until the processing of
                your application starts. If you want to make changes to your
                start date later, you need to contact early childhood education
                service guidance (tel. 09 8163 1000).
              </>
            ),
            PRESCHOOL: (
              <>
                You can postpone your desired start date until the processing of
                your application starts. If you want to make changes to your
                start date later, you need to contact early childhood education
                service guidance (tel. 09 8163 1000).
              </>
            )
          }
        },
        urgent: {
          label: 'Urgent application (not applicable to transfer applications)',
          attachmentsMessage: {
            text: (
              <>
                <P $fitted>
                  If your child needs a place in early childhood education due
                  to your sudden employment or studies, you must apply for a
                  place no later than two weeks before your child needs it. Your
                  application must include documents concerning the employment
                  or student status of both guardians living in the same
                  household. We recommend that you send the documents online, as
                  we will not process your application until we have received
                  the required documents.
                </P>
                <P>
                  If you are unable to add attachments to your online
                  application, you can send the documents by post to Early
                  Childhood Education Service Guidance, P.O. Box 3125, 02070
                  City of Espoo.
                </P>
              </>
            )
          }
        },
        partTime: {
          true: 'Part-time (max. 5 hours/day and 25 hours/week)',
          false: 'Full-day'
        },
        dailyTime: {
          label: {
            PRESCHOOL:
              'Need for early childhood education connected to pre-primary education'
          },
          connectedDaycareInfo: (
            <>
              <P>
                If necessary, apply for early childhood education connected to
                pre-primary education for your child (fees apply). Early
                childhood education is provided in the morning before
                pre-primary education and in the afternoon after pre-primary
                education during the opening hours of the pre-primary education
                unit. (As a rule, pre-primary education is provided from 9:00 to
                13:00.)
              </P>
              <P>
                If your child needs early childhood education at the beginning
                of August before pre-primary education starts, take this into
                account when choosing your desired start date.
              </P>
              <P>
                You can apply for connected early childhood education from the
                same unit (municipal or service voucher) from where you apply
                for pre-primary education.
              </P>
              <P>
                When applying for private pre-primary education units, apply for
                related early childhood education directly from the unit (with
                the exception of service voucher units); the units inform
                customers about the application procedure. If you have applied
                for related early childhood education from a private unit on the
                pre-primary education application, the service guidance will
                change your application to a pre-primary education application
                only.
              </P>
              <P>
                A separate written decision will be issued on the early
                childhood education place. The decision will be sent to the{' '}
                <a
                  href="https://www.suomi.fi/messages"
                  target="_blank"
                  rel="noreferrer"
                >
                  Suomi.fi Messages
                </a>{' '}
                service or by post if you do not use the{' '}
                <a
                  href="https://www.suomi.fi/messages"
                  target="_blank"
                  rel="noreferrer"
                >
                  Suomi.fi messages
                </a>{' '}
                service.
              </P>
            </>
          ),
          instructions: {
            DAYCARE:
              'Indicate the hours of early childhood education usually needed by your child. The hours will be specified in the service agreement when early childhood education starts.'
          },
          usualArrivalAndDeparture: {
            DAYCARE: 'Start and end time of early childhood education'
          }
        },
        shiftCare: {
          label: 'Shift care',
          instructions:
            'Shift care refers to early childhood education that is provided, in addition to daytime early childhood education, in the evenings, at night, at weekends and on holidays at shift day care centres.',
          attachmentsMessage: {
            DAYCARE: (
              <>
                <P $fitted>
                  Shift care is intended for children whose both guardians do
                  shift work or mainly study in the evening and/or at weekends.
                  The right to shift care ends if the child no longer needs
                  shift care due to the guardian’s work or studies, in which
                  case the guardian must apply for a new early childhood
                  education place for the child.
                </P>
                <P>
                  Your application must include a document issued by your
                  employer concerning your shift work or a document issued by a
                  representative of your educational institution concerning your
                  full-time evening or weekend studies. Both guardians living in
                  the same household must provide the required document.
                </P>
                <P>
                  If you are unable to add attachments to your online
                  application, you can send the documents by post to Early
                  Childhood Education Service Guidance, P.O. Box 3125, 02070
                  City of Espoo.
                </P>
              </>
            ),
            PRESCHOOL: (
              <>
                <P>
                  Shift care is intended for children whose both guardians do
                  shift work or mainly study in the evening and/or at weekends.
                  The right to shift care ends if the child no longer needs
                  shift care due to their guardian’s work or studies.
                </P>
                <P>
                  In shift care, pre-primary education is provided between 8:00
                  and 16:00 for approximately four hours at a time. The exact
                  hours of pre-primary education are planned based on the
                  child’s hours of attendance. We always ensure that children do
                  not have to spend too much time at the day care centre.
                </P>
                <P>
                  Your application must include a document issued by your
                  employer concerning your shift work or a document issued by a
                  representative of your educational institution concerning your
                  full-time evening or weekend studies. Both guardians living in
                  the same household must provide the required document.
                </P>
                <P>
                  If you are unable to add attachments to your online
                  application, you can send the documents by post to Early
                  Childhood Education Service Guidance, P.O. Box 3125, 02070
                  City of Espoo.
                </P>
              </>
            )
          },
          attachmentsSubtitle:
            'Add here both guardians’ documents concerning shift work or evening/weekend studies.'
        },
        assistanceNeed: 'Need for support',
        assistanceNeeded: {
          DAYCARE: 'My child needs support for development or learning',
          PRESCHOOL:
            'Select this option if the child needs support for their development, learning and/or wellbeing during the pre-primary education year',
          CLUB: 'My child needs support for development or learning'
        },
        assistanceNeedInstructions: {
          DAYCARE:
            'Tick this box if your child needs support for their development, learning or wellbeing. Support is provided as part of early childhood education. If your child needs support, a special needs teacher will contact you. This will ensure that your child’s needs are taken into account and your child is given a place in a suitable early childhood education unit.',
          PRESCHOOL: null
        },
        assistanceNeedExtraInstructions: {
          PRESCHOOL: (
            <P>
              Tick this box if your child needs support for their development
              and/or learning during the pre-primary education year. Support is
              provided as part of pre-primary education and early childhood
              education. Also tick this box if your child has another special
              reason that directly affects the provision of pre-primary
              education or the unit in which their pre-primary education should
              be provided. If a child needs support for learning and/or
              participation in pre-primary education, the early childhood
              special education teacher will contact you. This will ensure that
              your child’s needs are taken into account and your child is given
              a placein a suitable pre-primary education unit.
            </P>
          )
        },
        preparatory:
          'My child needs support in learning Finnish and the child’s current day care centre has recommended that the child attend preparatory pre-primary education. I am also applying for preparatory education. This does not apply to Swedish pre-primary education.',
        preparatoryInfo: null,
        preparatoryExtraInstructions: (
          <>
            <P>
              Preparatory education is offered in connection with pre-primary
              education to children who do not yet have Finnish language skills
              or who know some Finnish. Preparatory education is offered to
              children of pre-primary education age in Finnish-speaking
              municipal pre-primary education groups.
            </P>
            <P>
              Children attending extended compulsory education are not entitled
              to preparatory education. If the child has received or later
              receives a decision on extended compulsory education, the child’s
              placement will be changed to a pre-primary education placement.
            </P>
          </>
        )
      },
      unitPreference: {
        siblingBasis: {
          title: 'Application based on the sibling principle',
          info: {
            DAYCARE: (
              <>
                <P $fitted>
                  The sibling principle applies to an early childhood education
                  unit in which the child’s sibling has a place when the child’s
                  early childhood education starts.
                </P>
                <P>
                  All children living at the same address are considered
                  siblings. Our aim is to place siblings in the same early
                  childhood education unit if the family so wishes. If you are
                  applying for places for siblings who do not yet attend early
                  childhood education, enter this information in the additional
                  information field.
                </P>
                <P>
                  Only add this information if you are using the sibling
                  principle. Also, select the sibling’s unit as your first
                  choice from the menu below
                </P>
              </>
            ),
            PRESCHOOL: (
              <>
                <P>
                  A child enrolling for pre-primary education has a
                  sibling-basis right to a
                </P>
                <ol type="a">
                  <li>
                    early childhood education in their own service area, where
                    they have a sibling who has, at the moment of making the
                    decision and in the coming pre-primary education year, a
                    place at the pre-primary education unit
                  </li>
                  <li>
                    local school determined by the city, which will be attended
                    by their sibling in the coming school year.
                  </li>
                </ol>
                <P>
                  Select whether you wish to use the sibling principle based on
                  section a or b if they both apply to your child.
                </P>
                <P>
                  Only add this information if you are using the sibling
                  principle. Also, select the sibling’s unit as your first
                  choice from the menu below.
                </P>
              </>
            )
          },
          checkbox: {
            PRESCHOOL:
              'I am primarily applying for a place in the same unit in which the child’s sibling is.'
          }
        },
        units: {
          info: {
            DAYCARE: (
              <>
                <P $fitted>
                  You can apply for a place in 1–3 units in order of preference.
                  We cannot guarantee a place in the desired unit, but your
                  chances increase if you select several options.{' '}
                </P>
                <P>
                  Apply for a service voucher by selecting the service voucher
                  unit to which you want to apply. When applying to a service
                  voucher unit, the unit’s director will also be informed of
                  your application.
                </P>
                <P>
                  You can see the locations of all early childhood education
                  units by clicking on ‘Units on the map’.
                </P>
              </>
            )
          },
          mapLink: 'Units on the map',
          select: {
            label: (maxUnits: number) =>
              maxUnits === 1 ? 'Search for a unit' : 'Search for units'
          },
          preferences: {
            info: (maxUnits: number) =>
              maxUnits === 1
                ? 'Select a unit'
                : `Select 1–${maxUnits} units in order of preference. You can change the order with the arrows.`
          }
        }
      },
      contactInfo: {
        familyInfo: (
          <P>
            Your application must include all adults and children living in the
            same household.
          </P>
        ),
        info: (
          <P>
            Personal information is retrieved from the Population Information
            System and cannot be changed on this application. If your personal
            information is incorrect, please update the information on the{' '}
            <a
              href="https://dvv.fi/en/individuals"
              target="_blank"
              rel="noopener noreferrer"
            >
              website of the Digital and Population Data Services Agency
            </a>
            . If your address is about to change, you can add the new address in
            a separate field on the application. Add a new address for both the
            child and guardian. Your address will not be considered official
            until it has been updated in the Population Information System. We
            send decisions on early childhood and pre-primary education places
            automatically to the child’s other guardian who lives at a different
            address based on the Population Information System.
          </P>
        ),
        hasFutureAddress:
          'The address registered in the Population Information System has changed or is about to change',
        futureAddressInfo:
          'We use the address retrieved from the Population Information System as your official address. Your address in the Population Information System will change after you have submitted a notification of change of address through Posti or the Digital and Population Data Services Agency.',
        emailInfoText:
          'Your email address is used for notifying you about new messages sent to you through eVaka, the online system for early childhood education. The pre-filled email address has been retrieved from the eVaka customer records. If you change your email address, the information will be updated once the application is sent.',
        secondGuardianInfoTitle: 'Other guardian’s information',
        secondGuardianNotFound:
          'According to the information obtained from the Population Information System, your child does not have another guardian.',
        otherChildrenTitle:
          'Under 18-year-old children living in the same household',
        otherChildrenInfo:
          'Under 18-year-old children living in the same household affect the early childhood education fee.',
        areExtraChildren:
          'Other under 18-year-old children live in the same household (e.g. spouse’s/partner’s children)'
      },
      additionalDetails: {
        dietLabel: 'Special dietary needs',
        dietInfo:
          'Some special diets require a separate medical certificate, which you must deliver to the early childhood education unit. Exceptions include a low-lactose and lactose-free diet, a diet based on religious beliefs and a vegetarian diet (lacto-ovo).'
      },
      verification: {
        serviceNeed: {
          dailyTime: {
            shiftCare: 'Shift care',
            withShiftCare: 'Need for shift care',
            withoutShiftCare: 'No need for shift care'
          },
          assistanceNeed: {
            assistanceNeed: 'Support for development or learning'
          }
        }
      }
    },
    creation: {
      daycare4monthWarning: (
        <>
          The processing time for a new application is 4 months.
          <br />
          <br />
          Transfer applications have no defined processing time; decisions are
          made when applicant and place availability allow.
        </>
      ),
      applicationInfo: (
        <P>
          You can make changes to your application until its processing starts.
          After this, you can make changes to your application by contacting
          early childhood education service counselling (tel. 040 700 1879). If
          you wish to cancel an application you have submitted, please send an
          email to early childhood education service counselling (
          <a href="mailto:varhaiskasvatus@petajavesi.fi">
            varhaiskasvatus@petajavesi.fi
          </a>
          ).
        </P>
      )
    }
  },
  income: {
    assure: (
      <MultiLineCheckboxLabel>
        <span>
          I confirm that the information I have provided is accurate, and I have
          reviewed the customer fee information:
        </span>
        <a
          href="https://www.espoo.fi/en/childcare-and-education/early-childhood-education/early-childhood-education-fees#section-59617"
          target="_blank"
          rel="noreferrer"
        >
          Early education fees | City of Espoo
        </a>
      </MultiLineCheckboxLabel>
    ),
    incomeType: {
      grossIncome: 'Determination of the client fee by income'
    },
    grossIncome: {
      title: 'Filling in income data',
      estimate: 'Estimate of my gross salary (before taxes)'
    }
  },
  decisions: {
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
    },
    assistanceDecisions: {
      decision: {
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
    }
  }
}

export default en
