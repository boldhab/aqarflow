import prisma from '@/config/db';
import { RegisterInput } from './auth.schema';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { agency: true },
    });
  }

  async findAgencyBySlug(slug: string) {
    return prisma.agency.findUnique({
      where: { slug },
    });
  }

  async createAgencyWithAdmin(data: RegisterInput, hashedPassword: string) {
    return prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: data.agencyName,
          slug: data.agencySlug,
        },
      });

      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 'ADMIN',
          agencyId: agency.id,
        },
      });

      return { user, agency };
    });
  }
}

export const authRepository = new AuthRepository();
