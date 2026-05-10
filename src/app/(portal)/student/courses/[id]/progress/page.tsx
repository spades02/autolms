import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import { getStudentCourseProgress } from "@/actions/analytics.action";
import { getLectureProgressSummary } from "@/actions/progress.action";
import CourseTabs from "@/components/portal/CourseTabs";
import Stat from "@/components/portal/Stat";
import SubmissionStatusBadge from "@/components/portal/SubmissionStatusBadge";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function StudentProgressPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("student", "admin");
  const detail = await getCourseById(params.id);
  if (!detail) notFound();

  const [data, lectureProgress] = await Promise.all([
    getStudentCourseProgress(params.id),
    getLectureProgressSummary(params.id),
  ]);
  if (!data) notFound();

  const { quizzes, assignments, summary } = data;

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <Link
          href="/student"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← My courses
        </Link>
        <h1 className="text-2xl font-semibold mt-1">{detail.course.title}</h1>
      </header>

      <CourseTabs courseId={params.id} audience="student" />

      <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Stat
          label="Lectures viewed"
          value={`${lectureProgress.viewed} / ${lectureProgress.total}`}
        />
        <Stat
          label="Lectures completed"
          value={`${lectureProgress.completed} / ${lectureProgress.total}`}
        />
        <Stat
          label="Quizzes attempted"
          value={`${summary.quizzesAttempted} / ${summary.quizzesTotal}`}
        />
        <Stat
          label="Assignments submitted"
          value={`${summary.assignmentsSubmitted} / ${summary.assignmentsTotal}`}
        />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Quizzes</h2>
        {quizzes.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No published quizzes yet.
          </div>
        ) : (
          <ul className="grid gap-3">
            {quizzes.map((q: any) => (
              <li key={q._id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/student/quizzes/${q._id}/attempt`}
                    className="font-medium hover:underline"
                  >
                    {q.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {q.attemptsRemaining === null
                      ? "unlimited attempts"
                      : `${q.attemptsRemaining} left`}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Best score:{" "}
                    {q.bestScorePct === null
                      ? "—"
                      : `${q.bestScorePct.toFixed(0)}%`}
                  </div>
                  <Progress value={q.bestScorePct ?? 0} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Assignments</h2>
        {assignments.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No published assignments yet.
          </div>
        ) : (
          <ul className="grid gap-2">
            {assignments.map((a: any) => (
              <li key={a._id}>
                <Link
                  href={`/student/assignments/${a._id}`}
                  className="block rounded-md border p-3 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium flex-1">{a.title}</span>
                    <SubmissionStatusBadge
                      status={a.status ?? undefined}
                      isLate={a.isLate}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Due {new Date(a.dueDate).toLocaleString()}
                    {a.grade !== null ? ` · grade ${a.grade} / 10` : ""}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
