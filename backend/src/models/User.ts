import bcrypt from 'bcryptjs';
import mongoose, { Schema, Document } from 'mongoose';
import { env } from '../config/env';

export type UserRole = 'user' | 'admin' | 'police' | 'rab';
export type JurisdictionType = 'division' | 'district' | 'thana';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  googleId?: string;
  isDeleted: boolean;
  isEmailVerified: boolean;
  loginAttempts: number;
  lockUntil?: Date | null;

  // Trust & reporting
  trustScore: number;
  totalReports: number;
  verifiedReports: number;
  falseReports: number;

  // Phone verification
  phone?: string;
  isPhoneVerified: boolean;

  // Official verification (police/RAB)
  officialId?: string;
  officialEmail?: string;
  isOfficiallyVerified: boolean;

  // Jurisdiction (for police/RAB)
  jurisdictionType?: JurisdictionType;
  jurisdictionValue?: string;
  jurisdictionLocation?: { type: 'Point'; coordinates: [number, number] };

  // Last known location (for SOS proximity notifications)
  lastKnownLocation?: { type: 'Point'; coordinates: [number, number] };
  lastLocationUpdatedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
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

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    passwordHash: {
      type: String,
      required: function (this: IUser) { return !this.googleId; },
      select: false,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, enum: ['user', 'admin', 'police', 'rab'], default: 'user', required: true },
    avatarUrl: { type: String, maxlength: 500 },
    googleId: { type: String, index: true, sparse: true },
    isDeleted: { type: Boolean, default: false, select: false },
    isEmailVerified: { type: Boolean, default: false },
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },

    // Trust & reporting
    trustScore: { type: Number, default: 0.50, min: 0, max: 1 },
    totalReports: { type: Number, default: 0, min: 0 },
    verifiedReports: { type: Number, default: 0, min: 0 },
    falseReports: { type: Number, default: 0, min: 0 },

    // Phone verification (sparse index declared once below)
    phone: { type: String, default: null },
    isPhoneVerified: { type: Boolean, default: false },

    // Official verification
    officialId: { type: String, default: null },
    officialEmail: { type: String, default: null },
    isOfficiallyVerified: { type: Boolean, default: false },

    // Jurisdiction
    jurisdictionType: { type: String, enum: ['division', 'district', 'thana', null], default: null },
    jurisdictionValue: { type: String, default: null },
    jurisdictionLocation: { type: PointSchema, default: null },

    // Last known location (for SOS proximity)
    lastKnownLocation: { type: PointSchema, default: null },
    lastLocationUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ trustScore: -1 });
UserSchema.index({ role: 1 });
UserSchema.index({ jurisdictionLocation: '2dsphere' });
UserSchema.index({ lastKnownLocation: '2dsphere' });
UserSchema.index({ phone: 1 }, { sparse: true });

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

UserSchema.methods.getEffectiveTrustScore = function (): number {
  return Math.min(1, Math.max(0, this.trustScore));
};

export const User = mongoose.model<IUser>('User', UserSchema);
