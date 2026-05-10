"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  markThreadAnswered,
  replyToThread,
} from "@/actions/forum.action";

type Author = {
  _id: string;
  name?: string;
  username?: string;
  role?: string;
};
type Thread = {
  _id: string;
  title: string;
  body: string;
  author?: Author;
  answered: boolean;
  pinnedAnswerId?: string;
  createdAt: string;
};
type Post = {
  _id: string;
  body: string;
  author?: Author;
  createdAt: string;
};

export default function ForumThreadView({
  thread,
  posts,
  canMarkAnswered,
}: {
  thread: Thread;
  posts: Post[];
  canMarkAnswered: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();
  const [localPosts, setLocalPosts] = useState(posts);
  const [pinnedId, setPinnedId] = useState(thread.pinnedAnswerId);
  const [answered, setAnswered] = useState(thread.answered);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    startTransition(async () => {
      try {
        const post = await replyToThread({
          threadId: thread._id,
          body: reply,
        });
        setLocalPosts((prev) => [...prev, post]);
        setReply("");
        toast({ title: "Reply posted" });
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Could not reply",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  function pinAnswer(postId: string) {
    startTransition(async () => {
      try {
        await markThreadAnswered(thread._id, postId);
        setPinnedId(postId);
        setAnswered(true);
        toast({ title: "Marked as the answer" });
      } catch (err: any) {
        toast({
          title: "Could not mark answer",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold flex-1">{thread.title}</h1>
          {answered ? <Badge>Answered</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {thread.author?.name || thread.author?.username || "Someone"} ·{" "}
          {new Date(thread.createdAt).toLocaleString()}
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm">{thread.body}</p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {localPosts.length} {localPosts.length === 1 ? "reply" : "replies"}
        </h2>
        {localPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No replies yet.</p>
        ) : (
          <ul className="space-y-3">
            {localPosts.map((p) => {
              const isPinned = pinnedId && String(pinnedId) === String(p._id);
              return (
                <li
                  key={p._id}
                  className={cn(
                    "rounded-md border p-3",
                    isPinned &&
                      "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {p.author?.name || p.author?.username || "Someone"}
                    </span>
                    {p.author?.role === "faculty" ? (
                      <Badge variant="outline" className="text-[10px]">
                        Faculty
                      </Badge>
                    ) : null}
                    {isPinned ? (
                      <Badge variant="default" className="text-[10px]">
                        Answer
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{p.body}</p>
                  {canMarkAnswered && !isPinned ? (
                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => pinAnswer(p._id)}
                        disabled={pending}
                      >
                        Mark as answer
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Separator />

      <form onSubmit={submit} className="space-y-2">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          placeholder="Write a reply…"
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !reply.trim()}>
          {pending ? "Posting…" : "Post reply"}
        </Button>
      </form>
    </div>
  );
}
