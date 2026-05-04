"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { joinCourseByCode } from "@/actions/course.action";

export default function JoinCourseForm() {
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    startTransition(async () => {
      try {
        const course = await joinCourseByCode(code);
        toast({ title: "Enrolled", description: course.title });
        setCode("");
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Could not join",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2 items-end max-w-md">
      <div className="flex-1">
        <label
          htmlFor="join-code"
          className="text-xs text-muted-foreground block mb-1"
        >
          Have a course code?
        </label>
        <Input
          id="join-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          className="font-mono tracking-wider"
          maxLength={8}
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={pending || !code.trim()}>
        {pending ? "Joining…" : "Join"}
      </Button>
    </form>
  );
}
