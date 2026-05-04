import Link from "next/link";
import { requireRole } from "@/actions/user.action";
import { getStudentCourses } from "@/actions/course.action";
import { pollDueSoonForCurrentStudent } from "@/actions/notification.action";
import JoinCourseForm from "@/components/portal/JoinCourseForm";

export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
  await requireRole("student", "admin");
  // Side-effect: top up due-soon notifications for assignments closing in <24h.
  await pollDueSoonForCurrentStudent();
  const courses = await getStudentCourses();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">My courses</h1>
        <p className="text-sm text-muted-foreground">
          Lectures and assignments live inside the courses you&apos;re enrolled
          in.
        </p>
      </div>

      <JoinCourseForm />

      {courses.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          No enrollments yet. Paste a course code above to join your first
          course.
        </div>
      ) : (
        <ul className="grid gap-3">
          {courses.map((c: any) => (
            <li key={c._id}>
              <Link
                href={`/student/courses/${c._id}`}
                className="block rounded-md border p-4 hover:bg-muted/40"
              >
                <div className="font-medium">{c.title}</div>
                {c.faculty?.name ? (
                  <div className="text-sm text-muted-foreground">
                    {c.faculty.name}
                  </div>
                ) : null}
                {c.description ? (
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {c.description}
                  </div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
