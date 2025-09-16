// components/roles/role-form.tsx
'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Shield, 
  Save, 
  X, 
  FileText, 
  Users, 
  Key,
  CheckCircle,
  Settings,
  Plus,
  Trash2,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { 
  RoleFormData,
} from '@/types/role-types';
import { toast } from 'sonner';

const rolePermissionSchema = z.object({
  module: z.string().min(1, 'Module is required'),
  canCreate: z.boolean(),
  canRead: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
  canApprove: z.boolean(),
});

const roleFormSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  level: z.number().min(0).max(4),
  permissions: z.array(rolePermissionSchema).min(1, 'At least one permission is required'),
});

type RoleFormDataType = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  onSubmit: (data: RoleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: RoleFormData;
  isEditMode?: boolean;
}

const MODULES = [
  { value: 'PROPERTY', label: 'Property Management' },
  { value: 'RPT', label: 'Real Property Tax' },
  { value: 'USER_MANAGEMENT', label: 'User Management' },
  { value: 'APPROVAL', label: 'Approval Workflows' },
  { value: 'DOCUMENTS', label: 'Document Management' },
  { value: 'REPORTS', label: 'Reports & Analytics' },
  { value: 'AUDIT', label: 'Audit Logs' },
  { value: 'BUSINESS_UNITS', label: 'Business Units' },
  { value: 'ROLES', label: 'Roles & Permissions' },
  { value: 'SYSTEM', label: 'System Settings' },
] as const;

const LEVELS = [
  { value: 0, label: 'Staff', description: 'Basic operational level' },
  { value: 1, label: 'Manager', description: 'Department management level' },
  { value: 2, label: 'Director', description: 'Division management level' },
  { value: 3, label: 'Vice President', description: 'Executive level' },
  { value: 4, label: 'Managing Director', description: 'Top executive level' },
] as const;

export function RoleForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  isEditMode = false,
}: RoleFormProps) {
  const [selectedModules, setSelectedModules] = useState<Set<string>>(
    new Set(initialData?.permissions.map(p => p.module) || [])
  );

  const form = useForm<RoleFormDataType>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      level: 0,
      permissions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'permissions',
  });

  const handleSubmit = async (data: RoleFormDataType) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting role form:', error);
    }
  };

  const addModule = (moduleValue: string) => {
    if (selectedModules.has(moduleValue)) {
      toast.error('Module already added');
      return;
    }

    // Fixed: renamed 'module' to 'moduleConfig'
    const moduleConfig = MODULES.find(m => m.value === moduleValue);
    if (!moduleConfig) return;

    append({
      module: moduleValue,
      canCreate: false,
      canRead: true, // Default to read permission
      canUpdate: false,
      canDelete: false,
      canApprove: false,
    });

    setSelectedModules(prev => new Set([...prev, moduleValue]));
  };

  const removeModule = (index: number) => {
    const moduleValue = fields[index].module;
    remove(index);
    setSelectedModules(prev => {
      const newSet = new Set(prev);
      newSet.delete(moduleValue);
      return newSet;
    });
  };

  const getModuleLabel = (moduleValue: string) => {
    // Fixed: renamed 'module' to 'moduleConfig'
    const moduleConfig = MODULES.find(m => m.value === moduleValue);
    return moduleConfig ? moduleConfig.label : moduleValue;
  };

  const getPermissionCount = (permissions: typeof fields) => {
    return permissions.reduce((sum, perm) => {
      const watchedPerm = form.watch(`permissions.${permissions.indexOf(perm)}`);
      return sum + 
        (watchedPerm.canCreate ? 1 : 0) +
        (watchedPerm.canRead ? 1 : 0) +
        (watchedPerm.canUpdate ? 1 : 0) +
        (watchedPerm.canDelete ? 1 : 0) +
        (watchedPerm.canApprove ? 1 : 0);
    }, 0);
  };

  const availableModules = MODULES.filter(moduleItem => !selectedModules.has(moduleItem.value));

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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5 text-green-600" />
                  Permissions ({fields.length} modules, {getPermissionCount(fields)} permissions)
                </CardTitle>
                {availableModules.length > 0 && (
                  <Select onValueChange={addModule}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add module..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModules.map((moduleItem) => (
                        <SelectItem key={moduleItem.value} value={moduleItem.value}>
                          <div className="flex items-center gap-2">
                            <Plus className="h-3 w-3" />
                            {moduleItem.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    No permissions defined. Use the dropdown above to add modules and configure permissions.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border-2 border-dashed border-muted-foreground/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {getModuleLabel(field.module)}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeModule(index)}
                            disabled={isLoading}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <FormField
                            control={form.control}
                            name={`permissions.${index}.canCreate`}
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
                                  <FormLabel className="text-sm flex items-center gap-1">
                                    <Plus className="h-3 w-3 text-green-600" />
                                    Create
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`permissions.${index}.canRead`}
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
                                  <FormLabel className="text-sm flex items-center gap-1">
                                    <FileText className="h-3 w-3 text-blue-600" />
                                    Read
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`permissions.${index}.canUpdate`}
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
                                  <FormLabel className="text-sm flex items-center gap-1">
                                    <Settings className="h-3 w-3 text-orange-600" />
                                    Update
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`permissions.${index}.canDelete`}
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
                                  <FormLabel className="text-sm flex items-center gap-1">
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                    Delete
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`permissions.${index}.canApprove`}
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
                                  <FormLabel className="text-sm flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-purple-600" />
                                    Approve
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Permission Summary */}
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{getModuleLabel(field.module)} Permissions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {form.watch(`permissions.${index}.canCreate`) && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Create</Badge>
                              )}
                              {form.watch(`permissions.${index}.canRead`) && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Read</Badge>
                              )}
                              {form.watch(`permissions.${index}.canUpdate`) && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Update</Badge>
                              )}
                              {form.watch(`permissions.${index}.canDelete`) && (
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">Delete</Badge>
                              )}
                              {form.watch(`permissions.${index}.canApprove`) && (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Approve</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Role Summary */}
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Role Summary:</strong> This role will have access to {fields.length} module{fields.length !== 1 ? 's' : ''} with {getPermissionCount(fields)} total permission{getPermissionCount(fields) !== 1 ? 's' : ''}.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
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
                    {isEditMode ? 'Update Role' : 'Create Role'}
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