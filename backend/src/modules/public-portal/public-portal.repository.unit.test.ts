import { describe, it, expect, jest } from '@jest/globals';
import { PublicPortalRepository } from './public-portal.repository';
import prisma from '@/config/db';

jest.mock('@/config/db', () => ({
  __esModule: true,
  default: { property: { findMany: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]), count: jest.fn<() => Promise<number>>().mockResolvedValue(0) } },
}));

describe('Public listing bedroom filters', () => {
  it('treats the advertised 3+ bedrooms option as a minimum while retaining publication scope', async () => {
    await new PublicPortalRepository().findPublishedProperties('agency-id', { bedrooms: 3 } as any);
    expect(prisma.property.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ agencyId: 'agency-id', isPublished: true, deletedAt: null, bedrooms: { gte: 3 } }),
    }));
  });
});
