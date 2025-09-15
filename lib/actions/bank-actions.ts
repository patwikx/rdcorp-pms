// src/lib/actions/bank-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { BankList } from '@/types/property-types';

export async function getBanks(): Promise<BankList> {
  try {
    const banks = await prisma.bank.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        branchName: true,
      },
      orderBy: { name: 'asc' },
    });

    return banks;
  } catch (error) {
    console.error('Failed to fetch banks:', error);
    // Return an empty array on failure to prevent the app from crashing
    return [];
  }
}