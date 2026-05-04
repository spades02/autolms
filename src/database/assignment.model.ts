import { Schema, models, model, Document, Types } from "mongoose";

export type AssignmentStatus = "draft" | "published";

export interface IAssignmentAttachment {
  url: string;
  name: string;
  size?: number;
}

export interface IAssignment extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  author: Types.ObjectId;
  title: string;
  instructions: string;
  dueDate: Date;
  status: AssignmentStatus;
  publishedAt?: Date;
  allowLate: boolean;
  attachments: IAssignmentAttachment[];
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAssignmentAttachment>(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number },
  },
  { _id: false },
);

const AssignmentSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true,
  },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  instructions: { type: String, default: "" },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft",
    required: true,
  },
  publishedAt: { type: Date },
  allowLate: { type: Boolean, default: true },
  attachments: { type: [AttachmentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

AssignmentSchema.index({ course: 1, status: 1 });
AssignmentSchema.index({ course: 1, dueDate: 1 });

const Assignment =
  models?.Assignment || model("Assignment", AssignmentSchema);

export default Assignment;
