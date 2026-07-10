import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityRoute extends Document {
  from: string;
  to: string;
  fromDisplay: string;
  toDisplay: string;
  busName: string;
  fare: number | null;
  stops: string[];
  authorId: mongoose.Types.ObjectId | null;
  deviceId: string | null;
  votes: { agree: number; disagree: number };
  voters: Array<{ userId: mongoose.Types.ObjectId | null; deviceId: string | null; value: 'agree' | 'disagree' }>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const CommunityRouteSchema = new Schema<ICommunityRoute>(
  {
    from: { type: String, required: true, lowercase: true, trim: true },
    to: { type: String, required: true, lowercase: true, trim: true },
    fromDisplay: { type: String, required: true, trim: true, maxlength: 120 },
    toDisplay: { type: String, required: true, trim: true, maxlength: 120 },
    busName: { type: String, default: '', trim: true, maxlength: 120 },
    fare: { type: Number, default: null, min: 0 },
    stops: { type: [String], default: [] },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deviceId: { type: String, default: null },
    votes: {
      agree: { type: Number, default: 0, min: 0 },
      disagree: { type: Number, default: 0, min: 0 },
    },
    voters: {
      type: [
        {
          _id: false,
          userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
          deviceId: { type: String, default: null },
          value: { type: String, enum: ['agree', 'disagree'], required: true },
        },
      ],
      default: [],
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);

CommunityRouteSchema.index({ from: 1, to: 1 });
CommunityRouteSchema.index({ status: 1, createdAt: -1 });

CommunityRouteSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret: any) => {
    delete ret.voters;
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const CommunityRoute: Model<ICommunityRoute> =
  mongoose.models.CommunityRoute || mongoose.model<ICommunityRoute>('CommunityRoute', CommunityRouteSchema);
