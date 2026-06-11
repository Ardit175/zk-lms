import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

function required(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (nodeEnv === 'production') {
    throw new Error(`Missing required environment variable ${name} in production`);
  }
  console.warn(`[config] ${name} not set — using insecure development fallback`);
  return devFallback;
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv,

  databaseUrl: required('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/zklms'),

  jwtSecret: required('JWT_SECRET', 'dev-secret-change-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Trailing slashes are stripped so `${aiServiceUrl}/api/...` never produces
  // a "//api/..." path, which FastAPI/Starlette serves as 404.
  aiServiceUrl: (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, ''),

  // Shared secret sent as `X-Internal-Token` on every call to the AI service.
  // When empty (local dev), no header is sent and the AI service does not
  // enforce one — so this stays opt-in until configured on both services.
  aiServiceToken: process.env.AI_SERVICE_TOKEN || '',

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
} as const;
