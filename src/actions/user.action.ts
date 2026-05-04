"use server";

import User, { type UserRole } from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import {
  CreateUserParams,
  DeleteUserParams,
  UpdateUserParams,
} from "@/types/shared.types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
 * Redirects to /sign-in if unauthenticated. Returns null if Clerk session
 * exists but the Mongo mirror has not landed yet (rare race after signup).
 */
export async function getCurrentMongoUser() {
  const clerkId = await getClerkUserId();
  return getUserById(clerkId);
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

    const newUser = await User.create({
      ...userData,
      role: userData.role ?? "student",
    });

    return JSON.parse(JSON.stringify(newUser));
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
