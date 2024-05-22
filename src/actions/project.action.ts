"use server";

import Project from "@/database/projects.model";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import { CreateSessionParams, GetSessionByIdParams, GetSessionParams } from "@/types/shared.types";
import { revalidatePath } from "next/cache";

export async function getProjects(params: GetSessionParams) {
    try {
        await connectToDatabase();

        const sessions = await Project.find({})
            .populate({ path: "author", model: User })
            .sort({ createdAt: -1 })
        
    
        return JSON.parse(JSON.stringify(sessions)) ;
        
    } catch (error) {
        console.log(error);
    }
}

export async function createProject(params: CreateSessionParams) {
    try {
       await connectToDatabase();

        const { title,videoLinks ,quiz,asgn,notes,paper,proj,summary,author,path } = params;

        // Create the Session
        const session = await Project.create({
        title,
        videoLinks, 
        quiz,
        asgn,
        notes,
        paper,
        proj,
        summary,
        author,
        path
        });

        revalidatePath(path);

        return JSON.parse(JSON.stringify(session));

    }catch(error) {
        console.log(error);
    }


}

export async function getUserprojects(userId: string) {
  try {
    await connectToDatabase();

    const project = await Project.find({ author: userId })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "author",
        model: User,
        select: "_id username picture clerkId ",
      });

    return JSON.parse(JSON.stringify(project));
  } catch (error) {
    console.log(error);
  }
}

export async function getProjectById(params: GetSessionByIdParams) {
  try {
    await connectToDatabase();

    const {projectId} = params
    const project = await Project.findById(projectId).populate({
      path: "author",
      model: User,
      select: "_id username picture clerkId ",
    });

    return JSON.parse(JSON.stringify(project));
  } catch (error) {
    console.log(error);
  }
}