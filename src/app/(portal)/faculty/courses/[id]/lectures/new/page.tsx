import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import { getCourseById } from "@/actions/course.action";
import UploadLectureForm from "@/components/portal/UploadLectureForm";

export const dynamic = "force-dynamic";

export default async function NewLecturePage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("faculty", "admin");
  const detail = await getCourseById(params.id);
  if (!detail || detail.role !== "faculty") notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href={`/faculty/courses/${params.id}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← {detail.course.title}
      </Link>
      <h1 className="text-2xl font-semibold mt-1 mb-6">Upload a lecture</h1>
      <UploadLectureForm courseId={params.id} />
    </div>
  );
}
