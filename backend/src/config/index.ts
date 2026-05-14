import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/zklms',

  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
} as const;
