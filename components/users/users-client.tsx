// components/users/users-client.tsx
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
import { UserTable } from '@/components/users/user-table';
import { 
  Plus, 
  RefreshCw, 
  Users, 
  Home,
  FileText,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useCanCreateInCurrentBU,
  useCanUpdateInCurrentBU,
  useCanDeleteInCurrentBU
} from '@/context/business-unit-context';
import { 
  getUsers, 
  deleteUser 
} from '@/lib/actions/user-management-actions';
import type { 
  UserListItem, 
  UserFilters, 
  UserSort, 
  UserStats,
  UserFilterOptions
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
  filterOptions: UserFilterOptions;
}

export function UsersPageClient({
  businessUnitId,
  initialData,
  initialStats,
  initialFilters,
  initialSort,
}: UsersPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const canCreate = useCanCreateInCurrentBU('USER_MANAGEMENT');
  const canUpdate = useCanUpdateInCurrentBU('USER_MANAGEMENT');
  const canDelete = useCanDeleteInCurrentBU('USER_MANAGEMENT');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: UserFilters, newSort: UserSort, page: number = 1) => {
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

  const handleAssignUser = useCallback((userId: string) => {
    router.push(`/${businessUnitId}/users/${userId}/assignments`);
  }, [businessUnitId, router]);

  // Handle delete user
  const handleDeleteUser = useCallback((userId: string) => {
    const user = data.users.find(u => u.id === userId);
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null;
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

  // Handle manage assignments
  const handleManageAssignments = useCallback(() => {
    router.push(`/${businessUnitId}/users/assignments`);
  }, [businessUnitId, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchUsers(filters, sort, data.currentPage);
    });
  }, [fetchUsers, filters, sort, data.currentPage]);

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
              User Management
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage users and their assignments across business units
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
          {canUpdate && (
            <Button variant="outline" onClick={handleManageAssignments}>
              <UserPlus className="h-4 w-4 mr-2" />
              Manage Assignments
            </Button>
          )}
          {canCreate && (
            <Button onClick={handleCreateUser}>
              <Plus className="h-4 w-4 mr-2" />
              New User
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Users</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentlyAdded} added this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Active Users</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Inactive Users</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.inactive.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Role Types</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byRole).length}</div>
            <p className="text-xs text-muted-foreground">
              Different roles assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">System Users ({data.totalCount.toLocaleString()})</h2>
        </div>
        <div>
          <CardContent className="p-0">
            <UserTable
              users={data.users}
              sort={sort}
              onSortChange={handleSortChange}
              onViewUser={handleViewUser}
              onDeleteUser={handleDeleteUser}
              onAssignUser={handleAssignUser}
              canEdit={canUpdate}
              canDelete={canDelete}
              canAssign={canUpdate}
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
                  {data.users.length} records shown
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
        onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: null })}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete User"
        description={`Are you sure you want to delete the user "${deleteModal.userName}"? This action cannot be undone and will remove all associated records.`}
      />
    </div>
  );
}