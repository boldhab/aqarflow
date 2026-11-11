import { usersRepository, UsersRepository } from './users.repository';
import { CreateUserInput, UpdateUserInput } from './users.schema';
import { UserDTO, AgentOptionDTO } from './users.types';
import { hashPassword } from '@/shared/utils';
import { ApiError } from '@/shared/errors';

export class UsersService {
  constructor(private repo: UsersRepository = usersRepository) {}

  async getAgencyUsers(agencyId: string, role?: string): Promise<UserDTO[] | AgentOptionDTO[]> {
    return this.repo.findAllByAgency(agencyId, role);
  }

  async getUserById(id: string, agencyId: string): Promise<UserDTO> {
    const user = await this.repo.findById(id, agencyId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async createUser(agencyId: string, input: CreateUserInput): Promise<UserDTO> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('Email already in use');
    }
    const hashedPassword = await hashPassword(input.password);
    return this.repo.create(agencyId, input, hashedPassword);
  }

  async updateUser(id: string, agencyId: string, input: UpdateUserInput): Promise<UserDTO> {
    await this.getUserById(id, agencyId);
    return this.repo.update(id, agencyId, input);
  }
}

export const usersService = new UsersService();
