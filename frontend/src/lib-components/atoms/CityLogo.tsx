// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'

import { defaultMargins } from 'lib-components/white-space'
import { cityLogo } from 'lib-customizations/employee'

export const CityLogo = React.memo(function Logo() {
  return (
    <Container>
      <Img src={cityLogo.src} alt={cityLogo.alt} data-qa="header-city-logo" />
    </Container>
  )
})

const Container = styled.div`
  padding: ${defaultMargins.xs} 0;
  width: 144px;
`

const Img = styled.img`
  max-width: 144px;
  width: auto;
  height: 100%;
`
