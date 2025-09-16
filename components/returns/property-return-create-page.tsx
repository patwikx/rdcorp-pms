// components/returns/property-return-create-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PropertyReturnForm } from './property-return-form';
import { createPropertyReturn } from '@/lib/actions/return-actions';
import type { 
  PropertyReturnFormData,
  ReturnSourceOption,
  PropertySubset
} from '@/types/return-types';

interface PropertyReturnCreatePageProps {
  businessUnitId: string;
  sources: ReturnSourceOption[];
  availableProperties: PropertySubset[];
}

export function PropertyReturnCreatePage({
  businessUnitId,
  sources,
  availableProperties,
}: PropertyReturnCreatePageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: PropertyReturnFormData) => {
    setIsLoading(true);
    try {
      const result = await createPropertyReturn(businessUnitId, data);
      
      if (result.success) {
        toast.success('Property return created successfully');
        router.push(`/${businessUnitId}/property-movement/returns`);
      } else {
        toast.error(result.error || 'Failed to create property return');
      }
    } catch (error) {
      console.error('Error creating property return:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/property-movement/returns`);
  };

  return (
    <PropertyReturnForm
      properties={availableProperties}
      sources={sources}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}