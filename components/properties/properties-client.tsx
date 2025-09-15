// app/(dashboard)/[businessUnitId]/properties/properties-client.tsx
'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AlertModal } from '@/components/modals/alert-modal';
import { PropertyFiltersComponent } from '@/components/properties/property-filters';
import { PropertyTable } from '@/components/properties/property-table';
import { 
  Plus, 
  RefreshCw, 
  Building2, 
  Home, 
  Filter, 
  BarChart3,
  FileText,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/context/business-unit-context';
import { getProperties, deleteProperty } from '@/lib/actions/property-actions';
import type { 
  PropertyListItem, 
  PropertyDetails, 
  PropertyFilters, 
  PropertySort, 
  PropertyStats 
} from '@/types/property-types';
import { PropertyStatsCards } from './property-stat-cards';
import Link from 'next/link';

interface PropertiesPageClientProps {
  businessUnitId: string;
  initialData: {
    properties: PropertyListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  initialStats: PropertyStats;
  initialFilters: PropertyFilters;
  initialSort: PropertySort;
  filterOptions: {
    locations: string[];
    registeredOwners: string[];
    createdByUsers: Array<{ id: string; name: string }>;
  };
}

export function PropertiesPageClient({
  businessUnitId,
  initialData,
  initialStats,
  initialFilters,
  initialSort,
  filterOptions,
}: PropertiesPageClientProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [sort, setSort] = useState<PropertySort>(initialSort);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedProperty, setSelectedProperty] = useState<PropertyDetails | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    propertyId: string | null;
    propertyTitle: string | null;
  }>({
    isOpen: false,
    propertyId: null,
    propertyTitle: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Permissions
  const { canManageProperties, hasPermission } = usePermissions();
  const canEdit = canManageProperties || hasPermission('properties:update');
  const canDelete = canManageProperties || hasPermission('properties:delete');
  const canCreate = canManageProperties || hasPermission('properties:create');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: PropertyFilters, newSort: PropertySort, page: number = 1) => {
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
    
    const url = `/${businessUnitId}/properties${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  }, [businessUnitId, router]);

  // Fetch properties data
  const fetchProperties = useCallback(async (
    newFilters: PropertyFilters, 
    newSort: PropertySort, 
    page: number = 1
  ) => {
    try {
      const result = await getProperties(businessUnitId, page, 10, newFilters, newSort);
      setData(result);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    }
  }, [businessUnitId]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: PropertyFilters) => {
    setFilters(newFilters);
    startTransition(() => {
      updateURL(newFilters, sort, 1);
      fetchProperties(newFilters, sort, 1);
    });
  }, [sort, updateURL, fetchProperties]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: PropertySort) => {
    setSort(newSort);
    startTransition(() => {
      updateURL(filters, newSort, data.currentPage);
      fetchProperties(filters, newSort, data.currentPage);
    });
  }, [filters, data.currentPage, updateURL, fetchProperties]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      updateURL(filters, sort, page);
      fetchProperties(filters, sort, page);
    });
  }, [filters, sort, updateURL, fetchProperties]);

const handleViewProperty = useCallback((propertyId: string) => {
  router.push(`/${businessUnitId}/properties/${propertyId}`);
}, [businessUnitId, router]);

  // Handle delete property
  const handleDeleteProperty = useCallback((propertyId: string) => {
    const property = data.properties.find(p => p.id === propertyId);
    setDeleteModal({
      isOpen: true,
      propertyId,
      propertyTitle: property?.titleNumber || null,
    });
  }, [data.properties]);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!deleteModal.propertyId) return;

    setIsDeleting(true);
    try {
      const result = await deleteProperty(businessUnitId, deleteModal.propertyId);
      
      if (result.success) {
        toast.success('Property deleted successfully');
        // Refresh the data
        await fetchProperties(filters, sort, data.currentPage);
        setDeleteModal({ isOpen: false, propertyId: null, propertyTitle: null });
      } else {
        toast.error(result.error || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.propertyId, businessUnitId, fetchProperties, filters, sort, data.currentPage]);

  // Handle create property
  const handleCreateProperty = useCallback(() => {
    router.push(`/${businessUnitId}/properties/create`);
  }, [businessUnitId, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchProperties(filters, sort, data.currentPage);
    });
  }, [fetchProperties, filters, sort, data.currentPage]);

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const { currentPage, totalPages } = data;
    
    // Always show first page
    if (currentPage > 3) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    // Show pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => handlePageChange(i)}
            isActive={i === currentPage}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
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
              <Building2 className="h-3 w-3" />
              Properties
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all property records in your business unit
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
            <Button onClick={handleCreateProperty}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Property
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Property Statistics</h2>
        </div>
        <PropertyStatsCards stats={stats} />
      </div>

      {/* Search & Filters Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Search & Filter Properties</h2>
        </div>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-green-600" />
              Property Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              filterOptions={filterOptions}
            />
          </CardContent>
        </Card>
      </div>

      {/* Properties Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Property Records</h2>
        </div>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-purple-600" />
                All Properties ({data.totalCount.toLocaleString()})
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="bg-muted px-3 py-1 rounded-full font-medium">
                  Page {data.currentPage} of {data.totalPages}
                </span>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {data.properties.length} records shown
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 mr-4 ml-4">
            <PropertyTable
              properties={data.properties}
              sort={sort}
              onSortChange={handleSortChange}
              onViewProperty={handleViewProperty}
              onDeleteProperty={handleDeleteProperty}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </CardContent>
        </Card>
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
                <span className="font-medium">{data.totalCount}</span> properties
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(data.currentPage - 1)}
                      className={data.currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-50'}
                    />
                  </PaginationItem>
                  
                  {generatePaginationItems()}
                  
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

      {/* Delete Confirmation Modal */}
      <AlertModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, propertyId: null, propertyTitle: null })}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Property"
        description={`Are you sure you want to delete property "${deleteModal.propertyTitle}"? This action cannot be undone and will remove all associated records.`}
      />
    </div>
  );
}