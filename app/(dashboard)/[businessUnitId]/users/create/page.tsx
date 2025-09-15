// app/(dashboard)/[businessUnitId]/users/create/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { UserForm } from '@/components/users/user-form';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Users, UserPlus, Home } from 'lucide-react';

interface CreateUserPageProps {
  params: Promise<{ businessUnitId: string }>;
}

export default async function CreateUserPage({ params }: CreateUserPageProps) {
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
                  Users
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1 text-sm text-slate-900 font-semibold">
                <UserPlus className="h-4 w-4" />
                Create User
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
        <p className="text-muted-foreground mt-2">
          Create a new user account in your business unit
        </p>
      </div>

      {/* Form Component */}
      <UserForm businessUnitId={businessUnitId} />
    </div>
  );
}