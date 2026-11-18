// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi

import evaka.core.VtjXroadEnv
import evaka.core.document.archival.ArchivalIntegrationClient
import evaka.core.holidayperiod.QuestionnaireType
import evaka.core.invoicing.domain.PaymentIntegrationClient
import evaka.core.logging.defaultAccessLoggingValve
import evaka.core.lookup
import evaka.core.mealintegration.DefaultMealTypeMapper
import evaka.core.mealintegration.MealTypeMapper
import evaka.core.shared.ArchiveProcessConfig
import evaka.core.shared.ArchiveProcessType
import evaka.core.shared.FeatureConfig
import evaka.core.shared.auth.PasswordConstraints
import evaka.core.shared.auth.PasswordSpecification
import evaka.core.shared.db.DevDataInitializer
import evaka.core.shared.security.actionrule.ActionRuleMapping
import evaka.core.titania.TitaniaEmployeeIdConverter
import evaka.core.vtjclient.config.httpsMessageSender
import evaka.instance.espoo.DefaultPasswordSpecification
import evaka.instance.petajavesi.security.PetajavesiActionRuleMapping
import io.github.oshai.kotlinlogging.KotlinLogging
import io.opentelemetry.api.trace.Tracer
import org.jdbi.v3.core.Jdbi
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory
import org.springframework.boot.web.server.WebServerFactoryCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.core.env.Environment
import org.springframework.core.env.Profiles
import org.springframework.ws.transport.WebServiceMessageSender
import tools.jackson.databind.json.JsonMapper

private val logger = KotlinLogging.logger {}

/**
 * Petäjäveden instanssikonfiguraatio. Sähköposti-, viesti-, pohja- ja laskutusbeanit ovat omissa
 * alikonfiguraatioissaan muiden kuntien instanssien rakenteen mukaisesti. Arvot vastaavat
 * lähtötilannetta; ainoa tarkoituksellinen ero on `FeatureConfig.postOffice`.
 */
@Configuration
class PetajavesiConfig {

    @Bean
    fun featureConfig(): FeatureConfig =
        FeatureConfig(
            valueDecisionCapacityFactorEnabled = false,
            citizenReservationThresholdHours = 144,
            freeAbsenceGivesADailyRefund = true,
            alwaysUseDaycareFinanceDecisionHandler = false,
            paymentNumberSeriesStart = 1, // Maksatus ei ole käytössä Petäjävedellä
            unplannedAbsencesAreContractSurplusDays = false,
            maxContractDaySurplusThreshold = null,
            useContractDaysAsDailyFeeDivisor = true,
            requestedStartUpperLimit = 14,
            // Ulkokuntalaisrajaus maksupäätös- ja arvopäätöshaussa (child.post_office NOT ILIKE).
            // Lähtötilanteessa arvo oli virheellisesti ESPOO.
            postOffice = "Petäjävesi",
            municipalMessageAccountName = "Petäjäveden kunta",
            serviceWorkerMessageAccountName = "Petäjäveden varhaiskasvatus",
            financeMessageAccountName = "Varhaiskasvatuksen asiakasmaksut",
            messageSupportEmail = "varhaiskasvatus@petajavesi.fi",
            applyPlacementUnitFromDecision = false,
            preferredStartRelativeApplicationDueDate = false,
            fiveYearsOldDaycareEnabled = false,
            freeJulyStartOnSeptember = true,
            archiveMetadataOrganization = "Petäjäveden esiopetus ja varhaiskasvatus",
            metadataBusinessId = "0176769-2",
            archiveMetadataConfigs = { type: ArchiveProcessType, year: Int ->
                when (type) {
                    ArchiveProcessType.APPLICATION_DAYCARE ->
                        ArchiveProcessConfig(
                            processDefinitionNumber = "12.06.01",
                            archiveDurationMonths = 10 * 12,
                        )

                    ArchiveProcessType.APPLICATION_PRESCHOOL ->
                        ArchiveProcessConfig(
                            processDefinitionNumber = if (year >= 2026) "12.06.02" else "12.06.01",
                            archiveDurationMonths = 10 * 12,
                        )

                    ArchiveProcessType.APPLICATION_CLUB ->
                        ArchiveProcessConfig(
                            processDefinitionNumber = "12.06.01",
                            archiveDurationMonths = 10 * 12,
                        )

                    ArchiveProcessType.FEE_DECISION ->
                        ArchiveProcessConfig(
                            processDefinitionNumber = if (year >= 2026) "02.09.01" else "12.06.07",
                            archiveDurationMonths = 10 * 12,
                        )

                    ArchiveProcessType.VOUCHER_VALUE_DECISION ->
                        ArchiveProcessConfig(
                            processDefinitionNumber = if (year >= 2026) "02.09.01" else "12.06.08",
                            archiveDurationMonths = 10 * 12,
                        )
                }
            },
            holidayQuestionnaireType = QuestionnaireType.FIXED_PERIOD,
            placementDecisionSwedishLanguageEnabled = true,
        )

    /**
     * Maksatus ei ole käytössä: paikallisessa kehityksessä mock, muuten FailingClient (sama kuin
     * lähtötilanteessa).
     */
    @Bean
    fun paymentIntegrationClient(
        jsonMapper: JsonMapper,
        env: Environment,
    ): PaymentIntegrationClient =
        if (env.acceptsProfiles(Profiles.of("local")))
            PaymentIntegrationClient.MockClient(jsonMapper)
        else PaymentIntegrationClient.FailingClient()

    // VTJ-kysely X-Roadin kautta: samat ehdot kuin upstreamin Espoo-instanssissa.
    @Bean
    @Profile("local & vtj-dev")
    fun localWebServiceMessageSender(xroadEnv: VtjXroadEnv): WebServiceMessageSender =
        httpsMessageSender(xroadEnv.trustStore, null)

    @Bean
    @Profile("production")
    @ConditionalOnExpression("'\${voltti.env}' != 'prod' && '\${voltti.env}' != 'staging'")
    fun devWebServiceMessageSender(xroadEnv: VtjXroadEnv): WebServiceMessageSender =
        httpsMessageSender(xroadEnv.trustStore, null)

    @Bean
    @Profile("production")
    @ConditionalOnExpression("'\${voltti.env}' == 'prod' || '\${voltti.env}' == 'staging'")
    fun webServiceMessageSender(xroadEnv: VtjXroadEnv): WebServiceMessageSender =
        httpsMessageSender(xroadEnv.trustStore, xroadEnv.keyStore)

    @Bean
    fun titaniaEmployeeIdConverter(): TitaniaEmployeeIdConverter =
        object : TitaniaEmployeeIdConverter {
            override fun fromTitania(employeeId: String): String = employeeId.trimStart('0')
        }

    @Bean
    @Profile("local")
    fun devDataInitializer(jdbi: Jdbi, tracer: Tracer) = DevDataInitializer(jdbi, tracer)

    @Bean
    fun tomcatCustomizer(env: Environment) =
        WebServerFactoryCustomizer<TomcatServletWebServerFactory> {
            it.addContextValves(defaultAccessLoggingValve(env))
            it.setDisableMBeanRegistry(false)
        }

    @Bean fun actionRuleMapping(): ActionRuleMapping = PetajavesiActionRuleMapping()

    @Bean fun mealTypeMapper(): MealTypeMapper = DefaultMealTypeMapper

    @Bean
    fun passwordSpecification(): PasswordSpecification =
        DefaultPasswordSpecification(
            PasswordConstraints.UNCONSTRAINED.copy(
                minLength = 15,
                minLowers = 1,
                minUppers = 1,
                minDigits = 1,
                minSymbols = 1,
            )
        )

    /** Arkistointi-integraatio ei ole käytössä. */
    @Bean
    fun archivalIntegrationClient(): ArchivalIntegrationClient =
        ArchivalIntegrationClient.FailingClient()

    /**
     * Käyttöönoton todennus lokista: aktiivinen instanssi ja teholliset Flyway-sijainnit
     * riippumatta siitä, tulivatko ne profiilista vai ympäristömuuttujasta.
     */
    @Bean
    fun petajavesiStartupLogger(env: Environment) = ApplicationRunner {
        // Sama päättely kuin coren DatabaseEnv.fromEnvironment-funktiossa, mutta ilman
        // DatabaseEnv-beania,
        // jota integraatiotestit eivät muodosta.
        val flywayLocations =
            env.lookup<List<String>?>("evaka.database.flyway.locations") ?: listOf("db/migration")
        logger.info { "Active eVaka instance: petajavesi, Flyway locations: $flywayLocations" }
    }
}
