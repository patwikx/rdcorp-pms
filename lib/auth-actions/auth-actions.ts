"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"

export async function loginAction(prevState: string | undefined, formData: FormData) {
  try {
    // Use redirectTo option to ensure proper redirect after successful login
    await signIn("credentials", {
      email: formData.get("email"),
      employeeId: formData.get("employeeId"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Wrong employee ID or password. Please try again."
        default:
          return "An unexpected error occurred. Please try again."
      }
    }
    // Re-throw other errors (including redirect errors from NextAuth)
    throw error
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}
