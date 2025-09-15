// src/lib/actions/custodian-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { UserList } from '@/types/property-types';

export async function getCustodians(): Promise<UserList> {
  try {
    // You may need to refine this query based on your role management.
    // This example fetches all active users.
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        // Optional: Add a filter for a specific role if only certain users can be custodians
        // businessUnitMembers: {
        //   some: {
        //     role: {
        //       name: 'Custodian',
        //     },
        //   },
        // },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { lastName: 'asc' },
    });

    // Map the fetched data to the UserList type
    const custodians = users.map(user => ({
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    }));

    return custodians;
  } catch (error) {
    console.error('Failed to fetch custodians:', error);
    // Return an empty array on failure
    return [];
  }
}