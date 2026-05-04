import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getQuizForAttempt } from "@/actions/quiz.action";
import QuizAttemptForm from "@/components/portal/QuizAttemptForm";

export const dynamic = "force-dynamic";

export default async function StudentQuizAttemptPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("student", "admin");

  let data: Awaited<ReturnType<typeof getQuizForAttempt>>;
  try {
    data = await getQuizForAttempt(params.id);
  } catch (err: any) {
    if (err?.message?.includes("No attempts remaining")) {
      // Send them back to the course quizzes list with a friendly URL.
      redirect("/student");
    }
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/student/courses/${data.quiz.course}/quizzes`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← Quizzes
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{data.quiz.title}</h1>
        <p className="text-sm text-muted-foreground">
          {data.quiz.questions.length} question
          {data.quiz.questions.length === 1 ? "" : "s"} ·{" "}
          {data.attemptsRemaining === null
            ? "unlimited attempts"
            : `${data.attemptsRemaining} attempt${data.attemptsRemaining === 1 ? "" : "s"} remaining`}
        </p>
      </div>

      <QuizAttemptForm
        quizId={data.quiz._id}
        questions={data.quiz.questions}
      />
    </div>
  );
}
