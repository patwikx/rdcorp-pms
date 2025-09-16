// components/users/user-assignment-create-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserAssignmentForm } from './user-assignment-form';
import { assignUserToBusinessUnit } from '@/lib/actions/user-management-actions';
import type { 
  UserAssignmentFormData,
} from '@/types/user-management-types';

interface UserAssignmentCreatePageProps {
  businessUnitId: string;
  availableRoles: Array<{ id: string; name: string; level: number; description: string | null }>;
  availableBusinessUnits: Array<{ id: string; name: string; description: string | null }>;
}

export function UserAssignmentCreatePage({
  businessUnitId,
  availableRoles,
  availableBusinessUnits,
}: UserAssignmentCreatePageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UserAssignmentFormData) => {
    setIsLoading(true);
    try {
      const result = await assignUserToBusinessUnit(businessUnitId, data);
      
      if (result.success) {
        toast.success('User assigned successfully');
        router.push(`/${businessUnitId}/users/assignments`);
      } else {
        toast.error(result.error || 'Failed to assign user');
      }
    } catch (error) {
      console.error('Error assigning user:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/users/assignments`);
  };

  return (
    <UserAssignmentForm
      availableRoles={availableRoles}
      availableBusinessUnits={availableBusinessUnits}
      businessUnitId={businessUnitId}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}