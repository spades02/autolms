"use server";

import User, { type UserRole } from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import {
  CreateUserParams,
  DeleteUserParams,
  UpdateUserParams,
} from "@/types/shared.types";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ALLOWED_ROLES: UserRole[] = ["student", "faculty", "admin"];

export default async function getClerkUserId() {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return userId;
}

export async function getUserById(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user) return null;

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.log(error);
    return null;
  }
}

/**
 * Returns the current Mongo user (with role) for the signed-in Clerk session.
 * Redirects to /sign-in if unauthenticated. If the Clerk webhook hasn't landed
 * yet (or can't reach localhost in dev), lazily creates the Mongo mirror from
 * the live Clerk profile so the rest of the app has someone to work with.
 */
export async function getCurrentMongoUser() {
  const clerkId = await getClerkUserId();
  const existing = await getUserById(clerkId);
  if (existing) return existing;

  // Webhook hasn't synced yet — pull from Clerk and mirror now.
  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const email =
      clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkId}@clerk.local`;
    const metaRole = (clerkUser.publicMetadata as any)?.role;
    const role: UserRole = ALLOWED_ROLES.includes(metaRole)
      ? metaRole
      : "student";

    // Suffix the derived username with a slice of clerkId so it stays unique
    // across users even when their email local-parts collide (e.g. multiple
    // accounts with addresses like student@…).
    const idSuffix = clerkId.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase();
    const baseUsername =
      clerkUser.username ?? email.split("@")[0] ?? "user";
    const username = clerkUser.username
      ? clerkUser.username
      : `${baseUsername}-${idSuffix}`;

    const created = await createUser({
      clerkId,
      name: `${clerkUser.firstName ?? ""}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ""}`.trim(),
      username,
      email,
      picture: clerkUser.imageUrl,
      role,
    });
    if (created) {
      // Best-effort metadata sync so client gates see the role too.
      try {
        await clerkClient.users.updateUserMetadata(clerkId, {
          publicMetadata: { userId: created._id, role },
        });
      } catch (err) {
        console.log("clerk metadata sync failed", err);
      }
    }
    return created ?? null;
  } catch (err) {
    console.log("lazy mongo user create failed", err);
    return null;
  }
}

/**
 * Server-side role guard. Throws if the current user lacks any of the allowed
 * roles. Use inside server actions and route handlers.
 */
export async function requireRole(...roles: UserRole[]) {
  const user = await getCurrentMongoUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (!roles.includes(user.role)) {
    throw new Error(`Forbidden: requires role ${roles.join(" or ")}`);
  }
  return user;
}

export async function createUser(userData: CreateUserParams) {
  try {
    await connectToDatabase();

    const baseDoc = {
      ...userData,
      role: userData.role ?? "student",
    };

    try {
      const newUser = await User.create(baseDoc);
      return JSON.parse(JSON.stringify(newUser));
    } catch (err: any) {
      // Username collision — append a clerkId-derived suffix and retry once
      // so a different Clerk account can't be permanently locked out by an
      // existing Mongo doc holding the same handle.
      const isUsernameDupe =
        err?.code === 11000 && err?.keyPattern?.username === 1;
      if (isUsernameDupe) {
        const idSuffix = userData.clerkId
          .replace(/[^a-z0-9]/gi, "")
          .slice(-6)
          .toLowerCase();
        const fallback = `${userData.username ?? "user"}-${idSuffix}`;
        const retried = await User.create({ ...baseDoc, username: fallback });
        return JSON.parse(JSON.stringify(retried));
      }
      throw err;
    }
  } catch (error) {
    console.log(error);
  }
}

export async function updateUser(params: UpdateUserParams) {
  try {
    await connectToDatabase();

    const { clerkId, updateData, path } = params;

    const updatedUser = await User.findOneAndUpdate({ clerkId }, updateData, {
      new: true,
    });

    if (path) revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    console.log(error);
  }
}

export async function deleteUser(params: DeleteUserParams) {
  try {
    await connectToDatabase();

    const { clerkId } = params;

    const userToDelete = await User.findOneAndDelete({ clerkId });

    if (!userToDelete) {
      throw new Error("User not found!");
    }

    // @todo Phase 2+: cascade-delete the user's enrollments, attempts,
    // submissions, and chat sessions when those collections exist.

    return JSON.parse(JSON.stringify(userToDelete));
  } catch (error) {
    console.log(error);
  }
}
