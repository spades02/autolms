import { Schema } from "mongoose";
import { IUser } from "@/mongodb";

export interface GetSessionParams {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    filter?: string;
  }
  
  export interface CreateSessionParams {
    title: string;
    videoLinks: string[];
    quiz: string;
    asgn: string;
    notes: string;
    proj: string;
    paper: string;
    summary: string;
    author: Schema.Types.ObjectId | IUser;
    path: string;
  }
  
  export interface CreateUserParams {
    clerkId: string;
    name: string;
    username?: string;
    email: string;
    picture: string;
  }

  export interface UpdateUserParams {
    clerkId: string;
    updateData: Partial<IUser>;
    path: string;
  }

  export interface DeleteUserParams {
    clerkId: string;
  }

  export interface GetSessionByIdParams {
    projectId: string;
  }

  export interface ToggleSaveSessionParams {
    userId : string;
    sessionId : string;
    path : string;
  }

  export interface shareSessionParams {
    sessionId : string;
    
  }

  declare type CheckoutTransactionParams = {
    plan: string;
    credits: number;
    amount: number;
    buyerId: string;
  };
  
  declare type CreateTransactionParams = {
    stripeId: string;
    amount: number;
    credits: number;
    plan: string;
    buyerId: string;
    createdAt: Date;
  };

  export interface LikeSessionParams {  
    sessionId : string;
    userId : string;
    hasLiked : boolean;
    path : string;  
  }