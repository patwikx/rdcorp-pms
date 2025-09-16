// components/returns/property-return-table.tsx
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
  RotateCcw,
  MapPin,
} from 'lucide-react';
import type { 
  PropertyReturnListItem, 
  PropertyReturnSort 
} from '@/types/return-types';
import { TransactionStatus, ReturnType } from '@prisma/client';
import { format } from 'date-fns';

interface PropertyReturnTableProps {
  returns: PropertyReturnListItem[];
  sort: PropertyReturnSort;
  onSortChange: (sort: PropertyReturnSort) => void;
  onViewReturn: (returnId: string) => void;
  onApproveReturn: (returnId: string) => void;
  onCompleteReturn: (returnId: string) => void;
  onCancelReturn: (returnId: string) => void;
  canApprove: boolean;
  canComplete: boolean;
  canCancel: boolean;
}

export function PropertyReturnTable({
  returns,
  sort,
  onSortChange,
  onViewReturn,
  onApproveReturn,
  onCompleteReturn,
  onCancelReturn,
  canApprove,
  canComplete,
  canCancel,
}: PropertyReturnTableProps) {
  const handleSort = (field: PropertyReturnSort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        order: sort.order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({ field, order: 'asc' });
    }
  };

  const getSortIcon = (field: PropertyReturnSort['field']) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
    }
    return sort.order === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-2 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 ml-2 text-blue-600" />;
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const variants: Record<TransactionStatus, { className: string; icon: React.ReactNode }> = {
      PENDING: { 
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
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
      IN_PROGRESS: { 
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
        icon: <RotateCcw className="h-3 w-3 mr-1" />
      },
      COMPLETED: { 
        className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      CANCELLED: { 
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      OVERRIDDEN: { 
        className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
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

  const getReturnTypeBadge = (type: ReturnType) => {
    const variants: Record<ReturnType, { className: string; icon: React.ReactNode }> = {
      FROM_SUBSIDIARY: { 
        className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
        icon: <Building2 className="h-3 w-3 mr-1" />
      },
      FROM_BANK: { 
        className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
        icon: <Building2 className="h-3 w-3 mr-1" />
      },
      FROM_EXTERNAL: { 
        className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50',
        icon: <RotateCcw className="h-3 w-3 mr-1" />
      },
    };

    const config = variants[type];
    return (
      <Badge variant="outline" className={`${config.className} font-medium flex items-center`}>
        {config.icon}
        {type.replace('FROM_', '').replace('_', ' ')}
      </Badge>
    );
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null } | null) => {
    if (!user) return 'Not assigned';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const getSourceName = (propertyReturn: PropertyReturnListItem) => {
    if (propertyReturn.businessUnit) {
      return propertyReturn.businessUnit.name;
    }
    return 'External';
  };

  const canApproveReturn = (propertyReturn: PropertyReturnListItem) => {
    return canApprove && propertyReturn.status === TransactionStatus.PENDING;
  };

  const canCompleteReturn = (propertyReturn: PropertyReturnListItem) => {
    return canComplete && propertyReturn.status === TransactionStatus.APPROVED;
  };

  const canCancelReturn = (propertyReturn: PropertyReturnListItem) => {
    return canCancel && (propertyReturn.status === TransactionStatus.PENDING || propertyReturn.status === TransactionStatus.APPROVED);
  };

  if (returns.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <RotateCcw className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No property returns found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No property returns match your current search criteria. Try adjusting your filters or create a new property return.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">Property</TableHead>
            <TableHead className="font-semibold">Return Type</TableHead>
            <TableHead className="font-semibold">Source</TableHead>
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
            <TableHead className="font-semibold">Returned By</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returns.map((propertyReturn) => (
            <TableRow key={propertyReturn.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <div>
                    <button
                      onClick={() => onViewReturn(propertyReturn.id)}
                      className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {propertyReturn.property.titleNumber}
                    </button>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[150px]" title={propertyReturn.property.location}>
                        {propertyReturn.property.location}
                      </span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getReturnTypeBadge(propertyReturn.returnType)}
              </TableCell>
              <TableCell>
                <div className="font-medium">{getSourceName(propertyReturn)}</div>
                {propertyReturn._count.documents > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {propertyReturn._count.documents} document{propertyReturn._count.documents !== 1 ? 's' : ''}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {getStatusBadge(propertyReturn.status)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{format(new Date(propertyReturn.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(propertyReturn.createdAt), 'HH:mm')}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{getUserName(propertyReturn.returnedBy)}</span>
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
                    <DropdownMenuItem onClick={() => onViewReturn(propertyReturn.id)}>
                      <Eye className="mr-2 h-4 w-4 text-blue-600" />
                      View Details
                    </DropdownMenuItem>

                    {canApproveReturn(propertyReturn) && (
                      <DropdownMenuItem onClick={() => onApproveReturn(propertyReturn.id)}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Approve Return
                      </DropdownMenuItem>
                    )}
                    {canCompleteReturn(propertyReturn) && (
                      <DropdownMenuItem onClick={() => onCompleteReturn(propertyReturn.id)}>
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                        Mark as Received
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {canCancelReturn(propertyReturn) && (
                      <DropdownMenuItem 
                        onClick={() => onCancelReturn(propertyReturn.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Return
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