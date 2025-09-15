// components/users/user-form.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

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
import { createUser, updateUser } from '@/lib/actions/users-actions';
import { 
  Loader2, 
  Save, 
  X,  
  User, 
  Mail, 
  Lock,
  Shield
} from 'lucide-react';
import type { UserDetails } from '@/types/user-management-types';

const userFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  businessUnitId: string;
  user?: UserDetails;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserForm({ businessUnitId, user, onSuccess, onCancel }: UserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!user;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: user?.username || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      password: '',
      isActive: user?.isActive ?? true,
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = isEditMode
        ? await updateUser(businessUnitId, user.id, data)
        : await createUser(businessUnitId, data);
      
      if (result.success) {
        toast.success(isEditMode ? 'User updated successfully' : 'User created successfully');
        if (onSuccess) {
          onSuccess();
        } else {
          startTransition(() => {
            router.push(`/${businessUnitId}/users`);
          });
        }
      } else {
        toast.error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} user`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} user:`, error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      startTransition(() => {
        router.push(`/${businessUnitId}/users`);
      });
    }
  };

  const isLoading = isPending || isSubmitting;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
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
                        <FormLabel>Last Name *</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter username (optional)" 
                            disabled={isLoading}
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional. If not provided, email will be used for login.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Password {!isEditMode && '*'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"} 
                            disabled={isLoading}
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
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
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Status
                        </FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === 'true')} 
                          value={field.value.toString()}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-green-500 rounded-full" />
                                Active
                              </div>
                            </SelectItem>
                            <SelectItem value="false">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-gray-500 rounded-full" />
                                Inactive
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Inactive users cannot log in to the system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              size="lg"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
        </form>
      </Form>
    </div>
  );
}