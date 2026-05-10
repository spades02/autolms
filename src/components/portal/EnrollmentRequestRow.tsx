"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  approveRequest,
  rejectRequest,
} from "@/actions/enrollmentRequest.action";

type RequestRow = {
  _id: string;
  student?: {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
  };
  requestedAt: string;
};

export default function EnrollmentRequestRow({
  row,
}: {
  row: RequestRow;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  function approve() {
    startTransition(async () => {
      try {
        await approveRequest(row._id);
        toast({ title: "Approved" });
        setRemoved(true);
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Could not approve",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  function reject() {
    startTransition(async () => {
      try {
        await rejectRequest(row._id);
        toast({ title: "Rejected" });
        setRemoved(true);
        router.refresh();
      } catch (err: any) {
        toast({
          title: "Could not reject",
          description: err?.message ?? "Unknown error",
        });
      }
    });
  }

  if (removed) return null;

  return (
    <TableRow>
      <TableCell className="font-medium">
        {row.student?.name || row.student?.username || "—"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {row.student?.email}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {new Date(row.requestedAt).toLocaleString()}
      </TableCell>
      <TableCell>
        <div className="flex gap-2 justify-end">
          <Button size="sm" onClick={approve} disabled={pending}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={reject}
            disabled={pending}
          >
            Reject
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
