// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.service

import fi.espoo.evaka.invoicing.domain.FeeAlterationType
import fi.espoo.evaka.placement.PlacementType

object PetajavesiInvoiceProducts {
    enum class Product(
        val nameFi: String,
        // val nameSv: String, // Uncomment if Swedish names are needed
    ) {
        DAYCARE(
            "Varhaiskasvatusmaksu",
            // "Avgift för småbarnspedagogik" // Uncomment if Swedish names are needed
            ),
        DAYCARE_DISCOUNT("Varhaiskasvatusmaksun alennus"),
        DAYCARE_INCREASE("Varhaiskasvatusmaksun korotus"),
        PRESCHOOL_WITH_DAYCARE("Täydentävän varhaiskasvatuksen maksu"),
        PRESCHOOL_WITH_DAYCARE_DISCOUNT("Täydentävän varhaiskasvatuksen maksun alennus"),
        PRESCHOOL_WITH_DAYCARE_INCREASE("Täydentävä varhaiskasvatus maksun korotus"),
        TEMPORARY_CARE("Tilapäishoito"),
        SICK_LEAVE_100("Hyvitys sairauspoissaoloista 100 %"),
        SICK_LEAVE_50("Hyvitys sairauspoissaoloista 50 %"),
        ABSENCE("Poissaolo");

        val key = ProductKey(this.name)
    }

    fun findProduct(key: ProductKey) =
        Product.entries.find { it.key == key } ?: error("Product with key $key not found")

    class Provider : InvoiceProductProvider {
        override val products = Product.entries.map { ProductWithName(it.key, it.nameFi) }
        override val dailyRefund = Product.ABSENCE.key
        override val partMonthSickLeave = Product.SICK_LEAVE_50.key
        override val fullMonthSickLeave = Product.SICK_LEAVE_100.key
        override val fullMonthAbsence = Product.ABSENCE.key

        override val contractSurplusDay
            get() = error("Contract days not used")

        override fun mapToProduct(placementType: PlacementType): ProductKey {
            val product =
                when (placementType) {
                    PlacementType.DAYCARE,
                    PlacementType.DAYCARE_PART_TIME,
                    PlacementType.DAYCARE_FIVE_YEAR_OLDS,
                    PlacementType.DAYCARE_PART_TIME_FIVE_YEAR_OLDS -> Product.DAYCARE
                    PlacementType.PRESCHOOL_DAYCARE -> Product.PRESCHOOL_WITH_DAYCARE
                    PlacementType.PREPARATORY_DAYCARE -> Product.PRESCHOOL_WITH_DAYCARE
                    PlacementType.TEMPORARY_DAYCARE,
                    PlacementType.TEMPORARY_DAYCARE_PART_DAY -> Product.TEMPORARY_CARE
                    PlacementType.PRESCHOOL,
                    PlacementType.PRESCHOOL_DAYCARE_ONLY,
                    PlacementType.PRESCHOOL_CLUB,
                    PlacementType.PREPARATORY,
                    PlacementType.PREPARATORY_DAYCARE_ONLY,
                    PlacementType.CLUB,
                    PlacementType.SCHOOL_SHIFT_CARE ->
                        error("No product mapping found for placement type $placementType")
                }
            return product.key
        }

        override fun mapToFeeAlterationProduct(
            productKey: ProductKey,
            feeAlterationType: FeeAlterationType,
        ): ProductKey {
            val product =
                when (findProduct(productKey) to feeAlterationType) {
                    Product.DAYCARE to FeeAlterationType.DISCOUNT,
                    Product.DAYCARE to FeeAlterationType.RELIEF -> Product.DAYCARE_DISCOUNT
                    Product.DAYCARE to FeeAlterationType.INCREASE -> Product.DAYCARE_INCREASE
                    Product.PRESCHOOL_WITH_DAYCARE to FeeAlterationType.DISCOUNT,
                    Product.PRESCHOOL_WITH_DAYCARE to FeeAlterationType.RELIEF ->
                        Product.PRESCHOOL_WITH_DAYCARE_DISCOUNT
                    Product.PRESCHOOL_WITH_DAYCARE to FeeAlterationType.INCREASE ->
                        Product.PRESCHOOL_WITH_DAYCARE_INCREASE
                    else ->
                        error(
                            "No product mapping found for product + fee alteration type combo ($productKey + $feeAlterationType)"
                        )
                }
            return product.key
        }
    }
}
