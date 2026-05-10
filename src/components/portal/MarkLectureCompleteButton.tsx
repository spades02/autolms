"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { markLectureComplete } from "@/actions/progress.action";

export default function MarkLectureCompleteButton({
  lectureId,
  initiallyCompleted,
}: {
  lectureId: string;
  initiallyCompleted: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [pending, startTransition] = useTransition();

  function click() {
    if (completed || pending) return;
    startTransition(async () => {
      try {
        await markLectureComplete(lectureId);
        setCompleted(true);
        toast({ title: "Marked complete" });
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Could not mark complete",
          description: err?.message ?? "Try again",
        });
      }
    });
  }

  if (completed) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
        <Check className="h-4 w-4" />
        Completed
      </span>
    );
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={click}
      disabled={pending}
    >
      Mark complete
    </Button>
  );
}
