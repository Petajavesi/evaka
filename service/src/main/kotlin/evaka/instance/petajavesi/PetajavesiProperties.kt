// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi

import evaka.core.Sensitive
import evaka.core.SftpEnv
import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Petäjäveden omat asetukset (`petajavesi.*`). Luetaan ympäristömuuttujista
 * `PETAJAVESI_INVOICE_SFTP_*` samoilla avaimilla kuin aiemmin (`petajavesi.invoice.sftp.host`
 * jne.). Kun `petajavesi.invoice.sftp.host`-asetusta ei ole, `invoice.sftp` on null ja SFTP-lähetys
 * ohitetaan.
 */
@ConfigurationProperties(prefix = "petajavesi")
data class PetajavesiProperties(val invoice: InvoiceProperties = InvoiceProperties())

data class InvoiceProperties(val sftp: SftpProperties? = null)

data class SftpProperties(
    val host: String,
    val port: Int = 22,
    val hostKeys: List<String> = emptyList(),
    val username: String,
    val password: String? = null,
    val privateKey: String? = null,
    val prefix: String = "",
) {
    /** Isäntäavaimen käsittely säilyy ennallaan: avaimet annetaan, varmennusta ei ohiteta. */
    fun toSftpEnv(): SftpEnv =
        SftpEnv(
            host = host,
            port = port,
            username = username,
            password = password?.let { Sensitive(it) },
            privateKey = privateKey?.let { Sensitive(it) },
            hostKeys = hostKeys,
        )
}
