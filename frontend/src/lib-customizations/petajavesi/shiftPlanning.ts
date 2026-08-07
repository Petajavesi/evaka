// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// Työvuorosuunnittelu-lisäosan käyttöliittymätekstit (Petäjäveden instanssikohtainen
// toiminnallisuus, vain suomeksi)

export const shiftPlanningTexts = {
  title: 'Työvuorosuunnittelu',
  unitLabel: 'Yksikkö',
  unitPlaceholder: 'Valitse yksikkö',
  previousWeek: 'Edellinen viikko',
  nextWeek: 'Seuraava viikko',
  week: 'Viikko',
  noReservations: 'Valitulle viikolle ei ole varauksia.',
  staleDataWarning:
    'Tietojen päivitys epäonnistui. Näytetään aiemmin ladatut tiedot, jotka voivat olla vanhentuneita.',
  loadError: 'Tietojen lataus epäonnistui.',
  saveError:
    'Suunnitelman tallennus epäonnistui. Muokkaus on estetty, kunnes tallennus onnistuu. Yritä uudelleen.',
  staffingNeed: {
    title: 'Henkilöstötarve kellonajoittain',
    time: 'Klo',
    childCount: 'Lapsia',
    weighted: 'Painotettu',
    required: 'Tarve',
    planned: 'Suunniteltu',
    actual: 'Toteuma',
    difference: 'Erotus',
    occupancy: 'Käyttöaste',
    legend: 'Solun luvut: tarve / suunniteltu',
    legendWithActual: 'Solun luvut: tarve / suunniteltu / toteuma'
  },
  viewMode: {
    list: 'Lista',
    chart: 'Kaavio'
  },
  chart: {
    employeesAxis: 'Työntekijöitä',
    timeAxis: 'Klo',
    noReservationsForDay: 'Ei varauksia valitulle päivälle',
    assistanceMarker: '(tuki)'
  },
  children: {
    title: 'Lapset ja varausajat',
    name: 'Lapsi',
    dateOfBirth: 'Syntymäaika',
    assistance: 'Tuen tieto',
    assistanceFactor: 'Tuen kerroin',
    daycareAssistanceLevels: {
      GENERAL_SUPPORT: 'Yleinen tuki',
      GENERAL_SUPPORT_WITH_DECISION: 'Yleinen tuki (päätös tukipalveluista)',
      INTENSIFIED_SUPPORT: 'Tehostettu tuki',
      SPECIAL_SUPPORT: 'Erityinen tuki'
    }
  },
  shifts: {
    title: 'Työvuorot',
    employee: 'Työntekijä',
    employees: 'Työntekijät',
    employeesPlaceholder: 'Valitse työntekijät',
    noEmployees:
      'Valitse vuoroon vähintään yksi työntekijä — vuoroa ei muuten tallenneta',
    date: 'Päivä',
    days: 'Päivät',
    daysPlaceholder: 'Valitse päivät',
    noDays:
      'Valitse vuorolle vähintään yksi päivä — vuoroa ei muuten tallenneta',
    startTime: 'Alkaa',
    endTime: 'Päättyy',
    addShift: 'Lisää työvuoro',
    removeShift: 'Poista työvuoro',
    save: 'Tallenna suunnitelma',
    saved: 'Suunnitelma tallennettu',
    invalidTime: 'Päättymisajan on oltava alkamisajan jälkeen',
    downloadPdf: 'Lataa PDF',
    pdfRequiresSave: 'Tallenna suunnitelma ennen PDF-latausta',
    printoutsTitle: 'Työntekijöille jaettavat listat',
    downloadEmployeesPdf: 'Lataa kaikkien listat (PDF, työntekijä/sivu)',
    downloadEmployeePdf: 'Lataa työntekijän lista (PDF)',
    employeePdfPlaceholder: 'Valitse työntekijä',
    suggest: 'Luo ehdotus varauksista',
    suggestEmployees: 'Ehdota työntekijät',
    acceptAssignments: 'Hyväksy ehdotus',
    rejectAssignments: 'Hylkää ehdotus',
    assignmentPendingInfo:
      'Työntekijät on ehdotettu vuoroihin tasoittumisjakson työaikakertymien ' +
      'perusteella (vähiten tunteja kerännyt ensin, ei päällekkäisiä vuoroja). ' +
      'Tarkista ehdotus ja muokkaa tarvittaessa — tallennus on käytössä vasta, ' +
      'kun ehdotus on hyväksytty tai hylätty.',
    suggestedEmployeeMarker: 'Ehdotettu — hyväksy tai muokkaa',
    suggestionInfo:
      'Vuoroehdotus on luotu lasten tulo- ja lähtöaikojen perusteella ' +
      '(vuoron pituus 6–9 h, tavoitteena 7 h 39 min). ' +
      'Hyväksytyt työvuorotoiveet on säilytetty, ja ehdotus täyttää vain ' +
      'niiltä puuttuvan tarpeen. ' +
      'Valitse jokaiseen vuoroon työntekijät ja muokkaa vuoroja tarvittaessa — ' +
      'ilman työntekijää olevia vuoroja ei tallenneta.'
  },
  wishes: {
    title: 'Työvuorotoiveet',
    empty: 'Ei toiveita tälle viikolle.',
    date: 'Päivä',
    time: 'Toivottu aika',
    employee: 'Työntekijä',
    status: 'Tila',
    pending: 'Odottaa',
    approved: 'Hyväksytty',
    rejected: 'Hylätty',
    approve: 'Hyväksy',
    reject: 'Hylkää',
    sharedSlot: (count: number) => `${count} toivoo samaa vuoroa`,
    important: 'Tärkeä',
    importantInfo:
      'Tähdellä ★ merkityt ovat työntekijöille tärkeitä toiveita (esim. ' +
      'tärkeä meno) — pyri toteuttamaan ne ensisijaisesti.',
    sharedSlotInfo:
      'Samalla värillä merkityt rivit ovat saman vuoron (sama päivä ja ' +
      'kellonajat) toiveita eri työntekijöiltä.',
    modifiedMarker: 'Aikoja muutettu hyväksynnässä',
    approveAddsShiftInfo:
      'Hyväksyntä lisää vuoron alla olevaan suunnitelmaan ja tallentaa sen heti. ' +
      'Kellonaikoja voi muokata ennen hyväksyntää.',
    resolveError: 'Toiveen käsittely epäonnistui. Yritä uudelleen.'
  },
  weeklyHours: {
    title: 'Viikkotyöaika (KVTES liite 5)',
    employee: 'Työntekijä',
    planned: 'Suunniteltu (viikko)',
    actual: 'Toteutunut (viikko)',
    periodPlanned: 'Suunniteltu (jakso)',
    periodActual: 'Toteutunut (jakso)',
    periodBalance: 'Jakson saldo',
    noActual: '–',
    limit: 'Yleistyöaika',
    overLimit: 'Ylittää tasoittumisjakson yleistyöajan',
    periodInfo: (period: string, weekLimit: string, periodLimit: string) =>
      `Tasoittumisjakso ${period} — yleistyöaika ${weekLimit}/viikko, ` +
      `jaksolla yhteensä ${periodLimit}. Viikkokohtaiset ylitykset ja ` +
      `alitukset tasoittuvat kolmen viikon jakson sisällä.`
  }
}
