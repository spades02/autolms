import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getLectureById } from "@/actions/lecture.action";
import LectureReview from "@/components/portal/LectureReview";

export const dynamic = "force-dynamic";

export default async function FacultyLectureReviewPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("faculty", "admin");
  const detail = await getLectureById(params.id);
  if (!detail || detail.role !== "faculty") notFound();

  return (
    <div className="max-w-4xl">
      <Link
        href={`/faculty/courses/${detail.course._id}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← {detail.course.title}
      </Link>
      <div className="mt-4">
        <LectureReview initialLecture={detail.lecture} />
      </div>
    </div>
  );
}
