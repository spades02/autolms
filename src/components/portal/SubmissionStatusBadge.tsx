import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus } from "@/database/submission.model";

export default function SubmissionStatusBadge({
  status,
  isLate,
}: {
  status?: SubmissionStatus | null;
  isLate?: boolean;
}) {
  if (!status) {
    return <Badge variant="outline">Not submitted</Badge>;
  }
  if (status === "Reviewed") {
    return (
      <span className="inline-flex gap-1">
        <Badge variant="default">Reviewed</Badge>
        {isLate ? <Badge variant="destructive">Late</Badge> : null}
      </span>
    );
  }
  return (
    <span className="inline-flex gap-1">
      <Badge variant="secondary">Submitted</Badge>
      {isLate ? <Badge variant="destructive">Late</Badge> : null}
    </span>
  );
}
