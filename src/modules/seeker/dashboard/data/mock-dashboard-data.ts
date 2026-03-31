import type { JobListItem } from '@/modules/jobs/types/job.types';

export const RECOMMENDED_JOBS: JobListItem[] = [
  {
    id: 'job-1',
    title: 'Senior Product Designer',
    companyName: 'Stripe',
    location: 'Remote',
    salaryRange: '$140k - $180k',
    matchScore: 98,
  },
  {
    id: 'job-2',
    title: 'Frontend Engineer',
    companyName: 'Clerk',
    location: 'Hybrid',
    salaryRange: '$120k - $155k',
    matchScore: 95,
  },
  {
    id: 'job-3',
    title: 'Backend Developer',
    companyName: 'Vercel',
    location: 'Remote',
    salaryRange: '$150k - $200k',
    matchScore: 92,
  },
  {
    id: 'job-4',
    title: 'UX Researcher',
    companyName: 'Airbnb',
    location: 'Remote',
    salaryRange: '$130k - $165k',
    matchScore: 89,
  },
  {
    id: 'job-5',
    title: 'Product Manager',
    companyName: 'Linear',
    location: 'Remote',
    salaryRange: '$160k - $210k',
    matchScore: 88,
  },
  {
    id: 'job-6',
    title: 'DevOps Engineer',
    companyName: 'Railway',
    location: 'Remote',
    salaryRange: '$145k - $190k',
    matchScore: 85,
  },
];

export const QUICK_STATS = [
  {
    id: 'applied',
    label: 'Applied',
    value: 3,
    icon: 'send',
    colorClass: 'text-orange-600 bg-orange-100',
  },
  {
    id: 'viewed',
    label: 'Viewed',
    value: 12,
    icon: 'visibility',
    colorClass: 'text-blue-600 bg-blue-100',
  },
  {
    id: 'interviews',
    label: 'Interviews',
    value: 1,
    icon: 'chat_bubble',
    colorClass: 'text-green-600 bg-green-100',
  },
];