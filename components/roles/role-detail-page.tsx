// components/roles/role-detail-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Edit, 
  Users,
  Key,
  Building2,
  User,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import type { RoleDetails } from '@/types/user-management-types';

interface RoleDetailPageProps {
  businessUnitId: string;
  role: RoleDetails;
}

export function RoleDetailPage({ businessUnitId, role }: RoleDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const handleEdit = () => {
    router.push(`/${businessUnitId}/roles/${role.id}/edit`);
  };

  const getPermissionCount = () => {
    return Array.isArray(role.permissions) ? role.permissions.length : 0;
  };

  const getPermissions = (): string[] => {
    return Array.isArray(role.permissions) ? role.permissions as string[] : [];
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null; username: string | null }) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.username || 'Unknown User';
  };

  return (
    <div className="space-y-6">
      {/* Role Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{role.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {role.description || 'No description provided'}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{role._count.businessUnitMembers} members</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Key className="h-3 w-3" />
                    <span>{getPermissionCount()} permissions</span>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Role
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Role Details Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Role Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role Name</label>
                  <p className="text-lg font-semibold">{role.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{role.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm font-semibold">{format(role.createdAt, 'MMMM dd, yyyy \'at\' h:mm a')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm font-semibold">{format(role.updatedAt, 'MMMM dd, yyyy \'at\' h:mm a')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Role Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{role._count.businessUnitMembers}</div>
                    <div className="text-sm text-muted-foreground">Active Members</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{getPermissionCount()}</div>
                    <div className="text-sm text-muted-foreground">Permissions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-600" />
                Role Permissions ({getPermissionCount()})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getPermissions().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {getPermissions().map((permission) => (
                    <Badge key={permission} variant="outline" className="justify-start p-2">
                      <Key className="h-3 w-3 mr-2" />
                      {permission}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Permissions</h3>
                  <p className="text-muted-foreground">
                    This role has no permissions assigned.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Role Members ({role._count.businessUnitMembers})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {role.businessUnitMembers.length > 0 ? (
                <div className="space-y-4">
                  {role.businessUnitMembers.map((member) => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{getUserName(member.user)}</h3>
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{member.user.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            Joined {format(member.joinedAt, 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center space-x-2 text-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{member.businessUnit.name}</span>
                          {member.businessUnit.description && (
                            <span className="text-muted-foreground">- {member.businessUnit.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Members</h3>
                  <p className="text-muted-foreground">
                    No users have been assigned to this role yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}