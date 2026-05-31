import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getRateLimitIp, publicReadRateLimiter, writeRateLimiter } from '@/lib/rate-limit';
import { slugifySkillInput, resolveCanonicalSlug } from '@/lib/skill-synonyms';
import { z } from 'zod';

interface SkillListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
}

/*
 * getSkillCanonicalSlug
 * Resolves stored skill rows and old alias rows to a single canonical slug.
 * Used to hide duplicate rows such as "nextjs" when "Next.js" already exists.
 */
function getSkillCanonicalSlug(skill: Pick<SkillListItem, 'name' | 'slug'>): string {
  return resolveCanonicalSlug(skill.slug || slugifySkillInput(skill.name));
}

/*
 * shouldPreferSkill
 * Chooses the canonical seeded skill over duplicate user-created aliases.
 * Exact canonical slug wins first, then non-Other category, then display-name quality.
 */
function shouldPreferSkill(
  candidate: SkillListItem,
  current: SkillListItem,
  canonicalSlug: string,
): boolean {
  const candidateIsCanonical = candidate.slug === canonicalSlug;
  const currentIsCanonical = current.slug === canonicalSlug;

  if (candidateIsCanonical !== currentIsCanonical) return candidateIsCanonical;
  if (candidate.category !== 'Other' && current.category === 'Other') return true;
  if (candidate.category === 'Other' && current.category !== 'Other') return false;
  return candidate.name.length > current.name.length;
}

/*
 * dedupeCanonicalSkills
 * Returns one visible skill per canonical slug, preserving alphabetical output.
 */
function dedupeCanonicalSkills(skills: SkillListItem[]): SkillListItem[] {
  const byCanonicalSlug = new Map<string, SkillListItem>();

  for (const skill of skills) {
    const canonicalSlug = getSkillCanonicalSlug(skill);
    const current = byCanonicalSlug.get(canonicalSlug);

    if (!current || shouldPreferSkill(skill, current, canonicalSlug)) {
      byCanonicalSlug.set(canonicalSlug, skill);
    }
  }

  return Array.from(byCanonicalSlug.values()).sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category);
    if (categoryCompare !== 0) return categoryCompare;
    return a.name.localeCompare(b.name);
  });
}

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

  return NextResponse.json(dedupeCanonicalSkills(skills));
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
    slug: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(50),
  });

  const parsed = createSkillSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    );
  }

  // Normalize name → canonical slug server-side, ignoring client-provided slug.
  // This prevents duplicate rows for aliases like "JS" vs "JavaScript".
  const canonicalSlug = resolveCanonicalSlug(slugifySkillInput(parsed.data.name));
  const displayName = parsed.data.name.trim();

  // Return existing skill if it already matches by canonical slug or name (case-insensitive).
  const existing = await prisma.skill.findFirst({
    where: {
      OR: [
        { slug: canonicalSlug },
        { name: { equals: displayName, mode: 'insensitive' } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  try {
    const skill = await prisma.skill.create({
      data: {
        name: displayName,
        slug: canonicalSlug,
        category: parsed.data.category,
      },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (err: unknown) {
    // P2002 = race condition — another request created the same skill concurrently.
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      const raceWinner = await prisma.skill.findFirst({
        where: {
          OR: [
            { slug: canonicalSlug },
            { name: { equals: displayName, mode: 'insensitive' } },
          ],
        },
      });
      if (raceWinner) return NextResponse.json(raceWinner, { status: 200 });
    }
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
