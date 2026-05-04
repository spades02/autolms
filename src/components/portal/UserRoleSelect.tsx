"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { updateUserRole } from "@/actions/admin.action";
import type { UserRole } from "@/database/user.model";

const ROLES: UserRole[] = ["student", "faculty", "admin"];

export default function UserRoleSelect({
  userId,
  initialRole,
}: {
  userId: string;
  initialRole: UserRole;
}) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function onChange(next: string) {
    if (next === role) return;
    const previous = role;
    setRole(next as UserRole);
    startTransition(async () => {
      try {
        await updateUserRole(userId, next as UserRole);
        toast({ title: "Role updated", description: `Now ${next}` });
        router.refresh();
      } catch (err: any) {
        setRole(previous);
        toast({
          title: "Could not update",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  return (
    <Select value={role} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="w-32 h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
