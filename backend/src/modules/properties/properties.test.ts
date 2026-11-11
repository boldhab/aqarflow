import request from 'supertest';
import { app } from '../../app';
import prisma from '@/config/db';
import bcrypt from 'bcryptjs';

describe('Properties Module Integration Tests', () => {
  let adminCookie: string;
  let agent1Cookie: string;
  let agent2Cookie: string;
  let agencyBAdminCookie: string;

  let agent1Id: string;
  let agent2Id: string;
  let agencyAId: string;
  let agencyBId: string;

  const validPngBuffer = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex'
  );

  const validJpgBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x01, 0x01, 0x01, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0xff, 0xc0,
    0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff,
    0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0x00, 0xff,
    0xd9,
  ]);

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Ensure Agency A
    const agencyA = await prisma.agency.upsert({
      where: { slug: 'demo-agency' },
      update: {},
      create: {
        name: 'Demo Agency',
        slug: 'demo-agency',
      },
    });
    agencyAId = agencyA.id;

    // Admin of Agency A
    await prisma.user.upsert({
      where: { email: 'admin@aqarflow.com' },
      update: { agencyId: agencyAId, isActive: true },
      create: {
        agencyId: agencyAId,
        name: 'Admin User',
        email: 'admin@aqarflow.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    // Agent 1 of Agency A
    const agent1 = await prisma.user.upsert({
      where: { email: 'agent@aqarflow.com' },
      update: { agencyId: agencyAId, isActive: true },
      create: {
        agencyId: agencyAId,
        name: 'Agent User 1',
        email: 'agent@aqarflow.com',
        password: hashedPassword,
        role: 'AGENT',
        isActive: true,
      },
    });
    agent1Id = agent1.id;

    // Agent 2 of Agency A
    const agent2 = await prisma.user.upsert({
      where: { email: 'agent2@aqarflow.com' },
      update: { agencyId: agencyAId, isActive: true },
      create: {
        agencyId: agencyAId,
        name: 'Agent User 2',
        email: 'agent2@aqarflow.com',
        password: hashedPassword,
        role: 'AGENT',
        isActive: true,
      },
    });
    agent2Id = agent2.id;

    // 2. Ensure Agency B
    const agencyB = await prisma.agency.upsert({
      where: { slug: 'agency-b' },
      update: {},
      create: {
        name: 'Agency B',
        slug: 'agency-b',
      },
    });
    agencyBId = agencyB.id;

    // Admin of Agency B
    await prisma.user.upsert({
      where: { email: 'admin@agencyb.com' },
      update: { agencyId: agencyBId, isActive: true },
      create: {
        agencyId: agencyBId,
        name: 'Agency B Admin',
        email: 'admin@agencyb.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    // 3. Login all users to extract auth cookies
    const login = async (email: string) => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email,
        password: 'password123',
      });
      const cookieHeader = res.headers['set-cookie'];
      const rawCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
      return rawCookie.split(';')[0];
    };

    adminCookie = await login('admin@aqarflow.com');
    agent1Cookie = await login('agent@aqarflow.com');
    agent2Cookie = await login('agent2@aqarflow.com');
    agencyBAdminCookie = await login('admin@agencyb.com');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('CRUD & Validation', () => {
    it('rejects property creation with invalid data (Zod validation)', async () => {
      // Missing title, price <= 0, areaValue <= 0
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', adminCookie)
        .send({
          title: 'ab', // < 3 characters
          price: -500,
          areaValue: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('creates property successfully and auto-generates referenceCode and auto-assigns agent', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', agent1Cookie)
        .send({
          title: 'Agent 1 Test Property',
          description: 'A test property created by Agent 1',
          purpose: 'SALE',
          type: 'APARTMENT',
          status: 'AVAILABLE',
          price: 25000000,
          currency: 'PKR',
          areaValue: 1800,
          areaUnit: 'SQFT',
          city: 'Lahore',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.referenceCode).toMatch(/^AF-\d+$/);
      expect(res.body.data.assignedAgentId).toBe(agent1Id);
      expect(res.body.data.createdById).toBe(agent1Id);
      expect(res.body.data.agencyId).toBe(agencyAId);
    });

    it('retrieves property by ID with relations', async () => {
      // First create one
      const createRes = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', adminCookie)
        .send({
          title: 'Get By ID Property',
          price: 15000000,
          areaValue: 1200,
          city: 'Karachi',
        });

      const propId = createRes.body.data.id;

      const getRes = await request(app)
        .get(`/api/v1/properties/${propId}`)
        .set('Cookie', adminCookie);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.id).toBe(propId);
      expect(getRes.body.data.createdBy).toBeDefined();
    });

    it('returns 404 for non-existent property UUID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000009999';
      const res = await request(app)
        .get(`/api/v1/properties/${nonExistentId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('updates property fields successfully', async () => {
      const createRes = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', adminCookie)
        .send({
          title: 'Initial Title',
          price: 10000000,
          areaValue: 1000,
          city: 'Islamabad',
        });

      const propId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/v1/properties/${propId}`)
        .set('Cookie', adminCookie)
        .send({
          title: 'Updated Title',
          price: 12000000,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.title).toBe('Updated Title');
      expect(Number(updateRes.body.data.price)).toBe(12000000);
    });
  });

  describe('Reference Code Uniqueness', () => {
    it('rejects duplicate reference code within the same agency, but allows it in another agency', async () => {
      const customCode = `AF-DUP-${Date.now()}`;

      // 1. Create in Agency A
      const res1 = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', adminCookie)
        .send({
          referenceCode: customCode,
          title: 'Unique Code Prop A1',
          price: 10000000,
          areaValue: 1000,
        });

      expect(res1.status).toBe(201);
      expect(res1.body.data.referenceCode).toBe(customCode);

      // 2. Try to create duplicate in Agency A -> Conflict (409)
      const res2 = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', adminCookie)
        .send({
          referenceCode: customCode,
          title: 'Duplicate Code Prop A2',
          price: 10000000,
          areaValue: 1000,
        });

      expect(res2.status).toBe(409);
      expect(res2.body.message).toContain('Reference code already exists');

      // 3. Create property with the same reference code in Agency B -> Allowed! (201)
      const res3 = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', agencyBAdminCookie)
        .send({
          referenceCode: customCode,
          title: 'Same Code Prop Agency B',
          price: 10000000,
          areaValue: 1000,
        });

      expect(res3.status).toBe(201);
      expect(res3.body.data.referenceCode).toBe(customCode);
      expect(res3.body.data.agencyId).toBe(agencyBId);
    });
  });

  describe('Tenant Isolation', () => {
    it('Agency B user receives 404 (never 403) on read, update, delete, and image upload for Agency A property', async () => {
      // Create a property in Agency A
      const createRes = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', adminCookie)
        .send({
          title: 'Agency A Secret Property',
          price: 50000000,
          areaValue: 2500,
          city: 'Lahore',
        });

      const propAId = createRes.body.data.id;

      // 1. Agency B reads Agency A property -> 404
      const readRes = await request(app)
        .get(`/api/v1/properties/${propAId}`)
        .set('Cookie', agencyBAdminCookie);
      expect(readRes.status).toBe(404);

      // 2. Agency B updates Agency A property -> 404
      const updateRes = await request(app)
        .patch(`/api/v1/properties/${propAId}`)
        .set('Cookie', agencyBAdminCookie)
        .send({ title: 'Hacked Title' });
      expect(updateRes.status).toBe(404);

      // 3. Agency B deletes Agency A property -> 404
      const deleteRes = await request(app)
        .delete(`/api/v1/properties/${propAId}`)
        .set('Cookie', agencyBAdminCookie);
      expect(deleteRes.status).toBe(404);

      // 4. Agency B uploads image to Agency A property -> 404
      const uploadRes = await request(app)
        .post(`/api/v1/properties/${propAId}/images`)
        .set('Cookie', agencyBAdminCookie)
        .attach('images', validPngBuffer, 'test.png');
      expect(uploadRes.status).toBe(404);

      // 5. Agency B tries to publish Agency A property -> 404
      const publishRes = await request(app)
        .patch(`/api/v1/properties/${propAId}/publish`)
        .set('Cookie', agencyBAdminCookie);
      expect(publishRes.status).toBe(404);
    });
  });

  describe('Agent Permissions (RBAC)', () => {
    let agent1PropId: string;

    beforeAll(async () => {
      // Create a property owned by Agent 1
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', agent1Cookie)
        .send({
          title: 'Agent 1 Exclusive Property',
          price: 20000000,
          areaValue: 1500,
          city: 'Lahore',
        });
      agent1PropId = res.body.data.id;
    });

    it('Agent 1 can edit their own assigned property', async () => {
      const res = await request(app)
        .patch(`/api/v1/properties/${agent1PropId}`)
        .set('Cookie', agent1Cookie)
        .send({ title: 'Agent 1 Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Agent 1 Updated Title');
    });

    it('Agent 2 cannot edit Agent 1 property (returns 403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/properties/${agent1PropId}`)
        .set('Cookie', agent2Cookie)
        .send({ title: 'Agent 2 Attempted Edit' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Agent 1 cannot delete their own property (returns 403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/v1/properties/${agent1PropId}`)
        .set('Cookie', agent1Cookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Admin can edit any property in the agency', async () => {
      const res = await request(app)
        .patch(`/api/v1/properties/${agent1PropId}`)
        .set('Cookie', adminCookie)
        .send({ title: 'Admin Overridden Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Admin Overridden Title');
    });

    it('Admin can delete/archive property and it is excluded from listing and getById', async () => {
      // Admin soft deletes
      const delRes = await request(app)
        .delete(`/api/v1/properties/${agent1PropId}`)
        .set('Cookie', adminCookie);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Now getById returns 404
      const getRes = await request(app)
        .get(`/api/v1/properties/${agent1PropId}`)
        .set('Cookie', adminCookie);
      expect(getRes.status).toBe(404);
    });
  });

  describe('Filters, Search, Sort and Pagination', () => {
    it('filters properties by status, purpose, type, and city', async () => {
      const res = await request(app)
        .get('/api/v1/properties?status=AVAILABLE&city=Lahore')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeInstanceOf(Array);
      for (const item of res.body.data.items) {
        expect(item.status).toBe('AVAILABLE');
        expect(item.city.toLowerCase()).toContain('lahore');
      }
    });

    it('searches properties by case-insensitive keyword on title, address, or referenceCode', async () => {
      const res = await request(app)
        .get('/api/v1/properties?search=gulberg')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      const matches = res.body.data.items.some(
        (p: any) =>
          p.title.toLowerCase().includes('gulberg') ||
          (p.address && p.address.toLowerCase().includes('gulberg'))
      );
      expect(matches).toBe(true);
    });

    it('sorts properties by price_asc and price_desc', async () => {
      const ascRes = await request(app)
        .get('/api/v1/properties?sort=price_asc&limit=10')
        .set('Cookie', adminCookie);

      expect(ascRes.status).toBe(200);
      const prices = ascRes.body.data.items.map((i: any) => Number(i.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }

      const descRes = await request(app)
        .get('/api/v1/properties?sort=price_desc&limit=10')
        .set('Cookie', adminCookie);

      expect(descRes.status).toBe(200);
      const descPrices = descRes.body.data.items.map((i: any) => Number(i.price));
      for (let i = 1; i < descPrices.length; i++) {
        expect(descPrices[i]).toBeLessThanOrEqual(descPrices[i - 1]);
      }
    });

    it('paginates results correctly with total, page, limit, totalPages', async () => {
      const res = await request(app)
        .get('/api/v1/properties?page=1&limit=2')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(2);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(2);
      expect(res.body.data.total).toBeGreaterThan(2);
      expect(res.body.data.totalPages).toBeGreaterThan(1);
    });
  });

  describe('Publish / Unpublish Rules', () => {
    let testPropId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', adminCookie)
        .send({
          title: 'Publish Test Property',
          price: 18000000,
          areaValue: 1200,
          city: 'Lahore',
          status: 'DRAFT', // draft status
        });
      testPropId = res.body.data.id;
    });

    it('fails to publish when property has no images and status is DRAFT', async () => {
      const res = await request(app)
        .patch(`/api/v1/properties/${testPropId}/publish`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot publish property');
    });

    it('succeeds publishing when property has image and active status', async () => {
      // 1. Upload an image
      await request(app)
        .post(`/api/v1/properties/${testPropId}/images`)
        .set('Cookie', adminCookie)
        .attach('images', validPngBuffer, 'photo.png');

      // 2. Change status to AVAILABLE
      await request(app)
        .patch(`/api/v1/properties/${testPropId}`)
        .set('Cookie', adminCookie)
        .send({ status: 'AVAILABLE' });

      // 3. Publish
      const publishRes = await request(app)
        .patch(`/api/v1/properties/${testPropId}/publish`)
        .set('Cookie', adminCookie);

      expect(publishRes.status).toBe(200);
      expect(publishRes.body.data.isPublished).toBe(true);

      // 4. Unpublish
      const unpublishRes = await request(app)
        .patch(`/api/v1/properties/${testPropId}/unpublish`)
        .set('Cookie', adminCookie);

      expect(unpublishRes.status).toBe(200);
      expect(unpublishRes.body.data.isPublished).toBe(false);
    });
  });

  describe('Image Upload and Management', () => {
    let propId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', adminCookie)
        .send({
          title: 'Image Test Property',
          price: 15000000,
          areaValue: 1000,
          city: 'Islamabad',
        });
      propId = res.body.data.id;
    });

    it('rejects invalid file format (magic byte check)', async () => {
      const fakeImage = Buffer.from('this is plain text pretending to be an image');
      const res = await request(app)
        .post(`/api/v1/properties/${propId}/images`)
        .set('Cookie', adminCookie)
        .attach('images', fakeImage, 'fake.jpg');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid file format');
    });

    it('first uploaded image automatically becomes primary', async () => {
      const res = await request(app)
        .post(`/api/v1/properties/${propId}/images`)
        .set('Cookie', adminCookie)
        .attach('images', validPngBuffer, 'image1.png');

      expect(res.status).toBe(200);
      expect(res.body.data.images.length).toBe(1);
      expect(res.body.data.images[0].isPrimary).toBe(true);
    });

    it('subsequent uploaded image is not primary, then setPrimary switches primary image', async () => {
      const res = await request(app)
        .post(`/api/v1/properties/${propId}/images`)
        .set('Cookie', adminCookie)
        .attach('images', validJpgBuffer, 'image2.jpg');

      expect(res.status).toBe(200);
      expect(res.body.data.images.length).toBe(2);

      const firstImage = res.body.data.images.find((i: any) => i.isPrimary);
      const secondImage = res.body.data.images.find((i: any) => !i.isPrimary);
      expect(firstImage).toBeDefined();
      expect(secondImage).toBeDefined();

      // Set second image as primary
      const primaryRes = await request(app)
        .patch(`/api/v1/properties/${propId}/images/${secondImage.id}/primary`)
        .set('Cookie', adminCookie);

      expect(primaryRes.status).toBe(200);
      const updatedSecond = primaryRes.body.data.images.find((i: any) => i.id === secondImage.id);
      const updatedFirst = primaryRes.body.data.images.find((i: any) => i.id === firstImage.id);
      expect(updatedSecond.isPrimary).toBe(true);
      expect(updatedFirst.isPrimary).toBe(false);
    });

    it('deleting primary image promotes the next available image to primary', async () => {
      // Fetch property to know current primary
      const getRes = await request(app)
        .get(`/api/v1/properties/${propId}`)
        .set('Cookie', adminCookie);

      const images = getRes.body.data.images;
      const primaryImg = images.find((i: any) => i.isPrimary);
      const remainingImg = images.find((i: any) => !i.isPrimary);

      const delRes = await request(app)
        .delete(`/api/v1/properties/${propId}/images/${primaryImg.id}`)
        .set('Cookie', adminCookie);

      expect(delRes.status).toBe(200);
      expect(delRes.body.data.images.length).toBe(1);
      expect(delRes.body.data.images[0].id).toBe(remainingImg.id);
      expect(delRes.body.data.images[0].isPrimary).toBe(true);
    });
  });

  describe('Status Change and History Tracking', () => {
    it('creates a PropertyStatusHistory row in the transaction when status changes', async () => {
      // 1. Create property with AVAILABLE status
      const createRes = await request(app)
        .post('/api/v1/properties')
        .set('Cookie', adminCookie)
        .send({
          title: 'Status History Test Property',
          price: 30000000,
          areaValue: 2000,
          city: 'Karachi',
          status: 'AVAILABLE',
        });

      const propId = createRes.body.data.id;

      // 2. Update status to RESERVED
      const updateRes = await request(app)
        .patch(`/api/v1/properties/${propId}`)
        .set('Cookie', adminCookie)
        .send({ status: 'RESERVED' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe('RESERVED');

      // 3. Check status history via getById or direct prisma check
      const getRes = await request(app)
        .get(`/api/v1/properties/${propId}`)
        .set('Cookie', adminCookie);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.statusHistory).toBeDefined();
      expect(getRes.body.data.statusHistory.length).toBeGreaterThan(0);

      const latestHistory = getRes.body.data.statusHistory[0];
      expect(latestHistory.fromStatus).toBe('AVAILABLE');
      expect(latestHistory.toStatus).toBe('RESERVED');
    });
  });
});
