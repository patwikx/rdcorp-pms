// lib/actions/user-actions.ts
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
  UserFilters,
  UserSort,
  UserStats,
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

  // Check if user has access to this business unit
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

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
          include: {
            role: true,
            businessUnit: true,
          },
          orderBy: { joinedAt: 'desc' },
        },
        _count: {
          select: {
            businessUnitMembers: true,
            createdProperties: true,
            updatedProperties: true,
            approvals: true,
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
): Promise<{ success: boolean; userId?: string; error?: string }> {
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
  data: Partial<UserFormData>
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

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath(`/${businessUnitId}/users`);
    revalidatePath(`/${businessUnitId}/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

// Delete user
export async function deleteUser(
  businessUnitId: string,
  userId: string
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

  // Prevent self-deletion
  if (userId === session.user.id) {
    return { success: false, error: 'You cannot delete your own account' };
  }

  try {
    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return { success: false, error: 'User not found' };
    }

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

// Assign user to business unit with role
export async function assignUserToBusinessUnit(
  businessUnitId: string,
  data: UserAssignmentFormData
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

    revalidatePath(`/${businessUnitId}/users`);
    revalidatePath(`/${businessUnitId}/users/${data.userId}`);
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
    await prisma.businessUnitMember.update({
      where: {
        userId_businessUnitId: {
          userId,
          businessUnitId: targetBusinessUnitId,
        },
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath(`/${businessUnitId}/users`);
    revalidatePath(`/${businessUnitId}/users/${userId}`);
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

// Get filter options
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUserFilterOptions(businessUnitId: string): Promise<{
  roles: Array<{ id: string; name: string }>;
  businessUnits: Array<{ id: string; name: string }>;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const [roles, businessUnits] = await Promise.all([
      prisma.role.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.businessUnit.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { roles, businessUnits };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw new Error('Failed to fetch filter options');
  }
}