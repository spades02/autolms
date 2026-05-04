import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import { getAssignmentsForCourse } from "@/actions/assignment.action";
import { pollDueSoonForCurrentStudent } from "@/actions/notification.action";
import CourseTabs from "@/components/portal/CourseTabs";
import SubmissionStatusBadge from "@/components/portal/SubmissionStatusBadge";

export const dynamic = "force-dynamic";

export default async function StudentAssignmentsPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("student", "admin");
  const detail = await getCourseById(params.id);
  if (!detail) notFound();

  await pollDueSoonForCurrentStudent();
  const assignments = await getAssignmentsForCourse(params.id);
  const now = new Date();

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <Link
          href="/student"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← My courses
        </Link>
        <h1 className="text-2xl font-semibold mt-1">{detail.course.title}</h1>
      </header>

      <CourseTabs courseId={params.id} audience="student" />

      <section>
        <h2 className="text-lg font-medium mb-3">Assignments</h2>
        {assignments.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No published assignments yet.
          </div>
        ) : (
          <ul className="grid gap-2">
            {assignments.map((a: any) => {
              const due = new Date(a.dueDate);
              const overdue = !a.mySubmission && due < now;
              return (
                <li key={a._id}>
                  <Link
                    href={`/student/assignments/${a._id}`}
                    className="block rounded-md border p-3 hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium flex-1">{a.title}</span>
                      <SubmissionStatusBadge
                        status={a.mySubmission?.status}
                        isLate={a.mySubmission?.isLate}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Due {due.toLocaleString()}
                      {overdue ? " · overdue" : ""}
                      {a.mySubmission?.grade !== null &&
                      a.mySubmission?.grade !== undefined
                        ? ` · grade ${a.mySubmission.grade}`
                        : ""}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
