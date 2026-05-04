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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createAssignment } from "@/actions/assignment.action";

function defaultDueLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function CreateAssignmentDialog({
  courseId,
}: {
  courseId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueLocal, setDueLocal] = useState(defaultDueLocal());
  const [pending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setInstructions("");
    setDueLocal(defaultDueLocal());
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        const due = new Date(dueLocal);
        const a = await createAssignment({
          courseId,
          title: title.trim(),
          instructions: instructions.trim(),
          dueDate: due,
        });
        toast({ title: "Draft created" });
        setOpen(false);
        reset();
        router.push(`/faculty/assignments/${a._id}`);
      } catch (err: any) {
        toast({
          title: "Could not create",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>New assignment</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create an assignment</DialogTitle>
            <DialogDescription>
              You can edit details and publish on the next screen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="grid gap-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mid-term project proposal"
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="due">Due date</Label>
              <Input
                id="due"
                type="datetime-local"
                value={dueLocal}
                onChange={(e) => setDueLocal(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? "Creating…" : "Create draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
