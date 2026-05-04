import { Schema, models, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actor: Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: Types.ObjectId;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema({
  actor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId },
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

AuditLogSchema.index({ createdAt: -1 });

const AuditLog = models?.AuditLog || model("AuditLog", AuditLogSchema);

export default AuditLog;
