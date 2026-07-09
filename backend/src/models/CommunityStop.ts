import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityStop extends Document {
  name: string;
  area: string;
  lat: number | null;
  lng: number | null;
  authorId: mongoose.Types.ObjectId | null;
  deviceId: string | null;
  votes: { agree: number; disagree: number };
  voters: Array<{ userId: mongoose.Types.ObjectId | null; deviceId: string | null; value: 'agree' | 'disagree' }>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const CommunityStopSchema = new Schema<ICommunityStop>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    area: { type: String, default: '', trim: true, maxlength: 120 },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
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

CommunityStopSchema.index({ name: 1, area: 1 });
CommunityStopSchema.index({ status: 1, createdAt: -1 });

CommunityStopSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret: any) => {
    delete ret.voters;
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const CommunityStop: Model<ICommunityStop> =
  mongoose.models.CommunityStop || mongoose.model<ICommunityStop>('CommunityStop', CommunityStopSchema);
