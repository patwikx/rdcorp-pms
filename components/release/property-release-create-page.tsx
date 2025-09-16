// components/releases/property-release-create-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PropertyReleaseForm } from './property-release-form';
import { createPropertyRelease } from '@/lib/actions/release-actions';
import type { 
  PropertyReleaseFormData,
  ReleaseDestinationOption,
  PropertySubset
} from '@/types/release-types';

interface PropertyReleaseCreatePageProps {
  businessUnitId: string;
  destinations: ReleaseDestinationOption[];
  availableProperties: PropertySubset[];
}

export function PropertyReleaseCreatePage({
  businessUnitId,
  destinations,
  availableProperties,
}: PropertyReleaseCreatePageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: PropertyReleaseFormData) => {
    setIsLoading(true);
    try {
      const result = await createPropertyRelease(businessUnitId, data);
      
      if (result.success) {
        toast.success('Property release created successfully');
        router.push(`/${businessUnitId}/property-movement/release`);
      } else {
        toast.error(result.error || 'Failed to create property release');
      }
    } catch (error) {
      console.error('Error creating property release:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/property-movement/release`);
  };

  return (
    <PropertyReleaseForm
      properties={availableProperties}
      destinations={destinations}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}