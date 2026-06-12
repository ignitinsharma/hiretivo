import type { Prisma, Skill } from "@prisma/client";

import {
  slugifySkillName,
  uniqueCanonicalSkillNames,
} from "@/lib/skills/canonicalize";

/*
 * resolveSkillNames
 * Canonicalizes visible skill names, dedupes them, and resolves each to a Skill row.
 * Creates missing skills so onboarding can persist exactly what the user selected.
 */
export async function resolveSkillNames(
  tx: Prisma.TransactionClient,
  names: string[],
): Promise<Skill[]> {
  const canonicalNames = uniqueCanonicalSkillNames(names);
  const skills: Skill[] = [];

  for (const name of canonicalNames) {
    const slug = slugifySkillName(name);
    const existingSkill = await tx.skill.findFirst({
      where: {
        OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
      },
      orderBy: { createdAt: "asc" },
    });

    if (existingSkill) {
      skills.push(existingSkill);
      continue;
    }

    const createdSkill = await tx.skill.create({
      data: {
        name,
        slug,
        category: "Other",
      },
    });
    skills.push(createdSkill);
  }

  return skills;
}
