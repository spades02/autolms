"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { adminDeleteCourse } from "@/actions/admin.action";

export default function DeleteCourseButton({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function destroy() {
    startTransition(async () => {
      try {
        const res = await adminDeleteCourse(courseId);
        const c = res.counts;
        toast({
          title: "Course deleted",
          description: `Removed ${c.lectures} lecture${c.lectures === 1 ? "" : "s"}, ${c.quizzes} quiz${c.quizzes === 1 ? "" : "zes"}, ${c.assignments} assignment${c.assignments === 1 ? "" : "s"}.`,
        });
        setOpen(false);
        setConfirm("");
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Could not delete",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  const armed = confirm.trim() === courseTitle;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setConfirm("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete course</DialogTitle>
          <DialogDescription>
            This permanently removes the course, every lecture, quiz,
            assignment, attempt, submission, and chat session inside it.
            Type the course title to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={courseTitle}
            disabled={pending}
          />
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!armed || pending}
            onClick={destroy}
          >
            {pending ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
