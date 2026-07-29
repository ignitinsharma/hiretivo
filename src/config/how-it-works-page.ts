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
  'Add Job',
  'Review & Tailor',
  'Generate',
  'Style',
  'Mark Applied',
  'Track',
] as const;

export interface HiwDualImage {
  src: string;
  alt: string;
  label: string;
  width: number;
  height: number;
}

export interface HiwVisual {
  kind: 'browser' | 'plain' | 'before-after' | 'dual';
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  images?: readonly HiwDualImage[];
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
    body: 'Paste a job URL or drop in the full description. Hiretivo parses the listing — title, company, skills, salary — and gets it ready for tailoring.',
    bullets: [
      'Paste any job URL — we fetch the details',
      'Or paste the description — same result',
    ],
    visual: {
      kind: 'dual',
      images: [
        {
          src: '/images/fetchmodel.png',
          alt: 'Add Custom Job modal with Paste URL tab selected',
          label: 'Paste any URL',
          width: 1124,
          height: 694,
        },
        {
          src: '/images/fetchmodel1.png',
          alt: 'Add Custom Job modal with Paste Description tab selected',
          label: 'Paste the description',
          width: 1068,
          height: 968,
        },
      ],
    },
  },
  {
    number: '02',
    heading: 'Review the extracted details',
    body: 'Hiretivo pulls the role, company, and every skill out of the job description — you confirm it looks right before the AI writes a single word.',
    bullets: [
      'Skills and keywords extracted automatically',
      'Confirm or edit before generating',
    ],
    visual: {
      kind: 'plain',
      src: '/images/fetchpreview.png',
      alt: 'Job preview showing extracted skills like TypeScript, React, and GraphQL with the full description',
      width: 1086,
      height: 1118,
    },
  },
  {
    number: '03',
    heading: 'Generate a tailored resume',
    body: 'AI Rewrite strengthens verbs, adds quantified metrics, and mirrors the language of the job description — with the full job context visible beside your resume while it writes.',
    bullets: [
      'Job description always in view',
      'Real-time generation, no waiting rooms',
    ],
    visual: {
      kind: 'plain',
      src: '/images/genrating_resume.png',
      alt: 'Resume generating with the job description panel on the left and a live preview on the right',
      width: 2304,
      height: 1396,
    },
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
    heading: 'Mark it applied — it’s logged',
    body: 'Apply on the company’s site, then tap "I have applied" — the card moves itself through your pipeline. No spreadsheets, no forgotten follow-ups.',
    bullets: [
      'One click to log an application',
      'Every application accounted for',
    ],
    visual: {
      kind: 'plain',
      src: '/images/i_have_applied.png',
      alt: 'Job card with the I have applied button and a rejection feedback option',
      width: 812,
      height: 272,
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
