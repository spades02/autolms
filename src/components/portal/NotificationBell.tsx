"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead,
} from "@/actions/notification.action";

type Notif = {
  _id: string;
  kind: string;
  title: string;
  body?: string;
  link?: string;
  readAt: string | null;
  createdAt: string;
};

const POLL_MS = 30000;

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export default function NotificationBell({
  initialUnread,
  initialItems,
}: {
  initialUnread: number;
  initialItems: Notif[];
}) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Notif[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const count = await getUnreadCount();
      if (cancelled) return;
      setUnread(count);
    }
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  async function refresh() {
    const [count, list] = await Promise.all([
      getUnreadCount(),
      listNotifications(10),
    ]);
    setUnread(count);
    setItems(list);
  }

  async function onOpenChange(value: boolean) {
    setOpen(value);
    if (value) {
      // Refresh on open so the popover always shows current state.
      await refresh();
    }
  }

  function clickItem(n: Notif) {
    if (!n.readAt) {
      startTransition(async () => {
        await markRead(n._id);
        setItems((prev) =>
          prev.map((p) =>
            p._id === n._id ? { ...p, readAt: new Date().toISOString() } : p,
          ),
        );
        setUnread((u) => Math.max(0, u - 1));
      });
    }
    setOpen(false);
  }

  function clickMarkAll() {
    startTransition(async () => {
      await markAllRead();
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((p) => (p.readAt ? p : { ...p, readAt: now })),
      );
      setUnread(0);
    });
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-blue-600 text-white text-[10px] leading-4 px-1 text-center">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-80">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-medium">Notifications</span>
          {unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clickMarkAll}
              className="h-7 text-xs"
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <Separator />
        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              You&apos;re all caught up.
            </div>
          ) : (
            <ul>
              {items.map((n) => {
                const Inner = (
                  <div
                    className={cn(
                      "flex flex-col gap-0.5 px-3 py-2 hover:bg-muted/40 cursor-pointer",
                      !n.readAt && "bg-blue-50/40 dark:bg-blue-950/30",
                    )}
                  >
                    <span className="text-sm font-medium">{n.title}</span>
                    {n.body ? (
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {n.body}
                      </span>
                    ) : null}
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                );
                return (
                  <li key={n._id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => clickItem(n)}
                        className="block"
                      >
                        {Inner}
                      </Link>
                    ) : (
                      <div onClick={() => clickItem(n)}>{Inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs text-muted-foreground hover:underline"
          >
            See all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
