/*
 * AdminCompanyVerificationItem
 * Shape of a single company verification record returned by GET /api/admin/companies.
 * Represents a recruiter profile that has a Level 2 submission or is already verified.
 */
export interface AdminCompanyVerificationItem {
  id: string;
  companyName: string;
  website: string | null;
  companyVerified: boolean;
  companyVerifiedAt: string | null;
  companyLinkedInUrl: string | null;
  companyWorkEmail: string | null;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}
