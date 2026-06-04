import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PlanTier, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

function isRole(value: unknown): value is Role {
  return value === Role.SEEKER || value === Role.RECRUITER;
}

function isPlanTier(value: unknown): value is PlanTier {
  return (
    value === PlanTier.FREE ||
    value === PlanTier.STARTER ||
    value === PlanTier.GROWTH ||
    value === PlanTier.SCALE
  );
}

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            plan: true,
            passwordHash: true,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
          plan: user.plan,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // OAuth and credentials share the same post-auth resolver now.
      // Keep Auth.js sign-in callback permissive and route users afterward.
      if (account?.provider !== "google") return true;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            role: true,
            plan: true,
            emailVerified: true,
            onboardingCompleted: true,
            onboardingStep: true,
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.plan = dbUser.plan;
          token.emailVerified = dbUser.emailVerified ?? null;
          token.onboardingCompleted = dbUser.onboardingCompleted ?? null;
          token.onboardingStep = dbUser.onboardingStep ?? null;
        }
      }

      if (trigger === "update" && session?.user) {
        const u = session.user as {
          role?: Role;
          plan?: PlanTier;
          onboardingCompleted?: boolean | null;
          onboardingStep?: number | null;
        };
        if (u.role) {
          token.role = u.role;
        }
        if (u.plan) {
          token.plan = u.plan;
        }
        if (typeof u.onboardingCompleted === "boolean" || u.onboardingCompleted === null) {
          token.onboardingCompleted = u.onboardingCompleted;
        }
        if (typeof u.onboardingStep === "number" || u.onboardingStep === null) {
          token.onboardingStep = u.onboardingStep;
        }
        if (token.sub) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { emailVerified: true },
          });
          if (dbUser) {
            token.emailVerified = dbUser.emailVerified ?? null;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.sub) {
        return session;
      }

      session.user.id = token.sub;

      let role: Role | undefined = isRole(token.role) ? token.role : undefined;
      let plan: PlanTier | undefined = isPlanTier(token.plan)
        ? token.plan
        : undefined;

      if (!role || !plan) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, plan: true },
        });
        if (dbUser) {
          role = dbUser.role;
          plan = dbUser.plan;
        }
      }

      session.user.role = role ?? Role.SEEKER;
      session.user.plan = plan ?? PlanTier.FREE;
      session.user.emailVerified = (token.emailVerified as Date | null | undefined) ?? null;
      session.user.onboardingCompleted = (token.onboardingCompleted as boolean | null | undefined) ?? null;
      session.user.onboardingStep = (token.onboardingStep as number | null | undefined) ?? null;

      return session;
    },
  },
});
