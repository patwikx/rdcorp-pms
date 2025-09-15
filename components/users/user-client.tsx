// components/users/users-client.tsx
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
import { UserFiltersComponent } from '@/components/users/user-filters';
import { UserTable } from '@/components/users/user-table';
import { 
  Plus, 
  RefreshCw, 
  Users, 
  Home, 
  Filter, 
  UserPlus,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/context/business-unit-context';
import { getUsers, deleteUser } from '@/lib/actions/users-actions';
import type { 
  UserListItem, 
  UserFilters, 
  UserSort, 
  UserStats 
} from '@/types/user-management-types';
import Link from 'next/link';

interface UsersPageClientProps {
  businessUnitId: string;
  initialData: {
    users: UserListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  initialStats: UserStats;
  initialFilters: UserFilters;
  initialSort: UserSort;
  filterOptions: {
    roles: Array<{ id: string; name: string }>;
    businessUnits: Array<{ id: string; name: string }>;
  };
}

export function UsersPageClient({
  businessUnitId,
  initialData,
  initialStats,
  initialFilters,
  initialSort,
  filterOptions,
}: UsersPageClientProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [sort, setSort] = useState<UserSort>(initialSort);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string | null;
  }>({
    isOpen: false,
    userId: null,
    userName: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Permissions
  const { canManageUsers, hasPermission } = usePermissions();
  const canEdit = canManageUsers || hasPermission('users:update');
  const canDelete = canManageUsers || hasPermission('users:delete');
  const canCreate = canManageUsers || hasPermission('users:create');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: UserFilters, newSort: UserSort, page: number = 1) => {
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
    
    const url = `/${businessUnitId}/users${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  }, [businessUnitId, router]);

  // Fetch users data
  const fetchUsers = useCallback(async (
    newFilters: UserFilters, 
    newSort: UserSort, 
    page: number = 1
  ) => {
    try {
      const result = await getUsers(businessUnitId, page, 10, newFilters, newSort);
      setData(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  }, [businessUnitId]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: UserFilters) => {
    setFilters(newFilters);
    startTransition(() => {
      updateURL(newFilters, sort, 1);
      fetchUsers(newFilters, sort, 1);
    });
  }, [sort, updateURL, fetchUsers]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: UserSort) => {
    setSort(newSort);
    startTransition(() => {
      updateURL(filters, newSort, data.currentPage);
      fetchUsers(filters, newSort, data.currentPage);
    });
  }, [filters, data.currentPage, updateURL, fetchUsers]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      updateURL(filters, sort, page);
      fetchUsers(filters, sort, page);
    });
  }, [filters, sort, updateURL, fetchUsers]);

  const handleViewUser = useCallback((userId: string) => {
    router.push(`/${businessUnitId}/users/${userId}`);
  }, [businessUnitId, router]);

  const handleEditUser = useCallback((userId: string) => {
    router.push(`/${businessUnitId}/users/${userId}/edit`);
  }, [businessUnitId, router]);

  // Handle delete user
  const handleDeleteUser = useCallback((userId: string) => {
    const user = data.users.find(u => u.id === userId);
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : null;
    setDeleteModal({
      isOpen: true,
      userId,
      userName,
    });
  }, [data.users]);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!deleteModal.userId) return;

    setIsDeleting(true);
    try {
      const result = await deleteUser(businessUnitId, deleteModal.userId);
      
      if (result.success) {
        toast.success('User deleted successfully');
        // Refresh the data
        await fetchUsers(filters, sort, data.currentPage);
        setDeleteModal({ isOpen: false, userId: null, userName: null });
      } else {
        toast.error(result.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.userId, businessUnitId, fetchUsers, filters, sort, data.currentPage]);

  // Handle create user
  const handleCreateUser = useCallback(() => {
    router.push(`/${businessUnitId}/users/create`);
  }, [businessUnitId, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchUsers(filters, sort, data.currentPage);
    });
  }, [fetchUsers, filters, sort, data.currentPage]);

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
              <Users className="h-3 w-3" />
              Users
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, roles, and permissions in your business unit
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
            <Button onClick={handleCreateUser}>
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filters Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Search & Filter Users</h2>
        </div>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-green-600" />
              User Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              filterOptions={filterOptions}
            />
          </CardContent>
        </Card>
      </div>

      {/* Users Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">User Records</h2>
        </div>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-purple-600" />
                All Users ({data.totalCount.toLocaleString()})
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="bg-muted px-3 py-1 rounded-full font-medium">
                  Page {data.currentPage} of {data.totalPages}
                </span>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {data.users.length} records shown
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 mr-4 ml-4">
            <UserTable
              users={data.users}
              sort={sort}
              onSortChange={handleSortChange}
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
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
                <span className="font-medium">{data.totalCount}</span> users
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
        onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: null })}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete User"
        description={`Are you sure you want to delete user "${deleteModal.userName}"? This action cannot be undone and will remove all associated records.`}
      />
    </div>
  );
}