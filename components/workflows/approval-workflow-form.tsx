// components/workflows/approval-workflow-form.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  FileText, 
  Users, 
  ArrowUp, 
  ArrowDown,
  GripVertical,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info
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
  ApprovalWorkflowFormData,
  RoleSubset,
} from '@/types/approval-workflow-types';
import { toast } from 'sonner';

const approvalStepSchema = z.object({
  stepName: z.string().min(1, 'Step name is required'),
  roleId: z.string().min(1, 'Role is required'),
  stepOrder: z.number().min(1, 'Step order must be at least 1'),
  isRequired: z.boolean(),
  canOverride: z.boolean(),
  overrideMinLevel: z.number().optional(),
});

const approvalWorkflowFormSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  entityType: z.string().min(1, 'Entity type is required'),
  isActive: z.boolean(),
  steps: z.array(approvalStepSchema).min(1, 'At least one approval step is required'),
}).refine((data) => {
  // Validate step order sequence
  const stepOrders = data.steps.map(step => step.stepOrder).sort((a, b) => a - b);
  for (let i = 0; i < stepOrders.length; i++) {
    if (stepOrders[i] !== i + 1) {
      return false;
    }
  }
  return true;
}, {
  message: "Step orders must be sequential starting from 1",
  path: ["steps"],
}).refine((data) => {
  // Validate override settings
  return data.steps.every(step => {
    if (step.canOverride && step.overrideMinLevel === undefined) {
      return false;
    }
    return true;
  });
}, {
  message: "Override minimum level is required when override is enabled",
  path: ["steps"],
});

type WorkflowFormData = z.infer<typeof approvalWorkflowFormSchema>;

interface ApprovalWorkflowFormProps {
  availableRoles: RoleSubset[];
  onSubmit: (data: ApprovalWorkflowFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: ApprovalWorkflowFormData;
  isEditMode?: boolean;
}

const ENTITY_TYPE_OPTIONS = [
  { value: 'PROPERTY_RELEASE', label: 'Property Release' },
  { value: 'PROPERTY_TURNOVER', label: 'Property Turnover' },
  { value: 'PROPERTY_RETURN', label: 'Property Return' },
  { value: 'RPT_PAYMENT', label: 'RPT Payment' },
  { value: 'DOCUMENT_APPROVAL', label: 'Document Approval' },
  { value: 'USER_ASSIGNMENT', label: 'User Assignment' },
] as const;

export function ApprovalWorkflowForm({
  availableRoles,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  isEditMode = false,
}: ApprovalWorkflowFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const form = useForm<WorkflowFormData>({
    resolver: zodResolver(approvalWorkflowFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      entityType: '',
      isActive: true,
      steps: [
        {
          stepName: 'Manager Approval',
          roleId: '',
          stepOrder: 1,
          isRequired: true,
          canOverride: false,
          overrideMinLevel: undefined,
        },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'steps',
  });

  // Reorder steps when they change
  useEffect(() => {
    const steps = form.getValues('steps');
    const reorderedSteps = steps.map((step, index) => ({
      ...step,
      stepOrder: index + 1,
    }));
    form.setValue('steps', reorderedSteps);
  }, [fields.length, form]);

  const handleSubmit = async (data: WorkflowFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting workflow form:', error);
    }
  };

  const addStep = () => {
    const currentSteps = form.getValues('steps');
    const nextOrder = currentSteps.length + 1;
    
    append({
      stepName: `Step ${nextOrder}`,
      roleId: '',
      stepOrder: nextOrder,
      isRequired: true,
      canOverride: false,
      overrideMinLevel: undefined,
    });
  };

  const removeStep = (index: number) => {
    if (fields.length <= 1) {
      toast.error('At least one approval step is required');
      return;
    }
    remove(index);
  };

  const moveStepUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const moveStepDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  const getRoleName = (roleId: string) => {
    const role = availableRoles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  const getRoleLevel = (roleId: string) => {
    const role = availableRoles.find(r => r.id === roleId);
    return role ? role.level : 0;
  };

  const getRoleLevelBadge = (level: number) => {
    const colors = {
      0: 'bg-gray-100 text-gray-800',
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-purple-100 text-purple-800',
      4: 'bg-red-100 text-red-800',
    };
    
    const labels = {
      0: 'Staff',
      1: 'Manager',
      2: 'Director',
      3: 'VP',
      4: 'MD',
    };

    return (
      <Badge className={`${colors[level as keyof typeof colors] || colors[0]} text-xs`}>
        Level {level} - {labels[level as keyof typeof labels] || 'Unknown'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Workflow Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Workflow Information
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
                          Workflow Name *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter workflow name" 
                            disabled={isLoading}
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for this approval workflow
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Entity Type *
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select entity type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ENTITY_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The type of entity this workflow will approve
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
                            placeholder="Enter workflow description..." 
                            disabled={isLoading}
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description of the workflow purpose
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
                            Active Workflow
                          </FormLabel>
                          <FormDescription>
                            Enable this workflow for new approval requests
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Steps */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Approval Steps ({fields.length})
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No approval steps defined. Click &qout;Add Step&qout; to create your first approval step.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border-2 border-dashed border-muted-foreground/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Step {index + 1}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveStepUp(index)}
                                disabled={index === 0 || isLoading}
                                className="h-7 w-7 p-0"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveStepDown(index)}
                                disabled={index === fields.length - 1 || isLoading}
                                className="h-7 w-7 p-0"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                            disabled={fields.length <= 1 || isLoading}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`steps.${index}.stepName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Step Name *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter step name" 
                                    disabled={isLoading}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`steps.${index}.roleId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Required Role *</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  value={field.value}
                                  disabled={isLoading}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableRoles.map((role) => (
                                      <SelectItem key={role.id} value={role.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{role.name}</span>
                                          {getRoleLevelBadge(role.level)}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name={`steps.${index}.isRequired`}
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
                                  <FormLabel className="text-sm">Required Step</FormLabel>
                                  <FormDescription className="text-xs">
                                    This step must be completed
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`steps.${index}.canOverride`}
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
                                    <Shield className="h-3 w-3" />
                                    Can Override
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    Allow senior roles to override
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          {form.watch(`steps.${index}.canOverride`) && (
                            <FormField
                              control={form.control}
                              name={`steps.${index}.overrideMinLevel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Override Min Level</FormLabel>
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))} 
                                    value={field.value?.toString() || ''}
                                    disabled={isLoading}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="1">Level 1 - Manager</SelectItem>
                                      <SelectItem value="2">Level 2 - Director</SelectItem>
                                      <SelectItem value="3">Level 3 - VP</SelectItem>
                                      <SelectItem value="4">Level 4 - MD</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* Step Summary */}
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {form.watch(`steps.${index}.roleId`) ? getRoleName(form.watch(`steps.${index}.roleId`)) : 'No role selected'}
                              </span>
                              {form.watch(`steps.${index}.roleId`) && getRoleLevelBadge(getRoleLevel(form.watch(`steps.${index}.roleId`)))}
                            </div>
                            <div className="flex items-center gap-2">
                              {form.watch(`steps.${index}.isRequired`) && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
                              )}
                              {form.watch(`steps.${index}.canOverride`) && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Override: Level {form.watch(`steps.${index}.overrideMinLevel`) || 'N/A'}+
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Workflow Preview */}
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Workflow Preview:</strong> Approval requests will follow this sequence: {' '}
                      {fields.map((_, index) => {
                        const roleId = form.watch(`steps.${index}.roleId`);
                        const roleName = roleId ? getRoleName(roleId) : `Step ${index + 1}`;
                        return (
                          <span key={index}>
                            {index > 0 && ' → '}
                            <span className="font-medium">{roleName}</span>
                          </span>
                        );
                      })}
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
                    {isEditMode ? 'Update Workflow' : 'Create Workflow'}
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