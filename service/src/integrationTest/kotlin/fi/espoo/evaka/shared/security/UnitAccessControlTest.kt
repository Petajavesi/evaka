// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.security

import fi.espoo.evaka.shared.AreaId
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.dev.DevCareArea
import fi.espoo.evaka.shared.dev.DevDaycare
import fi.espoo.evaka.shared.dev.insertTestCareArea
import fi.espoo.evaka.shared.dev.insertTestDaycare
import fi.espoo.evaka.shared.security.actionrule.HasUnitRole
import fi.espoo.evaka.shared.security.actionrule.IsMobile
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class UnitAccessControlTest : AccessControlTest() {
    private lateinit var areaId: AreaId
    private lateinit var daycareId: DaycareId

    @BeforeEach
    private fun beforeEach() {
        db.transaction { tx ->
            areaId = tx.insertTestCareArea(DevCareArea())
            daycareId = tx.insertTestDaycare(DevDaycare(areaId = areaId))
        }
    }

    @Test
    fun `HasUnitRole inUnit`() {
        val action = Action.Unit.READ
        rules.add(action, HasUnitRole(UserRole.UNIT_SUPERVISOR).inUnit())
        val unitSupervisor = createTestEmployee(globalRoles = emptySet(), unitRoles = mapOf(daycareId to UserRole.UNIT_SUPERVISOR))
        val otherEmployee = createTestEmployee(globalRoles = emptySet(), unitRoles = mapOf(daycareId to UserRole.STAFF))
        assertTrue(accessControl.hasPermissionFor(unitSupervisor, action, daycareId))
        assertFalse(accessControl.hasPermissionFor(otherEmployee, action, daycareId))
    }

    @Test
    fun `IsMobile inUnit`() {
        val action = Action.Unit.READ
        rules.add(action, IsMobile(requirePinLogin = false).inUnit())
        val unitMobile = createTestMobile(daycareId)
        val otherDaycareId = db.transaction { tx ->
            tx.insertTestDaycare(DevDaycare(areaId = areaId))
        }
        val otherMobile = createTestMobile(otherDaycareId)
        assertTrue(accessControl.hasPermissionFor(unitMobile, action, daycareId))
        assertFalse(accessControl.hasPermissionFor(otherMobile, action, daycareId))
    }
}
