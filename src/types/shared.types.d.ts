import type { IUser, UserRole } from "@/database/user.model";

export interface CreateUserParams {
  clerkId: string;
  name: string;
  username?: string;
  email: string;
  picture: string;
  role?: UserRole;
}

export interface UpdateUserParams {
  clerkId: string;
  updateData: Partial<IUser>;
  path: string;
}

export interface DeleteUserParams {
  clerkId: string;
}
