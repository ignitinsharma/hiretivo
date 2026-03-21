import { z } from "zod";

const roleValues = ["SEEKER", "RECRUITER"] as const;
const planValues = ["FREE", "PRO", "ENTERPRISE"] as const;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(roleValues),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerWithPlanSchema = registerSchema.extend({
  plan: z.enum(planValues).optional(),
});

export type RegisterWithPlanInput = z.infer<typeof registerWithPlanSchema>;
