import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import { getQuizzesForCourse } from "@/actions/quiz.action";
import CourseTabs from "@/components/portal/CourseTabs";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function StudentQuizzesPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("student", "admin");
  const detail = await getCourseById(params.id);
  if (!detail) notFound();

  const quizzes = await getQuizzesForCourse(params.id);

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

      <section>
        <h2 className="text-lg font-medium mb-3">Quizzes</h2>
        {quizzes.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No published quizzes yet.
          </div>
        ) : (
          <ul className="grid gap-2">
            {quizzes.map((q: any) => {
              const remainingLabel =
                q.attemptsRemaining === null
                  ? "unlimited attempts"
                  : `${q.attemptsRemaining} attempt${q.attemptsRemaining === 1 ? "" : "s"} left`;
              const canAttempt =
                q.attemptsRemaining === null || q.attemptsRemaining > 0;
              return (
                <li
                  key={q._id}
                  className="rounded-md border p-3 flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="font-medium">{q.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {q.questions.length} question
                      {q.questions.length === 1 ? "" : "s"} · {remainingLabel}
                    </div>
                  </div>
                  {q.bestScore !== null ? (
                    <Badge variant="outline">
                      Best:{" "}
                      {((q.bestScore / q.questions.length) * 100).toFixed(0)}%
                    </Badge>
                  ) : null}
                  {canAttempt ? (
                    <Link
                      href={`/student/quizzes/${q._id}/attempt`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {q.attemptsUsed > 0 ? "Retake" : "Start"}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No attempts left
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
