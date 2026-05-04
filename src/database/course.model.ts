import { Schema, models, model, Document, Types } from "mongoose";

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  code?: string;
  joinCode: string;
  faculty: Types.ObjectId;
  createdAt: Date;
}

const CourseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  code: { type: String },
  joinCode: { type: String, required: true, unique: true, index: true },
  faculty: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Course = models?.Course || model("Course", CourseSchema);

export default Course;
