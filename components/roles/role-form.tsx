// components/roles/role-form.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { createRole, updateRole, getAvailablePermissions } from '@/lib/actions/roles-actions';
import { 
  Loader2, 
  Save, 
  X,  
  Shield, 
  Key,
  FileText,
  Users,
  Building2,
  BarChart3,
  Settings,
  Eye
} from 'lucide-react';
import type { RoleDetails } from '@/types/user-management-types';

const roleFormSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters'),
  permissions: z.array(z.string()).min(1, 'At least one permission must be selected'),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  businessUnitId: string;
  role?: RoleDetails;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  'System Management': {
    icon: Settings,
    color: 'text-red-600',
    permissions: ['system:manage', 'system:settings:update', 'system:backup:create', 'system:logs:view']
  },
  'User Management': {
    icon: Users,
    color: 'text-blue-600',
    permissions: ['users:create', 'users:read', 'users:update', 'users:delete', 'users:manage_roles', 'users:reset_password']
  },
  'Business Unit Management': {
    icon: Building2,
    color: 'text-green-600',
    permissions: ['business_units:create', 'business_units:read', 'business_units:update', 'business_units:delete', 'business_units:manage_members']
  },
  'Property Management': {
    icon: FileText,
    color: 'text-purple-600',
    permissions: ['properties:create', 'properties:read', 'properties:update', 'properties:delete', 'properties:approve', 'properties:release', 'properties:turnover', 'properties:return', 'properties:bulk_operations']
  },
  'Reports & Analytics': {
    icon: BarChart3,
    color: 'text-orange-600',
    permissions: ['reports:view_all', 'reports:create', 'reports:export', 'analytics:view_all', 'reports:view_assigned', 'reports:view_department', 'reports:view_financial', 'reports:view_legal']
  },
  'Audit & Compliance': {
    icon: Eye,
    color: 'text-indigo-600',
    permissions: ['audit_logs:view', 'audit_logs:export', 'compliance:manage', 'audit_logs:view_department', 'audit_logs:view_financial', 'audit_logs:view_legal']
  }
};

export function RoleForm({ businessUnitId, role, onSuccess, onCancel }: RoleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const isEditMode = !!role;

  // Load available permissions
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const permissions = await getAvailablePermissions();
        setAvailablePermissions(permissions);
      } catch (error) {
        console.error('Error loading permissions:', error);
        toast.error('Failed to load permissions');
      } finally {
        setLoadingPermissions(false);
      }
    };

    loadPermissions();
  }, []);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      permissions: Array.isArray(role?.permissions) ? role.permissions as string[] : [],
    },
  });

  const onSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = isEditMode
        ? await updateRole(businessUnitId, role.id, data)
        : await createRole(businessUnitId, data);
      
      if (result.success) {
        toast.success(isEditMode ? 'Role updated successfully' : 'Role created successfully');
        if (onSuccess) {
          onSuccess();
        } else {
          startTransition(() => {
            router.push(`/${businessUnitId}/roles`);
          });
        }
      } else {
        toast.error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} role`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} role:`, error);
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
        router.push(`/${businessUnitId}/roles`);
      });
    }
  };

  const isLoading = isPending || isSubmitting || loadingPermissions;

  const getPermissionsForCategory = (categoryPermissions: string[]) => {
    return availablePermissions.filter(permission => 
      categoryPermissions.some(catPerm => permission.startsWith(catPerm.split(':')[0]))
    );
  };

  const selectedPermissions = form.watch('permissions');

  const toggleCategoryPermissions = (categoryPermissions: string[], checked: boolean) => {
    const relevantPermissions = getPermissionsForCategory(categoryPermissions);
    const currentPermissions = selectedPermissions || [];
    
    if (checked) {
      // Add all category permissions
      const newPermissions = [...new Set([...currentPermissions, ...relevantPermissions])];
      form.setValue('permissions', newPermissions);
    } else {
      // Remove all category permissions
      const newPermissions = currentPermissions.filter(p => !relevantPermissions.includes(p));
      form.setValue('permissions', newPermissions);
    }
  };

  const isCategorySelected = (categoryPermissions: string[]) => {
    const relevantPermissions = getPermissionsForCategory(categoryPermissions);
    return relevantPermissions.length > 0 && relevantPermissions.every(p => selectedPermissions?.includes(p));
  };

  const isCategoryPartiallySelected = (categoryPermissions: string[]) => {
    const relevantPermissions = getPermissionsForCategory(categoryPermissions);
    return relevantPermissions.some(p => selectedPermissions?.includes(p)) && !isCategorySelected(categoryPermissions);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Role Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter role name" 
                          disabled={isLoading}
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A unique name for this role (e.g., Property Manager, Finance Officer)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the role's responsibilities" 
                          disabled={isLoading}
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of the role&apos;s purpose and responsibilities
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-green-600" />
                Role Permissions
              </CardTitle>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  Select the permissions this role should have
                </p>
                <Badge variant="secondary">
                  {selectedPermissions?.length || 0} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <div className="space-y-6">
                      {Object.entries(PERMISSION_CATEGORIES).map(([categoryName, categoryData]) => {
                        const relevantPermissions = getPermissionsForCategory(categoryData.permissions);
                        
                        if (relevantPermissions.length === 0) return null;

                        const IconComponent = categoryData.icon;
                        const isSelected = isCategorySelected(categoryData.permissions);
                        const isPartiallySelected = isCategoryPartiallySelected(categoryData.permissions);

                        return (
                          <div key={categoryName} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <IconComponent className={`h-5 w-5 ${categoryData.color}`} />
                                <div>
                                  <h3 className="font-semibold">{categoryName}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {relevantPermissions.length} permissions available
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => 
                                    toggleCategoryPermissions(categoryData.permissions, checked as boolean)
                                  }
                                  disabled={isLoading}
                                  className={isPartiallySelected ? 'data-[state=checked]:bg-orange-500' : ''}
                                />
                                <span className="text-sm font-medium">
                                  {isSelected ? 'All' : isPartiallySelected ? 'Some' : 'None'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {relevantPermissions.map((permission) => (
                                <FormField
                                  key={permission}
                                  control={form.control}
                                  name="permissions"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(permission)}
                                          onCheckedChange={(checked) => {
                                            const currentValue = field.value || [];
                                            if (checked) {
                                              field.onChange([...currentValue, permission]);
                                            } else {
                                              field.onChange(currentValue.filter((value) => value !== permission));
                                            }
                                          }}
                                          disabled={isLoading}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="text-sm font-medium cursor-pointer">
                                          {permission}
                                        </FormLabel>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  {isEditMode ? 'Update Role' : 'Create Role'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}