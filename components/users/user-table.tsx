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
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Calendar,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  UserPlus,
  Building2,
} from 'lucide-react';
import type { 
  UserListItem, 
  UserSort 
} from '@/types/user-management-types';
import { format } from 'date-fns';

interface UserTableProps {
  users: UserListItem[];
  sort: UserSort;
  onSortChange: (sort: UserSort) => void;
  onViewUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onAssignUser: (userId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
}

export function UserTable({
  users,
  sort,
  onSortChange,
  onViewUser,
  onDeleteUser,
  onAssignUser,
  canDelete,
  canAssign,
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

  const getUserName = (user: UserListItem) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const getPrimaryRole = (user: UserListItem) => {
    if (user.businessUnitMembers.length === 0) {
      return { name: 'No Role', level: 0, businessUnit: 'Unassigned' };
    }

    // Get the highest level role
    const primaryMembership = user.businessUnitMembers.reduce((highest, current) => {
      return current.role.level > highest.role.level ? current : highest;
    });

    return {
      name: primaryMembership.role.name,
      level: primaryMembership.role.level,
      businessUnit: primaryMembership.businessUnit.name,
    };
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

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No users found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No users match your current search criteria. Try adjusting your filters or create a new user to get started.
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
            <TableHead className="font-semibold">Primary Role</TableHead>
            <TableHead className="font-semibold text-center">Assignments</TableHead>
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
          {users.map((user) => {
            const primaryRole = getPrimaryRole(user);
            
            return (
              <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <button
                        onClick={() => onViewUser(user.id)}
                        className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {getUserName(user)}
                      </button>
                      {user.username && (
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.emailVerified && (
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Verified</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {user.username ? (
                    <span className="text-sm font-mono">{user.username}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Not set</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{primaryRole.name}</span>
                        {getRoleLevelBadge(primaryRole.level)}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{primaryRole.businessUnit}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-medium">
                      {user._count.businessUnitMembers}
                    </div>
                    <span className="text-sm text-muted-foreground">units</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(user.isActive)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(user.createdAt), 'HH:mm')}
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
                        View & Edit
                      </DropdownMenuItem>
                      {canAssign && (
                        <DropdownMenuItem onClick={() => onAssignUser(user.id)}>
                          <UserPlus className="mr-2 h-4 w-4 text-green-600" />
                          Manage Assignments
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {canDelete && user._count.createdProperties === 0 && (
                        <DropdownMenuItem 
                          onClick={() => onDeleteUser(user.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      )}
                      {user._count.createdProperties > 0 && (
                        <DropdownMenuItem disabled>
                          <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                          Cannot Delete (Has Records)
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}