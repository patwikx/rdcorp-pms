"use server";

import * as z from "zod";
import { AuthError } from "next-auth";

import { getUserByUsername } from "./auth-users";
import { LoginSchema } from "../validations/login-schema";
import { signIn } from "../../auth";


export const login = async (
  values: z.infer<typeof LoginSchema>,
) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { username, passwordHash } = validatedFields.data;

  const existingUser = await getUserByUsername(username);

  if (!existingUser || !existingUser.username || !existingUser.passwordHash) {
    return { error: "username does not exist!" }
  }

  try {
    const result = await signIn("credentials", {
      username,
      passwordHash,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Invalid credentials!" };
    }

    return { success: "Logged in successfully!" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" }
        default:
          return { error: "Something went wrong!" }
      }
    }

    throw error;
  }
};

