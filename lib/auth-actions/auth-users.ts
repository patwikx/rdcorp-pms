// In "@/lib/auth-actions/auth-users.ts"
import { prisma } from "@/lib/prisma";

/**
 * Fetches a user by their unique username.
 * This function is already correct and requires no changes.
 */
export const getUserByUsername = async (username: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    return user;
  } catch {
    return null;
  }
};

/**
 * UPDATED: Fetches a user by their ID and includes their business unit memberships (roles and business units).
 * Updated to use businessUnitMembers relation from the new schema.
 */
export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        businessUnitMembers: {
          where: { isActive: true }, // Only include active memberships
          include: {
            role: true,
            businessUnit: true,
          },
        },
      },
    });
    return user;
  } catch {
    return null;
  }
};

/**
 * Fetches a user by their email address.
 * Useful for authentication and user lookup.
 */
export const getUserByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  } catch {
    return null;
  }
};

/**
 * Fetches a user's email by their ID.
 * This replaces the old, incorrectly named `getEmailByUserId`.
 */
export const getUserEmailById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    // Return the email string, or null if not found
    return user?.email ?? null;
  } catch {
    return null;
  }
};

/**
 * Fetches a user's full name by their ID.
 * Replaces the part of the old logic that was trying to get a 'name'.
 */
export const getUserFullNameById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    if (!user) {
      return null;
    }
    // Combine firstName and lastName into a full name
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown User';
  } catch {
    return null;
  }
};

/**
 * Fetches a user's username by their ID.
 * This replaces the old `getEmailByUserIdUpload` and `getEmailByApproverId` functions.
 */
export const getUsernameById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    return user?.username ?? null;
  } catch {
    return null;
  }
};

/**
 * NEW: Fetches all active users within a specific business unit.
 * Useful for dropdown lists and user selection in property management.
 */
export const getUsersByBusinessUnit = async (businessUnitId: string) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        businessUnitMembers: {
          some: {
            businessUnitId,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        businessUnitMembers: {
          where: {
            businessUnitId,
            isActive: true,
          },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
    return users;
  } catch {
    return [];
  }
};

/**
 * NEW: Checks if a user has a specific role within a business unit.
 * Useful for authorization checks.
 */
export const userHasRoleInBusinessUnit = async (
  userId: string,
  businessUnitId: string,
  roleName: string
) => {
  try {
    const membership = await prisma.businessUnitMember.findFirst({
      where: {
        userId,
        businessUnitId,
        isActive: true,
        role: {
          name: roleName,
        },
      },
    });
    return !!membership;
  } catch {
    return false;
  }
};

/**
 * NEW: Gets all business units that a user is a member of.
 * Useful for navigation and context switching.
 */
export const getUserBusinessUnits = async (userId: string) => {
  try {
    const memberships = await prisma.businessUnitMember.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        businessUnit: true,
        role: true,
      },
    });
    return memberships.map(membership => ({
      businessUnit: membership.businessUnit,
      role: membership.role,
      joinedAt: membership.joinedAt,
    }));
  } catch {
    return [];
  }
};

/**
 * NEW: Gets users who can approve properties (based on role permissions).
 * This will need to be refined based on your specific permission structure.
 */
export const getApprovalUsers = async (businessUnitId?: string) => {
  try {
    const whereClause = businessUnitId 
      ? {
          isActive: true,
          businessUnitMembers: {
            some: {
              businessUnitId,
              isActive: true,
              // You might want to filter by specific roles that can approve
              // role: { name: { in: ['APPROVER', 'ADMIN', 'MANAGER'] } }
            },
          },
        }
      : {
          isActive: true,
        };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
    return users;
  } catch {
    return [];
  }
};