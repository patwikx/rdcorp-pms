// lib/actions/approval-workflow-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import type {
  ApprovalWorkflowWithSteps,
  ApprovalWorkflowListItem,
  ApprovalWorkflowFormData,
  ApprovalWorkflowUpdateData,
  ApprovalWorkflowFilters,
  ApprovalWorkflowSort,
  ApprovalWorkflowStats,
  CreateApprovalWorkflowResult,
  UpdateApprovalWorkflowResult,
  ApprovalWorkflowActionResult,
  RoleSubset,
  ApprovalStepFormData
} from '@/types/approval-workflow-types';

// Get approval workflows with pagination and filtering
export async function getApprovalWorkflows(
  businessUnitId: string,
  page: number = 1,
  limit: number = 10,
  filters?: ApprovalWorkflowFilters,
  sort?: ApprovalWorkflowSort
): Promise<{
  workflows: ApprovalWorkflowListItem[];
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
  const where: Prisma.ApprovalWorkflowWhereInput = {
    ...(filters?.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { entityType: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
    ...(filters?.entityType && { entityType: filters.entityType }),
    ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters?.hasSteps !== undefined && {
      steps: filters.hasSteps ? { some: {} } : { none: {} },
    }),
    ...(filters?.dateFrom || filters?.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    },
  };

  // Build orderBy clause
  const orderBy: Prisma.ApprovalWorkflowOrderByWithRelationInput = sort
    ? { [sort.field]: sort.order }
    : { createdAt: 'desc' };

  try {
    const [workflows, totalCount] = await Promise.all([
      prisma.approvalWorkflow.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              steps: true,
              requests: true,
            },
          },
        },
      }),
      prisma.approvalWorkflow.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      workflows: workflows as ApprovalWorkflowListItem[],
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching approval workflows:', error);
    throw new Error('Failed to fetch approval workflows');
  }
}

// Get approval workflow by ID with full details
export async function getApprovalWorkflowById(
  businessUnitId: string,
  workflowId: string
): Promise<ApprovalWorkflowWithSteps | null> {
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
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                level: true,
              },
            },
          },
          orderBy: { stepOrder: 'asc' },
        },
        _count: {
          select: {
            steps: true,
            requests: true,
          },
        },
      },
    });

    return workflow as ApprovalWorkflowWithSteps | null;
  } catch (error) {
    console.error('Error fetching approval workflow:', error);
    throw new Error('Failed to fetch approval workflow details');
  }
}

// Create new approval workflow
export async function createApprovalWorkflow(
  businessUnitId: string,
  data: ApprovalWorkflowFormData
): Promise<CreateApprovalWorkflowResult> {
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

  // Validate workflow name uniqueness
  const existingWorkflow = await prisma.approvalWorkflow.findUnique({
    where: { name: data.name },
  });

  if (existingWorkflow) {
    return { success: false, error: 'A workflow with this name already exists' };
  }

  // Validate steps
  if (data.steps.length === 0) {
    return { success: false, error: 'At least one approval step is required' };
  }

  // Validate step order sequence
  const stepOrders = data.steps.map(step => step.stepOrder).sort((a, b) => a - b);
  for (let i = 0; i < stepOrders.length; i++) {
    if (stepOrders[i] !== i + 1) {
      return { success: false, error: 'Step orders must be sequential starting from 1' };
    }
  }

  // Validate role IDs exist
  const roleIds = data.steps.map(step => step.roleId);
  const existingRoles = await prisma.role.findMany({
    where: { id: { in: roleIds } },
    select: { id: true },
  });

  if (existingRoles.length !== roleIds.length) {
    return { success: false, error: 'One or more selected roles do not exist' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create the workflow
      const workflow = await tx.approvalWorkflow.create({
        data: {
          name: data.name,
          description: data.description,
          entityType: data.entityType,
          isActive: data.isActive,
        },
      });

      // Create the steps
      await tx.approvalStep.createMany({
        data: data.steps.map(step => ({
          workflowId: workflow.id,
          stepName: step.stepName,
          roleId: step.roleId,
          stepOrder: step.stepOrder,
          isRequired: step.isRequired,
          canOverride: step.canOverride,
          overrideMinLevel: step.overrideMinLevel,
        })),
      });

      return workflow;
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'ApprovalWorkflow',
        entityId: result.id,
        userId: session.user.id,
        newValues: {
          name: data.name,
          description: data.description,
          entityType: data.entityType,
          isActive: data.isActive,
          stepsCount: data.steps.length,
        },
      },
    });

    revalidatePath(`/${businessUnitId}/workflows`);
    return { success: true, workflowId: result.id };
  } catch (error) {
    console.error('Error creating approval workflow:', error);
    return { success: false, error: 'Failed to create approval workflow' };
  }
}

// Update approval workflow
export async function updateApprovalWorkflow(
  businessUnitId: string,
  workflowId: string,
  data: ApprovalWorkflowUpdateData
): Promise<UpdateApprovalWorkflowResult> {
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
    // Verify workflow exists
    const existingWorkflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!existingWorkflow) {
      return { success: false, error: 'Approval workflow not found' };
    }

    // Check name uniqueness if name is being changed
    if (data.name && data.name !== existingWorkflow.name) {
      const nameConflict = await prisma.approvalWorkflow.findUnique({
        where: { name: data.name },
      });

      if (nameConflict) {
        return { success: false, error: 'A workflow with this name already exists' };
      }
    }

    const updatedWorkflow = await prisma.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        steps: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                level: true,
              },
            },
          },
          orderBy: { stepOrder: 'asc' },
        },
        _count: {
          select: {
            steps: true,
            requests: true,
          },
        },
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'ApprovalWorkflow',
        entityId: workflowId,
        userId: session.user.id,
        oldValues: { ...existingWorkflow },
        newValues: { ...data },
      },
    });

    revalidatePath(`/${businessUnitId}/workflows`);
    revalidatePath(`/${businessUnitId}/workflows/${workflowId}`);
    return { success: true, workflow: updatedWorkflow as ApprovalWorkflowWithSteps };
  } catch (error) {
    console.error('Error updating approval workflow:', error);
    return { success: false, error: 'Failed to update approval workflow' };
  }
}

// Delete approval workflow
export async function deleteApprovalWorkflow(
  businessUnitId: string,
  workflowId: string
): Promise<ApprovalWorkflowActionResult> {
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
    // Verify workflow exists
    const existingWorkflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });

    if (!existingWorkflow) {
      return { success: false, error: 'Approval workflow not found' };
    }

    // Check if workflow has active approval requests
    if (existingWorkflow._count.requests > 0) {
      return { 
        success: false, 
        error: 'Cannot delete workflow with existing approval requests. Please deactivate instead.' 
      };
    }

    // Create audit log entry before deletion
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'ApprovalWorkflow',
        entityId: workflowId,
        userId: session.user.id,
        oldValues: { ...existingWorkflow },
      },
    });

    await prisma.approvalWorkflow.delete({
      where: { id: workflowId },
    });

    revalidatePath(`/${businessUnitId}/workflows`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting approval workflow:', error);
    return { success: false, error: 'Failed to delete approval workflow' };
  }
}

// Update approval workflow steps
export async function updateApprovalWorkflowSteps(
  businessUnitId: string,
  workflowId: string,
  steps: ApprovalStepFormData[]
): Promise<ApprovalWorkflowActionResult> {
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

  // Validate steps
  if (steps.length === 0) {
    return { success: false, error: 'At least one approval step is required' };
  }

  // Validate step order sequence
  const stepOrders = steps.map(step => step.stepOrder).sort((a, b) => a - b);
  for (let i = 0; i < stepOrders.length; i++) {
    if (stepOrders[i] !== i + 1) {
      return { success: false, error: 'Step orders must be sequential starting from 1' };
    }
  }

  // Validate role IDs exist
  const roleIds = steps.map(step => step.roleId);
  const existingRoles = await prisma.role.findMany({
    where: { id: { in: roleIds } },
    select: { id: true },
  });

  if (existingRoles.length !== roleIds.length) {
    return { success: false, error: 'One or more selected roles do not exist' };
  }

  try {
    // Verify workflow exists
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });

    if (!workflow) {
      return { success: false, error: 'Approval workflow not found' };
    }

    // Check if workflow has active approval requests
    const activeRequests = await prisma.approvalRequest.count({
      where: {
        workflowId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (activeRequests > 0) {
      return { 
        success: false, 
        error: 'Cannot modify steps while there are active approval requests using this workflow' 
      };
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing steps
      await tx.approvalStep.deleteMany({
        where: { workflowId },
      });

      // Create new steps
      await tx.approvalStep.createMany({
        data: steps.map(step => ({
          workflowId,
          stepName: step.stepName,
          roleId: step.roleId,
          stepOrder: step.stepOrder,
          isRequired: step.isRequired,
          canOverride: step.canOverride,
          overrideMinLevel: step.overrideMinLevel,
        })),
      });

      // Update workflow timestamp
      await tx.approvalWorkflow.update({
        where: { id: workflowId },
        data: { updatedAt: new Date() },
      });
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'ApprovalWorkflowSteps',
        entityId: workflowId,
        userId: session.user.id,
        newValues: {
          stepsCount: steps.length,
          steps: steps.map(step => ({
            stepName: step.stepName,
            roleId: step.roleId,
            stepOrder: step.stepOrder,
          })),
        },
      },
    });

    revalidatePath(`/${businessUnitId}/workflows`);
    revalidatePath(`/${businessUnitId}/workflows/${workflowId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating approval workflow steps:', error);
    return { success: false, error: 'Failed to update approval workflow steps' };
  }
}

// Toggle workflow active status
export async function toggleApprovalWorkflowStatus(
  businessUnitId: string,
  workflowId: string
): Promise<ApprovalWorkflowActionResult> {
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
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return { success: false, error: 'Approval workflow not found' };
    }

    const newStatus = !workflow.isActive;

    await prisma.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        isActive: newStatus,
        updatedAt: new Date(),
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'ApprovalWorkflow',
        entityId: workflowId,
        userId: session.user.id,
        oldValues: { isActive: workflow.isActive },
        newValues: { isActive: newStatus },
      },
    });

    revalidatePath(`/${businessUnitId}/workflows`);
    revalidatePath(`/${businessUnitId}/workflows/${workflowId}`);
    return { success: true };
  } catch (error) {
    console.error('Error toggling approval workflow status:', error);
    return { success: false, error: 'Failed to update workflow status' };
  }
}

// Get approval workflow statistics
export async function getApprovalWorkflowStats(businessUnitId: string): Promise<ApprovalWorkflowStats> {
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
      active,
      inactive,
      entityTypeStats,
      totalSteps,
      recentCount,
    ] = await Promise.all([
      // Total workflows
      prisma.approvalWorkflow.count(),
      
      // Active workflows
      prisma.approvalWorkflow.count({
        where: { isActive: true },
      }),
      
      // Inactive workflows
      prisma.approvalWorkflow.count({
        where: { isActive: false },
      }),
      
      // Workflows by entity type
      prisma.approvalWorkflow.groupBy({
        by: ['entityType'],
        _count: { entityType: true },
      }),
      
      // Total steps across all workflows
      prisma.approvalStep.count(),
      
      // Recently created (last 30 days)
      prisma.approvalWorkflow.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const byEntityType: Record<string, number> = {};
    entityTypeStats.forEach(stat => {
      byEntityType[stat.entityType] = stat._count.entityType;
    });

    const avgStepsPerWorkflow = total > 0 ? totalSteps / total : 0;

    return {
      total,
      active,
      inactive,
      byEntityType,
      totalSteps,
      avgStepsPerWorkflow,
      recentlyCreated: recentCount,
    };
  } catch (error) {
    console.error('Error fetching approval workflow stats:', error);
    throw new Error('Failed to fetch approval workflow statistics');
  }
}

// Get available roles for workflow steps
export async function getAvailableRoles(): Promise<RoleSubset[]> {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
      },
      orderBy: [{ level: 'desc' }, { name: 'asc' }],
    });

    return roles;
  } catch (error) {
    console.error('Error fetching available roles:', error);
    throw new Error('Failed to fetch available roles');
  }
}

// Get workflow filter options
export async function getApprovalWorkflowFilterOptions(): Promise<{
  entityTypes: Array<{ value: string; label: string; count: number }>;
}> {
  try {
    const entityTypeStats = await prisma.approvalWorkflow.groupBy({
      by: ['entityType'],
      _count: { entityType: true },
    });

    const entityTypes = entityTypeStats.map(stat => ({
      value: stat.entityType,
      label: stat.entityType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      count: stat._count.entityType,
    }));

    return { entityTypes };
  } catch (error) {
    console.error('Error fetching workflow filter options:', error);
    throw new Error('Failed to fetch filter options');
  }
}

// Duplicate approval workflow
export async function duplicateApprovalWorkflow(
  businessUnitId: string,
  workflowId: string,
  newName: string
): Promise<CreateApprovalWorkflowResult> {
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
    // Get the original workflow with steps
    const originalWorkflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!originalWorkflow) {
      return { success: false, error: 'Original workflow not found' };
    }

    // Check name uniqueness
    const existingWorkflow = await prisma.approvalWorkflow.findUnique({
      where: { name: newName },
    });

    if (existingWorkflow) {
      return { success: false, error: 'A workflow with this name already exists' };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create the new workflow
      const newWorkflow = await tx.approvalWorkflow.create({
        data: {
          name: newName,
          description: `Copy of ${originalWorkflow.name}`,
          entityType: originalWorkflow.entityType,
          isActive: false, // Start as inactive
        },
      });

      // Create the steps
      if (originalWorkflow.steps.length > 0) {
        await tx.approvalStep.createMany({
          data: originalWorkflow.steps.map(step => ({
            workflowId: newWorkflow.id,
            stepName: step.stepName,
            roleId: step.roleId,
            stepOrder: step.stepOrder,
            isRequired: step.isRequired,
            canOverride: step.canOverride,
            overrideMinLevel: step.overrideMinLevel,
          })),
        });
      }

      return newWorkflow;
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'ApprovalWorkflow',
        entityId: result.id,
        userId: session.user.id,
        newValues: {
          name: newName,
          duplicatedFrom: workflowId,
          originalName: originalWorkflow.name,
        },
      },
    });

    revalidatePath(`/${businessUnitId}/workflows`);
    return { success: true, workflowId: result.id };
  } catch (error) {
    console.error('Error duplicating approval workflow:', error);
    return { success: false, error: 'Failed to duplicate approval workflow' };
  }
}