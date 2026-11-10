import prisma from '@/config/db';
import { CreateUserInput, UpdateUserInput } from './users.schema';

export class UsersRepository {
  async findById(id: string, agencyId: string) {
    return prisma.user.findFirst({
      where: { id, agencyId },
      select: {
        id: true,
        agencyId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findAllByAgency(agencyId: string) {
    return prisma.user.findMany({
      where: { agencyId },
      select: {
        id: true,
        agencyId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(agencyId: string, data: CreateUserInput, hashedPassword: string) {
    return prisma.user.create({
      data: {
        agencyId,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        phone: data.phone,
      },
      select: {
        id: true,
        agencyId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, agencyId: string, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      },
      select: {
        id: true,
        agencyId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export const usersRepository = new UsersRepository();
