// components/users/user-detail-edit-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateUser } from '@/lib/actions/user-management-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Activity, 
  Building2,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { 
  UserDetails,
  UserFormData,
} from '@/types/user-management-types';
import { UserEditForm } from './user-edit-form';
import { UserAssignmentManagement } from './user-assignment-management';

interface UserDetailEditPageProps {
  businessUnitId: string;
  user: UserDetails;
  availableRoles: Array<{ id: string; name: string; level: number; description: string | null }>;
}

export function UserDetailEditPage({
  businessUnitId,
  user,
  availableRoles,
}: UserDetailEditPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      const result = await updateUser(businessUnitId, user.id, data);
      
      if (result.success) {
        toast.success('User updated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/users`);
  };

  const getUserName = () => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
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
      <Badge variant="outline" className={`${className} font-medium text-xs`}>
        Level {level} - {label}
      </Badge>
    );
  };

  // Transform user data for the form
  const initialData: UserFormData = {
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email,
    isActive: user.isActive,
  };

  return (
    <div className="space-y-6">
      {/* User Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            User Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Full Name</div>
              <div className="text-lg font-semibold">{getUserName()}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Email</div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div>{getStatusBadge(user.isActive)}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div className="flex items-center space-x-1 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Business Unit Assignments Summary */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Current Assignments</h4>
              <Badge variant="secondary" className="text-xs">
                {user.businessUnitMembers.filter(m => m.isActive).length} active
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.businessUnitMembers.filter(m => m.isActive).map((member) => (
                <div key={member.id} className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">{member.businessUnit.name}</span>
                    </div>
                    {getRoleLevelBadge(member.role.level)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-3 w-3 text-purple-600" />
                    <span className="text-xs text-muted-foreground">{member.role.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Details
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <UserEditForm
            user={user}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            initialData={initialData}
            isEditMode={true}
          />
        </TabsContent>

        <TabsContent value="assignments">
          <UserAssignmentManagement
            businessUnitId={businessUnitId}
            user={user}
            availableRoles={availableRoles}
          />
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                User Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{user._count.createdProperties}</div>
                  <div className="text-sm text-muted-foreground">Properties Created</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{user._count.releases}</div>
                  <div className="text-sm text-muted-foreground">Property Releases</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{user._count.turnovers}</div>
                  <div className="text-sm text-muted-foreground">Property Turnovers</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{user._count.returns}</div>
                  <div className="text-sm text-muted-foreground">Property Returns</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}