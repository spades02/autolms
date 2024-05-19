"use server";

import Project from "@/database/projects.model";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import { CreateSessionParams, GetSessionParams } from "@/types/shared.types";
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

        const { title,videoLinks ,author,path } = params;

        // Create the Session
        const session = await Project.create({
        title,
        videoLinks,        
        author,
        path
        });

        revalidatePath(path);

        return JSON.parse(JSON.stringify(session));

    }catch(error) {
        console.log(error);
    }


}