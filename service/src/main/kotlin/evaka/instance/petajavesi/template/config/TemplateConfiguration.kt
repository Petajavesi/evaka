// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.template.config

import evaka.core.decision.DecisionType
import evaka.core.shared.config.pdfTemplateEngine
import evaka.core.shared.domain.OfficialLanguage
import evaka.core.shared.template.ITemplateProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.thymeleaf.ITemplateEngine

/** Päätös-PDF:ien pohjat luetaan classpath-hakemistosta `petajavesi/templates/`. */
@Configuration
class TemplateConfiguration {
    @Bean fun templateEngine(): ITemplateEngine = pdfTemplateEngine("petajavesi")

    @Bean fun templateProvider(): ITemplateProvider = PetajavesiTemplateProvider()
}

/**
 * Petäjäveden päätöspohjat. Petäjävedellä ei ole palveluseteleitä, kerhoa eikä valmistavaa
 * opetusta, joten niille ei ole pohjia. Tekstit ovat vain suomeksi, joten myös tiedostonimi on aina
 * suomenkielinen.
 */
class PetajavesiTemplateProvider : ITemplateProvider {
    override fun getLocalizedFilename(type: DecisionType, lang: OfficialLanguage): String =
        when (type) {
            DecisionType.CLUB -> "Kerhopäätös"

            DecisionType.DAYCARE,
            DecisionType.DAYCARE_PART_TIME -> "Varhaiskasvatuspäätös"

            DecisionType.PRESCHOOL -> "Esiopetuspäätös"

            DecisionType.PRESCHOOL_DAYCARE -> "Liittyvä_varhaiskasvatuspäätös"

            DecisionType.PRESCHOOL_CLUB -> "Esiopetuksen_kerhopäätös"

            DecisionType.PREPARATORY_EDUCATION -> "Valmistava_päätös"
        }

    override fun getFeeDecisionPath(): String = "fee-decision/decision"

    override fun getVoucherValueDecisionPath(): String = notInUse("palvelusetelin arvopäätös")

    override fun getClubDecisionPath(): String = notInUse("kerhopäätös")

    override fun getDaycareVoucherDecisionPath(): String =
        notInUse("palveluseteliyksikön varhaiskasvatuspäätös")

    override fun getDaycareTransferDecisionPath(): String = "daycare/transfer/decision"

    override fun getDaycareDecisionPath(): String = "daycare/decision"

    override fun getPreschoolDecisionPath(): String = "preschool/decision"

    override fun getPreparatoryDecisionPath(): String = notInUse("valmistavan opetuksen päätös")

    private fun notInUse(decision: String): Nothing =
        throw UnsupportedOperationException("Petäjävedellä ei ole käytössä: $decision")
}
