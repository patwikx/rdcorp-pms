// lib/actions/turnover-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { 
  TurnoverType, 
  TransactionStatus, 
  PropertyStatus,
  PropertyLocation,
  MovementType,
  Prisma, 
  ApprovalRequestStatus
} from '@prisma/client';
import type {
  PropertyTurnoverWithDetails,
  PropertyTurnoverListItem,
  PropertyTurnoverFormData,
  PropertyTurnoverUpdateData,
  PropertyTurnoverFilters,
  PropertyTurnoverSort,
  TurnoverStats,
  CreateTurnoverResult,
  UpdateTurnoverResult,
  TurnoverDestinationOption
} from '@/types/turnover-types';

// Get property turnovers with pagination and filtering
export async function getPropertyTurnovers(
  businessUnitId: string,
  page: number = 1,
  limit: number = 10,
  filters?: PropertyTurnoverFilters,
  sort?: PropertyTurnoverSort
): Promise<{
  turnovers: PropertyTurnoverListItem[];
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
  const where: Prisma.PropertyTurnoverWhereInput = {
    property: { businessUnitId },
    ...(filters?.search && {
      OR: [
        { property: { titleNumber: { contains: filters.search, mode: 'insensitive' } } },
        { property: { propertyName: { contains: filters.search, mode: 'insensitive' } } },
        { property: { location: { contains: filters.search, mode: 'insensitive' } } },
        { purpose: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.turnoverType && { turnoverType: filters.turnoverType }),
    ...(filters?.propertyId && { propertyId: filters.propertyId }),
    ...(filters?.fromBusinessUnitId && { fromBusinessUnitId: filters.fromBusinessUnitId }),
    ...(filters?.toBusinessUnitId && { toBusinessUnitId: filters.toBusinessUnitId }),
    ...(filters?.turnedOverById && { turnedOverById: filters.turnedOverById }),
    ...(filters?.dateFrom || filters?.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    },
  };

  // Build orderBy clause
  const orderBy: Prisma.PropertyTurnoverOrderByWithRelationInput = sort
    ? { [sort.field]: sort.order }
    : { createdAt: 'desc' };

  try {
    const [turnovers, totalCount] = await Promise.all([
      prisma.propertyTurnover.findMany({
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
              status: true,
            },
          },
          fromBusinessUnit: {
            select: {
              id: true,
              name: true,
            },
          },
          toBusinessUnit: {
            select: {
              id: true,
              name: true,
            },
          },
          turnedOverBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
      }),
      prisma.propertyTurnover.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      turnovers: turnovers as PropertyTurnoverListItem[],
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching property turnovers:', error);
    throw new Error('Failed to fetch property turnovers');
  }
}

// Create new property turnover with approval workflow
export async function createPropertyTurnover(
  businessUnitId: string,
  data: PropertyTurnoverFormData
): Promise<CreateTurnoverResult> {
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
    // Verify property belongs to business unit and is available for turnover
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        businessUnitId,
        status: { in: [PropertyStatus.ACTIVE, PropertyStatus.PENDING] },
      },
    });

    if (!property) {
      return { success: false, error: 'Property not found or not available for turnover' };
    }

    // Check if property is already in turnover process
    const existingTurnover = await prisma.propertyTurnover.findFirst({
      where: {
        propertyId: data.propertyId,
        status: { in: [TransactionStatus.PENDING, TransactionStatus.APPROVED, TransactionStatus.IN_PROGRESS] },
      },
    });

    if (existingTurnover) {
      return { success: false, error: 'Property is already in turnover process or has a pending turnover' };
    }

    // Validate business unit references
    if (data.fromBusinessUnitId) {
      const fromBusinessUnit = await prisma.businessUnit.findFirst({
        where: { 
          id: data.fromBusinessUnitId,
          isActive: true 
        },
      });
      
      if (!fromBusinessUnit) {
        return { success: false, error: 'Source business unit not found or inactive' };
      }
    }

    if (data.toBusinessUnitId) {
      const toBusinessUnit = await prisma.businessUnit.findFirst({
        where: { 
          id: data.toBusinessUnitId,
          isActive: true 
        },
      });
      
      if (!toBusinessUnit) {
        return { success: false, error: 'Target business unit not found or inactive' };
      }
    }

    // Find the appropriate approval workflow for property turnovers
    const workflow = await prisma.approvalWorkflow.findFirst({
      where: {
        entityType: 'PROPERTY_TURNOVER',
        isActive: true,
      },
      include: {
        steps: {
          include: { 
            role: true 
          },
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!workflow) {
      return { success: false, error: 'No approval workflow found for property turnovers. Please contact your administrator.' };
    }

    if (workflow.steps.length === 0) {
      return { success: false, error: 'Approval workflow has no steps configured. Please contact your administrator.' };
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the property turnover with PENDING status
      const turnover = await tx.propertyTurnover.create({
        data: {
          propertyId: data.propertyId,
          turnoverType: data.turnoverType,
          fromBusinessUnitId: data.fromBusinessUnitId,
          toBusinessUnitId: data.toBusinessUnitId,
          purpose: data.purpose,
          notes: data.notes,
          status: TransactionStatus.PENDING,
          turnedOverById: session.user.id,
        },
      });

      // Create the approval request
      const approvalRequest = await tx.approvalRequest.create({
        data: {
          workflowId: workflow.id,
          entityType: 'PROPERTY_TURNOVER',
          entityId: turnover.id,
          propertyId: data.propertyId,
          requestedById: session.user.id,
          currentStepOrder: 1,
          status: ApprovalRequestStatus.PENDING,
        },
      });

      // Update property status to UNDER_REVIEW
      await tx.property.update({
        where: { id: data.propertyId },
        data: {
          status: PropertyStatus.UNDER_REVIEW,
        },
      });

      // Create property movement record
      await tx.propertyMovement.create({
        data: {
          propertyId: data.propertyId,
          movementType: MovementType.TURNOVER_INTERNAL,
          fromLocation: PropertyLocation.MAIN_OFFICE,
          toLocation: PropertyLocation.SUBSIDIARY_COMPANY,
          fromCustodian: session.user.id,
          businessUnitId: data.toBusinessUnitId,
          referenceId: turnover.id,
          referenceType: 'TURNOVER',
          movementDate: new Date(),
          notes: `Property turnover request created - awaiting approval. ${data.notes || ''}`.trim(),
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'PropertyTurnover',
          entityId: turnover.id,
          propertyId: data.propertyId,
          userId: session.user.id,
          newValues: {
            turnoverType: data.turnoverType,
            fromBusinessUnitId: data.fromBusinessUnitId,
            toBusinessUnitId: data.toBusinessUnitId,
            purpose: data.purpose,
            status: 'PENDING_APPROVAL',
            approvalRequestId: approvalRequest.id,
          },
        },
      });

      return {
        turnoverId: turnover.id,
        approvalRequestId: approvalRequest.id,
        workflowSteps: workflow.steps.length,
        nextApprover: workflow.steps[0].role.name,
      };
    });

    // Revalidate paths after successful creation
    revalidatePath(`/${businessUnitId}/property-movement/turnovers`);
    revalidatePath(`/${businessUnitId}/properties`);

    return { 
      success: true, 
      turnoverId: result.turnoverId,
    };

  } catch (error) {
    console.error('Error creating property turnover:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('P2003')) {
        return { success: false, error: 'Invalid reference to business unit. Please check your selection.' };
      }
      if (error.message.includes('P2002')) {
        return { success: false, error: 'A turnover request for this property already exists.' };
      }
    }
    
    return { success: false, error: 'Failed to create property turnover request' };
  }
}

// Approve property turnover
export async function approvePropertyTurnover(
  businessUnitId: string,
  turnoverId: string
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
    const turnover = await prisma.propertyTurnover.findFirst({
      where: {
        id: turnoverId,
        property: { businessUnitId },
        status: TransactionStatus.PENDING,
      },
    });

    if (!turnover) {
      return { success: false, error: 'Property turnover not found or not pending' };
    }

    await prisma.propertyTurnover.update({
      where: { id: turnoverId },
      data: {
        status: TransactionStatus.APPROVED,
        approvedById: session.user.id,
        turnedOverDate: new Date(),
      },
    });

    revalidatePath(`/${businessUnitId}/property-movement/turnovers`);
    return { success: true };
  } catch (error) {
    console.error('Error approving property turnover:', error);
    return { success: false, error: 'Failed to approve property turnover' };
  }
}

// Complete property turnover (mark as received)
export async function completePropertyTurnover(
  businessUnitId: string,
  turnoverId: string,
  receivedById?: string
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
    const turnover = await prisma.propertyTurnover.findFirst({
      where: {
        id: turnoverId,
        property: { businessUnitId },
        status: TransactionStatus.APPROVED,
      },
    });

    if (!turnover) {
      return { success: false, error: 'Property turnover not found or not approved' };
    }

    await prisma.propertyTurnover.update({
      where: { id: turnoverId },
      data: {
        status: TransactionStatus.COMPLETED,
        receivedById: receivedById || session.user.id,
      },
    });

    revalidatePath(`/${businessUnitId}/property-movement/turnovers`);
    return { success: true };
  } catch (error) {
    console.error('Error completing property turnover:', error);
    return { success: false, error: 'Failed to complete property turnover' };
  }
}

// Cancel property turnover
export async function cancelPropertyTurnover(
  businessUnitId: string,
  turnoverId: string
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
    const turnover = await prisma.propertyTurnover.findFirst({
      where: {
        id: turnoverId,
        property: { businessUnitId },
        status: { in: [TransactionStatus.PENDING, TransactionStatus.APPROVED] },
      },
      include: {
        property: true,
      },
    });

    if (!turnover) {
      return { success: false, error: 'Property turnover not found or cannot be cancelled' };
    }

    await prisma.$transaction(async (tx) => {
      // Cancel the turnover
      await tx.propertyTurnover.update({
        where: { id: turnoverId },
        data: {
          status: TransactionStatus.CANCELLED,
        },
      });

      // Revert property status
      await tx.property.update({
        where: { id: turnover.propertyId },
        data: {
          status: PropertyStatus.ACTIVE,
          currentLocation: PropertyLocation.MAIN_OFFICE,
        },
      });
    });

    revalidatePath(`/${businessUnitId}/property-movement/turnovers`);
    revalidatePath(`/${businessUnitId}/properties`);
    return { success: true };
  } catch (error) {
    console.error('Error cancelling property turnover:', error);
    return { success: false, error: 'Failed to cancel property turnover' };
  }
}

// Get turnover statistics
export async function getTurnoverStats(businessUnitId: string): Promise<TurnoverStats> {
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
      inProgress,
      completed,
      typeStats,
    ] = await Promise.all([
      prisma.propertyTurnover.count({
        where: { property: { businessUnitId } },
      }),
      prisma.propertyTurnover.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.PENDING,
        },
      }),
      prisma.propertyTurnover.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.APPROVED,
        },
      }),
      prisma.propertyTurnover.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.IN_PROGRESS,
        },
      }),
      prisma.propertyTurnover.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.COMPLETED,
        },
      }),
      prisma.propertyTurnover.groupBy({
        by: ['turnoverType'],
        where: { property: { businessUnitId } },
        _count: { turnoverType: true },
      }),
    ]);

    const byType: Record<TurnoverType, number> = {
      INTERNAL_DEPARTMENT: 0,
      BETWEEN_SUBSIDIARIES: 0,
      CUSTODY_TRANSFER: 0,
    };

    typeStats.forEach(stat => {
      byType[stat.turnoverType] = stat._count.turnoverType;
    });

    return {
      total,
      pending,
      approved,
      inProgress,
      completed,
      byType,
    };
  } catch (error) {
    console.error('Error fetching turnover stats:', error);
    throw new Error('Failed to fetch turnover statistics');
  }
}

// Get turnover destination options
export async function getTurnoverDestinationOptions(): Promise<TurnoverDestinationOption[]> {
  try {
    const businessUnits = await prisma.businessUnit.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    const options: TurnoverDestinationOption[] = businessUnits.map(unit => ({
      id: unit.id,
      name: unit.name,
      type: 'BUSINESS_UNIT' as const,
      details: unit.description || undefined,
    }));

    return options;
  } catch (error) {
    console.error('Error fetching turnover destination options:', error);
    throw new Error('Failed to fetch turnover destination options');
  }
}