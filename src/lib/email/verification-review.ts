import { sendEmail } from "@/lib/resend";
import { getAppUrl } from "@/lib/config";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Hiretivo <noreply@hiretivo.com>";

interface SendVerificationReviewEmailInput {
  toEmail: string;
  recipientName: string | null;
  approved: boolean;
  notes: string | null;
}

/*
 * sendVerificationReviewEmail
 * Sends an approval or rejection email to a seeker after an admin review decision.
 * Non-fatal: callers should fire-and-forget with .catch() to log errors.
 * @param toEmail - Recipient email address
 * @param recipientName - Seeker's display name for personalized greeting
 * @param approved - true = VERIFIED, false = REJECTED
 * @param notes - Optional reviewer notes included in the email body
 */
export async function sendVerificationReviewEmail({
  toEmail,
  recipientName,
  approved,
  notes,
}: SendVerificationReviewEmailInput): Promise<void> {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const safeName = recipientName?.trim() ? esc(recipientName.trim()) : null;
  const safeNotes = notes ? esc(notes) : null;
  const greeting = safeName ? `Hi ${safeName},` : "Hi there,";

  const subject = approved
    ? "Congratulations — your Hiretivo verification was approved!"
    : "Your Hiretivo verification was not approved";

  const approvedUrl = `${getAppUrl()}/seeker/profile`;
  const rejectedUrl = `${getAppUrl()}/seeker/onboarding`;

  const approvedHtml = `
    <p>We reviewed your profile and are pleased to confirm that you have been <strong>verified</strong> on Hiretivo.</p>
    <p>Your profile is now eligible to appear to startups actively hiring verified engineers.</p>
    <p>
      <a href="${approvedUrl}" style="display:inline-block;padding:12px 24px;background:#7560ff;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
        View your profile
      </a>
    </p>
  `;

  const rejectedHtml = `
    <p>Thank you for submitting your profile for verification. After our review, we were unable to approve your verification at this time.</p>
    ${safeNotes ? `<p><strong>Reviewer notes:</strong> ${safeNotes}</p>` : ""}
    <p>You may update your profile and resubmit for review once you have addressed any gaps.</p>
    <p>
      <a href="${rejectedUrl}" style="display:inline-block;padding:12px 24px;background:#7560ff;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
        Update your profile
      </a>
    </p>
  `;

  const approvedText = `${greeting}\n\nYour Hiretivo profile has been verified. You are now eligible to appear to startups worldwide actively hiring. Visit your profile: ${approvedUrl}`;
  const rejectedText = `${greeting}\n\nWe were unable to approve your Hiretivo verification at this time.${notes ? ` Reviewer notes: ${notes}` : ""} You may update your profile and resubmit. Visit your profile: ${rejectedUrl}`;

  await sendEmail({
    from: FROM_EMAIL,
    to: toEmail,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <p style="color:#0a0a0a;font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
        ${approved ? approvedHtml : rejectedHtml}
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:16px 0 0;">The Hiretivo team</p>
      </div>
    `,
    text: approved ? approvedText : rejectedText,
  });
}
