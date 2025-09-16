// components/turnovers/turnovers-client.tsx
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
import { PropertyTurnoverTable } from '@/components/turnovers/property-turnover-table';
import { 
  Plus, 
  RefreshCw, 
  ArrowLeftRight, 
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
  getPropertyTurnovers, 
  approvePropertyTurnover,
  completePropertyTurnover,
  cancelPropertyTurnover 
} from '@/lib/actions/turnover-actions';
import type { 
  PropertyTurnoverListItem, 
  PropertyTurnoverFilters, 
  PropertyTurnoverSort, 
  TurnoverStats,
  TurnoverDestinationOption,
  PropertySubset
} from '@/types/turnover-types';
import Link from 'next/link';

interface PropertyTurnoversPageClientProps {
  businessUnitId: string;
  initialData: {
    turnovers: PropertyTurnoverListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  initialStats: TurnoverStats;
  initialFilters: PropertyTurnoverFilters;
  initialSort: PropertyTurnoverSort;
  destinations: TurnoverDestinationOption[];
  availableProperties: PropertySubset[];
}

export function PropertyTurnoversPageClient({
  businessUnitId,
  initialData,
  initialStats,
  initialFilters,
  initialSort,
}: PropertyTurnoversPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filters, setFilters] = useState<PropertyTurnoverFilters>(initialFilters);
  const [sort, setSort] = useState<PropertyTurnoverSort>(initialSort);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    turnoverId: string | null;
    action: 'approve' | 'complete' | 'cancel' | null;
  }>({
    isOpen: false,
    turnoverId: null,
    action: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const canCreate = useCanCreateInCurrentBU('PROPERTY');
  const canUpdate = useCanUpdateInCurrentBU('PROPERTY');
  const canApprove = useCanApproveInCurrentBU('PROPERTY');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: PropertyTurnoverFilters, newSort: PropertyTurnoverSort, page: number = 1) => {
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
    
    const url = `/${businessUnitId}/property-movement/turnovers${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  }, [businessUnitId, router]);

  // Fetch property turnovers data
  const fetchTurnovers = useCallback(async (
    newFilters: PropertyTurnoverFilters, 
    newSort: PropertyTurnoverSort, 
    page: number = 1
  ) => {
    try {
      const result = await getPropertyTurnovers(businessUnitId, page, 10, newFilters, newSort);
      setData(result);
    } catch (error) {
      console.error('Error fetching property turnovers:', error);
      toast.error('Failed to load property turnovers');
    }
  }, [businessUnitId]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: PropertyTurnoverSort) => {
    setSort(newSort);
    startTransition(() => {
      updateURL(filters, newSort, data.currentPage);
      fetchTurnovers(filters, newSort, data.currentPage);
    });
  }, [filters, data.currentPage, updateURL, fetchTurnovers]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      updateURL(filters, sort, page);
      fetchTurnovers(filters, sort, page);
    });
  }, [filters, sort, updateURL, fetchTurnovers]);

  const handleViewTurnover = useCallback((turnoverId: string) => {
    router.push(`/${businessUnitId}/property-movement/turnovers/${turnoverId}`);
  }, [businessUnitId, router]);

  // Handle approve turnover
  const handleApproveTurnover = useCallback((turnoverId: string) => {
    setActionModal({
      isOpen: true,
      turnoverId,
      action: 'approve',
    });
  }, []);

  // Handle complete turnover
  const handleCompleteTurnover = useCallback((turnoverId: string) => {
    setActionModal({
      isOpen: true,
      turnoverId,
      action: 'complete',
    });
  }, []);

  // Handle cancel turnover
  const handleCancelTurnover = useCallback((turnoverId: string) => {
    setActionModal({
      isOpen: true,
      turnoverId,
      action: 'cancel',
    });
  }, []);

  // Confirm action
  const confirmAction = useCallback(async () => {
    if (!actionModal.turnoverId || !actionModal.action) return;

    setIsProcessing(true);
    try {
      let result;
      let successMessage = '';

      switch (actionModal.action) {
        case 'approve':
          result = await approvePropertyTurnover(businessUnitId, actionModal.turnoverId);
          successMessage = 'Property turnover approved successfully';
          break;
        case 'complete':
          result = await completePropertyTurnover(businessUnitId, actionModal.turnoverId);
          successMessage = 'Property turnover marked as received successfully';
          break;
        case 'cancel':
          result = await cancelPropertyTurnover(businessUnitId, actionModal.turnoverId);
          successMessage = 'Property turnover cancelled successfully';
          break;
        default:
          throw new Error('Invalid action');
      }
      
      if (result.success) {
        toast.success(successMessage);
        // Refresh the data
        await fetchTurnovers(filters, sort, data.currentPage);
        setActionModal({ isOpen: false, turnoverId: null, action: null });
      } else {
        toast.error(result.error || `Failed to ${actionModal.action} property turnover`);
      }
    } catch (error) {
      console.error(`Error ${actionModal.action}ing property turnover:`, error);
      toast.error(`Failed to ${actionModal.action} property turnover`);
    } finally {
      setIsProcessing(false);
    }
  }, [actionModal.turnoverId, actionModal.action, businessUnitId, fetchTurnovers, filters, sort, data.currentPage]);

  // Handle create turnover
  const handleCreateTurnover = useCallback(() => {
    router.push(`/${businessUnitId}/property-movement/turnovers/create`);
  }, [businessUnitId, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchTurnovers(filters, sort, data.currentPage);
    });
  }, [fetchTurnovers, filters, sort, data.currentPage]);

  const getModalTitle = () => {
    switch (actionModal.action) {
      case 'approve':
        return 'Approve Property Turnover';
      case 'complete':
        return 'Mark Turnover as Received';
      case 'cancel':
        return 'Cancel Property Turnover';
      default:
        return 'Confirm Action';
    }
  };

  const getModalDescription = () => {
    switch (actionModal.action) {
      case 'approve':
        return 'Are you sure you want to approve this property turnover? This will allow the property to be transferred to the specified destination.';
      case 'complete':
        return 'Are you sure you want to mark this property turnover as received? This indicates that the destination has confirmed receipt of the property.';
      case 'cancel':
        return 'Are you sure you want to cancel this property turnover? This action cannot be undone and will revert the property status.';
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
              <ArrowLeftRight className="h-3 w-3" />
              Property Turnovers
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Property Turnovers</h1>
          <p className="text-muted-foreground mt-2">
            Manage property turnovers between departments and business units
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
            <Button onClick={handleCreateTurnover}>
              <Plus className="h-4 w-4 mr-2" />
              New Turnover
            </Button>
          )}
        </div>
      </div>

      {/* Property Turnovers Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Property Turnovers ({data.totalCount.toLocaleString()})</h2>
        </div>
        <div>
          <CardContent className="p-0">
            <PropertyTurnoverTable
              turnovers={data.turnovers}
              sort={sort}
              onSortChange={handleSortChange}
              onViewTurnover={handleViewTurnover}
              onApproveTurnover={handleApproveTurnover}
              onCompleteTurnover={handleCompleteTurnover}
              onCancelTurnover={handleCancelTurnover}
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
                  {data.turnovers.length} records shown
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
                <span className="font-medium">{data.totalCount}</span> property turnovers
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
        onClose={() => setActionModal({ isOpen: false, turnoverId: null, action: null })}
        onConfirm={confirmAction}
        loading={isProcessing}
        title={getModalTitle()}
        description={getModalDescription()}
      />
    </div>
  );
}