// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice.config

import evaka.core.BucketEnv
import evaka.core.invoicing.integration.InvoiceIntegrationClient
import evaka.core.invoicing.service.DefaultInvoiceGenerationLogic
import evaka.core.invoicing.service.DefaultInvoiceNumberProvider
import evaka.core.invoicing.service.EspooIncomeTypesProvider
import evaka.core.invoicing.service.EspooInvoiceProducts
import evaka.core.invoicing.service.IncomeCoefficientMultiplierProvider
import evaka.core.invoicing.service.IncomeTypesProvider
import evaka.core.invoicing.service.InvoiceGenerationLogicChooser
import evaka.core.invoicing.service.InvoiceNumberProvider
import evaka.core.invoicing.service.InvoiceProductProvider
import evaka.core.shared.db.Database
import evaka.core.shared.sftp.SftpClient
import evaka.instance.petajavesi.PetajavesiProperties
import evaka.instance.petajavesi.invoice.getServiceNeedNamesByInvoiceRow
import evaka.instance.petajavesi.invoice.service.PetajavesiIncomeCoefficientMultiplierProvider
import evaka.instance.petajavesi.invoice.service.PetajavesiInvoiceIntegrationClient
import evaka.instance.petajavesi.invoice.service.ServiceNeedNameLookup
import io.opentelemetry.api.trace.Tracer
import org.jdbi.v3.core.Jdbi
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.services.s3.S3Client

@Configuration
class InvoiceConfiguration {

    /**
     * Ainoa laskuaineiston siirtoasiakas: S3-kirjoitus aina, SFTP vain kun
     * `petajavesi.invoice.sftp.*` on määritelty. Palveluntarpeen nimet haetaan omassa
     * lukuyhteydessä.
     */
    @Bean
    fun invoiceIntegrationClient(
        properties: PetajavesiProperties,
        s3Client: S3Client,
        bucketEnv: BucketEnv,
        jdbi: Jdbi,
        tracer: Tracer,
    ): InvoiceIntegrationClient {
        val sftp = properties.invoice.sftp
        val bucketName = System.getenv("EVAKA_BUCKET_INVOICES") ?: bucketEnv.data
        val serviceNeedNames = ServiceNeedNameLookup { rowIds ->
            Database(jdbi, tracer).connect { dbc ->
                dbc.read { tx -> tx.getServiceNeedNamesByInvoiceRow(rowIds) }
            }
        }
        return PetajavesiInvoiceIntegrationClient(
            s3Client = s3Client,
            bucketName = bucketName,
            sftpClient = sftp?.let { SftpClient(it.toSftpEnv()) },
            sftpPrefix = sftp?.prefix ?: "",
            serviceNeedNames = serviceNeedNames,
        )
    }

    // Tulolajit ja laskutuotteet ovat coren Espoo-toteutuksia, kuten lähtötilanteessa.
    @Bean fun incomeTypesProvider(): IncomeTypesProvider = EspooIncomeTypesProvider()

    @Bean
    fun coefficientMultiplierProvider(): IncomeCoefficientMultiplierProvider =
        PetajavesiIncomeCoefficientMultiplierProvider()

    @Bean fun invoiceProductsProvider(): InvoiceProductProvider = EspooInvoiceProducts.Provider()

    @Bean
    fun invoiceGenerationLogicChooser(): InvoiceGenerationLogicChooser =
        DefaultInvoiceGenerationLogic

    @Bean
    fun invoiceNumberProvider(): InvoiceNumberProvider = DefaultInvoiceNumberProvider(5000000000)
}
