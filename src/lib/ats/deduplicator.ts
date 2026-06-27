import crypto from 'crypto';

export function generateDedupeKey(companyName: string, title: string, atsSourceId: string): string {
  const str = `${companyName}|${title}|${atsSourceId}`.toLowerCase().trim();
  return crypto.createHash('md5').update(str).digest('hex');
}
