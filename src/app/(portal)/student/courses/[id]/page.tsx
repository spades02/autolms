import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import { getLecturesForCourse } from "@/actions/lecture.action";
import CourseTabs from "@/components/portal/CourseTabs";

export const dynamic = "force-dynamic";

export default async function StudentCoursePage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("student", "admin");
  const detail = await getCourseById(params.id);
  if (!detail) notFound();

  const lectures = await getLecturesForCourse(params.id);

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
        {detail.course.faculty?.name ? (
          <p className="text-sm text-muted-foreground">
            {detail.course.faculty.name}
          </p>
        ) : null}
        {detail.course.description ? (
          <p className="text-sm text-muted-foreground mt-2">
            {detail.course.description}
          </p>
        ) : null}
      </header>

      <CourseTabs courseId={params.id} audience="student" />

      <section>
        <h2 className="text-lg font-medium mb-3">Lectures</h2>
        {lectures.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No published lectures yet — check back soon.
          </div>
        ) : (
          <ul className="grid gap-2">
            {lectures.map((l: any) => (
              <li key={l._id}>
                <Link
                  href={`/student/lectures/${l._id}`}
                  className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/40"
                >
                  {typeof l.weekNumber === "number" ? (
                    <span className="text-xs text-muted-foreground w-12">
                      Wk {l.weekNumber}
                    </span>
                  ) : (
                    <span className="w-12" />
                  )}
                  <span className="flex-1 font-medium">{l.title}</span>
                  {l.publishedAt ? (
                    <span className="text-xs text-muted-foreground">
                      {new Date(l.publishedAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
