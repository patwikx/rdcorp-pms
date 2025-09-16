// types/role-types.ts
import { 
  Role,
  RolePermissions,
} from '@prisma/client';

// User subset for relations
export interface UserSubset {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

// Business unit subset for relations
export interface BusinessUnitSubset {
  id: string;
  name: string;
  description: string | null;
}

// Role permissions with module details
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RolePermissionWithModule extends RolePermissions {
  // No additional fields needed as all info is in the base model
}

// Role with permissions
export interface RoleWithPermissions extends Role {
  permissions: RolePermissionWithModule[];
  _count?: {
    permissions: number;
    businessUnitMembers: number;
  };
}

// Role list item for table display
export interface RoleListItem extends Role {
  permissions: RolePermissionWithModule[];
  _count: {
    permissions: number;
    businessUnitMembers: number;
  };
}

// Role details for the detail view
export interface RoleDetails extends RoleWithPermissions {
  businessUnitMembers: Array<{
    id: string;
    isActive: boolean;
    joinedAt: Date;
    user: UserSubset;
    businessUnit: BusinessUnitSubset;
  }>;
}

// Form data types
export interface RoleFormData {
  name: string;
  description?: string;
  level: number;
  permissions: RolePermissionFormData[];
}

export interface RolePermissionFormData {
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

// Update data types
export interface RoleUpdateData {
  name?: string;
  description?: string;
  level?: number;
}

// Filter and sort types
export interface RoleFilters {
  search?: string;
  level?: number;
  hasPermissions?: boolean;
  hasMembers?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export type RoleSortField = 
  | 'name'
  | 'level'
  | 'createdAt'
  | 'updatedAt';

export type RoleSortOrder = 'asc' | 'desc';

export interface RoleSort {
  field: RoleSortField;
  order: RoleSortOrder;
}

// Statistics
export interface RoleStats {
  total: number;
  byLevel: Record<number, number>;
  withPermissions: number;
  withMembers: number;
  recentlyCreated: number;
  totalPermissions: number;
  avgPermissionsPerRole: number;
}

// Action results
export interface RoleActionResult {
  success: boolean;
  error?: string;
}

export interface CreateRoleResult extends RoleActionResult {
  roleId?: string;
}

export interface UpdateRoleResult extends RoleActionResult {
  role?: RoleWithPermissions;
}

// Available modules for permissions
export const AVAILABLE_MODULES = [
  { value: 'PROPERTY', label: 'Property Management' },
  { value: 'RPT', label: 'Real Property Tax' },
  { value: 'USER_MANAGEMENT', label: 'User Management' },
  { value: 'APPROVAL', label: 'Approval Workflows' },
  { value: 'DOCUMENTS', label: 'Document Management' },
  { value: 'REPORTS', label: 'Reports & Analytics' },
  { value: 'AUDIT', label: 'Audit Logs' },
  { value: 'BUSINESS_UNITS', label: 'Business Units' },
  { value: 'ROLES', label: 'Roles & Permissions' },
  { value: 'SYSTEM', label: 'System Settings' },
] as const;

export type ModuleType = typeof AVAILABLE_MODULES[number]['value'];

// Role level definitions
export const ROLE_LEVELS = [
  { value: 0, label: 'Staff', description: 'Basic operational level' },
  { value: 1, label: 'Manager', description: 'Department management level' },
  { value: 2, label: 'Director', description: 'Division management level' },
  { value: 3, label: 'Vice President', description: 'Executive level' },
  { value: 4, label: 'Managing Director', description: 'Top executive level' },
] as const;

export type RoleLevel = typeof ROLE_LEVELS[number]['value'];

// Permission validation
export interface RolePermissionValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface RoleValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}