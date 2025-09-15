// app/[businessUnitId]/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BusinessUnitProvider } from "@/context/business-unit-context";
import type { UserAssignment } from "@/next-auth";
import { Sidebar } from "@/components/new-sidebar";

interface BusinessUnitItem {
  id: string;
  name: string;
  description: string | null;
}

interface BusinessUnitLayoutProps {
  children: React.ReactNode;
  params: Promise<{ businessUnitId: string }>;
}

async function getBusinessUnitData(businessUnitId: string, userId: string) {
  // Get the specific business unit
  const businessUnit = await prisma.businessUnit.findUnique({
    where: { 
      id: businessUnitId,
      isActive: true 
    },
    select: {
      id: true,
      name: true,
      description: true,
    }
  });

  if (!businessUnit) {
    return null;
  }

  // Get all business units the user has access to (for the switcher)
  const userBusinessUnits = await prisma.businessUnit.findMany({
    where: {
      isActive: true,
      members: {
        some: {
          userId: userId,
          isActive: true
        }
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Get user data with assignments
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      businessUnitMembers: {
        where: { 
          isActive: true,
          businessUnit: {
            isActive: true
          }
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              permissions: true
            }
          },
          businessUnit: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      }
    }
  });

  if (!userData) {
    return null;
  }

  // Transform the assignments to match the expected type
  const userAssignments: UserAssignment[] = userData.businessUnitMembers.map(member => ({
    businessUnitId: member.businessUnitId,
    roleId: member.roleId,
    businessUnit: {
      id: member.businessUnit.id,
      name: member.businessUnit.name,
      description: member.businessUnit.description,
    },
    role: {
      id: member.role.id,
      name: member.role.name,
      description: member.role.description,
      permissions: Array.isArray(member.role.permissions) 
        ? (member.role.permissions as string[]) 
        : [],
    },
  }));

  return {
    businessUnit,
    userBusinessUnits,
    currentUser: {
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      assignments: userAssignments
    }
  };
}

export default async function BusinessUnitLayout({
  children,
  params,
}: BusinessUnitLayoutProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  // Extract businessUnitId from params directly
  const { businessUnitId } = await params;
  
  // Validate businessUnitId
  if (!businessUnitId || typeof businessUnitId !== 'string') {
    redirect("/setup?error=invalid-business-unit");
  }

  const data = await getBusinessUnitData(businessUnitId, session.user.id);
  
  if (!data) {
    redirect("/setup?error=business-unit-not-found");
  }

  // Check if user has access to this business unit
  const hasAccess = data.currentUser.assignments.some(
    assignment => assignment.businessUnitId === businessUnitId
  );

  if (!hasAccess) {
    redirect("/setup?error=unauthorized");
  }

  return (
    <BusinessUnitProvider
      businessUnitId={businessUnitId}
      businessUnit={data.businessUnit}
      userAssignments={data.currentUser.assignments}
    >
      <div className="flex h-screen">
        <Sidebar
          businessUnitId={businessUnitId}
          businessUnits={data.userBusinessUnits}
          currentUser={data.currentUser}
        />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </BusinessUnitProvider>
  );
}