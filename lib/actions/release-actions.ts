// lib/actions/release-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { 
  ReleaseType, 
  TransactionStatus, 
  PropertyStatus,
  PropertyLocation,
  MovementType,
  Prisma, 
  ApprovalRequestStatus
} from '@prisma/client';
import type {
  PropertyReleaseWithDetails,
  PropertyReleaseListItem,
  PropertyReleaseFormData,
  PropertyReleaseUpdateData,
  PropertyReleaseFilters,
  PropertyReleaseSort,
  ReleaseStats,
  CreateReleaseResult,
  UpdateReleaseResult,
  ReleaseDestinationOption
} from '@/types/release-types';

// Get property releases with pagination and filtering
export async function getPropertyReleases(
  businessUnitId: string,
  page: number = 1,
  limit: number = 10,
  filters?: PropertyReleaseFilters,
  sort?: PropertyReleaseSort
): Promise<{
  releases: PropertyReleaseListItem[];
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
  const where: Prisma.PropertyReleaseWhereInput = {
    property: { businessUnitId },
    ...(filters?.search && {
      OR: [
        { property: { titleNumber: { contains: filters.search, mode: 'insensitive' } } },
        { property: { propertyName: { contains: filters.search, mode: 'insensitive' } } },
        { property: { location: { contains: filters.search, mode: 'insensitive' } } },
        { purposeOfRelease: { contains: filters.search, mode: 'insensitive' } },
        { transmittalNumber: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.releaseType && { releaseType: filters.releaseType }),
    ...(filters?.propertyId && { propertyId: filters.propertyId }),
    ...(filters?.businessUnitId && { businessUnitId: filters.businessUnitId }),
    ...(filters?.bankId && { bankId: filters.bankId }),
    ...(filters?.releasedById && { releasedById: filters.releasedById }),
    ...(filters?.dateFrom || filters?.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    },
    ...(filters?.expectedReturnFrom || filters?.expectedReturnTo) && {
      expectedReturnDate: {
        ...(filters.expectedReturnFrom && { gte: filters.expectedReturnFrom }),
        ...(filters.expectedReturnTo && { lte: filters.expectedReturnTo }),
      },
    },
  };

  // Build orderBy clause
  const orderBy: Prisma.PropertyReleaseOrderByWithRelationInput = sort
    ? { [sort.field]: sort.order }
    : { createdAt: 'desc' };

  try {
    const [releases, totalCount] = await Promise.all([
      prisma.propertyRelease.findMany({
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
          bank: {
            select: {
              id: true,
              name: true,
              branchName: true,
            },
          },
          releasedBy: {
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
      prisma.propertyRelease.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      releases: releases as PropertyReleaseListItem[],
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching property releases:', error);
    throw new Error('Failed to fetch property releases');
  }
}

// Get property release by ID with full details
export async function getPropertyReleaseById(
  businessUnitId: string,
  releaseId: string
): Promise<PropertyReleaseWithDetails | null> {
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
    const release = await prisma.propertyRelease.findFirst({
      where: {
        id: releaseId,
        property: { businessUnitId },
      },
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
        bank: {
          select: {
            id: true,
            name: true,
            branchName: true,
          },
        },
        releasedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return release as PropertyReleaseWithDetails | null;
  } catch (error) {
    console.error('Error fetching property release:', error);
    throw new Error('Failed to fetch property release details');
  }
}

// Create new property release with approval workflow
export async function createPropertyRelease(
  businessUnitId: string,
  data: PropertyReleaseFormData
): Promise<CreateReleaseResult> {
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
    // Verify property belongs to business unit and is available for release
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        businessUnitId,
        status: { in: [PropertyStatus.ACTIVE, PropertyStatus.PENDING] },
      },
    });

    if (!property) {
      return { success: false, error: 'Property not found or not available for release' };
    }

    // Check if property is already released and not returned
    const existingRelease = await prisma.propertyRelease.findFirst({
      where: {
        propertyId: data.propertyId,
        status: { in: [TransactionStatus.PENDING, TransactionStatus.APPROVED, TransactionStatus.IN_PROGRESS] },
      },
    });

    if (existingRelease) {
      return { success: false, error: 'Property is already released or has a pending release' };
    }

    // Validate and verify foreign key references
    if (data.releaseType === ReleaseType.TO_SUBSIDIARY) {
      if (!data.businessUnitId) {
        return { success: false, error: 'Business unit is required for subsidiary release' };
      }
      
      const targetBusinessUnit = await prisma.businessUnit.findFirst({
        where: { 
          id: data.businessUnitId,
          isActive: true 
        },
      });
      
      if (!targetBusinessUnit) {
        return { success: false, error: 'Selected business unit not found or inactive' };
      }
    }

    if (data.releaseType === ReleaseType.TO_BANK) {
      if (!data.bankId) {
        return { success: false, error: 'Bank is required for bank release' };
      }
      
      const targetBank = await prisma.bank.findFirst({
        where: { 
          id: data.bankId,
          isActive: true 
        },
      });
      
      if (!targetBank) {
        return { success: false, error: 'Selected bank not found or inactive' };
      }
    }

    // Find the appropriate approval workflow for property releases
    const workflow = await prisma.approvalWorkflow.findFirst({
      where: {
        entityType: 'PROPERTY_RELEASE',
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
      return { success: false, error: 'No approval workflow found for property releases. Please contact your administrator.' };
    }

    if (workflow.steps.length === 0) {
      return { success: false, error: 'Approval workflow has no steps configured. Please contact your administrator.' };
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the property release with PENDING status
      const release = await tx.propertyRelease.create({
        data: {
          propertyId: data.propertyId,
          releaseType: data.releaseType,
          businessUnitId: data.releaseType === ReleaseType.TO_SUBSIDIARY ? data.businessUnitId : null,
          bankId: data.releaseType === ReleaseType.TO_BANK ? data.bankId : null,
          expectedReturnDate: data.expectedReturnDate,
          purposeOfRelease: data.purposeOfRelease,
          receivedByName: data.receivedByName,
          transmittalNumber: data.transmittalNumber,
          notes: data.notes,
          status: TransactionStatus.PENDING, // Keep as PENDING until approved
          releasedById: session.user.id,
        },
      });

      // Create the approval request
      const approvalRequest = await tx.approvalRequest.create({
        data: {
          workflowId: workflow.id,
          entityType: 'PROPERTY_RELEASE',
          entityId: release.id,
          propertyId: data.propertyId,
          requestedById: session.user.id,
          currentStepOrder: 1,
          status: ApprovalRequestStatus.PENDING,
        },
      });

      // Update the release with the approval request ID
      await tx.propertyRelease.update({
        where: { id: release.id },
        data: { approvalRequestId: approvalRequest.id },
      });

      // Update property status to UNDER_REVIEW instead of RELEASED
      await tx.property.update({
        where: { id: data.propertyId },
        data: {
          status: PropertyStatus.UNDER_REVIEW, // More appropriate status for pending approval
        },
      });

      // Create property movement record
      await tx.propertyMovement.create({
        data: {
          propertyId: data.propertyId,
          movementType: data.releaseType === ReleaseType.TO_BANK 
            ? MovementType.RELEASE_TO_BANK 
            : MovementType.RELEASE_TO_SUBSIDIARY,
          fromLocation: PropertyLocation.MAIN_OFFICE,
          toLocation: data.releaseType === ReleaseType.TO_BANK 
            ? PropertyLocation.BANK_CUSTODY 
            : data.releaseType === ReleaseType.TO_SUBSIDIARY
            ? PropertyLocation.SUBSIDIARY_COMPANY
            : PropertyLocation.EXTERNAL_HOLDER,
          bankId: data.releaseType === ReleaseType.TO_BANK ? data.bankId : null,
          businessUnitId: data.releaseType === ReleaseType.TO_SUBSIDIARY ? data.businessUnitId : null,
          referenceId: release.id,
          referenceType: 'RELEASE',
          movementDate: new Date(),
          expectedReturnDate: data.expectedReturnDate,
          notes: `Property release request created - awaiting approval. ${data.notes || ''}`.trim(),
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'PropertyRelease',
          entityId: release.id,
          propertyId: data.propertyId,
          userId: session.user.id,
          newValues: {
            releaseType: data.releaseType,
            businessUnitId: data.businessUnitId,
            bankId: data.bankId,
            purposeOfRelease: data.purposeOfRelease,
            status: 'PENDING_APPROVAL',
            approvalRequestId: approvalRequest.id,
          },
        },
      });

      return {
        releaseId: release.id,
        approvalRequestId: approvalRequest.id,
        workflowSteps: workflow.steps.length,
        nextApprover: workflow.steps[0].role.name,
      };
    });

    // Revalidate paths after successful creation
    revalidatePath(`/${businessUnitId}/property-movement/release`);
    revalidatePath(`/${businessUnitId}/properties`);
    revalidatePath(`/${businessUnitId}/approvals`); // If you have an approvals page

    return { 
      success: true, 
      releaseId: result.releaseId,
    };

  } catch (error) {
    console.error('Error creating property release:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('P2003')) {
        return { success: false, error: 'Invalid reference to business unit or bank. Please check your selection.' };
      }
      if (error.message.includes('P2002')) {
        return { success: false, error: 'A release request for this property already exists.' };
      }
    }
    
    return { success: false, error: 'Failed to create property release request' };
  }
}

// Update property release
export async function updatePropertyRelease(
  businessUnitId: string,
  releaseId: string,
  data: PropertyReleaseUpdateData
): Promise<UpdateReleaseResult> {
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
    const existingRelease = await prisma.propertyRelease.findFirst({
      where: {
        id: releaseId,
        property: { businessUnitId },
      },
    });

    if (!existingRelease) {
      return { success: false, error: 'Property release not found' };
    }

    const updatedRelease = await prisma.propertyRelease.update({
      where: { id: releaseId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
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
        bank: {
          select: {
            id: true,
            name: true,
            branchName: true,
          },
        },
        releasedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    revalidatePath(`/${businessUnitId}/property-movement/release`);
    revalidatePath(`/${businessUnitId}/property-movement/release/${releaseId}`);
    return { success: true, release: updatedRelease as PropertyReleaseWithDetails };
  } catch (error) {
    console.error('Error updating property release:', error);
    return { success: false, error: 'Failed to update property release' };
  }
}

// Approve property release
export async function approvePropertyRelease(
  businessUnitId: string,
  releaseId: string
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
    const release = await prisma.propertyRelease.findFirst({
      where: {
        id: releaseId,
        property: { businessUnitId },
        status: TransactionStatus.PENDING,
      },
    });

    if (!release) {
      return { success: false, error: 'Property release not found or not pending' };
    }

    await prisma.propertyRelease.update({
      where: { id: releaseId },
      data: {
        status: TransactionStatus.APPROVED,
        approvedById: session.user.id,
        dateReleased: new Date(),
      },
    });

    revalidatePath(`/${businessUnitId}/property-movement/release`);
    return { success: true };
  } catch (error) {
    console.error('Error approving property release:', error);
    return { success: false, error: 'Failed to approve property release' };
  }
}

// Complete property release (mark as received)
export async function completePropertyRelease(
  businessUnitId: string,
  releaseId: string,
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
    const release = await prisma.propertyRelease.findFirst({
      where: {
        id: releaseId,
        property: { businessUnitId },
        status: TransactionStatus.APPROVED,
      },
    });

    if (!release) {
      return { success: false, error: 'Property release not found or not approved' };
    }

    await prisma.propertyRelease.update({
      where: { id: releaseId },
      data: {
        status: TransactionStatus.COMPLETED,
        receivedById: receivedById || session.user.id,
      },
    });

    revalidatePath(`/${businessUnitId}/property-movement/release`);
    return { success: true };
  } catch (error) {
    console.error('Error completing property release:', error);
    return { success: false, error: 'Failed to complete property release' };
  }
}

// Cancel property release
export async function cancelPropertyRelease(
  businessUnitId: string,
  releaseId: string
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
    const release = await prisma.propertyRelease.findFirst({
      where: {
        id: releaseId,
        property: { businessUnitId },
        status: { in: [TransactionStatus.PENDING, TransactionStatus.APPROVED] },
      },
      include: {
        property: true,
      },
    });

    if (!release) {
      return { success: false, error: 'Property release not found or cannot be cancelled' };
    }

    await prisma.$transaction(async (tx) => {
      // Cancel the release
      await tx.propertyRelease.update({
        where: { id: releaseId },
        data: {
          status: TransactionStatus.CANCELLED,
        },
      });

      // Revert property status
      await tx.property.update({
        where: { id: release.propertyId },
        data: {
          status: PropertyStatus.ACTIVE,
          currentLocation: PropertyLocation.MAIN_OFFICE,
        },
      });
    });

    revalidatePath(`/${businessUnitId}/property-movement/release`);
    revalidatePath(`/${businessUnitId}/properties`);
    return { success: true };
  } catch (error) {
    console.error('Error cancelling property release:', error);
    return { success: false, error: 'Failed to cancel property release' };
  }
}


// Get release statistics - FIXED VERSION
export async function getReleaseStats(businessUnitId: string): Promise<ReleaseStats> {
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
      overdue,
      typeStats,
    ] = await Promise.all([
      prisma.propertyRelease.count({
        where: { property: { businessUnitId } },
      }),
      prisma.propertyRelease.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.PENDING,
        },
      }),
      prisma.propertyRelease.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.APPROVED,
        },
      }),
      prisma.propertyRelease.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.IN_PROGRESS,
        },
      }),
      prisma.propertyRelease.count({
        where: { 
          property: { businessUnitId },
          status: TransactionStatus.COMPLETED,
        },
      }),
      prisma.propertyRelease.count({
        where: { 
          property: { businessUnitId },
          expectedReturnDate: { lt: new Date() },
          status: { not: TransactionStatus.COMPLETED },
        },
      }),
      prisma.propertyRelease.groupBy({
        by: ['releaseType'],
        where: { property: { businessUnitId } },
        _count: { releaseType: true },
      }),
    ]);

    const byType: Record<ReleaseType, number> = {
      TO_SUBSIDIARY: 0,
      TO_BANK: 0,
      TO_EXTERNAL: 0,
    };

    typeStats.forEach(stat => {
      byType[stat.releaseType] = stat._count.releaseType;
    });

    // Get destination stats - FIXED: Use separate queries to avoid ambiguous column references
    const [subsidiaryReleases, bankReleases] = await Promise.all([
      // Get subsidiary releases with explicit field selection
      prisma.propertyRelease.findMany({
        where: { 
          property: { businessUnitId },
          releaseType: ReleaseType.TO_SUBSIDIARY,
          businessUnitId: { not: null },
        },
        select: {
          businessUnitId: true,
        },
      }),
      // Get bank releases with explicit field selection  
      prisma.propertyRelease.findMany({
        where: { 
          property: { businessUnitId },
          releaseType: ReleaseType.TO_BANK,
          bankId: { not: null },
        },
        select: {
          bankId: true,
        },
      }),
    ]);

    const byDestination: Record<string, number> = {};
    
    // Process subsidiary destinations
    if (subsidiaryReleases.length > 0) {
      // Group by businessUnitId manually
      const subsidiaryGroups = subsidiaryReleases.reduce((acc, release) => {
        if (release.businessUnitId) {
          acc[release.businessUnitId] = (acc[release.businessUnitId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Get subsidiary names
      const subsidiaries = await prisma.businessUnit.findMany({
        where: { id: { in: Object.keys(subsidiaryGroups) } },
        select: { id: true, name: true },
      });
      
      Object.entries(subsidiaryGroups).forEach(([unitId, count]) => {
        const subsidiary = subsidiaries.find(s => s.id === unitId);
        if (subsidiary) {
          byDestination[subsidiary.name] = count;
        }
      });
    }

    // Process bank destinations
    if (bankReleases.length > 0) {
      // Group by bankId manually
      const bankGroups = bankReleases.reduce((acc, release) => {
        if (release.bankId) {
          acc[release.bankId] = (acc[release.bankId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Get bank names
      const banks = await prisma.bank.findMany({
        where: { id: { in: Object.keys(bankGroups) } },
        select: { id: true, name: true, branchName: true },
      });
      
      Object.entries(bankGroups).forEach(([bankId, count]) => {
        const bank = banks.find(b => b.id === bankId);
        if (bank) {
          byDestination[`${bank.name} - ${bank.branchName}`] = count;
        }
      });
    }

    return {
      total,
      pending,
      approved,
      inProgress,
      completed,
      overdue,
      byType,
      byDestination,
    };
  } catch (error) {
    console.error('Error fetching release stats:', error);
    throw new Error('Failed to fetch release statistics');
  }
}


// Get release destination options
export async function getReleaseDestinationOptions(): Promise<ReleaseDestinationOption[]> {
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

    const options: ReleaseDestinationOption[] = [
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
    console.error('Error fetching release destination options:', error);
    throw new Error('Failed to fetch release destination options');
  }
}