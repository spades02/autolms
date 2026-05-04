import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getAssignmentById } from "@/actions/assignment.action";
import AssignmentSubmitForm from "@/components/portal/AssignmentSubmitForm";

export const dynamic = "force-dynamic";

export default async function StudentAssignmentPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("student", "admin");
  const detail = await getAssignmentById(params.id);
  if (!detail) notFound();

  const a = detail.assignment;
  const due = new Date(a.dueDate);
  const now = new Date();
  const overdue = due < now;
  const closed = overdue && !a.allowLate;

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/student/courses/${detail.course._id}/assignments`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← Assignments
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">{a.title}</h1>
        <p className="text-sm text-muted-foreground">
          Due {due.toLocaleString()}
          {overdue
            ? a.allowLate
              ? " · late submissions accepted"
              : " · closed"
            : ""}
        </p>
      </header>

      {a.instructions ? (
        <article className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          {a.instructions}
        </article>
      ) : null}

      <AssignmentSubmitForm
        assignmentId={String(a._id)}
        initialSubmission={
          detail.mySubmission
            ? {
                _id: String(detail.mySubmission._id),
                fileUrl: detail.mySubmission.fileUrl,
                fileName: detail.mySubmission.fileName,
                status: detail.mySubmission.status,
                isLate: detail.mySubmission.isLate,
                grade: detail.mySubmission.grade,
                feedback: detail.mySubmission.feedback,
                submittedAt: detail.mySubmission.submittedAt,
              }
            : null
        }
        isClosed={closed}
        closedReason={
          closed
            ? "Submissions are closed — the deadline has passed and late uploads are not allowed."
            : undefined
        }
      />
    </div>
  );
}
