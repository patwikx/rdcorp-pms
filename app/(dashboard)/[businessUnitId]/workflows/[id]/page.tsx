// app/(dashboard)/[businessUnitId]/workflows/[id]/page.tsx
import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getApprovalWorkflowById, getAvailableRoles } from '@/lib/actions/approval-workflow-actions';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Settings, Eye, Home } from 'lucide-react';
import { ApprovalWorkflowDetailEditPage } from '@/components/workflows/approval-workflow-detail-edit-page';

interface EditApprovalWorkflowPageProps {
  params: Promise<{ businessUnitId: string; id: string }>;
}

export default async function EditApprovalWorkflowPage({ params }: EditApprovalWorkflowPageProps) {
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

  // Fetch workflow and available roles concurrently
  const [workflow, availableRoles] = await Promise.all([
    getApprovalWorkflowById(businessUnitId, id),
    getAvailableRoles(),
  ]);

  if (!workflow) {
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
                <Link href={`/${businessUnitId}/workflows`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <Settings className="h-3 w-3" />
                  Approval Workflows
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1 text-sm text-slate-900 font-semibold">
                <Eye className="h-4 w-4" />
                {workflow.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Approval Workflow</h1>
            <p className="text-muted-foreground mt-2">
              Modify workflow settings and approval steps for <span className="font-medium">{workflow.name}</span>
            </p>
          </div>
        </div>
      </div>

      <ApprovalWorkflowDetailEditPage
        businessUnitId={businessUnitId}
        workflow={workflow}
        availableRoles={availableRoles}
      />
    </div>
  );
}