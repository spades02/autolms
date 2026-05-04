"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import SubmissionStatusBadge from "@/components/portal/SubmissionStatusBadge";
import { reviewSubmission } from "@/actions/assignment.action";

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
};

export default function SubmissionReviewRow({
  submission,
}: {
  submission: Submission;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState(submission.feedback);
  const [gradeStr, setGradeStr] = useState(
    submission.grade === null ? "" : String(submission.grade),
  );
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<Submission>(submission);

  function save() {
    startTransition(async () => {
      try {
        const grade =
          gradeStr.trim() === "" ? null : Number(gradeStr);
        if (grade !== null && (Number.isNaN(grade) || grade < 0 || grade > 100)) {
          toast({ title: "Grade must be 0–100." });
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
            <span className="text-muted-foreground">—</span>
          ) : (
            `${current.grade}`
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
          <TableCell colSpan={6} className="bg-muted/30">
            <div className="grid gap-3 max-w-2xl">
              {current.note ? (
                <div>
                  <Label className="text-xs">Student note</Label>
                  <p className="text-sm whitespace-pre-wrap">
                    {current.note}
                  </p>
                </div>
              ) : null}
              <div className="grid gap-1">
                <Label htmlFor={`grade-${current._id}`}>Grade (0–100)</Label>
                <Input
                  id={`grade-${current._id}`}
                  type="number"
                  min={0}
                  max={100}
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
