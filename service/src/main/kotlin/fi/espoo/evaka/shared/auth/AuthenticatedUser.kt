// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.auth

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.google.common.hash.HashCode
import com.google.common.hash.Hashing
import fi.espoo.evaka.pis.EmployeeUser
import fi.espoo.evaka.shared.EmployeeId
import fi.espoo.evaka.shared.EvakaUserId
import fi.espoo.evaka.shared.PersonId
import java.util.UUID

@JsonSerialize(using = AuthenticatedUserJsonSerializer::class)
@JsonDeserialize(using = AuthenticatedUserJsonDeserializer::class)
sealed class AuthenticatedUser : RoleContainer {
    open val isEndUser = false
    open val isAdmin = false

    abstract val id: UUID
    abstract val type: AuthenticatedUserType

    abstract val evakaUserId: EvakaUserId

    val idHash: HashCode
        get() = Hashing.sha256().hashString(id.toString(), Charsets.UTF_8)

    data class Citizen(override val id: UUID, val authLevel: CitizenAuthLevel) : AuthenticatedUser() {
        constructor(id: PersonId, authLevel: CitizenAuthLevel) : this(id.raw, authLevel)
        override val evakaUserId: EvakaUserId
            get() = EvakaUserId(id)
        override val roles: Set<UserRole> = when (authLevel) {
            CitizenAuthLevel.STRONG -> setOf(UserRole.END_USER)
            CitizenAuthLevel.WEAK -> setOf(UserRole.CITIZEN_WEAK)
        }
        override val isEndUser = true
        override val type = when (authLevel) {
            CitizenAuthLevel.STRONG -> AuthenticatedUserType.citizen
            CitizenAuthLevel.WEAK -> AuthenticatedUserType.citizen_weak
        }
    }

    data class Employee private constructor(override val id: UUID, val globalRoles: Set<UserRole>, val allScopedRoles: Set<UserRole>) : AuthenticatedUser() {
        constructor(id: UUID, roles: Set<UserRole>) : this(id, roles - UserRole.SCOPED_ROLES, roles.intersect(UserRole.SCOPED_ROLES))
        constructor(employeeUser: EmployeeUser) : this(employeeUser.id.raw, employeeUser.globalRoles, employeeUser.allScopedRoles)
        override val evakaUserId: EvakaUserId
            get() = EvakaUserId(id)
        override val roles: Set<UserRole> = globalRoles + allScopedRoles
        override val isAdmin = roles.contains(UserRole.ADMIN)
        override val type = AuthenticatedUserType.employee
    }

    data class MobileDevice(override val id: UUID, val employeeId: EmployeeId? = null) : AuthenticatedUser() {
        val authLevel: MobileAuthLevel
            get() = if (employeeId != null) MobileAuthLevel.PIN_LOGIN else MobileAuthLevel.DEFAULT
        override val evakaUserId: EvakaUserId
            get() = EvakaUserId(id)
        override val roles: Set<UserRole> = emptySet()
        override val type = AuthenticatedUserType.mobile
    }

    object Integration : AuthenticatedUser() {
        override val id: UUID = UUID.fromString("00000000-0000-0000-0000-000000000000")
        override val evakaUserId: EvakaUserId
            get() = EvakaUserId(id)
        override val roles: Set<UserRole> = emptySet()
        override val type = AuthenticatedUserType.integration
        override fun toString(): String = "Integration"
    }

    object SystemInternalUser : AuthenticatedUser() {
        override val id: UUID = UUID.fromString("00000000-0000-0000-0000-000000000000")
        override val evakaUserId: EvakaUserId
            get() = EvakaUserId(id)
        override val roles: Set<UserRole> = emptySet()
        override val type = AuthenticatedUserType.system
        override fun toString(): String = "SystemInternalUser"
    }
}

enum class CitizenAuthLevel { WEAK, STRONG }
enum class MobileAuthLevel { DEFAULT, PIN_LOGIN }

/**
 * Low-level AuthenticatedUser type "tag" used in serialized representations (JWT, JSON).
 */
@Suppress("EnumEntryName")
enum class AuthenticatedUserType {
    citizen, citizen_weak, employee, mobile, system, integration
}
