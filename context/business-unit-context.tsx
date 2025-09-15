// context/business-unit-context.tsx
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { UserAssignment, RolePermission } from '@/next-auth';

interface BusinessUnit {
  id: string;
  name: string;
  description: string | null;
}

interface BusinessUnitContextValue {
  businessUnitId: string;
  businessUnit: BusinessUnit;
  userAssignments: UserAssignment[];
  currentAssignment: UserAssignment | null;
  
  // Permission helpers for current business unit
  hasPermission: (
    module: string,
    permission: keyof Pick<RolePermission, 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete' | 'canApprove'>
  ) => boolean;
  
  // Role helpers for current business unit
  getRoleLevel: () => number;
  getRoleName: () => string | null;
  canApprove: (module?: string) => boolean;
  
  // Get all permissions for current business unit
  getAllPermissions: () => RolePermission[];
}

const BusinessUnitContext = createContext<BusinessUnitContextValue | null>(null);

interface BusinessUnitProviderProps {
  children: React.ReactNode;
  businessUnitId: string;
  businessUnit: BusinessUnit;
  userAssignments: UserAssignment[];
}

export function BusinessUnitProvider({
  children,
  businessUnitId,
  businessUnit,
  userAssignments,
}: BusinessUnitProviderProps) {
  const contextValue = useMemo(() => {
    // Find the current assignment for this business unit
    const currentAssignment = userAssignments.find(
      assignment => assignment.businessUnitId === businessUnitId
    ) || null;

    const hasPermission = (
      module: string,
      permission: keyof Pick<RolePermission, 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete' | 'canApprove'>
    ): boolean => {
      if (!currentAssignment) return false;
      
      return currentAssignment.role.permissions.some(perm =>
        perm.module === module && perm[permission] === true
      );
    };

    const getRoleLevel = (): number => {
      return currentAssignment?.role.level || 0;
    };

    const getRoleName = (): string | null => {
      return currentAssignment?.role.name || null;
    };

    const canApprove = (module?: string): boolean => {
      if (!currentAssignment) return false;
      
      if (module) {
        return currentAssignment.role.permissions.some(perm =>
          perm.module === module && perm.canApprove === true
        );
      }
      
      // Check if user can approve in any module
      return currentAssignment.role.permissions.some(perm => perm.canApprove === true);
    };

    const getAllPermissions = (): RolePermission[] => {
      return currentAssignment?.role.permissions || [];
    };

    return {
      businessUnitId,
      businessUnit,
      userAssignments,
      currentAssignment,
      hasPermission,
      getRoleLevel,
      getRoleName,
      canApprove,
      getAllPermissions,
    };
  }, [businessUnitId, businessUnit, userAssignments]);

  return (
    <BusinessUnitContext.Provider value={contextValue}>
      {children}
    </BusinessUnitContext.Provider>
  );
}

export function useBusinessUnit() {
  const context = useContext(BusinessUnitContext);
  
  if (!context) {
    throw new Error('useBusinessUnit must be used within a BusinessUnitProvider');
  }
  
  return context;
}

// Additional custom hooks for specific use cases
export function useCurrentBusinessUnitPermissions() {
  const { getAllPermissions } = useBusinessUnit();
  return getAllPermissions();
}

export function useCurrentBusinessUnitRole() {
  const { currentAssignment } = useBusinessUnit();
  return currentAssignment?.role || null;
}

export function useCanCreateInCurrentBU(module: string) {
  const { hasPermission } = useBusinessUnit();
  return hasPermission(module, 'canCreate');
}

export function useCanReadInCurrentBU(module: string) {
  const { hasPermission } = useBusinessUnit();
  return hasPermission(module, 'canRead');
}

export function useCanUpdateInCurrentBU(module: string) {
  const { hasPermission } = useBusinessUnit();
  return hasPermission(module, 'canUpdate');
}

export function useCanDeleteInCurrentBU(module: string) {
  const { hasPermission } = useBusinessUnit();
  return hasPermission(module, 'canDelete');
}

export function useCanApproveInCurrentBU(module: string) {
  const { hasPermission } = useBusinessUnit();
  return hasPermission(module, 'canApprove');
}