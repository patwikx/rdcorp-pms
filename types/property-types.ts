// types/property-types.ts
import { 
  Property, 
  PropertyClassification, 
  PropertyStatus,
  PropertyLocation,
  BusinessUnit, 
  User, 
  Document, 
  ApprovalRequest,
  ApprovalStepResponse,
  ApprovalStep,
  PropertyRelease, 
  PropertyTurnover, 
  PropertyReturn, 
  PropertyMovement,
  RealPropertyTax,
  RPTPayment,
  Prisma,
} from '@prisma/client';

// User subset type for relations
export interface UserSubset {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

// Business unit subset for relations
export interface BusinessUnitSubset {
  id: string;
  name: string;
}

// Bank subset for relations
export interface BankSubset {
  id: string;
  name: string;
  branchName: string;
}

// Role subset for relations
export interface RoleSubset {
  id: string;
  name: string;
  level: number;
}

// Document with creator relation
export interface DocumentWithCreator extends Document {
  createdBy: UserSubset;
}

// Approval step with role
export interface ApprovalStepWithRole extends ApprovalStep {
  role: RoleSubset;
}

// Approval step response with user and step details
export interface ApprovalStepResponseWithDetails extends ApprovalStepResponse {
  respondedBy: UserSubset;
  step: ApprovalStepWithRole;
}

// Approval request with relations
export interface ApprovalRequestWithDetails extends ApprovalRequest {
  requestedBy: UserSubset;
  responses: ApprovalStepResponseWithDetails[];
}

// Property release with user and entity relations
export interface PropertyReleaseWithDetails extends PropertyRelease {
  releasedBy: UserSubset | null;
  approvedBy: UserSubset | null;
  receivedBy: UserSubset | null;
  businessUnit: BusinessUnitSubset | null;
  bank: BankSubset | null;
}

// Property turnover with user and business unit relations
export interface PropertyTurnoverWithDetails extends PropertyTurnover {
  turnedOverBy: UserSubset | null;
  receivedBy: UserSubset | null;
  approvedBy: UserSubset | null;
  fromBusinessUnit: BusinessUnitSubset | null;
  toBusinessUnit: BusinessUnitSubset | null;
}

// Property return with user and business unit relations
export interface PropertyReturnWithDetails extends PropertyReturn {
  returnedBy: UserSubset | null;
  receivedBy: UserSubset | null;
  approvedBy: UserSubset | null;
  businessUnit: BusinessUnitSubset | null;
}

// RPT record with payments
export interface RealPropertyTaxWithPayments extends RealPropertyTax {
  payments: RPTPayment[];
}

// Base property type with relations
export interface PropertyWithRelations extends Omit<Property, 'area'> {
  area: number; // Convert Decimal to number
  businessUnit: BusinessUnit;
  createdBy: User;
  updatedBy: User | null;
  custodian: UserSubset;
  bank: BankSubset | null;
  documents: DocumentWithCreator[];
  approvalRequests: ApprovalRequestWithDetails[];
  releases: PropertyReleaseWithDetails[];
  turnovers: PropertyTurnoverWithDetails[];
  returns: PropertyReturnWithDetails[];
  rptRecords: RealPropertyTaxWithPayments[];
  movements: PropertyMovement[];
}

// Property list item for table display
export interface PropertyListItem extends Omit<Property, 'area'> {
  area: number; // Convert Decimal to number
  businessUnit: BusinessUnitSubset;
  createdBy: UserSubset;
  custodian: UserSubset;
  bank: BankSubset | null;
  _count: {
    documents: number;
    approvalRequests: number;
    releases: number;
    turnovers: number;
    returns: number;
  };
}

// Property details for the detail view
export interface PropertyDetails extends PropertyWithRelations {
  _count: {
    documents: number;
    approvalRequests: number;
    releases: number;
    turnovers: number;
    returns: number;
    rptRecords: number;
    movements: number;
  };
}

// Property form data
export interface PropertyFormData {
  propertyName: string;
  titleNumber: string;
  lotNumber: string;
  location: string;
  area: number;
  description?: string;
  registeredOwner: string;
  encumbranceMortgage?: string;
  borrowerMortgagor?: string;
  bankId?: string;
  custodianId?: string;
  propertyClassification: PropertyClassification;
  status: PropertyStatus;
  currentLocation: PropertyLocation;
  taxDeclaration?: string;
  remarks?: string;
}

// Property filters
export interface PropertyFilters {
  search?: string;
  status?: PropertyStatus;
  classification?: PropertyClassification;
  currentLocation?: PropertyLocation;
  location?: string;
  registeredOwner?: string;
  custodianId?: string;
  bankId?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Property sort options
export type PropertySortField =
  | 'propertyName'
  | 'titleNumber'
  | 'lotNumber'
  | 'location'
  | 'area'
  | 'registeredOwner'
  | 'propertyClassification'
  | 'status'
  | 'currentLocation'
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
  byLocation: Record<string, number>; // Based on currentLocation enum
  totalArea: number;
  recentlyAdded: number;
  pendingApprovals: number;
}

// Property movement tracking types
export interface PropertyMovementData {
  propertyId: string;
  movementType: string;
  fromLocation: PropertyLocation;
  toLocation: PropertyLocation;
  fromCustodian?: string;
  toCustodian?: string;
  bankId?: string;
  businessUnitId?: string;
  referenceId?: string;
  referenceType?: string;
  movementDate: Date;
  expectedReturnDate?: Date;
  notes?: string;
}

// Property custody transfer data
export interface PropertyCustodyTransfer {
  propertyId: string;
  fromCustodianId: string;
  toCustodianId: string;
  transferDate: Date;
  reason: string;
  notes?: string;
}

// Bank custody data
export interface PropertyBankCustody {
  propertyId: string;
  bankId: string;
  custodyDate: Date;
  expectedReturnDate?: Date;
  purpose: string;
  notes?: string;
}

// Property validation types
export interface PropertyValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Property search and filter options
export interface PropertyFilterOptions {
  statuses: { value: PropertyStatus; label: string; count: number }[];
  classifications: { value: PropertyClassification; label: string; count: number }[];
  locations: { value: PropertyLocation; label: string; count: number }[];
  custodians: { id: string; name: string; count: number }[];
  banks: { id: string; name: string; branchName: string; count: number }[];
  businessUnits: { id: string; name: string; count: number }[];
}

const bankData = Prisma.validator<Prisma.BankDefaultArgs>()({
  select: {
    id: true,
    name: true,
    branchName: true,
  },
});
export type BankData = Prisma.BankGetPayload<typeof bankData>;
export type BankList = BankData[];

/**
 * Type for a user with only ID and name, suitable for display in a list.
 * This is used for lists of custodians.
 */
const userData = Prisma.validator<Prisma.UserDefaultArgs>()({
  select: {
    id: true,
    firstName: true,
    lastName: true,
  },
});
export type UserData = Prisma.UserGetPayload<typeof userData>;
export type UserList = { id: string; name: string }[];