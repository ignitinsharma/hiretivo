import { ApplicationStatus, JobStatus } from '@/constants/enums';

export interface RecruiterStats {
  activeJobs: number;
  totalApplicants: number;
  matchesThisWeek: number;
  interviewsScheduled: number;
}

export interface RecentApplicant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  position: string;
  matchScore: number;
  appliedDate: string;
  status: ApplicationStatus;
}

export interface UpcomingInterview {
  id: string;
  candidateName: string;
  position: string;
  date: string;
  time: string;
}

export interface PostedJob {
  id: string;
  title: string;
  department: string;
  status: JobStatus;
  applicants: number;
  matches: number;
  postedDate: string;
}

export interface ActivityItem {
  id: string;
  type: 'application' | 'interview' | 'shortlist' | 'rejection';
  candidateName: string;
  jobTitle: string;
  timestamp: string;
}

export const RECRUITER_STATS: RecruiterStats = {
  activeJobs: 12,
  totalApplicants: 248,
  matchesThisWeek: 47,
  interviewsScheduled: 8,
};

export const RECENT_APPLICANTS: RecentApplicant[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    position: 'Senior Frontend Developer',
    matchScore: 92,
    appliedDate: '2024-01-15',
    status: ApplicationStatus.SHORTLISTED,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    email: 'marcus.j@email.com',
    position: 'Full Stack Engineer',
    matchScore: 85,
    appliedDate: '2024-01-14',
    status: ApplicationStatus.REVIEWED,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    position: 'Senior Frontend Developer',
    matchScore: 78,
    appliedDate: '2024-01-13',
    status: ApplicationStatus.PENDING,
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@email.com',
    position: 'Backend Developer',
    matchScore: 71,
    appliedDate: '2024-01-12',
    status: ApplicationStatus.PENDING,
  },
  {
    id: '5',
    name: 'Lisa Wang',
    email: 'lisa.wang@email.com',
    position: 'Full Stack Engineer',
    matchScore: 65,
    appliedDate: '2024-01-11',
    status: ApplicationStatus.REVIEWED,
  },
];

export const UPCOMING_INTERVIEWS: UpcomingInterview[] = [
  {
    id: '1',
    candidateName: 'Sarah Chen',
    position: 'Senior Frontend Developer',
    date: 'Jan 16',
    time: '10:00 AM',
  },
  {
    id: '2',
    candidateName: 'Marcus Johnson',
    position: 'Full Stack Engineer',
    date: 'Jan 16',
    time: '2:00 PM',
  },
  {
    id: '3',
    candidateName: 'Emily Rodriguez',
    position: 'Senior Frontend Developer',
    date: 'Jan 17',
    time: '11:00 AM',
  },
  {
    id: '4',
    candidateName: 'James Wilson',
    position: 'Backend Developer',
    date: 'Jan 18',
    time: '3:30 PM',
  },
];

export const POSTED_JOBS: PostedJob[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    status: JobStatus.OPEN,
    applicants: 45,
    matches: 12,
    postedDate: '2024-01-10',
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    department: 'Engineering',
    status: JobStatus.OPEN,
    applicants: 38,
    matches: 8,
    postedDate: '2024-01-08',
  },
  {
    id: '3',
    title: 'Backend Developer',
    department: 'Engineering',
    status: JobStatus.PAUSED,
    applicants: 22,
    matches: 5,
    postedDate: '2024-01-05',
  },
  {
    id: '4',
    title: 'Product Designer',
    department: 'Design',
    status: JobStatus.DRAFT,
    applicants: 0,
    matches: 0,
    postedDate: '2024-01-02',
  },
];

export const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    type: 'application',
    candidateName: 'Sarah Chen',
    jobTitle: 'Senior Frontend Developer',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    type: 'application',
    candidateName: 'Marcus Johnson',
    jobTitle: 'Full Stack Engineer',
    timestamp: '4 hours ago',
  },
  {
    id: '3',
    type: 'application',
    candidateName: 'Emily Rodriguez',
    jobTitle: 'Senior Frontend Developer',
    timestamp: 'Yesterday',
  },
  {
    id: '4',
    type: 'application',
    candidateName: 'David Kim',
    jobTitle: 'Backend Developer',
    timestamp: 'Yesterday',
  },
  {
    id: '5',
    type: 'interview',
    candidateName: 'Sarah Chen',
    jobTitle: 'Senior Frontend Developer',
    timestamp: '2 days ago',
  },
];
