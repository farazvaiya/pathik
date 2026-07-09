import mongoose, { Schema, Document, Model } from 'mongoose';

export type AlertType =
  | 'accident' | 'assault' | 'robbery' | 'harassment' | 'medical'
  | 'fire' | 'missing_person' | 'stolen_vehicle' | 'escaped_criminal'
  | 'traffic_jam' | 'toll_extortion' | 'police_checkpost'
  | 'natural_disaster' | 'road_hazard' | 'other';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'resolved' | 'false_alarm' | 'pending_review' | 'expired';

export interface IAlert extends Document {
  _id: mongoose.Types.ObjectId;

  // AI-detected
  type: AlertType;
  severity: AlertSeverity;
  isEmergency: boolean;
  aiConfidence?: number;
  aiMetadataId?: string;

  // Original post
  originalPostId: mongoose.Types.ObjectId;
  originalText?: string;

  // Location
  location: { type: 'Point'; coordinates: [number, number] };
  locationName?: string;
  radius: number; // meters

  // Management
  status: AlertStatus;
  sightingCount: number;
  lastSightingAt?: Date;
  expiresAt?: Date;

  // Flagging
  flagCount: number;
  flaggedBy: Array<{ userId: mongoose.Types.ObjectId; deviceId?: string; reason?: string }>;

  // Admin
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  resolution?: string;

  // Creator
  creatorId?: mongoose.Types.ObjectId;
  creatorDeviceId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const PointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number],
      validate: { validator: (v: number[]) => Array.isArray(v) && v.length === 2, message: 'coordinates must be [lng, lat]' },
    },
  },
  { _id: false }
);

const AlertSchema = new Schema<IAlert>(
  {
    type: {
      type: String,
      required: true,
      enum: ['accident','assault','robbery','harassment','medical','fire','missing_person','stolen_vehicle','escaped_criminal','traffic_jam','toll_extortion','police_checkpost','natural_disaster','road_hazard','other'],
      index: true,
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true, index: true },
    isEmergency: { type: Boolean, default: false, index: true },
    aiConfidence: { type: Number, default: null, min: 0, max: 1 },
    aiMetadataId: { type: String, default: null },

    originalPostId: { type: Schema.Types.ObjectId, ref: 'FeedPost', required: true, index: true },
    originalText: { type: String, default: null },

    location: { type: PointSchema, required: true },
    locationName: { type: String, default: null, maxlength: 200 },
    radius: { type: Number, default: 2000, min: 100, max: 10000 },

    status: { type: String, enum: ['active', 'resolved', 'false_alarm', 'pending_review', 'expired'], default: 'active', index: true },
    sightingCount: { type: Number, default: 0, min: 0 },
    lastSightingAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },

    flagCount: { type: Number, default: 0, min: 0 },
    flaggedBy: {
      type: [{
        _id: false,
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        deviceId: { type: String, default: null },
        reason: { type: String, default: null },
      }],
      default: [],
    },

    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    resolution: { type: String, default: null, maxlength: 500 },

    creatorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    creatorDeviceId: { type: String, default: null },
  },
  { timestamps: true }
);

AlertSchema.index({ location: '2dsphere' });
AlertSchema.index({ status: 1, isEmergency: 1, createdAt: -1 });
AlertSchema.index({ type: 1, status: 1 });
AlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AlertSchema.index({ creatorId: 1 });

AlertSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret: any) => {
    delete ret.flaggedBy;
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Alert: Model<IAlert> =
  mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
