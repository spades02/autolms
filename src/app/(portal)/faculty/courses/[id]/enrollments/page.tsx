import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import {
  getPendingRequestCount,
  listPendingRequests,
} from "@/actions/enrollmentRequest.action";
import CourseTabs from "@/components/portal/CourseTabs";
import EnrollmentRequestRow from "@/components/portal/EnrollmentRequestRow";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function FacultyEnrollmentsPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("faculty", "admin");
  const detail = await getCourseById(params.id);
  if (!detail || detail.role !== "faculty") notFound();

  const [pending, pendingCount] = await Promise.all([
    listPendingRequests(params.id),
    getPendingRequestCount(params.id),
  ]);

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

      <CourseTabs
        courseId={params.id}
        audience="faculty"
        badges={{ pending: pendingCount }}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Pending requests</h2>
        {pending.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No pending requests right now.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((row: any) => (
                <EnrollmentRequestRow key={row._id} row={row} />
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
