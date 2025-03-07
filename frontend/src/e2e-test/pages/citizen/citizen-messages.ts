// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import FiniteDateRange from 'lib-common/finite-date-range'

import {
  Element,
  ElementCollection,
  FileInput,
  MultiSelect,
  Page,
  TextInput
} from '../../utils/page'

export class MockStrongAuthPage {
  constructor(private readonly page: Page) {}

  async login(ssn: string) {
    await this.page.find(`[id="${ssn}"]`).locator.check()
    await this.page.find('[type=submit]').findText('Kirjaudu').click()
    await this.page.find('[type=submit]').findText('Jatka').click()
    await this.page.findByDataQa('header-city-logo').waitUntilVisible()
    return new CitizenMessagesPage(this.page)
  }
}
export default class CitizenMessagesPage {
  messageReplyContent: TextInput
  #threadListItem: Element
  #threadTitle: Element
  #redactedThreadTitle: Element
  #strongAuthLink: Element
  #openReplyEditorButton: Element
  #openReplyEditorButtonHidden: Element
  #sendReplyButton: Element
  #messageEditor: Element
  discardMessageButton: Element
  #inboxEmpty: Element
  #threadContent: ElementCollection
  #threadUrgent: Element
  #threadChildren: ElementCollection
  newMessageButton: Element
  fileUpload: Element
  #threadOutOfOfficeInfo: Element
  markUnreadButton: Element
  constructor(private readonly page: Page) {
    this.messageReplyContent = new TextInput(
      page.findByDataQa('message-reply-content')
    )
    this.#threadListItem = page.findByDataQa('thread-list-item')
    this.#threadTitle = page.findByDataQa('thread-reader-title')
    this.#redactedThreadTitle = page.findByDataQa(
      'redacted-thread-reader-title'
    )
    this.#strongAuthLink = page.findByDataQa('strong-auth-link')
    this.#openReplyEditorButton = page.findByDataQa(`${this.replyButtonTag}`)
    this.#openReplyEditorButtonHidden = page.findByDataQa(
      `${this.replyButtonTag}-hidden`
    )
    this.#sendReplyButton = page.findByDataQa('message-send-btn')
    this.#messageEditor = page.findByDataQa('message-editor')
    this.discardMessageButton = page.findByDataQa('message-discard-btn')
    this.#inboxEmpty = page.find(
      '[data-qa="inbox-empty"][data-loading="false"]'
    )
    this.#threadContent = page.findAll('[data-qa="thread-reader-content"]')
    this.#threadUrgent = page
      .findByDataQa('thread-reader')
      .findByDataQa('urgent')
    this.#threadChildren = page
      .findByDataQa('thread-reader')
      .findAllByDataQa('thread-child')
    this.newMessageButton = page.findAllByDataQa('new-message-btn').first()
    this.fileUpload = page.findByDataQa('upload-message-attachment')
    this.#threadOutOfOfficeInfo = page
      .findByDataQa('thread-reader')
      .findByDataQa('out-of-office-info')
    this.markUnreadButton = page.findByDataQa('mark-unread-btn')
  }

  replyButtonTag = 'message-reply-editor-btn'

  async createNewMessage(): Promise<CitizenMessageEditor> {
    await this.newMessageButton.click()
    const editor = new CitizenMessageEditor(this.#messageEditor)
    await editor.waitUntilVisible()
    return editor
  }

  async getMessageCount() {
    return this.#threadContent.count()
  }

  async assertInboxIsEmpty() {
    await this.#inboxEmpty.waitUntilVisible()
  }

  async assertTimedNotification(dataQa: string, content: string) {
    await this.page.findByDataQa(dataQa).assertTextEquals(content)
  }

  async assertNewMessageButtonIsFocused() {
    await this.newMessageButton.assertFocused(true)
  }

  async assertAriaLiveExistsAndIncludesNotification() {
    await this.page
      .findByDataQa('notification-container')
      .assertAttributeEquals('aria-live', 'polite')
    await this.page
      .find(
        '[data-qa="notification-container"] > [data-qa=message-sent-notification]'
      )
      .assertTextEquals('Viesti lähetetty')
  }

  async assertThreadContent(message: {
    title: string
    content: string
    urgent?: boolean
    sensitive?: boolean
    childNames?: string[]
  }) {
    await this.#threadListItem.click()
    await this.#threadTitle.assertTextEquals(
      message.title + (message.sensitive ? ' (Arkaluontoinen viestiketju)' : '')
    )
    await this.#threadContent.only().assertTextEquals(message.content)
    if (message.urgent ?? false) {
      await this.#threadUrgent.waitUntilVisible()
    } else {
      await this.#threadUrgent.waitUntilHidden()
    }
    if (message.childNames) {
      await this.#threadChildren.assertTextsEqualAnyOrder(message.childNames)
    }
  }
  async assertThreadIsRedacted() {
    await this.#threadListItem.click()
    await this.#redactedThreadTitle.waitUntilVisible()
  }
  async assertOpenReplyEditorButtonIsHidden() {
    await this.#openReplyEditorButtonHidden.waitUntilAttached()
  }
  async openStrongAuthPage() {
    await this.#strongAuthLink.click()
    return new MockStrongAuthPage(this.page)
  }

  getThreadAttachmentCount(): Promise<number> {
    return this.page.findAll('[data-qa="attachment"]').count()
  }

  async openFirstThread() {
    await this.#threadListItem.click()
  }

  async discardReplyEditor() {
    await this.discardMessageButton.click()
  }

  async replyToFirstThread(content: string) {
    await this.startReplyToFirstThread()
    await this.messageReplyContent.fill(content)
    await this.sendReply()
  }
  async startReplyToFirstThread() {
    await this.#threadListItem.click()
    await this.#openReplyEditorButton.click()
  }
  async sendReply() {
    await this.#sendReplyButton.click()
    // the editor is hidden after sending the reply
    await this.#sendReplyButton.waitUntilHidden()
  }

  async getSessionExpiry() {
    const cookies = await this.page.page.context().cookies()
    const sessionCookie = cookies.find((c) => c.name === 'evaka.eugw.session')
    return sessionCookie?.expires ?? 0
  }

  async deleteFirstThread() {
    await this.#threadListItem.findByDataQa('delete-thread-btn').click()
  }

  async confirmThreadDeletion() {
    await this.page.findByDataQa('modal').findByDataQa('modal-okBtn').click()
  }

  async addAttachment() {
    const testFileName = 'test_file.png'
    const testFilePath = `src/e2e-test/assets/${testFileName}`
    await new FileInput(
      this.fileUpload.find('[data-qa="btn-upload-file"]')
    ).setInputFiles(testFilePath)
  }

  async sendNewMessage(
    title: string,
    content: string,
    childIds: string[],
    recipients: string[],
    addAttachment: boolean
  ) {
    const editor = await this.createNewMessage()
    if (childIds.length > 0) {
      await editor.selectChildren(childIds)
    }
    await editor.selectRecipients(recipients)
    await editor.fillMessage(title, content)

    if (addAttachment) {
      await this.addAttachment()
      await this.fileUpload
        .findByDataQa('file-download-button')
        .waitUntilVisible()
    }

    await editor.sendMessage()
  }

  async assertThreadOutOfOffice(ooo: {
    name: string
    period: FiniteDateRange
  }) {
    await this.#threadOutOfOfficeInfo.assertText(
      (t) => t.includes(ooo.name) && t.includes(ooo.period.format())
    )
  }
}

export class CitizenMessageEditor extends Element {
  readonly #recipientSelection = new MultiSelect(
    this.findByDataQa('select-recipient')
  )
  readonly title = new TextInput(this.findByDataQa('input-title'))
  readonly content = new TextInput(this.findByDataQa('input-content'))
  readonly #sendMessage = this.findByDataQa('send-message-btn')
  readonly #outOfOfficeInfo = this.findByDataQa('out-of-office-info')

  secondaryRecipient(name: string) {
    return this.find(`[data-qa="secondary-recipient"]`, { hasText: name })
  }

  async selectChildren(childIds: string[]) {
    for (const childId of childIds) {
      await this.findByDataQa(`child-${childId}`).click()
    }
  }
  async assertChildrenSelectable(childIds: string[]) {
    for (const childId of childIds) {
      await this.findByDataQa(`child-${childId}`).waitUntilVisible()
    }

    await this.findAllByDataQa('relevant-child').assertCount(childIds.length)
  }

  async selectRecipients(recipients: string[]) {
    await this.#recipientSelection.click()
    for (const recipient of recipients) {
      await this.#recipientSelection.fillAndSelectFirst(recipient)
    }
    await this.#recipientSelection.close()
  }

  async assertNoRecipients() {
    await this.#recipientSelection.click()
    await this.#recipientSelection.assertNoOptions()
  }

  async assertRecipients(recipients: string[]) {
    await this.#recipientSelection.click()
    await this.#recipientSelection.assertOptions(recipients)
  }

  async fillMessage(title: string, content: string) {
    await this.title.fill(title)
    await this.content.fill(content)
  }

  async sendMessage() {
    await this.#sendMessage.click()
    await this.waitUntilHidden()
  }

  async assertOutOfOffice(ooo: { name: string; period: FiniteDateRange }) {
    await this.#outOfOfficeInfo.assertText(
      (t) => t.includes(ooo.name) && t.includes(ooo.period.format())
    )
  }

  async assertNoOutOfOffice() {
    await this.#outOfOfficeInfo.waitUntilHidden()
  }
}
