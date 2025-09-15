// /types/business-unit-types.ts

export interface BusinessUnitItem {
  id: string;
  name: string;
  description: string | null;
}

export interface BusinessUnitWithMembers extends BusinessUnitItem {
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members: number;
    properties: number;
  };
}

export interface BusinessUnitMemberItem {
  id: string;
  userId: string;
  businessUnitId: string;
  roleId: string;
  isActive: boolean;
  joinedAt: Date;
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
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

export interface BusinessUnitFormData {
  name: string;
  description?: string;
  address?: string;
  isActive?: boolean;
}

export interface BusinessUnitContextType {
  businessUnitId: string;
  businessUnit: BusinessUnitItem;
  userRole: string | null;
  userPermissions: string[] | null;
  canManageProperties: boolean;
  canApproveProperties: boolean;
  canManageUsers: boolean;
}