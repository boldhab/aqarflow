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
        isActive: true,
        _count:{select:{assignedProperties:{where:{deletedAt:null,status:"AVAILABLE"}}}},
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

  async findAllByAgency(agencyId: string, role?: string) {
    if (role === 'AGENT') {
      return prisma.user.findMany({
        where: { agencyId, role: 'AGENT', isActive: true },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      });
    }

    return prisma.user.findMany({
      where: { agencyId },
      select: {
        id: true,
        agencyId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        _count:{select:{assignedProperties:{where:{deletedAt:null,status:"AVAILABLE"}}}},
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
        isActive: true,
        _count:{select:{assignedProperties:{where:{deletedAt:null,status:"AVAILABLE"}}}},
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
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
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
        isActive: true,
        _count:{select:{assignedProperties:{where:{deletedAt:null,status:"AVAILABLE"}}}},
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export const usersRepository = new UsersRepository();
