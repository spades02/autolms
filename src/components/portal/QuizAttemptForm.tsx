"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { submitQuizAttempt } from "@/actions/quiz.action";

type SafeQuestion = { prompt: string; options: string[] };

export default function QuizAttemptForm({
  quizId,
  questions,
}: {
  quizId: string;
  questions: SafeQuestion[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<number[]>(
    Array(questions.length).fill(-1),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setAnswer(idx: number, value: number) {
    setAnswers((prev) => prev.map((a, i) => (i === idx ? value : a)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const missing = answers.findIndex((a) => a < 0);
    if (missing >= 0) {
      setError(`Answer question ${missing + 1} before submitting.`);
      const el = document.getElementById(`q-${missing}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitQuizAttempt(quizId, answers);
        toast({
          title: "Submitted",
          description: `Score ${result.score}/${result.total}`,
        });
        router.replace(
          `/student/quizzes/${quizId}/result/${result.attemptId}`,
        );
      } catch (err: any) {
        toast({
          title: "Could not submit",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <ol className="space-y-6 list-decimal list-inside">
        {questions.map((q, qIdx) => (
          <li
            id={`q-${qIdx}`}
            key={qIdx}
            className="rounded-md border p-4 space-y-3 list-item"
          >
            <p className="font-medium">{q.prompt}</p>
            <RadioGroup
              value={answers[qIdx] >= 0 ? String(answers[qIdx]) : ""}
              onValueChange={(v) => setAnswer(qIdx, Number(v))}
              disabled={pending}
            >
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => {
                  const id = `q${qIdx}-o${oIdx}`;
                  return (
                    <div key={oIdx} className="flex items-center gap-2">
                      <RadioGroupItem value={String(oIdx)} id={id} />
                      <Label htmlFor={id} className="font-normal">
                        {opt}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </li>
        ))}
      </ol>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit quiz"}
      </Button>
    </form>
  );
}
