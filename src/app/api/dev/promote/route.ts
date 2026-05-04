import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongoose";
import User, { type UserRole } from "@/database/user.model";

const ALLOWED_ROLES: UserRole[] = ["student", "faculty", "admin"];

/**
 * Bootstrap helper to flip a user's role outside the regular admin UI.
 * Guarded by ADMIN_BOOTSTRAP_KEY. Updates Mongo + Clerk publicMetadata.role.
 *
 * Usage:
 *   curl -X POST http://localhost:3000/api/dev/promote \
 *     -H 'Content-Type: application/json' \
 *     -d '{"email":"faculty@test.com","role":"faculty","key":"<ADMIN_BOOTSTRAP_KEY>"}'
 */
export async function POST(req: Request) {
  const expected = process.env.ADMIN_BOOTSTRAP_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_BOOTSTRAP_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body must be JSON" },
      { status: 400 },
    );
  }

  const { email, role, key } = body ?? {};

  if (key !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!email || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `email and role (${ALLOWED_ROLES.join("|")}) are required` },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const user = await User.findOneAndUpdate(
    { email },
    { role },
    { new: true },
  );
  if (!user) {
    return NextResponse.json(
      { error: `No user found with email ${email}` },
      { status: 404 },
    );
  }

  // Mirror to Clerk publicMetadata so client-side gates and future webhooks
  // see the same value.
  try {
    await clerkClient.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { userId: user._id, role },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: true,
        warning: `Mongo updated but Clerk metadata sync failed: ${error?.message ?? error}`,
        user: { email: user.email, role: user.role },
      },
      { status: 207 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: { email: user.email, role: user.role },
  });
}
