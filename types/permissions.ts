// types/permissions.ts

// Define all available permissions in the system
export const PERMISSIONS = {
  // System Management
  SYSTEM_MANAGE: 'system:manage',
  SYSTEM_SETTINGS: 'system:settings:update',
  SYSTEM_BACKUP: 'system:backup:create',
  SYSTEM_LOGS: 'system:logs:view',
  
  // User Management
  USERS_CREATE: 'users:create',
  USERS_VIEW: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',
  USERS_RESET_PASSWORD: 'users:reset_password',
  
  // Business Unit Management
  BUSINESS_UNITS_CREATE: 'business_units:create',
  BUSINESS_UNITS_VIEW: 'business_units:read',
  BUSINESS_UNITS_UPDATE: 'business_units:update',
  BUSINESS_UNITS_DELETE: 'business_units:delete',
  BUSINESS_UNITS_MANAGE_MEMBERS: 'business_units:manage_members',
  
  // Property Management
  PROPERTIES_CREATE: 'properties:create',
  PROPERTIES_VIEW: 'properties:read',
  PROPERTIES_UPDATE: 'properties:update',
  PROPERTIES_DELETE: 'properties:delete',
  PROPERTIES_APPROVE: 'properties:approve',
  PROPERTIES_RELEASE: 'properties:release',
  PROPERTIES_TURNOVER: 'properties:turnover',
  PROPERTIES_RETURN: 'properties:return',
  PROPERTIES_BULK_OPS: 'properties:bulk_operations',
  
  // Property Operations
  PROPERTY_APPROVALS_CREATE: 'property_approvals:create',
  PROPERTY_APPROVALS_VIEW: 'property_approvals:read',
  PROPERTY_APPROVALS_APPROVE: 'property_approvals:approve',
  
  PROPERTY_RELEASES_CREATE: 'property_releases:create',
  PROPERTY_RELEASES_VIEW: 'property_releases:read',
  PROPERTY_RELEASES_APPROVE: 'property_releases:approve',
  
  PROPERTY_TURNOVERS_CREATE: 'property_turnovers:create',
  PROPERTY_TURNOVERS_VIEW: 'property_turnovers:read',
  PROPERTY_TURNOVERS_APPROVE: 'property_turnovers:approve',
  
  PROPERTY_RETURNS_CREATE: 'property_returns:create',
  PROPERTY_RETURNS_VIEW: 'property_returns:read',
  
  // Reports and Analytics
  REPORTS_VIEW: 'reports:view_all',
  REPORTS_VIEW_ASSIGNED: 'reports:view_assigned',
  REPORTS_VIEW_DEPARTMENT: 'reports:view_department',
  REPORTS_VIEW_FINANCIAL: 'reports:view_financial',
  REPORTS_VIEW_LEGAL: 'reports:view_legal',
  REPORTS_VIEW_AUDIT: 'reports:view_audit',
  REPORTS_CREATE: 'reports:create',
  REPORTS_CREATE_BASIC: 'reports:create_basic',
  REPORTS_CREATE_FINANCIAL: 'reports:create_financial',
  REPORTS_CREATE_LEGAL: 'reports:create_legal',
  REPORTS_CREATE_AUDIT: 'reports:create_audit',
  REPORTS_EXPORT: 'reports:export',
  REPORTS_EXPORT_FINANCIAL: 'reports:export_financial',
  REPORTS_EXPORT_AUDIT: 'reports:export_audit',
  
  // Analytics
  ANALYTICS_VIEW_ALL: 'analytics:view_all',
  ANALYTICS_VIEW_ASSIGNED: 'analytics:view_assigned',
  ANALYTICS_VIEW_DEPARTMENT: 'analytics:view_department',
  ANALYTICS_VIEW_FINANCIAL: 'analytics:view_financial',
  ANALYTICS_VIEW_BASIC: 'analytics:view_basic',
  
  // Audit and Compliance
  AUDIT_VIEW: 'audit_logs:view',
  AUDIT_VIEW_OWN: 'audit_logs:view_own',
  AUDIT_VIEW_DEPARTMENT: 'audit_logs:view_department',
  AUDIT_VIEW_FINANCIAL: 'audit_logs:view_financial',
  AUDIT_VIEW_LEGAL: 'audit_logs:view_legal',
  AUDIT_EXPORT: 'audit_logs:export',
  AUDIT_ANALYZE: 'audit_logs:analyze',
  
  // Roles Management
  ROLES_CREATE: 'roles:create',
  ROLES_VIEW: 'roles:read',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  ROLES_ASSIGN: 'roles:assign',
  
  // Compliance
  COMPLIANCE_VIEW: 'compliance:view',
  COMPLIANCE_MANAGE: 'compliance:manage',
  COMPLIANCE_UPDATE: 'compliance:update',
  COMPLIANCE_REPORTS: 'compliance:reports',
  COMPLIANCE_AUDIT: 'compliance:audit',
  
  // Legal Documents
  LEGAL_DOCS_CREATE: 'legal_documents:create',
  LEGAL_DOCS_VIEW: 'legal_documents:read',
  LEGAL_DOCS_UPDATE: 'legal_documents:update',
  LEGAL_DOCS_APPROVE: 'legal_documents:approve',
  
  // Property Financial
  PROPERTIES_VIEW_FINANCIAL: 'properties:view_financial',
  PROPERTIES_UPDATE_FINANCIAL: 'properties:update_financial',
  PROPERTY_VALUATIONS_CREATE: 'property_valuations:create',
  PROPERTY_VALUATIONS_VIEW: 'property_valuations:read',
  PROPERTY_VALUATIONS_UPDATE: 'property_valuations:update',
  
  // Property Legal
  PROPERTIES_VIEW_LEGAL: 'properties:view_legal',
  PROPERTIES_UPDATE_LEGAL: 'properties:update_legal',
  PROPERTY_APPROVALS_CREATE_LEGAL: 'property_approvals:create_legal',
  PROPERTY_APPROVALS_APPROVE_LEGAL: 'property_approvals:approve_legal',
  
  // Profile Management
  PROFILE_VIEW: 'profile:read',
  PROFILE_UPDATE_BASIC: 'profile:update_basic',
} as const;

// Define available roles
export const ROLES = {
  SYSTEM_ADMINISTRATOR: 'System Administrator',
  PROPERTY_MANAGER: 'Property Manager',
  PROPERTY_SUPERVISOR: 'Property Supervisor',
  PROPERTY_OFFICER: 'Property Officer',
  FINANCE_MANAGER: 'Finance Manager',
  LEGAL_OFFICER: 'Legal Officer',
  VIEWER: 'Viewer',
  AUDITOR: 'Auditor',
} as const;

// Type definitions for TypeScript
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type Role = typeof ROLES[keyof typeof ROLES];

// Helper function to check if a permission exists
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(PERMISSIONS).includes(permission as Permission);
}

// Helper function to check if a role exists
export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role);
}

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  SYSTEM: [
    PERMISSIONS.SYSTEM_MANAGE,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_LOGS,
  ],
  USER_MANAGEMENT: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_MANAGE_ROLES,
    PERMISSIONS.USERS_RESET_PASSWORD,
  ],
  BUSINESS_UNIT_MANAGEMENT: [
    PERMISSIONS.BUSINESS_UNITS_CREATE,
    PERMISSIONS.BUSINESS_UNITS_VIEW,
    PERMISSIONS.BUSINESS_UNITS_UPDATE,
    PERMISSIONS.BUSINESS_UNITS_DELETE,
    PERMISSIONS.BUSINESS_UNITS_MANAGE_MEMBERS,
  ],
  PROPERTY_MANAGEMENT: [
    PERMISSIONS.PROPERTIES_CREATE,
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.PROPERTIES_UPDATE,
    PERMISSIONS.PROPERTIES_DELETE,
    PERMISSIONS.PROPERTIES_APPROVE,
    PERMISSIONS.PROPERTIES_RELEASE,
    PERMISSIONS.PROPERTIES_TURNOVER,
    PERMISSIONS.PROPERTIES_RETURN,
    PERMISSIONS.PROPERTIES_BULK_OPS,
  ],
  REPORTS: [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW_ASSIGNED,
    PERMISSIONS.REPORTS_VIEW_DEPARTMENT,
    PERMISSIONS.REPORTS_VIEW_FINANCIAL,
    PERMISSIONS.REPORTS_VIEW_LEGAL,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  AUDIT: [
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_VIEW_OWN,
    PERMISSIONS.AUDIT_VIEW_DEPARTMENT,
    PERMISSIONS.AUDIT_EXPORT,
    PERMISSIONS.AUDIT_ANALYZE,
  ],
} as const;