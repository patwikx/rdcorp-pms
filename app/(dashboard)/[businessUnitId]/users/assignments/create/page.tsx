// app/(dashboard)/[businessUnitId]/users/assignments/create/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Users, FileText, Home, UserPlus } from 'lucide-react';
import { getAllRoles } from '@/lib/actions/role-actions';
import { prisma } from '@/lib/prisma';
import { UserAssignmentCreatePage } from '@/components/users/user-assignment-create-page';

interface CreateUserAssignmentPageProps {
  params: Promise<{ businessUnitId: string }>;
}

export default async function CreateUserAssignmentPage({ params }: CreateUserAssignmentPageProps) {
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

  // Fetch available roles and business units
  const [availableRoles, availableBusinessUnits] = await Promise.all([
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
                <FileText className="h-4 w-4" />
                Create Assignment
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create User Assignment</h1>
            <p className="text-muted-foreground mt-2">
              Assign a user to a business unit with a specific role
            </p>
          </div>
        </div>
      </div>

      <UserAssignmentCreatePage
        businessUnitId={businessUnitId}
        availableRoles={availableRoles.map(role => ({
          ...role,
          description: role.description || null,
        }))}
        availableBusinessUnits={availableBusinessUnits}
      />
    </div>
  );
}