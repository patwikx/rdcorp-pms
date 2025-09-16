// lib/actions/role-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import type {
  RoleWithPermissions,
  RoleListItem,
  RoleDetails,
  RoleFormData,
  RoleUpdateData,
  RoleFilters,
  RoleSort,
  RoleStats,
  CreateRoleResult,
  UpdateRoleResult,
  RoleActionResult,
} from '@/types/role-types';

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
    ...(filters?.level !== undefined && { level: filters.level }),
    ...(filters?.hasPermissions !== undefined && {
      permissions: filters.hasPermissions ? { some: {} } : { none: {} },
    }),
    ...(filters?.hasMembers !== undefined && {
      businessUnitMembers: filters.hasMembers ? { some: {} } : { none: {} },
    }),
    ...(filters?.dateFrom || filters?.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    },
  };

  // Build orderBy clause
  const orderBy: Prisma.RoleOrderByWithRelationInput = sort
    ? { [sort.field]: sort.order }
    : { level: 'desc' };

  try {
    const [roles, totalCount] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          permissions: true,
          _count: {
            select: {
              permissions: true,
              businessUnitMembers: true,
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
        permissions: true,
        businessUnitMembers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
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
            permissions: true,
            businessUnitMembers: true,
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
): Promise<CreateRoleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

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

  // Validate permissions
  if (data.permissions.length === 0) {
    return { success: false, error: 'At least one permission is required' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create the role
      const role = await tx.role.create({
        data: {
          name: data.name,
          description: data.description,
          level: data.level,
        },
      });

      // Create permissions
      await tx.rolePermissions.createMany({
        data: data.permissions.map(permission => ({
          roleId: role.id,
          module: permission.module,
          canCreate: permission.canCreate,
          canRead: permission.canRead,
          canUpdate: permission.canUpdate,
          canDelete: permission.canDelete,
          canApprove: permission.canApprove,
        })),
      });

      return role;
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Role',
        entityId: result.id,
        userId: session.user.id,
        newValues: {
          name: data.name,
          description: data.description,
          level: data.level,
          permissionsCount: data.permissions.length,
        },
      },
    });

    revalidatePath(`/${businessUnitId}/roles`);
    return { success: true, roleId: result.id };
  } catch (error) {
    console.error('Error creating role:', error);
    return { success: false, error: 'Failed to create role' };
  }
}

// Update role
export async function updateRole(
  businessUnitId: string,
  roleId: string,
  data: RoleUpdateData
): Promise<UpdateRoleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

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

    // Check name uniqueness if name is being changed
    if (data.name && data.name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name: data.name },
      });

      if (nameConflict) {
        return { success: false, error: 'A role with this name already exists' };
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        permissions: true,
        _count: {
          select: {
            permissions: true,
            businessUnitMembers: true,
          },
        },
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Role',
        entityId: roleId,
        userId: session.user.id,
        oldValues: { ...existingRole },
        newValues: { ...data },
      },
    });

    revalidatePath(`/${businessUnitId}/roles`);
    revalidatePath(`/${businessUnitId}/roles/${roleId}`);
    return { success: true, role: updatedRole as RoleWithPermissions };
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, error: 'Failed to update role' };
  }
}

// Delete role
export async function deleteRole(
  businessUnitId: string,
  roleId: string
): Promise<RoleActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

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
            businessUnitMembers: true,
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
        error: 'Cannot delete role with active members. Please reassign users first.' 
      };
    }

    // Create audit log entry before deletion
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Role',
        entityId: roleId,
        userId: session.user.id,
        oldValues: { ...existingRole },
      },
    });

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

// Update role permissions
export async function updateRolePermissions(
  businessUnitId: string,
  roleId: string,
  permissions: Array<{
    module: string;
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canApprove: boolean;
  }>
): Promise<RoleActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    return { success: false, error: 'Access denied to this business unit' };
  }

  try {
    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return { success: false, error: 'Role not found' };
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.rolePermissions.deleteMany({
        where: { roleId },
      });

      // Create new permissions
      if (permissions.length > 0) {
        await tx.rolePermissions.createMany({
          data: permissions.map(permission => ({
            roleId,
            module: permission.module,
            canCreate: permission.canCreate,
            canRead: permission.canRead,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
            canApprove: permission.canApprove,
          })),
        });
      }

      // Update role timestamp
      await tx.role.update({
        where: { id: roleId },
        data: { updatedAt: new Date() },
      });
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'RolePermissions',
        entityId: roleId,
        userId: session.user.id,
        newValues: {
          permissionsCount: permissions.length,
          permissions: permissions.map(p => ({
            module: p.module,
            permissions: Object.entries(p)
              .filter(([key, value]) => key.startsWith('can') && value)
              .map(([key]) => key),
          })),
        },
      },
    });

    revalidatePath(`/${businessUnitId}/roles`);
    revalidatePath(`/${businessUnitId}/roles/${roleId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return { success: false, error: 'Failed to update role permissions' };
  }
}

// Get role statistics
export async function getRoleStats(businessUnitId: string): Promise<RoleStats> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  try {
    const [
      total,
      levelStats,
      withPermissions,
      withMembers,
      recentCount,
      totalPermissions,
    ] = await Promise.all([
      // Total roles
      prisma.role.count(),
      
      // Roles by level
      prisma.role.groupBy({
        by: ['level'],
        _count: { level: true },
      }),
      
      // Roles with permissions
      prisma.role.count({
        where: {
          permissions: { some: {} },
        },
      }),
      
      // Roles with members
      prisma.role.count({
        where: {
          businessUnitMembers: { some: {} },
        },
      }),
      
      // Recently created (last 30 days)
      prisma.role.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Total permissions across all roles
      prisma.rolePermissions.count(),
    ]);

    const byLevel: Record<number, number> = {};
    levelStats.forEach(stat => {
      byLevel[stat.level] = stat._count.level;
    });

    const avgPermissionsPerRole = total > 0 ? totalPermissions / total : 0;

    return {
      total,
      byLevel,
      withPermissions,
      withMembers,
      recentlyCreated: recentCount,
      totalPermissions,
      avgPermissionsPerRole,
    };
  } catch (error) {
    console.error('Error fetching role stats:', error);
    throw new Error('Failed to fetch role statistics');
  }
}

// Get all roles for dropdowns
export async function getAllRoles(): Promise<Array<{ id: string; name: string; level: number, description: string | null }>> {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        level: true,
        description: true,
      },
      orderBy: [{ level: 'desc' }, { name: 'asc' }],
    });

    return roles;
  } catch (error) {
    console.error('Error fetching all roles:', error);
    throw new Error('Failed to fetch roles');
  }
}