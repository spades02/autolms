import { Schema, models, model, Document, Types } from "mongoose";

export interface IForumPost extends Document {
  _id: Types.ObjectId;
  thread: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  createdAt: Date;
}

const ForumPostSchema = new Schema({
  thread: {
    type: Schema.Types.ObjectId,
    ref: "ForumThread",
    required: true,
    index: true,
  },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

ForumPostSchema.index({ thread: 1, createdAt: 1 });

const ForumPost = models?.ForumPost || model("ForumPost", ForumPostSchema);

export default ForumPost;
