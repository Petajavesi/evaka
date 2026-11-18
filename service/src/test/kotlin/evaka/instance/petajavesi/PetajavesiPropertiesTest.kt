// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi

import kotlin.random.Random
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import org.junit.jupiter.api.Test

class PetajavesiPropertiesTest {
    // SFTP-asetusten muunnos säilyttää isäntäavaimen
    // käsittelyn
    @Test
    fun `host keys are preserved and verification is not skipped`() {
        val random = Random(7)
        repeat(100) {
            val hostKeys =
                (1..random.nextInt(1, 4)).map { "ssh-ed25519 AAAA${random.nextInt(1000, 9999)}" }
            val usePassword = random.nextBoolean()
            val sftp =
                SftpProperties(
                    host = "sftp.example.test",
                    port = random.nextInt(1, 65536),
                    hostKeys = hostKeys,
                    username = "evaka",
                    password = if (usePassword) "salasana" else null,
                    privateKey = if (usePassword) null else "-----BEGIN",
                    prefix = if (random.nextBoolean()) "in/" else "",
                )
            val env = sftp.toSftpEnv()
            assertEquals(hostKeys, env.hostKeys)
            assertFalse(env.skipHostKeyVerification)
            assertEquals(sftp.host, env.host)
            assertEquals(sftp.port, env.port)
            assertEquals(sftp.username, env.username)
            assertEquals(sftp.password, env.password?.value)
            assertEquals(sftp.privateKey, env.privateKey?.value)
        }
    }

    @Test
    fun `host keys are mandatory because verification is never skipped`() {
        val sftp =
            SftpProperties(host = "sftp.example.test", username = "evaka", password = "salasana")
        assertFailsWith<IllegalStateException> { sftp.toSftpEnv() }
    }

    @Test
    fun `sftp is absent when not configured`() {
        assertNull(PetajavesiProperties().invoice.sftp)
    }
}
