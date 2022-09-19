// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.domain

import com.fasterxml.jackson.annotation.JsonProperty
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.shared.ChildId
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.EmployeeId
import fi.espoo.evaka.shared.FeeDecisionId
import fi.espoo.evaka.shared.Id
import fi.espoo.evaka.shared.PersonId
import fi.espoo.evaka.shared.db.DatabaseEnum
import fi.espoo.evaka.shared.domain.DateRange
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.shared.domain.europeHelsinki
import org.jdbi.v3.core.mapper.Nested
import org.jdbi.v3.json.Json
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.util.UUID
import kotlin.math.max

data class FeeDecision(
    override val id: FeeDecisionId,
    override val children: List<FeeDecisionChild>,
    override val headOfFamilyId: PersonId,
    val validDuring: DateRange,
    val status: FeeDecisionStatus,
    val decisionNumber: Long? = null,
    val decisionType: FeeDecisionType,
    val partnerId: PersonId?,
    @Json
    val headOfFamilyIncome: DecisionIncome?,
    @Json
    val partnerIncome: DecisionIncome?,
    val familySize: Int,
    @Json
    val feeThresholds: FeeDecisionThresholds,
    val documentKey: String? = null,
    val approvedById: EmployeeId? = null,
    val approvedAt: HelsinkiDateTime? = null,
    val decisionHandlerId: EmployeeId? = null,
    val sentAt: HelsinkiDateTime? = null,
    val created: HelsinkiDateTime = HelsinkiDateTime.now()
) : FinanceDecision<FeeDecision>, Mergeable<FeeDecisionChild, FeeDecision> {
    val totalFee
        get() = children.fold(0) { sum, child -> sum + child.finalFee }

    override val validFrom: LocalDate = validDuring.start
    override val validTo: LocalDate? = validDuring.end
    override fun withRandomId() = this.copy(id = FeeDecisionId(UUID.randomUUID()))
    override fun withValidity(period: DateRange) = this.copy(validDuring = period)
    override fun contentEquals(decision: FeeDecision): Boolean {
        if (this.isEmpty() && decision.isEmpty()) {
            return setOf(this.headOfFamilyId, this.partnerId) == setOf(decision.headOfFamilyId, decision.partnerId)
        }

        return setOf(this.headOfFamilyId to this.headOfFamilyIncome, this.partnerId to this.partnerIncome) == setOf(
            decision.headOfFamilyId to decision.headOfFamilyIncome,
            decision.partnerId to decision.partnerIncome
        ) && this.children.toSet() == decision.children.toSet() &&
            this.familySize == decision.familySize &&
            this.feeThresholds == decision.feeThresholds
    }

    override fun overlapsWith(other: FeeDecision): Boolean {
        return DateRange(this.validFrom, this.validTo).overlaps(DateRange(other.validFrom, other.validTo)) && (
            // Check if any of the adults are on the other decision
            this.headOfFamilyId == other.headOfFamilyId ||
                (
                    this.partnerId != null && other.partnerId != null && (
                        this.headOfFamilyId == other.partnerId ||
                            this.partnerId == other.headOfFamilyId ||
                            this.partnerId == other.partnerId
                        )
                    )
            )
    }

    override fun isAnnulled(): Boolean = this.status == FeeDecisionStatus.ANNULLED
    override fun isEmpty(): Boolean = this.children.isEmpty()
    override fun annul() = this.copy(status = FeeDecisionStatus.ANNULLED)
    override fun withChildren(children: List<FeeDecisionChild>) = this.copy(children = children)
}

data class FeeDecisionChild(
    @Nested("child")
    val child: ChildWithDateOfBirth,
    @Nested("placement")
    val placement: FeeDecisionPlacement,
    @Nested("service_need")
    val serviceNeed: FeeDecisionServiceNeed,
    val baseFee: Int,
    val siblingDiscount: Int,
    val fee: Int,
    @Json
    val feeAlterations: List<FeeAlterationWithEffect>,
    val finalFee: Int,
    @Json
    val childIncome: DecisionIncome?,
)

data class FeeDecisionPlacement(
    val unitId: DaycareId,
    val type: PlacementType
)

data class FeeDecisionServiceNeed(
    val feeCoefficient: BigDecimal,
    val contractDaysPerMonth: Int?,
    val descriptionFi: String,
    val descriptionSv: String,
    val missing: Boolean
)

data class FeeAlterationWithEffect(
    val type: FeeAlteration.Type,
    val amount: Int,
    @get:JsonProperty("isAbsolute") val isAbsolute: Boolean,
    val effect: Int
)

enum class FeeDecisionStatus : DatabaseEnum {
    DRAFT,
    WAITING_FOR_SENDING,
    WAITING_FOR_MANUAL_SENDING,
    SENT,
    ANNULLED;

    override val sqlType: String = "fee_decision_status"

    companion object {
        /**
         *  list of statuses that have an overlap exclusion constraint at the database level and that signal that a decision is in effect
         */
        val effective = arrayOf(SENT, WAITING_FOR_SENDING, WAITING_FOR_MANUAL_SENDING)
    }
}

enum class FeeDecisionType {
    NORMAL,
    RELIEF_REJECTED,
    RELIEF_PARTLY_ACCEPTED,
    RELIEF_ACCEPTED
}

data class FeeDecisionDetailed(
    override val id: FeeDecisionId,
    override val children: List<FeeDecisionChildDetailed>,
    val validDuring: DateRange,
    val status: FeeDecisionStatus,
    val decisionNumber: Long? = null,
    val decisionType: FeeDecisionType,
    val headOfFamily: PersonDetailed,
    val partner: PersonDetailed?,
    val headOfFamilyIncome: DecisionIncome?,
    val partnerIncome: DecisionIncome?,
    val familySize: Int,
    val feeThresholds: FeeDecisionThresholds,
    val documentKey: String? = null,
    val approvedBy: EmployeeWithName? = null,
    val approvedAt: HelsinkiDateTime? = null,
    val sentAt: HelsinkiDateTime? = null,
    val financeDecisionHandlerFirstName: String?,
    val financeDecisionHandlerLastName: String?,
    val created: HelsinkiDateTime = HelsinkiDateTime.now(),
    val partnerIsCodebtor: Boolean? = false
) : Mergeable<FeeDecisionChildDetailed, FeeDecisionDetailed> {
    val totalFee
        get() = children.fold(0) { sum, part -> sum + part.finalFee }

    val incomeEffect
        get() = getTotalIncomeEffect(partner != null, headOfFamilyIncome?.effect, partnerIncome?.effect)

    val totalIncome
        get() = getTotalIncome(
            partner != null,
            headOfFamilyIncome?.effect,
            headOfFamilyIncome?.total,
            partnerIncome?.effect,
            partnerIncome?.total
        )

    val requiresManualSending
        get(): Boolean {
            // Restricted will be sent to allow fast receiving via suomi.fi e-channel.
            if (headOfFamily.restrictedDetailsEnabled) {
                return false
            } else if (decisionType !== FeeDecisionType.NORMAL || headOfFamily.forceManualFeeDecisions) {
                return true
            }
            return headOfFamily.let {
                listOf(
                    it.ssn,
                    it.streetAddress,
                    it.postalCode,
                    it.postOffice
                ).any { item -> item.isNullOrBlank() }
            }
        }

    val isRetroactive
        get() = isRetroactive(this.validDuring.start, sentAt?.toLocalDate() ?: LocalDate.now(europeHelsinki))

    override fun withChildren(children: List<FeeDecisionChildDetailed>) = this.copy(children = children)
}

fun isRetroactive(decisionValidFrom: LocalDate, sentAt: LocalDate): Boolean {
    val retroThreshold = sentAt.withDayOfMonth(1)
    return decisionValidFrom.isBefore(retroThreshold)
}

data class FeeDecisionChildDetailed(
    val child: PersonDetailed,
    val placementType: PlacementType,
    val placementUnit: UnitData,
    val serviceNeedFeeCoefficient: BigDecimal,
    val serviceNeedDescriptionFi: String,
    val serviceNeedDescriptionSv: String,
    val serviceNeedMissing: Boolean,
    val baseFee: Int,
    val siblingDiscount: Int,
    val fee: Int,
    val feeAlterations: List<FeeAlterationWithEffect>,
    val finalFee: Int,
    val childIncome: DecisionIncome?
)

data class FeeDecisionSummary(
    override val id: FeeDecisionId,
    override val children: List<PersonBasic>,
    val validDuring: DateRange,
    val status: FeeDecisionStatus,
    val decisionNumber: Long? = null,
    val headOfFamily: PersonBasic,
    val approvedAt: HelsinkiDateTime? = null,
    val sentAt: HelsinkiDateTime? = null,
    val finalPrice: Int,
    val created: HelsinkiDateTime = HelsinkiDateTime.now()
) : Mergeable<PersonBasic, FeeDecisionSummary> {
    override fun withChildren(children: List<PersonBasic>) = this.copy(children = children)

    val annullingDecision
        get() = this.children.isEmpty()
}

private interface Mergeable<Child, Decision : Mergeable<Child, Decision>> {
    val id: Id<*>
    val children: List<Child>

    fun withChildren(children: List<Child>): Decision
}

fun <Child, Decision : Mergeable<Child, Decision>, Decisions : Iterable<Decision>> Decisions.merge(): List<Decision> {
    val map = mutableMapOf<Id<*>, Decision>()
    for (decision in this) {
        val id = decision.id
        if (map.containsKey(id)) {
            val existing = map.getValue(id)
            map[id] = existing.withChildren(existing.children + decision.children)
        } else {
            map[id] = decision
        }
    }
    return map.values.toList()
}

fun useMaxFee(incomes: List<DecisionIncome?>): Boolean = incomes.filterNotNull().let {
    it.size < incomes.size || it.any { income -> income.effect != IncomeEffect.INCOME }
}

fun calculateBaseFee(
    feeThresholds: FeeThresholds,
    familySize: Int,
    incomes: List<DecisionIncome?>
): Int {
    check(familySize > 1) { "Family size should not be less than 2" }

    val multiplier = feeThresholds.incomeMultiplier(familySize)

    val feeInCents = if (useMaxFee(incomes)) {
        multiplier * BigDecimal(
            feeThresholds.maxIncomeThreshold(familySize) - feeThresholds.minIncomeThreshold(familySize)
        )
    } else {
        val minThreshold = feeThresholds.minIncomeThreshold(familySize)
        val maxThreshold = feeThresholds.maxIncomeThreshold(familySize)
        val totalIncome = incomes.filterNotNull().sumOf { it.total }
        val totalSurplus = minOf(maxOf(totalIncome - minThreshold, 0), maxThreshold - minThreshold)
        multiplier * BigDecimal(totalSurplus)
    }

    // round the fee to whole euros, but keep the value in cents
    return roundToEuros(feeInCents).toInt()
}

fun roundToEuros(cents: BigDecimal): BigDecimal = cents
    .divide(BigDecimal(100), 0, RoundingMode.HALF_UP)
    .multiply(BigDecimal(100))

fun getTotalIncomeEffect(
    hasPartner: Boolean,
    headIncomeEffect: IncomeEffect?,
    partnerIncomeEffect: IncomeEffect?
): IncomeEffect = when {
    headIncomeEffect == IncomeEffect.INCOME && (!hasPartner || partnerIncomeEffect == IncomeEffect.INCOME) -> IncomeEffect.INCOME
    headIncomeEffect == IncomeEffect.MAX_FEE_ACCEPTED || partnerIncomeEffect == IncomeEffect.MAX_FEE_ACCEPTED -> IncomeEffect.MAX_FEE_ACCEPTED
    headIncomeEffect == IncomeEffect.INCOMPLETE || partnerIncomeEffect == IncomeEffect.INCOMPLETE -> IncomeEffect.INCOMPLETE
    else -> IncomeEffect.NOT_AVAILABLE
}

fun getTotalIncome(
    hasPartner: Boolean,
    headIncomeEffect: IncomeEffect?,
    headIncomeTotal: Int?,
    partnerIncomeEffect: IncomeEffect?,
    partnerIncomeTotal: Int?
): Int? = when {
    headIncomeEffect == IncomeEffect.INCOME && (!hasPartner || partnerIncomeEffect == IncomeEffect.INCOME) ->
        (headIncomeTotal ?: 0) + (partnerIncomeTotal ?: 0)

    else -> null
}

fun calculateFeeBeforeFeeAlterations(
    baseFee: Int,
    serviceNeedCoefficient: BigDecimal,
    siblingDiscountMultiplier: BigDecimal,
    minFee: Int
): Int {
    val feeAfterSiblingDiscount = roundToEuros(BigDecimal(baseFee) * siblingDiscountMultiplier)
    val feeBeforeRounding = roundToEuros(feeAfterSiblingDiscount * serviceNeedCoefficient).toInt()
    return feeBeforeRounding.let { fee ->
        if (fee < minFee) 0
        else fee
    }
}

fun calculateMaxFee(baseFee: Int, siblingDiscount: Int): Int {
    val siblingDiscountMultiplier = BigDecimal(100 - siblingDiscount).divide(BigDecimal(100), 10, RoundingMode.HALF_UP)
    return roundToEuros(BigDecimal(baseFee) * siblingDiscountMultiplier).toInt()
}

fun toFeeAlterationsWithEffects(fee: Int, feeAlterations: List<FeeAlteration>): List<FeeAlterationWithEffect> {
    val (_, alterations) = feeAlterations.fold(fee to listOf<FeeAlterationWithEffect>()) { pair, feeAlteration ->
        val (currentFee, currentAlterations) = pair
        val effect = feeAlterationEffect(currentFee, feeAlteration.type, feeAlteration.amount, feeAlteration.isAbsolute)
        Pair(
            currentFee + effect,
            currentAlterations + FeeAlterationWithEffect(
                feeAlteration.type,
                feeAlteration.amount,
                feeAlteration.isAbsolute,
                effect
            )
        )
    }
    return alterations
}

fun feeAlterationEffect(fee: Int, type: FeeAlteration.Type, amount: Int, absolute: Boolean): Int {
    val multiplier = when (type) {
        FeeAlteration.Type.RELIEF, FeeAlteration.Type.DISCOUNT -> -1
        FeeAlteration.Type.INCREASE -> 1
    }

    val effect = if (absolute) {
        val amountInCents = amount * 100
        (multiplier * amountInCents)
    } else {
        val percentageMultiplier = BigDecimal(amount).divide(BigDecimal(100), 10, RoundingMode.HALF_UP)
        (BigDecimal(fee) * (BigDecimal(multiplier) * percentageMultiplier))
            .setScale(0, RoundingMode.HALF_UP)
            .toInt()
    }

    // This so that the effect of absolute discounts (eg. -10€) on 0€ fees is 0€ as well
    return max(0, fee + effect) - fee
}

// Current flat increase for children with a parent working at ECHA
const val ECHAIncrease = 93

fun getECHAIncrease(childId: ChildId, period: DateRange) = FeeAlteration(
    personId = childId,
    type = FeeAlteration.Type.INCREASE,
    amount = ECHAIncrease,
    isAbsolute = true,
    notes = "ECHA",
    validFrom = period.start,
    validTo = period.end
)
