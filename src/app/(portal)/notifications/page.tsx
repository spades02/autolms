import { listNotifications } from "@/actions/notification.action";
import { getCurrentMongoUser } from "@/actions/user.action";
import { redirect } from "next/navigation";
import NotificationListItem from "@/components/portal/NotificationListItem";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentMongoUser();
  if (!user) redirect("/");

  const items = await listNotifications(100);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>

      {items.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          You have no notifications yet.
        </div>
      ) : (
        <ul className="grid gap-2">
          {items.map((n: any) => (
            <li key={n._id}>
              <NotificationListItem notification={n} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
