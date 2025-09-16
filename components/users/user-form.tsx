// components/users/user-form.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Save, 
  X, 
  Mail, 
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  Key,
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
import { Checkbox } from '@/components/ui/checkbox';
import type { 
  UserFormData,
} from '@/types/user-management-types';

const userFormSchema = z.object({
  username: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  isActive: z.boolean(),
  roleId: z.string().optional(),
});

type UserFormDataType = z.infer<typeof userFormSchema>;

interface UserFormProps {
  availableRoles: Array<{ id: string; name: string; level: number }>;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: UserFormData;
  isEditMode?: boolean;
}

export function UserForm({
  availableRoles,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  isEditMode = false,
}: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserFormDataType>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initialData || {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      isActive: true,
      roleId: '',
    },
  });

  const handleSubmit = async (data: UserFormDataType) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting user form:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const className = colors[level as keyof typeof colors] || colors[0];
    const label = labels[level as keyof typeof labels] || 'Unknown';

    return `Level ${level} - ${label}`;
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            First Name *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter first name" 
                              disabled={isLoading}
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Last Name *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter last name" 
                              disabled={isLoading}
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="Enter email address" 
                            disabled={isLoading}
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This will be used for login and notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Username
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter username (optional)" 
                            disabled={isLoading}
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional username for login (email can be used instead)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Password {!isEditMode && '*'}
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"} 
                              disabled={isLoading}
                              className="h-11 pr-12"
                              {...field} 
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={togglePasswordVisibility}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <FormDescription>
                          {isEditMode 
                            ? "Leave blank to keep the current password" 
                            : "Minimum 6 characters required"
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
                          Initial Role Assignment
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select initial role (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no-assignment">No initial assignment</SelectItem>
                            {availableRoles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{role.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {getRoleLevelBadge(role.level)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Assign an initial role to this user (can be changed later)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Active User
                          </FormLabel>
                          <FormDescription>
                            Enable this user to access the system
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
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
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update User' : 'Create User'}
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