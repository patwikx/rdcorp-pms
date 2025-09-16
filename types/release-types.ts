// types/release-types.ts
import { 
  PropertyRelease,
  ReleaseType,
  TransactionStatus,
  Document
} from '@prisma/client';

// User subset for relations
export interface UserSubset {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

// Property subset for relations
export interface PropertySubset {
  id: string;
  titleNumber: string;
  propertyName: string;
  location: string;
  status: string;
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

// Document subset for relations
export interface DocumentSubset extends Document {
  createdBy: UserSubset;
}

// Property release with full details
export interface PropertyReleaseWithDetails extends PropertyRelease {
  property: PropertySubset;
  businessUnit: BusinessUnitSubset | null;
  bank: BankSubset | null;
  releasedBy: UserSubset | null;
  approvedBy: UserSubset | null;
  receivedBy: UserSubset | null;
  documents: DocumentSubset[];
}

// List item for property releases
export interface PropertyReleaseListItem extends PropertyRelease {
  property: PropertySubset;
  businessUnit: BusinessUnitSubset | null;
  bank: BankSubset | null;
  releasedBy: UserSubset | null;
  _count: {
    documents: number;
  };
}

// Form data types
export interface PropertyReleaseFormData {
  propertyId: string;
  releaseType: ReleaseType;
  businessUnitId?: string;
  bankId?: string;
  expectedReturnDate?: Date;
  purposeOfRelease: string;
  receivedByName?: string;
  transmittalNumber?: string;
  notes?: string;
}

export interface PropertyReleaseUpdateData {
  dateReleased?: Date;
  receivedById?: string;
  receivedByName?: string;
  transmittalNumber?: string;
  status?: TransactionStatus;
  notes?: string;
}

// Filter and sort types
export interface PropertyReleaseFilters {
  search?: string;
  status?: TransactionStatus;
  releaseType?: ReleaseType;
  propertyId?: string;
  businessUnitId?: string;
  bankId?: string;
  releasedById?: string;
  dateFrom?: Date;
  dateTo?: Date;
  expectedReturnFrom?: Date;
  expectedReturnTo?: Date;
}

export type PropertyReleaseSortField = 
  | 'createdAt' 
  | 'updatedAt' 
  | 'dateReleased'
  | 'expectedReturnDate'
  | 'status' 
  | 'releaseType';

export type PropertyReleaseSortOrder = 'asc' | 'desc';

export interface PropertyReleaseSort {
  field: PropertyReleaseSortField;
  order: PropertyReleaseSortOrder;
}

// Statistics
export interface ReleaseStats {
  total: number;
  pending: number;
  approved: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byType: Record<ReleaseType, number>;
  byDestination: Record<string, number>;
}

// Action results
export interface ReleaseActionResult {
  success: boolean;
  error?: string;
}

export interface CreateReleaseResult extends ReleaseActionResult {
  releaseId?: string;
}

export interface UpdateReleaseResult extends ReleaseActionResult {
  release?: PropertyReleaseWithDetails;
}

// Release destination options
export interface ReleaseDestinationOption {
  id: string;
  name: string;
  type: 'BUSINESS_UNIT' | 'BANK';
  details?: string;
}