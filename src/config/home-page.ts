/*
 * Home page configuration for Hiretivo
 * Seeker-first: hero stats, how-it-works steps, feature cards, testimonials, CTA.
 */

/**
 * Quality-signal stats shown in the hero section
 */
export const HOMEPAGE_STATS = [
  { value: '10k+', label: 'Resumes generated' },
  { value: '5k+', label: 'Jobs indexed' },
  { value: '2k+', label: 'Placements tracked' },
  { value: '98%', label: 'ATS pass rate' },
] as const;

/**
 * Steps for the How It Works section
 */
export const SEEKER_STEPS = [
  {
    number: '01',
    title: 'Find Jobs',
    description:
      'Browse our curated feed or paste any job URL to add it to your list.',
  },
  {
    number: '02',
    title: 'Generate Resume',
    description:
      'AI builds a tailored, ATS-optimized resume. Edit any section before downloading.',
  },
  {
    number: '03',
    title: 'Apply & Track',
    description:
      'Apply externally, mark your progress. Every application tracked in one kanban board.',
  },
] as const;

/**
 * Feature cards for the Features section
 */
export const SEEKER_FEATURES = [
  {
    title: 'AI Resume Engine',
    description:
      'Paste a job link or description. Get a tailored resume optimized for that role in seconds.',
  },
  {
    title: 'Editable Preview',
    description:
      'Every section is editable — tweak, reorder, preview as PDF before you apply.',
  },
  {
    title: 'Unified Tracker',
    description:
      'A kanban board for your entire job search. From saved to applied to interviewed to offer.',
  },
] as const;

/**
 * Seeker testimonials for social proof
 */
export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  title: string;
  initials: string;
  stars: number;
}

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    id: 'seek-test-1',
    quote:
      'Generated a tailored resume in 30 seconds and got an interview invite the next week. Game changer.',
    name: 'Ananya P.',
    title: 'Frontend Engineer',
    initials: 'AP',
    stars: 5,
  },
  {
    id: 'seek-test-2',
    quote:
      'The kanban tracker saved my job search. No more spreadsheets or lost applications.',
    name: 'Rahul K.',
    title: 'Backend Engineer',
    initials: 'RK',
    stars: 5,
  },
  {
    id: 'seek-test-3',
    quote:
      'Finally stopped sending the same generic resume everywhere. Each one is tailored and ATS-ready.',
    name: 'Sneha M.',
    title: 'Full Stack Engineer',
    initials: 'SM',
    stars: 5,
  },
] as const;

/**
 * Trust items for the CTA section
 */
export const TRUST_ITEMS = [
  { label: '100% Free', icon: 'shield' },
  { label: 'No Credit Card', icon: 'credit-card' },
  { label: '5-min Setup', icon: 'zap' },
] as const;
