// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.data

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.espoo.evaka.invoicing.controller.SortDirection
import fi.espoo.evaka.invoicing.controller.VoucherValueDecisionSortParam
import fi.espoo.evaka.invoicing.domain.DecisionIncome
import fi.espoo.evaka.invoicing.domain.PermanentPlacementWithHours
import fi.espoo.evaka.invoicing.domain.PersonData
import fi.espoo.evaka.invoicing.domain.PlacementType
import fi.espoo.evaka.invoicing.domain.ServiceNeed
import fi.espoo.evaka.invoicing.domain.UnitData
import fi.espoo.evaka.invoicing.domain.VoucherValueDecision
import fi.espoo.evaka.invoicing.domain.VoucherValueDecisionDetailed
import fi.espoo.evaka.invoicing.domain.VoucherValueDecisionStatus
import fi.espoo.evaka.invoicing.domain.VoucherValueDecisionSummary
import fi.espoo.evaka.shared.Paged
import fi.espoo.evaka.shared.WithCount
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.db.bindNullable
import fi.espoo.evaka.shared.db.freeTextSearchQuery
import fi.espoo.evaka.shared.db.getEnum
import fi.espoo.evaka.shared.db.getUUID
import fi.espoo.evaka.shared.domain.DateRange
import fi.espoo.evaka.shared.mapToPaged
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.core.statement.StatementContext
import org.postgresql.util.PGobject
import java.sql.ResultSet
import java.time.Instant
import java.time.ZoneOffset
import java.util.UUID

fun Database.Transaction.upsertValueDecisions(mapper: ObjectMapper, decisions: List<VoucherValueDecision>) {
    val sql =
        // language=sql
        """
INSERT INTO voucher_value_decision (
    id,
    status,
    valid_from,
    valid_to,
    decision_number,
    head_of_family,
    partner,
    head_of_family_income,
    partner_income,
    family_size,
    pricing,
    child,
    date_of_birth,
    placement_unit,
    placement_type,
    service_need,
    hours_per_week,
    base_co_payment,
    sibling_discount,
    co_payment,
    fee_alterations,
    base_value,
    age_coefficient,
    service_coefficient,
    voucher_value,
    created_at
) VALUES (
    :id,
    :status::voucher_value_decision_status,
    :valid_from,
    :valid_to,
    :decision_number,
    :head_of_family,
    :partner,
    :head_of_family_income,
    :partner_income,
    :family_size,
    :pricing,
    :child,
    :date_of_birth,
    :placement_unit,
    :placement_type,
    :service_need,
    :hours_per_week,
    :base_co_payment,
    :sibling_discount,
    :co_payment,
    :fee_alterations,
    :base_value,
    :age_coefficient,
    :service_coefficient,
    :voucher_value,
    :created_at
) ON CONFLICT (id) DO UPDATE SET
    status = :status::voucher_value_decision_status,
    decision_number = :decision_number,
    valid_from = :valid_from,
    valid_to = :valid_to,
    head_of_family = :head_of_family,
    partner = :partner,
    head_of_family_income = :head_of_family_income,
    partner_income = :partner_income,
    family_size = :family_size,
    pricing = :pricing,
    child = :child,
    date_of_birth = :date_of_birth,
    placement_unit = :placement_unit,
    placement_type = :placement_type,
    service_need = :service_need,
    hours_per_week = :hours_per_week,
    base_co_payment = :base_co_payment,
    sibling_discount = :sibling_discount,
    co_payment = :co_payment,
    fee_alterations = :fee_alterations,
    base_value = :base_value,
    age_coefficient = :age_coefficient,
    service_coefficient = :service_coefficient,
    voucher_value = :voucher_value
"""

    val batch = prepareBatch(sql)
    decisions.forEach { decision ->
        batch
            .bindMap(
                mapOf(
                    "id" to decision.id,
                    "status" to decision.status.toString(),
                    "valid_from" to decision.validFrom,
                    "valid_to" to decision.validTo,
                    "decision_number" to decision.decisionNumber,
                    "head_of_family" to decision.headOfFamily.id,
                    "partner" to decision.partner?.id,
                    "family_size" to decision.familySize,
                    "pricing" to decision.pricing.let {
                        PGobject().apply {
                            type = "jsonb"
                            value = mapper.writeValueAsString(it)
                        }
                    },
                    "head_of_family_income" to decision.headOfFamilyIncome?.let {
                        PGobject().apply {
                            type = "jsonb"
                            value = mapper.writeValueAsString(it)
                        }
                    },
                    "partner_income" to decision.partnerIncome?.let {
                        PGobject().apply {
                            type = "jsonb"
                            value = mapper.writeValueAsString(it)
                        }
                    },
                    "child" to decision.child.id,
                    "date_of_birth" to decision.child.dateOfBirth,
                    "placement_unit" to decision.placement.unit,
                    "placement_type" to decision.placement.type.name,
                    "service_need" to decision.placement.serviceNeed.name,
                    "hours_per_week" to decision.placement.hours,
                    "base_co_payment" to decision.baseCoPayment,
                    "sibling_discount" to decision.siblingDiscount,
                    "co_payment" to decision.coPayment,
                    "fee_alterations" to PGobject().apply {
                        type = "jsonb"
                        value = mapper.writeValueAsString(decision.feeAlterations)
                    },
                    "base_value" to decision.baseValue,
                    "age_coefficient" to decision.ageCoefficient,
                    "service_coefficient" to decision.serviceCoefficient,
                    "voucher_value" to decision.value,
                    "created_at" to decision.createdAt.atOffset(ZoneOffset.UTC)
                )
            )
            .add()
    }
    batch.execute()
}

fun Database.Read.getValueDecisionsByIds(mapper: ObjectMapper, ids: List<UUID>): List<VoucherValueDecision> {
    return createQuery("SELECT * FROM voucher_value_decision WHERE id = ANY(:ids)")
        .bind("ids", ids.toTypedArray())
        .map(toVoucherValueDecision(mapper))
        .toList()
}

fun Database.Read.findValueDecisionsForChild(
    mapper: ObjectMapper,
    child: UUID,
    period: DateRange?,
    statuses: List<VoucherValueDecisionStatus>?
): List<VoucherValueDecision> {
    // language=sql
    val sql =
        """
SELECT * FROM voucher_value_decision
WHERE child = :child
AND (:period::daterange IS NULL OR daterange(valid_from, valid_to, '[]') && :period)
AND (:statuses::text[] IS NULL OR status = ANY(:statuses::voucher_value_decision_status[]))
"""

    return createQuery(sql)
        .bind("child", child)
        .bindNullable("period", period)
        .bindNullable("statuses", statuses)
        .map(toVoucherValueDecision(mapper))
        .toList()
}

fun Database.Transaction.deleteValueDecisions(ids: List<UUID>) {
    if (ids.isEmpty()) return

    createUpdate("DELETE FROM voucher_value_decision WHERE id = ANY(:ids)")
        .bind("ids", ids.toTypedArray())
        .execute()
}

fun Database.Read.searchValueDecisions(
    page: Int,
    pageSize: Int,
    sortBy: VoucherValueDecisionSortParam,
    sortDirection: SortDirection,
    status: VoucherValueDecisionStatus,
    areas: List<String>,
    unit: UUID?,
    searchTerms: String = "",
    financeDecisionHandlerId: UUID?
): Paged<VoucherValueDecisionSummary> {
    val sortColumn = when (sortBy) {
        VoucherValueDecisionSortParam.HEAD_OF_FAMILY -> "head.last_name"
        VoucherValueDecisionSortParam.STATUS -> "decision.status"
    }

    val params = mapOf(
        "page" to page,
        "pageSize" to pageSize,
        "status" to status.name,
        "areas" to areas.toTypedArray(),
        "unit" to unit,
        "financeDecisionHandlerId" to financeDecisionHandlerId
    )

    val (freeTextQuery, freeTextParams) = freeTextSearchQuery(listOf("head", "partner", "child"), searchTerms)

    val sql =
        // language=sql
        """
SELECT
    count(*) OVER () AS count,
    decision.id,
    decision.status,
    decision.decision_number,
    decision.valid_from,
    decision.valid_to,
    decision.head_of_family,
    decision.child,
    decision.date_of_birth,
    decision.voucher_value,
    decision.approved_at,
    decision.created_at,
    decision.sent_at,
    sums.final_co_payment,
    head.date_of_birth AS head_date_of_birth,
    head.first_name AS head_first_name,
    head.last_name AS head_last_name,
    head.social_security_number AS head_ssn,
    head.force_manual_fee_decisions AS head_force_manual_fee_decisions,
    child.first_name AS child_first_name,
    child.last_name AS child_last_name,
    child.social_security_number AS child_ssn
FROM voucher_value_decision AS decision
LEFT JOIN person AS head ON decision.head_of_family = head.id
LEFT JOIN person AS child ON decision.child = child.id
LEFT JOIN daycare AS placement_unit ON placement_unit.id = decision.placement_unit
LEFT JOIN care_area AS area ON placement_unit.care_area_id = area.id
LEFT JOIN (
    SELECT vd.id, coalesce(vd.co_payment + coalesce(sum(effects.effect), 0), 0) AS final_co_payment
    FROM voucher_value_decision vd
    LEFT JOIN (
        SELECT id, (jsonb_array_elements(fee_alterations)->>'effect')::integer effect
        FROM voucher_value_decision
    ) effects ON vd.id = effects.id
    GROUP BY vd.id, vd.co_payment
) sums ON decision.id = sums.id
WHERE
    decision.status = :status::voucher_value_decision_status
    AND (:unit::uuid IS NULL OR decision.placement_unit = :unit)
    AND (:areas::text[] = '{}' OR area.short_name = ANY(:areas))
    AND $freeTextQuery
    AND (:financeDecisionHandlerId::uuid IS NULL OR placement_unit.finance_decision_handler = :financeDecisionHandlerId)
ORDER BY $sortColumn $sortDirection, decision.id DESC
LIMIT :pageSize OFFSET :pageSize * :page
"""

    return this.createQuery(sql)
        .bindMap(params + freeTextParams)
        .map { rs, ctx ->
            WithCount(rs.getInt("count"), toVoucherValueDecisionSummary(rs, ctx))
        }
        .let(mapToPaged(pageSize))
}

fun Database.Read.getVoucherValueDecision(mapper: ObjectMapper, id: UUID): VoucherValueDecisionDetailed? {
    // language=sql
    val sql =
        """
SELECT
    decision.*,
    date_part('year', age(decision.valid_from, decision.date_of_birth)) child_age,
    head.date_of_birth as head_date_of_birth,
    head.first_name as head_first_name,
    head.last_name as head_last_name,
    head.social_security_number as head_ssn,
    head.street_address as head_street_address,
    head.postal_code as head_postal_code,
    head.post_office as head_post_office,
    head.language as head_language,
    head.restricted_details_enabled as head_restricted_details_enabled,
    head.force_manual_fee_decisions as head_force_manual_fee_decisions,
    partner.date_of_birth as partner_date_of_birth,
    partner.first_name as partner_first_name,
    partner.last_name as partner_last_name,
    partner.social_security_number as partner_ssn,
    partner.street_address as partner_street_address,
    partner.postal_code as partner_postal_code,
    partner.post_office as partner_post_office,
    partner.restricted_details_enabled as partner_restricted_details_enabled,
    approved_by.first_name as approved_by_first_name,
    approved_by.last_name as approved_by_last_name,
    child.first_name as child_first_name,
    child.last_name as child_last_name,
    child.social_security_number as child_ssn,
    child.street_address as child_address,
    child.postal_code as child_postal_code,
    child.post_office as child_post_office,
    child.restricted_details_enabled as child_restricted_details_enabled,
    daycare.name as placement_unit_name,
    daycare.language as placement_unit_lang,
    care_area.id as placement_unit_area_id,
    care_area.name as placement_unit_area_name,
    finance_decision_handler.first_name AS finance_decision_handler_first_name,
    finance_decision_handler.last_name AS finance_decision_handler_last_name
FROM voucher_value_decision as decision
JOIN person as head ON decision.head_of_family = head.id
LEFT JOIN person as partner ON decision.partner = partner.id
JOIN person as child ON decision.child = child.id
JOIN daycare ON decision.placement_unit = daycare.id
JOIN care_area ON daycare.care_area_id = care_area.id
LEFT JOIN employee as approved_by ON decision.approved_by = approved_by.id
LEFT JOIN employee as finance_decision_handler ON finance_decision_handler.id = decision.decision_handler
WHERE decision.id = :id
"""

    return createQuery(sql)
        .bind("id", id)
        .map(toVoucherValueDecisionDetailed(mapper))
        .singleOrNull()
}

fun Database.Transaction.approveValueDecisionDraftsForSending(ids: List<UUID>, approvedBy: UUID, approvedAt: Instant) {
    // language=sql
    val sql =
        """
        UPDATE voucher_value_decision SET
            status = :status::voucher_value_decision_status,
            decision_number = nextval('voucher_value_decision_number_sequence'),
            approved_by = :approvedBy,
            decision_handler = (CASE
                WHEN daycare.finance_decision_handler IS NOT NULL THEN daycare.finance_decision_handler
                ELSE :approvedBy
            END),
            approved_at = :approvedAt
        FROM voucher_value_decision AS vd
        JOIN daycare ON vd.placement_unit = daycare.id
        WHERE vd.id = :id AND voucher_value_decision.id = vd.id
        """.trimIndent()

    val batch = prepareBatch(sql)
    ids.forEach { id ->
        batch
            .bind("status", VoucherValueDecisionStatus.WAITING_FOR_SENDING)
            .bind("approvedBy", approvedBy)
            .bind("approvedAt", approvedAt)
            .bind("id", id)
            .add()
    }
    batch.execute()
}

fun Database.Read.getVoucherValueDecisionDocumentKey(id: UUID): String? {
    // language=sql
    val sql = "SELECT document_key FROM voucher_value_decision WHERE id = :id"

    return createQuery(sql)
        .bind("id", id)
        .mapTo<String>()
        .singleOrNull()
}

fun Database.Transaction.updateVoucherValueDecisionDocumentKey(id: UUID, documentKey: String) {
    // language=sql
    val sql = "UPDATE voucher_value_decision SET document_key = :documentKey WHERE id = :id"

    createUpdate(sql)
        .bind("id", id)
        .bind("documentKey", documentKey)
        .execute()
}

fun Database.Transaction.updateVoucherValueDecisionStatus(ids: List<UUID>, status: VoucherValueDecisionStatus) {
    // language=sql
    val sql = "UPDATE voucher_value_decision SET status = :status::voucher_value_decision_status WHERE id = ANY(:ids)"

    createUpdate(sql)
        .bind("ids", ids.toTypedArray())
        .bind("status", status)
        .execute()
}

fun Database.Transaction.markVoucherValueDecisionsSent(ids: List<UUID>, now: Instant) {
    createUpdate("UPDATE voucher_value_decision SET status = :sent::voucher_value_decision_status, sent_at = :now WHERE id = ANY(:ids)")
        .bind("ids", ids.toTypedArray())
        .bind("sent", VoucherValueDecisionStatus.SENT)
        .bind("now", now)
        .execute()
}

fun Database.Transaction.updateVoucherValueDecisionStatusAndDates(updatedDecisions: List<VoucherValueDecision>) {
    prepareBatch("UPDATE voucher_value_decision SET status = :status::voucher_value_decision_status, valid_from = :validFrom, valid_to = :validTo WHERE id = :id")
        .also { batch ->
            updatedDecisions.forEach { decision ->
                batch
                    .bind("id", decision.id)
                    .bind("status", decision.status)
                    .bind("validFrom", decision.validFrom)
                    .bind("validTo", decision.validTo)
                    .add()
            }
        }
        .execute()
}

fun Database.Transaction.lockValueDecisionsForChild(child: UUID) {
    createUpdate("SELECT id FROM voucher_value_decision WHERE child = :child FOR UPDATE")
        .bind("child", child)
        .execute()
}

fun Database.Transaction.lockValueDecisions(ids: List<UUID>) {
    createUpdate("SELECT id FROM voucher_value_decision WHERE id = ANY(:ids) FOR UPDATE")
        .bind("ids", ids.toTypedArray())
        .execute()
}

fun toVoucherValueDecision(mapper: ObjectMapper) = { rs: ResultSet, _: StatementContext ->
    VoucherValueDecision(
        id = rs.getUUID("id"),
        status = rs.getEnum("status"),
        decisionNumber = rs.getObject("decision_number") as Long?, // getLong returns 0 for null values
        validFrom = rs.getDate("valid_from").toLocalDate(),
        validTo = rs.getDate("valid_to")?.toLocalDate(),
        headOfFamily = PersonData.JustId(rs.getUUID("head_of_family")),
        partner = rs.getString("partner")?.let { PersonData.JustId(UUID.fromString(it)) },
        headOfFamilyIncome = rs.getString("head_of_family_income")?.let { mapper.readValue<DecisionIncome>(it) },
        partnerIncome = rs.getString("partner_income")?.let { mapper.readValue<DecisionIncome>(it) },
        familySize = rs.getInt("family_size"),
        pricing = mapper.readValue(rs.getString("pricing")),
        child = PersonData.WithDateOfBirth(
            id = rs.getUUID("child"),
            dateOfBirth = rs.getDate("date_of_birth").toLocalDate()
        ),
        placement = PermanentPlacementWithHours(
            unit = rs.getUUID("placement_unit"),
            type = PlacementType.valueOf(rs.getString("placement_type")),
            serviceNeed = ServiceNeed.valueOf(rs.getString("service_need")),
            hours = rs.getBigDecimal("hours_per_week")?.toDouble()
        ),
        baseCoPayment = rs.getInt("base_co_payment"),
        siblingDiscount = rs.getInt("sibling_discount"),
        coPayment = rs.getInt("co_payment"),
        feeAlterations = mapper.readValue(rs.getString("fee_alterations")),
        baseValue = rs.getInt("base_value"),
        ageCoefficient = rs.getInt("age_coefficient"),
        serviceCoefficient = rs.getInt("service_coefficient"),
        value = rs.getInt("voucher_value"),
        approvedAt = rs.getTimestamp("approved_at")?.toInstant(),
        createdAt = rs.getTimestamp("created_at").toInstant(),
        sentAt = rs.getTimestamp("sent_at")?.toInstant()
    )
}

val toVoucherValueDecisionSummary = { rs: ResultSet, _: StatementContext ->
    VoucherValueDecisionSummary(
        id = rs.getUUID("id"),
        status = rs.getEnum("status"),
        decisionNumber = rs.getObject("decision_number") as Long?, // getLong returns 0 for null values
        validFrom = rs.getDate("valid_from").toLocalDate(),
        validTo = rs.getDate("valid_to")?.toLocalDate(),
        headOfFamily = PersonData.Basic(
            id = rs.getUUID("head_of_family"),
            dateOfBirth = rs.getDate("head_date_of_birth").toLocalDate(),
            firstName = rs.getString("head_first_name"),
            lastName = rs.getString("head_last_name"),
            ssn = rs.getString("head_ssn")
        ),
        child = PersonData.Basic(
            id = rs.getUUID("child"),
            dateOfBirth = rs.getDate("date_of_birth").toLocalDate(),
            firstName = rs.getString("child_first_name"),
            lastName = rs.getString("child_last_name"),
            ssn = rs.getString("child_ssn")
        ),
        finalCoPayment = rs.getInt("final_co_payment"),
        value = rs.getInt("voucher_value"),
        approvedAt = rs.getTimestamp("approved_at")?.toInstant(),
        createdAt = rs.getTimestamp("created_at").toInstant(),
        sentAt = rs.getTimestamp("sent_at")?.toInstant()
    )
}

fun toVoucherValueDecisionDetailed(mapper: ObjectMapper) = { rs: ResultSet, _: StatementContext ->
    VoucherValueDecisionDetailed(
        id = rs.getUUID("id"),
        status = rs.getEnum("status"),
        decisionNumber = rs.getObject("decision_number") as Long?, // getLong returns 0 for null values
        validFrom = rs.getDate("valid_from").toLocalDate(),
        validTo = rs.getDate("valid_to")?.toLocalDate(),
        headOfFamily = PersonData.Detailed(
            id = UUID.fromString(rs.getString("head_of_family")),
            dateOfBirth = rs.getDate("head_date_of_birth").toLocalDate(),
            firstName = rs.getString("head_first_name"),
            lastName = rs.getString("head_last_name"),
            ssn = rs.getString("head_ssn"),
            streetAddress = rs.getString("head_street_address"),
            postalCode = rs.getString("head_postal_code"),
            postOffice = rs.getString("head_post_office"),
            language = rs.getString("head_language"),
            restrictedDetailsEnabled = rs.getBoolean("head_restricted_details_enabled"),
            forceManualFeeDecisions = rs.getBoolean("head_force_manual_fee_decisions")
        ),
        partner = rs.getString("partner")?.let { id ->
            PersonData.Detailed(
                id = UUID.fromString(id),
                dateOfBirth = rs.getDate("partner_date_of_birth").toLocalDate(),
                firstName = rs.getString("partner_first_name"),
                lastName = rs.getString("partner_last_name"),
                ssn = rs.getString("partner_ssn"),
                streetAddress = rs.getString("partner_street_address"),
                postalCode = rs.getString("partner_postal_code"),
                postOffice = rs.getString("partner_post_office"),
                restrictedDetailsEnabled = rs.getBoolean("partner_restricted_details_enabled")
            )
        },
        headOfFamilyIncome = rs.getString("head_of_family_income")?.let { mapper.readValue<DecisionIncome>(it) },
        partnerIncome = rs.getString("partner_income")?.let { mapper.readValue<DecisionIncome>(it) },
        familySize = rs.getInt("family_size"),
        pricing = mapper.readValue(rs.getString("pricing")),
        child = PersonData.Detailed(
            id = UUID.fromString(rs.getString("child")),
            dateOfBirth = rs.getDate("date_of_birth").toLocalDate(),
            firstName = rs.getString("child_first_name"),
            lastName = rs.getString("child_last_name"),
            ssn = rs.getString("child_ssn"),
            streetAddress = rs.getString("child_address"),
            postalCode = rs.getString("child_postal_code"),
            postOffice = rs.getString("child_post_office"),
            restrictedDetailsEnabled = rs.getBoolean("child_restricted_details_enabled")
        ),
        placement = PermanentPlacementWithHours(
            unit = UUID.fromString(rs.getString("placement_unit")),
            type = PlacementType.valueOf(rs.getString("placement_type")),
            serviceNeed = ServiceNeed.valueOf(rs.getString("service_need")),
            hours = rs.getBigDecimal("hours_per_week")?.toDouble()
        ),
        placementUnit = UnitData.Detailed(
            id = UUID.fromString(rs.getString("placement_unit")),
            name = rs.getString("placement_unit_name"),
            language = rs.getString("placement_unit_lang"),
            areaId = UUID.fromString(rs.getString("placement_unit_area_id")),
            areaName = rs.getString("placement_unit_area_name")
        ),
        baseCoPayment = rs.getInt("base_co_payment"),
        siblingDiscount = rs.getInt("sibling_discount"),
        coPayment = rs.getInt("co_payment"),
        feeAlterations = mapper.readValue(rs.getString("fee_alterations")),
        baseValue = rs.getInt("base_value"),
        childAge = rs.getInt("child_age"),
        ageCoefficient = rs.getInt("age_coefficient"),
        serviceCoefficient = rs.getInt("service_coefficient"),
        value = rs.getInt("voucher_value"),
        documentKey = rs.getString("document_key"),
        approvedBy = rs.getString("approved_by")?.let { id ->
            PersonData.WithName(
                id = UUID.fromString(id),
                firstName = rs.getString("approved_by_first_name"),
                lastName = rs.getString("approved_by_last_name")
            )
        },
        approvedAt = rs.getTimestamp("approved_at")?.toInstant(),
        createdAt = rs.getTimestamp("created_at").toInstant(),
        sentAt = rs.getTimestamp("sent_at")?.toInstant(),
        financeDecisionHandlerName = rs.getString("finance_decision_handler_first_name")?.let {
            rs.getString("finance_decision_handler_first_name") +
                " " +
                rs.getString("finance_decision_handler_last_name")
        }
    )
}
