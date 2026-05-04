import { Schema, models, model, Document, Types } from "mongoose";

export type LectureStatus =
  | "Uploaded"
  | "Processing"
  | "ReviewReady"
  | "Published"
  | "Failed";

export interface ILecture extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  title: string;
  weekNumber?: number;
  videoUrl: string;
  uploadedBy: Types.ObjectId;
  status: LectureStatus;
  transcript: string;
  summary: string;
  processingError: string;
  publishedAt?: Date;
  createdAt: Date;
}

const LectureSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  weekNumber: { type: Number },
  videoUrl: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["Uploaded", "Processing", "ReviewReady", "Published", "Failed"],
    default: "Uploaded",
    required: true,
  },
  transcript: { type: String, default: "" },
  summary: { type: String, default: "" },
  processingError: { type: String, default: "" },
  publishedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

LectureSchema.index({ course: 1, status: 1 });

const Lecture = models?.Lecture || model("Lecture", LectureSchema);

export default Lecture;
