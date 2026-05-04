import { Badge } from "@/components/ui/badge";
import type { QuizStatus } from "@/database/quiz.model";

const VARIANT: Record<
  QuizStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  published: "default",
};

const LABEL: Record<QuizStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export default function QuizStatusBadge({ status }: { status: QuizStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
