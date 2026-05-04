import { redirect } from "next/navigation";
import { getCurrentMongoUser } from "@/actions/user.action";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentMongoUser();
  if (!user) redirect("/");

  if (user.role === "faculty") redirect("/faculty");
  if (user.role === "admin") redirect("/admin");
  redirect("/student");
}
