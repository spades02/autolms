import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import { getAssignmentsForCourse } from "@/actions/assignment.action";
import CourseTabs from "@/components/portal/CourseTabs";
import CreateAssignmentDialog from "@/components/portal/CreateAssignmentDialog";
import AssignmentStatusBadge from "@/components/portal/AssignmentStatusBadge";

export const dynamic = "force-dynamic";

export default async function FacultyAssignmentsPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("faculty", "admin");
  const detail = await getCourseById(params.id);
  if (!detail || detail.role !== "faculty") notFound();

  const assignments = await getAssignmentsForCourse(params.id);

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <Link
          href="/faculty"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← All courses
        </Link>
        <h1 className="text-2xl font-semibold mt-1">{detail.course.title}</h1>
      </header>

      <CourseTabs courseId={params.id} audience="faculty" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Assignments</h2>
          <CreateAssignmentDialog courseId={params.id} />
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No assignments yet.
          </div>
        ) : (
          <ul className="grid gap-2">
            {assignments.map((a: any) => (
              <li
                key={a._id}
                className="rounded-md border p-3 flex items-center gap-3 hover:bg-muted/40"
              >
                <Link
                  href={`/faculty/assignments/${a._id}`}
                  className="flex-1"
                >
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Due {new Date(a.dueDate).toLocaleString()} ·{" "}
                    {a.submissionsCount ?? 0} submission
                    {(a.submissionsCount ?? 0) === 1 ? "" : "s"} ·{" "}
                    {a.reviewedCount ?? 0} reviewed
                  </div>
                </Link>
                <AssignmentStatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
