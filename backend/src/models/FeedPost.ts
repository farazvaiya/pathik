import mongoose, { Schema, Document, Model } from 'mongoose';

export type FeedPostType = 'traffic' | 'accident' | 'danger' | 'tip' | 'event' | 'other';
export type FeedPostStatus = 'active' | 'hidden' | 'deleted' | 'pending_review';

export type AICategory =
  | 'accident' | 'assault' | 'robbery' | 'harassment' | 'medical'
  | 'fire' | 'missing_person' | 'stolen_vehicle' | 'escaped_criminal'
  | 'traffic_jam' | 'toll_extortion' | 'police_checkpost'
  | 'natural_disaster' | 'road_hazard' | 'other';

export type AISeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IFeedPost extends Document {
  _id: mongoose.Types.ObjectId;
  type: FeedPostType;
  from: string;
  to: string;
  message: string;
  location: { type: 'Point'; coordinates: [number, number] } | null;
  locationName?: string;
  image: string | null;
  authorId: mongoose.Types.ObjectId | null;
  deviceId: string | null;
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  votedBy: Array<{ userId: mongoose.Types.ObjectId | null; deviceId: string | null; value: 1 | -1 }>;
  status: FeedPostStatus;
  isDeleted: boolean;
  expiresAt: Date | null;

  // AI classification
  aiCategory?: AICategory;
  aiSeverity?: AISeverity;
  aiIsEmergency: boolean;
  aiConfidence?: number;
  aiMetadataId?: string; // reference to MongoDB AI metadata document

  // Alert reference
  alertId?: mongoose.Types.ObjectId;

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

const FeedPostSchema = new Schema<IFeedPost>(
  {
    type: { type: String, required: true, enum: ['traffic', 'accident', 'danger', 'tip', 'event', 'other'], default: 'tip', index: true },
    from: { type: String, default: '', trim: true, maxlength: 120 },
    to: { type: String, default: '', trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 1200 },
    location: { type: PointSchema, default: null },
    locationName: { type: String, default: null, maxlength: 200 },
    image: { type: String, default: null, maxlength: 500 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    deviceId: { type: String, default: null, index: true },
    isAnonymous: { type: Boolean, default: true },
    upvotes: { type: Number, default: 0, min: 0 },
    downvotes: { type: Number, default: 0, min: 0 },
    votedBy: {
      type: [{ _id: false, userId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, deviceId: { type: String, default: null }, value: { type: Number, enum: [1, -1], required: true } }],
      default: [],
    },
    status: { type: String, enum: ['active', 'hidden', 'deleted', 'pending_review'], default: 'active', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, default: null },

    // AI classification
    aiCategory: {
      type: String,
      enum: ['accident','assault','robbery','harassment','medical','fire','missing_person','stolen_vehicle','escaped_criminal','traffic_jam','toll_extortion','police_checkpost','natural_disaster','road_hazard','other', null],
      default: null,
      index: true,
    },
    aiSeverity: { type: String, enum: ['low', 'medium', 'high', 'critical', null], default: null },
    aiIsEmergency: { type: Boolean, default: false, index: true },
    aiConfidence: { type: Number, default: null, min: 0, max: 1 },
    aiMetadataId: { type: String, default: null },

    // Alert reference
    alertId: { type: Schema.Types.ObjectId, ref: 'Alert', default: null, index: true },
  },
  { timestamps: true }
);

FeedPostSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
FeedPostSchema.index({ type: 1, status: 1, createdAt: -1 });
FeedPostSchema.index({ aiCategory: 1, status: 1 });
FeedPostSchema.index({ aiIsEmergency: 1, status: 1 });
FeedPostSchema.index({ message: 'text', from: 'text', to: 'text' });
FeedPostSchema.index({ location: '2dsphere' });
FeedPostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

FeedPostSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret: any) => {
    delete ret.votedBy;
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const FeedPost: Model<IFeedPost> =
  mongoose.models.FeedPost || mongoose.model<IFeedPost>('FeedPost', FeedPostSchema);
