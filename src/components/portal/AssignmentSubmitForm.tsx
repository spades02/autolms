"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MultiFileDropzone,
  type FileState,
} from "@/components/MultiFileDropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useEdgeStore } from "@/lib/edgestore";
import { submitAssignment } from "@/actions/assignment.action";
import SubmissionStatusBadge from "@/components/portal/SubmissionStatusBadge";

type Existing = {
  _id: string;
  fileUrl: string;
  fileName: string;
  status: "Submitted" | "Reviewed";
  isLate: boolean;
  grade: number | null;
  feedback: string;
  submittedAt: string;
  gradeApproved?: boolean;
} | null;

type Phase = "idle" | "uploading" | "saving" | "error";

export default function AssignmentSubmitForm({
  assignmentId,
  initialSubmission,
  isClosed,
  closedReason,
}: {
  assignmentId: string;
  initialSubmission: Existing;
  isClosed: boolean;
  closedReason?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { edgestore } = useEdgeStore();

  const [files, setFiles] = useState<FileState[]>([]);
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Existing>(initialSubmission);

  function updateFile(key: string, patch: Partial<FileState>) {
    setFiles((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = files[0];
    if (!file) {
      setError("Pick a file to submit (PDF, DOC, DOCX, PPT, PPTX, XLSX, or ZIP).");
      return;
    }

    setPhase("uploading");
    setProgress(0);
    let url: string;
    let size: number;
    try {
      const result = await edgestore.submissionFiles.upload({
        file: file.file,
        onProgressChange: (p) => {
          setProgress(p);
          updateFile(file.key, { progress: p });
        },
      });
      updateFile(file.key, { progress: "COMPLETE" });
      url = result.url;
      size = result.size;
    } catch (err: any) {
      updateFile(file.key, { progress: "ERROR" });
      setPhase("error");
      setError(err?.message ?? "Upload failed");
      return;
    }

    setPhase("saving");
    try {
      const saved = await submitAssignment({
        assignmentId,
        fileUrl: url,
        fileName: file.file.name,
        fileSize: size,
        note: note.trim() || undefined,
      });
      setSubmission({
        _id: saved._id,
        fileUrl: saved.fileUrl,
        fileName: saved.fileName,
        status: saved.status,
        isLate: saved.isLate,
        grade: saved.grade,
        feedback: saved.feedback,
        submittedAt: saved.submittedAt,
        gradeApproved: saved.gradeApproved,
      });
      setFiles([]);
      setNote("");
      setPhase("idle");
      toast({ title: "Submitted" });
      router.refresh();
    } catch (err: any) {
      setPhase("error");
      setError(err?.message ?? "Could not save submission.");
    }
  }

  const busy = phase === "uploading" || phase === "saving";

  return (
    <div className="space-y-5">
      {submission ? (
        <div className="rounded-md border p-4 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Your submission</span>
            <SubmissionStatusBadge
              status={submission.status}
              isLate={submission.isLate}
            />
          </div>
          <div className="text-sm">
            <a
              href={submission.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              {submission.fileName}
            </a>
            <span className="text-muted-foreground ml-2">
              · submitted{" "}
              {new Date(submission.submittedAt).toLocaleString()}
            </span>
          </div>
          {submission.status === "Reviewed" && submission.gradeApproved ? (
            <div className="text-sm space-y-1 pt-2 border-t">
              {submission.grade !== null ? (
                <div>
                  <span className="text-muted-foreground">Grade:</span>{" "}
                  <span className="font-medium">{submission.grade} / 10</span>
                </div>
              ) : null}
              {submission.feedback ? (
                <div>
                  <div className="text-muted-foreground">Feedback:</div>
                  <p className="whitespace-pre-wrap">{submission.feedback}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {isClosed ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          {closedReason ?? "Submissions are closed."}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-1">
            <Label>{submission ? "Replace submission" : "Submit your work"}</Label>
            <MultiFileDropzone
              value={files}
              onChange={setFiles}
              dropzoneOptions={{
                maxFiles: 1,
                accept: {
                  "application/pdf": [".pdf"],
                  "application/msword": [".doc"],
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    [".docx"],
                  "application/vnd.ms-powerpoint": [".ppt"],
                  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                    [".pptx"],
                  "application/vnd.ms-excel": [".xls"],
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                  "application/zip": [".zip"],
                  "application/x-zip-compressed": [".zip"],
                },
              }}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, PPT, PPTX, XLSX, or ZIP.
            </p>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={busy}
            />
          </div>

          {phase === "uploading" ? (
            <div className="space-y-1">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">Uploading…</p>
            </div>
          ) : null}
          {phase === "saving" ? (
            <p className="text-xs text-muted-foreground">Saving submission…</p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <Button type="submit" disabled={busy}>
            {busy
              ? "Working…"
              : submission
                ? "Replace submission"
                : "Submit"}
          </Button>
        </form>
      )}
    </div>
  );
}
