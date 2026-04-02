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
    value === PlanTier.PRO ||
    value === PlanTier.ENTERPRISE
  );
}

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      // Only intercept Google OAuth — Credentials provider handles role via register
      if (account?.provider !== "google") return true;

      // Check if the user has explicitly set their role by verifying profile existence
      // Since role defaults to SEEKER in DB, we use seeker/recruiter profile presence
      // to determine if they have been through onboarding. Brand-new Google users have neither.
      if (!user.id) return true;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          seekerProfile: { select: { id: true } },
          recruiterProfile: { select: { id: true } },
        },
      });

      const hasProfile = dbUser?.seekerProfile || dbUser?.recruiterProfile;

      if (!hasProfile) {
        // New Google user — redirect to role selection page
        return `/auth/select-role?userId=${user.id}`;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, plan: true, emailVerified: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.plan = dbUser.plan;
          token.emailVerified = dbUser.emailVerified ?? null;
        }
      }

      if (trigger === "update" && session?.user) {
        const u = session.user as { role?: Role; plan?: PlanTier };
        if (u.role) {
          token.role = u.role;
        }
        if (u.plan) {
          token.plan = u.plan;
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

      return session;
    },
  },
});
