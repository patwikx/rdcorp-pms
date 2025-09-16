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
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Shield,
  Users,
  Calendar,
  Settings,
  CheckCircle,
  Key,
} from 'lucide-react';
import type { 
  RoleListItem, 
  RoleSort 
} from '@/types/role-types';
import { format } from 'date-fns';

interface RoleTableProps {
  roles: RoleListItem[];
  sort: RoleSort;
  onSortChange: (sort: RoleSort) => void;
  onViewRole: (roleId: string) => void;
  onDeleteRole: (roleId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function RoleTable({
  roles,
  sort,
  onSortChange,
  onViewRole,
  onDeleteRole,
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

  const getRoleLevelBadge = (level: number) => {
    const colors = {
      0: 'bg-gray-100 text-gray-800 border-gray-200',
      1: 'bg-blue-100 text-blue-800 border-blue-200',
      2: 'bg-green-100 text-green-800 border-green-200',
      3: 'bg-purple-100 text-purple-800 border-purple-200',
      4: 'bg-red-100 text-red-800 border-red-200',
    };
    
    const labels = {
      0: 'Staff',
      1: 'Manager',
      2: 'Director',
      3: 'VP',
      4: 'MD',
    };

    const className = colors[level as keyof typeof colors] || colors[0];
    const label = labels[level as keyof typeof labels] || 'Unknown';

    return (
      <Badge variant="outline" className={`${className} font-medium`}>
        Level {level} - {label}
      </Badge>
    );
  };

  const getPermissionsSummary = (permissions: RoleListItem['permissions']) => {
    const moduleCount = permissions.length;
    const totalPermissions = permissions.reduce((sum, perm) => {
      return sum + 
        (perm.canCreate ? 1 : 0) +
        (perm.canRead ? 1 : 0) +
        (perm.canUpdate ? 1 : 0) +
        (perm.canDelete ? 1 : 0) +
        (perm.canApprove ? 1 : 0);
    }, 0);

    return { moduleCount, totalPermissions };
  };

  if (roles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Shield className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No roles found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No roles match your current search criteria. Try adjusting your filters or create a new role to get started.
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
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('level')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Level
                {getSortIcon('level')}
              </Button>
            </TableHead>
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
          {roles.map((role) => {
            const permissionsSummary = getPermissionsSummary(role.permissions);
            
            return (
              <TableRow key={role.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-600" />
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
                  <div className="max-w-[200px]">
                    {role.description ? (
                      <span className="text-sm text-muted-foreground truncate" title={role.description}>
                        {role.description}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">No description</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getRoleLevelBadge(role.level)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-medium">
                        {permissionsSummary.moduleCount}
                      </div>
                      <span className="text-sm text-muted-foreground">modules</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Key className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{permissionsSummary.totalPermissions}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-medium">
                      {role._count.businessUnitMembers}
                    </div>
                    <span className="text-sm text-muted-foreground">users</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{format(new Date(role.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(role.createdAt), 'HH:mm')}
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
                        View & Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewRole(role.id)}>
                        <Settings className="mr-2 h-4 w-4 text-green-600" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewRole(role.id)}>
                        <Users className="mr-2 h-4 w-4 text-purple-600" />
                        View Members
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {canDelete && role._count.businessUnitMembers === 0 && (
                        <DropdownMenuItem 
                          onClick={() => onDeleteRole(role.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Role
                        </DropdownMenuItem>
                      )}
                      {role._count.businessUnitMembers > 0 && (
                        <DropdownMenuItem disabled>
                          <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                          Cannot Delete (Has Members)
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