import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import { getLecturesForCourse } from "@/actions/lecture.action";
import { getQuizzesForCourse } from "@/actions/quiz.action";
import CourseTabs from "@/components/portal/CourseTabs";
import CreateQuizDialog from "@/components/portal/CreateQuizDialog";
import QuizStatusBadge from "@/components/portal/QuizStatusBadge";

export const dynamic = "force-dynamic";

export default async function FacultyQuizzesPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("faculty", "admin");
  const detail = await getCourseById(params.id);
  if (!detail || detail.role !== "faculty") notFound();

  const [quizzes, lectures] = await Promise.all([
    getQuizzesForCourse(params.id),
    getLecturesForCourse(params.id),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <Link
          href="/faculty"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← All courses
        </Link>
        <h1 className="text-2xl font-semibold mt-1">{detail.course.title}</h1>
      </header>

      <CourseTabs courseId={params.id} audience="faculty" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Quizzes</h2>
          <CreateQuizDialog
            courseId={params.id}
            lectures={lectures.map((l: any) => ({
              _id: l._id,
              title: l.title,
              status: l.status,
            }))}
          />
        </div>

        {quizzes.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No quizzes yet.
          </div>
        ) : (
          <ul className="grid gap-2">
            {quizzes.map((q: any) => (
              <li
                key={q._id}
                className="rounded-md border p-3 flex items-center gap-3 hover:bg-muted/40"
              >
                <Link
                  href={`/faculty/quizzes/${q._id}`}
                  className="flex-1"
                >
                  <div className="font-medium">{q.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {q.questions.length} question
                    {q.questions.length === 1 ? "" : "s"} ·{" "}
                    {q.attemptsCount ?? 0} attempt
                    {(q.attemptsCount ?? 0) === 1 ? "" : "s"}
                  </div>
                </Link>
                <QuizStatusBadge status={q.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
