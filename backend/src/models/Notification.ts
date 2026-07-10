import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'sos_alert' | 'missing_person' | 'stolen_vehicle' | 'official_alert'
  | 'sighting_nearby' | 'flag_warning' | 'alert_resolved' | 'sighting_confirmed';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  sentVia: string[];
  sentAt: Date;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['sos_alert', 'missing_person', 'stolen_vehicle', 'official_alert', 'sighting_nearby', 'flag_warning', 'alert_resolved', 'sighting_confirmed'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, default: null, maxlength: 500 },
    data: { type: Schema.Types.Mixed, default: null },
    isRead: { type: Boolean, default: false },
    sentVia: { type: [String], default: [] },
    sentAt: { type: Date, default: Date.now },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days TTL

NotificationSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret: any) => {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
