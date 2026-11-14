import { transaction, audit } from '@/modules/operations/transaction';
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
    return transaction(async tx => {
      const current = await tx.user.findFirstOrThrow({where:{id,agencyId}});
      if(current.role === 'ADMIN' && current.isActive && (input.isActive === false || input.role === 'AGENT')) {
        if(await tx.user.count({where:{agencyId,role:'ADMIN',isActive:true}}) <= 1) throw ApiError.conflict('The agency must retain an active administrator');
      }
      const next = await tx.user.update({where:{id},data:input,select:{id:true,agencyId:true,name:true,email:true,role:true,phone:true,isActive:true,createdAt:true,updatedAt:true}});
      await audit(tx,agencyId,undefined,'USER_UPDATED','User',id,current,next);
      return next;
    });
  }
}

export const usersService = new UsersService();
