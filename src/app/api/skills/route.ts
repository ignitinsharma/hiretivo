import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
