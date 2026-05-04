import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createUser, deleteUser, updateUser } from "@/actions/user.action";
import type { UserRole } from "@/database/user.model";

const ALLOWED_ROLES: UserRole[] = ["student", "faculty", "admin"];

function coerceRole(value: unknown): UserRole {
  return ALLOWED_ROLES.includes(value as UserRole)
    ? (value as UserRole)
    : "student";
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.NEXT_CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    console.log("user created");
    const {
      id,
      email_addresses,
      image_url,
      username,
      first_name,
      last_name,
      public_metadata,
    } = evt.data;

    // Default to 'student' unless an admin has pre-seeded the Clerk user with a
    // different role (e.g. via Clerk Dashboard or our /api/dev/promote helper
    // applied before the user signed up).
    const role = coerceRole((public_metadata as any)?.role);

    const user = {
      clerkId: id,
      name: `${first_name ?? ""}${last_name ? ` ${last_name}` : ""}`.trim(),
      username: username ?? email_addresses[0].email_address.split("@")[0],
      email: email_addresses[0].email_address,
      picture: image_url,
      role,
    };

    const newUser = await createUser(user);

    if (newUser) {
      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: {
          userId: newUser._id,
          role,
        },
      });
    }

    return NextResponse.json({ message: "OK", user: newUser });
  }

  if (eventType === "user.updated") {
    const {
      id,
      email_addresses,
      image_url,
      username,
      first_name,
      last_name,
      public_metadata,
    } = evt.data;

    const role = coerceRole((public_metadata as any)?.role);

    const mongoUser = await updateUser({
      clerkId: id,
      updateData: {
        name: `${first_name ?? ""}${last_name ? ` ${last_name}` : ""}`.trim(),
        username: username ?? email_addresses[0].email_address.split("@")[0],
        email: email_addresses[0].email_address,
        picture: image_url,
        role,
      },
      path: `/profile/${id}`,
    });

    return NextResponse.json({ message: "OK", user: mongoUser });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    const deletedUser = await deleteUser({ clerkId: id! });

    return NextResponse.json({ message: "OK", user: deletedUser });
  }

  return new Response("", { status: 200 });
}
