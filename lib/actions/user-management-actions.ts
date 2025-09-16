// lib/actions/user-management-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import type {
  UserListItem,
  UserDetails,
  UserFormData,
  UserAssignmentFormData,
  UserUpdateData,
  UserFilters,
  UserSort,
  UserAssignmentFilters,
  UserAssignmentSort,
  UserStats,
  UserAssignmentStats,
  CreateUserResult,
  UpdateUserResult,
  AssignmentActionResult,
  UserAssignmentListItem,
  UserFilterOptions,
  UserAssignmentFilterOptions,
} from '@/types/user-management-types';

// Get users with pagination and filtering
export async function getUsers(
  businessUnitId: string,
  page: number = 1,
  limit: number = 10,
  filters?: UserFilters,
  sort?: UserSort
): Promise<{
  users: UserListItem[];
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
  const where: Prisma.UserWhereInput = {
    ...(filters?.search && {
      OR: [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
    ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters?.roleId && {
      businessUnitMembers: {
        some: {
          roleId: filters.roleId,
          isActive: true,
        },
      },
    }),
    ...(filters?.businessUnitId && {
      businessUnitMembers: {
        some: {
          businessUnitId: filters.businessUnitId,
          isActive: true,
        },
      },
    }),
    ...(filters?.hasAssignments !== undefined && {
      businessUnitMembers: filters.hasAssignments ? { some: {} } : { none: {} },
    }),
    ...(filters?.dateFrom || filters?.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    },
  };

  // Build orderBy clause
  const orderBy: Prisma.UserOrderByWithRelationInput = sort
    ? { [sort.field]: sort.order }
    : { createdAt: 'desc' };

  try {
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          businessUnitMembers: {
            where: { isActive: true },
            select: {
              id: true,
              isActive: true,
              joinedAt: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  level: true,
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
          },
          _count: {
            select: {
              businessUnitMembers: true,
              createdProperties: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      users: users as UserListItem[],
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

// Get user by ID with full details
export async function getUserById(
  businessUnitId: string,
  userId: string
): Promise<UserDetails | null> {
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businessUnitMembers: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
            businessUnit: true,
          },
          orderBy: { joinedAt: 'desc' },
        },
        _count: {
          select: {
            businessUnitMembers: true,
            createdProperties: true,
            updatedProperties: true,
            releases: true,
            turnovers: true,
            returns: true,
            auditLogs: true,
            createdDocuments: true,
          },
        },
      },
    });

    return user as UserDetails | null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user details');
  }
}

// Create new user
export async function createUser(
  businessUnitId: string,
  data: UserFormData
): Promise<CreateUserResult> {
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

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return { success: false, error: 'A user with this email already exists' };
  }

  // Check if username already exists (if provided)
  if (data.username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      return { success: false, error: 'A user with this username already exists' };
    }
  }

  try {
    // Hash password if provided
    let passwordHash = '';
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 12);
    } else {
      // Generate a random password if none provided
      const randomPassword = Math.random().toString(36).slice(-8);
      passwordHash = await bcrypt.hash(randomPassword, 12);
    }

    const user = await prisma.user.create({
      data: {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        isActive: data.isActive,
      },
    });

    // If roleId is provided, create business unit assignment
    if (data.roleId) {
      await prisma.businessUnitMember.create({
        data: {
          userId: user.id,
          businessUnitId,
          roleId: data.roleId,
          isActive: true,
        },
      });
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        userId: session.user.id,
        newValues: {
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          isActive: data.isActive,
          hasInitialAssignment: !!data.roleId,
        },
      },
    });

    revalidatePath(`/${businessUnitId}/users`);
    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

// Update user
export async function updateUser(
  businessUnitId: string,
  userId: string,
  data: UserUpdateData
): Promise<UpdateUserResult> {
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
    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, error: 'User not found' };
    }

    // Check if email is being changed and if it conflicts
    if (data.email && data.email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailConflict) {
        return { success: false, error: 'A user with this email already exists' };
      }
    }

    // Check if username is being changed and if it conflicts
    if (data.username && data.username !== existingUser.username) {
      const usernameConflict = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (usernameConflict) {
        return { success: false, error: 'A user with this username already exists' };
      }
    }

    // Prepare update data
    const updateData: Prisma.UserUpdateInput = {
      ...(data.username !== undefined && { username: data.username }),
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    // Hash new password if provided
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        businessUnitMembers: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
            businessUnit: true,
          },
        },
        _count: {
          select: {
            businessUnitMembers: true,
            createdProperties: true,
            updatedProperties: true,
            releases: true,
            turnovers: true,
            returns: true,
            auditLogs: true,
            createdDocuments: true,
          },
        },
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'User',
        entityId: userId,
        userId: session.user.id,
        oldValues: { ...existingUser },
        newValues: { ...data },
      },
    });

    revalidatePath(`/${businessUnitId}/users`);
    revalidatePath(`/${businessUnitId}/users/${userId}`);
    return { success: true, user: updatedUser as UserDetails };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

// Delete user
export async function deleteUser(
  businessUnitId: string,
  userId: string
): Promise<AssignmentActionResult> {
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

  // Prevent self-deletion
  if (userId === session.user.id) {
    return { success: false, error: 'You cannot delete your own account' };
  }

  try {
    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            createdProperties: true,
            releases: true,
            turnovers: true,
            returns: true,
          },
        },
      },
    });

    if (!existingUser) {
      return { success: false, error: 'User not found' };
    }

    // Check if user has created records that prevent deletion
    const hasRelatedRecords = 
      existingUser._count.createdProperties > 0 ||
      existingUser._count.releases > 0 ||
      existingUser._count.turnovers > 0 ||
      existingUser._count.returns > 0;

    if (hasRelatedRecords) {
      return { 
        success: false, 
        error: 'Cannot delete user with existing records. Please deactivate instead.' 
      };
    }

    // Create audit log entry before deletion
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'User',
        entityId: userId,
        userId: session.user.id,
        oldValues: { ...existingUser },
      },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath(`/${businessUnitId}/users`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

// Get user assignments with pagination and filtering
export async function getUserAssignments(
  businessUnitId: string,
  page: number = 1,
  limit: number = 10,
  filters?: UserAssignmentFilters,
  sort?: UserAssignmentSort
): Promise<{
  assignments: UserAssignmentListItem[];
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
  const where: Prisma.BusinessUnitMemberWhereInput = {
    ...(filters?.search && {
      OR: [
        { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { user: { username: { contains: filters.search, mode: 'insensitive' } } },
        { role: { name: { contains: filters.search, mode: 'insensitive' } } },
        { businessUnit: { name: { contains: filters.search, mode: 'insensitive' } } },
      ],
    }),
    ...(filters?.businessUnitId && { businessUnitId: filters.businessUnitId }),
    ...(filters?.roleId && { roleId: filters.roleId }),
    ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters?.dateFrom || filters?.dateTo) && {
      joinedAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    },
  };

  // Build orderBy clause
  const orderBy: Prisma.BusinessUnitMemberOrderByWithRelationInput = sort
    ? { [sort.field]: sort.order }
    : { joinedAt: 'desc' };

  try {
    const [assignments, totalCount] = await Promise.all([
      prisma.businessUnitMember.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              isActive: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              level: true,
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
      }),
      prisma.businessUnitMember.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      assignments: assignments as UserAssignmentListItem[],
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    throw new Error('Failed to fetch user assignments');
  }
}

// Assign user to business unit with role
export async function assignUserToBusinessUnit(
  businessUnitId: string,
  data: UserAssignmentFormData
): Promise<AssignmentActionResult> {
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
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      return { success: false, error: 'Role not found' };
    }

    // Verify business unit exists
    const targetBusinessUnit = await prisma.businessUnit.findUnique({
      where: { id: data.businessUnitId },
    });

    if (!targetBusinessUnit) {
      return { success: false, error: 'Business unit not found' };
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.businessUnitMember.findUnique({
      where: {
        userId_businessUnitId: {
          userId: data.userId,
          businessUnitId: data.businessUnitId,
        },
      },
    });

    if (existingAssignment) {
      // Update existing assignment
      await prisma.businessUnitMember.update({
        where: {
          userId_businessUnitId: {
            userId: data.userId,
            businessUnitId: data.businessUnitId,
          },
        },
        data: {
          roleId: data.roleId,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new assignment
      await prisma.businessUnitMember.create({
        data: {
          userId: data.userId,
          businessUnitId: data.businessUnitId,
          roleId: data.roleId,
          isActive: true,
        },
      });
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: existingAssignment ? 'UPDATE' : 'CREATE',
        entity: 'BusinessUnitMember',
        entityId: `${data.userId}-${data.businessUnitId}`,
        userId: session.user.id,
        newValues: {
          userId: data.userId,
          businessUnitId: data.businessUnitId,
          roleId: data.roleId,
          isActive: true,
        },
      },
    });

    revalidatePath(`/${businessUnitId}/users`);
    revalidatePath(`/${businessUnitId}/users/assignments`);
    return { success: true };
  } catch (error) {
    console.error('Error assigning user to business unit:', error);
    return { success: false, error: 'Failed to assign user to business unit' };
  }
}

// Remove user from business unit
export async function removeUserFromBusinessUnit(
  businessUnitId: string,
  userId: string,
  targetBusinessUnitId: string
): Promise<AssignmentActionResult> {
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
    const assignment = await prisma.businessUnitMember.findUnique({
      where: {
        userId_businessUnitId: {
          userId,
          businessUnitId: targetBusinessUnitId,
        },
      },
    });

    if (!assignment) {
      return { success: false, error: 'User assignment not found' };
    }

    await prisma.businessUnitMember.update({
      where: {
        userId_businessUnitId: {
          userId,
          businessUnitId: targetBusinessUnitId,
        },
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'BusinessUnitMember',
        entityId: `${userId}-${targetBusinessUnitId}`,
        userId: session.user.id,
        oldValues: { isActive: true },
        newValues: { isActive: false },
      },
    });

    revalidatePath(`/${businessUnitId}/users`);
    revalidatePath(`/${businessUnitId}/users/assignments`);
    return { success: true };
  } catch (error) {
    console.error('Error removing user from business unit:', error);
    return { success: false, error: 'Failed to remove user from business unit' };
  }
}

// Get user statistics
export async function getUserStats(businessUnitId: string): Promise<UserStats> {
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
      active,
      inactive,
      recentCount,
      roleStats,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users
      prisma.user.count({
        where: { isActive: true },
      }),
      
      // Inactive users
      prisma.user.count({
        where: { isActive: false },
      }),
      
      // Recently added (last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Users by role
      prisma.businessUnitMember.groupBy({
        by: ['roleId'],
        where: {
          businessUnitId,
          isActive: true,
        },
        _count: { roleId: true },
      }),
    ]);

    // Get role names for the stats
    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
    });

    const byRole: Record<string, number> = {};
    roleStats.forEach(stat => {
      const role = roles.find(r => r.id === stat.roleId);
      if (role) {
        byRole[role.name] = stat._count.roleId;
      }
    });

    return {
      total,
      active,
      inactive,
      recentlyAdded: recentCount,
      byRole,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw new Error('Failed to fetch user statistics');
  }
}

// Get user assignment statistics
export async function getUserAssignmentStats(businessUnitId: string): Promise<UserAssignmentStats> {
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
      active,
      inactive,
      recentCount,
      roleStats,
      businessUnitStats,
    ] = await Promise.all([
      // Total assignments
      prisma.businessUnitMember.count(),
      
      // Active assignments
      prisma.businessUnitMember.count({
        where: { isActive: true },
      }),
      
      // Inactive assignments
      prisma.businessUnitMember.count({
        where: { isActive: false },
      }),
      
      // Recent assignments (last 30 days)
      prisma.businessUnitMember.count({
        where: {
          joinedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Assignments by role
      prisma.businessUnitMember.groupBy({
        by: ['roleId'],
        where: { isActive: true },
        _count: { roleId: true },
      }),
      
      // Assignments by business unit
      prisma.businessUnitMember.groupBy({
        by: ['businessUnitId'],
        where: { isActive: true },
        _count: { businessUnitId: true },
      }),
    ]);

    // Get role and business unit names
    const [roles, businessUnits] = await Promise.all([
      prisma.role.findMany({
        select: { id: true, name: true },
      }),
      prisma.businessUnit.findMany({
        select: { id: true, name: true },
      }),
    ]);

    const byRole: Record<string, number> = {};
    roleStats.forEach(stat => {
      const role = roles.find(r => r.id === stat.roleId);
      if (role) {
        byRole[role.name] = stat._count.roleId;
      }
    });

    const byBusinessUnit: Record<string, number> = {};
    businessUnitStats.forEach(stat => {
      const unit = businessUnits.find(u => u.id === stat.businessUnitId);
      if (unit) {
        byBusinessUnit[unit.name] = stat._count.businessUnitId;
      }
    });

    return {
      total,
      active,
      inactive,
      byRole,
      byBusinessUnit,
      recentAssignments: recentCount,
    };
  } catch (error) {
    console.error('Error fetching user assignment stats:', error);
    throw new Error('Failed to fetch user assignment statistics');
  }
}

// Get filter options for users
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUserFilterOptions(businessUnitId: string): Promise<UserFilterOptions> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const [roleStats, businessUnitStats] = await Promise.all([
      // Roles with user counts
      prisma.role.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              businessUnitMembers: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      
      // Business units with user counts
      prisma.businessUnit.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      roles: roleStats.map(role => ({
        id: role.id,
        name: role.name,
        count: role._count.businessUnitMembers,
      })),
      businessUnits: businessUnitStats.map(unit => ({
        id: unit.id,
        name: unit.name,
        count: unit._count.members,
      })),
    };
  } catch (error) {
    console.error('Error fetching user filter options:', error);
    throw new Error('Failed to fetch filter options');
  }
}

// Get filter options for user assignments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUserAssignmentFilterOptions(businessUnitId: string): Promise<UserAssignmentFilterOptions> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const [roles, businessUnits, users] = await Promise.all([
      // Roles with assignment counts
      prisma.role.findMany({
        select: {
          id: true,
          name: true,
          level: true,
          _count: {
            select: {
              businessUnitMembers: true,
            },
          },
        },
        orderBy: [{ level: 'desc' }, { name: 'asc' }],
      }),
      
      // Business units with member counts
      prisma.businessUnit.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      
      // Active users
      prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
    ]);

    return {
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        level: role.level,
        count: role._count.businessUnitMembers,
      })),
      businessUnits: businessUnits.map(unit => ({
        id: unit.id,
        name: unit.name,
        count: unit._count.members,
      })),
      users: users.map(user => ({
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
        email: user.email,
      })),
    };
  } catch (error) {
    console.error('Error fetching assignment filter options:', error);
    throw new Error('Failed to fetch filter options');
  }
}

// Find user by email or username for assignment
export async function findUserForAssignment(
  businessUnitId: string,
  identifier: string
): Promise<{ id: string; name: string; email: string } | null> {
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
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
      email: user.email,
    };
  } catch (error) {
    console.error('Error finding user for assignment:', error);
    throw new Error('Failed to find user');
  }
}