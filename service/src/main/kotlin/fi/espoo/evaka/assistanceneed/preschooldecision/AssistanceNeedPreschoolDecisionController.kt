// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
package fi.espoo.evaka.assistanceneed.preschooldecision

import fi.espoo.evaka.Audit
import fi.espoo.evaka.assistanceneed.decision.AssistanceNeedDecisionStatus
import fi.espoo.evaka.pis.Employee
import fi.espoo.evaka.pis.getEmployees
import fi.espoo.evaka.pis.getEmployeesByRoles
import fi.espoo.evaka.pis.service.getChildGuardians
import fi.espoo.evaka.shared.AssistanceNeedPreschoolDecisionId
import fi.espoo.evaka.shared.ChildId
import fi.espoo.evaka.shared.EmployeeId
import fi.espoo.evaka.shared.FeatureConfig
import fi.espoo.evaka.shared.async.AsyncJob
import fi.espoo.evaka.shared.async.AsyncJobRunner
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.BadRequest
import fi.espoo.evaka.shared.domain.EvakaClock
import fi.espoo.evaka.shared.domain.NotFound
import fi.espoo.evaka.shared.security.AccessControl
import fi.espoo.evaka.shared.security.Action
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

@RestController
class AssistanceNeedPreschoolDecisionController(
    private val featureConfig: FeatureConfig,
    private val accessControl: AccessControl,
    private val asyncJobRunner: AsyncJobRunner<AsyncJob>
) {
    @PostMapping("/children/{childId}/assistance-need-preschool-decisions")
    fun createAssistanceNeedPreschoolDecision(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable childId: ChildId
    ): AssistanceNeedPreschoolDecision {
        return db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Child.CREATE_ASSISTANCE_NEED_PRESCHOOL_DECISION,
                        childId
                    )

                    tx.insertEmptyAssistanceNeedPreschoolDecisionDraft(childId)
                }
            }
            .also { assistanceNeedDecision ->
                Audit.ChildAssistanceNeedPreschoolDecisionCreate.log(
                    targetId = childId,
                    objectId = assistanceNeedDecision.id
                )
            }
    }

    @GetMapping("/assistance-need-preschool-decisions/{id}")
    fun getAssistanceNeedPreschoolDecision(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: AssistanceNeedPreschoolDecisionId
    ): AssistanceNeedPreschoolDecisionResponse {
        return db.connect { dbc ->
                dbc.read { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.AssistanceNeedPreschoolDecision.READ,
                        id
                    )
                    val decision = tx.getAssistanceNeedPreschoolDecisionById(id)

                    AssistanceNeedPreschoolDecisionResponse(
                        decision,
                        permittedActions = accessControl.getPermittedActions(tx, user, clock, id)
                    )
                }
            }
            .also { Audit.ChildAssistanceNeedPreschoolDecisionRead.log(targetId = id) }
    }

    @PutMapping("/assistance-need-preschool-decisions/{id}")
    fun updateAssistanceNeedPreschoolDecision(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: AssistanceNeedPreschoolDecisionId,
        @RequestBody body: AssistanceNeedPreschoolDecisionForm
    ) {
        return db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.AssistanceNeedPreschoolDecision.UPDATE,
                        id
                    )

                    tx.updateAssistanceNeedPreschoolDecision(id, body)
                }
            }
            .also { Audit.ChildAssistanceNeedPreschoolDecisionUpdate.log(targetId = id) }
    }

    @PutMapping("/assistance-need-preschool-decisions/{id}/send")
    fun sendForDecision(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: AssistanceNeedPreschoolDecisionId
    ) {
        db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.AssistanceNeedPreschoolDecision.SEND,
                        id
                    )

                    val decision = tx.getAssistanceNeedPreschoolDecisionById(id)
                    if (!decision.isValid) throw BadRequest("Decision form is not valid")

                    tx.updateAssistanceNeedPreschoolDecisionToSent(id, clock.today())
                }
            }
            .also { Audit.ChildAssistanceNeedPreschoolDecisionSend.log(targetId = id) }
    }

    @PutMapping("/assistance-need-preschool-decisions/{id}/unsend")
    fun revertToUnsent(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: AssistanceNeedPreschoolDecisionId
    ) {
        db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.AssistanceNeedPreschoolDecision.REVERT_TO_UNSENT,
                        id
                    )

                    tx.updateAssistanceNeedPreschoolDecisionToNotSent(id)
                }
            }
            .also { Audit.ChildAssistanceNeedPreschoolDecisionRevertToUnsent.log(targetId = id) }
    }

    @PutMapping("/assistance-need-preschool-decisions/{id}/mark-as-opened")
    fun markAsOpened(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: AssistanceNeedPreschoolDecisionId
    ) {
        db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.AssistanceNeedPreschoolDecision.MARK_AS_OPENED,
                        id
                    )

                    tx.markAssistanceNeedPreschoolDecisionAsOpened(id)
                }
            }
            .also { Audit.ChildAssistanceNeedPreschoolDecisionOpened.log(targetId = id) }
    }

    @PutMapping("/assistance-need-preschool-decisions/{id}/decide")
    fun decideAssistanceNeedDecision(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: AssistanceNeedPreschoolDecisionId,
        @RequestBody body: DecideAssistanceNeedPreschoolDecisionRequest
    ) {
        val decided =
            when (body.status) {
                AssistanceNeedDecisionStatus.ACCEPTED,
                AssistanceNeedDecisionStatus.REJECTED -> true
                AssistanceNeedDecisionStatus.NEEDS_WORK -> false
                AssistanceNeedDecisionStatus.DRAFT ->
                    throw BadRequest("Assistance need decisions cannot be decided to be draft")
                AssistanceNeedDecisionStatus.ANNULLED ->
                    throw BadRequest("Assistance need decisions cannot be decided to be annulled")
            }

        return db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.AssistanceNeedPreschoolDecision.DECIDE,
                        id
                    )

                    val decision = tx.getAssistanceNeedPreschoolDecisionById(id)

                    if (decision.status.isDecided()) {
                        throw BadRequest("Already-decided decisions cannot be decided again")
                    }

                    tx.decideAssistanceNeedPreschoolDecision(
                        id = id,
                        status = body.status,
                        decisionMade = clock.today().takeIf { decided },
                        unreadGuardianIds =
                            if (decided) {
                                tx.getChildGuardians(decision.child.id)
                            } else {
                                null
                            }
                    )

                    if (decided) {
                        asyncJobRunner.plan(
                            tx,
                            listOf(
                                AsyncJob.SendAssistanceNeedPreschoolDecisionEmail(id),
                                AsyncJob.CreateAssistanceNeedPreschoolDecisionPdf(id),
                                AsyncJob.SendAssistanceNeedPreschoolDecisionSfiMessage(id)
                            ),
                            runAt = clock.now()
                        )
                    }
                }
            }
            .also {
                Audit.ChildAssistanceNeedPreschoolDecisionDecide.log(
                    targetId = id,
                    meta = mapOf("status" to body.status)
                )
            }
    }

    @GetMapping("/children/{childId}/assistance-need-preschool-decisions")
    fun getAssistanceNeedPreschoolDecisions(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable childId: ChildId
    ): List<AssistanceNeedPreschoolDecisionBasicsResponse> {
        return db.connect { dbc ->
                dbc.read { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Child.READ_ASSISTANCE_NEED_PRESCHOOL_DECISIONS,
                        childId
                    )
                    val decisions = tx.getAssistanceNeedPreschoolDecisionsByChildId(childId)
                    val permittedActions =
                        accessControl.getPermittedActions<
                            AssistanceNeedPreschoolDecisionId,
                            Action.AssistanceNeedPreschoolDecision
                        >(
                            tx,
                            user,
                            clock,
                            decisions.map { it.id }
                        )
                    decisions.map {
                        AssistanceNeedPreschoolDecisionBasicsResponse(
                            decision = it,
                            permittedActions = permittedActions[it.id]!!
                        )
                    }
                }
            }
            .also {
                Audit.ChildAssistanceNeedPreschoolDecisionsList.log(
                    targetId = childId,
                    meta = mapOf("count" to it.size)
                )
            }
    }

    @DeleteMapping("/assistance-need-preschool-decisions/{id}")
    fun deleteAssistanceNeedPreschoolDecision(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: AssistanceNeedPreschoolDecisionId
    ) {
        return db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.AssistanceNeedPreschoolDecision.DELETE,
                        id
                    )
                    if (!tx.deleteAssistanceNeedPreschoolDecision(id)) {
                        throw NotFound(
                            "Assistance need preschool decision $id cannot found or cannot be deleted",
                            "DECISION_NOT_FOUND"
                        )
                    }
                }
            }
            .also { Audit.ChildAssistanceNeedPreschoolDecisionDelete.log(targetId = id) }
    }

    // TODO: Unused endpoint?
    @PutMapping("/assistance-need-preschool-decisions/{id}/decision-maker")
    fun updateAssistanceNeedPreschoolDecisionDecisionMaker(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: AssistanceNeedPreschoolDecisionId,
        @RequestBody body: UpdateDecisionMakerForAssistanceNeedPreschoolDecisionRequest
    ) {
        return db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.AssistanceNeedPreschoolDecision.UPDATE_DECISION_MAKER,
                        id
                    )
                    val decision = tx.getAssistanceNeedPreschoolDecisionById(id)

                    if (decision.status.isDecided() || decision.sentForDecision == null) {
                        throw BadRequest(
                            "Decision maker cannot be changed for already-decided or unsent decisions"
                        )
                    }

                    tx.updateAssistanceNeedPreschoolDecision(
                        id,
                        decision.form.copy(
                            decisionMakerEmployeeId = EmployeeId(user.rawId()),
                            decisionMakerTitle = body.title
                        ),
                        decisionMakerHasOpened = true
                    )
                }
            }
            .also { Audit.ChildAssistanceNeedDecisionUpdateDecisionMaker.log(targetId = id) }
    }

    @GetMapping("/assistance-need-preschool-decisions/{id}/decision-maker-options")
    fun getAssistancePreschoolDecisionMakerOptions(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: AssistanceNeedPreschoolDecisionId,
    ): List<Employee> {
        return db.connect { dbc ->
                dbc.read { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.AssistanceNeedPreschoolDecision.READ_DECISION_MAKER_OPTIONS,
                        id
                    )
                    val assistanceDecision = tx.getAssistanceNeedPreschoolDecisionById(id)
                    featureConfig.assistanceDecisionMakerRoles?.let { roles ->
                        tx.getEmployeesByRoles(roles, assistanceDecision.form.selectedUnit)
                    }
                        ?: tx.getEmployees().sortedBy { it.email }
                }
            }
            .also {
                Audit.ChildAssistanceNeedPreschoolDecisionReadDecisionMakerOptions.log(
                    targetId = id,
                    meta = mapOf("count" to it.size)
                )
            }
    }

    data class AssistanceNeedPreschoolDecisionBasicsResponse(
        val decision: AssistanceNeedPreschoolDecisionBasics,
        val permittedActions: Set<Action.AssistanceNeedPreschoolDecision>
    )

    data class AssistanceNeedPreschoolDecisionResponse(
        val decision: AssistanceNeedPreschoolDecision,
        val permittedActions: Set<Action.AssistanceNeedPreschoolDecision>
    )

    data class DecideAssistanceNeedPreschoolDecisionRequest(
        val status: AssistanceNeedDecisionStatus
    )

    data class UpdateDecisionMakerForAssistanceNeedPreschoolDecisionRequest(val title: String)
}
