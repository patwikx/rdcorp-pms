// components/roles/role-detail-edit-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RoleEditForm } from './role-edit-form';

import { updateRole } from '@/lib/actions/role-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Key, 
  Users, 
  Activity,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { 
  RoleDetails,
  RoleFormData,
} from '@/types/role-types';
import { RolePermissionManagement } from './role-permission-management';
import { RoleMemberManagement } from './role-member-management';

interface RoleDetailEditPageProps {
  businessUnitId: string;
  role: RoleDetails;
}

export function RoleDetailEditPage({
  businessUnitId,
  role,
}: RoleDetailEditPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: RoleFormData) => {
    setIsLoading(true);
    try {
      const result = await updateRole(businessUnitId, role.id, {
        name: data.name,
        description: data.description,
        level: data.level,
      });
      
      if (result.success) {
        toast.success('Role updated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/roles`);
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

  const getPermissionsSummary = () => {
    const moduleCount = role.permissions.length;
    const totalPermissions = role.permissions.reduce((sum, perm) => {
      return sum + 
        (perm.canCreate ? 1 : 0) +
        (perm.canRead ? 1 : 0) +
        (perm.canUpdate ? 1 : 0) +
        (perm.canDelete ? 1 : 0) +
        (perm.canApprove ? 1 : 0);
    }, 0);

    return { moduleCount, totalPermissions };
  };

  const permissionsSummary = getPermissionsSummary();

  // Transform role data for the form
  const initialData: RoleFormData = {
    name: role.name,
    description: role.description || '',
    level: role.level,
    permissions: role.permissions.map(perm => ({
      module: perm.module,
      canCreate: perm.canCreate,
      canRead: perm.canRead,
      canUpdate: perm.canUpdate,
      canDelete: perm.canDelete,
      canApprove: perm.canApprove,
    })),
  };

  return (
    <div className="space-y-6">
      {/* Role Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Role Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Role Name</div>
              <div className="text-lg font-semibold">{role.name}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Level</div>
              <div>{getRoleLevelBadge(role.level)}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Permissions</div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {permissionsSummary.moduleCount} modules
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {permissionsSummary.totalPermissions} permissions
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Members</div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="font-semibold">{role.businessUnitMembers.filter(m => m.isActive).length} active</span>
              </div>
            </div>
          </div>

          {role.description && (
            <div className="mt-6 pt-6 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-2">Description</div>
              <p className="text-sm">{role.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Details
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <RoleEditForm
            role={role}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            initialData={initialData}
            isEditMode={true}
          />
        </TabsContent>

        <TabsContent value="permissions">
          <RolePermissionManagement
            businessUnitId={businessUnitId}
            role={role}
          />
        </TabsContent>

        <TabsContent value="members">
          <RoleMemberManagement
            businessUnitId={businessUnitId}
            role={role}
          />
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Role Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{role._count?.businessUnitMembers || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{role.businessUnitMembers.filter(m => m.isActive).length}</div>
                  <div className="text-sm text-muted-foreground">Active Members</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{role._count?.permissions || 0}</div>
                  <div className="text-sm text-muted-foreground">Permissions</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created on {format(new Date(role.createdAt), 'MMMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Last updated {format(new Date(role.updatedAt), 'MMMM dd, yyyy')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}