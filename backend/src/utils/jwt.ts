import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin' | 'police' | 'rab';
  type: 'access';
}

export interface RefreshPayload {
  sub: string;
  tokenId: string;
  type: 'refresh';
}

const accessOpts: SignOptions = { expiresIn: '15m' };
const refreshOpts: SignOptions = { expiresIn: '7d' };

export function signAccess(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOpts);
}

export function signRefresh(payload: RefreshPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshOpts);
}

export function verifyAccess(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefresh(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}
