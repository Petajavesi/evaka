// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.async

import fi.espoo.evaka.PureJdbiTest
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.db.mapColumn
import fi.espoo.evaka.shared.db.mapJsonColumn
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import org.jdbi.v3.core.kotlin.mapTo
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Duration
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class AsyncJobQueriesTest : PureJdbiTest() {
    private val user = AuthenticatedUser.SystemInternalUser

    @BeforeEach
    fun beforeEach() {
        db.transaction { it.execute("TRUNCATE async_job") }
    }

    @Test
    fun testCompleteHappyCase() {
        val id = UUID.randomUUID()
        db.transaction {
            it.insertJob(
                JobParams(
                    NotifyDecisionCreated(id, user, sendAsMessage = false),
                    1234,
                    Duration.ofMinutes(42),
                    HelsinkiDateTime.now()
                )
            )
        }
        val runAt = db.read { it.createQuery("SELECT run_at FROM async_job").mapTo<HelsinkiDateTime>().one() }

        val ref = db.transaction { it.claimJob(listOf(AsyncJobType.DECISION_CREATED))!! }
        assertEquals(AsyncJobType.DECISION_CREATED, ref.jobType)
        val (retryRunAt, retryCount) = db.read {
            it.createQuery("SELECT run_at, retry_count FROM async_job").mapTo<Retry>().one()
        }
        assertTrue(retryRunAt > runAt)
        assertEquals(1233, retryCount)

        db.transaction { tx ->
            val payload = tx.startJob(ref, NotifyDecisionCreated::class.java)!!
            assertEquals(NotifyDecisionCreated(id, user, sendAsMessage = false), payload)

            tx.completeJob(ref)
        }

        val completedAt =
            db.read { it.createQuery("SELECT completed_at FROM async_job").mapTo<HelsinkiDateTime>().one() }
        assertTrue(completedAt > runAt)
    }

    @Test
    fun testParallelClaimContention() {
        val payloads = (0..1).map { NotifyDecisionCreated(UUID.randomUUID(), user, sendAsMessage = false) }
        db.transaction { tx ->
            payloads.map { tx.insertJob(JobParams(it, 999, Duration.ZERO, HelsinkiDateTime.now())) }
        }
        val handles = (0..2).map { jdbi.open() }
        try {
            val h0 = handles[0].begin()
            val h1 = handles[1].begin()
            val h2 = handles[2].begin()

            // Two jobs in the db -> only two claims should succeed
            val job0 = Database.Transaction.wrap(h0).claimJob()!!
            val job1 = Database.Transaction.wrap(h1).claimJob()!!
            assertNotEquals(job0.jobId, job1.jobId)
            assertNull(Database.Transaction.wrap(h2).claimJob())

            h1.rollback()

            // Handle 1 rolled back -> job 1 should now be available
            val job2 = Database.Transaction.wrap(h2).claimJob()!!
            assertEquals(job1.jobId, job2.jobId)

            Database.Transaction.wrap(h0).completeJob(job0)
            h0.commit()

            Database.Transaction.wrap(h2).completeJob(job2)
            h2.commit()
        } finally {
            handles.forEach { it.close() }
        }
        val completedCount = jdbi.open()
            .use { h ->
                h.createQuery("SELECT count(*) FROM async_job WHERE completed_at IS NOT NULL").mapTo<Int>().one()
            }
        assertEquals(2, completedCount)
    }

    @Test
    fun testLegacyUserRoleDeserialization() {
        val user = db.read {
            it.createQuery(
                "SELECT jsonb_build_object('id', '44e1ff31-fce4-4ca1-922a-a385fb21c69e', 'roles', jsonb_build_array('FINANCE_ADMIN')) AS user"
            ).map { row -> row.mapJsonColumn<AuthenticatedUser>("user") }.first()
        }
        assertEquals(
            AuthenticatedUser.Employee(
                UUID.fromString("44e1ff31-fce4-4ca1-922a-a385fb21c69e"),
                setOf(UserRole.FINANCE_ADMIN)
            ),
            user
        )
    }

    @Test
    fun testRemoveOldAsyncJobs() {
        val now = HelsinkiDateTime.of(LocalDate.of(2020, 9, 1), LocalTime.of(12, 0))
        val ancient = LocalDate.of(2019, 1, 1)
        val recent = LocalDate.of(2020, 7, 1)
        val future = LocalDate.of(2020, 9, 2)
        db.transaction { tx ->
            listOf(ancient, recent)
                .flatMap { listOf(TestJobParams(it, completed = false), TestJobParams(it, completed = true)) }
                .forEach { params ->
                    tx.insertTestJob(params)
                }
            tx.insertTestJob(TestJobParams(future, completed = false))
        }

        db.removeOldAsyncJobs(now)

        val remainingJobs = db.read {
            it.createQuery("SELECT run_at, completed_at IS NOT NULL AS completed FROM async_job ORDER BY 1,2")
                .map { row -> TestJobParams(runAt = row.mapColumn<HelsinkiDateTime>("run_at").toLocalDate(), completed = row.mapColumn("completed")) }
                .toList()
        }
        assertEquals(
            listOf(
                TestJobParams(recent, completed = false),
                TestJobParams(future, completed = false),
            ),
            remainingJobs
        )
    }

    private data class Retry(val runAt: HelsinkiDateTime, val retryCount: Long)
}

private data class TestJobParams(val runAt: LocalDate, val completed: Boolean)

private fun Database.Transaction.insertTestJob(params: TestJobParams) = createUpdate(
    """
INSERT INTO async_job (type, run_at, retry_count, retry_interval, payload, claimed_at, claimed_by, completed_at)
VALUES ('TEST', :runAt, 0, interval '1 hours', '{}', :completedAt, :claimedBy, :completedAt)
    """
)
    .bind("runAt", HelsinkiDateTime.of(params.runAt, LocalTime.of(12, 0)))
    .bind("completedAt", HelsinkiDateTime.of(params.runAt, LocalTime.of(14, 0)).takeIf { params.completed })
    .bind("claimedBy", 42.takeIf { params.completed })
    .execute()
