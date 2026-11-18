// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi.invoice

import evaka.core.shared.InvoiceRowId
import evaka.core.shared.db.Database

/**
 * Laskurivin palveluntarpeen nimi laskutiedostoa varten.
 *
 * Sama hakuehto kuin lähtötilanteessa upstreamin `invoiceDetailedQuery`-kyselyyn lisätyssä
 * liitoksessa (lapsen `SENT`-tilainen maksupäätös, jonka voimassaolo leikkaa laskurivin jakson),
 * mutta erillisenä kyselynä, jotta upstreamin kysely pysyy koskemattomana eikä liitos pudota tai
 * monista laskurivejä. Jos osumia on useita, valitaan viimeisin voimassaolon alun mukaan.
 */
fun Database.Read.getServiceNeedNamesByInvoiceRow(
    rowIds: Set<InvoiceRowId>
): Map<InvoiceRowId, String> {
    if (rowIds.isEmpty()) return emptyMap()
    return createQuery {
            sql(
                """
SELECT DISTINCT ON (row.id) row.id, service_need_option.name_fi
FROM invoice_row row
JOIN fee_decision_child ON fee_decision_child.child_id = row.child
JOIN fee_decision ON fee_decision_child.fee_decision_id = fee_decision.id
    AND fee_decision.status = 'SENT'
    AND fee_decision.valid_during && daterange(row.period_start, row.period_end, '[]')
JOIN service_need_option ON fee_decision_child.service_need_option_id = service_need_option.id
WHERE row.id = ANY(${bind(rowIds.toList())})
ORDER BY row.id, lower(fee_decision.valid_during) DESC, fee_decision.id
"""
            )
        }
        .toMap { columnPair<InvoiceRowId, String>("id", "name_fi") }
}
