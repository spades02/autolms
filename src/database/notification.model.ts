import { Schema, models, model, Document, Types } from "mongoose";

export type NotificationKind =
  | "lecture_published"
  | "quiz_published"
  | "assignment_published"
  | "assignment_due_soon"
  | "enrollment_request_created"
  | "enrollment_request_decided"
  | "forum_thread_created"
  | "forum_reply_posted"
  | "submission_received"
  | "submission_reviewed"
  | "lecture_processing_done"
  | "lecture_processing_failed";

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string;
  refId?: Types.ObjectId;
  readAt: Date | null;
  createdAt: Date;
}

const NotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  kind: {
    type: String,
    enum: [
      "lecture_published",
      "quiz_published",
      "assignment_published",
      "assignment_due_soon",
      "enrollment_request_created",
      "enrollment_request_decided",
      "forum_thread_created",
      "forum_reply_posted",
      "submission_received",
      "submission_reviewed",
      "lecture_processing_done",
      "lecture_processing_failed",
    ],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, default: "" },
  link: { type: String, default: "" },
  refId: { type: Schema.Types.ObjectId },
  readAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Idempotent fan-out: if (recipient, kind, refId) already exists we treat
// the create as a no-op.
NotificationSchema.index(
  { recipient: 1, kind: 1, refId: 1 },
  { unique: true, sparse: true },
);
NotificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

const Notification =
  models?.Notification || model("Notification", NotificationSchema);

export default Notification;
