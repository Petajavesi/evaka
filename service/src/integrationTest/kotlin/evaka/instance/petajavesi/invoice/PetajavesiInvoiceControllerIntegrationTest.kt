// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice

import evaka.core.shared.auth.AuthenticatedUser
import evaka.core.shared.auth.UserRole
import evaka.core.shared.db.Database
import evaka.core.shared.dev.DevEmployee
import evaka.core.shared.dev.feeThresholds2020
import evaka.core.shared.dev.insert
import evaka.core.shared.dev.resetDatabase
import evaka.core.shared.domain.Forbidden
import evaka.core.shared.domain.HelsinkiDateTime
import evaka.core.shared.domain.MockEvakaClock
import evaka.core.shared.noopTracer
import evaka.instance.petajavesi.AbstractPetajavesiIntegrationTest
import java.time.LocalDate
import java.time.LocalTime
import org.jdbi.v3.core.Jdbi
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired

/** Laskuluonnosten muodostus vaatii oikeuden `Action.Global.CREATE_DRAFT_INVOICES`. */
class PetajavesiInvoiceControllerIntegrationTest : AbstractPetajavesiIntegrationTest() {
    @Autowired private lateinit var jdbi: Jdbi
    @Autowired private lateinit var controller: PetajavesiInvoiceController

    private lateinit var db: Database.Connection
    private val clock =
        MockEvakaClock(HelsinkiDateTime.of(LocalDate.of(2026, 3, 15), LocalTime.of(10, 0)))

    @BeforeEach
    fun beforeEach() {
        db = Database(jdbi, noopTracer()).connectWithManualLifecycle()
        db.transaction {
            it.resetDatabase()
            it.insert(feeThresholds2020)
        }
    }

    @AfterEach
    fun afterEach() {
        db.close()
    }

    private fun employeeWith(vararg roles: UserRole): AuthenticatedUser.Employee {
        val id = db.transaction { it.insert(DevEmployee(roles = roles.toSet())) }
        return AuthenticatedUser.Employee(id, roles.toSet())
    }

    @Test
    fun `admin and finance admin may create draft invoices`() {
        for (role in listOf(UserRole.ADMIN, UserRole.FINANCE_ADMIN)) {
            val user = employeeWith(role)
            controller.createDraftInvoices(Database(jdbi, noopTracer()), user, clock, null, null)
            controller.createDraftInvoices(Database(jdbi, noopTracer()), user, clock, 2026, 1)
        }
    }

    @Test
    fun `other roles are forbidden`() {
        // Työntekijän roolit ovat globaaleja rooleja (employee.roles-rajoite); yksikkökohtaiset
        // roolit eivät voi olla globaaleja.
        val denied = UserRole.GLOBAL_ROLES - setOf(UserRole.ADMIN, UserRole.FINANCE_ADMIN)
        assert(denied.isNotEmpty())
        for (role in denied) {
            val user = employeeWith(role)
            assertThrows<Forbidden> {
                controller.createDraftInvoices(Database(jdbi, noopTracer()), user, clock, 2026, 1)
            }
        }
        val noRoles = employeeWith()
        assertThrows<Forbidden> {
            controller.createDraftInvoices(Database(jdbi, noopTracer()), noRoles, clock, null, null)
        }
    }
}
