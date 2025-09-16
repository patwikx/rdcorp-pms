// components/roles/role-create-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RoleForm } from './role-form';
import { createRole } from '@/lib/actions/role-actions';
import type { 
  RoleFormData,
} from '@/types/role-types';

interface RoleCreatePageProps {
  businessUnitId: string;
}

export function RoleCreatePage({
  businessUnitId,
}: RoleCreatePageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: RoleFormData) => {
    setIsLoading(true);
    try {
      const result = await createRole(businessUnitId, data);
      
      if (result.success) {
        toast.success('Role created successfully');
        router.push(`/${businessUnitId}/roles`);
      } else {
        toast.error(result.error || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/roles`);
  };

  return (
    <RoleForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}