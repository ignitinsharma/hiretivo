import { z } from "zod";

export const hostedEmail = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
export const hostedPassword = z.string().min(12, "Use at least 12 characters.").max(128, "Use at most 128 characters.");
export const signupSchema = z.object({ email: hostedEmail, password: hostedPassword, confirmPassword: z.string() }).refine((input) => input.password === input.confirmPassword, { message: "The passwords do not match.", path: ["confirmPassword"] });
export const resetSchema = z.object({ password: hostedPassword, confirmPassword: z.string(), token: z.string().regex(/^[\w-]{43}$/, "This reset link is invalid. Request a new link.") }).refine((input) => input.password === input.confirmPassword, { message: "The passwords do not match.", path: ["confirmPassword"] });
