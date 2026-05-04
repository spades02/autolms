import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import {
  getQuizForFaculty,
  getAttemptsForQuiz,
} from "@/actions/quiz.action";
import QuizEditor from "@/components/portal/QuizEditor";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function FacultyQuizPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("faculty", "admin");

  let quiz: any;
  try {
    quiz = await getQuizForFaculty(params.id);
  } catch {
    notFound();
  }

  const attempts = await getAttemptsForQuiz(params.id);
  const mean =
    attempts.length === 0
      ? null
      : attempts.reduce(
          (sum: number, a: any) => sum + (a.score / a.total) * 100,
          0,
        ) / attempts.length;

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href={`/faculty/courses/${quiz.course}/quizzes`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← Quizzes
      </Link>

      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="attempts">
            Attempts ({attempts.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="mt-4">
          <QuizEditor
            initialQuiz={{
              _id: String(quiz._id),
              course: String(quiz.course),
              title: quiz.title,
              status: quiz.status,
              maxAttempts: quiz.maxAttempts,
              questions: quiz.questions,
            }}
          />
        </TabsContent>
        <TabsContent value="attempts" className="mt-4">
          {attempts.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              No attempts yet.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {attempts.length} attempt
                {attempts.length === 1 ? "" : "s"} · mean{" "}
                {mean !== null ? `${mean.toFixed(1)}%` : "—"}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((a: any) => (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium">
                        {a.student?.name || a.student?.username || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(a.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {a.score} / {a.total} ·{" "}
                        {((a.score / a.total) * 100).toFixed(0)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
