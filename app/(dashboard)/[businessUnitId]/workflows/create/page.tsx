// app/(dashboard)/[businessUnitId]/workflows/create/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Settings, FileText, Home } from 'lucide-react';
import { getAvailableRoles } from '@/lib/actions/approval-workflow-actions';
import { ApprovalWorkflowCreatePage } from '@/components/workflows/approval-workflow-create-page';


interface CreateApprovalWorkflowPageProps {
  params: Promise<{ businessUnitId: string }>;
}

export default async function CreateApprovalWorkflowPage({ params }: CreateApprovalWorkflowPageProps) {
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

  // Fetch available roles
  const availableRoles = await getAvailableRoles();

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
                <FileText className="h-4 w-4" />
                Create Workflow
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Approval Workflow</h1>
            <p className="text-muted-foreground mt-2">
              Design a new approval workflow for your business processes
            </p>
          </div>
        </div>
      </div>

      <ApprovalWorkflowCreatePage
        businessUnitId={businessUnitId}
        availableRoles={availableRoles}
      />
    </div>
  );
}