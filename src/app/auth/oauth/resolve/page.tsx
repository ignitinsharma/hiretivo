import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";

interface ResolvePageProps {
  searchParams: {
    entryRole?: string;
    next?: string;
    source?: string;
  };
}

function getSafeNextPath(value: string | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}

function getEntryRole(value: string | undefined): UserRole | null {
  if (value === UserRole.SEEKER || value === UserRole.RECRUITER) {
    return value;
  }
  return null;
}

function getSourceAuthPath(value: string | undefined): string | null {
  if (value === "seeker-login") return "/seeker/login";
  if (value === "seeker-register") return "/seeker/register";
  if (value === "recruiter-login") return "/recruiter/login";
  if (value === "recruiter-register") return "/recruiter/register";
  return null;
}

export default async function OAuthResolvePage({ searchParams }: ResolvePageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id;
  const entryRole = getEntryRole(searchParams.entryRole);
  const nextPath = getSafeNextPath(searchParams.next);
  const sourcePath = getSourceAuthPath(searchParams.source);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      onboardingCompleted: true,
      passwordHash: true,
      seekerProfile: { select: { id: true } },
      recruiterProfile: { select: { id: true } },
    },
  });

  if (!user) {
    redirect("/");
  }

  const hasAnyProfile = Boolean(user.seekerProfile || user.recruiterProfile);
  const isLikelyFirstGoogleUser =
    !user.passwordHash &&
    !hasAnyProfile &&
    user.onboardingCompleted === false &&
    user.role === Role.SEEKER;

  let effectiveRole = user.role;

  if (
    !isLikelyFirstGoogleUser &&
    entryRole &&
    sourcePath &&
    user.role !== (entryRole as Role)
  ) {
    redirect(
      `${sourcePath}?authError=wrong_role_oauth&accountRole=${encodeURIComponent(user.role)}`
    );
  }

  if (entryRole && isLikelyFirstGoogleUser) {
    effectiveRole = entryRole as Role;
    if (effectiveRole !== user.role) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: effectiveRole },
      });
    }
    await unstable_update({ user: { role: effectiveRole } });
  }

  if (!entryRole && isLikelyFirstGoogleUser) {
    redirect("/auth/select-role");
  }

  if (user.onboardingCompleted === true) {
    if (nextPath) {
      redirect(nextPath);
    }
    redirect(
      effectiveRole === Role.RECRUITER
        ? "/recruiter/dashboard"
        : "/seeker/dashboard"
    );
  }

  redirect(
    effectiveRole === Role.RECRUITER
      ? "/recruiter/onboarding"
      : "/seeker/onboarding"
  );
}
