import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISighting extends Document {
  _id: mongoose.Types.ObjectId;
  alertId: mongoose.Types.ObjectId;
  reporterId?: mongoose.Types.ObjectId;
  deviceId?: string;

  location: { type: 'Point'; coordinates: [number, number] };
  locationName?: string;
  description?: string;
  imageUrl?: string;

  // Confirmation
  confirmationCount: number;
  confirmedBy: Array<{ userId?: mongoose.Types.ObjectId | null; deviceId?: string; createdAt: Date }>;

  // Trust
  reporterTrustScore?: number;
  isVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
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

const SightingSchema = new Schema<ISighting>(
  {
    alertId: { type: Schema.Types.ObjectId, ref: 'Alert', required: true, index: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    deviceId: { type: String, default: null, index: true },

    location: { type: PointSchema, required: true },
    locationName: { type: String, default: null, maxlength: 200 },
    description: { type: String, default: null, maxlength: 500 },
    imageUrl: { type: String, default: null, maxlength: 500 },

    confirmationCount: { type: Number, default: 1, min: 0 },
    confirmedBy: {
      type: [{
        _id: false,
        userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        deviceId: { type: String, default: null },
        createdAt: { type: Date, default: Date.now },
      }],
      default: [],
    },

    reporterTrustScore: { type: Number, default: null },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

SightingSchema.index({ location: '2dsphere' });
SightingSchema.index({ alertId: 1, createdAt: -1 });
SightingSchema.index({ confirmationCount: -1 });

SightingSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret: any) => {
    delete ret.confirmedBy;
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Sighting: Model<ISighting> =
  mongoose.models.Sighting || mongoose.model<ISighting>('Sighting', SightingSchema);
