import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { getCurrentMongoUser } from "@/actions/user.action";
import {
  getUnreadCount,
  listNotifications,
} from "@/actions/notification.action";
import { ModeToggle } from "@/components/ui/ModeToggle";
import NotificationBell from "@/components/portal/NotificationBell";
import logo from "../../../public/autolms-nav.png";

export const dynamic = "force-dynamic";

const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  student: [
    { href: "/student", label: "My Courses" },
  ],
  faculty: [
    { href: "/faculty", label: "My Courses" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/courses", label: "Courses" },
    { href: "/admin/audit", label: "Audit log" },
  ],
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentMongoUser();
  if (!user) {
    // Mongo mirror hasn't landed yet (rare race after signup) — bounce back to
    // the public landing so the Clerk webhook can settle.
    redirect("/");
  }

  const links = NAV_BY_ROLE[user.role] ?? [];

  const [unread, items] = await Promise.all([
    getUnreadCount(),
    listNotifications(10),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="flex items-center gap-4 px-4 py-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src={logo} alt="AutoLMS" className="h-10 w-10" />
            <span className="text-lg font-semibold tracking-tight">
              AutoLMS
            </span>
          </Link>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {user.role}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell initialUnread={unread} initialItems={items} />
            <ModeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden md:flex w-56 flex-col border-r p-4 gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
