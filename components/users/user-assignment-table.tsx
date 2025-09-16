// components/users/user-assignment-table.tsx
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Calendar,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Building2,
  UserMinus,
  Settings,
} from 'lucide-react';
import type { 
  UserAssignmentListItem, 
  UserAssignmentSort 
} from '@/types/user-management-types';
import { format } from 'date-fns';

interface UserAssignmentTableProps {
  assignments: UserAssignmentListItem[];
  sort: UserAssignmentSort;
  onSortChange: (sort: UserAssignmentSort) => void;
  onViewAssignment: (userId: string, businessUnitId: string) => void;
  onEditAssignment: (userId: string, businessUnitId: string) => void;
  onRemoveAssignment: (userId: string, businessUnitId: string) => void;
  canEdit: boolean;
  canRemove: boolean;
}

export function UserAssignmentTable({
  assignments,
  sort,
  onSortChange,
  onViewAssignment,
  onEditAssignment,
  onRemoveAssignment,
  canEdit,
  canRemove,
}: UserAssignmentTableProps) {
  const handleSort = (field: UserAssignmentSort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        order: sort.order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({ field, order: 'asc' });
    }
  };

  const getSortIcon = (field: UserAssignmentSort['field']) => {
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

  const getUserName = (user: UserAssignmentListItem['user']) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const getRoleLevelBadge = (level: number) => {
    const colors = {
      0: 'bg-gray-100 text-gray-800 border-gray-200',
      1: 'bg-blue-100 text-blue-800 border-blue-200',
      2: 'bg-green-100 text-green-800 border-green-200',
      3: 'bg-purple-100 text-purple-800 border-purple-200',
      4: 'bg-red-100 text-red-800 border-red-200',
    };

    const className = colors[level as keyof typeof colors] || colors[0];

    return (
      <Badge variant="outline" className={`${className} font-medium text-xs`}>
        L{level}
      </Badge>
    );
  };

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No user assignments found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No user assignments match your current search criteria. Try adjusting your filters or create a new assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">User</TableHead>
            <TableHead className="font-semibold">Business Unit</TableHead>
            <TableHead className="font-semibold">Role</TableHead>
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
                onClick={() => handleSort('joinedAt')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Joined
                {getSortIcon('joinedAt')}
              </Button>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <div>
                    <button
                      onClick={() => onViewAssignment(assignment.userId, assignment.businessUnitId)}
                      className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {getUserName(assignment.user)}
                    </button>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{assignment.user.email}</span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-sm">{assignment.businessUnit.name}</div>
                    {assignment.businessUnit.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={assignment.businessUnit.description}>
                        {assignment.businessUnit.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{assignment.role.name}</span>
                      {getRoleLevelBadge(assignment.role.level)}
                    </div>
                    {assignment.role.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={assignment.role.description}>
                        {assignment.role.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(assignment.isActive)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{format(new Date(assignment.joinedAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(assignment.joinedAt), 'HH:mm')}
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
                    <DropdownMenuItem onClick={() => onViewAssignment(assignment.userId, assignment.businessUnitId)}>
                      <Eye className="mr-2 h-4 w-4 text-blue-600" />
                      View Details
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem onClick={() => onEditAssignment(assignment.userId, assignment.businessUnitId)}>
                        <Settings className="mr-2 h-4 w-4 text-green-600" />
                        Edit Assignment
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {canRemove && assignment.isActive && (
                      <DropdownMenuItem 
                        onClick={() => onRemoveAssignment(assignment.userId, assignment.businessUnitId)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove Assignment
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