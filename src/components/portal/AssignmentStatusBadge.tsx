import { Badge } from "@/components/ui/badge";
import type { AssignmentStatus } from "@/database/assignment.model";

const VARIANT: Record<
  AssignmentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  published: "default",
};

const LABEL: Record<AssignmentStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export default function AssignmentStatusBadge({
  status,
}: {
  status: AssignmentStatus;
}) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
