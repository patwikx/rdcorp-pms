// app/(dashboard)/[businessUnitId]/property-movement/release/create/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Building2, Send, Home } from 'lucide-react';
import { getReleaseDestinationOptions } from '@/lib/actions/release-actions';
import { getProperties } from '@/lib/actions/property-actions';
import { PropertyStatus } from '@prisma/client';
import { PropertyReleaseCreatePage } from '@/components/release/property-release-create-page';

interface CreateReleasePageProps {
  params: Promise<{ businessUnitId: string }>;
}

export default async function CreateReleasePage({ params }: CreateReleasePageProps) {
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
  const [destinations, availablePropertiesResult] = await Promise.all([
    getReleaseDestinationOptions(),
    getProperties(businessUnitId, 1, 100, { 
      status: PropertyStatus.ACTIVE 
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
                <Link href={`/${businessUnitId}/property-movement/release`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <Send className="h-3 w-3" />
                  Property Releases
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1 text-sm text-slate-900 font-semibold">
                <Building2 className="h-4 w-4" />
                Create Release
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Property Release</h1>
            <p className="text-muted-foreground mt-2">
              Release a property to a subsidiary, bank, or external party
            </p>
          </div>
        </div>
      </div>

      <PropertyReleaseCreatePage
        businessUnitId={businessUnitId}
        destinations={destinations}
        availableProperties={availableProperties}
      />
    </div>
  );
}