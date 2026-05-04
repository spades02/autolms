import Link from "next/link";
import { requireRole } from "@/actions/user.action";
import {
  getPlatformStats,
  getRecentAuditLogs,
} from "@/actions/admin.action";
import Stat from "@/components/portal/Stat";
import AuditLogTable from "@/components/portal/AuditLogTable";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireRole("admin");
  const [stats, audit] = await Promise.all([
    getPlatformStats(),
    getRecentAuditLogs(10),
  ]);

  return (
    <div className="max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Admin overview</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide health and recent privileged activity.
        </p>
      </header>

      <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Stat
          label="Students"
          value={stats.users.student}
        />
        <Stat
          label="Faculty"
          value={stats.users.faculty}
        />
        <Stat
          label="Admins"
          value={stats.users.admin}
        />
        <Stat
          label="Courses"
          value={stats.courseCount}
        />
        <Stat
          label="Lectures published"
          value={stats.publishedLectures}
        />
        <Stat
          label="Quizzes published"
          value={stats.publishedQuizzes}
        />
        <Stat
          label="Assignments published"
          value={stats.publishedAssignments}
        />
        <Stat
          label="Activity"
          value={`${stats.attemptCount} / ${stats.submissionCount}`}
          hint="quiz attempts / submissions"
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Recent admin actions</h2>
          <Link
            href="/admin/audit"
            className="text-xs text-muted-foreground hover:underline"
          >
            See full audit log →
          </Link>
        </div>
        <AuditLogTable rows={audit} />
      </section>
    </div>
  );
}
