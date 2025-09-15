// components/users/user-table.tsx
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
  Edit,
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Mail,
  Calendar,
  Shield,
} from 'lucide-react';
import type { UserListItem, UserSort } from '@/types/user-management-types';
import { format } from 'date-fns';

interface UserTableProps {
  users: UserListItem[];
  sort: UserSort;
  onSortChange: (sort: UserSort) => void;
  onViewUser: (userId: string) => void;
  onEditUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function UserTable({
  users,
  sort,
  onSortChange,
  onViewUser,
  onEditUser,
  onDeleteUser,
  canEdit,
  canDelete,
}: UserTableProps) {
  const handleSort = (field: UserSort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        order: sort.order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({ field, order: 'asc' });
    }
  };

  const getSortIcon = (field: UserSort['field']) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
    }
    return sort.order === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-2 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 ml-2 text-blue-600" />;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
        Inactive
      </Badge>
    );
  };

  const getUserName = (user: UserListItem) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.username || 'Unknown User';
  };

  const getUserRoles = (user: UserListItem) => {
    return user.businessUnitMembers
      .filter(member => member.isActive)
      .map(member => member.role.name)
      .join(', ') || 'No roles assigned';
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No users found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No users match your current search criteria. Try adjusting your filters or add a new user to get started.
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
                onClick={() => handleSort('firstName')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Name
                {getSortIcon('firstName')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('email')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Email
                {getSortIcon('email')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('username')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Username
                {getSortIcon('username')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Roles</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
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
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <button
                      onClick={() => onViewUser(user.id)}
                      className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {getUserName(user)}
                    </button>
                    {user._count.createdProperties > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {user._count.createdProperties} properties created
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate" title={user.email}>
                    {user.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">
                  {user.username || '-'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 max-w-[200px]">
                  <Shield className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate text-sm" title={getUserRoles(user)}>
                    {getUserRoles(user)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(user.isActive)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
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
                    <DropdownMenuItem onClick={() => onViewUser(user.id)}>
                      <Eye className="mr-2 h-4 w-4 text-blue-600" />
                      View Details
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem onClick={() => onEditUser(user.id)}>
                        <Edit className="mr-2 h-4 w-4 text-green-600" />
                        Edit User
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {canDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDeleteUser(user.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
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