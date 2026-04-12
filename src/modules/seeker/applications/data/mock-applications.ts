import { ApplicationStatus } from '@/constants/enums';
import type { SeekerApplicationItem } from '../types/application.types';

export const MOCK_APPLICATIONS: SeekerApplicationItem[] = [
  {
    id: 'app-1',
    jobId: 'job-1',
    jobTitle: 'Senior Product Designer',
    companyName: 'TechVision Inc',
    status: ApplicationStatus.INTERVIEW,
    appliedAt: 'Oct 12',
  },
  {
    id: 'app-2',
    jobId: 'job-2',
    jobTitle: 'UX Researcher',
    companyName: 'Global Nexus',
    status: ApplicationStatus.REVIEWING,
    appliedAt: 'Oct 10',
  },
  {
    id: 'app-3',
    jobId: 'job-3',
    jobTitle: 'Frontend Developer',
    companyName: 'Creative Flow',
    status: ApplicationStatus.APPLIED,
    appliedAt: 'Oct 05',
  },
  {
    id: 'app-4',
    jobId: 'job-4',
    jobTitle: 'Product Manager',
    companyName: 'Horizon Soft',
    status: ApplicationStatus.REJECTED,
    appliedAt: 'Sep 28',
  },
  {
    id: 'app-5',
    jobId: 'job-5',
    jobTitle: 'DevOps Engineer',
    companyName: 'Cloud Nine',
    status: ApplicationStatus.INTERVIEW,
    appliedAt: 'Sep 15',
  },
  {
    id: 'app-6',
    jobId: 'job-6',
    jobTitle: 'Back-end Developer',
    companyName: 'Skyline Solutions',
    status: ApplicationStatus.REVIEWING,
    appliedAt: 'Sep 12',
  },
];
