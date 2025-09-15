// types/property-types.ts
import { 
  Property, 
  PropertyClassification, 
  PropertyStatus, 
  BusinessUnit, 
  User, 
  Document, 
  PropertyApproval, 
  PropertyRelease, 
  PropertyTurnover, 
  PropertyReturn, 
  RealPropertyTax,
} from '@prisma/client';

// User subset type for relations
export interface UserSubset {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

// Document with creator relation
export interface DocumentWithCreator extends Document {
  createdBy: UserSubset;
}

// Property approval with approver relation
export interface PropertyApprovalWithApprover extends PropertyApproval {
  approver: UserSubset;
}

// Property release with user relations
export interface PropertyReleaseWithUsers extends PropertyRelease {
  releasedBy: UserSubset | null;
  approvedBy: UserSubset | null;
  receivedBy: UserSubset | null;
}

// Property turnover with user relations
export interface PropertyTurnoverWithUsers extends PropertyTurnover {
  turnedOverBy: UserSubset | null;
  receivedBy: UserSubset | null;
}

// Property return with user relations
export interface PropertyReturnWithUsers extends PropertyReturn {
  returnedBy: UserSubset | null;
  receivedBy: UserSubset | null;
}

// Base property type with relations
export interface PropertyWithRelations extends Omit<Property, 'area'> {
  area: number; // Convert Decimal to number
  businessUnit: BusinessUnit;
  createdBy: User;
  updatedBy: User | null;
  documents: DocumentWithCreator[];
  approvals: PropertyApprovalWithApprover[];
  releases: PropertyReleaseWithUsers[];
  turnovers: PropertyTurnoverWithUsers[];
  returns: PropertyReturnWithUsers[];
  rptRecords: RealPropertyTax[];
}

// Property list item for table display
export interface PropertyListItem extends Omit<Property, 'area'> {
  area: number; // Convert Decimal to number
  businessUnit: {
    id: string;
    name: string;
  };
  createdBy: UserSubset;
  _count: {
    documents: number;
    approvals: number;
    releases: number;
    turnovers: number;
    returns: number;
  };
}

// Property details for the detail view
export interface PropertyDetails extends PropertyWithRelations {
  _count: {
    documents: number;
    approvals: number;
    releases: number;
    turnovers: number;
    returns: number;
    rptRecords: number;
  };
}

// Property form data
export interface PropertyFormData {
  titleNumber: string;
  lotNumber: string;
  location: string;
  area: number;
  description?: string;
  registeredOwner: string;
  encumbranceMortgage?: string;
  borrowerMortgagor?: string;
  bank?: string;
  custodyOriginalTitle?: string;
  propertyClassification: PropertyClassification;
  status: PropertyStatus;
  taxDeclaration?: string;
  remarks?: string;
}

// Property filters
export interface PropertyFilters {
  search?: string;
  status?: PropertyStatus;
  classification?: PropertyClassification;
  location?: string;
  registeredOwner?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Property sort options
export type PropertySortField =
  | 'titleNumber'
  | 'lotNumber'
  | 'location'
  | 'area'
  | 'registeredOwner'
  | 'status'
  | 'createdAt'
  | 'updatedAt';

export type PropertySortOrder = 'asc' | 'desc';

export interface PropertySort {
  field: PropertySortField;
  order: PropertySortOrder;
}

// Property statistics
export interface PropertyStats {
  total: number;
  byStatus: Record<PropertyStatus, number>;
  byClassification: Record<PropertyClassification, number>;
  totalArea: number;
  recentlyAdded: number;
  pendingApprovals: number;
}