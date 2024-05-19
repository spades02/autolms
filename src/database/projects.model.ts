import { Schema, models, model, Document } from "mongoose";

export interface IProject extends Document {
    title: string;    
    videoLinks: string[];  // Change to an array of strings
    author: Schema.Types.ObjectId;
    createdAt: Date;
  }

const ProjectSchema = new Schema({
    title: { type: String, required: true },
    videoLinks: { type: [String], required: true },  // Change to an array of strings
    author: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  });
  
  const Project = models.Project || model("Project", ProjectSchema);
  
  export default Project;