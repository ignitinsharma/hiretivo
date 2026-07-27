/*
 * How It Works page configuration for Hiretivo
 * 6-step journey deep dive + differentiator cards + CTA.
 */

export const HIW_HERO = {
  eyebrow: 'HOW IT WORKS',
  heading: 'From job link to offer — every step, explained.',
  subcopy:
    'Six steps. One platform. See exactly how Hiretivo turns a job listing into a tailored, tracked application — before you spend anything.',
} as const;

export const HIW_JOURNEY = [
  'Add',
  'Analyze',
  'Resume',
  'Style',
  'Apply',
  'Track',
] as const;

export interface HiwVisual {
  kind: 'browser' | 'plain' | 'before-after';
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface HiwStep {
  number: string;
  heading: string;
  body: string;
  bullets: readonly string[];
  visual: HiwVisual;
}

export const HIW_STEPS: readonly HiwStep[] = [
  {
    number: '01',
    heading: 'Add any job in seconds',
    body: 'Browse the curated feed or paste any job URL. Hiretivo parses the listing — title, company, skills, salary — and adds it to your pipeline.',
    bullets: [
      'Curated feed, refreshed daily',
      'Paste any link — we parse the rest',
    ],
    visual: {
      kind: 'browser',
      src: '/images/dashboard.png',
      alt: 'Hiretivo dashboard with recommended jobs',
      width: 1694,
      height: 929,
    },
  },
  {
    number: '02',
    heading: 'AI reads the job description',
    body: 'Every listing is broken down into skills, keywords, and requirements — matched against your profile before you write a single word.',
    bullets: [
      'Skill extraction from every job description',
      'Know your match before you apply',
    ],
    visual: {
      kind: 'plain',
      src: '/images/step-skills.png',
      alt: 'Job card showing extracted skills like React, Node.js, PostgreSQL, AWS',
      width: 320,
      height: 180,
    },
  },
  {
    number: '03',
    heading: 'Your resume, rewritten for the role',
    body: 'AI Rewrite strengthens verbs, adds quantified metrics, and mirrors the language of the job description. Every section stays editable — you approve every word.',
    bullets: [
      'Real before/after in one click',
      'You approve every word',
    ],
    visual: { kind: 'before-after' },
  },
  {
    number: '04',
    heading: 'Style it, then export',
    body: 'Pick a template, tune fonts and spacing, set an accent color. When it looks right, download a clean, ATS-safe PDF.',
    bullets: [
      'ATS-safe templates',
      'One-click PDF export',
    ],
    visual: {
      kind: 'browser',
      src: '/images/resume-engine.png',
      alt: 'Resume style editor with templates, fonts, and accent color controls',
      width: 1324,
      height: 1188,
    },
  },
  {
    number: '05',
    heading: 'Apply, and it’s logged',
    body: 'Apply on the company’s site, then mark it applied — the card moves itself through your pipeline. No spreadsheets, no forgotten follow-ups.',
    bullets: [
      'One click to log an application',
      'Every application accounted for',
    ],
    visual: {
      kind: 'plain',
      src: '/images/step-apply.png',
      alt: 'Job card with Pass and Apply buttons, salary, and job type',
      width: 320,
      height: 140,
    },
  },
  {
    number: '06',
    heading: 'Watch it move to offer',
    body: 'Drag cards through Applied, Interviewing, and Offer. Weekly stats show whether your search is actually working.',
    bullets: [
      'Visual pipeline, zero guesswork',
      'Progress at a glance',
    ],
    visual: {
      kind: 'browser',
      src: '/images/kanban.png',
      alt: 'Kanban application tracker with stages from applied to offer',
      width: 1536,
      height: 1024,
    },
  },
];

export const HIW_WHY = {
  eyebrow: 'WHY HIRETIVO',
  heading: 'Built to get you hired, not just organized.',
  cards: [
    {
      title: 'ATS-optimized, always',
      description:
        'Every resume is structured to pass applicant tracking systems — keywords, formatting, and all.',
    },
    {
      title: 'Fully editable',
      description:
        'AI drafts, you decide. Rewrite, tweak, or restyle any section before it goes out.',
    },
    {
      title: 'Everything in one place',
      description:
        'Jobs, resumes, cover letters, and tracking — no tabs, no spreadsheets, no lost threads.',
    },
    {
      title: 'Free to start',
      description:
        '2 tailored resumes every month, free. No credit card, no trial countdown.',
    },
  ],
} as const;

export const HIW_CTA = {
  eyebrow: 'Try it on a real job',
  heading: '2 free AI resumes. Every month.',
  subheading: 'No credit card.',
  body: 'Two tailored, ATS-ready resumes every month — zero commitment. Renews automatically.',
  buttonText: 'Start Free',
  buttonHref: '/seeker/register',
} as const;
