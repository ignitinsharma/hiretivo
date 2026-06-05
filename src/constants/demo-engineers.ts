/*
 * DEMO_ENGINEERS
 * Static demo engineer profiles shown to FREE-plan recruiters on the talent pool page.
 * Used to demonstrate product value before paywall — full names are intentionally visible
 * (contrast with real blurred cards where only first name + last initial shows).
 * Per D-01, D-02: exactly 6 profiles, static constant (not from DB).
 */

export interface DemoEngineerProfile {
  id: string;
  name: string;
  headline: string;
  skills: string[];
  salaryRange: string;
  timezoneOverlap: string;
  availability: string;
  seekingStatus: 'ACTIVELY_LOOKING' | 'OPEN_TO_OFFERS';
  yearsExperience: number;
}

export const DEMO_ENGINEERS: DemoEngineerProfile[] = [
  {
    id: 'demo-1',
    name: 'Priya Sharma',
    headline: 'Senior React Engineer · 6 yrs',
    skills: ['React', 'Node.js', 'AWS', 'PostgreSQL'],
    salaryRange: '$80k–$120k/yr',
    timezoneOverlap: '6+ hrs US overlap',
    availability: 'Available immediately',
    seekingStatus: 'ACTIVELY_LOOKING',
    yearsExperience: 6,
  },
  {
    id: 'demo-2',
    name: 'Rahul Mehta',
    headline: 'Full-Stack Engineer · 4 yrs',
    skills: ['Python', 'Django', 'PostgreSQL', 'Redis'],
    salaryRange: '$60k–$90k/yr',
    timezoneOverlap: '5+ hrs US overlap',
    availability: 'Available Jun 2026',
    seekingStatus: 'OPEN_TO_OFFERS',
    yearsExperience: 4,
  },
  {
    id: 'demo-3',
    name: 'Ananya Krishnan',
    headline: 'Backend Engineer · 5 yrs',
    skills: ['Go', 'Kubernetes', 'GCP', 'gRPC'],
    salaryRange: '$90k–$130k/yr',
    timezoneOverlap: '4+ hrs EU overlap',
    availability: 'Available Jul 2026',
    seekingStatus: 'OPEN_TO_OFFERS',
    yearsExperience: 5,
  },
  {
    id: 'demo-4',
    name: 'Vikram Nair',
    headline: 'Java Microservices Engineer · 7 yrs',
    skills: ['Java', 'Spring Boot', 'Kafka', 'AWS'],
    salaryRange: '$85k–$125k/yr',
    timezoneOverlap: '5+ hrs US overlap',
    availability: 'Available immediately',
    seekingStatus: 'ACTIVELY_LOOKING',
    yearsExperience: 7,
  },
  {
    id: 'demo-5',
    name: 'Sneha Patel',
    headline: 'Mobile Engineer · 3 yrs',
    skills: ['Flutter', 'Dart', 'Firebase', 'REST APIs'],
    salaryRange: '$55k–$80k/yr',
    timezoneOverlap: '3+ hrs US overlap',
    availability: 'Available Jun 2026',
    seekingStatus: 'OPEN_TO_OFFERS',
    yearsExperience: 3,
  },
  {
    id: 'demo-6',
    name: 'Arjun Desai',
    headline: 'TypeScript / Next.js Engineer · 4 yrs',
    skills: ['TypeScript', 'Next.js', 'Prisma', 'Tailwind'],
    salaryRange: '$70k–$100k/yr',
    timezoneOverlap: '6+ hrs US overlap',
    availability: 'Available immediately',
    seekingStatus: 'ACTIVELY_LOOKING',
    yearsExperience: 4,
  },
] as const;

/** Count of demo profiles — used by TalentPoolClient mix-mode logic. */
export const DEMO_THRESHOLD = 6;
