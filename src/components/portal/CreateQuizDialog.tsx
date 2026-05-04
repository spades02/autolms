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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  createBlankQuiz,
  generateQuizDraft,
} from "@/actions/quiz.action";

type LectureOption = {
  _id: string;
  title: string;
  status: string;
};

export default function CreateQuizDialog({
  courseId,
  lectures,
}: {
  courseId: string;
  lectures: LectureOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"ai" | "blank">("ai");
  const [lectureId, setLectureId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [count, setCount] = useState("10");
  const [pending, startTransition] = useTransition();

  const eligibleLectures = lectures.filter(
    (l) => l.status === "ReviewReady" || l.status === "Published",
  );

  function reset() {
    setMode("ai");
    setLectureId("");
    setTitle("");
    setCount("10");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (mode === "ai") {
          if (!lectureId) {
            toast({ title: "Pick a lecture to draft from." });
            return;
          }
          const quiz = await generateQuizDraft({
            lectureId,
            count: Number(count) || 10,
            title: title.trim() || undefined,
          });
          toast({
            title: "Draft generated",
            description: `${quiz.questions.length} questions ready for review.`,
          });
          setOpen(false);
          reset();
          router.push(`/faculty/quizzes/${quiz._id}`);
        } else {
          if (!title.trim()) {
            toast({ title: "Title is required." });
            return;
          }
          const quiz = await createBlankQuiz({
            courseId,
            lectureId: lectureId || undefined,
            title: title.trim(),
          });
          setOpen(false);
          reset();
          router.push(`/faculty/quizzes/${quiz._id}`);
        }
      } catch (err: any) {
        toast({
          title: "Could not create quiz",
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
        <Button>New quiz</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create a quiz</DialogTitle>
            <DialogDescription>
              Let AI draft questions from a lecture, or start from a blank
              quiz.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-3">
            <div className="grid gap-1">
              <Label>Source</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "ai" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("ai")}
                >
                  AI from lecture
                </Button>
                <Button
                  type="button"
                  variant={mode === "blank" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("blank")}
                >
                  Blank
                </Button>
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="lecture">
                Lecture {mode === "blank" ? "(optional)" : ""}
              </Label>
              <Select value={lectureId} onValueChange={setLectureId}>
                <SelectTrigger id="lecture">
                  <SelectValue
                    placeholder={
                      eligibleLectures.length === 0
                        ? "No processed lectures yet"
                        : "Select a lecture"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {eligibleLectures.map((l) => (
                    <SelectItem key={l._id} value={l._id}>
                      {l.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === "ai" && eligibleLectures.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  AI drafting needs a lecture with a transcript. Process a
                  lecture first.
                </p>
              ) : null}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="title">
                Title {mode === "blank" ? "" : "(optional)"}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  mode === "ai"
                    ? "Defaults to the lecture name"
                    : "Quiz on neural networks"
                }
              />
            </div>

            {mode === "ai" ? (
              <div className="grid gap-1">
                <Label htmlFor="count">Number of questions</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Working…"
                : mode === "ai"
                  ? "Generate draft"
                  : "Create quiz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
