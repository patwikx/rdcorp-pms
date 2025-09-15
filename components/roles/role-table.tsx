// components/roles/role-table.tsx
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
  Shield,
  Users,
  Calendar,
  Key,
} from 'lucide-react';
import type { RoleListItem, RoleSort } from '@/types/user-management-types';
import { format } from 'date-fns';

interface RoleTableProps {
  roles: RoleListItem[];
  sort: RoleSort;
  onSortChange: (sort: RoleSort) => void;
  onViewRole: (roleId: string) => void;
  onEditRole: (roleId: string) => void;
  onDeleteRole: (roleId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function RoleTable({
  roles,
  sort,
  onSortChange,
  onViewRole,
  onEditRole,
  onDeleteRole,
  canEdit,
  canDelete,
}: RoleTableProps) {
  const handleSort = (field: RoleSort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        order: sort.order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({ field, order: 'asc' });
    }
  };

  const getSortIcon = (field: RoleSort['field']) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
    }
    return sort.order === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-2 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 ml-2 text-blue-600" />;
  };

  const getPermissionCount = (permissions: unknown) => {
    if (Array.isArray(permissions)) {
      return permissions.length;
    }
    return 0;
  };

  if (roles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Shield className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No roles found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No roles match your current search criteria. Try adjusting your filters or add a new role to get started.
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
                Role Name
                {getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Description</TableHead>
            <TableHead className="font-semibold text-center">Permissions</TableHead>
            <TableHead className="font-semibold text-center">Members</TableHead>
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
          {roles.map((role) => (
            <TableRow key={role.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <button
                      onClick={() => onViewRole(role.id)}
                      className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {role.name}
                    </button>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground max-w-[300px] truncate block" title={role.description || ''}>
                  {role.description || 'No description provided'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Key className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="font-medium">
                    {getPermissionCount(role.permissions)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <Badge 
                    variant={role._count.businessUnitMembers > 0 ? "default" : "secondary"}
                    className="font-medium"
                  >
                    {role._count.businessUnitMembers}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(role.createdAt), 'MMM dd, yyyy')}</span>
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
                    <DropdownMenuItem onClick={() => onViewRole(role.id)}>
                      <Eye className="mr-2 h-4 w-4 text-blue-600" />
                      View Details
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem onClick={() => onEditRole(role.id)}>
                        <Edit className="mr-2 h-4 w-4 text-green-600" />
                        Edit Role
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {canDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDeleteRole(role.id)}
                        className="text-red-600 focus:text-red-600"
                        disabled={role._count.businessUnitMembers > 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Role
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