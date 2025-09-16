// app/api/business-units/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessUnits = await prisma.businessUnit.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(businessUnits);
  } catch (error) {
    console.error('Error fetching business units:', error);
    return NextResponse.json({ error: 'Failed to fetch business units' }, { status: 500 });
  }
}