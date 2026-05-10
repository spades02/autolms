import { Schema, models, model, Document, Types } from "mongoose";

export interface ILectureView extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  lecture: Types.ObjectId;
  course: Types.ObjectId;
  firstViewedAt: Date;
  completedAt?: Date;
}

const LectureViewSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  lecture: {
    type: Schema.Types.ObjectId,
    ref: "Lecture",
    required: true,
    index: true,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true,
  },
  firstViewedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

LectureViewSchema.index({ student: 1, lecture: 1 }, { unique: true });

const LectureView =
  models?.LectureView || model("LectureView", LectureViewSchema);

export default LectureView;
