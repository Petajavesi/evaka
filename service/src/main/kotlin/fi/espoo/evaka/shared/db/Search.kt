// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.db

import fi.espoo.evaka.identity.SSN_PATTERN
import fi.espoo.evaka.shared.utils.splitSearchText
import fi.espoo.evaka.shared.utils.stripAccent
import fi.espoo.evaka.shared.utils.stripNonAlphanumeric

data class DBQuery(val query: String, val params: List<Binding<String>>)

private const val freeTextParamName = "free_text"
private val ssnParamName = { index: Int -> "ssn_$index" }
private val dateParamName = { index: Int -> "date_$index" }

/**
 * Returns a predicate that does a free text search using the given text on the given table names.
 *
 * The tables *must have* the following columns: social_security_number, date_of_birth, freetext_vec
 */
fun personFreeTextSearchPredicate(tables: Collection<String>, searchText: String): PredicateSql {
    val ssnPredicates =
        findSsnParams(searchText).map { ssn ->
            Predicate { where("lower($it.social_security_number) = lower(${bind(ssn)})") }
        }
    val datePredicates =
        findDateParams(searchText).map { date ->
            Predicate { where("to_char($it.date_of_birth, 'DDMMYY') = ${bind(date)}") }
        }
    val freeTextPredicate =
        searchText
            .let(removeSsnParams)
            .let(removeDateParams)
            .takeIf { it.isNotBlank() }
            ?.let(::freeTextParamsToTsQuery)
            ?.let { tsQuery ->
                Predicate { where("$it.freetext_vec @@ to_tsquery('simple', ${bind(tsQuery)})") }
            }

    val freeTextPredicateSql =
        if (freeTextPredicate != null)
            PredicateSql.any(tables.map { table -> freeTextPredicate.forTable(table) })
        else PredicateSql.alwaysTrue()

    val ssnPredicateSql =
        PredicateSql.all(
            ssnPredicates.map { predicate ->
                PredicateSql.any(tables.map { table -> predicate.forTable(table) })
            }
        )

    val datePredicateSql =
        PredicateSql.all(
            datePredicates.map { predicate ->
                PredicateSql.any(tables.map { table -> predicate.forTable(table) })
            }
        )

    return PredicateSql.all(freeTextPredicateSql, ssnPredicateSql, datePredicateSql)
}

fun freeTextSearchQuery(tables: List<String>, searchText: String): DBQuery {
    val ssnParams = findSsnParams(searchText)
    val dateParams = findDateParams(searchText)
    val freeTextString = searchText.let(removeSsnParams).let(removeDateParams)

    val freeTextQuery =
        if (freeTextString.isNotBlank()) {
            freeTextComputedColumnQuery(tables, freeTextParamName)
        } else {
            null
        }

    val ssnQuery =
        if (ssnParams.isNotEmpty()) {
            ssnQuery(tables, ssnParams)
        } else {
            null
        }

    val dateQuery =
        if (dateParams.isNotEmpty()) {
            dateQuery(tables, dateParams)
        } else {
            null
        }

    val wholeQuery = listOfNotNull("true", freeTextQuery, ssnQuery, dateQuery).joinToString(" AND ")

    val allParams =
        (ssnParams.mapIndexed { index, param -> Binding.of(ssnParamName(index), param) } +
                dateParams.mapIndexed { index, param -> Binding.of(dateParamName(index), param) } +
                (Binding.of(freeTextParamName, freeTextParamsToTsQuery(freeTextString))).takeIf {
                    freeTextString.isNotBlank()
                })
            .filterNotNull()

    return DBQuery(wholeQuery, allParams)
}

fun employeeFreeTextSearchPredicate(searchText: String): Predicate {
    val nameColumns = listOf("first_name", "last_name")
    val ssnPredicate =
        Predicate.all(
            findSsnParams(searchText).map { ssn ->
                Predicate { where("lower($it.social_security_number) = lower(${bind(ssn)})") }
            }
        )
    val freeTextPredicate =
        searchText
            .let(removeSsnParams)
            .takeIf { it.isNotBlank() }
            ?.let(::freeTextParamsToTsQuery)
            ?.let { tsQuery ->
                Predicate {
                    val tsVector =
                        nameColumns.joinToString(" || ") { column ->
                            "to_tsvector('simple', coalesce(unaccent($it.$column), ''))"
                        }
                    where("($tsVector) @@ to_tsquery('simple', ${bind(tsQuery)})")
                }
            }
    return Predicate.allNotNull(ssnPredicate, freeTextPredicate)
}

fun disjointNumberQuery(
    table: String,
    column: String,
    params: Collection<String>,
): Pair<String, List<Binding<String>>> {
    val numberParamName = { index: Int -> "${table}_${column}_$index" }
    val numberParams =
        params.mapIndexed { index, param -> Binding.of(numberParamName(index), param) }
    val numberParamQuery =
        params
            .mapIndexed { index, _ -> "$table.$column::text = :${numberParamName(index)}" }
            .joinToString(" OR ", "(", ")")

    return numberParamQuery to numberParams
}

private fun freeTextComputedColumnQuery(tables: List<String>, param: String): String {
    return "(" +
        tables.joinToString(" OR ") { table ->
            "$table.freetext_vec @@ to_tsquery('simple', :$param)"
        } +
        ")"
}

private fun findSsnParams(str: String) =
    splitSearchText(str).filter(SSN_PATTERN.toRegex(RegexOption.IGNORE_CASE)::matches)

private val removeSsnParams: (String) -> String = {
    it.replace(SSN_PATTERN.toRegex(RegexOption.IGNORE_CASE), "")
}

private fun ssnQuery(tablePrefixes: List<String>, params: Collection<String>): String {
    return params
        .mapIndexed { index, _ ->
            tablePrefixes
                .map { table ->
                    "lower($table.social_security_number) = lower(:${ssnParamName(index)})"
                }
                .joinToString(" OR ", "(", ")")
        }
        .joinToString(" AND ", "(", ")")
}

private val dateRegex = "^\\d{6}$".toRegex()

private fun findDateParams(str: String) = splitSearchText(str).filter(dateRegex::matches)

private val removeDateParams: (String) -> String = { it.replace(dateRegex, "") }

private fun dateQuery(tables: List<String>, params: Collection<String>): String {
    return params
        .mapIndexed { index, _ ->
            tables
                .map { table ->
                    "to_char($table.date_of_birth, 'DDMMYY') = :${dateParamName(index)}"
                }
                .joinToString(" OR ", "(", ")")
        }
        .joinToString(" AND ", "(", ")")
}

fun freeTextParamsToTsQuery(searchText: String): String =
    searchText
        .let(stripAccent)
        .let(stripNonAlphanumeric)
        .let(splitSearchText)
        .filter { it.isNotBlank() }
        .map { param -> "$param:*" }
        .joinToString(" & ")
