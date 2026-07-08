import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  tokenId: string;
  userId: mongoose.Types.ObjectId;
  family: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
