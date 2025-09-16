'use server'

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { PropertyClassification, PropertyStatus, Prisma } from '@prisma/client';
import type { 
  PropertyListItem, 
  PropertyDetails, 
  PropertyFormData, 
  PropertyFilters, 
  PropertySort,
  PropertyStats 
} from '@/types/property-types';

// Check if value is a Decimal object
function isDecimal(value: unknown): boolean {
  return value !== null && 
         typeof value === 'object' && 
         (value.constructor?.name === 'Decimal' ||
          'toNumber' in value ||
          'd' in value);
}


// Alternative serialization function for complete safety
function serializeForClient<T>(obj: T): T {
  const jsonString = JSON.stringify(obj, (key: string, value: unknown) => {
    // Convert Decimals to numbers
    if (isDecimal(value)) {
      return Number(value);
    }
    
    // Convert Dates to ISO strings
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Remove any functions
    if (typeof value === 'function') {
      return undefined;
    }
    
    return value;
  });

  return JSON.parse(jsonString, (key: string, value: unknown) => {
    // Convert ISO date strings back to Date objects for specific fields
    if (typeof value === 'string' && (
      key.endsWith('At') || 
      key.endsWith('Date') || 
      key === 'dateOfBirth'
    )) {
      return new Date(value);
    }
    return value;
  }) as T;
}

// Get properties with pagination and filtering
export async function getProperties(
  businessUnitId: string,
  page: number = 1,
  limit: number = 10,
  filters?: PropertyFilters,
  sort?: PropertySort
): Promise<{
  properties: PropertyListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.PropertyWhereInput = {
    businessUnitId,
    ...(filters?.search && {
      OR: [
        { titleNumber: { contains: filters.search, mode: 'insensitive' } },
        { lotNumber: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
        { registeredOwner: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.classification && { propertyClassification: filters.classification }),
    ...(filters?.location && { 
      location: { contains: filters.location, mode: 'insensitive' } 
    }),
    ...(filters?.registeredOwner && {  
      registeredOwner: { contains: filters.registeredOwner, mode: 'insensitive' } 
    }),
    ...(filters?.createdBy && { createdById: filters.createdBy }),
    ...(filters?.dateFrom || filters?.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    },
  };

  // Build orderBy clause
  const orderBy: Prisma.PropertyOrderByWithRelationInput = sort
    ? { [sort.field]: sort.order }
    : { createdAt: 'desc' };

  try {
    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          businessUnit: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          custodian: {
            select: { id: true, firstName: true, lastName: true },
          },
          bank: {
            select: { id: true, name: true, branchName: true },
          },
          _count: {
            select: {
              documents: true,
              approvalRequests: true,
              releases: true,
              turnovers: true,
              returns: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Use the safer serialization method
    const transformedProperties: PropertyListItem[] = properties.map(property => 
      serializeForClient({
        ...property,
        area: Number(property.area), // Explicit conversion for area
      })
    );

    return {
      properties: transformedProperties,
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw new Error('Failed to fetch properties');
  }
}

// Get property by ID with full details
export async function getPropertyById(
  businessUnitId: string,
  propertyId: string
): Promise<PropertyDetails | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  try {
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        businessUnitId,
      },
      include: {
        businessUnit: true,
        createdBy: true,
        updatedBy: true,
        custodian: true,
        bank: true,
        documents: {
          where: { isActive: true },
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        approvalRequests: {
          include: {
            requestedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            responses: {
              include: {
                respondedBy: {
                  select: { id: true, firstName: true, lastName: true },
                },
                step: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        releases: {
          include: {
            releasedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            approvedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            receivedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            businessUnit: {
              select: { id: true, name: true },
            },
            bank: {
              select: { id: true, name: true, branchName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        turnovers: {
          include: {
            turnedOverBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            receivedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            approvedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            fromBusinessUnit: {
              select: { id: true, name: true },
            },
            toBusinessUnit: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        returns: {
          include: {
            returnedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            receivedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            approvedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            businessUnit: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        rptRecords: {
          include: {
            payments: {
              orderBy: { paymentDate: 'desc' },
            },
          },
          orderBy: { taxYear: 'desc' },
        },
        movements: {
          orderBy: { movementDate: 'desc' },
          take: 10, // Limit to recent movements
        },
        _count: {
          select: {
            documents: true,
            approvalRequests: true,
            releases: true,
            turnovers: true,
            returns: true,
            rptRecords: true,
            movements: true,
          },
        },
      },
    });

    if (!property) {
      return null;
    }

    // Use the safer serialization method
    const transformedProperty: PropertyDetails = serializeForClient({
      ...property,
      area: Number(property.area), // Explicit conversion for area
    });

    return transformedProperty;
  } catch (error) {
    console.error('Error fetching property:', error);
    throw new Error('Failed to fetch property details');
  }
}

// Get property statistics
export async function getPropertyStats(businessUnitId: string): Promise<PropertyStats> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    throw new Error('Access denied to this business unit');
  }

  try {
    const [
      total,
      statusCounts,
      classificationCounts,
      locationCounts,
      areaSum,
      recentCount,
      pendingApprovals,
    ] = await Promise.all([
      // Total properties
      prisma.property.count({
        where: { businessUnitId },
      }),
      
      // Count by status
      prisma.property.groupBy({
        by: ['status'],
        where: { businessUnitId },
        _count: { status: true },
      }),
      
      // Count by classification
      prisma.property.groupBy({
        by: ['propertyClassification'],
        where: { businessUnitId },
        _count: { propertyClassification: true },
      }),
      
      // Count by current location
      prisma.property.groupBy({
        by: ['currentLocation'],
        where: { businessUnitId },
        _count: { currentLocation: true },
      }),
      
      // Total area
      prisma.property.aggregate({
        where: { businessUnitId },
        _sum: { area: true },
      }),
      
      // Recently added (last 30 days)
      prisma.property.count({
        where: {
          businessUnitId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Pending approval requests
      prisma.approvalRequest.count({
        where: {
          property: { businessUnitId },
          status: 'PENDING',
        },
      }),
    ]);

    // Initialize status counts
    const byStatus: Record<PropertyStatus, number> = {
      ACTIVE: 0,
      INACTIVE: 0,
      PENDING: 0,
      RELEASED: 0,
      RETURNED: 0,
      UNDER_REVIEW: 0,
      DISPUTED: 0,
      BANK_CUSTODY: 0,
    };

    // Initialize classification counts
    const byClassification: Record<PropertyClassification, number> = {
      RESIDENTIAL: 0,
      COMMERCIAL: 0,
      INDUSTRIAL: 0,
      AGRICULTURAL: 0,
      INSTITUTIONAL: 0,
      MIXED_USE: 0,
      VACANT_LOT: 0,
      OTHER: 0,
    };

    // Populate actual counts
    statusCounts.forEach(item => {
      byStatus[item.status] = item._count.status;
    });

    classificationCounts.forEach(item => {
      byClassification[item.propertyClassification] = item._count.propertyClassification;
    });

    // Transform location counts to a more usable format
    const byLocation = locationCounts.reduce((acc, item) => {
      acc[item.currentLocation] = item._count.currentLocation;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byStatus,
      byClassification,
      byLocation,
      totalArea: Number(areaSum._sum.area || 0),
      recentlyAdded: recentCount,
      pendingApprovals,
    };
  } catch (error) {
    console.error('Error fetching property stats:', error);
    throw new Error('Failed to fetch property statistics');
  }
}

// Create new property
export async function createProperty(
  businessUnitId: string,
  data: PropertyFormData
): Promise<{ success: boolean; propertyId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has access to this business unit and create permission
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    return { success: false, error: 'Access denied to this business unit' };
  }

  // Check if title number already exists
  const existingProperty = await prisma.property.findUnique({
    where: { titleNumber: data.titleNumber },
  });

  if (existingProperty) {
    return { success: false, error: 'A property with this title number already exists' };
  }

  try {
    const property = await prisma.property.create({
      data: {
        ...data,
        businessUnitId,
        createdById: session.user.id,
        // Set default custodian to the creator if not provided
        custodianId: data.custodianId || session.user.id,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Property',
        entityId: property.id,
        propertyId: property.id,
        userId: session.user.id,
        newValues: serializeForClient({ ...data }),
      },
    });

    revalidatePath(`/${businessUnitId}/properties`);
    return { success: true, propertyId: property.id };
  } catch (error) {
    console.error('Error creating property:', error);
    return { success: false, error: 'Failed to create property' };
  }
}

// Update property
export async function updateProperty(
  businessUnitId: string,
  propertyId: string,
  data: Partial<PropertyFormData>
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    return { success: false, error: 'Access denied to this business unit' };
  }

  try {
    // Verify property exists and belongs to business unit
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: propertyId,
        businessUnitId,
      },
    });

    if (!existingProperty) {
      return { success: false, error: 'Property not found' };
    }

    // Check if title number is being changed and if it conflicts
    if (data.titleNumber && data.titleNumber !== existingProperty.titleNumber) {
      const titleConflict = await prisma.property.findUnique({
        where: { titleNumber: data.titleNumber },
      });

      if (titleConflict) {
        return { success: false, error: 'A property with this title number already exists' };
      }
    }

    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...data,
        updatedById: session.user.id,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Property',
        entityId: propertyId,
        propertyId: propertyId,
        userId: session.user.id,
        oldValues: serializeForClient({ ...existingProperty }),
        newValues: serializeForClient({ ...updatedProperty }),
      },
    });

    revalidatePath(`/${businessUnitId}/properties`);
    revalidatePath(`/${businessUnitId}/properties/${propertyId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating property:', error);
    return { success: false, error: 'Failed to update property' };
  }
}

// Delete property
export async function deleteProperty(
  businessUnitId: string,
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if user has access to this business unit and delete permission
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );
  if (!hasAccess) {
    return { success: false, error: 'Access denied to this business unit' };
  }

  try {
    // Verify property exists and belongs to business unit
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: propertyId,
        businessUnitId,
      },
      include: {
        _count: {
          select: {
            releases: true,
            turnovers: true,
            returns: true,
            approvalRequests: true,
            rptRecords: true,
          },
        },
      },
    });

    if (!existingProperty) {
      return { success: false, error: 'Property not found' };
    }

    // Check if property has related records that prevent deletion
    const hasRelatedRecords = 
      existingProperty._count.releases > 0 ||
      existingProperty._count.turnovers > 0 ||
      existingProperty._count.returns > 0 ||
      existingProperty._count.approvalRequests > 0 ||
      existingProperty._count.rptRecords > 0;

    if (hasRelatedRecords) {
      return { 
        success: false, 
        error: 'Cannot delete property with existing transactions or records. Please archive instead.' 
      };
    }

    // Create audit log entry before deletion
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Property',
        entityId: propertyId,
        propertyId: propertyId,
        userId: session.user.id,
        oldValues: serializeForClient({ ...existingProperty }),
      },
    });

    await prisma.property.delete({
      where: { id: propertyId },
    });

    revalidatePath(`/${businessUnitId}/properties`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting property:', error);
    return { success: false, error: 'Failed to delete property' };
  }
}

// Get unique values for filters
export async function getPropertyFilterOptions(businessUnitId: string): Promise<{
  locations: string[];
  registeredOwners: string[];
  createdByUsers: Array<{ id: string; name: string }>;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const [locations, registeredOwners, createdByUsers] = await Promise.all([
      // Get unique locations
      prisma.property.findMany({
        where: { businessUnitId },
        select: { location: true },
        distinct: ['location'],
        orderBy: { location: 'asc' },
      }),
      
      // Get unique registered owners
      prisma.property.findMany({
        where: { businessUnitId },
        select: { registeredOwner: true },
        distinct: ['registeredOwner'],
        orderBy: { registeredOwner: 'asc' },
      }),
      
      // Get users who created properties
      prisma.user.findMany({
        where: {
          createdProperties: {
            some: { businessUnitId },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
    ]);

    return {
      locations: locations.map(p => p.location),
      registeredOwners: registeredOwners.map(p => p.registeredOwner),
      createdByUsers: createdByUsers.map(user => ({
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
      })),
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw new Error('Failed to fetch filter options');
  }
}