// types/approval-types.ts
import { 
  ApprovalWorkflow,
  ApprovalStep,
  ApprovalRequest,
  ApprovalStepResponse,
  ApprovalRequestStatus,
  ApprovalStatus,
} from '@prisma/client';

// User subset for relations
export interface UserSubset {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

// Role subset for relations
export interface RoleSubset {
  id: string;
  name: string;
  level: number;
}

// Property subset for relations
export interface PropertySubset {
  id: string;
  titleNumber: string;
  propertyName: string;
  location: string;
}

// Approval workflow with steps
export interface ApprovalWorkflowWithSteps extends ApprovalWorkflow {
  steps: ApprovalStepWithRole[];
}

// Approval step with role
export interface ApprovalStepWithRole extends ApprovalStep {
  role: RoleSubset;
}

// Approval step response with details
export interface ApprovalStepResponseWithDetails extends ApprovalStepResponse {
  respondedBy: UserSubset;
  step: ApprovalStepWithRole;
}

// Approval request with full details
export interface ApprovalRequestWithDetails extends ApprovalRequest {
  workflow: ApprovalWorkflow;
  property: PropertySubset;
  requestedBy: UserSubset;
  responses: ApprovalStepResponseWithDetails[];
}

// List item for approval requests
export interface ApprovalRequestListItem extends ApprovalRequest {
  property: PropertySubset;
  requestedBy: UserSubset;
  workflow: {
    id: string;
    name: string;
  };
  _count: {
    responses: number;
  };
}

// Form data types
export interface ApprovalWorkflowFormData {
  name: string;
  description?: string;
  entityType: string;
  isActive: boolean;
  steps: ApprovalStepFormData[];
}

export interface ApprovalStepFormData {
  stepName: string;
  roleId: string;
  stepOrder: number;
  isRequired: boolean;
  canOverride: boolean;
  overrideMinLevel?: number;
}

export interface ApprovalRequestFormData {
  workflowId: string;
  entityType: string;
  entityId: string;
  propertyId: string;
}

export interface ApprovalResponseFormData {
  approvalRequestId: string;
  stepId: string;
  status: ApprovalStatus;
  comments?: string;
  isOverride?: boolean;
}

// Filter and sort types
export interface ApprovalRequestFilters {
  search?: string;
  status?: ApprovalRequestStatus;
  workflowId?: string;
  propertyId?: string;
  requestedById?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export type ApprovalRequestSortField = 
  | 'createdAt' 
  | 'updatedAt' 
  | 'status' 
  | 'currentStepOrder'
  | 'completedAt';

export type ApprovalRequestSortOrder = 'asc' | 'desc';

export interface ApprovalRequestSort {
  field: ApprovalRequestSortField;
  order: ApprovalRequestSortOrder;
}

// Statistics
export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  overridden: number;
  byWorkflow: Record<string, number>;
  avgProcessingTime: number;
}

// Action results
export interface ApprovalActionResult {
  success: boolean;
  error?: string;
}

export interface CreateApprovalRequestResult extends ApprovalActionResult {
  requestId?: string;
}

export interface ProcessApprovalResult extends ApprovalActionResult {
  nextStep?: number;
  isCompleted?: boolean;
}