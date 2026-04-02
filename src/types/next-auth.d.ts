import type { DefaultSession } from "next-auth";
import type { PlanTier, Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      plan: PlanTier;
      emailVerified: Date | null;
    };
  }

  interface User {
    role?: Role;
    plan?: PlanTier;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    plan?: PlanTier;
    emailVerified?: Date | null;
  }
}
