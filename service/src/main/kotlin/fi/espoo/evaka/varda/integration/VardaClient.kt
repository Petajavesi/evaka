// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.varda.integration

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.kittinunf.fuel.core.FuelError
import com.github.kittinunf.fuel.core.FuelManager
import com.github.kittinunf.fuel.core.Headers
import com.github.kittinunf.fuel.core.Request
import com.github.kittinunf.fuel.core.ResponseResultOf
import com.github.kittinunf.fuel.core.extensions.authentication
import com.github.kittinunf.fuel.core.extensions.jsonBody
import com.github.kittinunf.result.Result
import fi.espoo.evaka.VardaEnv
import fi.espoo.evaka.shared.utils.responseStringWithRetries
import fi.espoo.evaka.shared.utils.token
import fi.espoo.evaka.varda.VardaChildRequest
import fi.espoo.evaka.varda.VardaChildResponse
import fi.espoo.evaka.varda.VardaDecision
import fi.espoo.evaka.varda.VardaDecisionResponse
import fi.espoo.evaka.varda.VardaFeeData
import fi.espoo.evaka.varda.VardaFeeDataResponse
import fi.espoo.evaka.varda.VardaPersonRequest
import fi.espoo.evaka.varda.VardaPersonResponse
import fi.espoo.evaka.varda.VardaPlacement
import fi.espoo.evaka.varda.VardaPlacementResponse
import fi.espoo.evaka.varda.VardaUnitRequest
import fi.espoo.evaka.varda.VardaUnitResponse
import fi.espoo.evaka.varda.VardaUpdateOrganizer
import fi.espoo.voltti.logging.loggers.error
import mu.KotlinLogging

private val logger = KotlinLogging.logger {}

class VardaClient(
    private val tokenProvider: VardaTokenProvider,
    private val fuel: FuelManager,
    private val objectMapper: ObjectMapper,
    env: VardaEnv,
) {
    private val organizerUrl = "${env.url}/v1/vakajarjestajat/"
    private val unitUrl = "${env.url}/v1/toimipaikat/"
    private val personUrl = "${env.url}/v1/henkilot/"
    private val personSearchUrl = "${env.url}/v1/hae-henkilo/"
    private val childUrl = "${env.url}/v1/lapset/"
    private val decisionUrl = "${env.url}/v1/varhaiskasvatuspaatokset/"
    private val placementUrl = "${env.url}/v1/varhaiskasvatussuhteet/"
    private val feeDataUrl = "${env.url}/v1/maksutiedot/"

    val getPersonUrl = { personId: Long -> "$personUrl$personId/" }
    val getChildUrl = { childId: Long -> "$childUrl$childId/" }
    val getDecisionUrl = { decisionId: Long -> "$decisionUrl$decisionId/" }
    val getPlacementUrl = { placementId: Long -> "$placementUrl$placementId/" }
    val sourceSystem: String = env.sourceSystem

    data class VardaRequestError(
        val method: String,
        val url: String,
        val body: String,
        val errorMessage: String,
        val errorCode: String?,
        val errorDescription: String?,
        val statusCode: String
    ) {
        fun asMap() = mapOf(
            "method" to method,
            "url" to url,
            "body" to body,
            "errorMessage" to errorMessage,
            "errorCode" to errorCode,
            "errorDescription" to errorDescription,
            "statusCode" to statusCode
        )
    }

    fun parseVardaErrorBody(errorString: String): Pair<List<String>, List<String>> {
        val codes = Regex("\"error_code\":\"(.+)\"").findAll(errorString).map { it.groupValues[1] }.toList()
        val descriptions = Regex("\"description\":\"(.+)\"").findAll(errorString).map { it.groupValues[1] }.toList()
        return Pair(codes, descriptions)
    }

    private fun parseVardaError(request: Request, error: FuelError): VardaRequestError {
        return try {
            val errorString = error.errorData.decodeToString()
            val (errorCodes, descriptions) = parseVardaErrorBody(errorString)
            VardaRequestError(
                method = request.method.toString(),
                url = request.url.toString(),
                body = request.body.asString("application/json"),
                errorMessage = errorString,
                errorCode = errorCodes.first(),
                errorDescription = descriptions.first(),
                statusCode = error.response.statusCode.toString()
            )
        } catch (e: Exception) {
            VardaRequestError(
                method = request.method.toString(),
                url = request.url.toString(),
                body = request.body.asString("application/json"),
                errorMessage = error.errorData.decodeToString(),
                errorCode = null,
                errorDescription = null,
                statusCode = error.response.statusCode.toString()
            )
        }
    }

    private fun vardaError(request: Request, error: FuelError, message: (meta: VardaRequestError) -> String): Nothing {
        val meta = parseVardaError(request, error)
        logger.error(request, meta.asMap()) {
            "VardaUpdate: request failed to ${meta.url}, status ${meta.statusCode}, reason ${meta.errorCode}: ${meta.errorDescription}"
        }
        error(message(meta))
    }

    data class VardaPersonSearchRequest(
        @JsonInclude(JsonInclude.Include.NON_NULL)
        val henkilotunnus: String? = null,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        val henkilo_oid: String? = null
    ) {
        init {
            check(henkilotunnus != null || henkilo_oid != null) {
                "Both params ssn and oid shouldn't be null"
            }
        }
    }

    fun getPersonFromVardaBySsnOrOid(body: VardaPersonSearchRequest): VardaPersonResponse? {
        logger.info("VardaUpdate: client finding person by $body")

        val (request, _, result) = fuel.post(personSearchUrl)
            .jsonBody(objectMapper.writeValueAsString(body)).authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully found person matching $body")
                objectMapper.readValue(result.get())
            }
            is Result.Failure -> {
                // TODO: once everything works, remove this debug logging
                logger.error { "VardaUpdate: Fetching person from Varda failed for ${body.henkilotunnus?.slice(0..4)}" }
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to find person by $body: $err"
                }
            }
        }
    }

    fun createPerson(person: VardaPersonRequest): VardaPersonResponse {
        logger.info("VardaUpdate: client sending person (body: $person)")

        val (request, _, result) = fuel.post(personUrl)
            .jsonBody(objectMapper.writeValueAsString(person)).authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully sent child (body: $person)")
                objectMapper.readValue(result.get())
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to send person: $err"
                }
            }
        }
    }

    fun createChild(child: VardaChildRequest): VardaChildResponse {
        logger.info("VardaUpdate: client sending child (body: $child)")

        val (request, _, result) = fuel.post(childUrl)
            .jsonBody(objectMapper.writeValueAsString(child)).authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully sent child (body: $child)")
                objectMapper.readValue(result.get())
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to send child: $err"
                }
            }
        }
    }

    fun createDecision(newDecision: VardaDecision): VardaDecisionResponse {
        logger.info("VardaUpdate: client sending new decision (body: $newDecision)")
        val (request, _, result) = fuel.post(decisionUrl)
            .jsonBody(objectMapper.writeValueAsString(newDecision)).authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully sent new decision (body: $newDecision)")
                objectMapper.readValue(result.get())
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to send new decision: $err"
                }
            }
        }
    }

    fun createPlacement(newPlacement: VardaPlacement): VardaPlacementResponse {
        logger.info("VardaUpdate: client sending new placement (body: $newPlacement)")
        val (request, _, result) = fuel.post(placementUrl)
            .jsonBody(objectMapper.writeValueAsString(newPlacement))
            .authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully sent new placement (body: $newPlacement)")
                objectMapper.readValue(result.get())
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to send new placement: $err"
                }
            }
        }
    }

    fun createFeeData(feeData: VardaFeeData): VardaFeeDataResponse {
        logger.info("VardaUpdate: client sending fee data for child ${feeData.lapsi}")
        val (request, _, result) = fuel.post(feeDataUrl)
            .jsonBody(objectMapper.writeValueAsString(feeData)).authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully sent fee data for child ${feeData.lapsi}")
                objectMapper.readValue(result.get())
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to send fee data for child ${feeData.lapsi}: ${err.errorCode}, $err"
                }
            }
        }
    }

    fun deleteFeeData(vardaId: Long): Boolean {
        logger.info("VardaUpdate: client deleting fee data $vardaId")

        val (request, _, result) = fuel.delete("$feeDataUrl$vardaId/").authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully deleted fee data $vardaId")
                true
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to delete fee data $vardaId: $err"
                }
            }
        }
    }

    fun deletePlacement(vardaPlacementId: Long): Boolean {
        logger.info("VardaUpdate: client deleting placement (id: $vardaPlacementId)")

        val (request, _, result) = fuel.delete(getPlacementUrl(vardaPlacementId))
            .authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully deleted placement (id: $vardaPlacementId)")
                true
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to delete placement $vardaPlacementId: $err"
                }
            }
        }
    }

    fun deleteDecision(vardaDecisionId: Long): Boolean {
        logger.info("VardaUpdate: client deleting decision (id: $vardaDecisionId)")

        val (request, _, result) = fuel.delete(getDecisionUrl(vardaDecisionId))
            .authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully deleted decision (id: $vardaDecisionId)")
                true
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to delete decision $vardaDecisionId: $err"
                }
            }
        }
    }

    fun createUnit(unit: VardaUnitRequest): VardaUnitResponse {
        logger.info("VardaUpdate: client sending new unit ${unit.nimi}")
        val (request, _, result) = fuel.post(unitUrl)
            .jsonBody(objectMapper.writeValueAsString(unit))
            .authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully sent new unit ${unit.nimi}")
                objectMapper.readValue(result.get())
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to send unit ${unit.nimi}: $err"
                }
            }
        }
    }

    fun updateUnit(unit: VardaUnitRequest): VardaUnitResponse {
        logger.info("VardaUpdate: client updating unit ${unit.nimi}")
        val url = "$unitUrl${unit.id}/"
        val (request, _, result) = fuel.put(url)
            .jsonBody(objectMapper.writeValueAsString(unit))
            .authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully updated unit ${unit.nimi}")
                objectMapper.readValue(result.get())
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to update unit ${unit.nimi}: $err"
                }
            }
        }
    }

    fun updateOrganizer(organizer: VardaUpdateOrganizer): Boolean {
        logger.info("VardaUpdate: client updating organizer")

        val (request, _, result) = fuel.put("$organizerUrl${organizer.vardaOrganizerId}")
            .header(Headers.CONTENT_TYPE, "application/json")
            .jsonBody(objectMapper.writeValueAsString(organizer))
            .authenticatedResponseStringWithRetries()

        return when (result) {
            is Result.Success -> {
                logger.info("VardaUpdate: client successfully updated organizer")
                true
            }
            is Result.Failure -> {
                vardaError(request, result.error) { err ->
                    "VardaUpdate: client failed to update organizer: $err"
                }
            }
        }
    }

    data class VardaResultId(
        val id: Long
    )

    fun getFeeDataByChild(vardaChildId: Long): List<Long> {
        logger.info("Getting fee data from Varda (child id: $vardaChildId)")
        return getAllPages("$feeDataUrl?lapsi=$vardaChildId") {
            objectMapper.readValue<PaginatedResponse<VardaResultId>>(it)
        }.map { it.id }
    }

    fun getPlacementsByDecision(vardaDecisionId: Long): List<Long> {
        logger.info("Getting placements from Varda (decision id: $vardaDecisionId)")
        return getAllPages("$placementUrl?varhaiskasvatuspaatos=$vardaDecisionId") {
            objectMapper.readValue<PaginatedResponse<VardaResultId>>(it)
        }.map { it.id }
    }

    fun getDecisionsByChild(vardaChildId: Long): List<Long> {
        logger.info("Getting decisions from Varda (child id: $vardaChildId)")
        return getAllPages("$decisionUrl?lapsi=$vardaChildId") {
            objectMapper.readValue<PaginatedResponse<VardaResultId>>(it)
        }.map { it.id }
    }

    data class PaginatedResponse<T>(
        val count: Int,
        val next: String?,
        val previous: String?,
        val results: List<T>
    )

    private fun <T> getAllPages(
        initialUrl: String,
        parseJson: (String) -> PaginatedResponse<T>
    ): List<T> {
        fun fetchNext(acc: List<T>, next: String?): List<T> {
            return if (next == null) acc
            else {
                val (request, _, result) = fuel.get(next).authenticatedResponseStringWithRetries()
                when (result) {
                    is Result.Success -> {
                        val response = parseJson(result.value)
                        fetchNext(acc + response.results, response.next)
                    }
                    is Result.Failure -> {
                        vardaError(request, result.error) { err ->
                            "VardaUpdate: client failed to get paginated results: $err"
                        }
                    }
                }
            }
        }

        return fetchNext(listOf(), initialUrl)
    }

    /**
     * Wrapper for Fuel Request.responseString() that handles API token refreshes and retries when throttled.
     *
     * API token refreshes are only attempted once and don't count as a try of the original request.
     *
     * TODO: Make API token usage thread-safe. Now nothing prevents another thread from invalidating the token about to be used by another thread.
     */
    private fun Request.authenticatedResponseStringWithRetries(maxTries: Int = 3): ResponseResultOf<String> =
        tokenProvider.withToken { token, refreshToken ->
            this
                .authentication().token(token)
                .header(Headers.ACCEPT, "application/json")
                .responseStringWithRetries(maxTries) { r, remainingTries ->
                    when (r.second.statusCode) {
                        403 -> when {
                            objectMapper.readTree(r.third.error.errorData).get("errors")
                                ?.any { it.get("error_code").asText() == "PE007" }
                                ?: false -> {
                                logger.info("Varda API token invalid. Refreshing token and retrying original request.")
                                val newToken = refreshToken()
                                // API token refresh should only be attempted once -> don't pass an error handler to let
                                // any subsequent errors fall through.
                                this
                                    .authentication().token(newToken)
                                    .responseStringWithRetries(remainingTries)
                            }
                            else -> r
                        }
                        else -> r
                    }
                }
        }
}
