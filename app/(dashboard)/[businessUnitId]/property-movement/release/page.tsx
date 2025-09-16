// app/(dashboard)/[businessUnitId]/property-movement/release/page.tsx
import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  getPropertyReleases, 
  getReleaseStats, 
  getReleaseDestinationOptions 
} from '@/lib/actions/release-actions';
import { getProperties } from '@/lib/actions/property-actions';
import type { PropertyReleaseFilters, PropertyReleaseSort } from '@/types/release-types';
import { TransactionStatus, ReleaseType, PropertyStatus } from '@prisma/client';
import { PropertyReleasesPageClient } from '@/components/release/releases-client';

interface PropertyReleasesPageProps {
  params: Promise<{ businessUnitId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: TransactionStatus;
    releaseType?: ReleaseType;
    propertyId?: string;
    businessUnitId?: string;
    bankId?: string;
    releasedById?: string;
    dateFrom?: string;
    dateTo?: string;
    expectedReturnFrom?: string;
    expectedReturnTo?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }>;
}

// Loading component for the releases page
function PropertyReleasesPageSkeleton() {
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

export default async function PropertyReleasesPage({ params, searchParams }: PropertyReleasesPageProps) {
  return (
    <Suspense fallback={<PropertyReleasesPageSkeleton />}>
      <PropertyReleasesPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PropertyReleasesPageContent({ params, searchParams }: PropertyReleasesPageProps) {
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
  
  const filters: PropertyReleaseFilters = {
    search: searchParamsResolved.search,
    status: searchParamsResolved.status,
    releaseType: searchParamsResolved.releaseType,
    propertyId: searchParamsResolved.propertyId,
    businessUnitId: searchParamsResolved.businessUnitId,
    bankId: searchParamsResolved.bankId,
    releasedById: searchParamsResolved.releasedById,
    dateFrom: searchParamsResolved.dateFrom ? new Date(searchParamsResolved.dateFrom) : undefined,
    dateTo: searchParamsResolved.dateTo ? new Date(searchParamsResolved.dateTo) : undefined,
    expectedReturnFrom: searchParamsResolved.expectedReturnFrom ? new Date(searchParamsResolved.expectedReturnFrom) : undefined,
    expectedReturnTo: searchParamsResolved.expectedReturnTo ? new Date(searchParamsResolved.expectedReturnTo) : undefined,
  };

  const sort: PropertyReleaseSort = {
    field: (searchParamsResolved.sortField as PropertyReleaseSort['field']) || 'createdAt',
    order: searchParamsResolved.sortOrder || 'desc',
  };

  try {
    // Fetch data in parallel
    const [releasesData, stats, destinations, availableProperties] = await Promise.all([
      getPropertyReleases(businessUnitId, page, limit, filters, sort),
      getReleaseStats(businessUnitId),
      getReleaseDestinationOptions(),
      // Get properties that can be released (active or pending status)
      getProperties(businessUnitId, 1, 100, { 
        status: PropertyStatus.ACTIVE 
      }).then(result => result.properties.map(p => ({
        id: p.id,
        titleNumber: p.titleNumber,
        propertyName: p.propertyName,
        location: p.location,
        status: p.status,
      }))),
    ]);

    return (
      <PropertyReleasesPageClient
        businessUnitId={businessUnitId}
        initialData={releasesData}
        initialStats={stats}
        initialFilters={filters}
        initialSort={sort}
        destinations={destinations}
        availableProperties={availableProperties}
      />
    );
  } catch (error) {
    console.error('Error loading property releases page:', error);
    
    // Return error state
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Property Releases
          </h2>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }
}