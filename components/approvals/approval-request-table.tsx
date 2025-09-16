// components/approvals/approval-request-table.tsx
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
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { 
  ApprovalRequestListItem, 
  ApprovalRequestSort 
} from '@/types/approval-types';
import { ApprovalRequestStatus } from '@prisma/client';
import { format } from 'date-fns';

interface ApprovalRequestTableProps {
  requests: ApprovalRequestListItem[];
  sort: ApprovalRequestSort;
  onSortChange: (sort: ApprovalRequestSort) => void;
  onViewRequest: (requestId: string) => void;
  onProcessRequest: (requestId: string) => void;
  onCancelRequest: (requestId: string) => void;
  canProcess: boolean;
  canCancel: boolean;
}

export function ApprovalRequestTable({
  requests,
  sort,
  onSortChange,
  onViewRequest,
  onProcessRequest,
  onCancelRequest,
  canProcess,
  canCancel,
}: ApprovalRequestTableProps) {
  const handleSort = (field: ApprovalRequestSort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        order: sort.order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({ field, order: 'asc' });
    }
  };

  const getSortIcon = (field: ApprovalRequestSort['field']) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
    }
    return sort.order === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-2 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 ml-2 text-blue-600" />;
  };

  const getStatusBadge = (status: ApprovalRequestStatus) => {
    const variants: Record<ApprovalRequestStatus, { className: string; icon: React.ReactNode }> = {
      PENDING: { 
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      IN_PROGRESS: { 
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      APPROVED: { 
        className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      REJECTED: { 
        className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      CANCELLED: { 
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      OVERRIDDEN: { 
        className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200',
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      },
      EXPIRED: { 
        className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200',
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      },
    };

    const config = variants[status];
    return (
      <Badge className={`${config.className} font-medium flex items-center`}>
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null }) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const canProcessRequest = (request: ApprovalRequestListItem) => {
    return canProcess && (request.status === ApprovalRequestStatus.PENDING || request.status === ApprovalRequestStatus.IN_PROGRESS);
  };

  const canCancelRequest = (request: ApprovalRequestListItem) => {
    return canCancel && (request.status === ApprovalRequestStatus.PENDING || request.status === ApprovalRequestStatus.IN_PROGRESS);
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No approval requests found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No approval requests match your current search criteria. Try adjusting your filters or create a new approval request.
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
                onClick={() => handleSort('createdAt')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Request Date
                {getSortIcon('createdAt')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Property</TableHead>
            <TableHead className="font-semibold">Workflow</TableHead>
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('status')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Status
                {getSortIcon('status')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Current Step</TableHead>
            <TableHead className="font-semibold">Requested By</TableHead>
            <TableHead className="font-semibold">Responses</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>
                <div className="flex items-center space-x-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(request.createdAt), 'HH:mm')}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <div>
                    <button
                      onClick={() => onViewRequest(request.id)}
                      className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {request.property.titleNumber}
                    </button>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={request.property.location}>
                      {request.property.location}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{request.workflow.name}</div>
                <div className="text-xs text-muted-foreground">
                  {request.entityType.replace('_', ' ')}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(request.status)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-medium">
                    {request.currentStepOrder}
                  </div>
                  <span className="text-sm">Step {request.currentStepOrder}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{getUserName(request.requestedBy)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
                    {request._count.responses}
                  </div>
                  <span className="text-sm text-muted-foreground">responses</span>
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
                    <DropdownMenuItem onClick={() => onViewRequest(request.id)}>
                      <Eye className="mr-2 h-4 w-4 text-blue-600" />
                      View Details
                    </DropdownMenuItem>
                    {canProcessRequest(request) && (
                      <DropdownMenuItem onClick={() => onProcessRequest(request.id)}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Process Request
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {canCancelRequest(request) && (
                      <DropdownMenuItem 
                        onClick={() => onCancelRequest(request.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Request
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