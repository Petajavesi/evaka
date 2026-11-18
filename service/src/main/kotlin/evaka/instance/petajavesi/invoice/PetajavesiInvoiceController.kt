// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice

import evaka.core.Audit
import evaka.core.ExcludeCodeGen
import evaka.core.invoicing.service.InvoiceGenerator
import evaka.core.shared.auth.AuthenticatedUser
import evaka.core.shared.db.Database
import evaka.core.shared.domain.EvakaClock
import evaka.core.shared.security.AccessControl
import evaka.core.shared.security.Action
import java.time.YearMonth
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * Laskuluonnosten muodostus valittavalle kuukaudelle. Rinnakkainen upstreamin `POST
 * /employee/invoices/create-drafts`-päätepisteen kanssa, jotta upstreamin `InvoiceController` pysyy
 * muuttumattomana. Frontend-kutsu on kirjoitettu käsin (`Invoices.tsx`), joten päätepiste on
 * jätetty koodigeneroinnin ulkopuolelle.
 */
@ExcludeCodeGen
@RestController
@RequestMapping("/employee/petajavesi/invoices")
class PetajavesiInvoiceController(
    private val accessControl: AccessControl,
    private val generator: InvoiceGenerator,
) {
    @PostMapping("/create-drafts")
    fun createDraftInvoices(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) month: Int?,
    ) {
        db.connect { dbc ->
            dbc.transaction {
                accessControl.requirePermissionFor(
                    it,
                    user,
                    clock,
                    Action.Global.CREATE_DRAFT_INVOICES,
                )
                generator.generateAllDraftInvoices(it, targetMonth(clock, year, month))
            }
        }
        Audit.InvoicesCreate.log()
    }
}

/**
 * Kohdekuukausi: annettu vuosi–kuukausi, tai kun kumpi tahansa puuttuu, kutsuhetkeä edeltävä
 * kalenterikuukausi kuten upstreamin `InvoiceController.createDraftInvoices`.
 */
internal fun targetMonth(clock: EvakaClock, year: Int?, month: Int?): YearMonth =
    if (year != null && month != null) {
        YearMonth.of(year, month)
    } else {
        val firstOfLastMonth = clock.today().withDayOfMonth(1).minusMonths(1)
        YearMonth.of(firstOfLastMonth.year, firstOfLastMonth.month)
    }
