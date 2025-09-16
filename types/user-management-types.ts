// types/user-management-types.ts
import { 
  User,
  BusinessUnitMember,
  RolePermissions
} from '@prisma/client';

// Role subset for relations
export interface RoleSubset {
  id: string;
  name: string;
  description: string | null;
  level: number;
}

// Business unit subset for relations
export interface BusinessUnitSubset {
  id: string;
  name: string;
  description: string | null;
}

// Role with permissions for user assignments
export interface RoleWithPermissions extends RoleSubset {
  permissions: RolePermissions[];
}

// Business unit member with role and business unit details
export interface BusinessUnitMemberWithDetails extends BusinessUnitMember {
  role: RoleWithPermissions;
  businessUnit: BusinessUnitSubset;
}

// User with business unit memberships
export interface UserWithMemberships extends User {
  businessUnitMembers: BusinessUnitMemberWithDetails[];
  _count?: {
    businessUnitMembers: number;
    createdProperties: number;
    updatedProperties: number;
    releases: number;
    turnovers: number;
    returns: number;
    auditLogs: number;
    createdDocuments: number;
  };
}

// User list item for table display
export interface UserListItem extends User {
  businessUnitMembers: Array<{
    id: string;
    isActive: boolean;
    joinedAt: Date;
    role: RoleSubset;
    businessUnit: BusinessUnitSubset;
  }>;
  _count: {
    businessUnitMembers: number;
    createdProperties: number;
  };
}

// User details for the detail view
export interface UserDetails extends UserWithMemberships {
  _count: {
    businessUnitMembers: number;
    createdProperties: number;
    updatedProperties: number;
    releases: number;
    turnovers: number;
    returns: number;
    auditLogs: number;
    createdDocuments: number;
  };
}

// Form data types
export interface UserFormData {
  username?: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  isActive: boolean;
  roleId?: string; // For initial assignment
}

export interface UserAssignmentFormData {
  userId: string;
  businessUnitId: string;
  roleId: string;
}

export interface UserUpdateData {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

// Filter and sort types
export interface UserFilters {
  search?: string;
  isActive?: boolean;
  roleId?: string;
  businessUnitId?: string;
  hasAssignments?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export type UserSortField = 
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'username'
  | 'createdAt'
  | 'updatedAt'
  | 'isActive';

export type UserSortOrder = 'asc' | 'desc';

export interface UserSort {
  field: UserSortField;
  order: UserSortOrder;
}

// User assignment filters and sorts
export interface UserAssignmentFilters {
  search?: string;
  businessUnitId?: string;
  roleId?: string;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export type UserAssignmentSortField = 
  | 'joinedAt'
  | 'updatedAt'
  | 'isActive';

export interface UserAssignmentSort {
  field: UserAssignmentSortField;
  order: UserSortOrder;
}

// Statistics
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  recentlyAdded: number;
  byRole: Record<string, number>;
}

export interface UserAssignmentStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  byBusinessUnit: Record<string, number>;
  recentAssignments: number;
}

// Action results
export interface UserActionResult {
  success: boolean;
  error?: string;
}

export interface CreateUserResult extends UserActionResult {
  userId?: string;
}

export interface UpdateUserResult extends UserActionResult {
  user?: UserWithMemberships;
}

export interface AssignmentActionResult {
  success: boolean;
  error?: string;
}

// User validation
export interface UserValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// User assignment list item
export interface UserAssignmentListItem extends BusinessUnitMember {
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    isActive: boolean;
  };
  role: RoleSubset;
  businessUnit: BusinessUnitSubset;
}

// User assignment details
export interface UserAssignmentDetails extends BusinessUnitMemberWithDetails {
  user: UserDetails;
}

// User assignment details for editing
export interface UserAssignmentDetails extends BusinessUnitMember {
  user: UserDetails;
  role: RoleWithPermissions;
  businessUnit: BusinessUnitSubset;
}

// Filter options
export interface UserFilterOptions {
  roles: Array<{ id: string; name: string; count: number }>;
  businessUnits: Array<{ id: string; name: string; count: number }>;
}

export interface UserAssignmentFilterOptions {
  roles: Array<{ id: string; name: string; level: number; count: number }>;
  businessUnits: Array<{ id: string; name: string; count: number }>;
  users: Array<{ id: string; name: string; email: string }>;
}