// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useRestApi } from 'lib-common/utils/useRestApi'
import { useTranslation } from '../localization'
import { Gap } from 'lib-components/white-space'
import Container, { ContentArea } from 'lib-components/layout/Container'
import { H1 } from 'lib-components/typography'
import { Loading, Result } from 'lib-common/api'
import { getPedagogicalDocuments } from './api'
import { SpinnerSegment } from 'lib-components/atoms/state/Spinner'
import ErrorSegment from 'lib-components/atoms/state/ErrorSegment'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import LocalDate from 'lib-common/local-date'
import { PedagogicalDocument } from 'lib-common/generated/api-types/pedagogicaldocument'
import { getAttachmentBlob } from '../attachments'
import FileDownloadButton from 'lib-components/molecules/FileDownloadButton'
import { OverlayContext } from '../overlay/state'
import { faArrowDown } from 'lib-icons'
import styled from 'styled-components'

export default function PedagogicalDocuments() {
  const t = useTranslation()
  const [pedagogicalDocuments, setPedagogicalDocuments] = useState<
    Result<PedagogicalDocument[]>
  >(Loading.of())

  const loadData = useRestApi(getPedagogicalDocuments, setPedagogicalDocuments)
  useEffect(() => loadData(), [loadData])

  const { setErrorMessage } = useContext(OverlayContext)
  const onAttachmentUnavailable = useCallback(
    () =>
      setErrorMessage({
        title: t.fileDownload.modalHeader,
        text: t.fileDownload.modalMessage,
        type: 'error'
      }),
    [t, setErrorMessage]
  )

  const PedagogicalDocumentsTable = ({
    items
  }: {
    items: PedagogicalDocument[]
  }) => {
    return (
      <Table>
        <Thead>
          <Tr>
            <Th>{t.pedagogicalDocuments.table.date}</Th>
            <Th>{t.pedagogicalDocuments.table.document}</Th>
            <Th>{t.pedagogicalDocuments.table.description}</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {items.map((item) => (
            <Tr key={item.id}>
              <DateTd data-qa={`pedagogical-document-date-${item.id}`}>
                {LocalDate.fromSystemTzDate(item.created).format()}
              </DateTd>
              <NameTd>
                {item.attachment && (
                  <FileDownloadButton
                    key={item.attachment.id}
                    file={item.attachment}
                    fileFetchFn={getAttachmentBlob}
                    onFileUnavailable={onAttachmentUnavailable}
                    icon
                    data-qa={`pedagogical-document-attachment-${item.id}`}
                    openInBrowser={true}
                  />
                )}
              </NameTd>
              <DescriptionTd
                data-qa={`pedagogical-document-description-${item.id}`}
              >
                {item.description}
              </DescriptionTd>
              <ActionsTd>
                {item.attachment && (
                  <FileDownloadButton
                    key={item.attachment.id}
                    file={item.attachment}
                    fileFetchFn={getAttachmentBlob}
                    onFileUnavailable={onAttachmentUnavailable}
                    icon={faArrowDown}
                    data-qa="pedagogical-document-attachment-download"
                    text={t.fileDownload.download}
                  />
                )}
              </ActionsTd>
            </Tr>
          ))}
        </Tbody>
      </Table>
    )
  }

  return (
    <>
      <Container>
        <Gap size="s" />
        <ContentArea opaque paddingVertical="L">
          <H1 noMargin>{t.pedagogicalDocuments.title}</H1>
          <p>{t.pedagogicalDocuments.description}</p>
          {pedagogicalDocuments.mapAll({
            loading() {
              return <SpinnerSegment />
            },
            failure() {
              return <ErrorSegment />
            },
            success(items) {
              return (
                items.length > 0 && <PedagogicalDocumentsTable items={items} />
              )
            }
          })}
        </ContentArea>
      </Container>
    </>
  )
}

const DateTd = styled(Td)`
  width: 15%;
`

const NameTd = styled(Td)`
  width: 20%;
`

const DescriptionTd = styled(Td)`
  width: 45%;
`

const ActionsTd = styled(Td)`
  width: 20%;
`
