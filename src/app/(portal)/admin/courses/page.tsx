import { requireRole } from "@/actions/user.action";
import { getAllCoursesForAdmin } from "@/actions/admin.action";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DeleteCourseButton from "@/components/portal/DeleteCourseButton";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  await requireRole("admin");
  const courses = await getAllCoursesForAdmin();

  return (
    <div className="max-w-5xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Courses</h1>
        <p className="text-sm text-muted-foreground">
          {courses.length} course{courses.length === 1 ? "" : "s"} — admin
          override delete cascades through every child collection.
        </p>
      </header>

      {courses.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          No courses on the platform yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Lectures</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Code</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c: any) => (
              <TableRow key={c._id}>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.faculty?.name || c.faculty?.email || "—"}
                </TableCell>
                <TableCell>{c.lectureCount}</TableCell>
                <TableCell>{c.enrollmentCount}</TableCell>
                <TableCell className="font-mono text-xs">
                  {c.joinCode}
                </TableCell>
                <TableCell>
                  <DeleteCourseButton
                    courseId={c._id}
                    courseTitle={c.title}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
