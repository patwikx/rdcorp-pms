// components/roles/role-permission-management.tsx
'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Key, 
  Plus, 
  Save,
  Settings,
  CheckCircle,
  Trash2,
  FileText,
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateRolePermissions } from '@/lib/actions/role-actions';
import type { 
  RoleDetails,
} from '@/types/role-types';

interface RolePermissionManagementProps {
  businessUnitId: string;
  role: RoleDetails;
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

interface PermissionState {
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export function RolePermissionManagement({
  businessUnitId,
  role,
}: RolePermissionManagementProps) {
  const [permissions, setPermissions] = useState<PermissionState[]>(
    role.permissions.map(perm => ({
      module: perm.module,
      canCreate: perm.canCreate,
      canRead: perm.canRead,
      canUpdate: perm.canUpdate,
      canDelete: perm.canDelete,
      canApprove: perm.canApprove,
    }))
  );
  const [isLoading, setIsLoading] = useState(false);

  const addModule = (moduleValue: string) => {
    if (permissions.some(p => p.module === moduleValue)) {
      toast.error('Module already added');
      return;
    }

    setPermissions(prev => [...prev, {
      module: moduleValue,
      canCreate: false,
      canRead: true, // Default to read permission
      canUpdate: false,
      canDelete: false,
      canApprove: false,
    }]);
  };

  const removeModule = (moduleValue: string) => {
    setPermissions(prev => prev.filter(p => p.module !== moduleValue));
  };

  const updatePermission = (
    moduleValue: string, 
    permission: keyof Omit<PermissionState, 'module'>, 
    value: boolean
  ) => {
    setPermissions(prev => prev.map(p => 
      p.module === moduleValue 
        ? { ...p, [permission]: value }
        : p
    ));
  };

  const handleSavePermissions = async () => {
    setIsLoading(true);
    try {
      const result = await updateRolePermissions(businessUnitId, role.id, permissions);
      
      if (result.success) {
        toast.success('Permissions updated successfully');
      } else {
        toast.error(result.error || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getModuleLabel = (moduleValue: string) => {
    const moduleConfig = MODULES.find(m => m.value === moduleValue);
    return moduleConfig ? moduleConfig.label : moduleValue;
  };

  const getPermissionCount = () => {
    return permissions.reduce((sum, perm) => {
      return sum + 
        (perm.canCreate ? 1 : 0) +
        (perm.canRead ? 1 : 0) +
        (perm.canUpdate ? 1 : 0) +
        (perm.canDelete ? 1 : 0) +
        (perm.canApprove ? 1 : 0);
    }, 0);
  };

  const availableModules = MODULES.filter(moduleItem => 
    !permissions.some(p => p.module === moduleItem.value)
  );

  return (
    <div className="space-y-6">
      {/* Permissions Management Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-green-600" />
              Permissions ({permissions.length} modules, {getPermissionCount()} permissions)
            </CardTitle>
            <div className="flex items-center space-x-3">
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
              <Button onClick={handleSavePermissions} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Permissions
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Key className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Permissions</h3>
              <p className="text-muted-foreground mb-4">
                This role has no permissions defined. Use the dropdown above to add modules.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {permissions.map((permission) => (
                <Card key={permission.module} className="border-2 border-dashed border-muted-foreground/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {getModuleLabel(permission.module)}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModule(permission.module)}
                        disabled={isLoading}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="flex flex-row items-start space-x-3 space-y-0">
                        <Checkbox
                          checked={permission.canCreate}
                          onCheckedChange={(checked) => 
                            updatePermission(permission.module, 'canCreate', !!checked)
                          }
                          disabled={isLoading}
                        />
                        <div className="space-y-1 leading-none">
                          <label className="text-sm flex items-center gap-1">
                            <Plus className="h-3 w-3 text-green-600" />
                            Create
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-row items-start space-x-3 space-y-0">
                        <Checkbox
                          checked={permission.canRead}
                          onCheckedChange={(checked) => 
                            updatePermission(permission.module, 'canRead', !!checked)
                          }
                          disabled={isLoading}
                        />
                        <div className="space-y-1 leading-none">
                          <label className="text-sm flex items-center gap-1">
                            <FileText className="h-3 w-3 text-blue-600" />
                            Read
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-row items-start space-x-3 space-y-0">
                        <Checkbox
                          checked={permission.canUpdate}
                          onCheckedChange={(checked) => 
                            updatePermission(permission.module, 'canUpdate', !!checked)
                          }
                          disabled={isLoading}
                        />
                        <div className="space-y-1 leading-none">
                          <label className="text-sm flex items-center gap-1">
                            <Settings className="h-3 w-3 text-orange-600" />
                            Update
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-row items-start space-x-3 space-y-0">
                        <Checkbox
                          checked={permission.canDelete}
                          onCheckedChange={(checked) => 
                            updatePermission(permission.module, 'canDelete', !!checked)
                          }
                          disabled={isLoading}
                        />
                        <div className="space-y-1 leading-none">
                          <label className="text-sm flex items-center gap-1">
                            <Trash2 className="h-3 w-3 text-red-600" />
                            Delete
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-row items-start space-x-3 space-y-0">
                        <Checkbox
                          checked={permission.canApprove}
                          onCheckedChange={(checked) => 
                            updatePermission(permission.module, 'canApprove', !!checked)
                          }
                          disabled={isLoading}
                        />
                        <div className="space-y-1 leading-none">
                          <label className="text-sm flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-purple-600" />
                            Approve
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Permission Summary */}
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{getModuleLabel(permission.module)} Permissions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {permission.canCreate && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Create</Badge>
                          )}
                          {permission.canRead && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Read</Badge>
                          )}
                          {permission.canUpdate && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Update</Badge>
                          )}
                          {permission.canDelete && (
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">Delete</Badge>
                          )}
                          {permission.canApprove && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Approve</Badge>
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
    </div>
  );
}