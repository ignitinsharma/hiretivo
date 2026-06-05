/*
 * Home page configuration for Hiretivo
 * Exports quality-signal stats, mock engineer cards, featured engineers, and testimonials.
 * HOMEPAGE_STATS: quality metrics shown in hero inline stats
 * STATS_BAR: full-width stats bar data with icons
 * MOCK_ENGINEER_CARDS: blurred hero preview cards (no DB call)
 * FEATURED_ENGINEERS: verified engineer showcase cards
 * TESTIMONIALS: social proof quotes from hiring managers
 */

/**
 * Quality-signal stats shown inline in the hero section
 */
export const HOMEPAGE_STATS = [
  { value: '< 30%', label: 'Approval rate' },
  { value: '48 hrs', label: 'Review SLA' },
  { value: 'USD', label: 'Salary always visible' },
  { value: '7 days', label: 'Avg time to hire' },
] as const;

/**
 * Stats bar section — full-width 4-column stat band below hero
 */
export const STATS_BAR = [
  { icon: 'shield', value: '500+', label: 'Verified Engineers' },
  { icon: 'clock', value: '48 HRS', label: 'Review SLA' },
  { icon: 'dollar', value: 'USD', label: 'Salary Transparency' },
  { icon: 'calendar', value: '7 Days', label: 'Avg Time to Hire' },
] as const;

/**
 * Mock engineer card interface for homepage hero previews
 */
export interface MockEngineerCard {
  id: string;
  displayName: string;
  firstName: string;
  lastInitial: string;
  image?: string | null;
  isVerified: boolean;
  role: string;
  yearsExp: number;
  skills: readonly string[];
  salaryMin: number;
  salaryMax: number;
  availableFrom: string;
}

/**
 * Sample hero preview cards — blurred to tease the talent pool
 */
export const MOCK_ENGINEER_CARDS: readonly MockEngineerCard[] = [
  {
    id: 'mock-1',
    displayName: 'Arjun Nair',
    firstName: 'Arjun',
    lastInitial: 'N.',
    isVerified: true,
    role: 'Senior React Engineer',
    yearsExp: 7,
    skills: ['React', 'Node.js', 'AWS', 'TypeScript'],
    salaryMin: 90000,
    salaryMax: 120000,
    availableFrom: 'Available Now',
  },
  {
    id: 'mock-2',
    displayName: 'Priya Sharma',
    firstName: 'Priya',
    lastInitial: 'S.',
    isVerified: true,
    role: 'Full Stack Engineer',
    yearsExp: 6,
    skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
    salaryMin: 70000,
    salaryMax: 95000,
    availableFrom: 'Available Now',
  },
  {
    id: 'mock-3',
    displayName: 'Rahul Verma',
    firstName: 'Rahul',
    lastInitial: 'V.',
    isVerified: true,
    role: 'Backend Engineer',
    yearsExp: 5,
    skills: ['Node.js', 'Express', 'MongoDB', 'AWS'],
    salaryMin: 60000,
    salaryMax: 85000,
    availableFrom: 'Available Now',
  },
] as const;

/**
 * Featured engineer interface for the verified engineer showcase section
 */
export interface FeaturedEngineer {
  id: string;
  name: string;
  image?: string | null;
  yearsExp: number;
  isVerified: boolean;
  role: string;
  location: string;
  locationFlag: string;
  skills: readonly string[];
  salaryMin: number;
  salaryMax: number;
  initials: string;
}

/**
 * Featured verified engineers shown in dedicated showcase section
 */
export const FEATURED_ENGINEERS: readonly FeaturedEngineer[] = [
  {
    id: 'feat-1',
    name: 'Aman Siddiqui',
    yearsExp: 7,
    isVerified: true,
    role: 'Senior Full Stack Engineer',
    location: 'Bengaluru, India',
    locationFlag: '🇮🇳',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'AWS'],
    salaryMin: 80000,
    salaryMax: 110000,
    initials: 'AS',
  },
  {
    id: 'feat-2',
    name: 'Priya Sharma',
    yearsExp: 6,
    isVerified: true,
    role: 'Full Stack Engineer',
    location: 'India',
    locationFlag: '🇮🇳',
    skills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Redis'],
    salaryMin: 70000,
    salaryMax: 100000,
    initials: 'PS',
  },
  {
    id: 'feat-3',
    name: 'Rohit Kumar',
    yearsExp: 5,
    isVerified: true,
    role: 'DevOps Engineer',
    location: 'Pune, India',
    locationFlag: '🇮🇳',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    salaryMin: 65000,
    salaryMax: 95000,
    initials: 'RK',
  },
] as const;

/**
 * Testimonial interface for the social proof section
 */
export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  image?: string | null;
  title: string;
  initials: string;
  stars: number;
}

/**
 * Hiring manager testimonials for the "Hiring teams love Hiretivo" section
 */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    id: 'test-1',
    quote:
      'We hired a senior backend engineer in 4 days. The verified profile context saved us 3 rounds of screening.',
    name: 'Sarah K.',
    title: 'CTO at a fintech startup',
    initials: 'SK',
    stars: 5,
  },
  {
    id: 'test-2',
    quote:
      'No fluff. Every profile is real, salary is upfront, and engineers are actually available.',
    name: 'Marcus D.',
    title: 'Engineering Manager',
    initials: 'MD',
    stars: 5,
  },
  {
    id: 'test-3',
    quote:
      'Best hiring experience for remote Indian talent. Far better than Upwork or Toptal.',
    name: 'Priya M.',
    title: 'Head of Engineering',
    initials: 'PM',
    stars: 5,
  },
] as const;
