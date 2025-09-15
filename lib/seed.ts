// prisma/seed.ts
import {
  PrismaClient,
  PropertyClassification,
  PropertyStatus,
  PropertyLocation,
  PaymentScheduleType,
  RPTStatus,
  Prisma,
} from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1️⃣ Create Roles
  await prisma.role.createMany({
    data: [
      { name: 'System Admin', description: 'Full system access', level: 4 },
      { name: 'Manager', description: 'Manages business unit operations', level: 1 },
      { name: 'Staff', description: 'Handles day-to-day tasks', level: 0 },
      { name: 'Approver', description: 'Approves transactions', level: 2 },
      { name: 'Custodian', description: 'Responsible for physical custody', level: 0 },
    ],
    skipDuplicates: true,
  });

  const allRoles = await prisma.role.findMany();
  const systemAdminRole = allRoles.find((r) => r.name === 'System Admin')!;
  const managerRole = allRoles.find((r) => r.name === 'Manager')!;
  const staffRole = allRoles.find((r) => r.name === 'Staff')!;

  // 2️⃣ Create Business Unit
  const rdCorp = await prisma.businessUnit.upsert({
    where: { name: 'RD Corporation' },
    update: {},
    create: {
      name: 'RD Corporation',
      description: 'Main business unit for RD Corporation',
      unitType: 'MAIN_OFFICE',
    },
  });

  // 3️⃣ Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'sysadmin',
        firstName: 'System',
        lastName: 'Admin',
        email: 'sysadmin@rdcorp.com',
        passwordHash:
          '$2a$12$vt09yt5SWAeoLpbq9iIlqugnGKu/N0qszN3h9NM1P8x4RXD9sxB0W', // bcrypt hash
        businessUnitMembers: {
          create: {
            businessUnitId: rdCorp.id,
            roleId: systemAdminRole.id,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        username: 'jdoe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'jdoe@rdcorp.com',
        passwordHash:
          '$2a$12$vt09yt5SWAeoLpbq9iIlqugnGKu/N0qszN3h9NM1P8x4RXD9sxB0W',
        businessUnitMembers: {
          create: {
            businessUnitId: rdCorp.id,
            roleId: managerRole.id,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        username: 'asmith',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'asmith@rdcorp.com',
        passwordHash:
          '$2a$12$vt09yt5SWAeoLpbq9iIlqugnGKu/N0qszN3h9NM1P8x4RXD9sxB0W',
        businessUnitMembers: {
          create: {
            businessUnitId: rdCorp.id,
            roleId: staffRole.id,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        username: 'bwhite',
        firstName: 'Bob',
        lastName: 'White',
        email: 'bwhite@rdcorp.com',
        passwordHash:
          '$2a$12$vt09yt5SWAeoLpbq9iIlqugnGKu/N0qszN3h9NM1P8x4RXD9sxB0W',
        businessUnitMembers: {
          create: {
            businessUnitId: rdCorp.id,
            roleId: staffRole.id,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        username: 'ccruz',
        firstName: 'Carla',
        lastName: 'Cruz',
        email: 'ccruz@rdcorp.com',
        passwordHash:
          '$2a$12$vt09yt5SWAeoLpbq9iIlqugnGKu/N0qszN3h9NM1P8x4RXD9sxB0W',
        businessUnitMembers: {
          create: {
            businessUnitId: rdCorp.id,
            roleId: staffRole.id,
          },
        },
      },
    }),
  ]);

  const sysAdmin = users[0];

  // 4️⃣ Create 10 Properties with 4 RPT Records each
  for (let i = 0; i < 10; i++) {
    const property = await prisma.property.create({
      data: {
        propertyName: `Lot ${i + 1}`,
        titleNumber: `T-${faker.number.int({ min: 10000, max: 99999 })}`,
        lotNumber: faker.string.alphanumeric(6).toUpperCase(),
        location: faker.location.streetAddress(),
        area: new Prisma.Decimal(
          faker.number.float({ min: 100, max: 500, fractionDigits: 2 })
        ),
        registeredOwner: faker.person.fullName(),
        custodianId: sysAdmin.id,
        propertyClassification: PropertyClassification.RESIDENTIAL,
        status: PropertyStatus.ACTIVE,
        currentLocation: PropertyLocation.MAIN_OFFICE,
        businessUnitId: rdCorp.id,
        createdById: sysAdmin.id,
      },
    });

    // Create 4 RPT Records (one per quarter)
    for (let quarter = 1; quarter <= 4; quarter++) {
      await prisma.realPropertyTax.create({
        data: {
          propertyId: property.id,
          taxYear: 2024,
          assessedValue: new Prisma.Decimal(
            faker.number.float({ min: 100000, max: 500000, fractionDigits: 2 })
          ),
          taxRate: new Prisma.Decimal(0.01),
          basicTax: new Prisma.Decimal(
            faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 })
          ),
          totalAmountDue: new Prisma.Decimal(
            faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 })
          ),
          paymentSchedule: `QUARTERLY_Q${quarter}` as PaymentScheduleType,
          dueDate: faker.date.future({ refDate: new Date('2024-01-01') }),
          status: RPTStatus.UNPAID,
        },
      });
    }
  }

  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
