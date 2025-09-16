// components/workflows/approval-workflow-table.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye,  
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings,
  Calendar,
  Copy,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { 
  ApprovalWorkflowListItem, 
  ApprovalWorkflowSort 
} from '@/types/approval-workflow-types';
import { format } from 'date-fns';

interface ApprovalWorkflowTableProps {
  workflows: ApprovalWorkflowListItem[];
  sort: ApprovalWorkflowSort;
  onSortChange: (sort: ApprovalWorkflowSort) => void;
  onViewWorkflow: (workflowId: string) => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onToggleWorkflow: (workflowId: string) => void;
  onDuplicateWorkflow: (workflowId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  canToggle: boolean;
  canDuplicate: boolean;
}

export function ApprovalWorkflowTable({
  workflows,
  sort,
  onSortChange,
  onViewWorkflow,
  onDeleteWorkflow,
  onToggleWorkflow,
  onDuplicateWorkflow,
  canDelete,
  canToggle,
  canDuplicate,
}: ApprovalWorkflowTableProps) {
  const handleSort = (field: ApprovalWorkflowSort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        order: sort.order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({ field, order: 'asc' });
    }
  };

  const getSortIcon = (field: ApprovalWorkflowSort['field']) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
    }
    return sort.order === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-2 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 ml-2 text-blue-600" />;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 font-medium flex items-center">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200 font-medium flex items-center">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getEntityTypeBadge = (entityType: string) => {
    const colors: Record<string, string> = {
      PROPERTY_RELEASE: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
      PROPERTY_TURNOVER: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
      PROPERTY_RETURN: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50',
      RPT_PAYMENT: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50',
      DOCUMENT_APPROVAL: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50',
      USER_ASSIGNMENT: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-50',
    };

    const className = colors[entityType] || 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';

    return (
      <Badge variant="outline" className={`${className} font-medium`}>
        {entityType.replace('_', ' ')}
      </Badge>
    );
  };

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Settings className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No approval workflows found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No approval workflows match your current search criteria. Try adjusting your filters or create a new workflow to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('name')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Workflow Name
                {getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('entityType')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Entity Type
                {getSortIcon('entityType')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold text-center">Steps</TableHead>
            <TableHead className="font-semibold text-center">Requests</TableHead>
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('isActive')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Status
                {getSortIcon('isActive')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('createdAt')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Created
                {getSortIcon('createdAt')}
              </Button>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflows.map((workflow) => (
            <TableRow key={workflow.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <div>
                    <button
                      onClick={() => onViewWorkflow(workflow.id)}
                      className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {workflow.name}
                    </button>
                    {workflow.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={workflow.description}>
                        {workflow.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getEntityTypeBadge(workflow.entityType)}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-medium">
                    {workflow._count.steps}
                  </div>
                  <span className="text-sm text-muted-foreground">steps</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-medium">
                    {workflow._count.requests}
                  </div>
                  <span className="text-sm text-muted-foreground">requests</span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(workflow.isActive)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{format(new Date(workflow.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(workflow.createdAt), 'HH:mm')}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewWorkflow(workflow.id)}>
                      <Eye className="mr-2 h-4 w-4 text-blue-600" />
                      View & Edit
                    </DropdownMenuItem>
                    {canDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicateWorkflow(workflow.id)}>
                        <Copy className="mr-2 h-4 w-4 text-green-600" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {canToggle && (
                      <DropdownMenuItem onClick={() => onToggleWorkflow(workflow.id)}>
                        {workflow.isActive ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4 text-orange-600" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4 text-green-600" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDeleteWorkflow(workflow.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Workflow
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}