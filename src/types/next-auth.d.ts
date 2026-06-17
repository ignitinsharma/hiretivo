import type { DefaultSession } from "next-auth";
import type { PlanTier, Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      plan: PlanTier;
      emailVerified: Date | null;
      onboardingCompleted: boolean | null;
      onboardingStep: number | null;
      isAdmin: boolean;
    };
  }

  interface User {
    role?: Role;
    plan?: PlanTier;
    onboardingCompleted?: boolean | null;
    onboardingStep?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    plan?: PlanTier;
    image?: string | null;
    emailVerified?: Date | null;
    onboardingCompleted?: boolean | null;
    onboardingStep?: number | null;
    isAdmin?: boolean;
  }
}
