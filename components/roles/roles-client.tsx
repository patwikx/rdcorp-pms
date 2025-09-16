// components/roles/roles-client.tsx
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
import { RoleTable } from '@/components/roles/roles-table';
import { 
  Plus, 
  RefreshCw, 
  Shield, 
  Home,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useCanCreateInCurrentBU,
  useCanUpdateInCurrentBU,
  useCanDeleteInCurrentBU
} from '@/context/business-unit-context';
import { 
  getRoles, 
  deleteRole 
} from '@/lib/actions/role-actions';
import type { 
  RoleListItem, 
  RoleFilters, 
  RoleSort, 
  RoleStats
} from '@/types/role-types';
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
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const canCreate = useCanCreateInCurrentBU('ROLES');
  const canUpdate = useCanUpdateInCurrentBU('ROLES');
  const canDelete = useCanDeleteInCurrentBU('ROLES');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: RoleFilters, newSort: RoleSort, page: number = 1) => {
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
    if (newSort.field !== 'level') params.set('sortField', newSort.field);
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
              Roles & Permissions
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and their permissions across the system
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
              New Role
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Roles</div>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentlyCreated} created this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">With Permissions</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.withPermissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.withPermissions / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">With Members</div>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.withMembers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.withMembers / stats.total) * 100) : 0}% assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Permissions</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalPermissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgPermissionsPerRole.toFixed(1)} avg per role
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roles Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">System Roles ({data.totalCount.toLocaleString()})</h2>
        </div>
        <div>
          <CardContent className="p-0">
            <RoleTable
              roles={data.roles}
              sort={sort}
              onSortChange={handleSortChange}
              onViewRole={handleViewRole}
              onDeleteRole={handleDeleteRole}
              canEdit={canUpdate}
              canDelete={canDelete}
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
                  {data.roles.length} records shown
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

      {/* Delete Confirmation Modal */}
      <AlertModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, roleId: null, roleName: null })}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${deleteModal.roleName}"? This action cannot be undone and will affect any users assigned to this role.`}
      />
    </div>
  );
}