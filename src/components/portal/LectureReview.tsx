"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import LectureStatusBadge from "@/components/portal/LectureStatusBadge";
import {
  getLectureById,
  publishLecture,
  retryLectureProcessing,
  updateLectureContent,
} from "@/actions/lecture.action";
import type { LectureStatus } from "@/database/lecture.model";

type LectureSnapshot = {
  _id: string;
  title: string;
  videoUrl: string;
  status: LectureStatus;
  transcript: string;
  summary: string;
  processingError?: string;
  publishedAt?: string;
};

const POLL_MS = 3000;

export default function LectureReview({
  initialLecture,
}: {
  initialLecture: LectureSnapshot;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [lecture, setLecture] = useState<LectureSnapshot>(initialLecture);
  const [transcript, setTranscript] = useState(initialLecture.transcript);
  const [summary, setSummary] = useState(initialLecture.summary);
  const [pending, startTransition] = useTransition();

  // Poll while the lecture is still processing.
  useEffect(() => {
    if (lecture.status !== "Uploaded" && lecture.status !== "Processing") {
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const fresh = await getLectureById(lecture._id);
      if (cancelled || !fresh) return;
      const next = fresh.lecture as LectureSnapshot;
      setLecture(next);
      // Hydrate the textarea content the first time we see it land.
      if (
        (next.status === "ReviewReady" || next.status === "Published") &&
        !transcript
      ) {
        setTranscript(next.transcript);
        setSummary(next.summary);
      }
    };
    const interval = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture.status, lecture._id]);

  function saveDraft() {
    startTransition(async () => {
      try {
        const updated = await updateLectureContent(lecture._id, {
          transcript,
          summary,
        });
        setLecture((prev) => ({
          ...prev,
          transcript: updated.transcript,
          summary: updated.summary,
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
        // Persist any pending edits first so we publish what's on screen.
        await updateLectureContent(lecture._id, { transcript, summary });
        const updated = await publishLecture(lecture._id);
        setLecture((prev) => ({
          ...prev,
          status: updated.status,
          publishedAt: updated.publishedAt,
        }));
        toast({ title: "Published" });
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Could not publish",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  function retry() {
    startTransition(async () => {
      try {
        await retryLectureProcessing(lecture._id);
        // Reset status locally, then re-kick processing.
        setLecture((prev) => ({
          ...prev,
          status: "Uploaded",
          processingError: "",
        }));
        await fetch(`/api/lectures/${lecture._id}/process`, {
          method: "POST",
        });
        toast({ title: "Retrying processing…" });
      } catch (err: any) {
        toast({
          title: "Could not retry",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  const isProcessing =
    lecture.status === "Uploaded" || lecture.status === "Processing";
  const canEdit =
    lecture.status === "ReviewReady" || lecture.status === "Published";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold flex-1">{lecture.title}</h1>
        <LectureStatusBadge status={lecture.status} />
      </div>

      <video
        src={lecture.videoUrl}
        controls
        className="w-full max-h-[480px] rounded-md bg-black"
      />

      {isProcessing ? (
        <div className="rounded-md border bg-muted/40 p-4 text-sm">
          Generating transcript and summary. This page refreshes automatically;
          a typical 30-minute lecture takes 1–3 minutes.
        </div>
      ) : null}

      {lecture.status === "Failed" ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <div className="font-medium mb-1">Processing failed</div>
          <div className="text-muted-foreground mb-3">
            {lecture.processingError || "Unknown error."}
          </div>
          <Button onClick={retry} disabled={pending}>
            Retry processing
          </Button>
        </div>
      ) : null}

      {canEdit ? (
        <div className="grid gap-6">
          <section>
            <label className="text-sm font-medium mb-1 block">Summary</label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={8}
              disabled={pending}
            />
          </section>

          <section>
            <label className="text-sm font-medium mb-1 block">Transcript</label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={14}
              disabled={pending}
              className="font-mono text-xs"
            />
          </section>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={pending}
            >
              Save draft
            </Button>
            <Button onClick={publish} disabled={pending}>
              {lecture.status === "Published" ? "Republish" : "Publish"}
            </Button>
          </div>

          {lecture.status === "Published" && lecture.publishedAt ? (
            <p className="text-xs text-muted-foreground">
              Published {new Date(lecture.publishedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
