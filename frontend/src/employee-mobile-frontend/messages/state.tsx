// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import uniqBy from 'lodash/uniqBy'
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'

import { Loading, Result } from 'lib-common/api'
import {
  AuthorizedMessageAccount,
  MessageThread
} from 'lib-common/generated/api-types/messaging'
import HelsinkiDateTime from 'lib-common/helsinki-date-time'
import {
  queryOrDefault,
  queryResult,
  useInfiniteQuery,
  useMutation,
  useMutationResult,
  useQueryResult
} from 'lib-common/query'
import { UUID } from 'lib-common/types'

import { UserContext } from '../auth/state'
import { useSelectedGroup } from '../common/selected-group'
import { UnitContext } from '../common/unit'

import { ReplyToThreadParams } from './api'
import {
  markThreadReadMutation,
  messagingAccountsQuery,
  receivedMessagesQuery,
  replyToThreadMutation
} from './queries'

const PAGE_SIZE = 20

export interface MessagesState {
  accounts: Result<AuthorizedMessageAccount[]>
  groupAccounts: AuthorizedMessageAccount[]
  selectedAccount: AuthorizedMessageAccount | undefined
  receivedMessages: Result<MessageThread[]>
  hasMoreMessages: boolean
  fetchMoreMessages: () => void
  markThreadAsRead: (threadId: UUID) => void
  sendReply: (params: ReplyToThreadParams) => Promise<Result<unknown>>
  setReplyContent: (threadId: UUID, content: string) => void
  getReplyContent: (threadId: UUID) => string
}

const defaultState: MessagesState = {
  accounts: Loading.of(),
  selectedAccount: undefined,
  groupAccounts: [],
  receivedMessages: Loading.of(),
  hasMoreMessages: false,
  fetchMoreMessages: () => undefined,
  markThreadAsRead: () => undefined,
  sendReply: () => Promise.resolve(Loading.of()),
  getReplyContent: () => '',
  setReplyContent: () => undefined
}

export const MessageContext = createContext<MessagesState>(defaultState)

const markMatchingThreadRead = (
  threads: MessageThread[],
  id: UUID
): MessageThread[] =>
  threads.map((t) =>
    t.id === id
      ? {
          ...t,
          messages: t.messages.map((m) => ({
            ...m,
            readAt: m.readAt ?? HelsinkiDateTime.now()
          }))
        }
      : t
  )

export const MessageContextProvider = React.memo(
  function MessageContextProvider({
    children
  }: {
    children: React.JSX.Element
  }) {
    const { unitInfoResponse } = useContext(UnitContext)

    const { user } = useContext(UserContext)
    const pinLoggedEmployeeId = user
      .map((u) => u?.employeeId ?? undefined)
      .getOrElse(undefined)

    const unitId = unitInfoResponse.map((res) => res.id).getOrElse(undefined)

    const { selectedGroupId } = useSelectedGroup()

    const accounts = useQueryResult(
      queryOrDefault(
        messagingAccountsQuery,
        []
      )(
        unitId && pinLoggedEmployeeId
          ? { unitId, employeeId: pinLoggedEmployeeId }
          : undefined
      )
    )

    const groupAccounts: AuthorizedMessageAccount[] = useMemo(
      () =>
        accounts
          .map((acc) =>
            acc.filter(
              ({ account, daycareGroup }) =>
                account.type === 'GROUP' && daycareGroup?.unitId === unitId
            )
          )
          .getOrElse([]),
      [accounts, unitId]
    )

    const selectedAccount: AuthorizedMessageAccount | undefined = useMemo(
      () =>
        (selectedGroupId.type === 'all'
          ? undefined
          : groupAccounts.find(
              ({ daycareGroup }) => daycareGroup?.id === selectedGroupId.id
            )) ?? groupAccounts[0],
      [groupAccounts, selectedGroupId]
    )

    const {
      data,
      transformPages,
      error,
      isFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage
    } = useInfiniteQuery(
      receivedMessagesQuery(selectedAccount?.account.id ?? '', PAGE_SIZE),
      {
        enabled:
          selectedAccount !== undefined && pinLoggedEmployeeId !== undefined
      }
    )

    const isFetchingFirstPage = isFetching && !isFetchingNextPage
    const threads = useMemo(
      () =>
        // Use .map() to only call uniqBy/flatMap when it's a Success
        queryResult(null, error, isFetchingFirstPage).map(() =>
          data
            ? uniqBy(
                data.pages.flatMap((p) => p.data),
                'id'
              )
            : []
        ),
      [data, error, isFetchingFirstPage]
    )

    const { mutate: markThreadRead } = useMutation(markThreadReadMutation)

    const markThreadAsRead = useCallback(
      (threadId: UUID) => {
        if (!selectedAccount) throw new Error('Should never happen')
        const { id: accountId } = selectedAccount.account

        if (!threads.isSuccess) return
        const thread = threads.value.find((t) => t.id === threadId)
        if (!thread) return

        const hasUnreadMessages = thread.messages.some(
          (m) => !m.readAt && m.sender.id !== accountId
        )

        if (hasUnreadMessages) {
          markThreadRead({ accountId, id: thread.id })
          transformPages((page) => ({
            ...page,
            data: markMatchingThreadRead(page.data, thread.id)
          }))
        }
      },

      [markThreadRead, selectedAccount, threads, transformPages]
    )

    const [replyContents, setReplyContents] = useState<Record<UUID, string>>({})

    const getReplyContent = useCallback(
      (threadId: UUID) => replyContents[threadId] ?? '',
      [replyContents]
    )
    const setReplyContent = useCallback((threadId: UUID, content: string) => {
      setReplyContents((state) => ({ ...state, [threadId]: content }))
    }, [])

    const { mutateAsync: sendReply } = useMutationResult(replyToThreadMutation)
    const sendReplyAndClear = useCallback(
      async (arg: ReplyToThreadParams) => {
        const result = await sendReply(arg)
        if (result.isSuccess) {
          setReplyContent(result.value.threadId, '')
        }
        return result
      },
      [sendReply, setReplyContent]
    )

    const value = useMemo(
      () => ({
        accounts,
        selectedAccount,
        groupAccounts,
        receivedMessages: threads,
        hasMoreMessages: hasNextPage ?? false,
        fetchMoreMessages: fetchNextPage,
        markThreadAsRead,
        getReplyContent,
        sendReply: sendReplyAndClear,
        setReplyContent
      }),
      [
        accounts,
        groupAccounts,
        selectedAccount,
        threads,
        hasNextPage,
        fetchNextPage,
        markThreadAsRead,
        getReplyContent,
        sendReplyAndClear,
        setReplyContent
      ]
    )

    return (
      <MessageContext.Provider value={value}>
        {children}
      </MessageContext.Provider>
    )
  }
)
