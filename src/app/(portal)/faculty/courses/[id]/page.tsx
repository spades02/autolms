import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import { getLecturesForCourse } from "@/actions/lecture.action";
import JoinCodeDisplay from "@/components/portal/JoinCodeDisplay";
import LectureStatusBadge from "@/components/portal/LectureStatusBadge";
import CourseTabs from "@/components/portal/CourseTabs";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function FacultyCoursePage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("faculty", "admin");
  const detail = await getCourseById(params.id);
  if (!detail || detail.role !== "faculty") notFound();

  const lectures = await getLecturesForCourse(params.id);

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
        {detail.course.description ? (
          <p className="text-sm text-muted-foreground mt-1">
            {detail.course.description}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <JoinCodeDisplay code={detail.course.joinCode} />
          <span className="text-sm text-muted-foreground">
            {detail.enrollmentCount}{" "}
            {detail.enrollmentCount === 1 ? "student" : "students"} enrolled
          </span>
        </div>
      </header>

      <CourseTabs courseId={params.id} audience="faculty" />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Lectures</h2>
          <Link href={`/faculty/courses/${params.id}/lectures/new`}>
            <Button>Upload lecture</Button>
          </Link>
        </div>

        {lectures.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No lectures yet.
          </div>
        ) : (
          <ul className="grid gap-2">
            {lectures.map((l: any) => (
              <li
                key={l._id}
                className="rounded-md border p-3 flex items-center justify-between hover:bg-muted/40"
              >
                <Link
                  href={`/faculty/lectures/${l._id}`}
                  className="flex-1 flex items-center gap-3"
                >
                  {typeof l.weekNumber === "number" ? (
                    <span className="text-xs text-muted-foreground w-12">
                      Wk {l.weekNumber}
                    </span>
                  ) : (
                    <span className="w-12" />
                  )}
                  <span className="flex-1 font-medium">{l.title}</span>
                </Link>
                <LectureStatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
