import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { Role } from '../permissions';

export interface TokenPayload {
  userId: string;
  agencyId: string;
  role: Role;
}

export const signToken = (
  payload: TokenPayload,
  expiresIn: string = env.JWT_EXPIRES_IN
): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
  } as SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const parseDurationToMs = (duration: string): number => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    // Default fallback: 8 hours in ms
    return 8 * 60 * 60 * 1000;
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 8 * 60 * 60 * 1000;
  }
};
