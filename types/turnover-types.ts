// types/turnover-types.ts
import { 
  PropertyTurnover,
  TurnoverType,
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

// Property turnover with full details
export interface PropertyTurnoverWithDetails extends PropertyTurnover {
  property: PropertySubset;
  fromBusinessUnit: BusinessUnitSubset | null;
  toBusinessUnit: BusinessUnitSubset | null;
  turnedOverBy: UserSubset | null;
  approvedBy: UserSubset | null;
  receivedBy: UserSubset | null;
  documents: DocumentSubset[];
}

// List item for property turnovers
export interface PropertyTurnoverListItem extends PropertyTurnover {
  property: PropertySubset;
  fromBusinessUnit: BusinessUnitSubset | null;
  toBusinessUnit: BusinessUnitSubset | null;
  turnedOverBy: UserSubset | null;
  _count: {
    documents: number;
  };
}

// Form data types
export interface PropertyTurnoverFormData {
  propertyId: string;
  turnoverType: TurnoverType;
  fromBusinessUnitId?: string;
  toBusinessUnitId?: string;
  purpose?: string;
  notes?: string;
}

export interface PropertyTurnoverUpdateData {
  turnedOverDate?: Date;
  receivedById?: string;
  approvedById?: string;
  status?: TransactionStatus;
  notes?: string;
}

// Filter and sort types
export interface PropertyTurnoverFilters {
  search?: string;
  status?: TransactionStatus;
  turnoverType?: TurnoverType;
  propertyId?: string;
  fromBusinessUnitId?: string;
  toBusinessUnitId?: string;
  turnedOverById?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export type PropertyTurnoverSortField = 
  | 'createdAt' 
  | 'updatedAt' 
  | 'turnedOverDate'
  | 'status' 
  | 'turnoverType';

export type PropertyTurnoverSortOrder = 'asc' | 'desc';

export interface PropertyTurnoverSort {
  field: PropertyTurnoverSortField;
  order: PropertyTurnoverSortOrder;
}

// Statistics
export interface TurnoverStats {
  total: number;
  pending: number;
  approved: number;
  inProgress: number;
  completed: number;
  byType: Record<TurnoverType, number>;
}

// Action results
export interface TurnoverActionResult {
  success: boolean;
  error?: string;
}

export interface CreateTurnoverResult extends TurnoverActionResult {
  turnoverId?: string;
}

export interface UpdateTurnoverResult extends TurnoverActionResult {
  turnover?: PropertyTurnoverWithDetails;
}

// Turnover destination options
export interface TurnoverDestinationOption {
  id: string;
  name: string;
  type: 'BUSINESS_UNIT';
  details?: string;
}