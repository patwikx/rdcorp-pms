// components/roles/role-edit-form.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Shield, 
  Save, 
  X, 
  FileText, 
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  RoleFormData,
  RoleDetails,
} from '@/types/role-types';
import { format } from 'date-fns';

const roleEditFormSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  level: z.number().min(0).max(4),
});

type RoleEditFormData = z.infer<typeof roleEditFormSchema>;

interface RoleEditFormProps {
  role: RoleDetails;
  onSubmit: (data: RoleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData: RoleFormData;
  isEditMode?: boolean;
}

const LEVELS = [
  { value: 0, label: 'Staff', description: 'Basic operational level' },
  { value: 1, label: 'Manager', description: 'Department management level' },
  { value: 2, label: 'Director', description: 'Division management level' },
  { value: 3, label: 'Vice President', description: 'Executive level' },
  { value: 4, label: 'Managing Director', description: 'Top executive level' },
] as const;

export function RoleEditForm({
  role,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isEditMode = true,
}: RoleEditFormProps) {
  const form = useForm<RoleEditFormData>({
    resolver: zodResolver(roleEditFormSchema),
    defaultValues: {
      name: initialData.name,
      description: initialData.description || '',
      level: initialData.level,
    },
  });

  const handleSubmit = async (data: RoleEditFormData) => {
    try {
      // For edit mode, we only update basic role info, not permissions
      await onSubmit({
        name: data.name,
        description: data.description,
        level: data.level,
        permissions: initialData.permissions, // Keep existing permissions
      });
    } catch (error) {
      console.error('Error submitting role form:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Role Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Role Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Role Name *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter role name" 
                            disabled={isLoading}
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          A unique name for this role
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Role Level *
                        </FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value.toString()}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select role level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value.toString()}>
                                <div className="flex items-center justify-between w-full">
                                  <div>
                                    <div className="font-medium">Level {level.value} - {level.label}</div>
                                    <div className="text-xs text-muted-foreground">{level.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Higher levels can override lower level approvals
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter role description..." 
                            disabled={isLoading}
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description of the role responsibilities
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Role Statistics */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold text-sm mb-3">Role Statistics</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Members:</span>
                        <span className="ml-1 font-medium">{role._count?.businessUnitMembers || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Permissions:</span>
                        <span className="ml-1 font-medium">{role._count?.permissions || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <span className="ml-1 font-medium">{format(new Date(role.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Updated:</span>
                        <span className="ml-1 font-medium">{format(new Date(role.updatedAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Fields marked with * are required. Use the Permissions tab to manage role permissions.
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
                    Updating Role...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Role
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