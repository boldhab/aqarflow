import request from 'supertest';
import { app } from '../../app';
import prisma from '@/config/db';
import bcrypt from 'bcryptjs';

describe('Leads Module Integration & Scoping Tests', () => {
  let agencyAId: string;
  let agencyBId: string;

  let adminCookie: string;
  let agent1Cookie: string;
  let agent2Cookie: string;

  let agent1Id: string;
  let agent2Id: string;

  let leadAgent1Id: string;
  let leadAgent2Id: string;
  let leadUnassignedId: string;
  let leadAgencyBId: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Agency A
    const agencyA = await prisma.agency.upsert({
      where: { slug: 'leads-agency-a' },
      update: {},
      create: { name: 'Leads Agency A', slug: 'leads-agency-a' },
    });
    agencyAId = agencyA.id;

    // Admin of Agency A
    await prisma.user.upsert({
      where: { email: 'leads_admin_a@aqarflow.com' },
      update: { agencyId: agencyAId, isActive: true },
      create: {
        agencyId: agencyAId,
        name: 'Leads Admin A',
        email: 'leads_admin_a@aqarflow.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    // Agent 1 of Agency A
    const agent1 = await prisma.user.upsert({
      where: { email: 'leads_agent1_a@aqarflow.com' },
      update: { agencyId: agencyAId, isActive: true },
      create: {
        agencyId: agencyAId,
        name: 'Agent 1 A',
        email: 'leads_agent1_a@aqarflow.com',
        password: hashedPassword,
        role: 'AGENT',
        isActive: true,
      },
    });
    agent1Id = agent1.id;

    // Agent 2 of Agency A
    const agent2 = await prisma.user.upsert({
      where: { email: 'leads_agent2_a@aqarflow.com' },
      update: { agencyId: agencyAId, isActive: true },
      create: {
        agencyId: agencyAId,
        name: 'Agent 2 A',
        email: 'leads_agent2_a@aqarflow.com',
        password: hashedPassword,
        role: 'AGENT',
        isActive: true,
      },
    });
    agent2Id = agent2.id;

    // 2. Agency B
    const agencyB = await prisma.agency.upsert({
      where: { slug: 'leads-agency-b' },
      update: {},
      create: { name: 'Leads Agency B', slug: 'leads-agency-b' },
    });
    agencyBId = agencyB.id;

    // 3. Create test leads
    // Lead 1: assigned to Agent 1
    const l1 = await prisma.lead.create({
      data: {
        agencyId: agencyAId,
        assignedAgentId: agent1Id,
        name: 'Client of Agent 1',
        phone: '03001111111',
        normalizedPhone: '+923001111111',
        stage: 'NEW',
        source: 'WEBSITE',
      },
    });
    leadAgent1Id = l1.id;

    // Lead 2: assigned to Agent 2
    const l2 = await prisma.lead.create({
      data: {
        agencyId: agencyAId,
        assignedAgentId: agent2Id,
        name: 'Client of Agent 2',
        phone: '03002222222',
        normalizedPhone: '+923002222222',
        stage: 'CONTACTED',
        source: 'WEBSITE',
      },
    });
    leadAgent2Id = l2.id;

    // Lead 3: Unassigned under Agency A
    const l3 = await prisma.lead.create({
      data: {
        agencyId: agencyAId,
        assignedAgentId: null,
        name: 'Unassigned Client A',
        phone: '03003333333',
        normalizedPhone: '+923003333333',
        stage: 'NEW',
        source: 'WEBSITE',
      },
    });
    leadUnassignedId = l3.id;

    // Lead 4: Belongs to Agency B
    const l4 = await prisma.lead.create({
      data: {
        agencyId: agencyBId,
        name: 'Client of Agency B',
        phone: '03004444444',
        normalizedPhone: '+923004444444',
        stage: 'NEW',
        source: 'WEBSITE',
      },
    });
    leadAgencyBId = l4.id;

    // Login users to acquire session cookies
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'leads_admin_a@aqarflow.com', password: 'password123' });
    adminCookie = adminLogin.headers['set-cookie'][0];

    const agent1Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'leads_agent1_a@aqarflow.com', password: 'password123' });
    agent1Cookie = agent1Login.headers['set-cookie'][0];

    const agent2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'leads_agent2_a@aqarflow.com', password: 'password123' });
    agent2Cookie = agent2Login.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await prisma.lead.deleteMany({
      where: { agencyId: { in: [agencyAId, agencyBId] } },
    });
    await prisma.user.deleteMany({
      where: { agencyId: { in: [agencyAId, agencyBId] } },
    });
    await prisma.agency.deleteMany({
      where: { id: { in: [agencyAId, agencyBId] } },
    });
  });

  describe('GET /api/v1/leads Scoping', () => {
    it('Admin can see all leads in their agency', async () => {
      const res = await request(app)
        .get('/api/v1/leads')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const items = res.body.data.items;
      const ids = items.map((i: any) => i.id);

      expect(ids).toContain(leadAgent1Id);
      expect(ids).toContain(leadAgent2Id);
      expect(ids).toContain(leadUnassignedId);
      // Must NOT see Agency B lead
      expect(ids).not.toContain(leadAgencyBId);
    });

    it('Agent can only see leads assigned to themselves', async () => {
      const res = await request(app)
        .get('/api/v1/leads')
        .set('Cookie', agent1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const items = res.body.data.items;
      const ids = items.map((i: any) => i.id);

      // Agent 1 sees own lead
      expect(ids).toContain(leadAgent1Id);

      // Agent 1 MUST NOT see Agent 2 lead or unassigned lead
      expect(ids).not.toContain(leadAgent2Id);
      expect(ids).not.toContain(leadUnassignedId);
      expect(ids).not.toContain(leadAgencyBId);
    });

    it('Agent 2 can only see their own assigned leads', async () => {
      const res = await request(app)
        .get('/api/v1/leads')
        .set('Cookie', agent2Cookie);

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      const ids = items.map((i: any) => i.id);

      expect(ids).toContain(leadAgent2Id);
      expect(ids).not.toContain(leadAgent1Id);
      expect(ids).not.toContain(leadUnassignedId);
    });
  });

  describe('GET /api/v1/leads/:id Scoping', () => {
    it('Admin can view any lead in agency', async () => {
      const res = await request(app)
        .get(`/api/v1/leads/${leadAgent1Id}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(leadAgent1Id);
    });

    it('Agent can view their own assigned lead', async () => {
      const res = await request(app)
        .get(`/api/v1/leads/${leadAgent1Id}`)
        .set('Cookie', agent1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(leadAgent1Id);
    });

    it('Agent gets 404 when attempting to view another agent lead', async () => {
      const res = await request(app)
        .get(`/api/v1/leads/${leadAgent2Id}`)
        .set('Cookie', agent1Cookie);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('Admin gets 404 when attempting to view a lead of another agency', async () => {
      const res = await request(app)
        .get(`/api/v1/leads/${leadAgencyBId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(404);
    });
  });

  describe('Filtering and Pagination', () => {
    it('should filter leads by stage', async () => {
      const res = await request(app)
        .get('/api/v1/leads')
        .query({ stage: 'CONTACTED' })
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      expect(items.every((i: any) => i.stage === 'CONTACTED')).toBe(true);
      expect(items.some((i: any) => i.id === leadAgent2Id)).toBe(true);
    });
  });
});
