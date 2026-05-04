import { Schema, models, model, Document, Types } from "mongoose";

export type QuizStatus = "draft" | "published";

export interface IQuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  lecture?: Types.ObjectId;
  author: Types.ObjectId;
  title: string;
  status: QuizStatus;
  publishedAt?: Date;
  maxAttempts: number;
  questions: IQuizQuestion[];
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuizQuestion>(
  {
    prompt: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    explanation: { type: String },
  },
  { _id: false },
);

const QuizSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true,
  },
  lecture: { type: Schema.Types.ObjectId, ref: "Lecture" },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft",
    required: true,
  },
  publishedAt: { type: Date },
  maxAttempts: { type: Number, default: 1, min: 0 },
  questions: { type: [QuestionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

QuizSchema.index({ course: 1, status: 1 });

const Quiz = models?.Quiz || model("Quiz", QuizSchema);

export default Quiz;
