// SPDX-FileCopyrightText: 2017-2026 City of Espoo
// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later
//
// Kopioitu Petäjäveden pakettiin (tagi v20260731), jotta Petäjäveden instanssi ei viittaa
// pakettiin evaka.instance.espoo. Sisältö on identtinen alkuperäisen kanssa.
package evaka.instance.petajavesi.invoice.service

import evaka.core.invoicing.domain.IncomeCoefficient
import evaka.core.invoicing.service.IncomeCoefficientMultiplierProvider
import java.math.BigDecimal

class PetajavesiIncomeCoefficientMultiplierProvider : IncomeCoefficientMultiplierProvider {

    override fun multiplier(coefficient: IncomeCoefficient): BigDecimal =
        when (coefficient) {
            IncomeCoefficient.MONTHLY_WITH_HOLIDAY_BONUS -> BigDecimal("1.0417")
            IncomeCoefficient.MONTHLY_NO_HOLIDAY_BONUS -> BigDecimal("1.0000")
            IncomeCoefficient.BI_WEEKLY_WITH_HOLIDAY_BONUS -> BigDecimal("2.2323")
            IncomeCoefficient.BI_WEEKLY_NO_HOLIDAY_BONUS -> BigDecimal("2.1429")
            IncomeCoefficient.DAILY_ALLOWANCE_21_5 -> BigDecimal("21.5")
            IncomeCoefficient.DAILY_ALLOWANCE_25 -> BigDecimal("25")
            IncomeCoefficient.YEARLY -> BigDecimal("0.0833")
        }
}
