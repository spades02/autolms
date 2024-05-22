import { Schema, models, model, Document } from "mongoose";

export interface IProject extends Document {
    title: string;    
    videoLinks: string[];  // Change to an array of strings
    quiz : string,
    asgn: string,
    notes: string,
    proj: string,
    paper: string,
    summary: string, 
    author: Schema.Types.ObjectId;
    createdAt: Date;
  }

const ProjectSchema = new Schema({
  title: { type: String, required: true },
  videoLinks: { type: [String], required: true },
  quiz: { type: String},
  asgn: { type: String },
  notes: { type: String},
  proj: { type: String },
  paper: { type: String },
  summary: { type: String },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});
  
  const Project = models.Project || model("Project", ProjectSchema);
  
  export default Project;