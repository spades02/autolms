import { Schema, models, model, Document, Types } from "mongoose";

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  quiz: Types.ObjectId;
  student: Types.ObjectId;
  answers: number[];
  score: number;
  total: number;
  submittedAt: Date;
}

const QuizAttemptSchema = new Schema({
  quiz: {
    type: Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
    index: true,
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  answers: { type: [Number], default: [] },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
});

QuizAttemptSchema.index({ quiz: 1, student: 1 });

const QuizAttempt =
  models?.QuizAttempt || model("QuizAttempt", QuizAttemptSchema);

export default QuizAttempt;
