// lib/actions/role-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import type {
  RoleListItem,
  RoleDetails,
  RoleFormData,
  RoleFilters,
  RoleSort,
  RoleStats,
} from '@/types/user-management-types';

// Get roles with pagination and filtering
export async function getRoles(
  businessUnitId: string,
  page: number = 1,
  limit: number = 10,
  filters?: RoleFilters,
  sort?: RoleSort
): Promise<{
  roles: RoleListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.RoleWhereInput = {
    ...(filters?.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
    ...(filters?.hasMembers !== undefined && {
      businessUnitMembers: filters.hasMembers
        ? { some: { isActive: true } }
        : { none: { isActive: true } },
    }),
  };

  // Build orderBy clause
  const orderBy: Prisma.RoleOrderByWithRelationInput = sort
    ? { [sort.field]: sort.order }
    : { createdAt: 'desc' };

  try {
    const [roles, totalCount] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              businessUnitMembers: {
                where: { isActive: true },
              },
            },
          },
        },
      }),
      prisma.role.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      roles: roles as RoleListItem[],
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw new Error('Failed to fetch roles');
  }
}

// Get role by ID with full details
export async function getRoleById(
  businessUnitId: string,
  roleId: string
): Promise<RoleDetails | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  try {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        businessUnitMembers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            businessUnit: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        _count: {
          select: {
            businessUnitMembers: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return role as RoleDetails | null;
  } catch (error) {
    console.error('Error fetching role:', error);
    throw new Error('Failed to fetch role details');
  }
}

// Create new role
export async function createRole(
  businessUnitId: string,
  data: RoleFormData
): Promise<{ success: boolean; roleId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has access to this business unit and create permission
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    return { success: false, error: 'Access denied to this business unit' };
  }

  // Check if role name already exists
  const existingRole = await prisma.role.findUnique({
    where: { name: data.name },
  });

  if (existingRole) {
    return { success: false, error: 'A role with this name already exists' };
  }

  try {
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      },
    });

    revalidatePath(`/${businessUnitId}/roles`);
    return { success: true, roleId: role.id };
  } catch (error) {
    console.error('Error creating role:', error);
    return { success: false, error: 'Failed to create role' };
  }
}

// Update role
export async function updateRole(
  businessUnitId: string,
  roleId: string,
  data: Partial<RoleFormData>
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    return { success: false, error: 'Access denied to this business unit' };
  }

  try {
    // Verify role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return { success: false, error: 'Role not found' };
    }

    // Check if name is being changed and if it conflicts
    if (data.name && data.name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name: data.name },
      });

      if (nameConflict) {
        return { success: false, error: 'A role with this name already exists' };
      }
    }

    await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
      },
    });

    revalidatePath(`/${businessUnitId}/roles`);
    revalidatePath(`/${businessUnitId}/roles/${roleId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, error: 'Failed to update role' };
  }
}

// Delete role
export async function deleteRole(
  businessUnitId: string,
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has access to this business unit and delete permission
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    return { success: false, error: 'Access denied to this business unit' };
  }

  try {
    // Verify role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            businessUnitMembers: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!existingRole) {
      return { success: false, error: 'Role not found' };
    }

    // Check if role has active members
    if (existingRole._count.businessUnitMembers > 0) {
      return { 
        success: false, 
        error: 'Cannot delete role that has active members. Please reassign users first.' 
      };
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    revalidatePath(`/${businessUnitId}/roles`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting role:', error);
    return { success: false, error: 'Failed to delete role' };
  }
}

// Get role statistics
export async function getRoleStats(businessUnitId: string): Promise<RoleStats> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  try {
    const [
      total,
      rolesWithMembers,
      allRoles,
    ] = await Promise.all([
      // Total roles
      prisma.role.count(),
      
      // Roles with active members
      prisma.role.count({
        where: {
          businessUnitMembers: {
            some: { isActive: true },
          },
        },
      }),
      
      // All roles with permissions count
      prisma.role.findMany({
        select: { permissions: true },
      }),
    ]);

    // Calculate total permissions across all roles
    const totalPermissions = allRoles.reduce((acc, role) => {
      const permissions = Array.isArray(role.permissions) ? role.permissions : [];
      return acc + permissions.length;
    }, 0);

    return {
      total,
      withMembers: rolesWithMembers,
      withoutMembers: total - rolesWithMembers,
      totalPermissions,
    };
  } catch (error) {
    console.error('Error fetching role stats:', error);
    throw new Error('Failed to fetch role statistics');
  }
}

// Get all available permissions
export async function getAvailablePermissions(): Promise<string[]> {
  // This would typically come from a configuration file or database
  // For now, return the permissions from your seed data
  return [
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
  ];
}