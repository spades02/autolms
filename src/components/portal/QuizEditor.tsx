"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import {
  deleteQuiz,
  publishQuiz,
  unpublishQuiz,
  updateQuiz,
} from "@/actions/quiz.action";
import QuizStatusBadge from "@/components/portal/QuizStatusBadge";
import type { QuizStatus } from "@/database/quiz.model";

type QuestionDraft = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

type QuizDraft = {
  _id: string;
  course: string;
  title: string;
  status: QuizStatus;
  maxAttempts: number;
  questions: QuestionDraft[];
};

function emptyQuestion(): QuestionDraft {
  return { prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" };
}

export default function QuizEditor({ initialQuiz }: { initialQuiz: QuizDraft }) {
  const router = useRouter();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<QuizDraft>(initialQuiz);
  const [pending, startTransition] = useTransition();

  const isPublished = quiz.status === "published";

  function setField<K extends keyof QuizDraft>(key: K, value: QuizDraft[K]) {
    setQuiz((q) => ({ ...q, [key]: value }));
  }

  function updateQuestion(idx: number, patch: Partial<QuestionDraft>) {
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((qq, i) =>
        i === idx ? { ...qq, ...patch } : qq,
      ),
    }));
  }

  function addQuestion() {
    setQuiz((q) => ({ ...q, questions: [...q.questions, emptyQuestion()] }));
  }

  function removeQuestion(idx: number) {
    setQuiz((q) => ({
      ...q,
      questions: q.questions.filter((_, i) => i !== idx),
    }));
  }

  function addOption(idx: number) {
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((qq, i) =>
        i === idx ? { ...qq, options: [...qq.options, ""] } : qq,
      ),
    }));
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((qq, i) => {
        if (i !== qIdx) return qq;
        const options = qq.options.filter((_, j) => j !== oIdx);
        let correctIndex = qq.correctIndex;
        if (oIdx === correctIndex) correctIndex = 0;
        else if (oIdx < correctIndex) correctIndex -= 1;
        return { ...qq, options, correctIndex };
      }),
    }));
  }

  function saveDraft() {
    startTransition(async () => {
      try {
        const updated = await updateQuiz(quiz._id, {
          title: quiz.title,
          maxAttempts: quiz.maxAttempts,
          questions: quiz.questions,
        });
        setQuiz((q) => ({
          ...q,
          ...updated,
          questions: updated.questions,
        }));
        toast({ title: "Draft saved" });
      } catch (err: any) {
        toast({
          title: "Could not save",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  function publish() {
    startTransition(async () => {
      try {
        // Persist any pending edits first.
        await updateQuiz(quiz._id, {
          title: quiz.title,
          maxAttempts: quiz.maxAttempts,
          questions: quiz.questions,
        });
        const updated = await publishQuiz(quiz._id);
        setQuiz((q) => ({ ...q, status: updated.status }));
        toast({ title: "Quiz published" });
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Could not publish",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  function unpublish() {
    startTransition(async () => {
      try {
        const updated = await unpublishQuiz(quiz._id);
        setQuiz((q) => ({ ...q, status: updated.status }));
        toast({ title: "Quiz unpublished" });
      } catch (err: any) {
        toast({
          title: "Could not unpublish",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  function destroy() {
    if (!confirm("Delete this quiz draft? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteQuiz(quiz._id);
        toast({ title: "Quiz deleted" });
        router.replace(`/faculty/courses/${quiz.course}/quizzes`);
      } catch (err: any) {
        toast({
          title: "Could not delete",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold flex-1">{quiz.title}</h1>
        <QuizStatusBadge status={quiz.status} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 max-w-2xl">
        <div className="grid gap-1">
          <Label htmlFor="quiz-title">Title</Label>
          <Input
            id="quiz-title"
            value={quiz.title}
            onChange={(e) => setField("title", e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="quiz-max">Max attempts (0 = unlimited)</Label>
          <Input
            id="quiz-max"
            type="number"
            min={0}
            value={quiz.maxAttempts}
            onChange={(e) =>
              setField("maxAttempts", Number(e.target.value) || 0)
            }
            disabled={pending}
          />
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            Questions ({quiz.questions.length})
          </h2>
          {!isPublished ? (
            <Button
              variant="outline"
              size="sm"
              onClick={addQuestion}
              disabled={pending}
            >
              <Plus className="h-4 w-4 mr-1" /> Add question
            </Button>
          ) : null}
        </div>

        {quiz.questions.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No questions yet.
          </div>
        ) : (
          <ol className="space-y-4 list-decimal list-inside">
            {quiz.questions.map((q, qIdx) => (
              <li
                key={qIdx}
                className="rounded-md border p-4 space-y-3 list-item"
              >
                <div className="flex items-start gap-2">
                  <Textarea
                    value={q.prompt}
                    onChange={(e) =>
                      updateQuestion(qIdx, { prompt: e.target.value })
                    }
                    placeholder="Question prompt"
                    rows={2}
                    disabled={pending || isPublished}
                  />
                  {!isPublished ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(qIdx)}
                      disabled={pending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <RadioGroup
                  value={String(q.correctIndex)}
                  onValueChange={(v) =>
                    updateQuestion(qIdx, { correctIndex: Number(v) })
                  }
                  disabled={pending || isPublished}
                >
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={String(oIdx)}
                          id={`q${qIdx}-o${oIdx}`}
                        />
                        <Input
                          value={opt}
                          onChange={(e) =>
                            updateQuestion(qIdx, {
                              options: q.options.map((oo, j) =>
                                j === oIdx ? e.target.value : oo,
                              ),
                            })
                          }
                          placeholder={`Option ${oIdx + 1}`}
                          disabled={pending || isPublished}
                        />
                        {!isPublished && q.options.length > 2 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(qIdx, oIdx)}
                            disabled={pending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </RadioGroup>
                {!isPublished ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(qIdx)}
                    disabled={pending}
                  >
                    Add option
                  </Button>
                ) : null}

                <div className="grid gap-1">
                  <Label htmlFor={`q${qIdx}-exp`} className="text-xs">
                    Explanation (shown to students after submit)
                  </Label>
                  <Textarea
                    id={`q${qIdx}-exp`}
                    value={q.explanation ?? ""}
                    onChange={(e) =>
                      updateQuestion(qIdx, { explanation: e.target.value })
                    }
                    rows={2}
                    disabled={pending || isPublished}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {!isPublished ? (
          <>
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={pending}
            >
              Save draft
            </Button>
            <Button onClick={publish} disabled={pending}>
              Publish
            </Button>
            <Button
              variant="ghost"
              onClick={destroy}
              disabled={pending}
              className="text-destructive"
            >
              Delete
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={unpublish}
            disabled={pending}
          >
            Unpublish to edit
          </Button>
        )}
      </div>
    </div>
  );
}
