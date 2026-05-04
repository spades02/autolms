"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { markRead } from "@/actions/notification.action";

type Notif = {
  _id: string;
  title: string;
  body?: string;
  link?: string;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationListItem({
  notification,
}: {
  notification: Notif;
}) {
  const [readAt, setReadAt] = useState(notification.readAt);
  const [, startTransition] = useTransition();

  function markIfUnread() {
    if (readAt) return;
    startTransition(async () => {
      await markRead(notification._id);
      setReadAt(new Date().toISOString());
    });
  }

  const Body = (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-md border px-4 py-3 hover:bg-muted/40",
        !readAt && "bg-blue-50/40 dark:bg-blue-950/30",
      )}
    >
      <span className="font-medium">{notification.title}</span>
      {notification.body ? (
        <span className="text-sm text-muted-foreground">
          {notification.body}
        </span>
      ) : null}
      <span className="text-[11px] text-muted-foreground">
        {new Date(notification.createdAt).toLocaleString()}
      </span>
    </div>
  );

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={markIfUnread}
        className="block"
      >
        {Body}
      </Link>
    );
  }
  return <div onClick={markIfUnread}>{Body}</div>;
}
