// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi

import com.auth0.jwt.algorithms.Algorithm
import evaka.core.BucketEnv
import evaka.core.shared.config.getTestDataSource
import evaka.core.shared.db.configureJdbi
import evaka.core.vtjclient.service.persondetails.IPersonDetailsService
import evaka.core.vtjclient.service.persondetails.MockPersonDetailsService
import java.security.KeyPairGenerator
import java.security.interfaces.RSAPublicKey
import javax.sql.DataSource
import org.jdbi.v3.core.Jdbi
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.ws.transport.WebServiceMessageSender
import org.springframework.ws.transport.http.HttpUrlConnectionMessageSender
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.internal.http.loader.DefaultSdkHttpClientBuilder
import software.amazon.awssdk.http.SdkHttpConfigurationOption
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.S3Configuration
import software.amazon.awssdk.services.s3.model.CreateBucketRequest
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import software.amazon.awssdk.utils.AttributeMap

/**
 * Petäjäveden integraatiotestien testikonfiguraatio: vain infrastruktuuribeanit (kanta, S3-mock,
 * JWT). Kuntakohtaiset beanit tulevat PetajavesiInstance-konfiguraatiosta, jotta testit testaavat
 * oikeaa instanssia eivätkä coren testikonfiguraation Espoo-arvoja.
 */
@TestConfiguration
class PetajavesiIntegrationTestConfiguration {
    @Bean fun jdbi(dataSource: DataSource) = configureJdbi(Jdbi.create(dataSource))

    @Bean fun dataSource(): DataSource = getTestDataSource()

    /**
     * VTJ: ei avainsäilöä testeissä (classpath-URL vaatisi Tomcatin), kuten Tampereen seudun
     * testeissä.
     */
    @Bean fun webServiceMessageSender(): WebServiceMessageSender = HttpUrlConnectionMessageSender()

    @Bean fun personDetailsService(): IPersonDetailsService = MockPersonDetailsService()

    @Bean
    fun s3Client(bucketEnv: BucketEnv): S3Client =
        S3Client.builder()
            .httpClient(
                DefaultSdkHttpClientBuilder()
                    .buildWithDefaults(
                        AttributeMap.builder()
                            .put(SdkHttpConfigurationOption.TRUST_ALL_CERTIFICATES, true)
                            .build()
                    )
            )
            .region(Region.EU_WEST_1)
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
            .endpointOverride(bucketEnv.localS3Url)
            .credentialsProvider(
                StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(
                        bucketEnv.localS3AccessKeyId,
                        bucketEnv.localS3SecretAccessKey,
                    )
                )
            )
            .build()
            .also { client ->
                val existing = client.listBuckets().buckets().map { it.name()!! }
                bucketEnv
                    .allBuckets()
                    .filterNot { existing.contains(it) }
                    .forEach { bucket ->
                        client.createBucket(CreateBucketRequest.builder().bucket(bucket).build())
                    }
            }

    @Bean
    fun s3Presigner(bucketEnv: BucketEnv): S3Presigner =
        S3Presigner.builder()
            .region(Region.EU_WEST_1)
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
            .endpointOverride(bucketEnv.localS3Url)
            .credentialsProvider(
                StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(
                        bucketEnv.localS3AccessKeyId,
                        bucketEnv.localS3SecretAccessKey,
                    )
                )
            )
            .build()

    @Bean
    fun jwtAlgorithm(): Algorithm {
        val generator = KeyPairGenerator.getInstance("RSA")
        generator.initialize(2048)
        val keyPair = generator.generateKeyPair()
        return Algorithm.RSA256(keyPair.public as RSAPublicKey, null)
    }
}
