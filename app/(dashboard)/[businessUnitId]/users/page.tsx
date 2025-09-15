// app/(dashboard)/[businessUnitId]/users/page.tsx
import React, { Suspense } from 'react';
import { getUsers, getUserStats, getUserFilterOptions } from '@/lib/actions/users-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersPageClient } from '@/components/users/user-client';
import type { UserFilters, UserSort } from '@/types/user-management-types';

interface UsersPageProps {
  params: Promise<{ businessUnitId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    isActive?: string;
    roleId?: string;
    businessUnitId?: string;
    sortField?: string;
    sortOrder?: string;
  }>;
}

// Loading component for the users page
function UsersPageSkeleton() {
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
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
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

export default async function UsersPage({ params, searchParams }: UsersPageProps) {
  return (
    <Suspense fallback={<UsersPageSkeleton />}>
      <UsersPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function UsersPageContent({ params, searchParams }: UsersPageProps) {
  const { businessUnitId } = await params;
  const searchParamsResolved = await searchParams;

  // Parse search parameters
  const page = parseInt(searchParamsResolved.page || '1', 10);
  const limit = parseInt(searchParamsResolved.limit || '10', 10);
  
  const filters: UserFilters = {
    search: searchParamsResolved.search,
    isActive: searchParamsResolved.isActive ? searchParamsResolved.isActive === 'true' : undefined,
    roleId: searchParamsResolved.roleId,
    businessUnitId: searchParamsResolved.businessUnitId,
  };

  // Validate sort field and order
  const validSortFields = ['firstName', 'lastName', 'email', 'username', 'createdAt', 'updatedAt'];
  const validSortOrders = ['asc', 'desc'];

  const sortField = searchParamsResolved.sortField && validSortFields.includes(searchParamsResolved.sortField)
    ? searchParamsResolved.sortField as UserSort['field']
    : 'createdAt';

  const sortOrder = searchParamsResolved.sortOrder && validSortOrders.includes(searchParamsResolved.sortOrder)
    ? searchParamsResolved.sortOrder as UserSort['order']
    : 'desc';

  const sort: UserSort = {
    field: sortField,
    order: sortOrder,
  };

  try {
    // Fetch data in parallel
    const [usersData, stats, filterOptions] = await Promise.all([
      getUsers(businessUnitId, page, limit, filters, sort),
      getUserStats(businessUnitId),
      getUserFilterOptions(businessUnitId),
    ]);

    return (
      <UsersPageClient
        businessUnitId={businessUnitId}
        initialData={usersData}
        initialStats={stats}
        initialFilters={filters}
        initialSort={sort}
        filterOptions={filterOptions}
      />
    );
  } catch (error) {
    console.error('Error loading users page:', error);
    
    // Return error state
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Users
          </h2>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }
}