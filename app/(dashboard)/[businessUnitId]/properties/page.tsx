// app/(dashboard)/[businessUnitId]/properties/page.tsx
import React, { Suspense } from 'react';

import { getProperties, getPropertyStats, getPropertyFilterOptions } from '@/lib/actions/property-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertiesPageClient } from '@/components/properties/properties-client';
import { PropertyStatus, PropertyClassification } from '@prisma/client';
import type { PropertySortField, PropertySortOrder } from '@/types/property-types';

interface PropertiesPageProps {
  params: Promise<{ businessUnitId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: PropertyStatus;
    classification?: PropertyClassification;
    location?: string;
    registeredOwner?: string;
    createdBy?: string;
    dateFrom?: string;
    dateTo?: string;
    sortField?: PropertySortField;
    sortOrder?: PropertySortOrder;
  }>;
}

// Loading component for the properties page
function PropertiesPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-80" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PropertiesPage({ params, searchParams }: PropertiesPageProps) {
  return (
    <Suspense fallback={<PropertiesPageSkeleton />}>
      <PropertiesPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PropertiesPageContent({ params, searchParams }: PropertiesPageProps) {
  const { businessUnitId } = await params;
  const searchParamsResolved = await searchParams;

  // Parse search parameters
  const page = parseInt(searchParamsResolved.page || '1', 10);
  const limit = parseInt(searchParamsResolved.limit || '10', 10);
  
  // Helper function to validate enum values
  const validateEnumValue = <T extends Record<string, string>>(
    value: string | undefined,
    enumObject: T
  ): T[keyof T] | undefined => {
    if (!value) return undefined;
    return Object.values(enumObject).includes(value as T[keyof T]) 
      ? (value as T[keyof T]) 
      : undefined;
  };

  const filters = {
    search: searchParamsResolved.search,
    status: validateEnumValue(searchParamsResolved.status, {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE', 
      PENDING: 'PENDING',
      RELEASED: 'RELEASED',
      RETURNED: 'RETURNED',
      UNDER_REVIEW: 'UNDER_REVIEW',
      DISPUTED: 'DISPUTED'
    } as const),
    classification: validateEnumValue(searchParamsResolved.classification, {
      RESIDENTIAL: 'RESIDENTIAL',
      COMMERCIAL: 'COMMERCIAL',
      INDUSTRIAL: 'INDUSTRIAL',
      AGRICULTURAL: 'AGRICULTURAL',
      INSTITUTIONAL: 'INSTITUTIONAL',
      MIXED_USE: 'MIXED_USE',
      VACANT_LOT: 'VACANT_LOT',
      OTHER: 'OTHER'
    } as const),
    location: searchParamsResolved.location,
    registeredOwner: searchParamsResolved.registeredOwner,
    createdBy: searchParamsResolved.createdBy,
    dateFrom: searchParamsResolved.dateFrom ? new Date(searchParamsResolved.dateFrom) : undefined,
    dateTo: searchParamsResolved.dateTo ? new Date(searchParamsResolved.dateTo) : undefined,
  };

  // Validate sort field and order
  const validSortFields: PropertySortField[] = [
    'titleNumber', 'lotNumber', 'location', 'area', 'registeredOwner', 'status', 'createdAt', 'updatedAt'
  ];
  const validSortOrders: PropertySortOrder[] = ['asc', 'desc'];

  const sortField = searchParamsResolved.sortField && validSortFields.includes(searchParamsResolved.sortField)
    ? searchParamsResolved.sortField
    : 'createdAt';

  const sortOrder = searchParamsResolved.sortOrder && validSortOrders.includes(searchParamsResolved.sortOrder)
    ? searchParamsResolved.sortOrder
    : 'desc';

  const sort = {
    field: sortField,
    order: sortOrder,
  };

  try {
    // Fetch data in parallel
    const [propertiesData, stats, filterOptions] = await Promise.all([
      getProperties(businessUnitId, page, limit, filters, sort),
      getPropertyStats(businessUnitId),
      getPropertyFilterOptions(businessUnitId),
    ]);

    return (
      <PropertiesPageClient
        businessUnitId={businessUnitId}
        initialData={propertiesData}
        initialStats={stats}
        initialFilters={filters}
        initialSort={sort}
        filterOptions={filterOptions}
      />
    );
  } catch (error) {
    console.error('Error loading properties page:', error);
    
    // Return error state
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Properties
          </h2>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }
}