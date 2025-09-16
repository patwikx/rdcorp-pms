// components/releases/releases-client.tsx
'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { PropertyReleaseTable } from '@/components/release/property-release-table';
import { 
  Plus, 
  RefreshCw, 
  Send, 
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
  getPropertyReleases, 
  approvePropertyRelease,
  completePropertyRelease,
  cancelPropertyRelease 
} from '@/lib/actions/release-actions';
import type { 
  PropertyReleaseListItem, 
  PropertyReleaseFilters, 
  PropertyReleaseSort, 
  ReleaseStats,
  ReleaseDestinationOption,
  PropertySubset
} from '@/types/release-types';
import Link from 'next/link';

interface PropertyReleasesPageClientProps {
  businessUnitId: string;
  initialData: {
    releases: PropertyReleaseListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  initialStats: ReleaseStats;
  initialFilters: PropertyReleaseFilters;
  initialSort: PropertyReleaseSort;
  destinations: ReleaseDestinationOption[];
  availableProperties: PropertySubset[];
}

export function PropertyReleasesPageClient({
  businessUnitId,
  initialData,
  initialStats,
  initialFilters,
  initialSort,
}: PropertyReleasesPageClientProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filters, setFilters] = useState<PropertyReleaseFilters>(initialFilters);
  const [sort, setSort] = useState<PropertyReleaseSort>(initialSort);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    releaseId: string | null;
    action: 'approve' | 'complete' | 'cancel' | null;
  }>({
    isOpen: false,
    releaseId: null,
    action: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const canCreate = useCanCreateInCurrentBU('PROPERTY');
  const canUpdate = useCanUpdateInCurrentBU('PROPERTY');
  const canApprove = useCanApproveInCurrentBU('PROPERTY');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: PropertyReleaseFilters, newSort: PropertyReleaseSort, page: number = 1) => {
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
    
    const url = `/${businessUnitId}/property-movement/release${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  }, [businessUnitId, router]);

  // Fetch property releases data
  const fetchReleases = useCallback(async (
    newFilters: PropertyReleaseFilters, 
    newSort: PropertyReleaseSort, 
    page: number = 1
  ) => {
    try {
      const result = await getPropertyReleases(businessUnitId, page, 10, newFilters, newSort);
      setData(result);
    } catch (error) {
      console.error('Error fetching property releases:', error);
      toast.error('Failed to load property releases');
    }
  }, [businessUnitId]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: PropertyReleaseSort) => {
    setSort(newSort);
    startTransition(() => {
      updateURL(filters, newSort, data.currentPage);
      fetchReleases(filters, newSort, data.currentPage);
    });
  }, [filters, data.currentPage, updateURL, fetchReleases]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      updateURL(filters, sort, page);
      fetchReleases(filters, sort, page);
    });
  }, [filters, sort, updateURL, fetchReleases]);

  const handleViewRelease = useCallback((releaseId: string) => {
    router.push(`/${businessUnitId}/property-movement/release/${releaseId}`);
  }, [businessUnitId, router]);

  // Handle approve release
  const handleApproveRelease = useCallback((releaseId: string) => {
    setActionModal({
      isOpen: true,
      releaseId,
      action: 'approve',
    });
  }, []);

  // Handle complete release
  const handleCompleteRelease = useCallback((releaseId: string) => {
    setActionModal({
      isOpen: true,
      releaseId,
      action: 'complete',
    });
  }, []);

  // Handle cancel release
  const handleCancelRelease = useCallback((releaseId: string) => {
    setActionModal({
      isOpen: true,
      releaseId,
      action: 'cancel',
    });
  }, []);

  // Confirm action
  const confirmAction = useCallback(async () => {
    if (!actionModal.releaseId || !actionModal.action) return;

    setIsProcessing(true);
    try {
      let result;
      let successMessage = '';

      switch (actionModal.action) {
        case 'approve':
          result = await approvePropertyRelease(businessUnitId, actionModal.releaseId);
          successMessage = 'Property release approved successfully';
          break;
        case 'complete':
          result = await completePropertyRelease(businessUnitId, actionModal.releaseId);
          successMessage = 'Property release marked as received successfully';
          break;
        case 'cancel':
          result = await cancelPropertyRelease(businessUnitId, actionModal.releaseId);
          successMessage = 'Property release cancelled successfully';
          break;
        default:
          throw new Error('Invalid action');
      }
      
      if (result.success) {
        toast.success(successMessage);
        // Refresh the data
        await fetchReleases(filters, sort, data.currentPage);
        setActionModal({ isOpen: false, releaseId: null, action: null });
      } else {
        toast.error(result.error || `Failed to ${actionModal.action} property release`);
      }
    } catch (error) {
      console.error(`Error ${actionModal.action}ing property release:`, error);
      toast.error(`Failed to ${actionModal.action} property release`);
    } finally {
      setIsProcessing(false);
    }
  }, [actionModal.releaseId, actionModal.action, businessUnitId, fetchReleases, filters, sort, data.currentPage]);

  // Handle create release
  const handleCreateRelease = useCallback(() => {
    router.push(`/${businessUnitId}/property-movement/release/create`);
  }, [businessUnitId, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchReleases(filters, sort, data.currentPage);
    });
  }, [fetchReleases, filters, sort, data.currentPage]);

  const getModalTitle = () => {
    switch (actionModal.action) {
      case 'approve':
        return 'Approve Property Release';
      case 'complete':
        return 'Mark Release as Received';
      case 'cancel':
        return 'Cancel Property Release';
      default:
        return 'Confirm Action';
    }
  };

  const getModalDescription = () => {
    switch (actionModal.action) {
      case 'approve':
        return 'Are you sure you want to approve this property release? This will allow the property to be released to the specified destination.';
      case 'complete':
        return 'Are you sure you want to mark this property release as received? This indicates that the destination has confirmed receipt of the property.';
      case 'cancel':
        return 'Are you sure you want to cancel this property release? This action cannot be undone and will revert the property status.';
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
              <Send className="h-3 w-3" />
              Property Releases
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Property Releases</h1>
          <p className="text-muted-foreground mt-2">
            Manage property releases to subsidiaries, banks, and external parties
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
            <Button onClick={handleCreateRelease}>
              <Plus className="h-4 w-4 mr-2" />
              New Release
            </Button>
          )}
        </div>
      </div>

      {/* Property Releases Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Property Releases ({data.totalCount.toLocaleString()})</h2>
        </div>
        <div>
          <CardContent className="p-0">
            <PropertyReleaseTable
              releases={data.releases}
              sort={sort}
              onSortChange={handleSortChange}
              onViewRelease={handleViewRelease}
              onApproveRelease={handleApproveRelease}
              onCompleteRelease={handleCompleteRelease}
              onCancelRelease={handleCancelRelease}
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
                  {data.releases.length} records shown
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
                <span className="font-medium">{data.totalCount}</span> property releases
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
        onClose={() => setActionModal({ isOpen: false, releaseId: null, action: null })}
        onConfirm={confirmAction}
        loading={isProcessing}
        title={getModalTitle()}
        description={getModalDescription()}
      />
    </div>
  );
}