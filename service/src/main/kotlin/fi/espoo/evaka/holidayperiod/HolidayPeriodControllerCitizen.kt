// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.holidayperiod

import fi.espoo.evaka.Audit
import fi.espoo.evaka.AuditId
import fi.espoo.evaka.absence.AbsenceType
import fi.espoo.evaka.absence.FullDayAbsenseUpsert
import fi.espoo.evaka.absence.clearOldCitizenEditableAbsences
import fi.espoo.evaka.absence.upsertFullDayAbsences
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.placement.getConsecutivePlacementRanges
import fi.espoo.evaka.reservations.clearOldReservations
import fi.espoo.evaka.reservations.deleteAbsencesCreatedFromQuestionnaire
import fi.espoo.evaka.reservations.getReservableRange
import fi.espoo.evaka.shared.ChildId
import fi.espoo.evaka.shared.FeatureConfig
import fi.espoo.evaka.shared.HolidayQuestionnaireId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.BadRequest
import fi.espoo.evaka.shared.domain.EvakaClock
import fi.espoo.evaka.shared.domain.FiniteDateRange
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.shared.security.AccessControl
import fi.espoo.evaka.shared.security.Action
import java.time.LocalDate
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class ActiveQuestionnaire(
    val questionnaire: HolidayQuestionnaire,
    val eligibleChildren: Map<ChildId, List<FiniteDateRange>>,
    val previousAnswers: List<HolidayQuestionnaireAnswer>,
)

@RestController
@RequestMapping("/citizen/holiday-period")
class HolidayPeriodControllerCitizen(
    private val accessControl: AccessControl,
    private val featureConfig: FeatureConfig,
) {
    @GetMapping
    fun getHolidayPeriods(
        db: Database,
        user: AuthenticatedUser.Citizen,
        clock: EvakaClock,
    ): List<HolidayPeriod> {
        return db.connect { dbc ->
                dbc.read {
                    accessControl.requirePermissionFor(
                        it,
                        user,
                        clock,
                        Action.Global.READ_HOLIDAY_PERIODS,
                    )
                    it.getHolidayPeriods()
                }
            }
            .also { Audit.HolidayPeriodsList.log(meta = mapOf("count" to it.size)) }
    }

    @GetMapping("/questionnaire")
    fun getActiveQuestionnaires(
        db: Database,
        user: AuthenticatedUser.Citizen,
        clock: EvakaClock,
    ): List<ActiveQuestionnaire> {
        return db.connect { dbc ->
                dbc.read { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Global.READ_ACTIVE_HOLIDAY_QUESTIONNAIRES,
                    )
                    val activeQuestionnaire =
                        when (featureConfig.holidayQuestionnaireType) {
                            QuestionnaireType.FIXED_PERIOD ->
                                tx.getActiveFixedPeriodQuestionnaire(clock.today())
                            QuestionnaireType.OPEN_RANGES ->
                                tx.getActiveOpenRangesQuestionnaire(clock.today())
                        } ?: return@read listOf()

                    val eligibleChildren =
                        getEligibleChildren(tx, user, clock.today(), activeQuestionnaire)
                    if (eligibleChildren.isEmpty()) {
                        listOf()
                    } else {
                        listOf(
                            ActiveQuestionnaire(
                                questionnaire = activeQuestionnaire,
                                eligibleChildren = eligibleChildren,
                                previousAnswers =
                                    tx.getQuestionnaireAnswers(
                                        activeQuestionnaire.id,
                                        eligibleChildren.keys.toList(),
                                    ),
                            )
                        )
                    }
                }
            }
            .also { Audit.HolidayQuestionnairesList.log(meta = mapOf("count" to it.size)) }
    }

    @PostMapping("/questionnaire/fixed-period/{id}")
    fun answerFixedPeriodQuestionnaire(
        db: Database,
        user: AuthenticatedUser.Citizen,
        clock: EvakaClock,
        @PathVariable id: HolidayQuestionnaireId,
        @RequestBody body: FixedPeriodsBody,
    ) {
        val now = clock.now()
        val today = now.toLocalDate()
        val childIds = body.fixedPeriods.keys

        db.connect { dbc ->
            dbc.transaction { tx ->
                accessControl.requirePermissionFor(
                    tx,
                    user,
                    clock,
                    Action.Citizen.Child.CREATE_HOLIDAY_ABSENCE,
                    childIds,
                )
                val questionnaire =
                    tx.getFixedPeriodQuestionnaire(id)?.also {
                        if (!it.active.includes(today))
                            throw BadRequest("Questionnaire is not open")
                    } ?: throw BadRequest("Questionnaire not found")
                validate(
                    questionnaire,
                    tx,
                    today,
                    user,
                    body.fixedPeriods.mapValues { (_, period) -> period?.let { listOf(it) } },
                )

                val absences =
                    body.fixedPeriods.entries.flatMap { (childId, period) ->
                        period?.dates()?.map {
                            FullDayAbsenseUpsert(
                                childId = childId,
                                date = it,
                                absenceType = questionnaire.absenceType,
                                questionnaireId = questionnaire.id,
                            )
                        } ?: emptySequence()
                    }

                upsertAbsences(tx, now, user, absences, questionnaire, childIds)
                tx.insertQuestionnaireAnswers(
                    user.id,
                    body.fixedPeriods.entries.map { (childId, period) ->
                        HolidayQuestionnaireAnswer(questionnaire.id, childId, period, listOf())
                    },
                )
            }
        }
        Audit.HolidayAbsenceCreate.log(targetId = AuditId(id), objectId = AuditId(childIds.toSet()))
    }

    @PostMapping("/questionnaire/open-range/{id}")
    fun answerOpenRangeQuestionnaire(
        db: Database,
        user: AuthenticatedUser.Citizen,
        clock: EvakaClock,
        @PathVariable id: HolidayQuestionnaireId,
        @RequestBody body: OpenRangesBody,
    ) {
        val now = clock.now()
        val today = now.toLocalDate()
        val childIds = body.openRanges.keys

        db.connect { dbc ->
            dbc.transaction { tx ->
                accessControl.requirePermissionFor(
                    tx,
                    user,
                    clock,
                    Action.Citizen.Child.CREATE_HOLIDAY_ABSENCE,
                    childIds,
                )
                val questionnaire =
                    tx.getOpenRangesQuestionnaire(id)?.also {
                        if (!it.active.includes(today))
                            throw BadRequest("Questionnaire is not open")
                    } ?: throw BadRequest("Questionnaire not found")
                validate(questionnaire, tx, today, user, body.openRanges)

                val absences =
                    body.openRanges.entries.flatMap { (childId, ranges) ->
                        ranges.flatMap { range ->
                            range.dates().map {
                                FullDayAbsenseUpsert(
                                    childId = childId,
                                    date = it,
                                    absenceType =
                                        when {
                                            range.durationInDays() >=
                                                questionnaire.absenceTypeThreshold ->
                                                questionnaire.absenceType
                                            else -> AbsenceType.OTHER_ABSENCE
                                        },
                                    questionnaireId = questionnaire.id,
                                )
                            }
                        }
                    }

                upsertAbsences(tx, now, user, absences, questionnaire, childIds)
                tx.insertQuestionnaireAnswers(
                    user.id,
                    body.openRanges.entries.map { (childId, ranges) ->
                        HolidayQuestionnaireAnswer(questionnaire.id, childId, null, ranges)
                    },
                )
            }
        }
        Audit.HolidayAbsenceCreate.log(targetId = AuditId(id), objectId = AuditId(childIds.toSet()))
    }

    private fun validate(
        questionnaire: HolidayQuestionnaire,
        tx: Database.Transaction,
        today: LocalDate,
        user: AuthenticatedUser.Citizen,
        data: Map<ChildId, List<FiniteDateRange>?>,
    ) {
        val eligibleChildren = getEligibleChildren(tx, user, today, questionnaire)
        val invalid =
            data
                .mapNotNull { (childId, periods) ->
                    if (periods == null) {
                        return@mapNotNull null
                    }
                    val validPeriods =
                        eligibleChildren[childId] ?: return@mapNotNull childId to periods
                    val invalidPeriods =
                        periods.filterNot { period ->
                            validPeriods.any { validPeriod -> validPeriod.contains(period) }
                        }
                    if (invalidPeriods.isNotEmpty()) childId to invalidPeriods else null
                }
                .toMap()
        if (invalid.isNotEmpty()) {
            throw BadRequest(
                "Some children are not eligible to answer or invalid option provided ($invalid)"
            )
        }
    }

    private fun getEligibleChildren(
        tx: Database.Read,
        user: AuthenticatedUser.Citizen,
        date: LocalDate,
        questionnaire: HolidayQuestionnaire,
    ): Map<ChildId, List<FiniteDateRange>> {
        val continuousPlacementPeriod = questionnaire.conditions.continuousPlacement
        val eligibleChildren =
            if (continuousPlacementPeriod != null) {
                tx.getChildrenWithContinuousPlacement(date, user.id, continuousPlacementPeriod)
            } else {
                tx.getUserChildIds(date, user.id)
            }
        return when (questionnaire) {
            is HolidayQuestionnaire.FixedPeriodQuestionnaire -> {
                val periodOptions = questionnaire.periodOptions
                val min = periodOptions.minOf { it.start }
                val max = periodOptions.maxOf { it.end }
                val placementRangesByChild =
                    tx.getConsecutivePlacementRanges(
                        eligibleChildren,
                        PlacementType.invoiced,
                        FiniteDateRange(min, max),
                    )
                eligibleChildren.associateWith { childId ->
                    placementRangesByChild[childId]?.let { placementRanges ->
                        periodOptions.filter { option -> placementRanges.contains(option) }
                    } ?: emptyList()
                }
            }
            is HolidayQuestionnaire.OpenRangesQuestionnaire ->
                eligibleChildren.associateWith { listOf(questionnaire.period) }
        }
    }

    private fun upsertAbsences(
        tx: Database.Transaction,
        now: HelsinkiDateTime,
        user: AuthenticatedUser.Citizen,
        absences: List<FullDayAbsenseUpsert>,
        questionnaire: HolidayQuestionnaire,
        childIds: Set<ChildId>,
        config: FeatureConfig = featureConfig,
    ) {
        val reservableRange = getReservableRange(now, config.citizenReservationThresholdHours)

        absences
            .map { absence -> absence.childId to absence.date }
            .let {
                tx.clearOldReservations(it)
                tx.clearOldCitizenEditableAbsences(it, reservableRange)
            }
        tx.deleteAbsencesCreatedFromQuestionnaire(questionnaire.id, childIds)
        tx.upsertFullDayAbsences(user.evakaUserId, now, absences)
    }
}

data class FixedPeriodsBody(val fixedPeriods: Map<ChildId, FiniteDateRange?>)

data class OpenRangesBody(val openRanges: Map<ChildId, List<FiniteDateRange>>)
