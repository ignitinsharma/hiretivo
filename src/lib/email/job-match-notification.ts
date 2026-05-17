import { resend } from '@/lib/resend'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export interface JobMatchItem {
  id: string
  title: string
  companyName: string
  matchScore: number
}

/*
 * sendJobMatchNotification
 * Sends a daily digest email to a VERIFIED engineer with new matching jobs.
 * @param email - engineer's email address
 * @param name - engineer's display name (nullable)
 * @param jobs - top matching job cards (up to 3)
 * @param totalCount - total new matching jobs found (may be > 3)
 */
export async function sendJobMatchNotification(
  email: string,
  name: string | null,
  jobs: JobMatchItem[],
  totalCount: number,
): Promise<void> {
  const greeting = name ? `Hi ${name.split(' ')[0]}` : 'Hi'
  const subject =
    totalCount === 1
      ? '1 new job matches your profile on Hiretivo'
      : `${totalCount} new jobs match your profile on Hiretivo`

  const jobRows = jobs
    .map(
      (j) =>
        `<tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb">
            <a href="https://hiretivo.com/jobs/${escapeHtml(j.id)}" style="font-weight:600;color:#0a0a0a;text-decoration:none">${escapeHtml(j.title)}</a>
            <span style="color:#6b7280"> at ${escapeHtml(j.companyName)}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right">
            <span style="background:#7560ff;color:#fff;font-size:12px;font-weight:600;padding:2px 10px;border-radius:9999px">${j.matchScore}% match</span>
          </td>
        </tr>`,
    )
    .join('')

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px">
      <p style="font-size:16px;color:#0a0a0a;margin:0 0 8px">${greeting},</p>
      <p style="font-size:16px;color:#6b7280;margin:0 0 24px">${subject}.</p>
      <table style="width:100%;border-collapse:collapse">${jobRows}</table>
      ${totalCount > jobs.length ? `<p style="margin:16px 0 0;font-size:14px;color:#6b7280">+ ${totalCount - jobs.length} more matching jobs.</p>` : ''}
      <div style="margin-top:24px">
        <a href="https://hiretivo.com/seeker/dashboard" style="background:#7560ff;color:#fff;font-size:14px;font-weight:500;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block">View all jobs</a>
      </div>
    </div>`

  const { data, error } = await resend.emails.send({
    from: 'Hiretivo <jobs@hiretivo.com>',
    to: email,
    subject,
    html,
  })

  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error('Resend did not return an email id')
}
