import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const rawEnv: Record<string, string | undefined> = {};
for (const [key, value] of Object.entries(process.env)) {
  rawEnv[key] = value === '' ? undefined : value;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/pathik'),
  JWT_ACCESS_SECRET: z.string().min(32).default('CHANGE_ME_32_CHAR_MIN_ACCESS_SECRET!!'),
  JWT_REFRESH_SECRET: z.string().min(32).default('CHANGE_ME_32_CHAR_MIN_REFRESH_SECRET!'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  PATHIK_AI_PROVIDER: z.enum(['groq', 'openrouter', 'nvidia']).default('groq'),
  GROQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  NVIDIA_API_KEY: z.string().optional(),
  PATHIK_AI_MODEL: z.string().optional(),
  PATHIK_AI_MODELS: z.string().optional(),
  PATHIK_PUBLIC_URL: z.string().optional(),
  PATHIK_ENABLE_ROUTE_WRITES: z.string().default('0'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ENCRYPTION_KEY: z.string().length(64).optional(),
  SENTRY_DSN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  BCRYPT_COST: z.coerce.number().int().min(8).max(15).optional(),
  AUTH_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
  AUTH_LOCK_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  ANONYMOUS_MODE: z.string().default('1'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  USE_HYBRID_SEARCH: z.string().default('false'),
});

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = {
  ...parsed.data,
  BCRYPT_ROUNDS: parsed.data.BCRYPT_COST ?? parsed.data.BCRYPT_ROUNDS,
};
