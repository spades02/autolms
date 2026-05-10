"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  deleteAssignment,
  publishAssignment,
  unpublishAssignment,
  updateAssignment,
} from "@/actions/assignment.action";
import AssignmentStatusBadge from "@/components/portal/AssignmentStatusBadge";
import AssignmentAttachmentsField, {
  type Attachment,
} from "@/components/portal/AssignmentAttachmentsField";
import type { AssignmentStatus } from "@/database/assignment.model";

function dateToLocalInput(d: Date | string) {
  const date = new Date(d);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

type Editable = {
  _id: string;
  course: string;
  title: string;
  instructions: string;
  rubric: string;
  dueDate: string;
  status: AssignmentStatus;
  allowLate: boolean;
  attachments: Attachment[];
};

export default function AssignmentEditor({
  initial,
}: {
  initial: Editable;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial.title);
  const [instructions, setInstructions] = useState(initial.instructions);
  const [rubric, setRubric] = useState(initial.rubric ?? "");
  const [dueLocal, setDueLocal] = useState(
    dateToLocalInput(initial.dueDate),
  );
  const [allowLate, setAllowLate] = useState(initial.allowLate);
  const [attachments, setAttachments] = useState<Attachment[]>(
    initial.attachments ?? [],
  );
  const [status, setStatus] = useState<AssignmentStatus>(initial.status);

  function buildPatch() {
    return {
      title,
      instructions,
      rubric,
      dueDate: new Date(dueLocal),
      allowLate,
      attachments,
    };
  }

  function save() {
    startTransition(async () => {
      try {
        const updated = await updateAssignment(initial._id, buildPatch());
        setStatus(updated.status);
        toast({ title: "Saved" });
      } catch (err: any) {
        toast({
          title: "Could not save",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  function publish() {
    startTransition(async () => {
      try {
        await updateAssignment(initial._id, buildPatch());
        const updated = await publishAssignment(initial._id);
        setStatus(updated.status);
        toast({ title: "Assignment published" });
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Could not publish",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  function unpublish() {
    startTransition(async () => {
      try {
        const updated = await unpublishAssignment(initial._id);
        setStatus(updated.status);
        toast({ title: "Unpublished" });
      } catch (err: any) {
        toast({
          title: "Could not unpublish",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  function destroy() {
    if (!confirm("Delete this assignment draft?")) return;
    startTransition(async () => {
      try {
        await deleteAssignment(initial._id);
        toast({ title: "Deleted" });
        router.replace(`/faculty/courses/${initial.course}/assignments`);
      } catch (err: any) {
        toast({
          title: "Could not delete",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold flex-1">{title || "Untitled"}</h1>
        <AssignmentStatusBadge status={status} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 max-w-2xl">
        <div className="grid gap-1 md:col-span-2">
          <Label htmlFor="a-title">Title</Label>
          <Input
            id="a-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="a-due">Due date</Label>
          <Input
            id="a-due"
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="flex items-end gap-2">
          <Checkbox
            id="a-late"
            checked={allowLate}
            onCheckedChange={(v) => setAllowLate(!!v)}
            disabled={pending}
          />
          <Label htmlFor="a-late" className="font-normal">
            Accept late submissions (mark as late)
          </Label>
        </div>
      </div>

      <div className="grid gap-1 max-w-2xl">
        <Label htmlFor="a-instructions">Instructions</Label>
        <Textarea
          id="a-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={6}
          disabled={pending}
        />
      </div>

      <div className="grid gap-1 max-w-2xl">
        <Label htmlFor="a-rubric">
          Grading rubric (used by AI auto-grader; leave blank to skip)
        </Label>
        <Textarea
          id="a-rubric"
          value={rubric}
          onChange={(e) => setRubric(e.target.value)}
          rows={6}
          placeholder={
            "Example:\n- Correctness (4 pts)\n- Code quality (3 pts)\n- Documentation (2 pts)\n- Bonus / extra effort (1 pt)\nTotal: 10"
          }
          disabled={pending}
        />
      </div>

      <div className="max-w-2xl">
        <AssignmentAttachmentsField
          attachments={attachments}
          onChange={setAttachments}
          disabled={pending}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={save} disabled={pending}>
          Save
        </Button>
        {status === "draft" ? (
          <>
            <Button onClick={publish} disabled={pending}>
              Publish
            </Button>
            <Button
              variant="ghost"
              onClick={destroy}
              disabled={pending}
              className="text-destructive"
            >
              Delete
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={unpublish} disabled={pending}>
            Unpublish
          </Button>
        )}
      </div>
    </div>
  );
}
