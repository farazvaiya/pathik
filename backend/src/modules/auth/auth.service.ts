import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { RefreshToken } from '../../models/RefreshToken';
import { signAccess, signRefresh } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';

export async function issueTokenPair(
  userId: string,
  email: string,
  role: 'user' | 'admin',
  family?: string
) {
  const tokenId = randomUUID();
  const tokenFamily = family || randomUUID();
  const accessToken = signAccess({ sub: userId, email, role, type: 'access' });
  const refreshToken = signRefresh({ sub: userId, tokenId, type: 'refresh' });

  await RefreshToken.create({
    tokenId,
    userId: new mongoose.Types.ObjectId(userId),
    family: tokenFamily,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken, tokenId, family: tokenFamily };
}

export async function revokeAllForUser(userId: string): Promise<void> {
  await RefreshToken.updateMany({ userId: new mongoose.Types.ObjectId(userId) }, { isRevoked: true });
}

export async function revokeTokenId(tokenId: string): Promise<void> {
  await RefreshToken.updateOne({ tokenId }, { isRevoked: true });
}

export function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
}
