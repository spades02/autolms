import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getThread } from "@/actions/forum.action";
import ForumThreadView from "@/components/portal/ForumThreadView";

export const dynamic = "force-dynamic";

export default async function StudentThreadPage({
  params,
}: {
  params: { id: string; threadId: string };
}) {
  await requireRole("student", "admin");

  let data: Awaited<ReturnType<typeof getThread>>;
  try {
    data = await getThread(params.threadId);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href={`/student/courses/${params.id}/forum`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← Forum
      </Link>
      <ForumThreadView
        thread={data.thread}
        posts={data.posts}
        canMarkAnswered={data.canMarkAnswered}
      />
    </div>
  );
}
