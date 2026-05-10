import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import { listThreads } from "@/actions/forum.action";
import CourseTabs from "@/components/portal/CourseTabs";
import ForumThreadList from "@/components/portal/ForumThreadList";
import NewThreadDialog from "@/components/portal/NewThreadDialog";

export const dynamic = "force-dynamic";

export default async function StudentForumPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("student", "admin");
  const detail = await getCourseById(params.id);
  if (!detail) notFound();

  const threads = await listThreads(params.id);

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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Discussion</h2>
          <NewThreadDialog courseId={params.id} audience="student" />
        </div>
        <ForumThreadList
          courseId={params.id}
          threads={threads}
          audience="student"
        />
      </section>
    </div>
  );
}
