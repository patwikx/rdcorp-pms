// types/user-management-types.ts
import { User, Role, BusinessUnitMember, BusinessUnit } from '@prisma/client';

// User types
export interface UserListItem extends Omit<User, 'passwordHash'> {
  businessUnitMembers: Array<{
    id: string;
    isActive: boolean;
    joinedAt: Date;
    role: {
      id: string;
      name: string;
      description: string | null;
    };
    businessUnit: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
  _count: {
    businessUnitMembers: number;
    createdProperties: number;
  };
}

export interface UserDetails extends Omit<User, 'passwordHash'> {
  businessUnitMembers: Array<{
    id: string;
    isActive: boolean;
    joinedAt: Date;
    updatedAt: Date;
    role: Role;
    businessUnit: BusinessUnit;
  }>;
  _count: {
    businessUnitMembers: number;
    createdProperties: number;
    updatedProperties: number;
    approvals: number;
    releases: number;
    turnovers: number;
    returns: number;
    auditLogs: number;
    createdDocuments: number;
  };
}

export interface UserFormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive: boolean;
  roleId?: string;
}

export interface UserAssignmentFormData {
  userId: string;
  roleId: string;
  businessUnitId: string;
}

// Role types
export interface RoleListItem extends Role {
  _count: {
    businessUnitMembers: number;
  };
}

export interface RoleDetails extends Role {
  businessUnitMembers: Array<{
    id: string;
    isActive: boolean;
    joinedAt: Date;
    user: {
      id: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
    businessUnit: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
  _count: {
    businessUnitMembers: number;
  };
}

export interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

// Business Unit Member types
export interface BusinessUnitMemberListItem extends BusinessUnitMember {
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    isActive: boolean;
  };
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  businessUnit: {
    id: string;
    name: string;
    description: string | null;
  };
}

// Filter and sort types
export interface UserFilters {
  search?: string;
  isActive?: boolean;
  roleId?: string;
  businessUnitId?: string;
}

export interface RoleFilters {
  search?: string;
  hasMembers?: boolean;
}

export type UserSortField = 'firstName' | 'lastName' | 'email' | 'username' | 'createdAt' | 'updatedAt';
export type RoleSortField = 'name' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface UserSort {
  field: UserSortField;
  order: SortOrder;
}

export interface RoleSort {
  field: RoleSortField;
  order: SortOrder;
}

// Stats types
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  recentlyAdded: number;
  byRole: Record<string, number>;
}

export interface RoleStats {
  total: number;
  withMembers: number;
  withoutMembers: number;
  totalPermissions: number;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface CreateUserResult extends ActionResult {
  userId?: string;
}
