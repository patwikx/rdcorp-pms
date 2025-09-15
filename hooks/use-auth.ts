// hooks/use-auth.ts
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import {
  hasPermission,
  hasPermissionInBusinessUnit,
  getRoleInBusinessUnit,
  hasMinimumRoleLevel,
  hasMinimumRoleLevelInBusinessUnit,
  getBusinessUnitsWithPermission,
  canApproveAtLevel,
  getHighestRoleLevel,
  isMemberOfBusinessUnit,
  getAllUserPermissions,
} from "@/lib/auth-actions/auth-utils";
import type { RolePermission } from "@/next-auth";

export function useAuth() {
  const { data: session, status } = useSession();

  const authUtils = useMemo(() => {
    return {
      // Basic session info
      user: session?.user || null,
      isAuthenticated: !!session?.user,
      isLoading: status === "loading",
      
      // Permission checks
      hasPermission: (
        module: string,
        permission: keyof Pick<RolePermission, 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete' | 'canApprove'>
      ) => hasPermission(session, module, permission),
      
      hasPermissionInBusinessUnit: (
        businessUnitId: string,
        module: string,
        permission: keyof Pick<RolePermission, 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete' | 'canApprove'>
      ) => hasPermissionInBusinessUnit(session, businessUnitId, module, permission),
      
      // Role checks
      getRoleInBusinessUnit: (businessUnitId: string) => 
        getRoleInBusinessUnit(session, businessUnitId),
      
      hasMinimumRoleLevel: (minimumLevel: number) => 
        hasMinimumRoleLevel(session, minimumLevel),
      
      hasMinimumRoleLevelInBusinessUnit: (businessUnitId: string, minimumLevel: number) => 
        hasMinimumRoleLevelInBusinessUnit(session, businessUnitId, minimumLevel),
      
      // Business unit checks
      isMemberOfBusinessUnit: (businessUnitId: string) => 
        isMemberOfBusinessUnit(session, businessUnitId),
      
      getBusinessUnitsWithPermission: (
        module: string,
        permission: keyof Pick<RolePermission, 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete' | 'canApprove'>
      ) => getBusinessUnitsWithPermission(session, module, permission),
      
      // Approval checks
      canApproveAtLevel: (requiredLevel: number, businessUnitId?: string) => 
        canApproveAtLevel(session, requiredLevel, businessUnitId),
      
      // Utility functions
      getHighestRoleLevel: () => getHighestRoleLevel(session),
      getAllUserPermissions: () => getAllUserPermissions(session),
      
      // Assignments
      assignments: session?.user?.assignments || [],
      businessUnits: session?.user?.assignments?.map(a => a.businessUnit) || [],
      roles: session?.user?.assignments?.map(a => a.role) || [],
    };
  }, [session, status]);

  return authUtils;
}

// Specific hooks for common use cases
export function useCanCreate(module: string, businessUnitId?: string) {
  const { hasPermission, hasPermissionInBusinessUnit } = useAuth();
  
  return businessUnitId 
    ? hasPermissionInBusinessUnit(businessUnitId, module, 'canCreate')
    : hasPermission(module, 'canCreate');
}

export function useCanRead(module: string, businessUnitId?: string) {
  const { hasPermission, hasPermissionInBusinessUnit } = useAuth();
  
  return businessUnitId 
    ? hasPermissionInBusinessUnit(businessUnitId, module, 'canRead')
    : hasPermission(module, 'canRead');
}

export function useCanUpdate(module: string, businessUnitId?: string) {
  const { hasPermission, hasPermissionInBusinessUnit } = useAuth();
  
  return businessUnitId 
    ? hasPermissionInBusinessUnit(businessUnitId, module, 'canUpdate')
    : hasPermission(module, 'canUpdate');
}

export function useCanDelete(module: string, businessUnitId?: string) {
  const { hasPermission, hasPermissionInBusinessUnit } = useAuth();
  
  return businessUnitId 
    ? hasPermissionInBusinessUnit(businessUnitId, module, 'canDelete')
    : hasPermission(module, 'canDelete');
}

export function useCanApprove(module: string, businessUnitId?: string) {
  const { hasPermission, hasPermissionInBusinessUnit } = useAuth();
  
  return businessUnitId 
    ? hasPermissionInBusinessUnit(businessUnitId, module, 'canApprove')
    : hasPermission(module, 'canApprove');
}

export function useUserBusinessUnits() {
  const { businessUnits } = useAuth();
  return businessUnits;
}

export function useUserRoles() {
  const { roles } = useAuth();
  return roles;
}