// components/releases/property-release-table.tsx
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
  Send,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import type { 
  PropertyReleaseListItem, 
  PropertyReleaseSort 
} from '@/types/release-types';
import { TransactionStatus, ReleaseType } from '@prisma/client';
import { format, isAfter } from 'date-fns';

interface PropertyReleaseTableProps {
  releases: PropertyReleaseListItem[];
  sort: PropertyReleaseSort;
  onSortChange: (sort: PropertyReleaseSort) => void;
  onViewRelease: (releaseId: string) => void;
  onApproveRelease: (releaseId: string) => void;
  onCompleteRelease: (releaseId: string) => void;
  onCancelRelease: (releaseId: string) => void;
  canApprove: boolean;
  canComplete: boolean;
  canCancel: boolean;
}

export function PropertyReleaseTable({
  releases,
  sort,
  onSortChange,
  onViewRelease,
  onApproveRelease,
  onCompleteRelease,
  onCancelRelease,
  canApprove,
  canComplete,
  canCancel,
}: PropertyReleaseTableProps) {
  const handleSort = (field: PropertyReleaseSort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        order: sort.order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({ field, order: 'asc' });
    }
  };

  const getSortIcon = (field: PropertyReleaseSort['field']) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
    }
    return sort.order === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-2 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 ml-2 text-blue-600" />;
  };

  const getStatusBadge = (status: TransactionStatus, expectedReturnDate?: Date | null) => {
    const isOverdue = expectedReturnDate && isAfter(new Date(), expectedReturnDate) && 
                     status !== TransactionStatus.COMPLETED && status !== TransactionStatus.CANCELLED;

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
        icon: <Send className="h-3 w-3 mr-1" />
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
    
    if (isOverdue) {
      return (
        <div className="flex items-center space-x-1">
          <Badge className={`${config.className} font-medium flex items-center`}>
            {config.icon}
            {status.replace('_', ' ')}
          </Badge>
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 font-medium flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            OVERDUE
          </Badge>
        </div>
      );
    }

    return (
      <Badge className={`${config.className} font-medium flex items-center`}>
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getReleaseTypeBadge = (type: ReleaseType) => {
    const variants: Record<ReleaseType, { className: string; icon: React.ReactNode }> = {
      TO_SUBSIDIARY: { 
        className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
        icon: <Building2 className="h-3 w-3 mr-1" />
      },
      TO_BANK: { 
        className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
        icon: <Building2 className="h-3 w-3 mr-1" />
      },
      TO_EXTERNAL: { 
        className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50',
        icon: <Send className="h-3 w-3 mr-1" />
      },
    };

    const config = variants[type];
    return (
      <Badge variant="outline" className={`${config.className} font-medium flex items-center`}>
        {config.icon}
        {type.replace('TO_', '').replace('_', ' ')}
      </Badge>
    );
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null } | null) => {
    if (!user) return 'Not assigned';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const getDestinationName = (release: PropertyReleaseListItem) => {
    if (release.businessUnit) {
      return release.businessUnit.name;
    }
    if (release.bank) {
      return `${release.bank.name} - ${release.bank.branchName}`;
    }
    return 'External';
  };

  const canApproveRelease = (release: PropertyReleaseListItem) => {
    return canApprove && release.status === TransactionStatus.PENDING;
  };

  const canCompleteRelease = (release: PropertyReleaseListItem) => {
    return canComplete && release.status === TransactionStatus.APPROVED;
  };

  const canCancelRelease = (release: PropertyReleaseListItem) => {
    return canCancel && (release.status === TransactionStatus.PENDING || release.status === TransactionStatus.APPROVED);
  };

  if (releases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Send className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No property releases found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No property releases match your current search criteria. Try adjusting your filters or create a new property release.
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
            <TableHead className="font-semibold">Release Type</TableHead>
            <TableHead className="font-semibold">Destination</TableHead>
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
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('expectedReturnDate')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Expected Return
                {getSortIcon('expectedReturnDate')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Released By</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {releases.map((release) => (
            <TableRow key={release.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <div>
                    <button
                      onClick={() => onViewRelease(release.id)}
                      className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {release.property.titleNumber}
                    </button>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[150px]" title={release.property.location}>
                        {release.property.location}
                      </span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getReleaseTypeBadge(release.releaseType)}
              </TableCell>
              <TableCell>
                <div className="font-medium">{getDestinationName(release)}</div>
                {release._count.documents > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {release._count.documents} document{release._count.documents !== 1 ? 's' : ''}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {getStatusBadge(release.status, release.expectedReturnDate)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{format(new Date(release.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(release.createdAt), 'HH:mm')}
                </div>
              </TableCell>
              <TableCell>
                {release.expectedReturnDate ? (
                  <div className="flex items-center space-x-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{format(new Date(release.expectedReturnDate), 'MMM dd, yyyy')}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Not specified</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{getUserName(release.releasedBy)}</span>
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
                    <DropdownMenuItem onClick={() => onViewRelease(release.id)}>
                      <Eye className="mr-2 h-4 w-4 text-blue-600" />
                      View Details
                    </DropdownMenuItem>
                    {canApproveRelease(release) && (
                      <DropdownMenuItem onClick={() => onApproveRelease(release.id)}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Approve Release
                      </DropdownMenuItem>
                    )}
                    {canCompleteRelease(release) && (
                      <DropdownMenuItem onClick={() => onCompleteRelease(release.id)}>
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                        Mark as Received
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {canCancelRelease(release) && (
                      <DropdownMenuItem 
                        onClick={() => onCancelRelease(release.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Release
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