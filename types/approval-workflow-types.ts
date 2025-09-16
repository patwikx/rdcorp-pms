// types/approval-workflow-types.ts
import { 
  ApprovalWorkflow,
  ApprovalStep,
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
  description: string | null;
  level: number;
}

// Approval step with role details
export interface ApprovalStepWithRole extends ApprovalStep {
  role: RoleSubset;
}

// Approval workflow with steps and role details
export interface ApprovalWorkflowWithSteps extends ApprovalWorkflow {
  steps: ApprovalStepWithRole[];
  _count?: {
    steps: number;
    requests: number;
  };
}

// List item for approval workflows
export interface ApprovalWorkflowListItem extends ApprovalWorkflow {
  _count: {
    steps: number;
    requests: number;
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

// Update data types
export interface ApprovalWorkflowUpdateData {
  name?: string;
  description?: string;
  entityType?: string;
  isActive?: boolean;
}

// Filter and sort types
export interface ApprovalWorkflowFilters {
  search?: string;
  entityType?: string;
  isActive?: boolean;
  hasSteps?: boolean;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export type ApprovalWorkflowSortField = 
  | 'name'
  | 'entityType'
  | 'createdAt'
  | 'updatedAt'
  | 'isActive';

export type ApprovalWorkflowSortOrder = 'asc' | 'desc';

export interface ApprovalWorkflowSort {
  field: ApprovalWorkflowSortField;
  order: ApprovalWorkflowSortOrder;
}

// Statistics
export interface ApprovalWorkflowStats {
  total: number;
  active: number;
  inactive: number;
  byEntityType: Record<string, number>;
  totalSteps: number;
  avgStepsPerWorkflow: number;
  recentlyCreated: number;
}

// Action results
export interface ApprovalWorkflowActionResult {
  success: boolean;
  error?: string;
}

export interface CreateApprovalWorkflowResult extends ApprovalWorkflowActionResult {
  workflowId?: string;
}

export interface UpdateApprovalWorkflowResult extends ApprovalWorkflowActionResult {
  workflow?: ApprovalWorkflowWithSteps;
}

// Entity type options
export const ENTITY_TYPES = [
  { value: 'PROPERTY_RELEASE', label: 'Property Release' },
  { value: 'PROPERTY_TURNOVER', label: 'Property Turnover' },
  { value: 'PROPERTY_RETURN', label: 'Property Return' },
  { value: 'RPT_PAYMENT', label: 'RPT Payment' },
  { value: 'DOCUMENT_APPROVAL', label: 'Document Approval' },
  { value: 'USER_ASSIGNMENT', label: 'User Assignment' },
] as const;

export type EntityType = typeof ENTITY_TYPES[number]['value'];

// Validation schemas
export interface ApprovalWorkflowValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ApprovalStepValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}