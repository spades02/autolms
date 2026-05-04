import { Schema, models, model, Document, Types } from "mongoose";

export type SubmissionStatus = "Submitted" | "Reviewed";

export interface ISubmission extends Document {
  _id: Types.ObjectId;
  assignment: Types.ObjectId;
  student: Types.ObjectId;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  note: string;
  submittedAt: Date;
  isLate: boolean;
  status: SubmissionStatus;
  feedback: string;
  grade: number | null;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
}

const SubmissionSchema = new Schema({
  assignment: {
    type: Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
    index: true,
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  note: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["Submitted", "Reviewed"],
    default: "Submitted",
    required: true,
  },
  feedback: { type: String, default: "" },
  grade: { type: Number, default: null },
  reviewedAt: { type: Date },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
});

SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

const Submission =
  models?.Submission || model("Submission", SubmissionSchema);

export default Submission;
