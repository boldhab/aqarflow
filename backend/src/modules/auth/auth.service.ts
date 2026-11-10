import { authRepository, AuthRepository } from './auth.repository';
import { LoginInput, RegisterInput } from './auth.schema';
import { AuthResponse } from './auth.types';
import { comparePassword, hashPassword, signToken } from '@/shared/utils';
import { ApiError } from '@/shared/errors';

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
      },
      tokens: { accessToken: token },
    };
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.repo.findUserByEmail(input.email);
    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    const existingAgency = await this.repo.findAgencyBySlug(input.agencySlug);
    if (existingAgency) {
      throw ApiError.conflict('Agency slug is already in use');
    }

    const hashedPassword = await hashPassword(input.password);
    const { user } = await this.repo.createAgencyWithAdmin(input, hashedPassword);

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
      },
      tokens: { accessToken: token },
    };
  }
}

export const authService = new AuthService();
