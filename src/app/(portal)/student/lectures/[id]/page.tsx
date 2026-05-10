import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { requireRole } from "@/actions/user.action";
import { getLectureById } from "@/actions/lecture.action";
import {
  isLectureCompletedByMe,
  recordLectureView,
} from "@/actions/progress.action";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LectureChatbot from "@/components/portal/LectureChatbot";
import MarkLectureCompleteButton from "@/components/portal/MarkLectureCompleteButton";

export const dynamic = "force-dynamic";

export default async function StudentLecturePage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("student", "admin");
  const detail = await getLectureById(params.id);
  if (!detail) notFound();

  // Side-effect: stamp first-view for this student. Idempotent + safe to fail.
  await recordLectureView(params.id);
  const completed = await isLectureCompletedByMe(params.id);

  return (
    <div className="max-w-4xl space-y-4">
      <Link
        href={`/student/courses/${detail.course._id}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← {detail.course.title}
      </Link>
      <div className="flex items-start gap-3">
        <h1 className="text-2xl font-semibold flex-1">
          {detail.lecture.title}
        </h1>
        <MarkLectureCompleteButton
          lectureId={String(detail.lecture._id)}
          initiallyCompleted={completed}
        />
      </div>

      <video
        src={detail.lecture.videoUrl}
        controls
        className="w-full max-h-[480px] rounded-md bg-black"
      />

      <Tabs defaultValue="summary" className="mt-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <article className="prose prose-sm dark:prose-invert max-w-none mt-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {detail.lecture.summary || "*No summary published.*"}
            </ReactMarkdown>
          </article>
        </TabsContent>
        <TabsContent value="transcript">
          <pre className="whitespace-pre-wrap text-xs bg-muted/40 p-3 rounded-md mt-2 max-h-[600px] overflow-auto">
            {detail.lecture.transcript || "(No transcript published.)"}
          </pre>
        </TabsContent>
        <TabsContent value="chatbot" className="mt-2">
          <LectureChatbot
            lectureId={String(detail.lecture._id)}
            hasTranscript={Boolean(detail.lecture.transcript?.trim())}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
