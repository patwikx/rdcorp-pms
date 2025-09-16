// app/(dashboard)/[businessUnitId]/property-movement/returns/page.tsx
import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  getPropertyReturns, 
  getReturnStats, 
  getReturnSourceOptions 
} from '@/lib/actions/return-actions';
import { getProperties } from '@/lib/actions/property-actions';
import type { PropertyReturnFilters, PropertyReturnSort } from '@/types/return-types';
import { TransactionStatus, ReturnType, PropertyStatus } from '@prisma/client';
import { PropertyReturnsPageClient } from '@/components/returns/returns-client';

interface PropertyReturnsPageProps {
  params: Promise<{ businessUnitId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: TransactionStatus;
    returnType?: ReturnType;
    propertyId?: string;
    businessUnitId?: string;
    returnedById?: string;
    dateFrom?: string;
    dateTo?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }>;
}

// Loading component for the returns page
function PropertyReturnsPageSkeleton() {
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
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PropertyReturnsPage({ params, searchParams }: PropertyReturnsPageProps) {
  return (
    <Suspense fallback={<PropertyReturnsPageSkeleton />}>
      <PropertyReturnsPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PropertyReturnsPageContent({ params, searchParams }: PropertyReturnsPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }

  const { businessUnitId } = await params;
  const searchParamsResolved = await searchParams;

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );

  if (!hasAccess) {
    redirect('/setup?error=unauthorized');
  }

  // Parse search parameters
  const page = parseInt(searchParamsResolved.page || '1', 10);
  const limit = parseInt(searchParamsResolved.limit || '10', 10);
  
  const filters: PropertyReturnFilters = {
    search: searchParamsResolved.search,
    status: searchParamsResolved.status,
    returnType: searchParamsResolved.returnType,
    propertyId: searchParamsResolved.propertyId,
    businessUnitId: searchParamsResolved.businessUnitId,
    returnedById: searchParamsResolved.returnedById,
    dateFrom: searchParamsResolved.dateFrom ? new Date(searchParamsResolved.dateFrom) : undefined,
    dateTo: searchParamsResolved.dateTo ? new Date(searchParamsResolved.dateTo) : undefined,
  };

  const sort: PropertyReturnSort = {
    field: (searchParamsResolved.sortField as PropertyReturnSort['field']) || 'createdAt',
    order: searchParamsResolved.sortOrder || 'desc',
  };

  try {
    // Fetch data in parallel
    const [returnsData, stats, sources, availableProperties] = await Promise.all([
      getPropertyReturns(businessUnitId, page, limit, filters, sort),
      getReturnStats(businessUnitId),
      getReturnSourceOptions(),
      // Get properties that can be returned (released or bank custody status)
      getProperties(businessUnitId, 1, 100, { 
        status: PropertyStatus.RELEASED 
      }).then(result => result.properties.map(p => ({
        id: p.id,
        titleNumber: p.titleNumber,
        propertyName: p.propertyName,
        location: p.location,
        status: p.status,
      }))),
    ]);

    return (
      <PropertyReturnsPageClient
        businessUnitId={businessUnitId}
        initialData={returnsData}
        initialStats={stats}
        initialFilters={filters}
        initialSort={sort}
        sources={sources}
        availableProperties={availableProperties}
      />
    );
  } catch (error) {
    console.error('Error loading property returns page:', error);
    
    // Return error state
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Property Returns
          </h2>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }
}