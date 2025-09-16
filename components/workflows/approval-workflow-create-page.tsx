// components/workflows/approval-workflow-create-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createApprovalWorkflow } from '@/lib/actions/approval-workflow-actions';
import type { 
  ApprovalWorkflowFormData,
  RoleSubset
} from '@/types/approval-workflow-types';
import { ApprovalWorkflowForm } from './approval-workflow-form';

interface ApprovalWorkflowCreatePageProps {
  businessUnitId: string;
  availableRoles: RoleSubset[];
}

export function ApprovalWorkflowCreatePage({
  businessUnitId,
  availableRoles,
}: ApprovalWorkflowCreatePageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ApprovalWorkflowFormData) => {
    setIsLoading(true);
    try {
      const result = await createApprovalWorkflow(businessUnitId, data);
      
      if (result.success) {
        toast.success('Approval workflow created successfully');
        router.push(`/${businessUnitId}/workflows`);
      } else {
        toast.error(result.error || 'Failed to create approval workflow');
      }
    } catch (error) {
      console.error('Error creating approval workflow:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/workflows`);
  };

  return (
    <ApprovalWorkflowForm
      availableRoles={availableRoles}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}