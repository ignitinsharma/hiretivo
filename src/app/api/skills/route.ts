import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { UserRole } from '@/constants/enums';

// GET /api/skills — all skills for the skills picker
// Public endpoint — no auth required (skills are non-sensitive global data)
export async function GET() {
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

// POST /api/skills — create a new skill (auth required)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Security fix: Only recruiters or admins can create skills
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden — recruiters only' }, { status: 403 });
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
