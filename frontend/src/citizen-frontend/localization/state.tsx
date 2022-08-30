// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { I18nProvider } from '@react-aria/i18n'
import React, { createContext, useContext, useMemo, useEffect } from 'react'

import useLocalStorage from 'lib-common/utils/useLocalStorage'
import {
  Lang,
  langs,
  translations as localizations
} from 'lib-customizations/citizen'

const getDefaultLanguage: () => Lang = () => {
  const params = new URLSearchParams(window.location.search)
  const lang = params.get('lang')
  if (lang && langs.includes(lang as Lang)) {
    return lang as Lang
  } else {
    const language = window.navigator.language.split('-')[0]
    if (
      (language === 'fi' || language === 'sv') &&
      langs.includes(language as Lang)
    ) {
      return language as Lang
    } else {
      return 'fi' as const
    }
  }
}

type LocalizationState = {
  lang: Lang
  setLang: (lang: Lang) => void
}

const defaultState = {
  lang: getDefaultLanguage(),
  setLang: () => undefined
}

export const LocalizationContext =
  createContext<LocalizationState>(defaultState)

const validateLang = (value: string | null): value is Lang => {
  for (const lang of langs) {
    if (lang === value) return true
  }
  return false
}

const navigatorLocale: string[] | undefined =
  window.navigator.language?.split('-')

const withNavigatorRegion = (language: string, fallback: string) =>
  `${language}-${
    navigatorLocale[0] === language ? navigatorLocale[1] || fallback : fallback
  }`

export const LocalizationContextProvider = React.memo(
  function LocalizationContextProvider({ children }) {
    const [lang, setLang] = useLocalStorage(
      'evaka-citizen.lang',
      defaultState.lang,
      validateLang
    )

    useEffect(() => {
      document.documentElement.lang = lang
    }, [lang])

    const value = useMemo(
      () => ({
        lang,
        setLang
      }),
      [lang, setLang]
    )

    return (
      <LocalizationContext.Provider value={value}>
        <I18nProvider
          locale={
            {
              fi: withNavigatorRegion('fi', 'FI'),
              sv: withNavigatorRegion('sv', 'FI'),
              en: withNavigatorRegion('en', 'GB')
            }[lang]
          }
        >
          {children}
        </I18nProvider>
      </LocalizationContext.Provider>
    )
  }
)

export const useTranslation = () => {
  const { lang } = useContext(LocalizationContext)

  return localizations[lang]
}

export const useLang = () => {
  const context = useContext(LocalizationContext)

  const value: [Lang, (lang: Lang) => void] = useMemo(
    () => [context.lang, context.setLang],
    [context.lang, context.setLang]
  )

  return value
}
