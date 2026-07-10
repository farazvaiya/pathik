import { z } from 'zod';
import zxcvbn from 'zxcvbn';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128, 'Password too long')
    .refine((p) => /[A-Z]/.test(p), 'Password must contain an uppercase letter')
    .refine((p) => /[a-z]/.test(p), 'Password must contain a lowercase letter')
    .refine((p) => /[0-9]/.test(p), 'Password must contain a number')
    .refine((p) => /[^A-Za-z0-9]/.test(p), 'Password must contain a special character')
    .refine((p) => zxcvbn(p).score >= 2, 'Password is too weak — try a longer or more unique password'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(80, 'Display name too long').trim(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
