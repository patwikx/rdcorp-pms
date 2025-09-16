// components/users/user-create-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserForm } from './user-form';
import { createUser } from '@/lib/actions/user-management-actions';
import type { 
  UserFormData,
} from '@/types/user-management-types';

interface UserCreatePageProps {
  businessUnitId: string;
  availableRoles: Array<{ id: string; name: string; level: number }>;
}

export function UserCreatePage({
  businessUnitId,
  availableRoles,
}: UserCreatePageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      const result = await createUser(businessUnitId, data);
      
      if (result.success) {
        toast.success('User created successfully');
        router.push(`/${businessUnitId}/users`);
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/users`);
  };

  return (
    <UserForm
      availableRoles={availableRoles}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}