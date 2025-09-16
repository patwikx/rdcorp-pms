// components/users/user-assignment-detail-edit-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateUserAssignment } from '@/lib/actions/user-management-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Building2,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { 
  UserAssignmentDetails,
  UserAssignmentFormData,
} from '@/types/user-management-types';
import { UserAssignmentEditForm } from './user-assign-edit-form';

interface UserAssignmentDetailEditPageProps {
  businessUnitId: string;
  assignment: UserAssignmentDetails;
  availableRoles: Array<{ id: string; name: string; level: number; description: string | null }>;
  availableBusinessUnits: Array<{ id: string; name: string; description: string | null }>;
}

export function UserAssignmentDetailEditPage({
  businessUnitId,
  assignment,
  availableRoles,
  availableBusinessUnits,
}: UserAssignmentDetailEditPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UserAssignmentFormData) => {
    setIsLoading(true);
    try {
      const result = await updateUserAssignment(businessUnitId, data);
      
      if (result.success) {
        toast.success('User assignment updated successfully');
        router.push(`/${businessUnitId}/users/assignments`);
      } else {
        toast.error(result.error || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/users/assignments`);
  };

  const getUserName = () => {
    return `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim() || 'Unknown User';
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

  // Transform assignment data for the form
  const initialData: UserAssignmentFormData = {
    userId: assignment.userId,
    businessUnitId: assignment.businessUnitId,
    roleId: assignment.roleId,
  };

  return (
    <div className="space-y-6">
      {/* Assignment Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Assignment Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">User</div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-semibold">{getUserName()}</div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{assignment.user.email}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Business Unit</div>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-semibold">{assignment.businessUnit.name}</div>
                  {assignment.businessUnit.description && (
                    <div className="text-xs text-muted-foreground">{assignment.businessUnit.description}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Current Role</div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{assignment.role.name}</span>
                    {getRoleLevelBadge(assignment.role.level)}
                  </div>
                  {assignment.role.description && (
                    <div className="text-xs text-muted-foreground">{assignment.role.description}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Status & Joined</div>
              <div className="space-y-1">
                <div>{getStatusBadge(assignment.isActive)}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(assignment.joinedAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <UserAssignmentEditForm
        assignment={assignment}
        availableRoles={availableRoles}
        availableBusinessUnits={availableBusinessUnits}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        initialData={initialData}
        isEditMode={true}
      />
    </div>
  );
}