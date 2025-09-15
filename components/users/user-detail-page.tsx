// components/users/user-detail-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Building2, 
  Edit, 
  Activity,
  FileText,
  CheckCircle,
  ArrowLeftRight,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import type { UserDetails } from '@/types/user-management-types';

interface UserDetailPageProps {
  businessUnitId: string;
  user: UserDetails;
}

export function UserDetailPage({ businessUnitId, user }: UserDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const getUserName = () => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown User';
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

  const handleEdit = () => {
    router.push(`/${businessUnitId}/users/${user.id}/edit`);
  };

  return (
    <div className="space-y-6">
      {/* User Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{getUserName()}</h1>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                  {getStatusBadge(user.isActive)}
                </div>
              </div>
            </div>
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* User Details Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    <p className="text-sm font-semibold">{user.firstName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    <p className="text-sm font-semibold">{user.lastName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Username</label>
                    <p className="text-sm font-semibold font-mono">{user.username || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm font-semibold">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(user.isActive)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                    <p className="text-sm font-semibold">
                      {user.emailVerified ? format(user.emailVerified, 'MMM dd, yyyy') : 'Not verified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm font-semibold">{format(user.createdAt, 'MMMM dd, yyyy \'at\' h:mm a')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm font-semibold">{format(user.updatedAt, 'MMMM dd, yyyy \'at\' h:mm a')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Unit Memberships</label>
                  <p className="text-sm font-semibold">{user._count.businessUnitMembers}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Business Unit Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.businessUnitMembers.length > 0 ? (
                <div className="space-y-4">
                  {user.businessUnitMembers.map((member) => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">{member.businessUnit.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {member.businessUnit.description || 'No description'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Role</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Shield className="h-4 w-4 text-purple-600" />
                            <span className="font-semibold">{member.role.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {member.role.description || 'No description'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Joined</label>
                          <p className="text-sm font-semibold mt-1">
                            {format(member.joinedAt, 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="mt-4">
                        <label className="text-sm font-medium text-muted-foreground">Permissions</label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Array.isArray(member.role.permissions) && member.role.permissions.length > 0 ? (
                            (member.role.permissions as string[]).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No permissions assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Role Assignments</h3>
                  <p className="text-muted-foreground">
                    This user has not been assigned to any business units yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Activity Tracking</h3>
                <p className="text-muted-foreground">
                  Activity tracking will be implemented in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Properties Created</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user._count.createdProperties}</div>
                <p className="text-xs text-muted-foreground">Total properties created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Properties Updated</CardTitle>
                <Edit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user._count.updatedProperties}</div>
                <p className="text-xs text-muted-foreground">Total properties updated</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approvals</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user._count.approvals}</div>
                <p className="text-xs text-muted-foreground">Property approvals made</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Created</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user._count.createdDocuments}</div>
                <p className="text-xs text-muted-foreground">Documents uploaded</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Property Releases</CardTitle>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user._count.releases}</div>
                <p className="text-xs text-muted-foreground">Properties released</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Property Turnovers</CardTitle>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user._count.turnovers}</div>
                <p className="text-xs text-muted-foreground">Properties turned over</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Property Returns</CardTitle>
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user._count.returns}</div>
                <p className="text-xs text-muted-foreground">Properties returned</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}