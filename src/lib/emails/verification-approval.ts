import { sendEmail } from "@/lib/resend";

interface ApprovalEmailInput {
  to: string;
  name: string;
  score: number;
  profileSlug: string;
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
 * Includes a CTA to make their verified profile public from the dashboard.
 */
export async function sendApprovalEmail({
  to,
  name,
  score,
  profileSlug,
}: ApprovalEmailInput): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hiretivo.com";
  const safeName = escapeHtml(name);
  const safeProfileSlug = escapeHtml(profileSlug);
  const profileUrlText = safeProfileSlug
    ? `hiretivo.com/e/${safeProfileSlug}`
    : "your public Hiretivo profile";

  await sendEmail({
    from: "Hiretivo <noreply@hiretivo.com>",
    to,
    subject: "You're Hiretivo Verified - One step to go live",
    html: `<!DOCTYPE html>
<html>
<body style="font-family: Inter, sans-serif; background: #ffffff; color: #0a0a0a; max-width: 600px; margin: 0 auto; padding: 40px 24px;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">You're Hiretivo Verified</h1>
  <p style="color: #6b7280; margin-bottom: 24px;">Hi ${safeName},</p>
  <p>Great news - you've passed our engineer verification review. Your <strong>Hiretivo Score is ${score}/100</strong>.</p>
  <p>Your profile is ready but not yet visible to recruiters. To start getting discovered, make your profile public:</p>
  <div style="margin: 32px 0;">
    <a href="${appUrl}/seeker/dashboard" style="background: #7560ff; color: #ffffff; font-weight: 500; font-size: 14px; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">Make Profile Public</a>
  </div>
  <p style="color: #6b7280; font-size: 14px;">Once public, your profile will be visible at <strong>${profileUrlText}</strong> and discoverable by US/EU startups hiring remote engineers.</p>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">Your profile was evaluated using AI assistance as part of our verification process. The final decision was made by a human reviewer.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #9ca3af; font-size: 12px;">Hiretivo · hiretivo.com · <a href="mailto:admin@hiretivo.com" style="color: #9ca3af;">admin@hiretivo.com</a></p>
</body>
</html>`,
  });
}
