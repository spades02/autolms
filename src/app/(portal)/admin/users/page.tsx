import { requireRole } from "@/actions/user.action";
import { getAllUsers } from "@/actions/admin.action";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserRoleSelect from "@/components/portal/UserRoleSelect";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole("admin");
  const users = await getAllUsers();

  return (
    <div className="max-w-5xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} account{users.length === 1 ? "" : "s"} — change a
          role to promote or demote.
        </p>
      </header>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u: any) => (
            <TableRow key={u._id}>
              <TableCell className="font-medium">
                {u.name || u.username || "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {u.email}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(u.joinedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <UserRoleSelect userId={u._id} initialRole={u.role} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
