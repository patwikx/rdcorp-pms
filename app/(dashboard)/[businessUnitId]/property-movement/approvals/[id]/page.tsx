// app/(dashboard)/[businessUnitId]/property-movement/approvals/[id]/page.tsx
import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getApprovalRequestById } from '@/lib/actions/approval-actions';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { CheckCircle, Eye, Home } from 'lucide-react';
import { ApprovalRequestDetailPage } from '@/components/approvals/approval-request-detail-page';

interface ApprovalRequestDetailPageProps {
  params: Promise<{ businessUnitId: string; id: string }>;
}

export default async function ApprovalRequestDetail({ params }: ApprovalRequestDetailPageProps) {
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
              <BreadcrumbPage className="flex items-center gap-1 text-sm text-slate-900 font-semibold">
                <Eye className="h-4 w-4" />
                {request.property.titleNumber}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Approval Request Details</h1>
            <p className="text-muted-foreground mt-2">
              Review and process approval request for <span className="font-medium">{request.property.titleNumber}</span>
            </p>
          </div>
        </div>
      </div>

      <ApprovalRequestDetailPage
        businessUnitId={businessUnitId}
        request={request}
      />
    </div>
  );
}