import Link from "next/link";
import { requireRole } from "@/actions/user.action";
import { getFacultyCourses } from "@/actions/course.action";
import CreateCourseDialog from "@/components/portal/CreateCourseDialog";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function FacultyHomePage() {
  await requireRole("faculty", "admin");
  const courses = await getFacultyCourses();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Your courses</h1>
          <p className="text-sm text-muted-foreground">
            Create a course, share its join code, then upload lectures for
            processing.
          </p>
        </div>
        <CreateCourseDialog />
      </div>

      {courses.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          No courses yet. Click <strong>New course</strong> to create one.
        </div>
      ) : (
        <ul className="grid gap-3">
          {courses.map((c: any) => (
            <li
              key={c._id}
              className="rounded-md border p-4 flex items-center justify-between hover:bg-muted/40"
            >
              <Link href={`/faculty/courses/${c._id}`} className="flex-1">
                <div className="font-medium">{c.title}</div>
                {c.description ? (
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {c.description}
                  </div>
                ) : null}
              </Link>
              <Badge variant="outline" className="ml-4 font-mono">
                {c.joinCode}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
