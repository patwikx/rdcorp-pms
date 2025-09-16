// components/returns/returns-client.tsx
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
import { PropertyReturnTable } from '@/components/returns/property-return-table';
import { 
  Plus, 
  RefreshCw, 
  RotateCcw, 
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
  getPropertyReturns, 
  approvePropertyReturn,
  completePropertyReturn,
  cancelPropertyReturn 
} from '@/lib/actions/return-actions';
import type { 
  PropertyReturnListItem, 
  PropertyReturnFilters, 
  PropertyReturnSort, 
  ReturnStats,
  ReturnSourceOption,
  PropertySubset
} from '@/types/return-types';
import Link from 'next/link';

interface PropertyReturnsPageClientProps {
  businessUnitId: string;
  initialData: {
    returns: PropertyReturnListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  initialStats: ReturnStats;
  initialFilters: PropertyReturnFilters;
  initialSort: PropertyReturnSort;
  sources: ReturnSourceOption[];
  availableProperties: PropertySubset[];
}

export function PropertyReturnsPageClient({
  businessUnitId,
  initialData,
  initialStats,
  initialFilters,
  initialSort,
}: PropertyReturnsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filters, setFilters] = useState<PropertyReturnFilters>(initialFilters);
  const [sort, setSort] = useState<PropertyReturnSort>(initialSort);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    returnId: string | null;
    action: 'approve' | 'complete' | 'cancel' | null;
  }>({
    isOpen: false,
    returnId: null,
    action: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const canCreate = useCanCreateInCurrentBU('PROPERTY');
  const canUpdate = useCanUpdateInCurrentBU('PROPERTY');
  const canApprove = useCanApproveInCurrentBU('PROPERTY');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: PropertyReturnFilters, newSort: PropertyReturnSort, page: number = 1) => {
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
    
    const url = `/${businessUnitId}/property-movement/returns${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  }, [businessUnitId, router]);

  // Fetch property returns data
  const fetchReturns = useCallback(async (
    newFilters: PropertyReturnFilters, 
    newSort: PropertyReturnSort, 
    page: number = 1
  ) => {
    try {
      const result = await getPropertyReturns(businessUnitId, page, 10, newFilters, newSort);
      setData(result);
    } catch (error) {
      console.error('Error fetching property returns:', error);
      toast.error('Failed to load property returns');
    }
  }, [businessUnitId]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: PropertyReturnSort) => {
    setSort(newSort);
    startTransition(() => {
      updateURL(filters, newSort, data.currentPage);
      fetchReturns(filters, newSort, data.currentPage);
    });
  }, [filters, data.currentPage, updateURL, fetchReturns]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      updateURL(filters, sort, page);
      fetchReturns(filters, sort, page);
    });
  }, [filters, sort, updateURL, fetchReturns]);

  const handleViewReturn = useCallback((returnId: string) => {
    router.push(`/${businessUnitId}/property-movement/returns/${returnId}`);
  }, [businessUnitId, router]);

  // Handle approve return
  const handleApproveReturn = useCallback((returnId: string) => {
    setActionModal({
      isOpen: true,
      returnId,
      action: 'approve',
    });
  }, []);

  // Handle complete return
  const handleCompleteReturn = useCallback((returnId: string) => {
    setActionModal({
      isOpen: true,
      returnId,
      action: 'complete',
    });
  }, []);

  // Handle cancel return
  const handleCancelReturn = useCallback((returnId: string) => {
    setActionModal({
      isOpen: true,
      returnId,
      action: 'cancel',
    });
  }, []);

  // Confirm action
  const confirmAction = useCallback(async () => {
    if (!actionModal.returnId || !actionModal.action) return;

    setIsProcessing(true);
    try {
      let result;
      let successMessage = '';

      switch (actionModal.action) {
        case 'approve':
          result = await approvePropertyReturn(businessUnitId, actionModal.returnId);
          successMessage = 'Property return approved successfully';
          break;
        case 'complete':
          result = await completePropertyReturn(businessUnitId, actionModal.returnId);
          successMessage = 'Property return marked as received successfully';
          break;
        case 'cancel':
          result = await cancelPropertyReturn(businessUnitId, actionModal.returnId);
          successMessage = 'Property return cancelled successfully';
          break;
        default:
          throw new Error('Invalid action');
      }
      
      if (result.success) {
        toast.success(successMessage);
        // Refresh the data
        await fetchReturns(filters, sort, data.currentPage);
        setActionModal({ isOpen: false, returnId: null, action: null });
      } else {
        toast.error(result.error || `Failed to ${actionModal.action} property return`);
      }
    } catch (error) {
      console.error(`Error ${actionModal.action}ing property return:`, error);
      toast.error(`Failed to ${actionModal.action} property return`);
    } finally {
      setIsProcessing(false);
    }
  }, [actionModal.returnId, actionModal.action, businessUnitId, fetchReturns, filters, sort, data.currentPage]);

  // Handle create return
  const handleCreateReturn = useCallback(() => {
    router.push(`/${businessUnitId}/property-movement/returns/create`);
  }, [businessUnitId, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchReturns(filters, sort, data.currentPage);
    });
  }, [fetchReturns, filters, sort, data.currentPage]);

  const getModalTitle = () => {
    switch (actionModal.action) {
      case 'approve':
        return 'Approve Property Return';
      case 'complete':
        return 'Mark Return as Received';
      case 'cancel':
        return 'Cancel Property Return';
      default:
        return 'Confirm Action';
    }
  };

  const getModalDescription = () => {
    switch (actionModal.action) {
      case 'approve':
        return 'Are you sure you want to approve this property return? This will allow the property to be returned to the main office.';
      case 'complete':
        return 'Are you sure you want to mark this property return as received? This indicates that the main office has confirmed receipt of the property.';
      case 'cancel':
        return 'Are you sure you want to cancel this property return? This action cannot be undone and will revert the property status.';
      default:
        return 'Are you sure you want to perform this action?';
    }
  };

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
              <RotateCcw className="h-3 w-3" />
              Property Returns
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Property Returns</h1>
          <p className="text-muted-foreground mt-2">
            Manage property returns from subsidiaries, banks, and external parties
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
            <Button onClick={handleCreateReturn}>
              <Plus className="h-4 w-4 mr-2" />
              New Return
            </Button>
          )}
        </div>
      </div>

      {/* Property Returns Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Property Returns ({data.totalCount.toLocaleString()})</h2>
        </div>
        <div>
          <CardContent className="p-0">
            <PropertyReturnTable
              returns={data.returns}
              sort={sort}
              onSortChange={handleSortChange}
              onViewReturn={handleViewReturn}
              onApproveReturn={handleApproveReturn}
              onCompleteReturn={handleCompleteReturn}
              onCancelReturn={handleCancelReturn}
              canApprove={canApprove}
              canComplete={canUpdate}
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
                  {data.returns.length} records shown
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
                <span className="font-medium">{data.totalCount}</span> property returns
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

      {/* Action Confirmation Modal */}
      <AlertModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, returnId: null, action: null })}
        onConfirm={confirmAction}
        loading={isProcessing}
        title={getModalTitle()}
        description={getModalDescription()}
      />
    </div>
  );
}