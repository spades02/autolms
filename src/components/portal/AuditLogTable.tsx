import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AuditRow = {
  _id: string;
  actor?: { name?: string; email?: string };
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export default function AuditLogTable({ rows }: { rows: AuditRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        No audit events yet.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r._id}>
            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
              {new Date(r.createdAt).toLocaleString()}
            </TableCell>
            <TableCell>
              {r.actor?.name || r.actor?.email || "—"}
            </TableCell>
            <TableCell className="font-mono text-xs">{r.action}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {r.targetType}
              {r.targetId ? ` ${r.targetId.slice(-6)}` : ""}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground max-w-md truncate">
              {r.metadata ? JSON.stringify(r.metadata) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
