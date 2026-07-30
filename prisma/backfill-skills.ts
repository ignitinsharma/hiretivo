/**
 * backfill-skills
 * One-time script: purge low-quality jobs + write JobSkill + compute JobMatch.
 * Run: npx tsx prisma/backfill-skills.ts
 *
 * Phase 1 — close jobs from companies no longer in registry
 * Phase 2 — close open jobs that fail quality bar
 * Phase 3 — write JobSkill rows for surviving jobs with 0 skills
 * Phase 4 — compute JobMatch for all affected seekers
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ── Enums (inlined — no path aliases in scripts) ─────────────────────────────
const JobStatus = { OPEN: 'OPEN', CLOSED: 'CLOSED' } as const;
const SkillLevel = { INTERMEDIATE: 'INTERMEDIATE' } as const;
const LocationClass = {
  WORLDWIDE: 'worldwide', US_ONLY: 'us-only', EMEA: 'emea',
  INDIA: 'india', ONSITE: 'onsite',
} as const;
const JobType = { INTERNSHIP: 'INTERNSHIP' } as const;

// ── Company registry (inlined) ────────────────────────────────────────────────
const ACTIVE_COMPANIES = new Set([
  'OpenAI','Linear','Cursor','Supabase','PostHog','Replit','Sentry','Render',
  'Neon','Railway','Trigger.dev','Infisical','WorkOS','Warp','Modal','Poolside',
  'Resend','Runway','Ramp','Notion','Plaid',
  'Temporal','Sanity','Twenty','Mintlify',
  'Anthropic','Figma','Stripe','Datadog','GitLab','Discord','Gusto','Robinhood','Checkr',
  'Grafana Labs','Cloudflare','Elastic','MongoDB','Tailscale','Vercel',
]);

// ── Skill extractor (inlined) ─────────────────────────────────────────────────
const SKILL_ALIASES: Record<string, string[]> = {
  'Node.js': ['nodejs', 'node js', 'node.js'],
  React: ['reactjs', 'react.js'],
  PostgreSQL: ['postgres', 'psql'],
  Kubernetes: ['k8s'],
  JavaScript: ['vanilla js', 'es6', 'es2015', 'es6+'],
  TypeScript: ['ts', 'typescript'],
  'CI/CD': ['cicd'],
  'Machine Learning': ['ml'],
  'Large Language Models': ['llm', 'llms'],
  'Retrieval-Augmented Generation': ['rag'],
  'Prompt Engineering': ['prompting', 'prompt design'],
  'AI Agents': ['agentic'],
  'Computer Vision': ['cv'],
  'Natural Language Processing': ['nlp'],
  'Data Visualization': ['dataviz'],
  'A/B Testing': ['ab testing', 'split testing'],
  'Distributed Systems': ['distributed computing'],
  Microservices: ['micro-services', 'microsservices'],
  Kotlin: ['kotlin'],
  SwiftUI: ['swift ui'],
  'React Native': ['reactnative'],
  'Tailwind CSS': ['tailwind'],
  'Vue.js': ['vuejs', 'vue'],
  Angular: ['angular', 'angular.js', 'angularjs'],
  Svelte: ['svelte'],
  WebAssembly: ['wasm'],
  Serverless: ['server-less'],
  Observability: ['o11y', 'opentelemetry'],
  Accessibility: ['a11y'],
  'REST API': ['restful', 'rest apis', 'rest api'],
  GraphQL: ['gql'],
  'Next.js': ['nextjs', 'next.js'],
  'GitHub Actions': ['github actions', 'gh actions'],
  Terraform: ['terraform', 'tf'],
  Docker: ['docker', 'containerization', 'container'],
};

function extractSkillsFromText(text: string, skills: Array<{ id: string; name: string }>): string[] {
  const lowerText = text.toLowerCase();
  return skills
    .filter((skill) => {
      const aliases = SKILL_ALIASES[skill.name];
      if (aliases) {
        for (const alias of aliases) {
          if (lowerText.includes(alias)) return true;
        }
      }
      if (skill.name.length < 4) {
        const escaped = skill.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
      }
      return lowerText.includes(skill.name.toLowerCase());
    })
    .map((s) => s.name);
}

// ── Quality bar (inlined) ─────────────────────────────────────────────────────
const CORE_SKILLS = [
  'typescript', 'python', 'go', 'rust', 'react', 'node.js',
  'kubernetes', 'docker', 'aws', 'postgresql', 'machine learning',
];

const TECH_TITLE_KEYWORDS = [
  'software engineer','swe','frontend','front-end','front end','backend','back-end',
  'back end','fullstack','full-stack','full stack','devops','sre','site reliability',
  'data scientist','data engineer','data analyst','ml engineer','ai engineer',
  'machine learning','qa engineer','quality assurance','security engineer',
  'platform engineer','cloud engineer','infrastructure engineer','systems engineer',
  'network engineer','database engineer','mobile developer','ios engineer',
  'android engineer','web developer','web engineer','product engineer',
  'solutions architect','tech lead','engineering manager','staff engineer',
  'principal engineer','growth engineer','data infrastructure','product manager',
  'product designer','ux designer','ui designer','ux researcher','design engineer',
  'developer advocate','devrel',
];

const NON_TECH_TITLE_PATTERNS = [
  'sales development','account executive','account manager','channel sales',
  'channel partner','business development representative','bdr','sdr',
  'customer success manager','customer support','customer service',
  'talent acquisition','technical recruiter','recruiter','human resources',
  'people operations','people partner','office manager','executive assistant',
  'administrative assistant','content marketing','demand generation',
  'growth marketing','field marketing','financial analyst','accountant',
  'controller','payroll','legal counsel','paralegal','attorney',
  'operations manager','revenue operations',
];

const TECH_DEPARTMENTS = [
  'engineering','product','design','data','technology',
  'security','infrastructure','research','development',
];

const EXECUTIVE_PREFIXES = ['vp ','chief ','director of ','head of '];

function isTechRole(title: string, department: string | null, skills: string[]): boolean {
  const lowerTitle = title.toLowerCase().trim();
  if (TECH_TITLE_KEYWORDS.some((kw) => lowerTitle.includes(kw))) return true;
  if (department) {
    const lowerDept = department.toLowerCase();
    if (TECH_DEPARTMENTS.some((d) => lowerDept.includes(d))) return true;
  }
  const techCount = skills.filter((s) =>
    ['typescript','python','javascript','react','go','rust','java','kubernetes',
     'docker','aws','sql','node.js','html','css','c++','c#','ruby','php','swift',
     'kotlin','tensorflow','pytorch','git','terraform','ansible','graphql','redis',
     'postgresql','mongodb','linux','bash','shell','machine learning','deep learning',
     'nlp','data pipeline','ci/cd','microservices','react native','next.js','vue.js','angular',
    ].includes(s.toLowerCase()),
  ).length;
  return techCount >= 2;
}

function meetsQualityBar(
  title: string, description: string, department: string | null,
  skills: string[], locationClass: string | null | undefined,
  jobType: string, visaSponsored = false,
): boolean {
  if (!description || description.length < 100) return false;
  if (skills.length < 2) return false;
  if (!skills.some((s) => CORE_SKILLS.includes(s.toLowerCase()))) return false;
  if (!locationClass || locationClass === 'unknown') return false;
  if (locationClass === LocationClass.ONSITE) return false;
  if (locationClass === LocationClass.US_ONLY || locationClass === LocationClass.EMEA) return false;
  if (jobType === JobType.INTERNSHIP) return false;
  const lowerTitle = title.toLowerCase().trim();
  if (NON_TECH_TITLE_PATTERNS.some((p) => lowerTitle.includes(p))) return false;
  if (!isTechRole(title, department, skills)) return false;
  const isExec = EXECUTIVE_PREFIXES.some((p) => lowerTitle.startsWith(p));
  if (isExec && department) {
    if (!TECH_DEPARTMENTS.some((d) => department.toLowerCase().includes(d))) return false;
  } else if (isExec) {
    return false;
  }
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Loading skills...');
  const allSkills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const skillNameToId = new Map(allSkills.map((s) => [s.name, s.id]));
  console.log(`  ${allSkills.length} skills loaded`);

  // Phase 1: close jobs from dropped companies
  console.log('\nPhase 1: purging dropped companies...');
  const droppedJobs = await prisma.job.findMany({
    where: { status: JobStatus.OPEN, companyName: { notIn: [...ACTIVE_COMPANIES] } },
    select: { id: true },
  });
  const droppedIds = droppedJobs.map((j) => j.id);
  let purgedByCompany = 0;
  if (droppedIds.length > 0) {
    await Promise.all([
      prisma.jobSkill.deleteMany({ where: { jobId: { in: droppedIds } } }),
      prisma.jobMatch.deleteMany({ where: { jobId: { in: droppedIds } } }),
    ]);
    const r = await prisma.job.updateMany({
      where: { id: { in: droppedIds } },
      data: { status: JobStatus.CLOSED, closedAt: new Date() },
    });
    purgedByCompany = r.count;
  }
  console.log(`  Purged by company: ${purgedByCompany}`);

  // Phase 2: close jobs failing quality bar
  console.log('\nPhase 2: checking quality bar...');
  const openJobs = await prisma.job.findMany({
    where: { status: JobStatus.OPEN },
    select: { id: true, title: true, description: true, category: true, locationClass: true, jobType: true, visaSponsored: true },
  });
  console.log(`  ${openJobs.length} open jobs to check`);

  const failQualityIds: string[] = [];
  for (const job of openJobs) {
    const extracted = extractSkillsFromText(job.description ?? '', allSkills);
    if (!meetsQualityBar(job.title, job.description ?? '', job.category, extracted, job.locationClass, job.jobType, job.visaSponsored)) {
      failQualityIds.push(job.id);
    }
  }
  let purgedByQuality = 0;
  if (failQualityIds.length > 0) {
    await Promise.all([
      prisma.jobSkill.deleteMany({ where: { jobId: { in: failQualityIds } } }),
      prisma.jobMatch.deleteMany({ where: { jobId: { in: failQualityIds } } }),
    ]);
    const r = await prisma.job.updateMany({
      where: { id: { in: failQualityIds } },
      data: { status: JobStatus.CLOSED, closedAt: new Date() },
    });
    purgedByQuality = r.count;
  }
  console.log(`  Purged by quality: ${purgedByQuality}`);

  // Phase 3: write JobSkill for surviving jobs with 0 skills
  console.log('\nPhase 3: backfilling skills...');
  const jobsWithoutSkills = await prisma.job.findMany({
    where: { status: JobStatus.OPEN, skills: { none: {} } },
    select: { id: true, description: true },
  });
  console.log(`  ${jobsWithoutSkills.length} jobs need skills`);

  let skillsWritten = 0;
  const processedJobIds: string[] = [];

  for (const job of jobsWithoutSkills) {
    const extracted = extractSkillsFromText(job.description ?? '', allSkills);
    if (!extracted.some((s) => CORE_SKILLS.includes(s.toLowerCase())) || extracted.length < 2) continue;

    const skillIds = extracted.map((name) => skillNameToId.get(name)).filter((id): id is string => id !== undefined);
    if (skillIds.length === 0) continue;

    await prisma.jobSkill.createMany({
      data: skillIds.map((skillId) => ({ jobId: job.id, skillId, level: SkillLevel.INTERMEDIATE })),
      skipDuplicates: true,
    });
    skillsWritten += skillIds.length;
    processedJobIds.push(job.id);
    if (processedJobIds.length % 10 === 0) console.log(`  ... ${processedJobIds.length} jobs processed`);
  }
  console.log(`  Skills written: ${skillsWritten} across ${processedJobIds.length} jobs`);

  // Phase 4: compute JobMatch
  console.log('\nPhase 4: computing matches...');
  let matchesComputed = 0;
  const CHUNK = 20;

  for (let i = 0; i < processedJobIds.length; i += CHUNK) {
    const chunk = processedJobIds.slice(i, i + CHUNK);
    await Promise.allSettled(
      chunk.map(async (jobId) => {
        const jobSkills = await prisma.jobSkill.findMany({ where: { jobId }, select: { skillId: true } });
        if (jobSkills.length === 0) return;

        const jobSkillIds = jobSkills.map((js) => js.skillId);
        const seekerProfiles = await prisma.seekerProfile.findMany({
          where: { skills: { some: { skillId: { in: jobSkillIds } } } },
          select: { id: true, skills: { select: { skillId: true } } },
        });

        for (const sp of seekerProfiles) {
          const seekerSet = new Set(sp.skills.map((s) => s.skillId));
          const intersection = jobSkillIds.filter((id) => seekerSet.has(id)).length;
          const score = Math.round((intersection / jobSkillIds.length) * 100);
          if (score === 0) continue;

          await prisma.jobMatch.upsert({
            where: { jobId_seekerProfileId: { jobId, seekerProfileId: sp.id } },
            create: { jobId, seekerProfileId: sp.id, score },
            update: { score },
          });
          matchesComputed++;
        }
      }),
    );
    console.log(`  Chunk ${Math.floor(i / CHUNK) + 1}/${Math.ceil(processedJobIds.length / CHUNK)} done`);
  }
  console.log(`  Matches computed: ${matchesComputed}`);

  console.log('\n✅ Backfill complete');
  console.log({
    purgedByCompany,
    purgedByQuality,
    jobsBackfilled: processedJobIds.length,
    skillsWritten,
    matchesComputed,
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
