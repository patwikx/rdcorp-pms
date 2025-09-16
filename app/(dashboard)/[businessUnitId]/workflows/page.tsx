// app/(dashboard)/[businessUnitId]/workflows/page.tsx
import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  getApprovalWorkflows, 
  getApprovalWorkflowStats, 
  getApprovalWorkflowFilterOptions 
} from '@/lib/actions/approval-workflow-actions';
import type { 
  ApprovalWorkflowFilters, 
  ApprovalWorkflowSort 
} from '@/types/approval-workflow-types';
import { ApprovalWorkflowsPageClient } from '@/components/workflows/workflows-client';

interface ApprovalWorkflowsPageProps {
  params: Promise<{ businessUnitId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    entityType?: string;
    isActive?: string;
    hasSteps?: string;
    dateFrom?: string;
    dateTo?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }>;
}

// Loading component for the workflows page
function ApprovalWorkflowsPageSkeleton() {
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
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ApprovalWorkflowsPage({ params, searchParams }: ApprovalWorkflowsPageProps) {
  return (
    <Suspense fallback={<ApprovalWorkflowsPageSkeleton />}>
      <ApprovalWorkflowsPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ApprovalWorkflowsPageContent({ params, searchParams }: ApprovalWorkflowsPageProps) {
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
  
  const filters: ApprovalWorkflowFilters = {
    search: searchParamsResolved.search,
    entityType: searchParamsResolved.entityType,
    isActive: searchParamsResolved.isActive ? searchParamsResolved.isActive === 'true' : undefined,
    hasSteps: searchParamsResolved.hasSteps ? searchParamsResolved.hasSteps === 'true' : undefined,
    dateFrom: searchParamsResolved.dateFrom ? new Date(searchParamsResolved.dateFrom) : undefined,
    dateTo: searchParamsResolved.dateTo ? new Date(searchParamsResolved.dateTo) : undefined,
  };

  const sort: ApprovalWorkflowSort = {
    field: (searchParamsResolved.sortField as ApprovalWorkflowSort['field']) || 'createdAt',
    order: searchParamsResolved.sortOrder || 'desc',
  };

  try {
    // Fetch data in parallel
    const [workflowsData, stats, filterOptions] = await Promise.all([
      getApprovalWorkflows(businessUnitId, page, limit, filters, sort),
      getApprovalWorkflowStats(businessUnitId),
      getApprovalWorkflowFilterOptions(),
    ]);

    return (
      <ApprovalWorkflowsPageClient
        businessUnitId={businessUnitId}
        initialData={workflowsData}
        initialStats={stats}
        initialFilters={filters}
        initialSort={sort}
        filterOptions={filterOptions}
      />
    );
  } catch (error) {
    console.error('Error loading approval workflows page:', error);
    
    // Return error state
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Approval Workflows
          </h2>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }
}