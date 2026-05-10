import { Schema, models, model, Document, Types } from "mongoose";

export type EnrollmentRequestStatus = "pending" | "approved" | "rejected";

export interface IEnrollmentRequest extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  student: Types.ObjectId;
  status: EnrollmentRequestStatus;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
  requestedAt: Date;
}

const EnrollmentRequestSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true,
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    required: true,
  },
  decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
  decidedAt: { type: Date },
  requestedAt: { type: Date, default: Date.now },
});

// Only one pending request per (course, student); approved/rejected rows are
// kept as audit history without colliding.
EnrollmentRequestSchema.index(
  { course: 1, student: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

const EnrollmentRequest =
  models?.EnrollmentRequest ||
  model("EnrollmentRequest", EnrollmentRequestSchema);

export default EnrollmentRequest;
