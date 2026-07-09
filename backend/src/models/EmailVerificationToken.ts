import crypto from 'crypto';
import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailVerificationToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

function sha256(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

EmailVerificationTokenSchema.statics.createToken = async function (userId: mongoose.Types.ObjectId) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await this.create({ userId, tokenHash, expiresAt });
  return rawToken;
};

EmailVerificationTokenSchema.statics.verifyToken = async function (rawToken: string) {
  const tokenHash = sha256(rawToken);
  const doc = await this.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
  if (!doc) return null;
  await doc.deleteOne();
  return doc.userId;
};

export const EmailVerificationToken = mongoose.model<IEmailVerificationToken>(
  'EmailVerificationToken',
  EmailVerificationTokenSchema
);
