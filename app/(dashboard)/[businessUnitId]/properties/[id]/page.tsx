// app/(dashboard)/[businessUnitId]/properties/[id]/page.tsx
import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getPropertyById } from '@/lib/actions/property-actions';
// Import the new data fetching actions for banks and custodians


import { PropertyDetailEditPage } from '@/components/properties/property-detail-edit-page';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Building2, Eye, Home } from 'lucide-react';
import { getBanks } from '@/lib/actions/bank-actions';
import { getCustodians } from '@/lib/actions/custodian-actions';

interface EditPropertyPageProps {
  params: { businessUnitId: string; id: string };
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }

  const { businessUnitId, id } = params;

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );

  if (!hasAccess) {
    redirect('/setup?error=unauthorized');
  }

  // Fetch all necessary data concurrently to improve performance
  const [property, availableBanks, availableCustodians] = await Promise.all([
    getPropertyById(businessUnitId, id),
    getBanks(),
    getCustodians(),
  ]);

  if (!property) {
    notFound();
  }

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
                <Link href={`/${businessUnitId}/properties`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <Building2 className="h-3 w-3" />
                  Properties
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1 text-sm text-slate-900 font-semibold">
                <Eye className="h-4 w-4" />
                {property.titleNumber}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
            <p className="text-muted-foreground mt-2">
              Update property information and details for <span className="font-medium">{property.titleNumber}</span>
            </p>
          </div>
        </div>
      </div>

      <PropertyDetailEditPage
        businessUnitId={businessUnitId}
        property={property}
        availableBanks={availableBanks}
        availableCustodians={availableCustodians}
      />
    </div>
  );
}