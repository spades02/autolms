"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Audience = "faculty" | "student";

type TabDef = {
  href: (id: string) => string;
  label: string;
  badgeKey?: "pending";
};

const TABS: Record<Audience, TabDef[]> = {
  faculty: [
    { href: (id) => `/faculty/courses/${id}`, label: "Lectures" },
    { href: (id) => `/faculty/courses/${id}/quizzes`, label: "Quizzes" },
    {
      href: (id) => `/faculty/courses/${id}/assignments`,
      label: "Assignments",
    },
    {
      href: (id) => `/faculty/courses/${id}/forum`,
      label: "Forum",
    },
    {
      href: (id) => `/faculty/courses/${id}/insights`,
      label: "Insights",
    },
    {
      href: (id) => `/faculty/courses/${id}/enrollments`,
      label: "Pending",
      badgeKey: "pending",
    },
  ],
  student: [
    { href: (id) => `/student/courses/${id}`, label: "Lectures" },
    { href: (id) => `/student/courses/${id}/quizzes`, label: "Quizzes" },
    {
      href: (id) => `/student/courses/${id}/assignments`,
      label: "Assignments",
    },
    {
      href: (id) => `/student/courses/${id}/forum`,
      label: "Forum",
    },
    {
      href: (id) => `/student/courses/${id}/progress`,
      label: "Progress",
    },
  ],
};

export default function CourseTabs({
  courseId,
  audience,
  badges,
}: {
  courseId: string;
  audience: Audience;
  badges?: { pending?: number };
}) {
  const pathname = usePathname();
  const tabs = TABS[audience];

  return (
    <nav className="border-b">
      <ul className="flex gap-1 flex-wrap">
        {tabs.map((t) => {
          const href = t.href(courseId);
          const active = pathname === href;
          const badgeCount = t.badgeKey ? badges?.[t.badgeKey] ?? 0 : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px",
                  active
                    ? "border-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {badgeCount > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[10px] px-1">
                    {badgeCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
