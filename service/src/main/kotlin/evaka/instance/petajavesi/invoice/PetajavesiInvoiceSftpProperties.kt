// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice

import evaka.core.Sensitive
import evaka.core.SftpEnv
import evaka.core.lookup
import org.springframework.core.env.Environment

data class PetajavesiInvoiceSftpProperties(
    val host: String,
    val port: Int,
    val hostKeys: List<String>,
    val username: String,
    val password: String?,
    val privateKey: String?,
    val prefix: String,
) {
    fun toSftpEnv(): SftpEnv =
        SftpEnv(
            host = host,
            port = port,
            username = username,
            password = password?.let { Sensitive(it) },
            privateKey = privateKey?.let { Sensitive(it) },
            hostKeys = hostKeys,
        )

    companion object {
        fun fromEnvironment(env: Environment): PetajavesiInvoiceSftpProperties? {
            val host: String? = env.lookup("petajavesi.invoice.sftp.host")
            if (host == null) return null
            return PetajavesiInvoiceSftpProperties(
                host = host,
                port = env.lookup<Int?>("petajavesi.invoice.sftp.port") ?: 22,
                hostKeys = env.lookup("petajavesi.invoice.sftp.host-keys"),
                username = env.lookup("petajavesi.invoice.sftp.username"),
                password = env.lookup("petajavesi.invoice.sftp.password"),
                privateKey = env.lookup("petajavesi.invoice.sftp.private-key"),
                prefix = env.lookup<String?>("petajavesi.invoice.sftp.prefix") ?: "",
            )
        }
    }
}
