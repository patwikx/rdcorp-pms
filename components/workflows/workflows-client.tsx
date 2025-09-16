// components/workflows/workflows-client.tsx
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
import { 
  Plus, 
  RefreshCw, 
  Settings, 
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
  getApprovalWorkflows, 
  deleteApprovalWorkflow,
  toggleApprovalWorkflowStatus,
  duplicateApprovalWorkflow
} from '@/lib/actions/approval-workflow-actions';
import type { 
  ApprovalWorkflowListItem, 
  ApprovalWorkflowFilters, 
  ApprovalWorkflowSort, 
  ApprovalWorkflowStats
} from '@/types/approval-workflow-types';
import Link from 'next/link';
import { ApprovalWorkflowTable } from './approval-workflow-table';

interface ApprovalWorkflowsPageClientProps {
  businessUnitId: string;
  initialData: {
    workflows: ApprovalWorkflowListItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  initialStats: ApprovalWorkflowStats;
  initialFilters: ApprovalWorkflowFilters;
  initialSort: ApprovalWorkflowSort;
  filterOptions: {
    entityTypes: Array<{ value: string; label: string; count: number }>;
  };
}

export function ApprovalWorkflowsPageClient({
  businessUnitId,
  initialData,
  initialStats,
  initialFilters,
  initialSort,
}: ApprovalWorkflowsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State management
  const [data, setData] = useState(initialData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState(initialStats);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filters, setFilters] = useState<ApprovalWorkflowFilters>(initialFilters);
  const [sort, setSort] = useState<ApprovalWorkflowSort>(initialSort);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    workflowId: string | null;
    workflowName: string | null;
    action: 'delete' | 'toggle' | 'duplicate' | null;
  }>({
    isOpen: false,
    workflowId: null,
    workflowName: null,
    action: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  const canCreate = useCanCreateInCurrentBU('APPROVAL');
  const canUpdate = useCanUpdateInCurrentBU('APPROVAL');
  const canDelete = useCanDeleteInCurrentBU('APPROVAL');

  // Update URL with current filters and sort
  const updateURL = useCallback((newFilters: ApprovalWorkflowFilters, newSort: ApprovalWorkflowSort, page: number = 1) => {
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
    
    const url = `/${businessUnitId}/workflows${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  }, [businessUnitId, router]);

  // Fetch workflows data
  const fetchWorkflows = useCallback(async (
    newFilters: ApprovalWorkflowFilters, 
    newSort: ApprovalWorkflowSort, 
    page: number = 1
  ) => {
    try {
      const result = await getApprovalWorkflows(businessUnitId, page, 10, newFilters, newSort);
      setData(result);
    } catch (error) {
      console.error('Error fetching approval workflows:', error);
      toast.error('Failed to load approval workflows');
    }
  }, [businessUnitId]);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: ApprovalWorkflowSort) => {
    setSort(newSort);
    startTransition(() => {
      updateURL(filters, newSort, data.currentPage);
      fetchWorkflows(filters, newSort, data.currentPage);
    });
  }, [filters, data.currentPage, updateURL, fetchWorkflows]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    startTransition(() => {
      updateURL(filters, sort, page);
      fetchWorkflows(filters, sort, page);
    });
  }, [filters, sort, updateURL, fetchWorkflows]);

  const handleViewWorkflow = useCallback((workflowId: string) => {
    router.push(`/${businessUnitId}/workflows/${workflowId}`);
  }, [businessUnitId, router]);

  // Handle delete workflow
  const handleDeleteWorkflow = useCallback((workflowId: string) => {
    const workflow = data.workflows.find(w => w.id === workflowId);
    setActionModal({
      isOpen: true,
      workflowId,
      workflowName: workflow?.name || null,
      action: 'delete',
    });
  }, [data.workflows]);

  // Handle toggle workflow status
  const handleToggleWorkflow = useCallback((workflowId: string) => {
    const workflow = data.workflows.find(w => w.id === workflowId);
    setActionModal({
      isOpen: true,
      workflowId,
      workflowName: workflow?.name || null,
      action: 'toggle',
    });
  }, [data.workflows]);

  // Handle duplicate workflow
  const handleDuplicateWorkflow = useCallback((workflowId: string) => {
    const workflow = data.workflows.find(w => w.id === workflowId);
    setDuplicateName(`Copy of ${workflow?.name || 'Workflow'}`);
    setActionModal({
      isOpen: true,
      workflowId,
      workflowName: workflow?.name || null,
      action: 'duplicate',
    });
  }, [data.workflows]);

  // Confirm action
  const confirmAction = useCallback(async () => {
    if (!actionModal.workflowId || !actionModal.action) return;

    setIsProcessing(true);
    try {
      let result;
      let successMessage = '';

      switch (actionModal.action) {
        case 'delete':
          result = await deleteApprovalWorkflow(businessUnitId, actionModal.workflowId);
          successMessage = 'Approval workflow deleted successfully';
          break;
        case 'toggle':
          result = await toggleApprovalWorkflowStatus(businessUnitId, actionModal.workflowId);
          successMessage = 'Workflow status updated successfully';
          break;
        case 'duplicate':
          if (!duplicateName.trim()) {
            toast.error('Please provide a name for the duplicated workflow');
            return;
          }
          result = await duplicateApprovalWorkflow(businessUnitId, actionModal.workflowId, duplicateName.trim());
          successMessage = 'Workflow duplicated successfully';
          break;
        default:
          throw new Error('Invalid action');
      }
      
      if (result.success) {
        toast.success(successMessage);
        // Refresh the data
        await fetchWorkflows(filters, sort, data.currentPage);
        setActionModal({ isOpen: false, workflowId: null, workflowName: null, action: null });
        setDuplicateName('');
      } else {
        toast.error(result.error || `Failed to ${actionModal.action} workflow`);
      }
    } catch (error) {
      console.error(`Error ${actionModal.action}ing workflow:`, error);
      toast.error(`Failed to ${actionModal.action} workflow`);
    } finally {
      setIsProcessing(false);
    }
  }, [actionModal.workflowId, actionModal.action, businessUnitId, fetchWorkflows, filters, sort, data.currentPage, duplicateName]);

  // Handle create workflow
  const handleCreateWorkflow = useCallback(() => {
    router.push(`/${businessUnitId}/workflows/create`);
  }, [businessUnitId, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      fetchWorkflows(filters, sort, data.currentPage);
    });
  }, [fetchWorkflows, filters, sort, data.currentPage]);

  const getModalTitle = () => {
    switch (actionModal.action) {
      case 'delete':
        return 'Delete Approval Workflow';
      case 'toggle':
        return 'Toggle Workflow Status';
      case 'duplicate':
        return 'Duplicate Approval Workflow';
      default:
        return 'Confirm Action';
    }
  };

  const getModalDescription = () => {
    switch (actionModal.action) {
      case 'delete':
        return `Are you sure you want to delete the workflow "${actionModal.workflowName}"? This action cannot be undone and will affect any pending approval requests.`;
      case 'toggle':
        const workflow = data.workflows.find(w => w.id === actionModal.workflowId);
        const newStatus = workflow?.isActive ? 'deactivate' : 'activate';
        return `Are you sure you want to ${newStatus} the workflow "${actionModal.workflowName}"?`;
      case 'duplicate':
        return `Create a copy of the workflow "${actionModal.workflowName}" with the name "${duplicateName}"?`;
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
              <Settings className="h-3 w-3" />
              Approval Workflows
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Workflows</h1>
          <p className="text-muted-foreground mt-2">
            Manage approval workflows for your business processes
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
            <Button onClick={handleCreateWorkflow}>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          )}
        </div>
      </div>

      {/* Workflows Data Table */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Approval Workflows ({data.totalCount.toLocaleString()})</h2>
        </div>
        <div>
          <CardContent className="p-0">
            <ApprovalWorkflowTable
              workflows={data.workflows}
              sort={sort}
              onSortChange={handleSortChange}
              onViewWorkflow={handleViewWorkflow}
              onDeleteWorkflow={handleDeleteWorkflow}
              onToggleWorkflow={handleToggleWorkflow}
              onDuplicateWorkflow={handleDuplicateWorkflow}
              canEdit={canUpdate}
              canDelete={canDelete}
              canToggle={canUpdate}
              canDuplicate={canCreate}
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
                  {data.workflows.length} records shown
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
                <span className="font-medium">{data.totalCount}</span> workflows
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
        onClose={() => {
          setActionModal({ isOpen: false, workflowId: null, workflowName: null, action: null });
          setDuplicateName('');
        }}
        onConfirm={confirmAction}
        loading={isProcessing}
        title={getModalTitle()}
        description={getModalDescription()}
      />

      {/* Duplicate Name Input Modal */}
      {actionModal.action === 'duplicate' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Duplicate Workflow</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">New Workflow Name</label>
                  <input
                    type="text"
                    value={duplicateName}
                    onChange={(e) => setDuplicateName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="Enter name for duplicated workflow"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionModal({ isOpen: false, workflowId: null, workflowName: null, action: null });
                      setDuplicateName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmAction}
                    disabled={!duplicateName.trim() || isProcessing}
                  >
                    {isProcessing ? 'Duplicating...' : 'Duplicate'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}