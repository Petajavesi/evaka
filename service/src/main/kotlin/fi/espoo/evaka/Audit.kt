// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka

import fi.espoo.evaka.shared.Id
import fi.espoo.voltti.logging.loggers.audit
import java.util.UUID
import mu.KotlinLogging

sealed interface AuditId {
    val value: Any

    @JvmInline value class One(override val value: Any) : AuditId

    @JvmInline value class Many(override val value: List<Any>) : AuditId

    companion object {
        operator fun invoke(value: Id<*>): AuditId = One(value)

        operator fun invoke(value: UUID): AuditId = One(value)

        operator fun invoke(value: String): AuditId = One(value)

        operator fun invoke(value: Collection<Id<*>>): AuditId = Many(value.toList())
    }
}

enum class Audit(
    private val securityEvent: Boolean = false,
    private val securityLevel: String = "low"
) {
    AbsenceCitizenCreate,
    AbsenceRead,
    AbsenceDelete,
    AbsenceDeleteRange,
    AbsenceUpsert,
    AddressPageDownloadPdf,
    ApplicationAdminDetailsUpdate,
    ApplicationCancel,
    ApplicationConfirmDecisionsMailed,
    ApplicationCreate,
    ApplicationDelete,
    ApplicationRead,
    ApplicationReadNotifications,
    ApplicationReadDuplicates,
    ApplicationReadActivePlacementsByType,
    ApplicationReturnToSent,
    ApplicationReturnToWaitingPlacement,
    ApplicationReturnToWaitingDecision,
    ApplicationSearch,
    ApplicationSend,
    ApplicationSendDecisionsWithoutProposal,
    ApplicationUpdate,
    ApplicationVerify,
    ApplicationsReportRead,
    AssistanceActionOptionsRead,
    AssistanceBasisOptionsRead,
    AssistanceFactorCreate,
    AssistanceFactorUpdate,
    AssistanceFactorDelete,
    AssistanceNeedDecisionsListCitizen,
    AssistanceNeedDecisionsReportRead,
    AssistanceNeedDecisionsReportUnreadCount,
    AssistanceNeedPreschoolDecisionsListCitizen,
    AssistanceNeedsReportRead,
    AssistanceNeedsReportByChildRead,
    AttachmentsDelete,
    AttachmentsRead,
    AttachmentsUploadForApplication,
    AttachmentsUploadForFeeAlteration,
    AttachmentsUploadForIncome,
    AttachmentsUploadForIncomeStatement,
    AttachmentsUploadForMessageDraft,
    AttachmentsUploadForPedagogicalDocument,
    AttendanceReservationCitizenCreate,
    AttendanceReservationCitizenRead,
    AttendanceReservationDelete,
    AttendanceReservationEmployeeCreate,
    AttendanceReservationReportRead,
    BackupCareDelete,
    BackupCareUpdate,
    CalendarEventCreate,
    CalendarEventDelete,
    CalendarEventRead,
    CalendarEventUpdate,
    CalendarEventTimeCreate,
    CalendarEventTimeDelete,
    CalendarEventTimeRead,
    CalendarEventTimeReservationCreate,
    CalendarEventTimeReservationDelete,
    CalendarEventTimeReservationUpdate,
    ChildAdditionalInformationRead,
    ChildAdditionalInformationUpdate,
    ChildAgeLanguageReportRead,
    ChildAssistanceActionCreate,
    ChildAssistanceActionDelete,
    ChildAssistanceActionUpdate,
    ChildAssistanceNeedCreate,
    ChildAssistanceNeedDelete,
    ChildAssistanceNeedUpdate,
    ChildAssistanceNeedDecisionAnnul,
    ChildAssistanceNeedDecisionCreate,
    ChildAssistanceNeedDecisionDelete,
    ChildAssistanceNeedDecisionDownloadCitizen,
    ChildAssistanceNeedDecisionGetUnreadCountCitizen,
    ChildAssistanceNeedDecisionMarkReadCitizen,
    ChildAssistanceNeedDecisionRead,
    ChildAssistanceNeedDecisionReadDecisionMakerOptions,
    ChildAssistanceNeedDecisionReadCitizen,
    ChildAssistanceNeedDecisionUpdate,
    ChildAssistanceNeedDecisionsList,
    ChildAssistanceNeedDecisionSend,
    ChildAssistanceNeedDecisionRevertToUnsent,
    ChildAssistanceNeedDecisionDecide,
    ChildAssistanceNeedDecisionOpened,
    ChildAssistanceNeedDecisionUpdateDecisionMaker,
    ChildAssistanceNeedPreschoolDecisionAnnul,
    ChildAssistanceNeedPreschoolDecisionCreate,
    ChildAssistanceNeedPreschoolDecisionDelete,
    ChildAssistanceNeedPreschoolDecisionDownloadCitizen,
    ChildAssistanceNeedPreschoolDecisionGetUnreadCountCitizen,
    ChildAssistanceNeedPreschoolDecisionMarkReadCitizen,
    ChildAssistanceNeedPreschoolDecisionRead,
    ChildAssistanceNeedPreschoolDecisionReadDecisionMakerOptions,
    ChildAssistanceNeedPreschoolDecisionReadCitizen,
    ChildAssistanceNeedPreschoolDecisionUpdate,
    ChildAssistanceNeedPreschoolDecisionsList,
    ChildAssistanceNeedPreschoolDecisionSend,
    ChildAssistanceNeedPreschoolDecisionRevertToUnsent,
    ChildAssistanceNeedPreschoolDecisionDecide,
    ChildAssistanceNeedPreschoolDecisionOpened,
    ChildAssistanceNeedPreschoolDecisionUpdateDecisionMaker,
    ChildAssistanceNeedVoucherCoefficientCreate,
    ChildAssistanceNeedVoucherCoefficientRead,
    ChildAssistanceNeedVoucherCoefficientUpdate,
    ChildAssistanceNeedVoucherCoefficientDelete,
    ChildAttendanceChildrenRead,
    ChildAttendanceStatusesRead,
    ChildAttendancesUpsert,
    ChildAttendancesArrivalCreate,
    ChildAttendancesDepartureRead,
    ChildAttendancesDepartureCreate,
    ChildAttendancesFullDayAbsenceCreate,
    ChildAttendancesFullDayAbsenceDelete,
    ChildAttendancesAbsenceRangeCreate,
    ChildAttendancesReturnToComing,
    ChildAttendancesReturnToPresent,
    ChildBackupCareCreate,
    ChildBackupCareRead,
    ChildBackupPickupCreate,
    ChildBackupPickupDelete,
    ChildBackupPickupRead,
    ChildBackupPickupUpdate,
    ChildDailyNoteCreate,
    ChildDailyNoteUpdate,
    ChildDailyNoteDelete,
    ChildDailyServiceTimesDelete,
    ChildDailyServiceTimesEdit,
    ChildDailyServiceTimesRead,
    ChildDailyServiceTimeNotificationsRead,
    ChildDailyServiceTimeNotificationsDismiss,
    ChildDatePresenceUpsert,
    ChildDatePresenceExpectedAbsencesCheck,
    ChildDocumentCreate,
    ChildDocumentDelete,
    ChildDocumentDownload,
    ChildDocumentMarkRead,
    ChildDocumentNextStatus,
    ChildDocumentPrevStatus,
    ChildDocumentPublish,
    ChildDocumentRead,
    ChildDocumentTryTakeLockOnContent,
    ChildDocumentUnreadCount,
    ChildDocumentUpdateContent,
    ChildFeeAlterationsCreate,
    ChildFeeAlterationsDelete,
    ChildFeeAlterationsRead,
    ChildFeeAlterationsUpdate,
    ChildrenInDifferentAddressReportRead,
    ChildImageDelete,
    ChildImageDownload,
    ChildImageUpload,
    ChildConfirmedRangeReservationsRead,
    ChildConfirmedRangeReservationsUpdate,
    ChildReservationStatusRead,
    ChildSensitiveInfoRead,
    ChildStickyNoteCreate,
    ChildStickyNoteUpdate,
    ChildStickyNoteDelete,
    ChildVasuDocumentsRead,
    ChildVasuDocumentsReadByGuardian,
    CitizenChildrenRead(securityEvent = true, securityLevel = "high"),
    CitizenChildServiceNeedRead(securityEvent = true, securityLevel = "high"),
    CitizenChildAttendanceSummaryRead(securityEvent = true, securityLevel = "high"),
    CitizenChildDailyServiceTimeRead(securityEvent = true, securityLevel = "high"),
    CitizenFeeDecisionDownloadPdf,
    CitizenNotificationSettingsRead,
    CitizenNotificationSettingsUpdate,
    CitizenLogin(securityEvent = true, securityLevel = "high"),
    CitizenUserDetailsRead(securityEvent = true, securityLevel = "high"),
    CitizenVoucherValueDecisionDownloadPdf,
    ClubTermCreate,
    ClubTermUpdate,
    ClubTermDelete,
    ClubTermRead,
    CustomerFeesReportRead,
    DaycareAssistanceCreate,
    DaycareAssistanceUpdate,
    DaycareAssistanceDelete,
    DaycareGroupPlacementCreate,
    DaycareGroupPlacementDelete,
    DaycareGroupPlacementTransfer,
    DaycareBackupCareRead,
    DecisionAccept,
    DecisionDownloadPdf,
    DecisionDraftRead,
    DecisionDraftUpdate,
    DecisionRead,
    DecisionReadByApplication,
    DecisionReject,
    DecisionsReportRead,
    DuplicatePeopleReportRead,
    DocumentTemplateCopy,
    DocumentTemplateCreate,
    DocumentTemplateDelete,
    DocumentTemplatePublish,
    DocumentTemplateRead,
    DocumentTemplateUpdateBasics,
    DocumentTemplateUpdateContent,
    DocumentTemplateUpdateValidity,
    EmployeeActivate(securityEvent = true, securityLevel = "high"),
    EmployeeCreate(securityEvent = true, securityLevel = "high"),
    EmployeeDeactivate(securityEvent = true),
    EmployeeDelete(securityEvent = true, securityLevel = "high"),
    EmployeeDeleteDaycareRoles(securityEvent = true, securityLevel = "high"),
    EmployeeLogin(securityEvent = true, securityLevel = "high"),
    EmployeeRead(securityEvent = true),
    EmployeeUpdateDaycareRoles(securityEvent = true, securityLevel = "high"),
    EmployeeUpdateGlobalRoles(securityEvent = true, securityLevel = "high"),
    EmployeePreferredFirstNameRead,
    EmployeePreferredFirstNameUpdate,
    EmployeeUserDetailsRead(securityEvent = true, securityLevel = "high"),
    EmployeesRead(securityEvent = true),
    EndedPlacementsReportRead,
    FamilyConflictReportRead,
    FamilyContactReportRead,
    FamilyContactsRead,
    FamilyContactsUpdate,
    FamilyDaycareMealReport,
    FeeDecisionConfirm,
    FeeDecisionGenerate,
    FeeDecisionHeadOfFamilyRead,
    FeeDecisionHeadOfFamilyCreateRetroactive,
    FeeDecisionIgnore,
    FeeDecisionLiableCitizenRead,
    FeeDecisionMarkSent,
    FeeDecisionPdfRead,
    FeeDecisionRead,
    FeeDecisionSearch,
    FeeDecisionSetType,
    FeeDecisionUnignore,
    FinanceBasicsFeeThresholdsRead,
    FinanceBasicsFeeThresholdsCreate,
    FinanceBasicsFeeThresholdsUpdate,
    FinanceBasicsVoucherValueCreate,
    FinanceBasicsVoucherValueUpdate,
    FinanceBasicsVoucherValueDelete,
    FinanceBasicsVoucherValuesRead,
    FinanceDecisionHandlersRead,
    FinanceDecisionCitizenRead,
    FosterParentCreateRelationship,
    FosterParentDeleteRelationship,
    FosterParentReadChildren,
    FosterParentReadParents,
    FosterParentUpdateRelationship,
    FuturePreschoolers,
    GuardianChildrenRead,
    GroupCalendarEventsRead,
    GroupDiscussionReservationCalendarDaysRead,
    GroupNoteCreate,
    GroupNoteUpdate,
    GroupNoteDelete,
    GroupNoteRead,
    HolidayPeriodCreate,
    HolidayPeriodRead,
    HolidayPeriodDelete,
    HolidayPeriodsList,
    HolidayPeriodUpdate,
    HolidayQuestionnairesList,
    HolidayQuestionnaireRead,
    HolidayQuestionnaireCreate,
    HolidayQuestionnaireUpdate,
    HolidayQuestionnaireDelete,
    HolidayAbsenceCreate,
    IncomeExpirationDatesRead,
    IncomeStatementCreate,
    IncomeStatementCreateForChild,
    IncomeStatementDelete,
    IncomeStatementDeleteOfChild,
    IncomeStatementReadOfPerson,
    IncomeStatementReadOfChild,
    IncomeStatementUpdate,
    IncomeStatementUpdateForChild,
    IncomeStatementUpdateHandled,
    IncomeStatementsAwaitingHandler,
    IncomeStatementsOfPerson,
    IncomeStatementsOfChild,
    IncomeStatementStartDates,
    IncomeStatementStartDatesOfChild,
    InvoiceCorrectionsCreate,
    InvoiceCorrectionsDelete,
    InvoiceCorrectionsNoteUpdate,
    InvoiceCorrectionsRead,
    InvoicesCreate,
    InvoicesDeleteDrafts,
    InvoicesMarkSent,
    InvoicesRead,
    InvoicesReportRead,
    InvoicesSearch,
    InvoicesSend,
    InvoicesSendByDate,
    InvoicesUpdate,
    ManualDuplicationReportRead,
    MealReportRead,
    MessagingBlocklistEdit,
    MessagingBlocklistRead,
    MessagingMyAccountsRead,
    MessagingUnreadMessagesRead,
    MessagingMarkMessagesReadWrite,
    MessagingArchiveMessageWrite,
    MessagingMessageReceiversRead,
    MessagingReceivedMessagesRead,
    MessagingReceivedMessageCopiesRead,
    MessagingMessagesInFolderRead,
    MessagingSentMessagesRead,
    MessagingNewMessagePreflightCheck,
    MessagingNewMessageWrite,
    MessagingDraftsRead,
    MessagingCreateDraft,
    MessagingUpdateDraft,
    MessagingDeleteDraft,
    MessagingReplyToMessageWrite,
    MessagingCitizenFetchReceiversForAccount,
    MessagingCitizenSendMessage,
    MessagingUndoMessage,
    MessagingUndoMessageReply,
    MessagingMessageThreadRead,
    MissingHeadOfFamilyReportRead,
    MissingServiceNeedReportRead,
    MobileDevicesList,
    MobileDevicesRead,
    MobileDevicesRename,
    MobileDevicesDelete,
    NonSsnChildrenReport,
    NoteCreate,
    NoteDelete,
    NoteRead,
    NoteUpdate,
    NotesByGroupRead,
    OccupancyGroupReportRead,
    OccupancyRead,
    OccupancyReportRead,
    OccupancySpeculatedRead,
    OtherAssistanceMeasureCreate,
    OtherAssistanceMeasureUpdate,
    OtherAssistanceMeasureDelete,
    PairingInit(securityEvent = true),
    PairingChallenge(securityEvent = true),
    PairingResponse(securityEvent = true, securityLevel = "high"),
    PairingValidation(securityEvent = true, securityLevel = "high"),
    PairingStatusRead,
    ParentShipsCreate,
    ParentShipsDelete,
    ParentShipsRead,
    ParentShipsRetry,
    ParentShipsUpdate,
    PartnerShipsCreate,
    PartnerShipsDelete,
    PartnerShipsRead,
    PartnerShipsRetry,
    PartnerShipsUpdate,
    PartnersInDifferentAddressReportRead,
    PatuReportSend,
    PaymentsCreate,
    PaymentsDeleteDrafts,
    PaymentsSend,
    PedagogicalDocumentCreate(securityEvent = true, securityLevel = "high"),
    PedagogicalDocumentCountUnread,
    PedagogicalDocumentReadByGuardian(securityEvent = true, securityLevel = "high"),
    PedagogicalDocumentRead(securityEvent = true, securityLevel = "high"),
    PedagogicalDocumentUpdate(securityEvent = true, securityLevel = "high"),
    PersonalDataUpdate(securityEvent = true, securityLevel = "high"),
    PersonCreate(securityEvent = true, securityLevel = "high"),
    PersonDelete(securityEvent = true, securityLevel = "high"),
    PersonDependantRead(securityEvent = true, securityLevel = "high"),
    PersonGuardianRead(securityEvent = true, securityLevel = "high"),
    PersonBlockedGuardiansRead(securityEvent = true, securityLevel = "high"),
    PersonDetailsRead(securityEvent = true, securityLevel = "high"),
    PersonDetailsSearch,
    PersonDuplicate,
    PersonIncomeCreate,
    PersonIncomeDelete,
    PersonIncomeRead,
    PersonIncomeUpdate,
    PersonIncomeNotificationRead,
    PersonMerge(securityEvent = true, securityLevel = "high"),
    PersonUpdate(securityEvent = true, securityLevel = "high"),
    PersonUpdateEvakaRights(securityEvent = true, securityLevel = "high"),
    PersonVtjFamilyUpdate,
    PinCodeLockedRead,
    PinCodeUpdate,
    PinLogin,
    PisFamilyRead,
    PlacementCancel,
    PlacementCountReportRead,
    PlacementCreate,
    PlacementSketchingReportRead,
    PlacementPlanCreate,
    PlacementPlanRespond,
    PlacementPlanDraftRead,
    PlacementPlanSearch,
    PlacementProposalCreate,
    PlacementProposalAccept,
    PlacementSearch,
    PlacementUpdate,
    PlacementServiceNeedCreate,
    PlacementServiceNeedDelete,
    PlacementServiceNeedUpdate,
    PlacementTerminate,
    PlacementChildPlacementPeriodsRead,
    PreschoolAssistanceCreate,
    PreschoolAssistanceUpdate,
    PreschoolAssistanceDelete,
    PreschoolTermCreate,
    PreschoolTermUpdate,
    PreschoolTermDelete,
    PreschoolTermRead,
    PresenceReportRead,
    PushSettingsRead,
    PushSettingsSet,
    PushSubscriptionUpsert,
    RawReportRead,
    ServiceNeedOptionsRead,
    ServiceNeedReportRead,
    SettingsRead,
    SettingsUpdate,
    SpecialDietsRead,
    SpecialDietsUpdate,
    MealTexturesRead,
    ServiceWorkerNoteUpdate,
    SextetReportRead,
    UnitStaffAttendanceRead,
    StaffAttendanceArrivalCreate,
    StaffAttendanceArrivalExternalCreate,
    StaffAttendanceDepartureCreate,
    StaffAttendanceDepartureExternalCreate,
    StaffAttendanceRead,
    StaffAttendanceUpdate,
    StaffAttendanceDelete,
    StaffAttendanceExternalDelete,
    StaffAttendanceExternalUpdate,
    StaffOccupancyCoefficientRead,
    StaffOccupancyCoefficientUpsert,
    StartingPlacementsReportRead,
    TemporaryEmployeesRead,
    TemporaryEmployeeCreate,
    TemporaryEmployeeRead,
    TemporaryEmployeeUpdate,
    TemporaryEmployeeDeleteAcl,
    TemporaryEmployeeDelete,
    TimelineRead,
    UnitAclCreate,
    UnitAclDelete,
    UnitAclRead,
    UnitApplicationsRead,
    UnitAttendanceReservationsRead,
    UnitCalendarEventsRead,
    UnitFeaturesRead,
    UnitFeaturesUpdate,
    UnitGroupAclUpdate,
    UnitGroupsCreate,
    UnitGroupsUpdate,
    UnitGroupsDelete,
    UnitGroupsSearch,
    UnitGroupsCaretakersCreate,
    UnitGroupsCaretakersDelete,
    UnitGroupsCaretakersRead,
    UnitGroupsCaretakersUpdate,
    UnitCreate,
    UnitCounters,
    UnitRead,
    UnitDailyReservationStatistics,
    UnitSearch,
    UnitUpdate,
    UnitView,
    UnitsReportRead,
    VardaReportRead,
    VardaReportOperations,
    VardaUnitReportRead,
    VasuDocumentCreate,
    VasuDocumentRead,
    VasuDocumentReadByGuardian,
    VasuDocumentGivePermissionToShareByGuardian,
    VasuDocumentUpdate,
    VasuDocumentDelete,
    VasuDocumentEventCreate,
    VasuTemplateCreate,
    VasuTemplateCopy,
    VasuTemplateEdit,
    VasuTemplateDelete,
    VasuTemplateRead,
    VasuTemplateUpdate,
    VasuTemplateMigrate,
    VoucherValueDecisionHeadOfFamilyCreateRetroactive,
    VoucherValueDecisionHeadOfFamilyRead,
    VoucherValueDecisionIgnore,
    VoucherValueDecisionMarkSent,
    VoucherValueDecisionPdfRead,
    VoucherValueDecisionRead,
    VoucherValueDecisionSearch,
    VoucherValueDecisionSend,
    VoucherValueDecisionSetType,
    VoucherValueDecisionUnignore;

    private val eventCode = name

    class UseNamedArguments private constructor()

    fun log(
        // This is a hack to force passing all real parameters by name
        @Suppress("UNUSED_PARAMETER") vararg forceNamed: UseNamedArguments,
        targetId: AuditId? = null,
        objectId: AuditId? = null,
        meta: Map<String, Any?> = emptyMap()
    ) {
        logger.audit(
            mapOf(
                "eventCode" to eventCode,
                "targetId" to targetId?.value,
                "objectId" to objectId?.value,
                "securityLevel" to securityLevel,
                "securityEvent" to securityEvent,
            ) + if (meta.isNotEmpty()) mapOf("meta" to meta) else emptyMap()
        ) {
            eventCode
        }
    }
}

private val logger = KotlinLogging.logger {}
