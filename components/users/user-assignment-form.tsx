// components/users/user-assignment-form.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  UserPlus, 
  Save, 
  X, 
  User, 
  Shield,
  Building2,
  Search,
  CheckCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { 
  UserAssignmentFormData,
} from '@/types/user-management-types';
import { findUserForAssignment } from '@/lib/actions/user-management-actions';

const userAssignmentFormSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  businessUnitId: z.string().min(1, 'Business unit is required'),
  roleId: z.string().min(1, 'Role is required'),
});

type UserAssignmentFormDataType = z.infer<typeof userAssignmentFormSchema>;

interface UserAssignmentFormProps {
  availableRoles: Array<{ id: string; name: string; level: number; description: string | null }>;
  availableBusinessUnits: Array<{ id: string; name: string; description: string | null }>;
  businessUnitId: string;
  onSubmit: (data: UserAssignmentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: UserAssignmentFormData;
  isEditMode?: boolean;
}

export function UserAssignmentForm({
  availableRoles,
  availableBusinessUnits,
  businessUnitId,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  isEditMode = false,
}: UserAssignmentFormProps) {
  const [userSearchValue, setUserSearchValue] = useState('');
  const [foundUser, setFoundUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<UserAssignmentFormDataType>({
    resolver: zodResolver(userAssignmentFormSchema),
    defaultValues: initialData || {
      userId: '',
      businessUnitId: businessUnitId,
      roleId: '',
    },
  });

  const handleSubmit = async (data: UserAssignmentFormDataType) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting user assignment form:', error);
    }
  };

  const searchUser = async (identifier: string) => {
    if (!identifier.trim()) {
      setFoundUser(null);
      return;
    }

    setIsSearching(true);
    try {
      const user = await findUserForAssignment(businessUnitId, identifier.trim());
      setFoundUser(user);
      if (user) {
        form.setValue('userId', user.id);
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      setFoundUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSearch = (value: string) => {
    setUserSearchValue(value);
    if (value.length >= 3) {
      searchUser(value);
    } else {
      setFoundUser(null);
      form.setValue('userId', '');
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
        L{level} - {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* User Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                User Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* User Search */}
                {!isEditMode && (
                  <div className="space-y-4">
                    <FormLabel className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Find User *
                    </FormLabel>
                    <div className="relative">
                      <Input
                        placeholder="Enter email or username to search..."
                        value={userSearchValue}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        disabled={isLoading}
                        className="h-11"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                        </div>
                      )}
                    </div>
                    
                    {foundUser && (
                      <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-green-800">{foundUser.name}</div>
                            <div className="text-sm text-green-600">{foundUser.email}</div>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                        </div>
                      </div>
                    )}

                    {userSearchValue.length >= 3 && !foundUser && !isSearching && (
                      <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <X className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-red-800">User not found</div>
                            <div className="text-sm text-red-600">No user found with email or username: {userSearchValue}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          disabled={isLoading}
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
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The business unit this user will be assigned to
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

                {/* Assignment Summary */}
                {foundUser && form.watch('roleId') && form.watch('businessUnitId') && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-3">Assignment Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600">User:</span>
                        <span className="font-medium text-blue-800">{foundUser.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600">Email:</span>
                        <span className="font-medium text-blue-800">{foundUser.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600">Business Unit:</span>
                        <span className="font-medium text-blue-800">
                          {availableBusinessUnits.find(u => u.id === form.watch('businessUnitId'))?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600">Role:</span>
                        <span className="font-medium text-blue-800">
                          {availableRoles.find(r => r.id === form.watch('roleId'))?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
              <Button 
                type="submit" 
                disabled={isLoading || (!isEditMode && !foundUser)} 
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isEditMode ? 'Updating...' : 'Assigning...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Assignment' : 'Assign User'}
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