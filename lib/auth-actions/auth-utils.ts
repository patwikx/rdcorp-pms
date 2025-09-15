// lib/auth-utils.ts
import { Session } from "next-auth";
import { UserAssignment, RolePermission } from "@/next-auth";

/**
 * Check if user has a specific permission in any business unit
 */
export function hasPermission(
  session: Session | null,
  module: string,
  permission: keyof Pick<RolePermission, 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete' | 'canApprove'>
): boolean {
  if (!session?.user?.assignments) return false;

  return session.user.assignments.some(assignment =>
    assignment.role.permissions.some(perm =>
      perm.module === module && perm[permission] === true
    )
  );
}

/**
 * Check if user has a specific permission in a specific business unit
 */
export function hasPermissionInBusinessUnit(
  session: Session | null,
  businessUnitId: string,
  module: string,
  permission: keyof Pick<RolePermission, 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete' | 'canApprove'>
): boolean {
  if (!session?.user?.assignments) return false;

  const assignment = session.user.assignments.find(
    a => a.businessUnitId === businessUnitId
  );

  if (!assignment) return false;

  return assignment.role.permissions.some(perm =>
    perm.module === module && perm[permission] === true
  );
}

/**
 * Get user's role in a specific business unit
 */
export function getRoleInBusinessUnit(
  session: Session | null,
  businessUnitId: string
): UserAssignment | null {
  if (!session?.user?.assignments) return null;

  return session.user.assignments.find(
    a => a.businessUnitId === businessUnitId
  ) || null;
}

/**
 * Check if user has a minimum role level in any business unit
 */
export function hasMinimumRoleLevel(
  session: Session | null,
  minimumLevel: number
): boolean {
  if (!session?.user?.assignments) return false;

  return session.user.assignments.some(
    assignment => assignment.role.level >= minimumLevel
  );
}

/**
 * Check if user has a minimum role level in a specific business unit
 */
export function hasMinimumRoleLevelInBusinessUnit(
  session: Session | null,
  businessUnitId: string,
  minimumLevel: number
): boolean {
  if (!session?.user?.assignments) return false;

  const assignment = session.user.assignments.find(
    a => a.businessUnitId === businessUnitId
  );

  return assignment ? assignment.role.level >= minimumLevel : false;
}

/**
 * Get all business units where user has a specific permission
 */
export function getBusinessUnitsWithPermission(
  session: Session | null,
  module: string,
  permission: keyof Pick<RolePermission, 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete' | 'canApprove'>
): string[] {
  if (!session?.user?.assignments) return [];

  return session.user.assignments
    .filter(assignment =>
      assignment.role.permissions.some(perm =>
        perm.module === module && perm[permission] === true
      )
    )
    .map(assignment => assignment.businessUnitId);
}

/**
 * Check if user can approve at a specific level (useful for approval workflows)
 */
export function canApproveAtLevel(
  session: Session | null,
  requiredLevel: number,
  businessUnitId?: string
): boolean {
  if (!session?.user?.assignments) return false;

  const relevantAssignments = businessUnitId
    ? session.user.assignments.filter(a => a.businessUnitId === businessUnitId)
    : session.user.assignments;

  return relevantAssignments.some(assignment =>
    assignment.role.level >= requiredLevel &&
    assignment.role.permissions.some(perm => perm.canApprove === true)
  );
}

/**
 * Get user's highest role level across all business units
 */
export function getHighestRoleLevel(session: Session | null): number {
  if (!session?.user?.assignments) return 0;

  return Math.max(...session.user.assignments.map(a => a.role.level));
}

/**
 * Check if user is a member of a specific business unit
 */
export function isMemberOfBusinessUnit(
  session: Session | null,
  businessUnitId: string
): boolean {
  if (!session?.user?.assignments) return false;

  return session.user.assignments.some(a => a.businessUnitId === businessUnitId);
}

/**
 * Get all permissions for a user across all business units
 */
export function getAllUserPermissions(session: Session | null): {
  businessUnitId: string;
  businessUnitName: string;
  roleName: string;
  roleLevel: number;
  permissions: RolePermission[];
}[] {
  if (!session?.user?.assignments) return [];

  return session.user.assignments.map(assignment => ({
    businessUnitId: assignment.businessUnitId,
    businessUnitName: assignment.businessUnit.name,
    roleName: assignment.role.name,
    roleLevel: assignment.role.level,
    permissions: assignment.role.permissions
  }));
}

// Example usage constants for modules (matching your schema)
export const MODULES = {
  PROPERTY: 'PROPERTY',
  RPT: 'RPT',
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  APPROVAL: 'APPROVAL',
  DOCUMENTS: 'DOCUMENTS',
  AUDIT: 'AUDIT',
} as const;

// Role levels (matching your schema description)
export const ROLE_LEVELS = {
  STAFF: 0,
  MANAGER: 1,
  DIRECTOR: 2,
  VP: 3,
  MANAGING_DIRECTOR: 4,
} as const;