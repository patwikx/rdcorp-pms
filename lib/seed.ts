import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create System Admin User
  const hashedPassword = await bcrypt.hash('asdasd123', 12);
  
  const systemAdmin = await prisma.user.upsert({
    where: { email: 'admin@rdcorp.com.ph' },
    update: {},
    create: {
      username: 'sysadmin',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@rdcorp.com.ph',
      passwordHash: hashedPassword,
      isActive: true,
    },
  });

  console.log('✅ Created System Admin User:', systemAdmin.email);

  // Create Business Unit
  const businessUnit = await prisma.businessUnit.upsert({
    where: { name: 'RD Corporation' },
    update: {},
    create: {
      name: 'RD Corporation',
      description: 'Main corporate headquarters for property management operations',
      address: '123 Business District, Metro Manila, Philippines',
      isActive: true,
    },
  });

  console.log('✅ Created Business Unit:', businessUnit.name);

  // Define comprehensive roles and permissions
  const rolesData = [
    {
      name: 'System Administrator',
      description: 'Full system access with all administrative privileges',
      permissions: [
        // System Management
        'system:manage',
        'system:settings:update',
        'system:backup:create',
        'system:logs:view',
        
        // User Management
        'users:create',
        'users:read',
        'users:update',
        'users:delete',
        'users:manage_roles',
        'users:reset_password',
        
        // Business Unit Management
        'business_units:create',
        'business_units:read',
        'business_units:update',
        'business_units:delete',
        'business_units:manage_members',
        
        // Property Management - Full Access
        'properties:create',
        'properties:read',
        'properties:update',
        'properties:delete',
        'properties:approve',
        'properties:release',
        'properties:turnover',
        'properties:return',
        'properties:bulk_operations',
        
        // Reports and Analytics
        'reports:view_all',
        'reports:create',
        'reports:export',
        'analytics:view_all',
        
        // Audit and Compliance
        'audit_logs:view',
        'audit_logs:export',
        'compliance:manage',
      ],
    },
    {
      name: 'Property Manager',
      description: 'Manages properties and day-to-day operations',
      permissions: [
        // Property Management
        'properties:create',
        'properties:read',
        'properties:update',
        'properties:release',
        'properties:turnover',
        'properties:return',
        
        // Property Operations
        'property_approvals:create',
        'property_approvals:read',
        'property_releases:create',
        'property_releases:read',
        'property_turnovers:create',
        'property_turnovers:read',
        'property_returns:create',
        'property_returns:read',
        
        // Limited User Management
        'users:read',
        'business_units:read',
        
        // Reports
        'reports:view_assigned',
        'reports:create_basic',
        'analytics:view_assigned',
        
        // Audit Logs (Read Only)
        'audit_logs:view_own',
      ],
    },
    {
      name: 'Property Supervisor',
      description: 'Supervises property operations and approves certain actions',
      permissions: [
        // Property Management
        'properties:read',
        'properties:update',
        'properties:approve',
        'properties:release',
        'properties:turnover',
        
        // Property Approvals
        'property_approvals:create',
        'property_approvals:read',
        'property_approvals:approve',
        'property_releases:approve',
        'property_turnovers:approve',
        
        // Team Management (Limited)
        'users:read',
        'business_units:read',
        'business_units:view_members',
        
        // Reports and Analytics
        'reports:view_department',
        'reports:create_basic',
        'analytics:view_department',
        
        // Audit
        'audit_logs:view_department',
      ],
    },
    {
      name: 'Property Officer',
      description: 'Handles property documentation and basic operations',
      permissions: [
        // Property Management (Limited)
        'properties:create',
        'properties:read',
        'properties:update_basic',
        
        // Property Operations (Basic)
        'property_releases:create',
        'property_releases:read',
        'property_turnovers:create',
        'property_turnovers:read',
        'property_returns:create',
        'property_returns:read',
        
        // View Only Access
        'users:read_basic',
        'business_units:read',
        
        // Basic Reporting
        'reports:view_assigned',
        'analytics:view_basic',
        
        // Own Audit Logs
        'audit_logs:view_own',
      ],
    },
    {
      name: 'Finance Manager',
      description: 'Manages financial aspects of property operations',
      permissions: [
        // Property Financial Data
        'properties:read',
        'properties:view_financial',
        'properties:update_financial',
        
        // Financial Reporting
        'reports:view_financial',
        'reports:create_financial',
        'reports:export_financial',
        'analytics:view_financial',
        
        // Property Valuations
        'property_valuations:create',
        'property_valuations:read',
        'property_valuations:update',
        
        // Limited User Access
        'users:read_basic',
        'business_units:read',
        
        // Financial Audit
        'audit_logs:view_financial',
      ],
    },
    {
      name: 'Legal Officer',
      description: 'Handles legal documentation and compliance',
      permissions: [
        // Property Legal Information
        'properties:read',
        'properties:view_legal',
        'properties:update_legal',
        
        // Legal Documentation
        'legal_documents:create',
        'legal_documents:read',
        'legal_documents:update',
        'legal_documents:approve',
        
        // Compliance
        'compliance:view',
        'compliance:update',
        'compliance:reports',
        
        // Property Approvals (Legal Aspect)
        'property_approvals:create_legal',
        'property_approvals:read',
        'property_approvals:approve_legal',
        
        // Legal Reports
        'reports:view_legal',
        'reports:create_legal',
        
        // Legal Audit
        'audit_logs:view_legal',
      ],
    },
    {
      name: 'Viewer',
      description: 'Read-only access to assigned properties and basic information',
      permissions: [
        // Basic Read Access
        'properties:read_assigned',
        'users:read_basic',
        'business_units:read_basic',
        
        // Basic Reports
        'reports:view_basic',
        'analytics:view_basic',
        
        // Own Profile
        'profile:read',
        'profile:update_basic',
      ],
    },
    {
      name: 'Auditor',
      description: 'Reviews and audits property management processes',
      permissions: [
        // Audit Access
        'audit_logs:view',
        'audit_logs:export',
        'audit_logs:analyze',
        
        // Read-Only Property Access
        'properties:read',
        'property_approvals:read',
        'property_releases:read',
        'property_turnovers:read',
        'property_returns:read',
        
        // Compliance Review
        'compliance:view',
        'compliance:audit',
        
        // Audit Reports
        'reports:view_audit',
        'reports:create_audit',
        'reports:export_audit',
        
        // User Information (For Audit Trail)
        'users:read_audit',
        'business_units:read_audit',
      ],
    },
  ];

  // Create roles
  const createdRoles = [];
  for (const roleData of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        description: roleData.description,
        permissions: roleData.permissions,
      },
      create: {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
      },
    });
    createdRoles.push(role);
    console.log(`✅ Created Role: ${role.name} with ${roleData.permissions.length} permissions`);
  }

  // Assign System Administrator role to the admin user
  const systemAdminRole = createdRoles.find(role => role.name === 'System Administrator');
  if (systemAdminRole) {
    await prisma.businessUnitMember.upsert({
      where: {
        userId_businessUnitId: {
          userId: systemAdmin.id,
          businessUnitId: businessUnit.id,
        },
      },
      update: {
        roleId: systemAdminRole.id,
        isActive: true,
      },
      create: {
        userId: systemAdmin.id,
        businessUnitId: businessUnit.id,
        roleId: systemAdminRole.id,
        isActive: true,
      },
    });

    console.log('✅ Assigned System Administrator role to admin user');
  }

  // Create some additional test users (optional)
  const testUsers = [
    {
      username: 'propmanager1',
      firstName: 'Juan',
      lastName: 'Santos',
      email: 'juan.santos@rdcorp.com.ph',
      role: 'Property Manager',
    },
    {
      username: 'supervisor1',
      firstName: 'Maria',
      lastName: 'Cruz',
      email: 'maria.cruz@rdcorp.com.ph',
      role: 'Property Supervisor',
    },
    {
      username: 'officer1',
      firstName: 'Pedro',
      lastName: 'Reyes',
      email: 'pedro.reyes@rdcorp.com.ph',
      role: 'Property Officer',
    },
  ];

  const defaultPassword = await bcrypt.hash('user123!', 12);

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordHash: defaultPassword,
        isActive: true,
      },
    });

    // Assign role to user
    const userRole = createdRoles.find(role => role.name === userData.role);
    if (userRole) {
      await prisma.businessUnitMember.upsert({
        where: {
          userId_businessUnitId: {
            userId: user.id,
            businessUnitId: businessUnit.id,
          },
        },
        update: {
          roleId: userRole.id,
          isActive: true,
        },
        create: {
          userId: user.id,
          businessUnitId: businessUnit.id,
          roleId: userRole.id,
          isActive: true,
        },
      });
    }

    console.log(`✅ Created test user: ${user.email} with role: ${userData.role}`);
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Created Resources:');
  console.log(`   • 1 Business Unit: ${businessUnit.name}`);
  console.log(`   • ${createdRoles.length} Roles with comprehensive permissions`);
  console.log(`   • ${testUsers.length + 1} Users (1 admin + ${testUsers.length} test users)`);
  console.log('\n🔐 Default Login Credentials:');
  console.log('   Admin: admin@rdcorp.com.ph / admin123!');
  console.log('   Test Users: [email] / user123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });