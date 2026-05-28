/*
 * Home page configuration for Hiretivo
 * Exports quality-signal stats and mock engineer cards for the marketplace
 * HOMEPAGE_STATS: quality metrics that differentiate the verified engineer marketplace
 * MOCK_ENGINEER_CARDS: sample blurred engineer profiles shown on homepage hero (no DB call)
 */

/**
 * Quality-signal stats that highlight the verified marketplace advantage
 * These replace old job-board metrics (job count, seeker count)
 */
export const HOMEPAGE_STATS = [
  { value: '< 30%', label: 'Approval rate' },
  { value: '48 hrs', label: 'Review SLA per engineer' },
  { value: 'USD', label: 'Salary always visible both sides' },
  { value: '7 days', label: 'Avg time to hire' },
] as const;

/**
 * Mock engineer card displayed in homepage hero
 * Used for visual preview of engineer profiles without making DB calls
 */
export interface MockEngineerCard {
  id: string;
  firstName: string;
  lastInitial: string;
  isVerified: boolean;
  hiretivoScore: number;
  role: string;
  yearsExp: number;
  skills: readonly string[];
  salaryMin: number;
  salaryMax: number;
  timezoneOverlapHours: number;
  availableFrom: string;
}

/**
 * Sample engineer cards shown on homepage
 * Demonstrates verified engineer quality and marketplace positioning
 */
export const MOCK_ENGINEER_CARDS: readonly MockEngineerCard[] = [
  {
    id: 'mock-1',
    firstName: 'Priya',
    lastInitial: 'S.',
    isVerified: true,
    hiretivoScore: 84,
    role: 'Senior React Engineer',
    yearsExp: 6,
    skills: ['React', 'Node.js', 'AWS', 'PostgreSQL'],
    salaryMin: 80000,
    salaryMax: 120000,
    timezoneOverlapHours: 5,
    availableFrom: 'Jun 2026',
  },
  {
    id: 'mock-2',
    firstName: 'Arjun',
    lastInitial: 'M.',
    isVerified: true,
    hiretivoScore: 91,
    role: 'Full-Stack Engineer',
    yearsExp: 8,
    skills: ['TypeScript', 'Python', 'GCP', 'Redis'],
    salaryMin: 100000,
    salaryMax: 150000,
    timezoneOverlapHours: 6,
    availableFrom: 'Immediate',
  },
  {
    id: 'mock-3',
    firstName: 'Kavya',
    lastInitial: 'R.',
    isVerified: true,
    hiretivoScore: 77,
    role: 'Backend Engineer',
    yearsExp: 4,
    skills: ['Go', 'Kubernetes', 'PostgreSQL', 'gRPC'],
    salaryMin: 70000,
    salaryMax: 100000,
    timezoneOverlapHours: 4,
    availableFrom: 'Jul 2026',
  },
] as const;
