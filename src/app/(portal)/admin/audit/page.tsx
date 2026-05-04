import { requireRole } from "@/actions/user.action";
import { getRecentAuditLogs } from "@/actions/admin.action";
import AuditLogTable from "@/components/portal/AuditLogTable";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireRole("admin");
  const audit = await getRecentAuditLogs(100);

  return (
    <div className="max-w-5xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          {audit.length} event{audit.length === 1 ? "" : "s"} — newest first.
        </p>
      </header>
      <AuditLogTable rows={audit} />
    </div>
  );
}
