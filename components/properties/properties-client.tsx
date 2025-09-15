// app/(dashboard)/[businessUnitId]/properties/properties-client.tsx
'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PropertyDetailPanel } from '@/components/properties/property-detail-panel';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/context/business-unit-context';
import { getProperties, getPropertyById, deleteProperty } from '@/lib/actions/property-actions';
import type { 
  PropertyListItem, 
  PropertyDetails, 
  PropertyFilters, 
  PropertySort, 
  PropertyStats 
} from '@/types/property-types';
import { PropertyStatsCards } from './property-stat-cards';

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
  const [selectedProperty, setSelectedProperty] = useState<PropertyDetails | null>(null);
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

  // Handle view property
  const handleViewProperty = useCallback(async (propertyId: string) => {
    try {
      const property = await getPropertyById(businessUnitId, propertyId);
      if (property) {
        setSelectedProperty(property);
        setIsDetailPanelOpen(true);
      } else {
        toast.error('Property not found');
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      toast.error('Failed to load property details');
    }
  }, [businessUnitId]);

  // Handle edit property
  const handleEditProperty = useCallback((propertyId: string) => {
    router.push(`/${businessUnitId}/properties/${propertyId}/edit`);
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Manage and track all property records in your business unit
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button onClick={handleCreateProperty}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <PropertyStatsCards stats={stats} />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Property Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={filterOptions}
          />
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Properties ({data.totalCount.toLocaleString()})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Page {data.currentPage} of {data.totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PropertyTable
            properties={data.properties}
            sort={sort}
            onSortChange={handleSortChange}
            onViewProperty={handleViewProperty}
            onEditProperty={handleEditProperty}
            onDeleteProperty={handleDeleteProperty}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(data.currentPage - 1)}
                  className={data.currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {generatePaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(data.currentPage + 1)}
                  className={data.currentPage >= data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Property Detail Panel */}
      <PropertyDetailPanel
        property={selectedProperty}
        isOpen={isDetailPanelOpen}
        onClose={() => {
          setIsDetailPanelOpen(false);
          setSelectedProperty(null);
        }}
        onEdit={handleEditProperty}
        canEdit={canEdit}
      />

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