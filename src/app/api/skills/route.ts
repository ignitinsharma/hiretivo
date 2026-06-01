import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getRateLimitIp, publicReadRateLimiter, writeRateLimiter } from '@/lib/rate-limit';
import { z } from 'zod';

/*
 * GET /api/skills
 * Lists global skills for skill pickers and onboarding flows.
 * Returns sorted skill records or rate-limit errors.
 */
export async function GET(req: NextRequest) {
  const { success } = await publicReadRateLimiter.limit(getRateLimitIp(req));
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const skills = await prisma.skill.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });

  return NextResponse.json(skills);
}

/*
 * POST /api/skills
 * Creates a global skill for authenticated users during onboarding/profile edits.
 * Returns the created skill or auth/validation/conflict/rate-limit errors.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const createSkillSchema = z.object({
    name: z.string().trim().min(1).max(100),
    slug: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(50),
  });

  const parsed = createSkillSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    );
  }

  try {
    const skill = await prisma.skill.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        category: parsed.data.category,
      },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: `Skill "${parsed.data.name}" already exists` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
