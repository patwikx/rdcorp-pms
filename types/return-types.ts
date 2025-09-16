// types/return-types.ts
import { 
  PropertyReturn,
  ReturnType,
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

// Document subset for relations
export interface DocumentSubset extends Document {
  createdBy: UserSubset;
}

// Property return with full details
export interface PropertyReturnWithDetails extends PropertyReturn {
  property: PropertySubset;
  businessUnit: BusinessUnitSubset | null;
  returnedBy: UserSubset | null;
  approvedBy: UserSubset | null;
  receivedBy: UserSubset | null;
  documents: DocumentSubset[];
}

// List item for property returns
export interface PropertyReturnListItem extends PropertyReturn {
  property: PropertySubset;
  businessUnit: BusinessUnitSubset | null;
  returnedBy: UserSubset | null;
  _count: {
    documents: number;
  };
}

// Form data types
export interface PropertyReturnFormData {
  propertyId: string;
  returnType: ReturnType;
  businessUnitId?: string;
  returnedByName?: string;
  reasonForReturn?: string;
  condition?: string;
  notes?: string;
}

export interface PropertyReturnUpdateData {
  dateReturned?: Date;
  receivedById?: string;
  approvedById?: string;
  returnedByName?: string;
  condition?: string;
  status?: TransactionStatus;
  notes?: string;
}

// Filter and sort types
export interface PropertyReturnFilters {
  search?: string;
  status?: TransactionStatus;
  returnType?: ReturnType;
  propertyId?: string;
  businessUnitId?: string;
  returnedById?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export type PropertyReturnSortField = 
  | 'createdAt' 
  | 'updatedAt' 
  | 'dateReturned'
  | 'status' 
  | 'returnType';

export type PropertyReturnSortOrder = 'asc' | 'desc';

export interface PropertyReturnSort {
  field: PropertyReturnSortField;
  order: PropertyReturnSortOrder;
}

// Statistics
export interface ReturnStats {
  total: number;
  pending: number;
  approved: number;
  inProgress: number;
  completed: number;
  byType: Record<ReturnType, number>;
}

// Action results
export interface ReturnActionResult {
  success: boolean;
  error?: string;
}

export interface CreateReturnResult extends ReturnActionResult {
  returnId?: string;
}

export interface UpdateReturnResult extends ReturnActionResult {
  return?: PropertyReturnWithDetails;
}

// Return source options
export interface ReturnSourceOption {
  id: string;
  name: string;
  type: 'BUSINESS_UNIT' | 'BANK';
  details?: string;
}