import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:1234@localhost:5432/aqarflow?schema=public&host=/tmp',
  JWT_SECRET: process.env.JWT_SECRET || 'aqarflow_development_jwt_secret_key_12345',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  COOKIE_SAMESITE: ((process.env.COOKIE_SAMESITE?.toLowerCase() as 'lax' | 'strict' | 'none') || (process.env.NODE_ENV === 'production' ? 'none' : 'lax')),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  DEFAULT_AGENCY_SLUG: process.env.DEFAULT_AGENCY_SLUG || 'demo-agency',
};

if (env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Production requires JWT_SECRET with at least 32 characters');
}
