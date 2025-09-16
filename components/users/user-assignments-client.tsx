// components/users/user-assignments-client.tsx
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
import { UserAssignmentTable } from '@/components/users/user-assignment-table';
import { 
  Plus, 
  RefreshCw, 
  UserPlus, 
  Home,
  FileText,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useCanCreateInCurrentBU,
  useCanUpdateInCurrentBU,
  useCanDeleteInCurrentBU
} from '@/context/business-unit-context';
import { 
  getUserAssignments, 
  removeUserFromBusinessUnit 
} from '@/lib/actions/user-management-actions';
import type { 
  UserAssignmentListItem, 
  UserAssignmentFilters, 
  UserAssignmentSort, 
  UserAssignmentStats,
  UserAssignmentFilterOptions
} from '@/types/user-management-types';
import Link from 'next/link';

interface UserAssignmentsPageClientProps {
  businessUnitId: string;
  initialData: {
    assignments: UserAssignmentListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  initialStats: UserAssignmentStats;
  initialFilters: UserAssignmentFilters;
  initialSort: UserAssignmentSort;
  filterOptions: UserAssignmentFilterOptions;
}

export function UserAssignmentsPageClient({
  businessUnitId,
  initialData,
  initialStats,
  initialFilters,
  initialSort,
}: UserAssignmentsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filters, setFilters] = useState<UserAssignmentFilters>(initialFilters);
  const [sort, setSort] = useState<UserAssignmentSort>(initialSort);
  const [removeModal, setRemoveModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    businessUnitId: string | null;
    userName: string | null;
  }>({
    isOpen: false,
    userId: null,
    businessUnitId: null,
    userName: null,
  });
  const [isRemoving, setIsRemoving] = useState(false);

  const canCreate = useCanCreateInCurrentBU('USER_MANAGEMENT');
  const canUpdate = useCanUpdateInCurrentBU('USER_MANAGEMENT');
  const canRemove = useCanDeleteInCurrentBU('USER_MANAGEMENT');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: UserAssignmentFilters, newSort: UserAssignmentSort, page: number = 1) => {
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
    if (newSort.field !== 'joinedAt') params.set('sortField', newSort.field);
    if (newSort.order !== 'desc') params.set('sortOrder', newSort.order);
    
    const url = `/${businessUnitId}/users/assignments${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  }, [businessUnitId, router]);

  // Fetch assignments data
  const fetchAssignments = useCallback(async (
    newFilters: UserAssignmentFilters, 
    newSort: UserAssignmentSort, 
    page: number = 1
  ) => {
    try {
      const result = await getUserAssignments(businessUnitId, page, 10, newFilters, newSort);
      setData(result);
    } catch (error) {
      console.error('Error fetching user assignments:', error);
      toast.error('Failed to load user assignments');
    }
  }, [businessUnitId]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: UserAssignmentSort) => {
    setSort(newSort);
    startTransition(() => {
      updateURL(filters, newSort, data.currentPage);
      fetchAssignments(filters, newSort, data.currentPage);
    });
  }, [filters, data.currentPage, updateURL, fetchAssignments]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      updateURL(filters, sort, page);
      fetchAssignments(filters, sort, page);
    });
  }, [filters, sort, updateURL, fetchAssignments]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleViewAssignment = useCallback((userId: string, targetBusinessUnitId: string) => {
    router.push(`/${businessUnitId}/users/${userId}`);
  }, [businessUnitId, router]);

  const handleEditAssignment = useCallback((userId: string, targetBusinessUnitId: string) => {
    router.push(`/${businessUnitId}/users/assignments/${userId}/${targetBusinessUnitId}/edit`);
  }, [businessUnitId, router]);

  // Handle remove assignment
  const handleRemoveAssignment = useCallback((userId: string, targetBusinessUnitId: string) => {
    const assignment = data.assignments.find(a => a.userId === userId && a.businessUnitId === targetBusinessUnitId);
    const userName = assignment ? `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim() : null;
    setRemoveModal({
      isOpen: true,
      userId,
      businessUnitId: targetBusinessUnitId,
      userName,
    });
  }, [data.assignments]);

  // Confirm remove
  const confirmRemove = useCallback(async () => {
    if (!removeModal.userId || !removeModal.businessUnitId) return;

    setIsRemoving(true);
    try {
      const result = await removeUserFromBusinessUnit(businessUnitId, removeModal.userId, removeModal.businessUnitId);
      
      if (result.success) {
        toast.success('User assignment removed successfully');
        // Refresh the data
        await fetchAssignments(filters, sort, data.currentPage);
        setRemoveModal({ isOpen: false, userId: null, businessUnitId: null, userName: null });
      } else {
        toast.error(result.error || 'Failed to remove user assignment');
      }
    } catch (error) {
      console.error('Error removing user assignment:', error);
      toast.error('Failed to remove user assignment');
    } finally {
      setIsRemoving(false);
    }
  }, [removeModal.userId, removeModal.businessUnitId, businessUnitId, fetchAssignments, filters, sort, data.currentPage]);

  // Handle create assignment
  const handleCreateAssignment = useCallback(() => {
    router.push(`/${businessUnitId}/users/assignments/create`);
  }, [businessUnitId, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchAssignments(filters, sort, data.currentPage);
    });
  }, [fetchAssignments, filters, sort, data.currentPage]);

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
            <BreadcrumbLink asChild>
              <Link href={`/${businessUnitId}/users`} className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                User Management
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              User Assignments
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Assignments</h1>
          <p className="text-muted-foreground mt-2">
            Manage user assignments across business units and roles
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
            <Button onClick={handleCreateAssignment}>
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Total Assignments</div>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentAssignments} created this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Active Assignments</div>
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
              <div className="text-sm font-medium">Business Units</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{Object.keys(stats.byBusinessUnit).length}</div>
            <p className="text-xs text-muted-foreground">
              Units with assignments
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

      {/* User Assignments Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">User Assignments ({data.totalCount.toLocaleString()})</h2>
        </div>
        <div>
          <CardContent className="p-0">
            <UserAssignmentTable
              assignments={data.assignments}
              sort={sort}
              onSortChange={handleSortChange}
              onViewAssignment={handleViewAssignment}
              onEditAssignment={handleEditAssignment}
              onRemoveAssignment={handleRemoveAssignment}
              canEdit={canUpdate}
              canRemove={canRemove}
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
                  {data.assignments.length} records shown
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
                <span className="font-medium">{data.totalCount}</span> assignments
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

      {/* Remove Confirmation Modal */}
      <AlertModal
        isOpen={removeModal.isOpen}
        onClose={() => setRemoveModal({ isOpen: false, userId: null, businessUnitId: null, userName: null })}
        onConfirm={confirmRemove}
        loading={isRemoving}
        title="Remove User Assignment"
        description={`Are you sure you want to remove the assignment for "${removeModal.userName}"? This will revoke their access to the selected business unit.`}
      />
    </div>
  );
}