import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Thread = {
  _id: string;
  title: string;
  body: string;
  author?: { name?: string; username?: string; role?: string };
  answered: boolean;
  lastActivityAt: string;
};

export default function ForumThreadList({
  courseId,
  threads,
  audience,
}: {
  courseId: string;
  threads: Thread[];
  audience: "faculty" | "student";
}) {
  if (threads.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        No threads yet — start the conversation.
      </div>
    );
  }
  return (
    <ul className="grid gap-2">
      {threads.map((t) => (
        <li key={t._id}>
          <Link
            href={`/${audience}/courses/${courseId}/forum/${t._id}`}
            className="block rounded-md border p-3 hover:bg-muted/40"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium flex-1">{t.title}</span>
              {t.answered ? (
                <Badge variant="default">Answered</Badge>
              ) : null}
              {t.author?.role === "faculty" ? (
                <Badge variant="outline">Faculty</Badge>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t.author?.name || t.author?.username || "Someone"} ·{" "}
              {new Date(t.lastActivityAt).toLocaleString()}
            </div>
            {t.body ? (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {t.body}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
