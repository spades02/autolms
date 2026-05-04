import { Schema, models, model, Document, Types } from "mongoose";

export type ChatRole = "user" | "assistant";

export interface IChatMessage {
  role: ChatRole;
  content: string;
  createdAt: Date;
}

export interface IChatSession extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  lecture: Types.ObjectId;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ChatSessionSchema = new Schema(
  {
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
    messages: { type: [ChatMessageSchema], default: [] },
  },
  { timestamps: true },
);

ChatSessionSchema.index({ student: 1, lecture: 1 }, { unique: true });

const ChatSession =
  models?.ChatSession || model("ChatSession", ChatSessionSchema);

export default ChatSession;
