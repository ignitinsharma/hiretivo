export interface JobListItem {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  location: string;
  salaryRange: string;
  matchScore?: number;
  tags?: string[];
  postedAt?: string;
}