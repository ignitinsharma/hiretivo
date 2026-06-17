import { sendEmail } from '@/lib/resend';
import { escapeHtml } from '@/lib/email/escape-html';
import { WorkType, JobType } from '@/constants/enums';

const FROM_EMAIL = 'Hiretivo <noreply@hiretivo.com>';

interface DigestJob {
  id: string;
  title: string;
  companyName: string;
  workType: WorkType | null;
  jobType: JobType;
  score: number;
}

interface SendWeeklyDigestEmailInput {
  toEmail: string;
  seekerName: string;
  jobs: DigestJob[];
  unsubscribeUrl: string;
  baseUrl: string;
}

/*
 * buildJobCard
 * Renders a single job as an HTML table row for the digest email.
 * @param job     - Job data to render
 * @param baseUrl - App base URL for job detail links
 * @returns HTML string for one job card
 */
function buildJobCard(job: DigestJob, baseUrl: string): string {
  const workLabel = job.workType ? ` · ${escapeHtml(job.workType)}` : '';
  const jobUrl = `${baseUrl}/jobs/${escapeHtml(job.id)}`;
  return `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <a href="${jobUrl}" style="font-size:16px; font-weight:600; color:#0a0a0a; text-decoration:none;">
                ${escapeHtml(job.title)}
              </a>
              <div style="font-size:14px; color:#6b7280; margin-top:4px;">
                ${escapeHtml(job.companyName)}${workLabel}
              </div>
            </td>
            <td align="right" style="white-space:nowrap;">
              <span style="background:#f3f4f6; color:#0a0a0a; font-size:13px; font-weight:600; padding:4px 10px; border-radius:6px;">
                ${job.score}% match
              </span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:12px;">
              <a href="${jobUrl}"
                 style="display:inline-block; background:#7560ff; color:#ffffff; font-size:13px; font-weight:600; padding:8px 16px; border-radius:8px; text-decoration:none;">
                View Job
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/*
 * sendWeeklyDigestEmail
 * Sends the weekly job digest to a single seeker via Resend.
 * Includes top matched jobs as clickable cards + unsubscribe link.
 * @param input - Seeker info, matched jobs, unsubscribe URL, base app URL
 */
export async function sendWeeklyDigestEmail(input: SendWeeklyDigestEmailInput): Promise<void> {
  const jobCards = input.jobs.map(j => buildJobCard(j, input.baseUrl)).join('');
  const jobCount = input.jobs.length;
  const subject = `Your ${jobCount} best job match${jobCount === 1 ? '' : 'es'} this week`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
      <body style="margin:0; padding:0; background:#f9fafb; font-family:sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; padding:32px 16px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; max-width:600px; width:100%;">

                <!-- Header -->
                <tr>
                  <td style="background:#7560ff; padding:24px 32px;">
                    <span style="font-size:20px; font-weight:700; color:#ffffff;">Hiretivo</span>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 8px; font-size:22px; font-weight:700; color:#0a0a0a;">
                      Hi ${escapeHtml(input.seekerName)},
                    </h1>
                    <p style="margin:0 0 24px; font-size:15px; color:#6b7280;">
                      Here are your top job matches this week. Apply before they're gone.
                    </p>

                    <!-- Job cards -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${jobCards}
                    </table>

                    <!-- CTA -->
                    <div style="margin-top:28px; text-align:center;">
                      <a href="${input.baseUrl}/seeker/dashboard"
                         style="display:inline-block; background:#7560ff; color:#ffffff; font-size:15px; font-weight:600; padding:12px 28px; border-radius:8px; text-decoration:none;">
                        View All Matches
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px; border-top:1px solid #e5e7eb;">
                    <p style="margin:0; font-size:12px; color:#9ca3af; text-align:center;">
                      You're receiving this because you enabled weekly job alerts on Hiretivo.<br />
                      <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#6b7280;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `Hi ${input.seekerName},\n\nYour top job matches this week:\n\n${
    input.jobs.map(j => `• ${j.title} at ${j.companyName} — ${j.score}% match\n  ${input.baseUrl}/jobs/${j.id}`).join('\n\n')
  }\n\nView all matches: ${input.baseUrl}/seeker/dashboard\n\nUnsubscribe: ${input.unsubscribeUrl}`;

  await sendEmail({ from: FROM_EMAIL, to: input.toEmail, subject, html, text });
}
