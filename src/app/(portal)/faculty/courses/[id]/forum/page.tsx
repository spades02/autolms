import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import { listThreads } from "@/actions/forum.action";
import { getPendingRequestCount } from "@/actions/enrollmentRequest.action";
import CourseTabs from "@/components/portal/CourseTabs";
import ForumThreadList from "@/components/portal/ForumThreadList";
import NewThreadDialog from "@/components/portal/NewThreadDialog";

export const dynamic = "force-dynamic";

export default async function FacultyForumPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("faculty", "admin");
  const detail = await getCourseById(params.id);
  if (!detail || detail.role !== "faculty") notFound();

  const [threads, pendingCount] = await Promise.all([
    listThreads(params.id),
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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Discussion</h2>
          <NewThreadDialog courseId={params.id} audience="faculty" />
        </div>
        <ForumThreadList
          courseId={params.id}
          threads={threads}
          audience="faculty"
        />
      </section>
    </div>
  );
}
