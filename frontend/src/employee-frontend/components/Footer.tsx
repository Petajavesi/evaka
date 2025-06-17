// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'

import Container from 'lib-components/layout/Container'
import { defaultMargins } from 'lib-components/white-space'

import { useTranslation } from '../state/i18n'

export const footerHeight = '72px'

const FooterContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: ${defaultMargins.s} 0;
  height: ${footerHeight};

  svg,
  img {
    max-width: 200px;
    width: auto;
    max-height: 100%;
  }
`

const Content = styled.div`
  display: flex;
  gap: ${defaultMargins.XL};
`

export const Footer = React.memo(function Footer() {
  const { i18n } = useTranslation()
  return (
    <footer>
      <Container>
        <FooterContainer>
          <Content>
            <span data-qa="footer-city-label">
              &copy; {i18n.footer.cityLabel}
            </span>
            <a href={i18n.footer.linkHref} data-qa="footer-city-link">
              {i18n.footer.linkLabel}
            </a>
          </Content>
        </FooterContainer>
      </Container>
    </footer>
  )
})
