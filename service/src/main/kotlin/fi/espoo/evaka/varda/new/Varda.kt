// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.varda.new

import fi.espoo.evaka.daycare.domain.ProviderType
import fi.espoo.evaka.varda.VardaUnitProviderType
import java.net.URI
import java.time.LocalDate

interface Diffable<T> {
    fun diffEq(other: T): Boolean
}

data class DiffResult<Old, New>(
    val removed: List<Old>,
    val added: List<New>,
    val unchanged: List<Pair<Old, New>>,
)

fun <Old, New : Diffable<Old>> diff(old: List<Old>, new: List<New>): DiffResult<Old, New> {
    val removed = old.filter { oldItem -> new.none { newItem -> newItem.diffEq(oldItem) } }
    val added = new.filter { newItem -> old.none { oldItem -> newItem.diffEq(oldItem) } }
    val unchanged =
        old.mapNotNull { oldItem ->
            val newItem = new.find { it.diffEq(oldItem) }
            if (newItem == null) {
                null
            } else {
                Pair(oldItem, newItem)
            }
        }
    return DiffResult(removed, added, unchanged)
}

data class Lapsi(
    val vakatoimija_oid: String?,
    val oma_organisaatio_oid: String?,
    val paos_organisaatio_oid: String?,
) : Diffable<VardaClient.LapsiResponse> {
    companion object {
        fun fromEvaka(data: VardaServiceNeed, omaOrganisaatioOid: String): Lapsi =
            if (data.providerType == ProviderType.PRIVATE_SERVICE_VOUCHER) {
                Lapsi(
                    vakatoimija_oid = null,
                    oma_organisaatio_oid = omaOrganisaatioOid,
                    paos_organisaatio_oid = data.ophOrganizerOid,
                )
            } else {
                Lapsi(
                    vakatoimija_oid = data.ophOrganizerOid,
                    oma_organisaatio_oid = null,
                    paos_organisaatio_oid = null
                )
            }
    }

    fun toVarda(lahdejarjestelma: String, henkilo: URI) =
        VardaClient.CreateLapsiRequest(
            lahdejarjestelma = lahdejarjestelma,
            henkilo = henkilo,
            vakatoimija_oid = vakatoimija_oid,
            oma_organisaatio_oid = oma_organisaatio_oid,
            paos_organisaatio_oid = paos_organisaatio_oid
        )

    override fun diffEq(other: VardaClient.LapsiResponse): Boolean =
        vakatoimija_oid == other.vakatoimija_oid &&
            oma_organisaatio_oid == other.oma_organisaatio_oid &&
            paos_organisaatio_oid == other.paos_organisaatio_oid
}

data class Varhaiskasvatuspaatos(
    val alkamis_pvm: LocalDate,
    val paattymis_pvm: LocalDate?,
    val hakemus_pvm: LocalDate,
    val vuorohoito_kytkin: Boolean,
    val tilapainen_vaka_kytkin: Boolean,
    val pikakasittely_kytkin: Boolean,
    val tuntimaara_viikossa: Double,
    val paivittainen_vaka_kytkin: Boolean,
    val kokopaivainen_vaka_kytkin: Boolean,
    val jarjestamismuoto_koodi: String,
) : Diffable<VardaClient.VarhaiskasvatuspaatosResponse> {
    companion object {
        fun fromEvaka(data: VardaServiceNeed): Varhaiskasvatuspaatos =
            Varhaiskasvatuspaatos(
                hakemus_pvm = data.applicationDate,
                alkamis_pvm = data.range.start,
                paattymis_pvm = data.range.end,
                pikakasittely_kytkin = data.urgent,
                tuntimaara_viikossa = data.hoursPerWeek,
                tilapainen_vaka_kytkin = data.temporary,
                paivittainen_vaka_kytkin = data.daily,
                kokopaivainen_vaka_kytkin = data.hoursPerWeek >= 25,
                vuorohoito_kytkin = data.shiftCare,
                jarjestamismuoto_koodi =
                    VardaUnitProviderType.fromEvakaProviderType(data.providerType).vardaCode,
            )
    }

    fun toVarda(lahdejarjestelma: String, lapsi: URI) =
        VardaClient.CreateVarhaiskasvatuspaatosRequest(
            lahdejarjestelma = lahdejarjestelma,
            lapsi = lapsi,
            alkamis_pvm = alkamis_pvm,
            paattymis_pvm = paattymis_pvm,
            hakemus_pvm = hakemus_pvm,
            vuorohoito_kytkin = vuorohoito_kytkin,
            tilapainen_vaka_kytkin = tilapainen_vaka_kytkin,
            pikakasittely_kytkin = pikakasittely_kytkin,
            tuntimaara_viikossa = tuntimaara_viikossa,
            paivittainen_vaka_kytkin = paivittainen_vaka_kytkin,
            kokopaivainen_vaka_kytkin = kokopaivainen_vaka_kytkin,
            jarjestamismuoto_koodi = jarjestamismuoto_koodi,
        )

    override fun diffEq(other: VardaClient.VarhaiskasvatuspaatosResponse): Boolean =
        alkamis_pvm == other.alkamis_pvm &&
            paattymis_pvm == other.paattymis_pvm &&
            hakemus_pvm == other.hakemus_pvm &&
            vuorohoito_kytkin == other.vuorohoito_kytkin &&
            tilapainen_vaka_kytkin == other.tilapainen_vaka_kytkin &&
            pikakasittely_kytkin == other.pikakasittely_kytkin &&
            tuntimaara_viikossa == other.tuntimaara_viikossa &&
            paivittainen_vaka_kytkin == other.paivittainen_vaka_kytkin &&
            kokopaivainen_vaka_kytkin == other.kokopaivainen_vaka_kytkin &&
            jarjestamismuoto_koodi == other.jarjestamismuoto_koodi
}

data class Varhaiskasvatussuhde(
    val toimipaikka_oid: String,
    val alkamis_pvm: LocalDate,
    val paattymis_pvm: LocalDate?,
) : Diffable<VardaClient.VarhaiskasvatussuhdeResponse> {
    companion object {
        fun fromEvaka(data: VardaServiceNeed): Varhaiskasvatussuhde =
            Varhaiskasvatussuhde(
                toimipaikka_oid = data.ophUnitOid,
                alkamis_pvm = data.range.start,
                paattymis_pvm = data.range.end,
            )
    }

    fun toVarda(lahdejarjestelma: String, varhaiskasvatuspaatos: URI) =
        VardaClient.CreateVarhaiskasvatussuhdeRequest(
            lahdejarjestelma = lahdejarjestelma,
            varhaiskasvatuspaatos = varhaiskasvatuspaatos,
            toimipaikka_oid = toimipaikka_oid,
            alkamis_pvm = alkamis_pvm,
            paattymis_pvm = paattymis_pvm,
        )

    override fun diffEq(other: VardaClient.VarhaiskasvatussuhdeResponse): Boolean =
        toimipaikka_oid == other.toimipaikka_oid &&
            alkamis_pvm == other.alkamis_pvm &&
            paattymis_pvm == other.paattymis_pvm
}
