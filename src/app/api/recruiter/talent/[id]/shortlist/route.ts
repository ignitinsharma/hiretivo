import { auth } from "@/auth";
import { PlanTier, UserRole } from "@/constants/enums";
import { canAccessRecruiterPaidFeature } from "@/lib/billing/plan-access";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface TalentShortlistRouteContext {
  params: {
    id: string;
  };
}

interface TalentShortlistResponse {
  isShortlisted: boolean;
}

function isPaidPlan(plan: string | null | undefined): boolean {
  if (plan === PlanTier.PRO) {
    return canAccessRecruiterPaidFeature(PlanTier.PRO);
  }

  if (plan === PlanTier.ENTERPRISE) {
    return canAccessRecruiterPaidFeature(PlanTier.ENTERPRISE);
  }

  return canAccessRecruiterPaidFeature(PlanTier.FREE);
}

async function authorizeRecruiter(recruiterId: string): Promise<Response | null> {
  const recruiter = await prisma.user.findUnique({
    where: { id: recruiterId },
    select: { plan: true },
  });

  if (!isPaidPlan(recruiter?.plan)) {
    return new Response("Forbidden", { status: 403 });
  }

  return null;
}

export async function POST(_req: Request, { params }: TalentShortlistRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return new Response("Forbidden", { status: 403 });
  }

  const forbidden = await authorizeRecruiter(session.user.id);
  if (forbidden) {
    return forbidden;
  }

  const seeker = await prisma.user.findFirst({
    where: {
      id: params.id,
      role: "SEEKER",
    },
    select: { id: true },
  });

  if (!seeker) {
    return new Response("Not found", { status: 404 });
  }

  await prisma.talentShortlist.upsert({
    where: {
      recruiterId_seekerId: {
        recruiterId: session.user.id,
        seekerId: seeker.id,
      },
    },
    update: {},
    create: {
      recruiterId: session.user.id,
      seekerId: seeker.id,
    },
  });

  const data: TalentShortlistResponse = { isShortlisted: true };
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(_req: Request, { params }: TalentShortlistRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return new Response("Forbidden", { status: 403 });
  }

  const forbidden = await authorizeRecruiter(session.user.id);
  if (forbidden) {
    return forbidden;
  }

  await prisma.talentShortlist.deleteMany({
    where: {
      recruiterId: session.user.id,
      seekerId: params.id,
      seeker: { role: "SEEKER" },
    },
  });

  const data: TalentShortlistResponse = { isShortlisted: false };
  return NextResponse.json({ data });
}
