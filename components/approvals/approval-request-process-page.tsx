// components/approvals/approval-request-process-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2,
  User,
  Calendar,
  AlertCircle,
  FileText,
  Send,
  MessageSquare,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { ApprovalRequestStatus, ApprovalStatus } from '@prisma/client';
import type { 
  ApprovalRequestWithDetails,
} from '@/types/approval-types';
import { processApprovalResponse } from '@/lib/actions/approval-actions';
import { 
  useCanApproveInCurrentBU,
  useCurrentBusinessUnitRole
} from '@/context/business-unit-context';

const approvalResponseSchema = z.object({
  status: z.nativeEnum(ApprovalStatus),
  comments: z.string().optional(),
  isOverride: z.boolean().default(false),
}).refine((data) => {
  // Comments are required for rejection
  if (data.status === ApprovalStatus.REJECTED && !data.comments?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Comments are required when rejecting a request",
  path: ["comments"],
});

type ApprovalResponseFormData = z.infer<typeof approvalResponseSchema>;

interface ApprovalRequestProcessPageProps {
  businessUnitId: string;
  request: ApprovalRequestWithDetails;
}

export function ApprovalRequestProcessPage({
  businessUnitId,
  request,
}: ApprovalRequestProcessPageProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const canApprove = useCanApproveInCurrentBU('APPROVAL');
  const currentRole = useCurrentBusinessUnitRole();

  const form = useForm<ApprovalResponseFormData>({
    resolver: zodResolver(approvalResponseSchema),
    defaultValues: {
      status: ApprovalStatus.APPROVED,
      comments: '',
      isOverride: false,
    },
  });

  const watchedStatus = form.watch('status');

  const getStatusBadge = (status: ApprovalRequestStatus) => {
    const variants: Record<ApprovalRequestStatus, { className: string; icon: React.ReactNode }> = {
      PENDING: { 
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      IN_PROGRESS: { 
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      APPROVED: { 
        className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      REJECTED: { 
        className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      CANCELLED: { 
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      OVERRIDDEN: { 
        className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200',
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      },
      EXPIRED: { 
        className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200',
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      },
    };

    const config = variants[status];
    return (
      <Badge className={`${config.className} font-medium flex items-center`}>
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getApprovalStatusBadge = (status: ApprovalStatus) => {
    const variants: Record<ApprovalStatus, { className: string; icon: React.ReactNode }> = {
      PENDING: { 
        className: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      APPROVED: { 
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      REJECTED: { 
        className: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      UNDER_REVIEW: { 
        className: 'bg-blue-100 text-blue-800',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      SKIPPED: { 
        className: 'bg-gray-100 text-gray-800',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      EXPIRED: { 
        className: 'bg-orange-100 text-orange-800',
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      },
    };

    const config = variants[status];
    return (
      <Badge className={`${config.className} font-medium flex items-center text-xs`}>
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null }) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const getCurrentStep = () => {
    return request.workflow.steps.find(
      step => step.stepOrder === request.currentStepOrder
    );
  };

  const canProcessRequest = () => {
    if (!canApprove || !currentRole) return false;
    if (request.status !== ApprovalRequestStatus.PENDING && request.status !== ApprovalRequestStatus.IN_PROGRESS) return false;
    
    const currentStep = getCurrentStep();
    if (!currentStep) return false;
    
    // Check if user has the required role or can override
    return currentRole.id === currentStep.roleId || 
           (currentStep.canOverride && currentRole.level >= (currentStep.overrideMinLevel || 0));
  };

  const handleSubmit = async (data: ApprovalResponseFormData) => {
    if (!canProcessRequest()) {
      toast.error('You do not have permission to process this request');
      return;
    }

    const currentStep = getCurrentStep();
    if (!currentStep) {
      toast.error('Current approval step not found');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processApprovalResponse(businessUnitId, {
        approvalRequestId: request.id,
        stepId: currentStep.id,
        status: data.status,
        comments: data.comments?.trim() || undefined,
        isOverride: data.isOverride,
      });

      if (result.success) {
        const statusText = data.status === ApprovalStatus.APPROVED ? 'approved' : 'rejected';
        toast.success(`Request ${statusText} successfully`);
        router.push(`/${businessUnitId}/property-movement/approvals`);
      } else {
        toast.error(result.error || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/property-movement/approvals/${request.id}`);
  };

  if (!canProcessRequest()) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You do not have permission to process this approval request.
            </p>
            <Button onClick={handleCancel} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = getCurrentStep();

  return (
    <div className="space-y-6">
      {/* Request Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Approval Request Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Property</div>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-semibold">{request.property.titleNumber}</div>
                  <div className="text-sm text-muted-foreground">{request.property.propertyName}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Workflow</div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-semibold">{request.workflow.name}</div>
                  <div className="text-sm text-muted-foreground">{request.entityType.replace('_', ' ')}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Current Status</div>
              <div>{getStatusBadge(request.status)}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Requested By</div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-semibold">{getUserName(request.requestedBy)}</div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Information */}
      {currentStep && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              Current Approval Step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-medium">
                  {currentStep.stepOrder}
                </div>
                <div>
                  <div className="font-semibold text-blue-800">{currentStep.stepName}</div>
                  <div className="text-sm text-blue-600">Required Role: {currentStep.role.name}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Awaiting Response
                </Badge>
                {currentStep.canOverride && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                    Override Available (Level {currentStep.overrideMinLevel}+)
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Process Approval Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decision *</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant={field.value === ApprovalStatus.APPROVED ? "default" : "outline"}
                          onClick={() => field.onChange(ApprovalStatus.APPROVED)}
                          className="h-12 flex items-center justify-center"
                          disabled={isProcessing}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === ApprovalStatus.REJECTED ? "destructive" : "outline"}
                          onClick={() => field.onChange(ApprovalStatus.REJECTED)}
                          className="h-12 flex items-center justify-center"
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {currentStep?.canOverride && currentRole && currentRole.level >= (currentStep.overrideMinLevel || 0) && (
                  <FormField
                    control={form.control}
                    name="isOverride"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Override Options</FormLabel>
                        <div className="space-y-3">
                          <Button
                            type="button"
                            variant={field.value ? "default" : "outline"}
                            onClick={() => field.onChange(!field.value)}
                            className="w-full h-12 flex items-center justify-center"
                            disabled={isProcessing}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {field.value ? 'Using Override Authority' : 'Use Override Authority'}
                          </Button>
                          {field.value && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="text-sm text-yellow-800">
                                <strong>Override Active:</strong> You are using your authority as a Level {currentRole.level} role to override this approval step.
                              </div>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments {watchedStatus === ApprovalStatus.REJECTED && '*'}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          watchedStatus === ApprovalStatus.REJECTED 
                            ? "Please provide a reason for rejection (required)..."
                            : "Enter your comments (optional)..."
                        }
                        rows={4}
                        disabled={isProcessing}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {watchedStatus === ApprovalStatus.REJECTED 
                        ? "Comments are required when rejecting a request"
                        : "Optional comments about your decision"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Decision Summary */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-3">Decision Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Decision:</span>
                    <div>{getApprovalStatusBadge(watchedStatus)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Step:</span>
                    <span className="font-medium">{currentStep?.stepName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your Role:</span>
                    <span className="font-medium">{currentRole?.name}</span>
                  </div>
                  {form.watch('isOverride') && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Override:</span>
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Authority Override
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  size="lg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Request
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={isProcessing}
                  size="lg"
                  variant={watchedStatus === ApprovalStatus.REJECTED ? "destructive" : "default"}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {watchedStatus === ApprovalStatus.APPROVED ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Request
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Request
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Approval Steps Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Approval Progress (Step {request.currentStepOrder} of {request.workflow.steps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {request.workflow.steps.map((step) => {
              const stepResponse = request.responses.find(r => r.step.id === step.id);
              const isCurrentStep = step.stepOrder === request.currentStepOrder;
              const isCompleted = !!stepResponse;
              const isPending = isCurrentStep && !isCompleted;

              return (
                <div key={step.id} className={`border rounded-lg p-4 ${isCurrentStep ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted ? 'bg-green-100 text-green-800' :
                        isPending ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {step.stepOrder}
                      </div>
                      <div>
                        <div className="font-semibold">{step.stepName}</div>
                        <div className="text-sm text-muted-foreground">{step.role.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isCompleted && stepResponse && (
                        <>
                          {getApprovalStatusBadge(stepResponse.status)}
                          <div className="text-xs text-muted-foreground">
                            by {getUserName(stepResponse.respondedBy)}
                          </div>
                        </>
                      )}
                      {isPending && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Current Step
                        </Badge>
                      )}
                      {!isCompleted && !isPending && (
                        <Badge variant="outline" className="text-xs">
                          Waiting
                        </Badge>
                      )}
                    </div>
                  </div>

                  {stepResponse?.comments && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Comments</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{stepResponse.comments}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {format(new Date(stepResponse.respondedAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Request History */}
      {request.responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              Response History ({request.responses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.responses.map((response) => (
                <div key={response.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-semibold">{getUserName(response.respondedBy)}</div>
                        <div className="text-sm text-muted-foreground">{response.step.role.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getApprovalStatusBadge(response.status)}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(response.respondedAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>

                  {response.comments && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm">{response.comments}</p>
                    </div>
                  )}

                  {response.isOverride && (
                    <div className="mt-2">
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Override Used
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}