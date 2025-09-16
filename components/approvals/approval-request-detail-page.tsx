// components/approvals/approval-request-detail-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

interface ApprovalRequestDetailPageProps {
  businessUnitId: string;
  request: ApprovalRequestWithDetails;
}

export function ApprovalRequestDetailPage({
  businessUnitId,
  request,
}: ApprovalRequestDetailPageProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [comments, setComments] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);

  const canApprove = useCanApproveInCurrentBU('APPROVAL');
  const currentRole = useCurrentBusinessUnitRole();

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

  const handleApprove = async () => {
    if (!canApprove || !currentRole) {
      toast.error('You do not have permission to approve this request');
      return;
    }

    setIsProcessing(true);
    try {
      const currentStep = request.workflow.steps.find(
        step => step.stepOrder === request.currentStepOrder
      );

      if (!currentStep) {
        toast.error('Current approval step not found');
        return;
      }

      const result = await processApprovalResponse(businessUnitId, {
        approvalRequestId: request.id,
        stepId: currentStep.id,
        status: ApprovalStatus.APPROVED,
        comments: comments.trim() || undefined,
        isOverride: false,
      });

      if (result.success) {
        toast.success('Approval processed successfully');
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

  const handleReject = async () => {
    if (!canApprove || !currentRole) {
      toast.error('You do not have permission to reject this request');
      return;
    }

    if (!comments.trim()) {
      toast.error('Comments are required when rejecting a request');
      return;
    }

    setIsProcessing(true);
    try {
      const currentStep = request.workflow.steps.find(
        step => step.stepOrder === request.currentStepOrder
      );

      if (!currentStep) {
        toast.error('Current approval step not found');
        return;
      }

      const result = await processApprovalResponse(businessUnitId, {
        approvalRequestId: request.id,
        stepId: currentStep.id,
        status: ApprovalStatus.REJECTED,
        comments: comments.trim(),
        isOverride: false,
      });

      if (result.success) {
        toast.success('Request rejected successfully');
        router.push(`/${businessUnitId}/property-movement/approvals`);
      } else {
        toast.error(result.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const canProcessRequest = () => {
    if (!canApprove || !currentRole) return false;
    if (request.status !== ApprovalRequestStatus.PENDING && request.status !== ApprovalRequestStatus.IN_PROGRESS) return false;
    
    const currentStep = request.workflow.steps.find(
      step => step.stepOrder === request.currentStepOrder
    );
    
    if (!currentStep) return false;
    
    // Check if user has the required role or can override
    return currentRole.id === currentStep.roleId || 
           (currentStep.canOverride && currentRole.level >= (currentStep.overrideMinLevel || 0));
  };

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
              <div className="text-sm font-medium text-muted-foreground">Status</div>
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

      {/* Approval Steps Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Approval Progress (Step {request.currentStepOrder} of {request.workflow.steps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {request.workflow.steps.map((step, index) => {
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
                          Pending
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

      {/* Response Form */}
      {canProcessRequest() && (request.status === ApprovalRequestStatus.PENDING || request.status === ApprovalRequestStatus.IN_PROGRESS) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Process Approval Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showResponseForm ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to Process</h3>
                <p className="text-muted-foreground mb-4">
                  You can approve or reject this approval request.
                </p>
                <Button onClick={() => setShowResponseForm(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Process Request
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Comments</label>
                  <Textarea
                    placeholder="Enter your comments (required for rejection)..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    disabled={isProcessing}
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResponseForm(false);
                      setComments('');
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isProcessing || !comments.trim()}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request History */}
      {request.responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
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