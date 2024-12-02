// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'

import { renderResult } from 'employee-frontend/components/async-rendering'
import { I18nContext, Lang, useTranslation } from 'employee-frontend/state/i18n'
import { wrapResult } from 'lib-common/api'
import { AssistanceNeedDecision } from 'lib-common/generated/api-types/assistanceneed'
import { useQueryResult } from 'lib-common/query'
import { UUID } from 'lib-common/types'
import useRouteParams from 'lib-common/useRouteParams'
import { useApiState } from 'lib-common/utils/useRestApi'
import AssistanceNeedDecisionReadOnly from 'lib-components/assistance-need-decision/AssistanceNeedDecisionReadOnly'
import { AsyncButton } from 'lib-components/atoms/buttons/AsyncButton'
import { LegacyButton } from 'lib-components/atoms/buttons/LegacyButton'
import ReturnButton from 'lib-components/atoms/buttons/ReturnButton'
import Content, { Container } from 'lib-components/layout/Container'
import StickyFooter from 'lib-components/layout/StickyFooter'
import {
  FixedSpaceColumn,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import { InformationText } from 'lib-components/typography'
import { defaultMargins, Gap } from 'lib-components/white-space'

import {
  getAssistanceNeedDecision,
  revertToUnsentAssistanceNeedDecision,
  sendAssistanceNeedDecision
} from '../../../../generated/api-clients/assistanceneed'
import MetadataSection from '../../../archive-metadata/MetadataSection'
import { assistanceNeedDecisionMetadataQuery } from '../../queries'

const getAssistanceNeedDecisionResult = wrapResult(getAssistanceNeedDecision)
const sendAssistanceNeedDecisionResult = wrapResult(sendAssistanceNeedDecision)
const revertToUnsentAssistanceNeedDecisionResult = wrapResult(
  revertToUnsentAssistanceNeedDecision
)

const StickyFooterContainer = styled.div`
  padding: ${defaultMargins.xs};
`

const canBeEdited = (decision: AssistanceNeedDecision) =>
  decision.status === 'NEEDS_WORK' ||
  (decision.status === 'DRAFT' && decision.sentForDecision === null)

const DecisionMetadataSection = React.memo(function DecisionMetadataSection({
  decisionId
}: {
  decisionId: UUID
}) {
  const result = useQueryResult(
    assistanceNeedDecisionMetadataQuery({ decisionId })
  )
  return <MetadataSection metadataResult={result} />
})

export default React.memo(function AssistanceNeedDecisionPage() {
  const { childId, id } = useRouteParams(['childId', 'id'])
  const navigate = useNavigate()

  const [assistanceNeedDecision, reloadDecision] = useApiState(
    () => getAssistanceNeedDecisionResult({ id }),
    [id]
  )

  const {
    i18n: {
      childInformation: { assistanceNeedDecision: t },
      ...i18n
    }
  } = useTranslation()

  useEffect(() => {
    const response = assistanceNeedDecision.getOrElse(undefined)
    if (
      response !== undefined &&
      response.hasMissingFields &&
      canBeEdited(response.decision)
    ) {
      navigate(
        `/child-information/${childId}/assistance-need-decision/${id}/edit`,
        {
          replace: true
        }
      )
    }
  }, [assistanceNeedDecision, childId, id, navigate])

  return (
    <>
      <Content>
        <ReturnButton label={i18n.common.goBack} />

        {renderResult(
          assistanceNeedDecision,
          ({ decision, permittedActions }) => (
            <>
              <I18nContext.Provider
                value={{
                  lang: decision.language.toLowerCase() as Lang,
                  setLang: () => undefined
                }}
              >
                <AssistanceNeedDecisionContent decision={decision} />
              </I18nContext.Provider>
              {permittedActions.includes('READ_METADATA') && (
                <>
                  <Gap />
                  <Container>
                    <DecisionMetadataSection decisionId={decision.id} />
                  </Container>
                </>
              )}
            </>
          )
        )}
      </Content>
      <Gap size="m" />
      <StickyFooter>
        <StickyFooterContainer>
          {renderResult(
            assistanceNeedDecision,
            ({ decision, permittedActions }) => (
              <FixedSpaceRow justifyContent="space-between" flexWrap="wrap">
                <FixedSpaceRow spacing="s">
                  <LegacyButton
                    onClick={() => navigate(`/child-information/${childId}`)}
                  >
                    {t.leavePage}
                  </LegacyButton>
                  {permittedActions.includes('UPDATE') && (
                    <LegacyButton
                      onClick={() =>
                        navigate(
                          `/child-information/${childId}/assistance-need-decision/${id}/edit`
                        )
                      }
                      disabled={!canBeEdited(decision)}
                    >
                      {t.modifyDecision}
                    </LegacyButton>
                  )}
                </FixedSpaceRow>
                <FixedSpaceRow spacing="m">
                  {decision.sentForDecision && (
                    <FixedSpaceColumn
                      justifyContent="center"
                      alignItems="flex-end"
                      spacing="none"
                    >
                      <InformationText>{t.sentToDecisionMaker}</InformationText>
                      <InformationText data-qa="decision-sent-at">
                        {decision.sentForDecision.format()}
                      </InformationText>
                    </FixedSpaceColumn>
                  )}

                  {decision.sentForDecision &&
                    permittedActions.includes('REVERT_TO_UNSENT') && (
                      <AsyncButton
                        primary
                        text={t.revertToUnsent}
                        onClick={() =>
                          revertToUnsentAssistanceNeedDecisionResult({ id })
                        }
                        onSuccess={reloadDecision}
                        data-qa="revert-to-unsent"
                      />
                    )}

                  {permittedActions.includes('SEND') && (
                    <AsyncButton
                      primary
                      text={t.sendToDecisionMaker}
                      onClick={() => sendAssistanceNeedDecisionResult({ id })}
                      onSuccess={reloadDecision}
                      disabled={!canBeEdited(decision)}
                      data-qa="send-decision"
                    />
                  )}
                </FixedSpaceRow>
              </FixedSpaceRow>
            ),
            { size: 'L', margin: 'zero' }
          )}
        </StickyFooterContainer>
      </StickyFooter>
    </>
  )
})

const AssistanceNeedDecisionContent = React.memo(
  function AssistanceNeedDecisionContent({
    decision
  }: {
    decision: AssistanceNeedDecision
  }) {
    const {
      i18n: {
        childInformation: { assistanceNeedDecision: t }
      }
    } = useTranslation()

    return <AssistanceNeedDecisionReadOnly decision={decision} texts={t} />
  }
)
