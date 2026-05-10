import { Schema, models, model, Document, Types } from "mongoose";

export interface IForumThread extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  author: Types.ObjectId;
  title: string;
  body: string;
  answered: boolean;
  pinnedAnswerId?: Types.ObjectId;
  lastActivityAt: Date;
  createdAt: Date;
}

const ForumThreadSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    index: true,
  },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  body: { type: String, default: "" },
  answered: { type: Boolean, default: false },
  pinnedAnswerId: { type: Schema.Types.ObjectId, ref: "ForumPost" },
  lastActivityAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

ForumThreadSchema.index({ course: 1, lastActivityAt: -1 });

const ForumThread =
  models?.ForumThread || model("ForumThread", ForumThreadSchema);

export default ForumThread;
