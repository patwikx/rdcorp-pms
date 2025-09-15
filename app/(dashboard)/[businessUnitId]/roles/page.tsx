// app/(dashboard)/[businessUnitId]/roles/page.tsx
import React, { Suspense } from 'react';
import { getRoles, getRoleStats } from '@/lib/actions/roles-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RolesPageClient } from '@/components/roles/role-client';
import type { RoleFilters, RoleSort } from '@/types/user-management-types';

interface RolesPageProps {
  params: Promise<{ businessUnitId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    hasMembers?: string;
    sortField?: string;
    sortOrder?: string;
  }>;
}

// Loading component for the roles page
function RolesPageSkeleton() {
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
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
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

export default async function RolesPage({ params, searchParams }: RolesPageProps) {
  return (
    <Suspense fallback={<RolesPageSkeleton />}>
      <RolesPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RolesPageContent({ params, searchParams }: RolesPageProps) {
  const { businessUnitId } = await params;
  const searchParamsResolved = await searchParams;

  // Parse search parameters
  const page = parseInt(searchParamsResolved.page || '1', 10);
  const limit = parseInt(searchParamsResolved.limit || '10', 10);
  
  const filters: RoleFilters = {
    search: searchParamsResolved.search,
    hasMembers: searchParamsResolved.hasMembers ? searchParamsResolved.hasMembers === 'true' : undefined,
  };

  // Validate sort field and order
  const validSortFields = ['name', 'createdAt', 'updatedAt'];
  const validSortOrders = ['asc', 'desc'];

  const sortField = searchParamsResolved.sortField && validSortFields.includes(searchParamsResolved.sortField)
    ? searchParamsResolved.sortField as RoleSort['field']
    : 'createdAt';

  const sortOrder = searchParamsResolved.sortOrder && validSortOrders.includes(searchParamsResolved.sortOrder)
    ? searchParamsResolved.sortOrder as RoleSort['order']
    : 'desc';

  const sort: RoleSort = {
    field: sortField,
    order: sortOrder,
  };

  try {
    // Fetch data in parallel
    const [rolesData, stats] = await Promise.all([
      getRoles(businessUnitId, page, limit, filters, sort),
      getRoleStats(businessUnitId),
    ]);

    return (
      <RolesPageClient
        businessUnitId={businessUnitId}
        initialData={rolesData}
        initialStats={stats}
        initialFilters={filters}
        initialSort={sort}
      />
    );
  } catch (error) {
    console.error('Error loading roles page:', error);
    
    // Return error state
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Roles
          </h2>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }
}