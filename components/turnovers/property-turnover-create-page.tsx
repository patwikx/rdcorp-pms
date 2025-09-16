// components/turnovers/property-turnover-create-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PropertyTurnoverForm } from './property-turnover-form';
import { createPropertyTurnover } from '@/lib/actions/turnover-actions';
import type { 
  PropertyTurnoverFormData,
  TurnoverDestinationOption,
  PropertySubset
} from '@/types/turnover-types';

interface PropertyTurnoverCreatePageProps {
  businessUnitId: string;
  destinations: TurnoverDestinationOption[];
  availableProperties: PropertySubset[];
}

export function PropertyTurnoverCreatePage({
  businessUnitId,
  destinations,
  availableProperties,
}: PropertyTurnoverCreatePageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: PropertyTurnoverFormData) => {
    setIsLoading(true);
    try {
      const result = await createPropertyTurnover(businessUnitId, data);
      
      if (result.success) {
        toast.success('Property turnover created successfully');
        router.push(`/${businessUnitId}/property-movement/turnovers`);
      } else {
        toast.error(result.error || 'Failed to create property turnover');
      }
    } catch (error) {
      console.error('Error creating property turnover:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/property-movement/turnovers`);
  };

  return (
    <PropertyTurnoverForm
      properties={availableProperties}
      destinations={destinations}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}