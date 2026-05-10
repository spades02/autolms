import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/actions/user.action";
import {
  getAssignmentById,
  getSubmissionsForAssignment,
} from "@/actions/assignment.action";
import AssignmentEditor from "@/components/portal/AssignmentEditor";
import SubmissionReviewRow from "@/components/portal/SubmissionReviewRow";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function FacultyAssignmentPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole("faculty", "admin");
  const detail = await getAssignmentById(params.id);
  if (!detail || detail.role !== "faculty") notFound();

  const submissions = await getSubmissionsForAssignment(params.id);

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href={`/faculty/courses/${detail.course._id}/assignments`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← Assignments
      </Link>

      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions ({submissions.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="mt-4">
          <AssignmentEditor
            initial={{
              _id: String(detail.assignment._id),
              course: String(detail.course._id),
              title: detail.assignment.title,
              instructions: detail.assignment.instructions ?? "",
              rubric: detail.assignment.rubric ?? "",
              dueDate: detail.assignment.dueDate,
              status: detail.assignment.status,
              allowLate: detail.assignment.allowLate,
              attachments: detail.assignment.attachments ?? [],
            }}
          />
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          {submissions.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              No submissions yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Plagiarism</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s: any) => (
                  <SubmissionReviewRow key={s._id} submission={s} />
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
