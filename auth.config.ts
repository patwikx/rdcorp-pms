import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { LoginSchema } from "@/lib/validations/login-schema";
import { getUserByUsername } from "@/lib/auth-actions/auth-users";

export const authConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);
        
        if (validatedFields.success) {
          const { username, passwordHash } = validatedFields.data;
          const user = await getUserByUsername(username);
          
          // Check if user exists and has a password hash
          if (!user || !user.passwordHash) return null;
          
          // Compare the provided password with the stored hash
          const passwordsMatch = await bcryptjs.compare(
            passwordHash,
            user.passwordHash
          );
         
          if (passwordsMatch) return user;
        }
        
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;