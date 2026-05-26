import { sendEmail } from "@/lib/resend";

interface ApprovalEmailInput {
  to: string;
  name: string;
  score: number;
}

/*
 * escapeHtml
 * Escapes user-controlled text before interpolation into email HTML.
 * Returns an HTML-safe string for names and profile fragments.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/*
 * sendApprovalEmail
 * Sends the Hiretivo Verified approval email to the engineer.
 * Explains Talent Pool discovery eligibility after approval.
 */
export async function sendApprovalEmail({
  to,
  name,
  score,
}: ApprovalEmailInput): Promise<void> {
  const safeName = escapeHtml(name);

  await sendEmail({
    from: "Hiretivo <noreply@hiretivo.com>",
    to,
    subject: "You're Hiretivo Verified",
    html: `<!DOCTYPE html>
<html>
<body style="font-family: Inter, sans-serif; background: #ffffff; color: #0a0a0a; max-width: 600px; margin: 0 auto; padding: 40px 24px;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">You're Hiretivo Verified</h1>
  <p style="color: #6b7280; margin-bottom: 24px;">Hi ${safeName},</p>
  <p>Great news - you've passed our engineer verification review. Your <strong>Hiretivo Score is ${score}/100</strong>.</p>
  <p>You are now eligible for recruiter discovery in the Hiretivo Talent Pool. Recruiters on paid plans can unlock your contact details when they want to start a hiring conversation.</p>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">Your profile was evaluated using AI assistance as part of our verification process. The final decision was made by a human reviewer.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #9ca3af; font-size: 12px;">Hiretivo · hiretivo.com · <a href="mailto:admin@hiretivo.com" style="color: #9ca3af;">admin@hiretivo.com</a></p>
</body>
</html>`,
  });
}
