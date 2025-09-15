// next-auth.d.ts
import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// Define the structure for a user's role within an assignment
export interface UserAssignmentRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[]; // JSON array of permission strings
}

// Define the structure for a user's business unit within an assignment
export interface UserAssignmentBusinessUnit {
  id: string;
  name: string;
  description: string | null;
}

// Define the structure of a single assignment (based on BusinessUnitMember)
export interface UserAssignment {
  businessUnitId: string;
  roleId: string;
  businessUnit: UserAssignmentBusinessUnit;
  role: UserAssignmentRole;
}

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      isActive: boolean;
      firstName: string | null;
      lastName: string | null;
      assignments: UserAssignment[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and sent to the `Session` callback */
  interface JWT {
    id: string;
    isActive: boolean;
    firstName: string | null;
    lastName: string | null;
    assignments: UserAssignment[];
  }
}