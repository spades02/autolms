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
import { createThread } from "@/actions/forum.action";

export default function NewThreadDialog({
  courseId,
  audience,
}: {
  courseId: string;
  audience: "faculty" | "student";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setBody("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    startTransition(async () => {
      try {
        const t = await createThread({
          courseId,
          title: title.trim(),
          body: body.trim(),
        });
        toast({ title: "Thread posted" });
        setOpen(false);
        reset();
        router.push(`/${audience}/courses/${courseId}/forum/${t._id}`);
      } catch (err: any) {
        toast({
          title: "Could not post",
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
        <Button>New thread</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Post a new thread</DialogTitle>
            <DialogDescription>
              Ask a question or start a discussion. Faculty get notified.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="grid gap-1">
              <Label htmlFor="thread-title">Title</Label>
              <Input
                id="thread-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Confused about backpropagation"
                required
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="thread-body">Body</Label>
              <Textarea
                id="thread-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="Describe your question with as much context as possible…"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={pending || !title.trim() || !body.trim()}
            >
              {pending ? "Posting…" : "Post thread"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
