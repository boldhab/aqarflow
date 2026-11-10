import { PrismaClient, UserRole, PropertyStatus, LeadStage, VisitStatus, DealStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AqarFlow database...');

  // 1. Create or ensure Demo Agency (idempotent)
  const agency = await prisma.agency.upsert({
    where: { slug: 'demo-agency' },
    update: {
      name: 'Demo Agency',
    },
    create: {
      name: 'Demo Agency',
      slug: 'demo-agency',
      email: 'contact@demoagency.com',
      phone: '+1-555-0100',
      address: '100 Real Estate Way, Suite 400',
    },
  });
  console.log(`✓ Agency: ${agency.name} (${agency.id})`);

  // 2. Passwords hashed with bcrypt (cost 10)
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ADMIN user: admin@aqarflow.com / password123
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aqarflow.com' },
    update: {
      agencyId: agency.id,
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      agencyId: agency.id,
      name: 'Admin User',
      email: 'admin@aqarflow.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      phone: '+1-555-0101',
    },
  });
  console.log(`✓ ADMIN User: ${admin.email}`);

  // AGENT user: agent@aqarflow.com / password123
  const agent = await prisma.user.upsert({
    where: { email: 'agent@aqarflow.com' },
    update: {
      agencyId: agency.id,
      name: 'Agent User',
      password: hashedPassword,
      role: UserRole.AGENT,
      isActive: true,
    },
    create: {
      agencyId: agency.id,
      name: 'Agent User',
      email: 'agent@aqarflow.com',
      password: hashedPassword,
      role: UserRole.AGENT,
      isActive: true,
      phone: '+1-555-0102',
    },
  });
  console.log(`✓ AGENT User: ${agent.email}`);

  // INACTIVE user: inactive@aqarflow.com / password123 (isActive: false)
  const inactiveUser = await prisma.user.upsert({
    where: { email: 'inactive@aqarflow.com' },
    update: {
      agencyId: agency.id,
      name: 'Inactive User',
      password: hashedPassword,
      role: UserRole.AGENT,
      isActive: false,
    },
    create: {
      agencyId: agency.id,
      name: 'Inactive User',
      email: 'inactive@aqarflow.com',
      password: hashedPassword,
      role: UserRole.AGENT,
      isActive: false,
      phone: '+1-555-0103',
    },
  });
  console.log(`✓ INACTIVE User: ${inactiveUser.email} (isActive: false)`);

  // 3. Properties (idempotent - find existing first)
  const existingProp = await prisma.property.findFirst({
    where: { agencyId: agency.id, title: 'Luxury 3BR Penthouse with Marina View' },
  });

  if (!existingProp) {
    const prop1 = await prisma.property.create({
      data: {
        agencyId: agency.id,
        createdById: admin.id,
        title: 'Luxury 3BR Penthouse with Marina View',
        description: 'Stunning full marina view penthouse featuring floor-to-ceiling windows and Italian marble.',
        price: 1850000,
        currency: 'USD',
        type: 'PENTHOUSE',
        status: PropertyStatus.AVAILABLE,
        bedrooms: 3,
        bathrooms: 4,
        areaSqFt: 3400,
        address: 'Dubai Marina Walk',
        city: 'Dubai',
        country: 'United Arab Emirates',
        images: {
          create: [
            {
              agencyId: agency.id,
              url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
              caption: 'Living Area with Marina Views',
              isPrimary: true,
            },
          ],
        },
      },
    });

    const prop2 = await prisma.property.create({
      data: {
        agencyId: agency.id,
        createdById: agent.id,
        title: 'Modern 2BR Apartment in Downtown',
        description: 'Walking distance to the Dubai Mall and Burj Khalifa.',
        price: 680000,
        currency: 'USD',
        type: 'APARTMENT',
        status: PropertyStatus.AVAILABLE,
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1350,
        address: 'Downtown Boulevard',
        city: 'Dubai',
        country: 'United Arab Emirates',
        images: {
          create: [
            {
              agencyId: agency.id,
              url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
              caption: 'Interior Living Space',
              isPrimary: true,
            },
          ],
        },
      },
    });

    const lead1 = await prisma.lead.create({
      data: {
        agencyId: agency.id,
        assignedToId: agent.id,
        name: 'Alexander Wright',
        email: 'alex.wright@example.com',
        phone: '+44-7700-900123',
        stage: LeadStage.VISIT_SCHEDULED,
        source: 'PROPERTY_INQUIRY',
        notes: {
          create: [
            {
              agencyId: agency.id,
              authorId: agent.id,
              content: 'Client interested in Marina penthouse for relocation this winter.',
            },
          ],
        },
      },
    });

    await prisma.visit.create({
      data: {
        agencyId: agency.id,
        propertyId: prop1.id,
        leadId: lead1.id,
        agentId: agent.id,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: VisitStatus.SCHEDULED,
        notes: 'Meeting at property lobby at 2:00 PM',
      },
    });

    await prisma.deal.create({
      data: {
        agencyId: agency.id,
        propertyId: prop2.id,
        leadId: lead1.id,
        agentId: agent.id,
        value: 680000,
        status: DealStatus.OPEN,
      },
    });
    console.log('✓ Created initial properties, lead, visit and deal');
  } else {
    console.log('✓ Demo properties already exist, skipping duplicate property creation');
  }

  console.log('\nDatabase seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
