// components/workflows/approval-workflow-detail-edit-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  updateApprovalWorkflow,
  updateApprovalWorkflowSteps 
} from '@/lib/actions/approval-workflow-actions';
import type { 
  ApprovalWorkflowWithSteps,
  ApprovalWorkflowFormData,
  RoleSubset
} from '@/types/approval-workflow-types';
import { ApprovalWorkflowForm } from './approval-workflow-form';

interface ApprovalWorkflowDetailEditPageProps {
  businessUnitId: string;
  workflow: ApprovalWorkflowWithSteps;
  availableRoles: RoleSubset[];
}

export function ApprovalWorkflowDetailEditPage({
  businessUnitId,
  workflow,
  availableRoles,
}: ApprovalWorkflowDetailEditPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ApprovalWorkflowFormData) => {
    setIsLoading(true);
    try {
      // Update workflow basic info
      const workflowResult = await updateApprovalWorkflow(businessUnitId, workflow.id, {
        name: data.name,
        description: data.description,
        entityType: data.entityType,
        isActive: data.isActive,
      });

      if (!workflowResult.success) {
        toast.error(workflowResult.error || 'Failed to update workflow');
        return;
      }

      // Update workflow steps
      const stepsResult = await updateApprovalWorkflowSteps(businessUnitId, workflow.id, data.steps);

      if (stepsResult.success) {
        toast.success('Approval workflow updated successfully');
        router.push(`/${businessUnitId}/workflows`);
      } else {
        toast.error(stepsResult.error || 'Failed to update workflow steps');
      }
    } catch (error) {
      console.error('Error updating approval workflow:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/workflows`);
  };

  // Transform workflow data for the form
  const initialData: ApprovalWorkflowFormData = {
    name: workflow.name,
    description: workflow.description || '',
    entityType: workflow.entityType,
    isActive: workflow.isActive,
    steps: workflow.steps.map(step => ({
      stepName: step.stepName,
      roleId: step.roleId,
      stepOrder: step.stepOrder,
      isRequired: step.isRequired,
      canOverride: step.canOverride,
      overrideMinLevel: step.overrideMinLevel || undefined,
    })),
  };

  return (
    <ApprovalWorkflowForm
      availableRoles={availableRoles}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
      initialData={initialData}
      isEditMode={true}
    />
  );
}