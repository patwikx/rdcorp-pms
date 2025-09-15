import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import type { UserAssignment } from "@/next-auth"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
    signOut: "/auth/sign-in"
  },
  ...authConfig,
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return false;
      
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      return existingUser?.isActive === true;
    },
    
    async jwt({ token }) {
      if (!token.sub) return token;
     
      const userWithDetails = await prisma.user.findUnique({
        where: { id: token.sub },
        include: {
          businessUnitMembers: {
            where: { isActive: true },
            include: {
              role: {
                include: {
                  permissions: true // Include RolePermissions
                }
              },
              businessUnit: true
            }
          },
        },
      });
     
      if (!userWithDetails) return token;
     
      // Transform businessUnitMembers into assignments with proper permissions
      const assignments: UserAssignment[] = userWithDetails.businessUnitMembers.map((member) => ({
        businessUnitId: member.businessUnitId,
        roleId: member.roleId,
        businessUnit: {
          id: member.businessUnit.id,
          name: member.businessUnit.name,
          description: member.businessUnit.description
        },
        role: {
          id: member.role.id,
          name: member.role.name,
          description: member.role.description,
          level: member.role.level,
          permissions: member.role.permissions // This will be RolePermissions[]
        },
      }));
     
      token.id = userWithDetails.id;
      token.firstName = userWithDetails.firstName;
      token.lastName = userWithDetails.lastName;
      token.isActive = userWithDetails.isActive;
      token.assignments = assignments;
     
      return token;
    },
    
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.id as string;
        session.user.name = `${token.firstName || ''} ${token.lastName || ''}`.trim() || session.user.email || 'User';
        session.user.firstName = token.firstName as string | null;
        session.user.lastName = token.lastName as string | null;
        session.user.isActive = token.isActive as boolean;
        session.user.assignments = token.assignments as UserAssignment[];
      }
      return session;
    },
  },
});