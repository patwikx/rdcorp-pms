// components/users/user-assignment-edit-form.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Shield, 
  Save, 
  X, 
  Building2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { 
  UserAssignmentFormData,
  UserAssignmentDetails,
} from '@/types/user-management-types';
import { format } from 'date-fns';

const assignmentEditFormSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  businessUnitId: z.string().min(1, 'Business unit is required'),
  roleId: z.string().min(1, 'Role is required'),
  isActive: z.boolean().optional(),
});

type AssignmentEditFormData = z.infer<typeof assignmentEditFormSchema>;

interface UserAssignmentEditFormProps {
  assignment: UserAssignmentDetails;
  availableRoles: Array<{ id: string; name: string; level: number; description: string | null }>;
  availableBusinessUnits: Array<{ id: string; name: string; description: string | null }>;
  onSubmit: (data: UserAssignmentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData: UserAssignmentFormData;
  isEditMode?: boolean;
}

export function UserAssignmentEditForm({
  assignment,
  availableRoles,
  availableBusinessUnits,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  isEditMode = true,
}: UserAssignmentEditFormProps) {
  const form = useForm<AssignmentEditFormData>({
    resolver: zodResolver(assignmentEditFormSchema),
    defaultValues: {
      userId: initialData.userId,
      businessUnitId: initialData.businessUnitId,
      roleId: initialData.roleId,
      isActive: assignment.isActive,
    },
  });

  const handleSubmit = async (data: AssignmentEditFormData) => {
    try {
      await onSubmit({
        userId: data.userId,
        businessUnitId: data.businessUnitId,
        roleId: data.roleId,
      });
    } catch (error) {
      console.error('Error submitting assignment form:', error);
    }
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

  const selectedRole = availableRoles.find(role => role.id === form.watch('roleId'));
  const selectedBusinessUnit = availableBusinessUnits.find(unit => unit.id === form.watch('businessUnitId'));

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="businessUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Business Unit *
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isLoading || isEditMode} // Disable in edit mode
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select business unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableBusinessUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                <div>
                                  <div className="font-medium">{unit.name}</div>
                                  {unit.description && (
                                    <div className="text-xs text-muted-foreground">{unit.description}</div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {isEditMode 
                            ? 'Business unit cannot be changed in edit mode'
                            : 'The business unit this user will be assigned to'
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Role *
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                <div className="flex items-center justify-between w-full">
                                  <div>
                                    <div className="font-medium">{role.name}</div>
                                    {role.description && (
                                      <div className="text-xs text-muted-foreground">{role.description}</div>
                                    )}
                                  </div>
                                  <div className="ml-2">
                                    {getRoleLevelBadge(role.level)}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The role this user will have in the selected business unit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  {/* Assignment Status */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold text-sm mb-3">Current Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <div>{assignment.isActive}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Joined:</span>
                        <div className="flex items-center space-x-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{format(new Date(assignment.joinedAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Updated:</span>
                        <div className="flex items-center space-x-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{format(new Date(assignment.updatedAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role Permissions Preview */}
                  {selectedRole && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-3">Role Permissions Preview</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600 text-sm">Role:</span>
                          <span className="font-medium text-blue-800">{selectedRole.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600 text-sm">Level:</span>
                          <div>{getRoleLevelBadge(selectedRole.level)}</div>
                        </div>
                        {selectedRole.description && (
                          <div className="pt-2 border-t border-blue-200">
                            <span className="text-blue-600 text-sm">Description:</span>
                            <p className="text-xs text-blue-700 mt-1">{selectedRole.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Summary */}
          {(form.watch('roleId') !== assignment.roleId || form.watch('businessUnitId') !== assignment.businessUnitId) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Changes Detected:</strong> You are about to modify this user&apos;s assignment. 
                {form.watch('roleId') !== assignment.roleId && (
                  <span> Role will change from &quot;{assignment.role.name}&quot; to &quot;{selectedRole?.name}&quot;.</span>
                )}
                {form.watch('businessUnitId') !== assignment.businessUnitId && (
                  <span> Business unit will change from &quot;{assignment.businessUnit.name}&quot; to &quot;{selectedBusinessUnit?.name}&quot;.</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Fields marked with * are required
            </div>
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Updating Assignment...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}