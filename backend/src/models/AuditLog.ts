import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  actorId: string;
  actorEmail: string;
  ip: string;
  userAgent: string;
  meta: Record<string, unknown>;
  ts: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    actorId: { type: String, default: 'system' },
    actorEmail: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    meta: { type: Schema.Types.Mixed, default: {} },
    ts: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AuditLogSchema.index({ ts: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
