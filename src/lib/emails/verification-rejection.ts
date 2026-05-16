import { format } from "date-fns";
import {
  REJECTION_REASONS,
  type RejectionReasonKey,
} from "@/constants/verification-reasons";
import { sendEmail } from "@/lib/resend";

interface RejectionEmailInput {
  to: string;
  name: string;
  reasons: RejectionReasonKey[];
  customNote?: string;
  reapplyAfter: Date;
}

const FIX_INSTRUCTIONS: Record<RejectionReasonKey, string> = {
  no_public_repos: "Push at least 3 public repositories showcasing your real work.",
  forks_only:
    "Contribute original projects, not just forks. At least 2 repos should be your own work.",
  inactive_github:
    "Make a commit in the last 6 months. Even small improvements to existing projects count.",
  no_production_code:
    "Add projects that show production patterns: tests, error handling, proper structure.",
  skills_mismatch:
    "Ensure your listed skills match the languages/frameworks in your GitHub repos.",
  bio_missing:
    "Write a bio of at least 100 words describing your background and what you build.",
  no_work_experience: "Add your work history in Settings > Profile > Work Experience.",
  no_projects: "Describe your top 3 projects with name, what they do, and a link.",
  no_real_project: "Include at least one project used by real users or deployed to production.",
  vague_descriptions:
    "Rewrite project descriptions to explain the problem solved, tech used, and your role.",
  broken_links: "Fix or remove broken project links before reapplying.",
  name_mismatch:
    "Your legal name on Hiretivo should match the name on your GitHub profile.",
  incomplete_profile:
    "Complete all profile sections: bio, work experience, skills, and projects.",
  too_junior:
    "Build more production experience. We recommend reapplying after 2+ years of professional work.",
  unprofessional_content:
    "Remove or update linked content that could distract from your professional profile.",
};

const REJECTION_REASON_LABELS = new Map(
  REJECTION_REASONS.map((reason) => [reason.key, reason.label]),
);

/*
 * escapeHtml
 * Escapes user-controlled text before interpolation into email HTML.
 * Returns an HTML-safe string for names, labels, and reviewer notes.
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
 * sendRejectionEmail
 * Sends the verification rejection email with per-reason fix instructions.
 * Includes the reapply date and an optional reviewer note.
 */
export async function sendRejectionEmail({
  to,
  name,
  reasons,
  customNote,
  reapplyAfter,
}: RejectionEmailInput): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hiretivo.com";
  const reapplyDate = format(reapplyAfter, "MMMM d, yyyy");
  const safeName = escapeHtml(name);

  const reasonsHtml = reasons
    .map((key) => {
      const label = escapeHtml(REJECTION_REASON_LABELS.get(key) ?? key);
      const fix = escapeHtml(FIX_INSTRUCTIONS[key]);

      return `<li style="margin-bottom: 12px;"><strong>${label}</strong><br><span style="color: #6b7280; font-size: 14px;">${fix}</span></li>`;
    })
    .join("");

  const customNoteHtml = customNote
    ? `<p style="background: #f9fafb; border-left: 3px solid #e5e7eb; padding: 12px; color: #6b7280; margin: 16px 0;">${escapeHtml(customNote)}</p>`
    : "";

  await sendEmail({
    from: "Hiretivo <noreply@hiretivo.com>",
    to,
    subject: "Your Hiretivo Verification - Action Required",
    html: `<!DOCTYPE html>
<html>
<body style="font-family: Inter, sans-serif; background: #ffffff; color: #0a0a0a; max-width: 600px; margin: 0 auto; padding: 40px 24px;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Verification Update</h1>
  <p style="color: #6b7280;">Hi ${safeName},</p>
  <p>We reviewed your Hiretivo verification submission. We couldn't approve it at this time - here's what to improve:</p>
  <ul style="padding-left: 20px; margin: 24px 0;">${reasonsHtml}</ul>
  ${customNoteHtml}
  <p>You can reapply after <strong>${reapplyDate}</strong>. Update your profile and GitHub, then come back.</p>
  <div style="margin: 32px 0;">
    <a href="${appUrl}/seeker/settings" style="background: #7560ff; color: #ffffff; font-weight: 500; font-size: 14px; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">Update Profile</a>
  </div>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">Your profile was evaluated using AI assistance as part of our verification process. The final decision was made by a human reviewer. If you believe this decision is incorrect, reply to this email.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #9ca3af; font-size: 12px;">Hiretivo · hiretivo.com</p>
</body>
</html>`,
  });
}
