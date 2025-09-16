// app/(dashboard)/[businessUnitId]/property-movement/approvals/[id]/process/page.tsx
import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getApprovalRequestById } from '@/lib/actions/approval-actions';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { CheckCircle, Settings, Home } from 'lucide-react';
import { ApprovalRequestProcessPage } from '@/components/approvals/approval-request-process-page';

interface ProcessApprovalRequestPageProps {
  params: Promise<{ businessUnitId: string; id: string }>;
}

export default async function ProcessApprovalRequestPage({ params }: ProcessApprovalRequestPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }

  const { businessUnitId, id } = await params;

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );

  if (!hasAccess) {
    redirect('/setup?error=unauthorized');
  }

  // Fetch approval request details
  const request = await getApprovalRequestById(businessUnitId, id);

  if (!request) {
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
                <Link href={`/${businessUnitId}/property-movement/approvals`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <CheckCircle className="h-3 w-3" />
                  Approval Requests
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${businessUnitId}/property-movement/approvals/${id}`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <CheckCircle className="h-3 w-3" />
                  {request.property.titleNumber}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1 text-sm text-slate-900 font-semibold">
                <Settings className="h-4 w-4" />
                Process Request
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Process Approval Request</h1>
            <p className="text-muted-foreground mt-2">
              Review and process approval request for <span className="font-medium">{request.property.titleNumber}</span>
            </p>
          </div>
        </div>
      </div>

      <ApprovalRequestProcessPage
        businessUnitId={businessUnitId}
        request={request}
      />
    </div>
  );
}