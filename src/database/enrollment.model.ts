import { Schema, models, model, Document, Types } from "mongoose";

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  student: Types.ObjectId;
  enrolledAt: Date;
}

const EnrollmentSchema = new Schema({
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
  enrolledAt: { type: Date, default: Date.now },
});

EnrollmentSchema.index({ course: 1, student: 1 }, { unique: true });

const Enrollment =
  models?.Enrollment || model("Enrollment", EnrollmentSchema);

export default Enrollment;
