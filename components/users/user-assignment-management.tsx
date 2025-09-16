// components/users/user-assignment-management.tsx
'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertModal } from '@/components/modals/alert-modal';
import { 
  Plus, 
  Shield, 
  Building2, 
  Calendar,
  Settings,
  UserMinus,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  assignUserToBusinessUnit, 
  removeUserFromBusinessUnit 
} from '@/lib/actions/user-management-actions';
import type { 
  UserDetails,
  UserAssignmentFormData,
} from '@/types/user-management-types';
import { UserAssignmentModal } from './user-assignment-modal';


interface UserAssignmentManagementProps {
  businessUnitId: string;
  user: UserDetails;
  availableRoles: Array<{ id: string; name: string; level: number; description: string | null }>;
}

export function UserAssignmentManagement({
  businessUnitId,
  user,
  availableRoles,
}: UserAssignmentManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<{
    businessUnitId: string;
    roleId: string;
  } | null>(null);
  const [removeModal, setRemoveModal] = useState<{
    isOpen: boolean;
    businessUnitId: string | null;
    businessUnitName: string | null;
  }>({
    isOpen: false,
    businessUnitId: null,
    businessUnitName: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleEditAssignment = (targetBusinessUnitId: string, roleId: string) => {
    setEditingAssignment({ businessUnitId: targetBusinessUnitId, roleId });
    setIsModalOpen(true);
  };

  const handleRemoveAssignment = (targetBusinessUnitId: string, businessUnitName: string) => {
    setRemoveModal({
      isOpen: true,
      businessUnitId: targetBusinessUnitId,
      businessUnitName,
    });
  };

  const handleSubmitAssignment = async (data: UserAssignmentFormData) => {
    setIsLoading(true);
    try {
      const result = await assignUserToBusinessUnit(businessUnitId, {
        userId: user.id,
        businessUnitId: data.businessUnitId,
        roleId: data.roleId,
      });
      
      if (result.success) {
        toast.success(editingAssignment ? 'Assignment updated successfully' : 'Assignment created successfully');
        setIsModalOpen(false);
        setEditingAssignment(null);
        window.location.reload(); // Refresh to show updated data
      } else {
        toast.error(result.error || 'Failed to save assignment');
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeModal.businessUnitId) return;

    setIsLoading(true);
    try {
      const result = await removeUserFromBusinessUnit(
        businessUnitId, 
        user.id, 
        removeModal.businessUnitId
      );
      
      if (result.success) {
        toast.success('Assignment removed successfully');
        setRemoveModal({ isOpen: false, businessUnitId: null, businessUnitName: null });
        window.location.reload(); // Refresh to show updated data
      } else {
        toast.error(result.error || 'Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    } finally {
      setIsLoading(false);
    }
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

    const className = colors[level as keyof typeof colors] || colors[0];

    return (
      <Badge variant="outline" className={`${className} font-medium text-xs`}>
        L{level}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Assignment Management Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Business Unit Assignments ({user.businessUnitMembers.length})
            </CardTitle>
            <Button onClick={handleAddAssignment} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {user.businessUnitMembers.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
              <p className="text-muted-foreground mb-4">
                This user has no business unit assignments.
              </p>
              <Button onClick={handleAddAssignment}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Assignment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {user.businessUnitMembers.map((member) => (
                <Card key={member.id} className="border-2 border-dashed border-muted-foreground/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-semibold">{member.businessUnit.name}</div>
                            {member.businessUnit.description && (
                              <div className="text-sm text-muted-foreground">{member.businessUnit.description}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{member.role.name}</span>
                              {getRoleLevelBadge(member.role.level)}
                            </div>
                            {member.role.description && (
                              <div className="text-xs text-muted-foreground">{member.role.description}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div>{getStatusBadge(member.isActive)}</div>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {format(new Date(member.joinedAt), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAssignment(member.businessUnitId, member.roleId)}
                            disabled={isLoading}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {member.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveAssignment(member.businessUnitId, member.businessUnit.name)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserMinus className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      <UserAssignmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAssignment(null);
        }}
        onSubmit={handleSubmitAssignment}
        availableRoles={availableRoles}
        isLoading={isLoading}
        editingAssignment={editingAssignment}
        userId={user.id}
      />

      {/* Remove Confirmation Modal */}
      <AlertModal
        isOpen={removeModal.isOpen}
        onClose={() => setRemoveModal({ isOpen: false, businessUnitId: null, businessUnitName: null })}
        onConfirm={confirmRemove}
        loading={isLoading}
        title="Remove Assignment"
        description={`Are you sure you want to remove this user's assignment to "${removeModal.businessUnitName}"? This will revoke their access to that business unit.`}
      />
    </div>
  );
}