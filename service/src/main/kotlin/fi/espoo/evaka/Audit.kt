// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka

import fi.espoo.evaka.shared.Id
import fi.espoo.voltti.logging.loggers.audit
import io.github.oshai.kotlinlogging.KotlinLogging
import java.util.UUID
import kotlin.reflect.KProperty1

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
    private val securityLevel: String = "low",
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
    ApplicationReadMetadata,
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
    AssistanceNeedDecisionReadMetadata,
    AssistanceNeedPreschoolDecisionReadMetadata,
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
    AttachmentsUploadForInvoice,
    AttachmentsUploadForMessage,
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
    CalendarEventChildTimesCancellation,
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
    ChildAssistanceNeedDecisionDownloadEmployee,
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
    ChildAssistanceNeedPreschoolDecisionDownloadEmployee,
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
    ChildAttendanceReportRead,
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
    ChildDocumentArchive,
    ChildDocumentDownload,
    ChildDocumentMarkRead,
    ChildDocumentNextStatus,
    ChildDocumentPrevStatus,
    ChildDocumentPublish,
    ChildDocumentRead,
    ChildDocumentReadMetadata,
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
    ChildBasicInfoRead,
    ChildDocumentsReportRead,
    ChildDocumentsReportTemplatesRead,
    ChildSensitiveInfoRead,
    ChildServiceApplicationsRead,
    ChildServiceApplicationAccept,
    ChildServiceApplicationReject,
    ChildStickyNoteCreate,
    ChildStickyNoteUpdate,
    ChildStickyNoteDelete,
    CitizenChildrenRead(securityEvent = true, securityLevel = "high"),
    CitizenChildServiceApplicationsCreate,
    CitizenChildServiceApplicationsRead,
    CitizenChildServiceApplicationsDelete,
    CitizenChildServiceNeedOptionsRead,
    CitizenChildServiceNeedRead(securityEvent = true, securityLevel = "high"),
    CitizenChildAttendanceSummaryRead(securityEvent = true, securityLevel = "high"),
    CitizenChildDailyServiceTimeRead(securityEvent = true, securityLevel = "high"),
    CitizenEmailVerificationStatusRead,
    CitizenFeeDecisionDownloadPdf,
    CitizenNotificationSettingsRead,
    CitizenNotificationSettingsUpdate,
    CitizenLogin(securityEvent = true, securityLevel = "high"),
    CitizenCredentialsUpdate(securityEvent = true, securityLevel = "high"),
    CitizenCredentialsUpdateAttempt(securityEvent = true, securityLevel = "high"),
    CitizenUserDetailsRead(securityEvent = true, securityLevel = "high"),
    CitizenWeakLogin(securityEvent = true, securityLevel = "high"),
    CitizenWeakLoginAttempt(securityEvent = true, securityLevel = "high"),
    CitizenSendVerificationCode,
    CitizenVerifyEmail(securityEvent = true, securityLevel = "high"),
    CitizenVerifyEmailAttempt(securityEvent = true, securityLevel = "high"),
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
    DocumentTemplateForceUnpublish,
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
    EmployeeDeleteScheduledDaycareRole(securityEvent = true, securityLevel = "high"),
    EmployeeLogin(securityEvent = true, securityLevel = "high"),
    EmployeeSfiLoginAttempt(securityEvent = true, securityLevel = "high"),
    EmployeeSfiLogin(securityEvent = true, securityLevel = "high"),
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
    FeeDecisionReadMetadata,
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
    FinanceNoteCreate,
    FinanceNoteUpdate,
    FinanceNoteDelete,
    FinanceNoteRead,
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
    HolidayPeriodAttendanceReport,
    HolidayAbsenceCreate,
    IncomeExpirationDatesRead,
    IncomeStatementCreate,
    IncomeStatementCreateForChild,
    IncomeStatementDelete,
    IncomeStatementRead,
    IncomeStatementUpdate,
    IncomeStatementUpdateHandled,
    IncomeStatementsAwaitingHandler,
    IncomeStatementsOfPerson,
    IncomeStatementsOfChild,
    IncomeStatementStartDates,
    IncomeStatementStartDatesOfChild,
    IncompleteIncomeReportRead,
    InvoiceCorrectionsCreate,
    InvoiceCorrectionsDelete,
    InvoiceCorrectionsNoteUpdate,
    InvoiceCorrectionsRead,
    InvoicesCreate,
    InvoicesCreateReplacementDrafts,
    InvoicesDeleteDrafts,
    InvoicesMarkSent,
    InvoicesMarkReplacementDraftSent,
    InvoicesRead,
    InvoicesReportRead,
    InvoicesSearch,
    InvoicesSend,
    InvoicesSendByDate,
    InvoicesUpdate,
    ManualDuplicationReportRead,
    MealReportRead,
    MessagingMyAccountsRead,
    MessagingUnreadMessagesRead,
    MessagingMarkMessagesReadWrite,
    MessagingArchiveMessageWrite,
    MessagingChangeFolder,
    MessagingMessageReceiversRead,
    MessagingReceivedMessagesRead,
    MessagingReceivedMessageCopiesRead,
    MessagingMessagesInFolderRead,
    MessagingMessageFoldersRead,
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
    OutOfOfficeRead,
    OutOfOfficeUpdate,
    OutOfOfficeDelete,
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
    PaymentsSearch,
    PaymentsConfirmDrafts,
    PaymentsCreate,
    PaymentsDeleteDrafts,
    PaymentsRevertToDrafts,
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
    PlacementTool,
    PlacementToolValidate,
    PreschoolAbsenceReport,
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
    SendJamixOrders,
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
    StaffOpenAttendanceRead,
    StartingPlacementsReportRead,
    SystemNotificationsSet,
    SystemNotificationsDelete,
    SystemNotificationsReadAll,
    SystemNotificationsReadCitizen,
    SystemNotificationsReadEmployeeMobile,
    TampereRegionalSurveyMonthly,
    TampereRegionalSurveyYearly,
    TampereRegionalSurveyAgeStatistics,
    TemporaryEmployeesRead,
    TemporaryEmployeeCreate,
    TemporaryEmployeeRead,
    TemporaryEmployeeUpdate,
    TemporaryEmployeeDeleteAcl,
    TemporaryEmployeeDelete,
    TimelineRead,
    TitaniaReportDelete,
    TitaniaReportRead,
    UnitAclCreate,
    UnitAclDelete,
    UnitAclDeleteScheduled,
    UnitAclRead,
    UnitScheduledAclRead,
    UnitApplicationsRead,
    UnitServiceApplicationsRead,
    UnitAttendanceReservationsRead,
    UnitCalendarEventsRead,
    UnitFeaturesRead,
    UnitFeaturesUpdate,
    UnitServiceWorkerNoteRead,
    UnitServiceWorkerNoteSet,
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
    VoucherValueDecisionHeadOfFamilyCreateRetroactive,
    VoucherValueDecisionHeadOfFamilyRead,
    VoucherValueDecisionIgnore,
    VoucherValueDecisionMarkSent,
    VoucherValueDecisionPdfRead,
    VoucherValueDecisionRead,
    VoucherValueDecisionReadMetadata,
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
        meta: Map<String, Any?> = emptyMap(),
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

data class AuditChange(val old: Any?, val new: Any?)

/** Returns changes between given objects for audit logging */
fun <T> changes(
    old: T,
    new: T,
    fields: Pair<KProperty1<T, Any?>, Map<String, KProperty1<T, Any?>>>,
): Map<String, AuditChange> {
    val changes =
        fields.second
            .mapNotNull { (name, property) ->
                val oldValue = property.get(old)
                val newValue = property.get(new)
                if (oldValue != newValue) name to AuditChange(old = oldValue, new = newValue)
                else null
            }
            .toMap()
    return mapOf("id" to AuditChange(old = fields.first.get(old), new = fields.first.get(new))) +
        changes
}
