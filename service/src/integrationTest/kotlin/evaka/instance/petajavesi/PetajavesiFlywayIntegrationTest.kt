// SPDX-FileCopyrightText: 2026 City of Petäjävesi
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package evaka.instance.petajavesi

import evaka.core.insertServiceNeedOptions
import evaka.core.shared.db.Database
import evaka.core.shared.dev.resetDatabase
import evaka.core.shared.noopTracer
import kotlin.test.assertEquals
import org.flywaydb.core.Flyway
import org.flywaydb.database.postgresql.PostgreSQLConfigurationExtension
import org.jdbi.v3.core.Jdbi
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.context.properties.bind.Bindable
import org.springframework.boot.context.properties.bind.Binder
import org.springframework.core.env.Environment

/**
 * Profiilin Flyway-sijainnit eivät lisää versioituja migraatioita eivätkä muuta
 * service_need_option-taulua; ainoa lisäys on autovacuum-asetusten afterMigrate-callback.
 */
class PetajavesiFlywayIntegrationTest : AbstractPetajavesiIntegrationTest() {
    @Autowired private lateinit var jdbi: Jdbi
    @Autowired private lateinit var environment: Environment

    private val tunedTables =
        setOf(
            "absence",
            "async_job",
            "attendance_reservation",
            "child_attendance",
            "message",
            "message_recipients",
            "message_thread",
            "message_thread_children",
            "message_thread_participant",
            "staff_attendance_realtime",
        )

    private fun migrate(locations: List<String>) {
        val port = System.getenv("EVAKA_DATABASE_PORT")?.toIntOrNull() ?: 5432
        Flyway.configure()
            .apply {
                pluginRegister
                    .getExact(PostgreSQLConfigurationExtension::class.java)
                    .isTransactionalLock = false
            }
            .validateMigrationNaming(true)
            .dataSource(
                "jdbc:postgresql://localhost:$port/evaka_it",
                "evaka_migration_local",
                "flyway",
            )
            .locations(*locations.toTypedArray())
            .placeholders(
                mapOf(
                    "application_user" to "evaka_application_local",
                    "migration_user" to "evaka_migration_local",
                )
            )
            .load()
            .migrate()
    }

    private fun Database.Read.serviceNeedOptions(): List<String> =
        createQuery {
                sql(
                    "SELECT concat_ws('|', id, name_fi, fee_coefficient, valid_from, valid_to) FROM service_need_option ORDER BY id"
                )
            }
            .toList<String>()

    private fun Database.Read.historyCount(): Long =
        createQuery { sql("SELECT count(*) FROM flyway_schema_history") }.exactlyOne<Long>()

    private fun Database.Read.tunedTables(): Set<String> =
        createQuery {
                sql(
                    """
SELECT relname FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND 'autovacuum_analyze_scale_factor=0' = ANY(reloptions)
  AND 'autovacuum_analyze_threshold=50000' = ANY(reloptions)
"""
                )
            }
            .toList<String>()
            .toSet()

    @Test
    fun `profile locations run only the autovacuum callback and leave data untouched`() {
        val locations =
            Binder.get(environment)
                .bind("evaka.database.flyway.locations", Bindable.listOf(String::class.java))
                .get()
        assertEquals(listOf("db/migration", "petajavesi/db/migration"), locations)

        val db = Database(jdbi, noopTracer()).connectWithManualLifecycle()
        try {
            db.transaction { tx ->
                tx.resetDatabase()
                tx.insertServiceNeedOptions()
            }
            val optionsBefore = db.read { it.serviceNeedOptions() }
            val historyBefore = db.read { it.historyCount() }
            assert(optionsBefore.isNotEmpty())

            repeat(2) { migrate(locations) }

            assertEquals(optionsBefore, db.read { it.serviceNeedOptions() })
            assertEquals(historyBefore, db.read { it.historyCount() })
            assertEquals(tunedTables, db.read { it.tunedTables() }.intersect(tunedTables))
        } finally {
            db.close()
        }
    }
}
