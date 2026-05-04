"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MultiFileDropzone,
  type FileState,
} from "@/components/MultiFileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useEdgeStore } from "@/lib/edgestore";
import { createLecture } from "@/actions/lecture.action";

type Phase = "idle" | "uploading" | "creating" | "kicking" | "done" | "error";

export default function UploadLectureForm({
  courseId,
}: {
  courseId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { edgestore } = useEdgeStore();

  const [files, setFiles] = useState<FileState[]>([]);
  const [title, setTitle] = useState("");
  const [weekNumber, setWeekNumber] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function updateFile(key: string, patch: Partial<FileState>) {
    setFiles((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const file = files[0];
    if (!file) {
      setError("Pick a video file to upload.");
      return;
    }

    setPhase("uploading");
    setProgress(0);

    let videoUrl: string;
    try {
      const result = await edgestore.publicFiles.upload({
        file: file.file,
        onProgressChange: (p) => {
          setProgress(p);
          updateFile(file.key, { progress: p });
        },
      });
      updateFile(file.key, { progress: "COMPLETE" });
      videoUrl = result.url;
    } catch (err: any) {
      const msg = err?.message ?? "Upload failed";
      updateFile(file.key, { progress: "ERROR" });
      setPhase("error");
      setError(msg);
      return;
    }

    setPhase("creating");
    let lectureId: string;
    try {
      const lecture = await createLecture({
        courseId,
        title: title.trim(),
        weekNumber: weekNumber ? Number(weekNumber) : undefined,
        videoUrl,
      });
      lectureId = lecture._id;
    } catch (err: any) {
      setPhase("error");
      setError(err?.message ?? "Could not save lecture.");
      return;
    }

    setPhase("kicking");
    // Fire-and-forget: the review page polls for status.
    fetch(`/api/lectures/${lectureId}/process`, { method: "POST" }).catch(
      () => {
        // Errors here are surfaced on the review page via lecture.status.
      },
    );

    setPhase("done");
    toast({
      title: "Lecture uploaded",
      description: "Processing started — review when ready.",
    });
    router.replace(`/faculty/lectures/${lectureId}`);
  }

  const busy = phase !== "idle" && phase !== "error";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div className="grid gap-1">
        <Label htmlFor="title">Lecture title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Self-attention mechanics"
          disabled={busy}
          required
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="week">Week number (optional)</Label>
        <Input
          id="week"
          type="number"
          min={1}
          value={weekNumber}
          onChange={(e) => setWeekNumber(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="grid gap-1">
        <Label>Video file</Label>
        <MultiFileDropzone
          value={files}
          onChange={setFiles}
          dropzoneOptions={{ maxFiles: 1 }}
          disabled={busy}
        />
        <p className="text-xs text-muted-foreground">mp4 or mkv only.</p>
      </div>

      {phase === "uploading" ? (
        <div className="space-y-1">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">
            Uploading to storage…
          </p>
        </div>
      ) : null}
      {phase === "creating" ? (
        <p className="text-xs text-muted-foreground">Saving lecture…</p>
      ) : null}
      {phase === "kicking" ? (
        <p className="text-xs text-muted-foreground">Starting processing…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={busy}>
        {busy ? "Working…" : "Upload & start processing"}
      </Button>
    </form>
  );
}
