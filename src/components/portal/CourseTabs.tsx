"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Audience = "faculty" | "student";

const TABS: Record<Audience, { href: (id: string) => string; label: string }[]> =
  {
    faculty: [
      { href: (id) => `/faculty/courses/${id}`, label: "Lectures" },
      { href: (id) => `/faculty/courses/${id}/quizzes`, label: "Quizzes" },
      {
        href: (id) => `/faculty/courses/${id}/assignments`,
        label: "Assignments",
      },
      {
        href: (id) => `/faculty/courses/${id}/insights`,
        label: "Insights",
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
        href: (id) => `/student/courses/${id}/progress`,
        label: "Progress",
      },
    ],
  };

export default function CourseTabs({
  courseId,
  audience,
}: {
  courseId: string;
  audience: Audience;
}) {
  const pathname = usePathname();
  const tabs = TABS[audience];

  return (
    <nav className="border-b">
      <ul className="flex gap-1">
        {tabs.map((t) => {
          const href = t.href(courseId);
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "inline-block px-3 py-2 text-sm border-b-2 -mb-px",
                  active
                    ? "border-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
