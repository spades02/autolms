import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import { getFacultyCourseInsights } from "@/actions/analytics.action";
import { getPendingRequestCount } from "@/actions/enrollmentRequest.action";
import CourseTabs from "@/components/portal/CourseTabs";
import Stat from "@/components/portal/Stat";
import HistogramBar from "@/components/portal/HistogramBar";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function FacultyInsightsPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("faculty", "admin");
  const detail = await getCourseById(params.id);
  if (!detail || detail.role !== "faculty") notFound();

  const [insights, pendingCount] = await Promise.all([
    getFacultyCourseInsights(params.id),
    getPendingRequestCount(params.id),
  ]);

  const lectureTotal = Object.values(insights.lectureCount).reduce(
    (sum, n) => sum + n,
    0,
  );

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <Link
          href="/faculty"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← All courses
        </Link>
        <h1 className="text-2xl font-semibold mt-1">{detail.course.title}</h1>
      </header>

      <CourseTabs
        courseId={params.id}
        audience="faculty"
        badges={{ pending: pendingCount }}
      />

      <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Stat
          label="Enrolled"
          value={insights.enrollmentCount}
          hint="students"
        />
        <Stat
          label="Lectures"
          value={lectureTotal}
          hint={`${insights.lectureCount.Published ?? 0} published`}
        />
        <Stat
          label="Quizzes"
          value={insights.quizzes.length}
          hint={`${insights.quizzes.filter((q: any) => q.status === "published").length} published`}
        />
        <Stat
          label="Assignments"
          value={insights.assignments.length}
          hint={`${insights.assignments.filter((a: any) => a.status === "published").length} published`}
        />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Quiz performance</h2>
        {insights.quizzes.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No quizzes yet.
          </div>
        ) : (
          <ul className="grid gap-3">
            {insights.quizzes.map((q: any) => (
              <li key={q._id} className="rounded-md border p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <Link
                    href={`/faculty/quizzes/${q._id}`}
                    className="font-medium hover:underline"
                  >
                    {q.title}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {q.attempts} attempt{q.attempts === 1 ? "" : "s"} ·{" "}
                    {q.meanScorePct === null
                      ? "no data"
                      : `mean ${q.meanScorePct.toFixed(1)}%`}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 items-center">
                  <HistogramBar buckets={q.distribution} />
                  <div className="text-xs text-muted-foreground">
                    Score distribution across {q.attempts} attempt
                    {q.attempts === 1 ? "" : "s"}.
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Assignment activity</h2>
        {insights.assignments.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No assignments yet.
          </div>
        ) : (
          <ul className="grid gap-3">
            {insights.assignments.map((a: any) => {
              const submissionRate =
                insights.enrollmentCount === 0
                  ? 0
                  : (a.submissions / insights.enrollmentCount) * 100;
              const lateRate =
                a.submissions === 0 ? 0 : (a.late / a.submissions) * 100;
              const reviewedRate =
                a.submissions === 0
                  ? 0
                  : (a.reviewed / a.submissions) * 100;
              return (
                <li key={a._id} className="rounded-md border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/faculty/assignments/${a._id}`}
                      className="font-medium hover:underline"
                    >
                      {a.title}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      Due {new Date(a.dueDate).toLocaleString()}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Submitted ({a.submissions} / {insights.enrollmentCount})
                      </div>
                      <Progress value={submissionRate} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Late ({a.late} / {a.submissions})
                      </div>
                      <Progress value={lateRate} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Reviewed ({a.reviewed} / {a.submissions})
                      </div>
                      <Progress value={reviewedRate} />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Mean grade:{" "}
                    {a.meanGrade === null
                      ? "—"
                      : a.meanGrade.toFixed(1)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
