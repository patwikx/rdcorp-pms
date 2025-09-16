// app/(dashboard)/[businessUnitId]/users/assignments/[userId]/[targetBusinessUnitId]/edit/page.tsx
import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getUserAssignmentById } from '@/lib/actions/user-management-actions';
import { getAllRoles } from '@/lib/actions/role-actions';
import { prisma } from '@/lib/prisma';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Users, Eye, Home, UserPlus } from 'lucide-react';
import { UserAssignmentDetailEditPage } from '@/components/users/user-assignment-detail-edit-page';

interface EditUserAssignmentPageProps {
  params: Promise<{ businessUnitId: string; userId: string; targetBusinessUnitId: string }>;
}

export default async function EditUserAssignmentPage({ params }: EditUserAssignmentPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }

  const { businessUnitId, userId, targetBusinessUnitId } = await params;

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );

  if (!hasAccess) {
    redirect('/setup?error=unauthorized');
  }

  // Fetch assignment, available roles, and business units concurrently
  const [assignment, availableRoles, availableBusinessUnits] = await Promise.all([
    getUserAssignmentById(businessUnitId, userId, targetBusinessUnitId),
    getAllRoles(),
    prisma.businessUnit.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!assignment) {
    notFound();
  }

  const userName = `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim();

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
                <Link href={`/${businessUnitId}/users`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <Users className="h-3 w-3" />
                  User Management
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${businessUnitId}/users/assignments`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <UserPlus className="h-3 w-3" />
                  User Assignments
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1 text-sm text-slate-900 font-semibold">
                <Eye className="h-4 w-4" />
                Edit Assignment - {userName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit User Assignment</h1>
            <p className="text-muted-foreground mt-2">
              Update assignment details for <span className="font-medium">{userName}</span>
            </p>
          </div>
        </div>
      </div>

      <UserAssignmentDetailEditPage
        businessUnitId={businessUnitId}
        assignment={assignment}
        availableRoles={availableRoles}
        availableBusinessUnits={availableBusinessUnits}
      />
    </div>
  );
}