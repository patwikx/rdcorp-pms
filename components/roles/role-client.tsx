// components/roles/roles-client.tsx
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
import { RoleFiltersComponent } from '@/components/roles/role-filters';
import { RoleTable } from '@/components/roles/role-table';
import { 
  Plus, 
  RefreshCw, 
  Shield, 
  Home, 
  Filter, 
  ShieldCheck,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/context/business-unit-context';
import { getRoles, deleteRole } from '@/lib/actions/roles-actions';
import type { 
  RoleListItem, 
  RoleFilters, 
  RoleSort, 
  RoleStats 
} from '@/types/user-management-types';
import Link from 'next/link';

interface RolesPageClientProps {
  businessUnitId: string;
  initialData: {
    roles: RoleListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  initialStats: RoleStats;
  initialFilters: RoleFilters;
  initialSort: RoleSort;
}

export function RolesPageClient({
  businessUnitId,
  initialData,
  initialStats,
  initialFilters,
  initialSort,
}: RolesPageClientProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  const [filters, setFilters] = useState<RoleFilters>(initialFilters);
  const [sort, setSort] = useState<RoleSort>(initialSort);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    roleId: string | null;
    roleName: string | null;
  }>({
    isOpen: false,
    roleId: null,
    roleName: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Permissions
  const { canManageRoles, hasPermission } = usePermissions();
  const canEdit = canManageRoles || hasPermission('roles:update');
  const canDelete = canManageRoles || hasPermission('roles:delete');
  const canCreate = canManageRoles || hasPermission('roles:create');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: RoleFilters, newSort: RoleSort, page: number = 1) => {
    const params = new URLSearchParams();
    
    // Add pagination
    if (page > 1) params.set('page', page.toString());
    
    // Add filters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, value.toString());
      }
    });
    
    // Add sort
    if (newSort.field !== 'createdAt') params.set('sortField', newSort.field);
    if (newSort.order !== 'desc') params.set('sortOrder', newSort.order);
    
    const url = `/${businessUnitId}/roles${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  }, [businessUnitId, router]);

  // Fetch roles data
  const fetchRoles = useCallback(async (
    newFilters: RoleFilters, 
    newSort: RoleSort, 
    page: number = 1
  ) => {
    try {
      const result = await getRoles(businessUnitId, page, 10, newFilters, newSort);
      setData(result);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    }
  }, [businessUnitId]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: RoleFilters) => {
    setFilters(newFilters);
    startTransition(() => {
      updateURL(newFilters, sort, 1);
      fetchRoles(newFilters, sort, 1);
    });
  }, [sort, updateURL, fetchRoles]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: RoleSort) => {
    setSort(newSort);
    startTransition(() => {
      updateURL(filters, newSort, data.currentPage);
      fetchRoles(filters, newSort, data.currentPage);
    });
  }, [filters, data.currentPage, updateURL, fetchRoles]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      updateURL(filters, sort, page);
      fetchRoles(filters, sort, page);
    });
  }, [filters, sort, updateURL, fetchRoles]);

  const handleViewRole = useCallback((roleId: string) => {
    router.push(`/${businessUnitId}/roles/${roleId}`);
  }, [businessUnitId, router]);

  const handleEditRole = useCallback((roleId: string) => {
    router.push(`/${businessUnitId}/roles/${roleId}/edit`);
  }, [businessUnitId, router]);

  // Handle delete role
  const handleDeleteRole = useCallback((roleId: string) => {
    const role = data.roles.find(r => r.id === roleId);
    setDeleteModal({
      isOpen: true,
      roleId,
      roleName: role?.name || null,
    });
  }, [data.roles]);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!deleteModal.roleId) return;

    setIsDeleting(true);
    try {
      const result = await deleteRole(businessUnitId, deleteModal.roleId);
      
      if (result.success) {
        toast.success('Role deleted successfully');
        // Refresh the data
        await fetchRoles(filters, sort, data.currentPage);
        setDeleteModal({ isOpen: false, roleId: null, roleName: null });
      } else {
        toast.error(result.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.roleId, businessUnitId, fetchRoles, filters, sort, data.currentPage]);

  // Handle create role
  const handleCreateRole = useCallback(() => {
    router.push(`/${businessUnitId}/roles/create`);
  }, [businessUnitId, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchRoles(filters, sort, data.currentPage);
    });
  }, [fetchRoles, filters, sort, data.currentPage]);

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
              <Shield className="h-3 w-3" />
              Roles
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage roles and permissions in your business unit
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
            <Button onClick={handleCreateRole}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Role
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filters Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Search & Filter Roles</h2>
        </div>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-green-600" />
              Role Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RoleFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* Roles Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Role Records</h2>
        </div>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-purple-600" />
                All Roles ({data.totalCount.toLocaleString()})
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="bg-muted px-3 py-1 rounded-full font-medium">
                  Page {data.currentPage} of {data.totalPages}
                </span>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {data.roles.length} records shown
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 mr-4 ml-4">
            <RoleTable
              roles={data.roles}
              sort={sort}
              onSortChange={handleSortChange}
              onViewRole={handleViewRole}
              onEditRole={handleEditRole}
              onDeleteRole={handleDeleteRole}
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
                <span className="font-medium">{data.totalCount}</span> roles
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
        onClose={() => setDeleteModal({ isOpen: false, roleId: null, roleName: null })}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Role"
        description={`Are you sure you want to delete role "${deleteModal.roleName}"? This action cannot be undone. Make sure no users are assigned to this role before deleting.`}
      />
    </div>
  );
}