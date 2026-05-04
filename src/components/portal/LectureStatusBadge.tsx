import { Badge } from "@/components/ui/badge";
import type { LectureStatus } from "@/database/lecture.model";

const VARIANT: Record<
  LectureStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Uploaded: "secondary",
  Processing: "secondary",
  ReviewReady: "default",
  Published: "default",
  Failed: "destructive",
};

const LABEL: Record<LectureStatus, string> = {
  Uploaded: "Uploaded",
  Processing: "Processing…",
  ReviewReady: "Ready for review",
  Published: "Published",
  Failed: "Failed",
};

export default function LectureStatusBadge({
  status,
}: {
  status: LectureStatus;
}) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
