"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  getChatHistory,
  sendChatMessage,
} from "@/actions/chat.action";

type Message = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export default function LectureChatbot({
  lectureId,
  hasTranscript,
}: {
  lectureId: string;
  hasTranscript: boolean;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const history = await getChatHistory(lectureId);
        if (cancelled) return;
        setMessages(history.messages);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lectureId]);

  useEffect(() => {
    // Pin scroll to the latest message whenever the list grows.
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages?.length, pending]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!hasTranscript) {
      toast({
        title: "No transcript yet",
        description: "Ask the instructor to publish the lecture first.",
      });
      return;
    }

    const optimistic: Message = {
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...(prev ?? []), optimistic]);
    setInput("");

    startTransition(async () => {
      try {
        const reply = await sendChatMessage(lectureId, trimmed);
        setMessages((prev) => [
          ...(prev ?? []),
          { role: "assistant", content: reply.content, createdAt: reply.createdAt },
        ]);
      } catch (err: any) {
        // Roll back the optimistic user message and show the error.
        setMessages((prev) =>
          prev ? prev.filter((m, i) => !(i === prev.length - 1 && m === optimistic)) : prev,
        );
        toast({
          title: "Could not get a reply",
          description: err?.message ?? "Try again.",
        });
      }
    });
  }

  if (messages === null) {
    return (
      <div className="rounded-md border p-6 text-sm text-muted-foreground text-center">
        Loading conversation…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!hasTranscript ? (
        <div className="rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
          The lecture transcript hasn&apos;t been published yet, so the chatbot
          has nothing to ground answers in.
        </div>
      ) : null}

      <div
        ref={scroller}
        className="rounded-md border bg-muted/20 p-3 h-[420px] overflow-y-auto space-y-3"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center px-6">
            Ask anything about this lecture. The assistant only answers from
            the lecture transcript.
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-background border",
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {pending ? (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 text-sm bg-background border text-muted-foreground italic">
              Thinking…
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={send} className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder="Ask about this lecture…"
          disabled={pending || !hasTranscript}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e as any);
            }
          }}
        />
        <Button
          type="submit"
          disabled={pending || !input.trim() || !hasTranscript}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
