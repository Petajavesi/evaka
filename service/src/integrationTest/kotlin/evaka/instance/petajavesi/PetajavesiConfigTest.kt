// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi

import evaka.core.document.archival.ArchivalIntegrationClient
import evaka.core.emailclient.IEmailMessageProvider
import evaka.core.invoicing.domain.PaymentIntegrationClient
import evaka.core.invoicing.integration.InvoiceIntegrationClient
import evaka.core.invoicing.service.IncomeCoefficientMultiplierProvider
import evaka.core.invoicing.service.IncomeTypesProvider
import evaka.core.invoicing.service.InvoiceNumberProvider
import evaka.core.invoicing.service.InvoiceProductProvider
import evaka.core.lookup
import evaka.core.mealintegration.MealTypeMapper
import evaka.core.shared.FeatureConfig
import evaka.core.shared.auth.PasswordSpecification
import evaka.core.shared.message.IMessageProvider
import evaka.core.shared.security.actionrule.ActionRuleMapping
import evaka.core.shared.template.ITemplateProvider
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationContext
import org.thymeleaf.ITemplateEngine

/** Savutesti. */
class PetajavesiConfigTest : AbstractPetajavesiIntegrationTest() {
    @Autowired private lateinit var context: ApplicationContext

    @Test fun contextLoads() {}

    @Test
    fun `exactly one bean for each municipality-specific type`() {
        val types =
            listOf(
                IEmailMessageProvider::class.java,
                IMessageProvider::class.java,
                ITemplateProvider::class.java,
                ITemplateEngine::class.java,
                FeatureConfig::class.java,
                IncomeTypesProvider::class.java,
                IncomeCoefficientMultiplierProvider::class.java,
                InvoiceProductProvider::class.java,
                InvoiceNumberProvider::class.java,
                InvoiceIntegrationClient::class.java,
                PaymentIntegrationClient::class.java,
                ActionRuleMapping::class.java,
                PasswordSpecification::class.java,
                MealTypeMapper::class.java,
                ArchivalIntegrationClient::class.java,
            )
        val counts = types.associate { it.simpleName to context.getBeanNamesForType(it).size }
        assertEquals(types.associate { it.simpleName to 1 }, counts)
    }

    @Test
    fun `no beans from the Espoo instance package except the shared default password specification`() {
        // DefaultPasswordSpecification on upstreamin yhteinen oletustoteutus, jota kaikki kunnat
        // käyttävät, vaikka se sijaitsee Espoon paketissa.
        val espooBeans =
            context.beanDefinitionNames.filter { name ->
                val type = context.getType(name)?.name
                type?.startsWith("evaka.instance.espoo") == true &&
                    type != "evaka.instance.espoo.DefaultPasswordSpecification"
            }
        assertTrue(espooBeans.isEmpty(), "Espoon beaneja kontekstissa: $espooBeans")
    }

    @Test
    fun `flyway locations come from the profile`() {
        val locations =
            context.environment.lookup<List<String>?>("evaka.database.flyway.locations")
                ?: listOf("db/migration")
        assertEquals(listOf("db/migration", "petajavesi/db/migration"), locations)
    }

    @Test
    fun `feature config matches baseline except postOffice`() {
        val featureConfig = context.getBean(FeatureConfig::class.java)
        assertEquals("Petäjävesi", featureConfig.postOffice)
        assertEquals("Petäjäveden kunta", featureConfig.municipalMessageAccountName)
        assertEquals(144, featureConfig.citizenReservationThresholdHours)
    }
}
