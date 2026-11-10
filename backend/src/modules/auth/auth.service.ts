import { authRepository, AuthRepository } from './auth.repository';
import { LoginInput, RegisterInput } from './auth.schema';
import { AuthUserDTO } from './auth.types';
import { comparePassword, hashPassword, signToken } from '@/shared/utils';
import { ApiError } from '@/shared/errors';

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  async login(input: LoginInput): Promise<{ user: AuthUserDTO; token: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.repo.findUserByEmail(normalizedEmail);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = signToken({
      userId: user.id,
      agencyId: user.agencyId,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agency: {
          id: user.agency.id,
          name: user.agency.name,
          slug: user.agency.slug,
        },
      },
      token,
    };
  }

  async getMe(userId: string): Promise<AuthUserDTO> {
    const user = await this.repo.findUserById(userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      agency: {
        id: user.agency.id,
        name: user.agency.name,
        slug: user.agency.slug,
      },
    };
  }

  async register(input: RegisterInput): Promise<{ user: AuthUserDTO; token: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = await this.repo.findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    const existingAgency = await this.repo.findAgencyBySlug(input.agencySlug);
    if (existingAgency) {
      throw ApiError.conflict('Agency slug is already in use');
    }

    const hashedPassword = await hashPassword(input.password);
    const { user, agency } = await this.repo.createAgencyWithAdmin(
      {
        ...input,
        email: normalizedEmail,
      },
      hashedPassword
    );

    const token = signToken({
      userId: user.id,
      agencyId: user.agencyId,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agency: {
          id: agency.id,
          name: agency.name,
          slug: agency.slug,
        },
      },
      token,
    };
  }
}

export const authService = new AuthService();
