// components/users/user-assignment-modal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Shield, 
  Building2,
  Save,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { 
  UserAssignmentFormData,
} from '@/types/user-management-types';


const assignmentFormSchema = z.object({
  businessUnitId: z.string().min(1, 'Business unit is required'),
  roleId: z.string().min(1, 'Role is required'),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

interface UserAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserAssignmentFormData) => Promise<void>;
  availableRoles: Array<{ id: string; name: string; level: number; description: string | null }>;
  isLoading: boolean;
  editingAssignment?: { businessUnitId: string; roleId: string } | null;
  userId: string;
}

export function UserAssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  availableRoles,
  isLoading,
  editingAssignment,
  userId,
}: UserAssignmentModalProps) {
  const [availableBusinessUnits, setAvailableBusinessUnits] = useState<Array<{ id: string; name: string; description: string | null }>>([]);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      businessUnitId: editingAssignment?.businessUnitId || '',
      roleId: editingAssignment?.roleId || '',
    },
  });

  // Fetch business units when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchBusinessUnits = async () => {
        try {
          // This would normally be a server action, but for simplicity using direct prisma call
          // In production, create a proper server action for this
          const units = await fetch('/api/business-units').then(res => res.json());
          setAvailableBusinessUnits(units);
        } catch (error) {
          console.error('Error fetching business units:', error);
          // Fallback to empty array
          setAvailableBusinessUnits([]);
        }
      };
      
      fetchBusinessUnits();
    }
  }, [isOpen]);

  // Reset form when editing assignment changes
  useEffect(() => {
    if (editingAssignment) {
      form.reset({
        businessUnitId: editingAssignment.businessUnitId,
        roleId: editingAssignment.roleId,
      });
    } else {
      form.reset({
        businessUnitId: '',
        roleId: '',
      });
    }
  }, [editingAssignment, form]);

  const handleSubmit = async (data: AssignmentFormData) => {
    try {
      await onSubmit({
        userId,
        businessUnitId: data.businessUnitId,
        roleId: data.roleId,
      });
    } catch (error) {
      console.error('Error submitting assignment:', error);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
          </DialogTitle>
          <DialogDescription>
            {editingAssignment 
              ? 'Update the user\'s role or business unit assignment.'
              : 'Assign this user to a business unit with a specific role.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                    disabled={isLoading || !!editingAssignment}
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
                    {editingAssignment 
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

            <DialogFooter className="pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={onClose}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="ml-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {editingAssignment ? 'Updating...' : 'Assigning...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingAssignment ? 'Update Assignment' : 'Add Assignment'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}