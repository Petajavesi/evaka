// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi

import evaka.instance.petajavesi.invoice.config.InvoiceConfiguration
import evaka.instance.petajavesi.template.config.PetajavesiTemplateProvider
import java.io.File
import java.util.Properties
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue
import org.junit.jupiter.api.Test

/**
 * Rakenteelliset ominaisuudet, jotka luetaan lähdepuusta. Gradle ajaa testit moduulihakemistossa
 * `service`, joten polut ovat suhteellisia siihen.
 */
class PetajavesiInstanceLayoutTest {
    private val main = File("src/main")
    private val petajavesiTemplates = File(main, "resources/petajavesi/templates")

    private fun relativeFiles(dir: File): Set<String> =
        dir.walkTopDown().filter { it.isFile }.map { it.relativeTo(dir).path }.toSet()

    private fun keys(file: File): Set<String> =
        Properties().apply { file.inputStream().use { load(it) } }.stringPropertyNames()

    private val provider = PetajavesiTemplateProvider()
    private val roots =
        listOf(
            provider.getDaycareDecisionPath(),
            provider.getDaycareTransferDecisionPath(),
            provider.getPreschoolDecisionPath(),
            provider.getFeeDecisionPath(),
        )

    // Jokaisella käytössä olevalla päätöspohjalla on HTML ja tekstit, ja jokainen pohjien välinen
    // viittaus osoittaa olemassa olevaan tiedostoon. Puuttuva pohja kaatuisi vasta päätöstä
    // tehtäessä.
    @Test
    fun `every template in use and every referenced fragment exists`() {
        for (root in roots) {
            assertTrue(File(petajavesiTemplates, "$root.html").isFile, "puuttuu $root.html")
            assertTrue(
                File(petajavesiTemplates, "$root.properties").isFile,
                "puuttuu $root.properties",
            )
        }
        val reference = Regex("""~\{\s*([A-Za-z0-9/_-]+)(?:\.html)?\s*(?:::|\})""")
        val missing =
            petajavesiTemplates
                .walkTopDown()
                .filter { it.extension == "html" }
                .flatMap { file -> reference.findAll(file.readText()).map { it.groupValues[1] } }
                .distinct()
                .filterNot { File(petajavesiTemplates, "$it.html").isFile }
                .toList()
        assertTrue(missing.isEmpty(), "viittaus puuttuvaan pohjaan: $missing")
    }

    // Tekstit ovat vain suomeksi kieliriippumattomissa nipuissa, jolloin ruotsinkielinen päätös
    // saa samat tekstit. Jokainen pohjan käyttämä tekstiavain löytyy pohjan omasta nipusta tai
    // päätöspohjan nipusta; puuttuva avain näkyisi päätöksessä muodossa ??avain??.
    @Test
    fun `texts are language independent and every message key resolves`() {
        val localized =
            relativeFiles(petajavesiTemplates).filter {
                it.matches(Regex(""".*_[a-z]{2}\.properties"""))
            }
        assertTrue(localized.isEmpty(), "kielikohtaisia nippuja: $localized")
        val rootKeys = roots.flatMap { keys(File(petajavesiTemplates, "$it.properties")) }.toSet()
        val key = Regex("""#\{([A-Za-z0-9_.-]+)""")
        val unresolved =
            petajavesiTemplates
                .walkTopDown()
                .filter { it.extension == "html" }
                .flatMap { file ->
                    val bundle = File(file.path.removeSuffix(".html") + ".properties")
                    val own = if (bundle.isFile) keys(bundle) else emptySet()
                    key.findAll(file.readText())
                        .map { it.groupValues[1] }
                        .filterNot { it in own || it in rootKeys }
                        .map { "${file.relativeTo(petajavesiTemplates)}: $it" }
                }
                .toList()
        assertTrue(unresolved.isEmpty(), "tekstiavain puuttuu: $unresolved")
        val localeConditions =
            petajavesiTemplates
                .walkTopDown()
                .filter { it.extension == "html" && it.readText().contains("#locale") }
                .toList()
        assertTrue(localeConditions.isEmpty(), "kieliehto pohjassa: $localeConditions")
    }

    @Test
    fun `decision types not in use have no template`() {
        assertFailsWith<UnsupportedOperationException> { provider.getClubDecisionPath() }
        assertFailsWith<UnsupportedOperationException> { provider.getPreparatoryDecisionPath() }
        assertFailsWith<UnsupportedOperationException> { provider.getDaycareVoucherDecisionPath() }
        assertFailsWith<UnsupportedOperationException> { provider.getVoucherValueDecisionPath() }
    }

    // Migraatioiden versionumerot eivät toistu,
    // skeema ei muutu
    @Test
    fun `petajavesi migrations contain no versioned migrations`() {
        val petajavesi =
            File(main, "resources/petajavesi/db/migration").listFiles().orEmpty().map { it.name }
        val versioned = petajavesi.filter { it.startsWith("V") }
        assertTrue(
            versioned.isEmpty(),
            "versioituja migraatioita Petäjäveden sijainnissa: $versioned",
        )
        assertEquals(listOf("afterMigrate__autovacuum_analyze_options.sql"), petajavesi.sorted())
        val core =
            File(main, "resources/db/migration")
                .listFiles()
                .orEmpty()
                .map { it.name.substringBefore("__") }
                .toSet()
        assertTrue(core.none { petajavesi.map { p -> p.substringBefore("__") }.contains(it) })
    }

    // Paketti evaka.core ei viittaa Petäjäveden
    // pakettiin
    @Test
    fun `core and espoo do not reference the petajavesi package`() {
        val symbols =
            listOf(
                "evaka.instance.petajavesi",
                "PetajavesiInvoiceProducts",
                "formatInvoiceHeaderLine",
                "formatServiceNeedDescription",
                "formatLocationTimeDescription",
                "PetajavesiInvoice",
            )
        val offenders =
            listOf(File(main, "kotlin/evaka/core"), File(main, "kotlin/evaka/instance/espoo"))
                .flatMap { dir ->
                    dir.walkTopDown().filter { it.isFile && it.extension == "kt" }.toList()
                }
                .filter { file ->
                    file.readText().let { text -> symbols.any { text.contains(it) } }
                }
                .map { it.path }
        assertTrue(offenders.isEmpty(), "viittauksia Petäjäveden koodiin: $offenders")
    }

    // Instanssin valinta tuntee
    // Petäjäveden ja käyttää sitä oletuksena. Main.kt on upstream-poikkeuslistalla, joten merge voi
    // pudottaa haaran huomaamatta.
    @Test
    fun `main selects the petajavesi instance and defaults to it`() {
        val source = File(main, "kotlin/evaka/Main.kt").readText()
        assertTrue(source.contains("\"petajavesi\" -> PetajavesiInstance::class.java"))
        assertTrue(source.contains("System.getenv(\"EVAKA_MUNICIPALITY\") ?: \"petajavesi\""))
        assertTrue(source.contains("else -> error(\"Unknown municipality: \$municipality\")"))
    }

    // Profiilitiedostossa ei ole salaisuuksia
    @Test
    fun `profile contains no secrets`() {
        val lines = File(main, "resources/application-petajavesi_evaka.yaml").readLines()
        val secretKey = Regex("(?i)(password|secret|api[_-]?key|token|private[_-]?key)\\s*:")
        val suspicious = lines.filter { secretKey.containsMatchIn(it) || it.contains("BEGIN ") }
        assertTrue(suspicious.isEmpty(), "epäilyttävät rivit: $suspicious")
    }

    // Salasanavaatimukset toteutuvat (rakenteelliset
    // rajat)
    @Test
    fun `password constraints`() {
        val c = PetajavesiConfig().passwordSpecification().constraints()
        assertEquals(15, c.minLength)
        assertEquals(1, c.minLowers)
        assertEquals(1, c.minUppers)
        assertEquals(1, c.minDigits)
        assertEquals(1, c.minSymbols)
    }

    @Test
    fun `feature config and invoice number series`() {
        assertEquals("Petäjävesi", PetajavesiConfig().featureConfig().postOffice)
        val field =
            InvoiceConfiguration()
                .invoiceNumberProvider()
                .javaClass
                .getDeclaredField("seriesStart")
                .apply { isAccessible = true }
        assertEquals(5000000000L, field.get(InvoiceConfiguration().invoiceNumberProvider()))
    }
}
