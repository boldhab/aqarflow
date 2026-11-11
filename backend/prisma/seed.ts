import fs from 'fs';
import path from 'path';
import {
  PrismaClient,
  UserRole,
  PropertyStatus,
  PropertyPurpose,
  PropertyType,
  AreaUnit,
  LeadStage,
  LeadSource,
  PreferredContact,
  VisitStatus,
  DealStatus,
} from '@prisma/client';
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
      phone: '+92-42-35750000',
      address: '100 Main Boulevard, Gulberg III, Lahore, Pakistan',
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
      phone: '+92-300-1112222',
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
      phone: '+92-300-3334444',
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
      phone: '+92-300-5556666',
    },
  });
  console.log(`✓ INACTIVE User: ${inactiveUser.email} (isActive: false)`);

  // Ensure seed-assets are copied to uploads/properties
  const seedAssetsDir = path.resolve(__dirname, 'seed-assets');
  const uploadsPropertiesDir = path.resolve(process.cwd(), 'uploads/properties');
  if (!fs.existsSync(uploadsPropertiesDir)) {
    fs.mkdirSync(uploadsPropertiesDir, { recursive: true });
  }
  if (fs.existsSync(seedAssetsDir)) {
    const assetFiles = fs.readdirSync(seedAssetsDir);
    for (const file of assetFiles) {
      const src = path.join(seedAssetsDir, file);
      const dest = path.join(uploadsPropertiesDir, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    }
    console.log(`✓ Copied ${assetFiles.length} seed assets to uploads/properties`);
  }

  // 3. Demo properties (Lahore, Karachi, Islamabad in PKR, idempotent via upsert)
  const propertiesData = [
    {
      referenceCode: 'AF-1001',
      title: 'Luxury 3-Bed Apartment in Gulberg III',
      description: 'Modern luxury living with panoramic skyline views, Italian fittings, and dedicated parking.',
      purpose: PropertyPurpose.SALE,
      type: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      isPublished: true,
      price: 35000000,
      currency: 'PKR',
      areaValue: 2400,
      areaUnit: AreaUnit.SQFT,
      bedrooms: 3,
      bathrooms: 3,
      address: 'Main Boulevard, Gulberg III',
      city: 'Lahore',
      locality: 'Gulberg III',
      latitude: 31.5204,
      longitude: 74.3587,
      assignedAgentId: agent.id,
      createdById: admin.id,
      images: [
        {
          url: '/uploads/properties/prop-1-exterior.jpg',
          caption: 'Spacious living hall',
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: '/uploads/properties/prop-1-living.jpg',
          caption: 'Master bedroom with balcony',
          isPrimary: false,
          sortOrder: 1,
        },
        {
          url: '/uploads/properties/prop-1-kitchen.jpg',
          caption: 'Modern kitchen with fittings',
          isPrimary: false,
          sortOrder: 2,
        },
      ],
    },
    {
      referenceCode: 'AF-1002',
      title: 'Modern 1 Kanal House in DHA Phase 6',
      description: 'Brand new designer house with basement, lush green lawn, and high-end security system.',
      purpose: PropertyPurpose.SALE,
      type: PropertyType.HOUSE,
      status: PropertyStatus.AVAILABLE,
      isPublished: true,
      price: 85000000,
      currency: 'PKR',
      areaValue: 1,
      areaUnit: AreaUnit.KANAL,
      bedrooms: 5,
      bathrooms: 6,
      address: 'Sector C, DHA Phase 6',
      city: 'Lahore',
      locality: 'DHA Phase 6',
      latitude: 31.4682,
      longitude: 74.4539,
      assignedAgentId: agent.id,
      createdById: agent.id,
      images: [
        {
          url: '/uploads/properties/prop-2-front.jpg',
          caption: 'Front elevation',
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: '/uploads/properties/prop-2-bed.jpg',
          caption: 'Master bedroom suite',
          isPrimary: false,
          sortOrder: 1,
        },
        {
          url: '/uploads/properties/prop-2-bath.jpg',
          caption: 'Designer bath with jacuzzi',
          isPrimary: false,
          sortOrder: 2,
        },
      ],
    },
    {
      referenceCode: 'AF-1003',
      title: 'Executive Sea-Facing 4-Bed Apartment in Clifton',
      description: 'Stunning direct Arabian sea views, uninterrupted sea breeze, and premium concierge service.',
      purpose: PropertyPurpose.RENT,
      type: PropertyType.APARTMENT,
      status: PropertyStatus.AVAILABLE,
      isPublished: true,
      price: 350000,
      currency: 'PKR',
      areaValue: 3200,
      areaUnit: AreaUnit.SQFT,
      bedrooms: 4,
      bathrooms: 4,
      address: 'Marine Drive, Block 4, Clifton',
      city: 'Karachi',
      locality: 'Clifton Block 4',
      latitude: 24.8138,
      longitude: 67.0305,
      assignedAgentId: agent.id,
      createdById: admin.id,
      images: [
        {
          url: '/uploads/properties/prop-3-terrace.jpg',
          caption: 'Sea view from terrace',
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: '/uploads/properties/prop-3-hall.jpg',
          caption: 'Open plan living area',
          isPrimary: false,
          sortOrder: 1,
        },
        {
          url: '/uploads/properties/prop-3-pool.jpg',
          caption: 'Infinity pool',
          isPrimary: false,
          sortOrder: 2,
        },
      ],
    },
    {
      referenceCode: 'AF-1004',
      title: '500 Sq Yd Luxury Villa in DHA Phase 8',
      description: 'Architecturally designed villa with private swimming pool and smart home automation.',
      purpose: PropertyPurpose.SALE,
      type: PropertyType.VILLA,
      status: PropertyStatus.RESERVED,
      isPublished: false,
      price: 125000000,
      currency: 'PKR',
      areaValue: 4500,
      areaUnit: AreaUnit.SQFT,
      bedrooms: 5,
      bathrooms: 5,
      address: 'Zone A, DHA Phase 8',
      city: 'Karachi',
      locality: 'DHA Phase 8',
      latitude: 24.7891,
      longitude: 67.0872,
      assignedAgentId: agent.id,
      createdById: agent.id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80',
          caption: 'Villa courtyard and pool',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
    {
      referenceCode: 'AF-1005',
      title: 'Prime Commercial Office Space in Blue Area',
      description: 'Centrally located corporate floor in Islamabad financial district with backup generator.',
      purpose: PropertyPurpose.LEASE,
      type: PropertyType.OFFICE,
      status: PropertyStatus.AVAILABLE,
      isPublished: true,
      price: 500000,
      currency: 'PKR',
      areaValue: 4000,
      areaUnit: AreaUnit.SQFT,
      bedrooms: 0,
      bathrooms: 2,
      address: 'Jinnah Avenue, Blue Area',
      city: 'Islamabad',
      locality: 'Blue Area',
      latitude: 33.7167,
      longitude: 73.0667,
      assignedAgentId: null,
      createdById: admin.id,
      images: [
        {
          url: '/uploads/properties/prop-5-office.jpg',
          caption: 'Open floor workspace',
          isPrimary: true,
          sortOrder: 0,
        },
        {
          url: '/uploads/properties/prop-5-meeting.jpg',
          caption: 'Conference and meeting room',
          isPrimary: false,
          sortOrder: 1,
        },
        {
          url: '/uploads/properties/prop-5-lobby.jpg',
          caption: 'Reception and client lounge',
          isPrimary: false,
          sortOrder: 2,
        },
      ],
    },
    {
      referenceCode: 'AF-1006',
      title: '10 Marla Designer House in Sector F-7/2',
      description: 'Serene Margalla hill views, close to Kohsar Market, with modern Spanish tiles.',
      purpose: PropertyPurpose.SALE,
      type: PropertyType.HOUSE,
      status: PropertyStatus.UNDER_OFFER,
      isPublished: false,
      price: 92000000,
      currency: 'PKR',
      areaValue: 10,
      areaUnit: AreaUnit.MARLA,
      bedrooms: 4,
      bathrooms: 4,
      address: 'Street 18, F-7/2',
      city: 'Islamabad',
      locality: 'Sector F-7/2',
      latitude: 33.7225,
      longitude: 73.0543,
      assignedAgentId: agent.id,
      createdById: agent.id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80',
          caption: 'Exterior frontage',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
    {
      referenceCode: 'AF-1007',
      title: 'Commercial Retail Shop in Bahria Town',
      description: 'Corner shop on high foot-traffic avenue, ideal for boutique or franchise.',
      purpose: PropertyPurpose.RENT,
      type: PropertyType.SHOP,
      status: PropertyStatus.DRAFT,
      isPublished: false,
      price: 180000,
      currency: 'PKR',
      areaValue: 800,
      areaUnit: AreaUnit.SQFT,
      bedrooms: 0,
      bathrooms: 1,
      address: 'Commercial Zone, Sector C',
      city: 'Lahore',
      locality: 'Bahria Town Sector C',
      latitude: 31.3683,
      longitude: 74.1812,
      assignedAgentId: agent.id,
      createdById: agent.id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
          caption: 'Storefront',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
    {
      referenceCode: 'AF-1008',
      title: '1 Kanal Residential Plot in Sector E-11',
      description: 'Solid land ready for immediate construction, surrounded by premium residences.',
      purpose: PropertyPurpose.SALE,
      type: PropertyType.PLOT,
      status: PropertyStatus.SOLD,
      isPublished: false,
      price: 45000000,
      currency: 'PKR',
      areaValue: 1,
      areaUnit: AreaUnit.KANAL,
      bedrooms: null,
      bathrooms: null,
      address: 'Main Margalla Road, E-11/3',
      city: 'Islamabad',
      locality: 'Sector E-11/3',
      latitude: 33.7022,
      longitude: 72.9806,
      assignedAgentId: null,
      createdById: admin.id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
          caption: 'Plot landscape',
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
  ];

  for (const prop of propertiesData) {
    const { images, ...propDetails } = prop;
    const property = await prisma.property.upsert({
      where: {
        agencyId_referenceCode: {
          agencyId: agency.id,
          referenceCode: propDetails.referenceCode,
        },
      },
      update: {
        ...propDetails,
        deletedAt: null,
      },
      create: {
        ...propDetails,
        agencyId: agency.id,
      },
    });

    // Ensure images exist
    for (const img of images) {
      const existingImg = await prisma.propertyImage.findFirst({
        where: { propertyId: property.id, url: img.url },
      });
      if (!existingImg) {
        await prisma.propertyImage.create({
          data: {
            agencyId: agency.id,
            propertyId: property.id,
            url: img.url,
            caption: img.caption,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          },
        });
      }
    }
  }
  console.log(`✓ Seeded ${propertiesData.length} properties across Lahore, Karachi, Islamabad`);

  // 4. Sample Lead, Visit, Deal linked to seeded properties
  const prop1 = await prisma.property.findUnique({
    where: { agencyId_referenceCode: { agencyId: agency.id, referenceCode: 'AF-1001' } },
  });
  const prop2 = await prisma.property.findUnique({
    where: { agencyId_referenceCode: { agencyId: agency.id, referenceCode: 'AF-1002' } },
  });

  if (prop1 && prop2) {
    const lead = await prisma.lead.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {
        agencyId: agency.id,
        propertyId: prop1.id,
        assignedAgentId: agent.id,
        name: 'Tariq Mansoor',
        email: 'tariq.mansoor@example.com',
        phone: '+92-321-9876543',
        message: 'Interested in viewing this Gulberg apartment on weekend.',
        preferredContact: PreferredContact.PHONE,
        purpose: PropertyPurpose.SALE,
        source: LeadSource.WEBSITE,
        stage: LeadStage.VISIT_SCHEDULED,
        normalizedPhone: '+923219876543',
        normalizedEmail: 'tariq.mansoor@example.com',
      },
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        agencyId: agency.id,
        propertyId: prop1.id,
        assignedAgentId: agent.id,
        name: 'Tariq Mansoor',
        email: 'tariq.mansoor@example.com',
        phone: '+92-321-9876543',
        message: 'Interested in viewing this Gulberg apartment on weekend.',
        preferredContact: PreferredContact.PHONE,
        purpose: PropertyPurpose.SALE,
        source: LeadSource.WEBSITE,
        stage: LeadStage.VISIT_SCHEDULED,
        normalizedPhone: '+923219876543',
        normalizedEmail: 'tariq.mansoor@example.com',
      },
    });

    const existingVisit = await prisma.visit.findFirst({
      where: { agencyId: agency.id, leadId: lead.id, propertyId: prop1.id },
    });
    if (!existingVisit) {
      await prisma.visit.create({
        data: {
          agencyId: agency.id,
          propertyId: prop1.id,
          leadId: lead.id,
          agentId: agent.id,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: VisitStatus.SCHEDULED,
          notes: 'Client visiting Gulberg apartment',
        },
      });
    }

    const existingDeal = await prisma.deal.findFirst({
      where: { agencyId: agency.id, leadId: lead.id, propertyId: prop2.id },
    });
    if (!existingDeal) {
      await prisma.deal.create({
        data: {
          agencyId: agency.id,
          propertyId: prop2.id,
          leadId: lead.id,
          agentId: agent.id,
          value: 85000000,
          status: DealStatus.OPEN,
        },
      });
    }
    console.log('✓ Seeded lead, visit, and deal');
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
