import {
  canonicalizeSkillName,
  normalizeSkillInput,
  slugifySkillName,
} from "@/lib/skills/canonicalize";
import { prisma } from "@/lib/prisma";

interface MergeGroup {
  canonicalName: string;
  aliases: string[];
}

const MERGE_GROUPS: MergeGroup[] = [
  { canonicalName: "React", aliases: ["reactjs", "react.js", "React"] },
  { canonicalName: "Node.js", aliases: ["nodejs", "node.js", "Node.js"] },
  { canonicalName: "Next.js", aliases: ["nextjs", "next.js", "Next.js"] },
  { canonicalName: "Backend", aliases: ["Back-End", "Backend"] },
  { canonicalName: "E-Commerce", aliases: ["E-Commerce", "Ecommerce"] },
];

interface SkillCandidate {
  id: string;
  name: string;
  slug: string;
  category: string;
  createdAt: Date;
  _count: {
    seekerSkills: number;
    jobSkills: number;
  };
}

function hasApplyFlag(): boolean {
  return process.argv.includes("--apply");
}

function getReferenceCount(skill: SkillCandidate): number {
  return skill._count.seekerSkills + skill._count.jobSkills;
}

function slugifyRawSkillName(name: string): string {
  return normalizeSkillInput(name)
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function chooseCanonicalSkill(
  canonicalName: string,
  candidates: SkillCandidate[],
): SkillCandidate {
  const canonicalSlug = slugifySkillName(canonicalName);
  const exact = candidates.find(
    (skill) =>
      skill.name.toLowerCase() === canonicalName.toLowerCase() ||
      skill.slug === canonicalSlug,
  );
  if (exact) return exact;

  return [...candidates].sort((a, b) => {
    const refDelta = getReferenceCount(b) - getReferenceCount(a);
    if (refDelta !== 0) return refDelta;
    return a.createdAt.getTime() - b.createdAt.getTime();
  })[0]!;
}

async function moveSeekerSkillReferences(
  duplicateSkillId: string,
  canonicalSkillId: string,
) {
  const rows = await prisma.seekerSkill.findMany({
    where: { skillId: duplicateSkillId },
    select: { id: true, seekerProfileId: true, level: true },
  });

  for (const row of rows) {
    const existing = await prisma.seekerSkill.findUnique({
      where: {
        seekerProfileId_skillId: {
          seekerProfileId: row.seekerProfileId,
          skillId: canonicalSkillId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.seekerSkill.delete({ where: { id: row.id } });
      continue;
    }

    await prisma.seekerSkill.update({
      where: { id: row.id },
      data: { skillId: canonicalSkillId },
    });
  }

  return rows.length;
}

async function moveJobSkillReferences(
  duplicateSkillId: string,
  canonicalSkillId: string,
) {
  const rows = await prisma.jobSkill.findMany({
    where: { skillId: duplicateSkillId },
    select: { id: true, jobId: true, level: true },
  });

  for (const row of rows) {
    const existing = await prisma.jobSkill.findUnique({
      where: {
        jobId_skillId: {
          jobId: row.jobId,
          skillId: canonicalSkillId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.jobSkill.delete({ where: { id: row.id } });
      continue;
    }

    await prisma.jobSkill.update({
      where: { id: row.id },
      data: { skillId: canonicalSkillId },
    });
  }

  return rows.length;
}

async function findCandidates(group: MergeGroup): Promise<SkillCandidate[]> {
  const rawNames = [group.canonicalName, ...group.aliases];
  const names = new Set([
    ...rawNames,
    ...rawNames.map((name) => canonicalizeSkillName(name)),
  ]);
  const slugs = new Set([
    ...rawNames.map((name) => slugifyRawSkillName(name)),
    ...rawNames.map((name) => slugifySkillName(name)),
  ]);

  return prisma.skill.findMany({
    where: {
      OR: [
        { slug: { in: [...slugs] } },
        ...[...names].map((name) => ({
          name: { equals: name, mode: "insensitive" as const },
        })),
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      createdAt: true,
      _count: {
        select: { seekerSkills: true, jobSkills: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function mergeGroup(group: MergeGroup, apply: boolean) {
  const candidates = await findCandidates(group);
  if (candidates.length <= 1) {
    return {
      canonicalName: group.canonicalName,
      candidates,
      duplicateCount: 0,
      seekerReferencesMoved: 0,
      jobReferencesMoved: 0,
    };
  }

  const canonical = chooseCanonicalSkill(group.canonicalName, candidates);
  const duplicates = candidates.filter((skill) => skill.id !== canonical.id);

  let seekerReferencesMoved = 0;
  let jobReferencesMoved = 0;

  if (apply) {
    const canonicalSlug = slugifySkillName(group.canonicalName);
    await prisma.skill.update({
      where: { id: canonical.id },
      data: {
        name: group.canonicalName,
        slug: canonicalSlug,
        category: canonical.category === "Other" ? "Engineering" : canonical.category,
      },
    });

    for (const duplicate of duplicates) {
      seekerReferencesMoved += await moveSeekerSkillReferences(
        duplicate.id,
        canonical.id,
      );
      jobReferencesMoved += await moveJobSkillReferences(
        duplicate.id,
        canonical.id,
      );
      await prisma.skill.delete({ where: { id: duplicate.id } });
    }
  } else {
    seekerReferencesMoved = duplicates.reduce(
      (total, skill) => total + skill._count.seekerSkills,
      0,
    );
    jobReferencesMoved = duplicates.reduce(
      (total, skill) => total + skill._count.jobSkills,
      0,
    );
  }

  return {
    canonicalName: group.canonicalName,
    canonical: {
      id: canonical.id,
      name: canonical.name,
      slug: canonical.slug,
      refs: getReferenceCount(canonical),
    },
    duplicates: duplicates.map((skill) => ({
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      refs: getReferenceCount(skill),
    })),
    duplicateCount: duplicates.length,
    seekerReferencesMoved,
    jobReferencesMoved,
  };
}

async function main() {
  const apply = hasApplyFlag();
  const results = [];

  for (const group of MERGE_GROUPS) {
    results.push(await mergeGroup(group, apply));
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        results,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
