import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  session: { strategy: "jwt" as const },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        (session.user as { role?: string }).role = token.role as string;
        (
          session.user as {
            onboardingCompleted?: boolean | null;
            onboardingStep?: number | null;
          }
        ).onboardingCompleted =
          (token.onboardingCompleted as boolean | null | undefined) ?? null;
        (
          session.user as {
            onboardingCompleted?: boolean | null;
            onboardingStep?: number | null;
          }
        ).onboardingStep =
          (token.onboardingStep as number | null | undefined) ?? null;
        (session.user as { isAdmin?: boolean }).isAdmin =
          (token.isAdmin as boolean | null | undefined) ?? false;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
