// lib/actions/return-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { 
  ReturnType, 
  TransactionStatus, 
  PropertyStatus,
  PropertyLocation,
  MovementType,
  Prisma, 
  ApprovalRequestStatus
} from '@prisma/client';
import type {
  PropertyReturnWithDetails,
  PropertyReturnListItem,
  PropertyReturnFormData,
  PropertyReturnUpdateData,
  PropertyReturnFilters,
  PropertyReturnSort,
  ReturnStats,
  CreateReturnResult,
  UpdateReturnResult,
  ReturnSourceOption
} from '@/types/return-types';

// Get property returns with pagination and filtering
export async function getPropertyReturns(
  businessUnitId: string,
  page: number = 1,
  limit: number = 10,
  filters?: PropertyReturnFilters,
  sort?: PropertyReturnSort
): Promise<{
  returns: PropertyReturnListItem[];
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
  const where: Prisma.PropertyReturnWhereInput = {
    property: { businessUnitId },
    ...(filters?.search && {
      OR: [
        { property: { titleNumber: { contains: filters.search, mode: 'insensitive' } } },
        { property: { propertyName: { contains: filters.search, mode: 'insensitive' } } },
        { property: { location: { contains: filters.search, mode: 'insensitive' } } },
        { reasonForReturn: { contains: filters.search, mode: 'insensitive' } },
        { returnedByName: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.returnType && { returnType: filters.returnType }),
    ...(filters?.propertyId && { propertyId: filters.propertyId }),
    ...(filters?.businessUnitId && { businessUnitId: filters.businessUnitId }),
    ...(filters?.returnedById && { returnedById: filters.returnedById }),
    ...(filters?.dateFrom || filters?.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    },
  };

  // Build orderBy clause
  const orderBy: Prisma.PropertyReturnOrderByWithRelationInput = sort
    ? { [sort.field]: sort.order }
    : { createdAt: 'desc' };

  try {
    const [returns, totalCount] = await Promise.all([
      prisma.propertyReturn.findMany({
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
          businessUnit: {
            select: {
              id: true,
              name: true,
            },
          },
          returnedBy: {
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
      prisma.propertyReturn.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      returns: returns as PropertyReturnListItem[],
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching property returns:', error);
    throw new Error('Failed to fetch property returns');
  }
}

// Create new property return with approval workflow
export async function createPropertyReturn(
  businessUnitId: string,
  data: PropertyReturnFormData
): Promise<CreateReturnResult> {
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
    // Verify property belongs to business unit and is available for return
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        businessUnitId,
        status: { in: [PropertyStatus.RELEASED, PropertyStatus.BANK_CUSTODY] },
      },
    });

    if (!property) {
      return { success: false, error: 'Property not found or not available for return' };
    }

    // Check if property is already in return process
    const existingReturn = await prisma.propertyReturn.findFirst({
      where: {
        propertyId: data.propertyId,
        status: { in: [TransactionStatus.PENDING, TransactionStatus.APPROVED, TransactionStatus.IN_PROGRESS] },
      },
    });

    if (existingReturn) {
      return { success: false, error: 'Property is already in return process or has a pending return' };
    }

    // Validate business unit reference if provided
    if (data.businessUnitId) {
      const sourceBusinessUnit = await prisma.businessUnit.findFirst({
        where: { 
          id: data.businessUnitId,
          isActive: true 
        },
      });
      
      if (!sourceBusinessUnit) {
        return { success: false, error: 'Source business unit not found or inactive' };
      }
    }

    // Find the appropriate approval workflow for property returns
    const workflow = await prisma.approvalWorkflow.findFirst({
      where: {
        entityType: 'PROPERTY_RETURN',
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
      return { success: false, error: 'No approval workflow found for property returns. Please contact your administrator.' };
    }

    if (workflow.steps.length === 0) {
      return { success: false, error: 'Approval workflow has no steps configured. Please contact your administrator.' };
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the property return with PENDING status
      const propertyReturn = await tx.propertyReturn.create({
        data: {
          propertyId: data.propertyId,
          returnType: data.returnType,
          businessUnitId: data.businessUnitId,
          returnedByName: data.returnedByName,
          reasonForReturn: data.reasonForReturn,
          condition: data.condition,
          notes: data.notes,
          status: TransactionStatus.PENDING,
          returnedById: session.user.id,
        },
      });

      // Create the approval request
      const approvalRequest = await tx.approvalRequest.create({
        data: {
          workflowId: workflow.id,
          entityType: 'PROPERTY_RETURN',
          entityId: propertyReturn.id,
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
          movementType: data.returnType === ReturnType.FROM_BANK 
            ? MovementType.RETURN_FROM_BANK 
            : MovementType.RETURN_FROM_SUBSIDIARY,
          fromLocation: data.returnType === ReturnType.FROM_BANK 
            ? PropertyLocation.BANK_CUSTODY 
            : PropertyLocation.SUBSIDIARY_COMPANY,
          toLocation: PropertyLocation.MAIN_OFFICE,
          toCustodian: session.user.id,
          businessUnitId: data.businessUnitId,
          referenceId: propertyReturn.id,
          referenceType: 'RETURN',
          movementDate: new Date(),
          notes: `Property return request created - awaiting approval. ${data.notes || ''}`.trim(),
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'PropertyReturn',
          entityId: propertyReturn.id,
          propertyId: data.propertyId,
          userId: session.user.id,
          newValues: {
            returnType: data.returnType,
            businessUnitId: data.businessUnitId,
            reasonForReturn: data.reasonForReturn,
            status: 'PENDING_APPROVAL',
            approvalRequestId: approvalRequest.id,
          },
        },
      });

      return {
        returnId: propertyReturn.id,
        approvalRequestId: approvalRequest.id,
        workflowSteps: workflow.steps.length,
        nextApprover: workflow.steps[0].role.name,
      };
    });

    // Revalidate paths after successful creation
    revalidatePath(`/${businessUnitId}/property-movement/returns`);
    revalidatePath(`/${businessUnitId}/properties`);

    return { 
      success: true, 
      returnId: result.returnId,
    };

  } catch (error) {
    console.error('Error creating property return:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('P2003')) {
        return { success: false, error: 'Invalid reference to business unit. Please check your selection.' };
      }
      if (error.message.includes('P2002')) {
        return { success: false, error: 'A return request for this property already exists.' };
      }
    }
    
    return { success: false, error: 'Failed to create property return request' };
  }
}

// Approve property return
export async function approvePropertyReturn(
  businessUnitId: string,
  returnId: string
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
    const propertyReturn = await prisma.propertyReturn.findFirst({
      where: {
        id: returnId,
        property: { businessUnitId },
        status: TransactionStatus.PENDING,
      },
    });

    if (!propertyReturn) {
      return { success: false, error: 'Property return not found or not pending' };
    }

    await prisma.propertyReturn.update({
      where: { id: returnId },
      data: {
        status: TransactionStatus.APPROVED,
        approvedById: session.user.id,
        dateReturned: new Date(),
      },
    });

    revalidatePath(`/${businessUnitId}/property-movement/returns`);
    return { success: true };
  } catch (error) {
    console.error('Error approving property return:', error);
    return { success: false, error: 'Failed to approve property return' };
  }
}

// Complete property return (mark as received)
export async function completePropertyReturn(
  businessUnitId: string,
  returnId: string,
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
    const propertyReturn = await prisma.propertyReturn.findFirst({
      where: {
        id: returnId,
        property: { businessUnitId },
        status: TransactionStatus.APPROVED,
      },
    });

    if (!propertyReturn) {
      return { success: false, error: 'Property return not found or not approved' };
    }

    await prisma.$transaction(async (tx) => {
      // Complete the return
      await tx.propertyReturn.update({
        where: { id: returnId },
        data: {
          status: TransactionStatus.COMPLETED,
          receivedById: receivedById || session.user.id,
        },
      });

      // Update property status back to ACTIVE and location to MAIN_OFFICE
      await tx.property.update({
        where: { id: propertyReturn.propertyId },
        data: {
          status: PropertyStatus.ACTIVE,
          currentLocation: PropertyLocation.MAIN_OFFICE,
        },
      });
    });

    revalidatePath(`/${businessUnitId}/property-movement/returns`);
    revalidatePath(`/${businessUnitId}/properties`);
    return { success: true };
  } catch (error) {
    console.error('Error completing property return:', error);
    return { success: false, error: 'Failed to complete property return' };
  }
}

// Cancel property return
export async function cancelPropertyReturn(
  businessUnitId: string,
  returnId: string
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
    const propertyReturn = await prisma.propertyReturn.findFirst({
      where: {
        id: returnId,
        property: { businessUnitId },
        status: { in: [TransactionStatus.PENDING, TransactionStatus.APPROVED] },
      },
      include: {
        property: true,
      },
    });

    if (!propertyReturn) {
      return { success: false, error: 'Property return not found or cannot be cancelled' };
    }

    await prisma.propertyReturn.update({
      where: { id: returnId },
      data: {
        status: TransactionStatus.CANCELLED,
      },
    });

    revalidatePath(`/${businessUnitId}/property-movement/returns`);
    return { success: true };
  } catch (error) {
    console.error('Error cancelling property return:', error);
    return { success: false, error: 'Failed to cancel property return' };
  }
}

// Get return statistics
export async function getReturnStats(businessUnitId: string): Promise<ReturnStats> {
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
      prisma.propertyReturn.count({
        where: { property: { businessUnitId } },
      }),
      prisma.propertyReturn.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.PENDING,
        },
      }),
      prisma.propertyReturn.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.APPROVED,
        },
      }),
      prisma.propertyReturn.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.IN_PROGRESS,
        },
      }),
      prisma.propertyReturn.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.COMPLETED,
        },
      }),
      prisma.propertyReturn.groupBy({
        by: ['returnType'],
        where: { property: { businessUnitId } },
        _count: { returnType: true },
      }),
    ]);

    const byType: Record<ReturnType, number> = {
      FROM_SUBSIDIARY: 0,
      FROM_BANK: 0,
      FROM_EXTERNAL: 0,
    };

    typeStats.forEach(stat => {
      byType[stat.returnType] = stat._count.returnType;
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
    console.error('Error fetching return stats:', error);
    throw new Error('Failed to fetch return statistics');
  }
}

// Get return source options
export async function getReturnSourceOptions(): Promise<ReturnSourceOption[]> {
  try {
    const [businessUnits, banks] = await Promise.all([
      prisma.businessUnit.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.bank.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          branchName: true,
          address: true,
        },
        orderBy: [{ name: 'asc' }, { branchName: 'asc' }],
      }),
    ]);

    const options: ReturnSourceOption[] = [
      ...businessUnits.map(unit => ({
        id: unit.id,
        name: unit.name,
        type: 'BUSINESS_UNIT' as const,
        details: unit.description || undefined,
      })),
      ...banks.map(bank => ({
        id: bank.id,
        name: `${bank.name} - ${bank.branchName}`,
        type: 'BANK' as const,
        details: bank.address || undefined,
      })),
    ];

    return options;
  } catch (error) {
    console.error('Error fetching return source options:', error);
    throw new Error('Failed to fetch return source options');
  }
}