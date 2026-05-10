"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { TableCell, TableRow } from "@/components/ui/table";
import SubmissionStatusBadge from "@/components/portal/SubmissionStatusBadge";
import {
  rerunAutoGrade,
  reviewSubmission,
} from "@/actions/assignment.action";

type Submission = {
  _id: string;
  student: { _id: string; name?: string; username?: string; email?: string };
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  isLate: boolean;
  status: "Submitted" | "Reviewed";
  feedback: string;
  grade: number | null;
  note?: string;
  aiGrade: number | null;
  aiFeedback: string;
  aiGradedAt?: string;
  gradeApproved?: boolean;
  extractionFailed?: boolean;
  mostSimilar?: {
    submissionId: string;
    score: number;
    studentName: string;
  } | null;
};

export default function SubmissionReviewRow({
  submission,
}: {
  submission: Submission;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState(
    submission.feedback || submission.aiFeedback || "",
  );
  const [gradeStr, setGradeStr] = useState(
    submission.grade === null
      ? submission.aiGrade !== null && submission.aiGrade !== undefined
        ? String(submission.aiGrade)
        : ""
      : String(submission.grade),
  );
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<Submission>(submission);

  function save() {
    startTransition(async () => {
      try {
        const grade = gradeStr.trim() === "" ? null : Number(gradeStr);
        if (
          grade !== null &&
          (Number.isNaN(grade) || grade < 0 || grade > 10)
        ) {
          toast({ title: "Grade must be 0–10." });
          return;
        }
        const updated = await reviewSubmission(submission._id, {
          feedback,
          grade,
        });
        setCurrent({
          ...current,
          status: updated.status,
          feedback: updated.feedback,
          grade: updated.grade,
          gradeApproved: updated.gradeApproved,
        });
        toast({ title: "Review saved" });
        setOpen(false);
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Could not save",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  function approveAi() {
    if (current.aiGrade === null || current.aiGrade === undefined) return;
    setGradeStr(String(current.aiGrade));
    setFeedback(current.aiFeedback || feedback);
  }

  function rerun() {
    startTransition(async () => {
      try {
        await rerunAutoGrade(submission._id);
        toast({ title: "Re-running…" });
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Re-run failed",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          {current.student?.name ||
            current.student?.username ||
            current.student?.email ||
            "—"}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {new Date(current.submittedAt).toLocaleString()}
        </TableCell>
        <TableCell>
          <SubmissionStatusBadge
            status={current.status}
            isLate={current.isLate}
          />
        </TableCell>
        <TableCell>
          {current.grade === null ? (
            current.aiGrade !== null && current.aiGrade !== undefined ? (
              <span className="text-xs text-muted-foreground">
                AI: {current.aiGrade.toFixed(1)} / 10
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )
          ) : (
            `${current.grade} / 10`
          )}
        </TableCell>
        <TableCell>
          {current.mostSimilar ? (
            <div className="flex flex-col">
              <Badge variant="destructive" className="w-fit">
                {(current.mostSimilar.score * 100).toFixed(0)}% similar
              </Badge>
              <span className="text-xs text-muted-foreground mt-1 truncate max-w-[140px]">
                vs {current.mostSimilar.studentName}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </TableCell>
        <TableCell>
          <a
            href={current.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            {current.fileName}
          </a>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Review"}
          </Button>
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/30">
            <div className="grid gap-3 max-w-2xl">
              {current.note ? (
                <div>
                  <Label className="text-xs">Student note</Label>
                  <p className="text-sm whitespace-pre-wrap">{current.note}</p>
                </div>
              ) : null}

              {current.extractionFailed ? (
                <div className="rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-2 text-xs">
                  Couldn&apos;t extract text from this file — AI features were
                  skipped.
                </div>
              ) : null}

              {current.aiGrade !== null && current.aiGrade !== undefined ? (
                <div className="rounded-md border bg-background p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">AI suggestion</Label>
                    <Badge variant="outline">
                      {current.aiGrade.toFixed(1)} / 10
                    </Badge>
                    {current.aiGradedAt ? (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(current.aiGradedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  {current.aiFeedback ? (
                    <p className="text-sm whitespace-pre-wrap">
                      {current.aiFeedback}
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={approveAi}
                      disabled={pending}
                    >
                      Use AI grade
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={rerun}
                      disabled={pending}
                    >
                      Re-run AI
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    No AI grade yet.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={rerun}
                    disabled={pending}
                  >
                    Run AI now
                  </Button>
                </div>
              )}

              <div className="grid gap-1">
                <Label htmlFor={`grade-${current._id}`}>Grade (0–10)</Label>
                <Input
                  id={`grade-${current._id}`}
                  type="number"
                  min={0}
                  max={10}
                  step="0.1"
                  value={gradeStr}
                  onChange={(e) => setGradeStr(e.target.value)}
                  className="w-32"
                  disabled={pending}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`feedback-${current._id}`}>Feedback</Label>
                <Textarea
                  id={`feedback-${current._id}`}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  disabled={pending}
                />
              </div>
              <div>
                <Button onClick={save} disabled={pending}>
                  {pending ? "Saving…" : "Save review"}
                </Button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}
