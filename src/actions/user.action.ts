"use server"

import Project from "@/database/projects.model";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import { CreateUserParams, DeleteUserParams, GetSessionByIdParams, UpdateUserParams } from "@/types/shared.types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function getClerkUserId() {
  try {
    const { userId } = auth();
    if (!userId) {
      redirect("/sign-in");
    }
    return JSON.parse(JSON.stringify(userId));
  }
  catch (error) {
    console.log(error);
  }
}


export async function getUserById(userId: string){
    try {
        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) throw new Error("User not found");
        
        return JSON.parse(JSON.stringify(user));

    } catch (error) {
        console.log(error);
    }
}

export async function createUser(userData: CreateUserParams){
    try {
      await connectToDatabase();

        const newUser = await User.create(userData);
        
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
  
      revalidatePath(path);

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
  
      // Delete User Questions
      await Project.deleteMany({ author: userToDelete._id });
  
      // @todo -> delete user answers, comments, etc
  
      const deletedUser = await User.findByIdAndDelete(userToDelete._id);
  
      return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
    } catch (error) {
      console.log(error);
    }
  }
  