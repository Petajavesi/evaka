// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.message.config

import evaka.core.shared.message.EvakaMessageProvider
import evaka.core.shared.message.IMessageProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/** Suomi.fi-viestien otsikot ja sisällöt: sama coren toteutus kuin lähtötilanteessa. */
@Configuration
class MessageConfiguration {
    @Bean fun messageProvider(): IMessageProvider = EvakaMessageProvider()
}
