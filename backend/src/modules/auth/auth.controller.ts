import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { RefreshToken } from '../../models/RefreshToken';
import { EmailVerificationToken } from '../../models/EmailVerificationToken';
import { signAccess, signRefresh, verifyRefresh } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { registerSchema, loginSchema } from './auth.schema';
import { sendVerificationEmail } from '../../services/mail';
import { auditLog } from '../../utils/auditLogger';

function issueTokens(userId: string, email: string, role: 'user' | 'admin' | 'police' | 'rab') {
  const tokenId = randomUUID();
  const family = randomUUID();
  const accessToken = signAccess({ sub: userId, email, role, type: 'access' });
  const refreshToken = signRefresh({ sub: userId, tokenId, type: 'refresh' });
  return { accessToken, refreshToken, tokenId, family };
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, displayName } = registerSchema.parse(req.body);

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }

    const user = new User({ email, passwordHash: password, displayName });
    await user.save();

    const { accessToken, refreshToken, tokenId, family } = issueTokens(
      String(user._id),
      user.email,
      user.role
    );

    await RefreshToken.create({
      tokenId,
      userId: user._id,
      family,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email, isDeleted: false }).select('+passwordHash +loginAttempts +lockUntil');
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Account temporarily locked. Try again later.');
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const { accessToken, refreshToken, tokenId, family } = issueTokens(
      String(user._id),
      user.email,
      user.role
    );

    await RefreshToken.create({
      tokenId,
      userId: user._id,
      family,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.body?.refreshToken as string;
    if (!token) throw new AppError(400, 'MISSING_TOKEN', 'Refresh token is required');

    let payload;
    try {
      payload = verifyRefresh(token);
    } catch {
      throw new AppError(401, 'TOKEN_INVALID', 'Invalid or expired refresh token');
    }

    const stored = await RefreshToken.findOne({ tokenId: payload.tokenId });
    if (!stored || stored.isRevoked) {
      // Possible token theft — revoke entire family
      if (stored) await RefreshToken.updateMany({ family: stored.family }, { isRevoked: true });
      throw new AppError(401, 'TOKEN_REUSED', 'Refresh token already used');
    }

    stored.isRevoked = true;
    await stored.save();

    const user = await User.findById(payload.sub);
    if (!user || user.isDeleted) throw new AppError(401, 'USER_NOT_FOUND', 'User not found');

    const { accessToken, refreshToken: newRefresh, tokenId, family } = issueTokens(
      String(user._id),
      user.email,
      user.role
    );

    await RefreshToken.create({
      tokenId,
      userId: user._id,
      family: stored.family,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.body?.refreshToken as string;
    if (token) {
      try {
        const payload = verifyRefresh(token);
        await RefreshToken.updateOne({ tokenId: payload.tokenId }, { isRevoked: true });
      } catch {
        // ignore invalid token on logout
      }
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    const user = await User.findById(req.user._id);
    if (!user || user.isDeleted) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        trustScore: user.trustScore,
        totalReports: user.totalReports,
        verifiedReports: user.verifiedReports,
        isPhoneVerified: user.isPhoneVerified,
        isOfficiallyVerified: user.isOfficiallyVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body as { token?: string };
    if (!token) throw new AppError(400, 'MISSING_TOKEN', 'Verification token is required');

    const userId = await (EmailVerificationToken as any).verifyToken(token);
    if (!userId) {
      throw new AppError(400, 'TOKEN_INVALID', 'Invalid or expired verification token');
    }

    await User.findByIdAndUpdate(userId, { isEmailVerified: true });
    await auditLog({ action: 'email_verified', req, actorId: String(userId) });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user ? await User.findById(req.user._id) : null;
    if (!user) {
      res.json({ success: true, message: 'If that email is registered, a verification link has been sent.' });
      return;
    }

    if (user.isEmailVerified) {
      throw new AppError(400, 'ALREADY_VERIFIED', 'Email is already verified');
    }

    const rawToken = await (EmailVerificationToken as any).createToken(user._id);
    await sendVerificationEmail(user.email, rawToken, user.displayName);

    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
}
