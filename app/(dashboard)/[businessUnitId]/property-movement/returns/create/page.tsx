// app/(dashboard)/[businessUnitId]/property-movement/returns/create/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Building2, RotateCcw, Home } from 'lucide-react';
import { getReturnSourceOptions } from '@/lib/actions/return-actions';
import { getProperties } from '@/lib/actions/property-actions';
import { PropertyStatus } from '@prisma/client';
import { PropertyReturnCreatePage } from '@/components/returns/property-return-create-page';

interface CreateReturnPageProps {
  params: Promise<{ businessUnitId: string }>;
}

export default async function CreateReturnPage({ params }: CreateReturnPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }

  const { businessUnitId } = await params;

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );

  if (!hasAccess) {
    redirect('/setup?error=unauthorized');
  }

  // Fetch necessary data
  const [sources, availablePropertiesResult] = await Promise.all([
    getReturnSourceOptions(),
    getProperties(businessUnitId, 1, 100, { 
      status: PropertyStatus.RELEASED 
    }),
  ]);

  const availableProperties = availablePropertiesResult.properties.map(p => ({
    id: p.id,
    titleNumber: p.titleNumber,
    propertyName: p.propertyName,
    location: p.location,
    status: p.status,
  }));

  return (
    <div className="container mx-auto py-6">
      <div className='mb-8'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${businessUnitId}`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <Home className="h-3 w-3" />
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${businessUnitId}/property-movement/returns`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <RotateCcw className="h-3 w-3" />
                  Property Returns
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1 text-sm text-slate-900 font-semibold">
                <Building2 className="h-4 w-4" />
                Create Return
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Property Return</h1>
            <p className="text-muted-foreground mt-2">
              Process the return of a property from a subsidiary, bank, or external party
            </p>
          </div>
        </div>
      </div>

      <PropertyReturnCreatePage
        businessUnitId={businessUnitId}
        sources={sources}
        availableProperties={availableProperties}
      />
    </div>
  );
}