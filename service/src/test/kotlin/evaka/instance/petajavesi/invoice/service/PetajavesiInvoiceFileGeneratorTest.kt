// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice.service

import java.nio.charset.Charset
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import org.junit.jupiter.api.Test

/**
 * Synteettinen golden-testi (vrt. Oulun `ProEInvoiceGeneratorTest`): keksitystä aineistosta
 * muodostetun laskutiedoston on oltava tavulleen sama kuin tallennettu odotus
 * `petajavesi/invoice-client/CorrectPetajavesiInvoice.txt`. Odotus on tuotettu lähtötilanteen
 * (upstream v20260731 + Petäjäveden muutokset) generaattorilla, joten testi vartioi tiedostomuodon
 * säilymistä upstream-päivityksissä. Jos muoto muuttuu tarkoituksella, päivitä odotustiedosto ja
 * katselmoi ero.
 */
class PetajavesiInvoiceFileGeneratorTest {
    private val cp1252: Charset = Charset.forName("windows-1252")
    private val resource = "/petajavesi/invoice-client/CorrectPetajavesiInvoice.txt"

    private fun expected(): ByteArray =
        checkNotNull(javaClass.getResourceAsStream(resource)) { "puuttuu: $resource" }
            .use { it.readAllBytes() }

    @Test
    fun `generated file equals the stored expectation byte for byte`() {
        val actual =
            PetajavesiInvoiceFileGenerator.generate(
                PetajavesiInvoiceFixtures.sendable,
                PetajavesiInvoiceFixtures.serviceNeedNames,
            )
        val expected = expected()
        val firstDiff =
            (0 until minOf(actual.size, expected.size)).firstOrNull { actual[it] != expected[it] }
                ?: if (actual.size != expected.size) minOf(actual.size, expected.size) else null
        if (firstDiff != null) {
            val line = expected.take(firstDiff).count { it == '\n'.code.toByte() } + 1
            val column = firstDiff - (expected.take(firstDiff).lastIndexOf('\n'.code.toByte()) + 1)
            val expectedLine = expected.toString(cp1252).lines().getOrNull(line - 1)
            val actualLine = actual.toString(cp1252).lines().getOrNull(line - 1)
            throw AssertionError(
                "Laskutiedosto eroaa odotuksesta: tavu $firstDiff (rivi $line, sarake ${column + 1}), " +
                    "koot ${actual.size}/${expected.size}\nodotettu: $expectedLine\nsaatu:    $actualLine"
            )
        }
    }

    @Test
    fun `stored expectation is a valid cp1252 fixed-width file`() {
        val text = expected().toString(cp1252)
        assertTrue(text.toByteArray(cp1252).contentEquals(expected()))
        val lengths = text.lines().filter { it.isNotEmpty() }.map { it.length }
        val expectedLengths =
            PetajavesiInvoiceFixtures.sendable.flatMap { inv ->
                listOf(600) + inv.rows.flatMap { listOf(265, 200, 200) }
            }
        assertEquals(expectedLengths, lengths)
    }
}
