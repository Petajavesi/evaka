// SPDX-FileCopyrightText: 2017-2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// Työntekijän Työvuorot-välilehden tekstit (Petäjäveden instanssikohtainen
// toiminnallisuus, vain suomeksi)

export const shiftWishTexts = {
  title: 'Työvuorot',
  info: (start: string, end: string) =>
    `Voit toivoa työvuoroja seuraavalle kolmelle viikolle (${start}–${end}). ` +
    'Työvuorosuunnittelija hyväksyy, hylkää tai muuttaa toiveet. ' +
    'Käsittelemättömän toiveen voi poistaa.',
  unitLabel: 'Yksikkö',
  unitPlaceholder: 'Valitse yksikkö',
  noUnits: 'Sinulla ei ole oikeutta toivoa vuoroja mihinkään yksikköön.',
  week: 'Viikko',
  ownShifts: 'Omat työvuorot',
  ownShiftsInfo:
    'Tässä näkyvät sinulle vahvistetut työvuorot kuluvalta viikolta ja ' +
    'seuraavilta kolmelta viikolta.',
  noShifts: 'Ei työvuoroja.',
  currentWeekMarker: '(kuluva viikko)',
  unit: 'Yksikkö',
  ownWishes: 'Omat toiveet',
  date: 'Päivä',
  startTime: 'Alkaa',
  endTime: 'Päättyy',
  status: 'Tila',
  statuses: {
    PENDING: 'Odottaa käsittelyä',
    APPROVED: 'Hyväksytty',
    REJECTED: 'Hylätty'
  },
  approvedWithChanges: (time: string) => `Hyväksytty muutettuna: ${time}`,
  noWishes: 'Ei toiveita.',
  addWish: 'Lisää toive',
  important: 'Tärkeä toive',
  importantInfo: (used: number, max: number) =>
    `Voit merkitä tähdellä enintään ${max} tärkeää toivetta (esim. tärkeä meno) ` +
    `kolmen viikon jaksolle. Käytetty: ${used}/${max}.`,
  importantLimitError:
    'Voit merkitä enintään kaksi toivetta tärkeäksi kolmen viikon jaksolla.',
  removeWish: 'Poista toive',
  datePlaceholder: 'Valitse päivä',
  save: 'Tallenna toive',
  invalidTime: 'Päättymisajan on oltava alkamisajan jälkeen',
  duplicateError: 'Olet jo toivonut samaa vuoroa.',
  saveError: 'Toiveen tallennus epäonnistui. Yritä uudelleen.',
  loadError: 'Tietojen lataus epäonnistui.'
}
