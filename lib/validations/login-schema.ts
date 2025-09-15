import * as z from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required",
  }),
  passwordHash: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});
