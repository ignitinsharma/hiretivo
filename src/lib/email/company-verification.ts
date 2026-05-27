import { sendEmail } from "@/lib/resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Hiretivo <noreply@hiretivo.com>";

interface CompanyVerificationAdminEmailInput {
  recruiterName: string | null;
  companyName: string;
  companyLinkedInUrl: string;
  companyWorkEmail: string;
}

/*
 * sendCompanyVerificationAdminEmail
 * Notifies the admin that a recruiter submitted a Level 2 company verification request.
 * Sends to ADMIN_EMAIL with the recruiter's submitted LinkedIn URL, work email, and a
 * direct link to the admin review queue at /admin/companies.
 * Returns early without error if ADMIN_EMAIL is not configured.
 * @param recruiterName - Display name of the recruiter (may be null)
 * @param companyName - Company name from the recruiter's profile
 * @param companyLinkedInUrl - LinkedIn company URL submitted by the recruiter
 * @param companyWorkEmail - Work email submitted by the recruiter for admin review
 */
export async function sendCompanyVerificationAdminEmail({
  recruiterName,
  companyName,
  companyLinkedInUrl,
  companyWorkEmail,
}: CompanyVerificationAdminEmailInput): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  const reviewUrl = `${APP_URL}/admin/companies`;
  const name = recruiterName?.trim() || "A recruiter";
  await sendEmail({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `Company verification request: ${companyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New company verification request</h2>
        <p>${name} submitted a Level 2 verification for <strong>${companyName}</strong>.</p>
        <p><strong>LinkedIn:</strong> ${companyLinkedInUrl}</p>
        <p><strong>Work email:</strong> ${companyWorkEmail}</p>
        <p><a href="${reviewUrl}" style="display:inline-block;padding:12px 24px;background:#7560ff;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Review request</a></p>
      </div>
    `,
    text: `New company verification request from ${name} for ${companyName}. LinkedIn: ${companyLinkedInUrl}. Work email: ${companyWorkEmail}. Review: ${reviewUrl}`,
  });
}
