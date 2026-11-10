import { Request } from 'express';
import { Role } from '../permissions';
import { ApiError } from '../errors/ApiError';

export interface RequestUser {
  id: string;
  userId: string;
  agencyId: string;
  role: Role;
}

export type AuthUserPayload = RequestUser;

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export type AuthenticatedRequest = Request;

/**
 * Tenant scoping helper: returns { agencyId } from the authenticated request's token.
 * All repository and business queries MUST use this agencyId filter to maintain strict multi-tenant isolation.
 */
export function scopeToAgency(req: Request): { agencyId: string } {
  if (!req.user?.agencyId) {
    throw ApiError.unauthorized('Authentication required for tenant context');
  }
  return { agencyId: req.user.agencyId };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
