import { z } from "zod";
import { PLAN_TIER_VALUES, USER_ROLE_VALUES } from "@/constants/enums";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(USER_ROLE_VALUES),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerWithPlanSchema = registerSchema.extend({
  plan: z.enum(PLAN_TIER_VALUES).optional(),
});

export type RegisterWithPlanInput = z.infer<typeof registerWithPlanSchema>;

export const seekerLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SeekerLoginInput = z.infer<typeof seekerLoginSchema>;

export const seekerRegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(120, "Name must be less than 120 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type SeekerRegisterInput = z.infer<typeof seekerRegisterSchema>;

export const recruiterLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RecruiterLoginInput = z.infer<typeof recruiterLoginSchema>;

export const recruiterRegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(120, "Name must be less than 120 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(120, "Company name must be less than 120 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type RecruiterRegisterInput = z.infer<typeof recruiterRegisterSchema>;
