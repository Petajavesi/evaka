// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi

import evaka.PetajavesiInstance
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.ActiveProfiles

/**
 * Nostaa Spring-kontekstin Petäjäveden instanssilla ja profiililla `petajavesi_evaka`. VTJ-yhteys
 * korvataan testikonfiguraation yksinkertaisella lähettäjällä.
 */
@ActiveProfiles(value = ["integration-test", "petajavesi_evaka"])
@Import(PetajavesiInstance::class)
@SpringBootTest(classes = [PetajavesiIntegrationTestConfiguration::class])
abstract class AbstractPetajavesiIntegrationTest
