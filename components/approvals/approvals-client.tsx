// components/approvals/approvals-client.tsx
'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AlertModal } from '@/components/modals/alert-modal';
import { ApprovalRequestTable } from '@/components/approvals/approval-request-table';
import { 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  Home,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useCanCreateInCurrentBU,
  useCanUpdateInCurrentBU,
  useCanApproveInCurrentBU
} from '@/context/business-unit-context';
import { 
  getApprovalRequests, 
  cancelApprovalRequest 
} from '@/lib/actions/approval-actions';
import type { 
  ApprovalRequestListItem, 
  ApprovalRequestFilters, 
  ApprovalRequestSort, 
  ApprovalStats,
  ApprovalWorkflowWithSteps
} from '@/types/approval-types';
import Link from 'next/link';

interface ApprovalRequestsPageClientProps {
  businessUnitId: string;
  initialData: {
    requests: ApprovalRequestListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  initialStats: ApprovalStats;
  initialFilters: ApprovalRequestFilters;
  initialSort: ApprovalRequestSort;
  workflows: ApprovalWorkflowWithSteps[];
}

export function ApprovalRequestsPageClient({
  businessUnitId,
  initialData,
  initialStats,
  initialFilters,
  initialSort,
}: ApprovalRequestsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filters, setFilters] = useState<ApprovalRequestFilters>(initialFilters);
  const [sort, setSort] = useState<ApprovalRequestSort>(initialSort);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    requestId: string | null;
  }>({
    isOpen: false,
    requestId: null,
  });
  const [isCancelling, setIsCancelling] = useState(false);

  const canCreate = useCanCreateInCurrentBU('APPROVAL');
  const canUpdate = useCanUpdateInCurrentBU('APPROVAL');
  const canApprove = useCanApproveInCurrentBU('APPROVAL');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: ApprovalRequestFilters, newSort: ApprovalRequestSort, page: number = 1) => {
    const params = new URLSearchParams();
    
    // Add pagination
    if (page > 1) params.set('page', page.toString());
    
    // Add filters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        if (value instanceof Date) {
          params.set(key, value.toISOString().split('T')[0]);
        } else {
          params.set(key, value.toString());
        }
      }
    });
    
    // Add sort
    if (newSort.field !== 'createdAt') params.set('sortField', newSort.field);
    if (newSort.order !== 'desc') params.set('sortOrder', newSort.order);
    
    const url = `/${businessUnitId}/property-movement/approvals${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  }, [businessUnitId, router]);

  // Fetch approval requests data
  const fetchRequests = useCallback(async (
    newFilters: ApprovalRequestFilters, 
    newSort: ApprovalRequestSort, 
    page: number = 1
  ) => {
    try {
      const result = await getApprovalRequests(businessUnitId, page, 10, newFilters, newSort);
      setData(result);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      toast.error('Failed to load approval requests');
    }
  }, [businessUnitId]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: ApprovalRequestSort) => {
    setSort(newSort);
    startTransition(() => {
      updateURL(filters, newSort, data.currentPage);
      fetchRequests(filters, newSort, data.currentPage);
    });
  }, [filters, data.currentPage, updateURL, fetchRequests]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      updateURL(filters, sort, page);
      fetchRequests(filters, sort, page);
    });
  }, [filters, sort, updateURL, fetchRequests]);

  const handleViewRequest = useCallback((requestId: string) => {
    router.push(`/${businessUnitId}/property-movement/approvals/${requestId}`);
  }, [businessUnitId, router]);

  const handleProcessRequest = useCallback((requestId: string) => {
    router.push(`/${businessUnitId}/property-movement/approvals/${requestId}/process`);
  }, [businessUnitId, router]);

  // Handle cancel approval request
  const handleCancelRequest = useCallback((requestId: string) => {
    setCancelModal({
      isOpen: true,
      requestId,
    });
  }, []);

  // Confirm cancel
  const confirmCancel = useCallback(async () => {
    if (!cancelModal.requestId) return;

    setIsCancelling(true);
    try {
      const result = await cancelApprovalRequest(businessUnitId, cancelModal.requestId);
      
      if (result.success) {
        toast.success('Approval request cancelled successfully');
        // Refresh the data
        await fetchRequests(filters, sort, data.currentPage);
        setCancelModal({ isOpen: false, requestId: null });
      } else {
        toast.error(result.error || 'Failed to cancel approval request');
      }
    } catch (error) {
      console.error('Error cancelling approval request:', error);
      toast.error('Failed to cancel approval request');
    } finally {
      setIsCancelling(false);
    }
  }, [cancelModal.requestId, businessUnitId, fetchRequests, filters, sort, data.currentPage]);

  // Handle create approval request
  const handleCreateRequest = useCallback(() => {
    router.push(`/${businessUnitId}/property-movement/approvals/create`);
  }, [businessUnitId, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchRequests(filters, sort, data.currentPage);
    });
  }, [fetchRequests, filters, sort, data.currentPage]);

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${businessUnitId}`} className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Approval Requests
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage property workflow approval requests
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isPending}
            className="transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={handleCreateRequest}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Approval Requests Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Approval Requests ({data.totalCount.toLocaleString()})</h2>
        </div>
        <div>
          <CardContent className="p-0">
            <ApprovalRequestTable
              requests={data.requests}
              sort={sort}
              onSortChange={handleSortChange}
              onViewRequest={handleViewRequest}
              onProcessRequest={handleProcessRequest}
              onCancelRequest={handleCancelRequest}
              canProcess={canApprove}
              canCancel={canUpdate}
            />
          </CardContent>
          <CardFooter className='mt-4'>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="bg-muted px-3 py-1 rounded-full font-medium">
                  Page {data.currentPage} of {data.totalPages}
                </span>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {data.requests.length} records shown
                </span>
              </div>
            </div>
          </CardFooter>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {data.totalPages > 1 && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{((data.currentPage - 1) * 10) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(data.currentPage * 10, data.totalCount)}
                </span> of{' '}
                <span className="font-medium">{data.totalCount}</span> approval requests
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(data.currentPage - 1)}
                      className={data.currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-50'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          onClick={() => handlePageChange(page)}
                          isActive={page === data.currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(data.currentPage + 1)}
                      className={data.currentPage >= data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-50'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Modal */}
      <AlertModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, requestId: null })}
        onConfirm={confirmCancel}
        loading={isCancelling}
        title="Cancel Approval Request"
        description="Are you sure you want to cancel this approval request? This action cannot be undone."
      />
    </div>
  );
}