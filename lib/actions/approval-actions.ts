// lib/actions/approval-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { 
  ApprovalRequestStatus, 
  ApprovalStatus, 
  Prisma 
} from '@prisma/client';
import type {
  ApprovalRequestWithDetails,
  ApprovalRequestListItem,
  ApprovalRequestFormData,
  ApprovalResponseFormData,
  ApprovalRequestFilters,
  ApprovalRequestSort,
  ApprovalStats,
  CreateApprovalRequestResult,
  ProcessApprovalResult,
  ApprovalWorkflowWithSteps
} from '@/types/approval-types';

// Get approval requests with pagination and filtering
export async function getApprovalRequests(
  businessUnitId: string,
  page: number = 1,
  limit: number = 10,
  filters?: ApprovalRequestFilters,
  sort?: ApprovalRequestSort
): Promise<{
  requests: ApprovalRequestListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.ApprovalRequestWhereInput = {
    property: { businessUnitId },
    ...(filters?.search && {
      OR: [
        { property: { titleNumber: { contains: filters.search, mode: 'insensitive' } } },
        { property: { propertyName: { contains: filters.search, mode: 'insensitive' } } },
        { property: { location: { contains: filters.search, mode: 'insensitive' } } },
      ],
    }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.workflowId && { workflowId: filters.workflowId }),
    ...(filters?.propertyId && { propertyId: filters.propertyId }),
    ...(filters?.requestedById && { requestedById: filters.requestedById }),
    ...(filters?.dateFrom || filters?.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    },
  };

  // Build orderBy clause
  const orderBy: Prisma.ApprovalRequestOrderByWithRelationInput = sort
    ? { [sort.field]: sort.order }
    : { createdAt: 'desc' };

  try {
    const [requests, totalCount] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          property: {
            select: {
              id: true,
              titleNumber: true,
              propertyName: true,
              location: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          workflow: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
        },
      }),
      prisma.approvalRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      requests: requests as ApprovalRequestListItem[],
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching approval requests:', error);
    throw new Error('Failed to fetch approval requests');
  }
}

// Get approval request by ID with full details
export async function getApprovalRequestById(
  businessUnitId: string,
  requestId: string
): Promise<ApprovalRequestWithDetails | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  try {
    const request = await prisma.approvalRequest.findFirst({
      where: {
        id: requestId,
        property: { businessUnitId },
      },
      include: {
        workflow: true,
        property: {
          select: {
            id: true,
            titleNumber: true,
            propertyName: true,
            location: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        responses: {
          include: {
            respondedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            step: {
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    level: true,
                  },
                },
              },
            },
          },
          orderBy: { respondedAt: 'asc' },
        },
      },
    });

    return request as ApprovalRequestWithDetails | null;
  } catch (error) {
    console.error('Error fetching approval request:', error);
    throw new Error('Failed to fetch approval request details');
  }
}

// Create new approval request
export async function createApprovalRequest(
  businessUnitId: string,
  data: ApprovalRequestFormData
): Promise<CreateApprovalRequestResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    return { success: false, error: 'Access denied to this business unit' };
  }

  try {
    // Verify property belongs to business unit
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        businessUnitId,
      },
    });

    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    // Verify workflow exists and is active
    const workflow = await prisma.approvalWorkflow.findFirst({
      where: {
        id: data.workflowId,
        isActive: true,
      },
    });

    if (!workflow) {
      return { success: false, error: 'Workflow not found or inactive' };
    }

    // Check if there's already a pending request for this entity
    const existingRequest = await prisma.approvalRequest.findFirst({
      where: {
        entityType: data.entityType,
        entityId: data.entityId,
        status: ApprovalRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      return { success: false, error: 'There is already a pending approval request for this item' };
    }

    const request = await prisma.approvalRequest.create({
      data: {
        workflowId: data.workflowId,
        entityType: data.entityType,
        entityId: data.entityId,
        propertyId: data.propertyId,
        requestedById: session.user.id,
        status: ApprovalRequestStatus.PENDING,
        currentStepOrder: 1,
      },
    });

    revalidatePath(`/${businessUnitId}/property-movement/approvals`);
    return { success: true, requestId: request.id };
  } catch (error) {
    console.error('Error creating approval request:', error);
    return { success: false, error: 'Failed to create approval request' };
  }
}

// Process approval response
export async function processApprovalResponse(
  businessUnitId: string,
  data: ApprovalResponseFormData
): Promise<ProcessApprovalResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    return { success: false, error: 'Access denied to this business unit' };
  }

  try {
    // Get the approval request with workflow steps
    const request = await prisma.approvalRequest.findFirst({
      where: {
        id: data.approvalRequestId,
        property: { businessUnitId },
      },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!request) {
      return { success: false, error: 'Approval request not found' };
    }

    if (request.status !== ApprovalRequestStatus.PENDING) {
      return { success: false, error: 'Approval request is not pending' };
    }

    // Get the current step
    const currentStep = request.workflow.steps.find(
      step => step.stepOrder === request.currentStepOrder
    );

    if (!currentStep || currentStep.id !== data.stepId) {
      return { success: false, error: 'Invalid approval step' };
    }

    // Check if user has permission to approve this step
    const userAssignment = session.user.assignments?.find(
      assignment => assignment.businessUnitId === businessUnitId
    );

    if (!userAssignment) {
      return { success: false, error: 'User not assigned to this business unit' };
    }

    // Check role permission or override capability
    const canApprove = userAssignment.role.id === currentStep.roleId ||
      (data.isOverride && currentStep.canOverride && 
       userAssignment.role.level >= (currentStep.overrideMinLevel || 0));

    if (!canApprove) {
      return { success: false, error: 'Insufficient permissions to approve this step' };
    }

    // Create the response
    await prisma.approvalStepResponse.create({
      data: {
        approvalRequestId: data.approvalRequestId,
        stepId: data.stepId,
        respondedById: session.user.id,
        status: data.status,
        comments: data.comments,
        isOverride: data.isOverride || false,
      },
    });

    // Update the approval request based on the response
    let updateData: Prisma.ApprovalRequestUpdateInput = {};
    let isCompleted = false;
    let nextStep: number | undefined;

    if (data.status === ApprovalStatus.REJECTED) {
      // Request is rejected
      updateData = {
        status: ApprovalRequestStatus.REJECTED,
        completedAt: new Date(),
      };
      isCompleted = true;
    } else if (data.status === ApprovalStatus.APPROVED) {
      // Check if this is the last step
      const nextStepOrder = request.currentStepOrder + 1;
      const hasNextStep = request.workflow.steps.some(
        step => step.stepOrder === nextStepOrder
      );

      if (hasNextStep) {
        // Move to next step
        updateData = {
          currentStepOrder: nextStepOrder,
          status: ApprovalRequestStatus.IN_PROGRESS,
        };
        nextStep = nextStepOrder;
      } else {
        // All steps completed - approve the request
        updateData = {
          status: ApprovalRequestStatus.APPROVED,
          completedAt: new Date(),
        };
        isCompleted = true;
      }
    }

    // Handle override
    if (data.isOverride) {
      updateData.isOverridden = true;
      updateData.overriddenById = session.user.id;
      updateData.overriddenAt = new Date();
      updateData.status = ApprovalRequestStatus.OVERRIDDEN;
      updateData.completedAt = new Date();
      isCompleted = true;
    }

    await prisma.approvalRequest.update({
      where: { id: data.approvalRequestId },
      data: updateData,
    });

    revalidatePath(`/${businessUnitId}/property-movement/approvals`);
    revalidatePath(`/${businessUnitId}/property-movement/approvals/${data.approvalRequestId}`);

    return { 
      success: true, 
      nextStep,
      isCompleted 
    };
  } catch (error) {
    console.error('Error processing approval response:', error);
    return { success: false, error: 'Failed to process approval response' };
  }
}

// Get approval workflows
export async function getApprovalWorkflows(): Promise<ApprovalWorkflowWithSteps[]> {
  try {
    const workflows = await prisma.approvalWorkflow.findMany({
      where: { isActive: true },
      include: {
        steps: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
          orderBy: { stepOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return workflows as ApprovalWorkflowWithSteps[];
  } catch (error) {
    console.error('Error fetching approval workflows:', error);
    throw new Error('Failed to fetch approval workflows');
  }
}

// Get approval statistics
export async function getApprovalStats(businessUnitId: string): Promise<ApprovalStats> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  try {
    const [
      total,
      pending,
      approved,
      rejected,
      overridden,
      workflowStats,
    ] = await Promise.all([
      prisma.approvalRequest.count({
        where: { property: { businessUnitId } },
      }),
      prisma.approvalRequest.count({
        where: { 
          property: { businessUnitId },
          status: ApprovalRequestStatus.PENDING,
        },
      }),
      prisma.approvalRequest.count({
        where: { 
          property: { businessUnitId },
          status: ApprovalRequestStatus.APPROVED,
        },
      }),
      prisma.approvalRequest.count({
        where: { 
          property: { businessUnitId },
          status: ApprovalRequestStatus.REJECTED,
        },
      }),
      prisma.approvalRequest.count({
        where: { 
          property: { businessUnitId },
          status: ApprovalRequestStatus.OVERRIDDEN,
        },
      }),
      prisma.approvalRequest.groupBy({
        by: ['workflowId'],
        where: { property: { businessUnitId } },
        _count: { workflowId: true },
      }),
    ]);

    // Calculate average processing time
    const completedRequests = await prisma.approvalRequest.findMany({
      where: {
        property: { businessUnitId },
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    const avgProcessingTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, req) => {
          const processingTime = req.completedAt!.getTime() - req.createdAt.getTime();
          return sum + processingTime;
        }, 0) / completedRequests.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Get workflow names for stats
    const workflows = await prisma.approvalWorkflow.findMany({
      select: { id: true, name: true },
    });

    const byWorkflow: Record<string, number> = {};
    workflowStats.forEach(stat => {
      const workflow = workflows.find(w => w.id === stat.workflowId);
      if (workflow) {
        byWorkflow[workflow.name] = stat._count.workflowId;
      }
    });

    return {
      total,
      pending,
      approved,
      rejected,
      overridden,
      byWorkflow,
      avgProcessingTime,
    };
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    throw new Error('Failed to fetch approval statistics');
  }
}

// Cancel approval request
export async function cancelApprovalRequest(
  businessUnitId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    return { success: false, error: 'Access denied to this business unit' };
  }

  try {
    const request = await prisma.approvalRequest.findFirst({
      where: {
        id: requestId,
        property: { businessUnitId },
        requestedById: session.user.id, // Only requester can cancel
        status: { in: [ApprovalRequestStatus.PENDING, ApprovalRequestStatus.IN_PROGRESS] },
      },
    });

    if (!request) {
      return { success: false, error: 'Approval request not found or cannot be cancelled' };
    }

    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalRequestStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    revalidatePath(`/${businessUnitId}/property-movement/approvals`);
    return { success: true };
  } catch (error) {
    console.error('Error cancelling approval request:', error);
    return { success: false, error: 'Failed to cancel approval request' };
  }
}