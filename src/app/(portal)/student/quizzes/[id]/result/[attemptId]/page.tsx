import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";
import { requireRole } from "@/actions/user.action";
import { getAttemptResult } from "@/actions/quiz.action";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentAttemptResultPage({
  params,
}: {
  params: { id: string; attemptId: string };
}) {
  await requireRole("student", "admin");

  let data: Awaited<ReturnType<typeof getAttemptResult>>;
  try {
    data = await getAttemptResult(params.attemptId);
  } catch {
    notFound();
  }

  const pct = (data.attempt.score / data.attempt.total) * 100;

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/student/courses/${data.quiz.course}/quizzes`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← Quizzes
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">{data.quiz.title}</h1>
        <p className="text-3xl font-bold mt-2">
          {data.attempt.score} / {data.attempt.total}
          <span className="text-base font-normal text-muted-foreground ml-3">
            ({pct.toFixed(0)}%)
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Submitted {new Date(data.attempt.submittedAt).toLocaleString()}
        </p>
      </header>

      <ol className="space-y-4 list-decimal list-inside">
        {data.perQuestion.map((q: any, qIdx: number) => (
          <li
            key={qIdx}
            className={cn(
              "rounded-md border p-4 list-item",
              q.correct
                ? "border-emerald-200 dark:border-emerald-900/50"
                : "border-red-200 dark:border-red-900/50",
            )}
          >
            <div className="flex items-start gap-2 font-medium">
              {q.correct ? (
                <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
              ) : (
                <X className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <span>{q.prompt}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {q.options.map((opt: string, oIdx: number) => {
                const isCorrect = oIdx === q.correctIndex;
                const isSelected = oIdx === q.selected;
                return (
                  <li
                    key={oIdx}
                    className={cn(
                      "rounded px-2 py-1",
                      isCorrect &&
                        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300",
                      !isCorrect &&
                        isSelected &&
                        "bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300",
                    )}
                  >
                    {opt}
                    {isSelected ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (your answer)
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {q.explanation ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {q.explanation}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
