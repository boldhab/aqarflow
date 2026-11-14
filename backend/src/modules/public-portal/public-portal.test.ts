import request from 'supertest';
import { app } from '../../app';
import prisma from '@/config/db';
import bcrypt from 'bcryptjs';

const integration = process.env.RUN_OPERATIONS_INTEGRATION === '1' ? describe : describe.skip;

integration('Public Portal Module Integration Tests', () => {
  let demoAgencyId: string;
  let otherAgencyId: string;
  let demoAgentId: string;
  let publishedPropId: string;
  let draftPropId: string;
  let unpublishedPropId: string;
  let softDeletedPropId: string;
  let otherAgencyPropId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Demo agency
    const demoAgency = await prisma.agency.upsert({
      where: { slug: 'demo-agency' },
      update: {},
      create: {
        name: 'Demo Agency',
        slug: 'demo-agency',
        phone: '+92-42-35750000',
        email: 'contact@demoagency.com',
      },
    });
    demoAgencyId = demoAgency.id;

    // Demo Agent
    const demoAgent = await prisma.user.upsert({
      where: { email: 'public_portal_agent@aqarflow.com' },
      update: { agencyId: demoAgencyId, isActive: true },
      create: {
        agencyId: demoAgencyId,
        name: 'Portal Test Agent',
        email: 'public_portal_agent@aqarflow.com',
        phone: '+92-300-8889999',
        password: hashedPassword,
        role: 'AGENT',
        isActive: true,
      },
    });
    demoAgentId = demoAgent.id;

    // 2. Other agency
    const otherAgency = await prisma.agency.upsert({
      where: { slug: 'other-public-agency' },
      update: {},
      create: {
        name: 'Other Agency',
        slug: 'other-public-agency',
      },
    });
    otherAgencyId = otherAgency.id;

    // 3. Properties under Demo Agency
    // A. Published & Available
    const pubProp = await prisma.property.create({
      data: {
        agencyId: demoAgencyId,
        referenceCode: 'PUB-1001',
        title: 'Public Luxury Apartment In Gulberg',
        description: 'Prime central location with rooftop terrace',
        purpose: 'SALE',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        isPublished: true,
        price: 45000000,
        currency: 'PKR',
        areaValue: 2200,
        areaUnit: 'SQFT',
        bedrooms: 3,
        bathrooms: 3,
        city: 'Lahore',
        locality: 'Gulberg III',
        assignedAgentId: demoAgentId,
      },
    });
    publishedPropId = pubProp.id;

    await prisma.propertyImage.create({
      data: {
        agencyId: demoAgencyId,
        propertyId: publishedPropId,
        url: '/uploads/properties/prop-1-exterior.jpg',
        caption: 'Building exterior',
        isPrimary: true,
        sortOrder: 0,
      },
    });

    // B. Draft Property (isPublished: false, status: DRAFT)
    const draft = await prisma.property.create({
      data: {
        agencyId: demoAgencyId,
        referenceCode: 'PUB-1002',
        title: 'Draft Property Hidden',
        purpose: 'RENT',
        type: 'HOUSE',
        status: 'DRAFT',
        isPublished: false,
        price: 150000,
        currency: 'PKR',
        areaValue: 10,
        areaUnit: 'MARLA',
        city: 'Lahore',
      },
    });
    draftPropId = draft.id;

    // C. Unpublished Property (isPublished: false, status: AVAILABLE)
    const unpublished = await prisma.property.create({
      data: {
        agencyId: demoAgencyId,
        referenceCode: 'PUB-1003',
        title: 'Unpublished Available Property',
        purpose: 'SALE',
        type: 'VILLA',
        status: 'AVAILABLE',
        isPublished: false,
        price: 90000000,
        currency: 'PKR',
        areaValue: 1,
        areaUnit: 'KANAL',
        city: 'Islamabad',
      },
    });
    unpublishedPropId = unpublished.id;

    // D. Soft Deleted Property
    const softDel = await prisma.property.create({
      data: {
        agencyId: demoAgencyId,
        referenceCode: 'PUB-1004',
        title: 'Archived Soft Deleted Property',
        purpose: 'SALE',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        isPublished: false,
        deletedAt: new Date(),
        price: 30000000,
        currency: 'PKR',
        areaValue: 1500,
        areaUnit: 'SQFT',
        city: 'Karachi',
      },
    });
    softDeletedPropId = softDel.id;

    // E. Property belonging to Other Agency (published)
    const otherProp = await prisma.property.create({
      data: {
        agencyId: otherAgencyId,
        referenceCode: 'PUB-2001',
        title: 'Other Agency Property',
        purpose: 'SALE',
        type: 'OFFICE',
        status: 'AVAILABLE',
        isPublished: true,
        price: 20000000,
        currency: 'PKR',
        areaValue: 1200,
        areaUnit: 'SQFT',
        city: 'Karachi',
      },
    });
    otherAgencyPropId = otherProp.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.lead.deleteMany({
      where: {
        phone: { in: ['+923001234567', '03001234567', '03219876543', '+923219876543', '03005554444', '+923005554444'] },
      },
    });
    await prisma.propertyImage.deleteMany({
      where: { propertyId: { in: [publishedPropId, draftPropId, unpublishedPropId, softDeletedPropId, otherAgencyPropId] } },
    });
    await prisma.property.deleteMany({
      where: { id: { in: [publishedPropId, draftPropId, unpublishedPropId, softDeletedPropId, otherAgencyPropId] } },
    });
    await prisma.user.deleteMany({
      where: { email: 'public_portal_agent@aqarflow.com' },
    });
  });

  describe('GET /api/v1/public/properties', () => {
    it('should return published available properties for the default agency only', async () => {
      const res = await request(app).get('/api/v1/public/properties');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);

      const items = res.body.data.items;
      const ids = items.map((i: any) => i.id);

      // Published property of demo agency must be visible
      expect(ids).toContain(publishedPropId);

      // Draft, unpublished, soft-deleted, and other agency properties must NOT appear
      expect(ids).not.toContain(draftPropId);
      expect(ids).not.toContain(unpublishedPropId);
      expect(ids).not.toContain(softDeletedPropId);
      expect(ids).not.toContain(otherAgencyPropId);
    });

    it('should enforce explicit Public DTO whitelist and NEVER leak internal fields', async () => {
      const res = await request(app).get('/api/v1/public/properties');
      expect(res.status).toBe(200);

      const item = res.body.data.items.find((i: any) => i.id === publishedPropId);
      expect(item).toBeDefined();

      // Required public fields
      expect(item.id).toBe(publishedPropId);
      expect(item.title).toBe('Public Luxury Apartment In Gulberg');
      expect(item.referenceCode).toBe('PUB-1001');
      expect(item.purpose).toBe('SALE');
      expect(item.type).toBe('APARTMENT');
      expect(item.price).toBe(45000000);
      expect(item.currency).toBe('PKR');
      expect(item.primaryImage).toBeDefined();

      // Prohibited private/internal fields MUST be undefined
      expect(item.agencyId).toBeUndefined();
      expect(item.createdById).toBeUndefined();
      expect(item.assignedAgentId).toBeUndefined();
      expect(item.deletedAt).toBeUndefined();
      expect(item.notes).toBeUndefined();
      expect(item.statusHistory).toBeUndefined();
    });

    it('should support search, city, and price filters', async () => {
      const res = await request(app)
        .get('/api/v1/public/properties')
        .query({ city: 'Lahore', purpose: 'SALE', search: 'Gulberg' });

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      expect(items.some((i: any) => i.id === publishedPropId)).toBe(true);

      const filteredRes = await request(app)
        .get('/api/v1/public/properties')
        .query({ city: 'NonExistentCity' });
      expect(filteredRes.status).toBe(200);
      expect(filteredRes.body.data.items.length).toBe(0);
    });
  });

  describe('GET /api/v1/public/properties/:id', () => {
    it('should return property detail for a visible property', async () => {
      const res = await request(app).get(`/api/v1/public/properties/${publishedPropId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const prop = res.body.data;
      expect(prop.id).toBe(publishedPropId);
      expect(prop.title).toBe('Public Luxury Apartment In Gulberg');

      // Verify assignedAgent details only contain safe fields (name, phone)
      expect(prop.assignedAgent).toBeDefined();
      expect(prop.assignedAgent.name).toBe('Portal Test Agent');
      expect(prop.assignedAgent.phone).toBe('+92-300-8889999');
      expect(prop.assignedAgent.id).toBeUndefined();
      expect(prop.assignedAgent.email).toBeUndefined();
      expect(prop.assignedAgent.role).toBeUndefined();

      // Verify agency info
      expect(prop.agency).toBeDefined();
      expect(prop.agency.slug).toBe('demo-agency');

      // Internal fields check
      expect(prop.agencyId).toBeUndefined();
      expect(prop.createdById).toBeUndefined();
      expect(prop.assignedAgentId).toBeUndefined();
      expect(prop.deletedAt).toBeUndefined();
    });

    it('should return 404 for an unpublished or draft property', async () => {
      const draftRes = await request(app).get(`/api/v1/public/properties/${draftPropId}`);
      expect(draftRes.status).toBe(404);

      const unpubRes = await request(app).get(`/api/v1/public/properties/${unpublishedPropId}`);
      expect(unpubRes.status).toBe(404);
    });

    it('should return 404 for a soft-deleted property', async () => {
      const res = await request(app).get(`/api/v1/public/properties/${softDeletedPropId}`);
      expect(res.status).toBe(404);
    });

    it('should return 404 for a property from another agency', async () => {
      const res = await request(app).get(`/api/v1/public/properties/${otherAgencyPropId}`);
      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent UUID', async () => {
      const res = await request(app).get('/api/v1/public/properties/00000000-0000-0000-0000-000000009999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/public/filters', () => {
    it('should return distinct cities and types for visible properties', async () => {
      const res = await request(app).get('/api/v1/public/filters');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.cities)).toBe(true);
      expect(Array.isArray(res.body.data.types)).toBe(true);
      expect(res.body.data.cities).toContain('Lahore');
      expect(res.body.data.types).toContain('APARTMENT');
    });
  });

  describe('POST /api/v1/public/inquiries', () => {
    it('should create lead with auto-assigned agent and normalized phone', async () => {
      const res = await request(app)
        .post('/api/v1/public/inquiries')
        .send({
          name: '  Hassan Ali  ',
          phone: '0300 1234567',
          email: '  HASSAN.ALI@EXAMPLE.COM  ',
          message: '<p>Interested in buying this apartment</p>',
          propertyId: publishedPropId,
          preferredContact: 'WHATSAPP',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();

      const leadId = res.body.data.id;
      const createdLead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      expect(createdLead).toBeDefined();
      expect(createdLead?.agencyId).toBe(demoAgencyId);
      expect(createdLead?.propertyId).toBe(publishedPropId);
      expect(createdLead?.assignedAgentId).toBe(demoAgentId);
      expect(createdLead?.name).toBe('Hassan Ali'); // HTML and whitespace trimmed
      expect(createdLead?.phone).toBe('0300 1234567');
      expect(createdLead?.normalizedPhone).toBe('+923001234567');
      expect(createdLead?.email).toBe('hassan.ali@example.com'); // Lowercased
      expect(createdLead?.message).toBe('Interested in buying this apartment'); // HTML stripped
      expect(createdLead?.preferredContact).toBe('WHATSAPP');
      expect(createdLead?.source).toBe('WEBSITE');
      expect(createdLead?.stage).toBe('NEW');
    });

    it('should return 404 when inquiring about an unpublished property', async () => {
      const res = await request(app)
        .post('/api/v1/public/inquiries')
        .send({
          name: 'Buyer Person',
          phone: '0300 5554444',
          propertyId: unpublishedPropId,
        });

      expect(res.status).toBe(404);
    });

    it('should return 400 when given invalid Pakistani phone number', async () => {
      const res = await request(app)
        .post('/api/v1/public/inquiries')
        .send({
          name: 'Buyer Person',
          phone: '123456',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when given invalid email address', async () => {
      const res = await request(app)
        .post('/api/v1/public/inquiries')
        .send({
          name: 'Buyer Person',
          phone: '0300 1234567',
          email: 'not-an-email',
        });

      expect(res.status).toBe(400);
    });

    it('should silently bypass database save when honeypot is populated', async () => {
      const initialCount = await prisma.lead.count();

      const res = await request(app)
        .post('/api/v1/public/inquiries')
        .send({
          name: 'Spam Bot',
          phone: '0300 1234567',
          email: 'bot@spam.com',
          message: 'Buy cheap watches',
          hp_name: 'I am a spam bot', // Honeypot populated!
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();

      const finalCount = await prisma.lead.count();
      // Count must not increase because honeypot discarded the submission
      expect(finalCount).toBe(initialCount);
    });

    it('should rate limit submissions when TEST_RATE_LIMIT is enabled', async () => {
      process.env.TEST_RATE_LIMIT = 'true';

      try {
        const sendReq = () =>
          request(app)
            .post('/api/v1/public/inquiries')
            .send({
              name: 'Rate Limit Tester',
              phone: '0321 9876543',
            });

        // Send 5 requests (within limit of 5/15m)
        for (let i = 0; i < 5; i++) {
          await sendReq();
        }

        // 6th request should hit 429
        const blockedRes = await sendReq();
        expect(blockedRes.status).toBe(429);
      } finally {
        delete process.env.TEST_RATE_LIMIT;
      }
    });
  });
});
