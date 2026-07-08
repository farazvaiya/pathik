import bcrypt from 'bcryptjs';
import mongoose, { Schema, Document } from 'mongoose';
import { env } from '../config/env';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  googleId?: string;
  isDeleted: boolean;
  loginAttempts: number;
  lockUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    passwordHash: {
      type: String,
      required: function (this: IUser) { return !this.googleId; },
      select: false,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    avatarUrl: { type: String, maxlength: 500 },
    googleId: { type: String, index: true, sparse: true },
    isDeleted: { type: Boolean, default: false, select: false },
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, env.BCRYPT_ROUNDS);
    return next();
  } catch (err) {
    return next(err as Error);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
