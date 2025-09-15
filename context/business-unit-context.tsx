// context/business-unit-context.tsx
'use client';

import { createContext, useContext, useMemo } from 'react';
import type { UserAssignment } from '@/next-auth';

interface BusinessUnitItem {
  id: string;
  name: string;
  description: string | null;
}

interface BusinessUnitContextType {
  businessUnitId: string;
  businessUnit: BusinessUnitItem;
  userRole: string | null;
  userRoleId: string | null;
  userPermissions: string[];
  userAssignments: UserAssignment[];
  // Permission helpers
  canManageProperties: boolean;
  canApproveProperties: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewReports: boolean;
  canManageBusinessUnit: boolean;
  canViewAuditLogs: boolean;
  canManageSystem: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  // Utility functions
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
}

const BusinessUnitContext = createContext<BusinessUnitContextType | null>(null);

export function useBusinessUnit() {
  const context = useContext(BusinessUnitContext);
  if (!context) {
    throw new Error('useBusinessUnit must be used within a BusinessUnitProvider');
  }
  return context;
}

interface BusinessUnitProviderProps {
  children: React.ReactNode;
  businessUnitId: string;
  businessUnit: BusinessUnitItem;
  userAssignments: UserAssignment[];
}

export function BusinessUnitProvider({ 
  children, 
  businessUnitId, 
  businessUnit, 
  userAssignments 
}: BusinessUnitProviderProps) {
  
  const contextValue = useMemo(() => {
    // Find the current user's assignment for this business unit
    const currentAssignment = userAssignments.find(
      assignment => assignment.businessUnitId === businessUnitId
    );

    const userRole = currentAssignment?.role.name || null;
    const userRoleId = currentAssignment?.role.id || null;
    const userPermissions = currentAssignment?.role.permissions || [];

    // Permission checking utilities
    const hasPermission = (permission: string): boolean => {
      return userPermissions.includes(permission);
    };

    const hasRole = (roleName: string): boolean => {
      return userRole === roleName;
    };

    const hasAnyRole = (roleNames: string[]): boolean => {
      return userRole ? roleNames.includes(userRole) : false;
    };

    // Define admin roles based on your seed data
    const adminRoles = ['System Administrator'];
    const managerRoles = ['Property Manager', 'Property Supervisor', 'Finance Manager', 'Legal Officer'];
    
    const isAdmin = hasAnyRole(adminRoles);
    const isSuperAdmin = hasRole('System Administrator');

    // Define specific permission checks based on your seed permissions
    const canManageProperties = 
      isAdmin || 
      hasPermission('properties:create') ||
      hasPermission('properties:update') ||
      hasPermission('properties:delete') ||
      hasAnyRole(['Property Manager', 'Property Supervisor', 'Property Officer']);

    const canApproveProperties = 
      isAdmin || 
      hasPermission('properties:approve') || 
      hasAnyRole(['Property Supervisor', 'Property Manager']);

    const canManageUsers = 
      isAdmin || 
      hasPermission('users:create') ||
      hasPermission('users:update') ||
      hasPermission('users:delete') ||
      hasPermission('users:manage_roles');

    const canManageRoles = 
      isAdmin || 
      hasPermission('roles:create') ||
      hasPermission('roles:update') ||
      hasPermission('roles:delete');

    const canViewReports = 
      isAdmin || 
      hasPermission('reports:view_all') ||
      hasPermission('reports:view_assigned') ||
      hasPermission('reports:view_department') ||
      hasPermission('reports:view_financial') ||
      hasPermission('reports:view_legal') ||
      hasAnyRole(managerRoles);

    const canManageBusinessUnit = 
      isAdmin || 
      hasPermission('business_units:update') ||
      hasPermission('business_units:manage_members');

    const canViewAuditLogs = 
      isAdmin ||
      hasPermission('audit_logs:view') ||
      hasPermission('audit_logs:view_department') ||
      hasPermission('audit_logs:view_financial') ||
      hasPermission('audit_logs:view_legal') ||
      hasRole('Auditor');

    const canManageSystem = 
      isAdmin ||
      hasPermission('system:manage') ||
      hasPermission('system:settings:update');

    return {
      businessUnitId,
      businessUnit,
      userRole,
      userRoleId,
      userPermissions,
      userAssignments,
      canManageProperties,
      canApproveProperties,
      canManageUsers,
      canManageRoles,
      canViewReports,
      canManageBusinessUnit,
      canViewAuditLogs,
      canManageSystem,
      isAdmin,
      isSuperAdmin,
      hasPermission,
      hasRole,
      hasAnyRole,
    };
  }, [businessUnitId, businessUnit, userAssignments]);

  return (
    <BusinessUnitContext.Provider value={contextValue}>
      {children}
    </BusinessUnitContext.Provider>
  );
}

// Additional hook for permission checking
export function usePermissions() {
  const context = useBusinessUnit();
  
  return {
    canManageProperties: context.canManageProperties,
    canApproveProperties: context.canApproveProperties,
    canManageUsers: context.canManageUsers,
    canManageRoles: context.canManageRoles,
    canViewReports: context.canViewReports,
    canManageBusinessUnit: context.canManageBusinessUnit,
    canViewAuditLogs: context.canViewAuditLogs,
    canManageSystem: context.canManageSystem,
    isAdmin: context.isAdmin,
    isSuperAdmin: context.isSuperAdmin,
    userRole: context.userRole,
    userRoleId: context.userRoleId,
    userPermissions: context.userPermissions,
    hasPermission: context.hasPermission,
    hasRole: context.hasRole,
    hasAnyRole: context.hasAnyRole,
  };
}

// Hook for getting current business unit info
export function useCurrentBusinessUnit() {
  const context = useBusinessUnit();
  
  return {
    businessUnitId: context.businessUnitId,
    businessUnit: context.businessUnit,
    userRole: context.userRole,
    userRoleId: context.userRoleId,
  };
}