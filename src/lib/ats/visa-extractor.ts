const VISA_SIGNALS = [
  'visa sponsorship',
  'we sponsor',
  'h1b',
  'h-1b',
  'h1-b',
  'opt',
  'work authorization',
  'sponsorship available',
  'sponsorship offered',
  'sponsorship provided',
  'open to sponsorship',
  'visa transfer',
  'tn visa',
  'willing to sponsor',
  'sponsor visas',
  'visa support',
  'work visa',
  'employment visa',
  'visa assistance',
  'relocation assistance',
  'relocation support',
];

const NEGATION_PATTERNS = [
  /not\s+.*sponsor/i,
  /no\s+.*visa/i,
  /cannot\s+.*sponsor/i,
  /can't\s+.*sponsor/i,
  /will not\s+.*sponsor/i,
  /won't\s+.*sponsor/i,
  /unable\s+.*sponsor/i,
  /do not\s+.*sponsor/i,
  /does not\s+.*sponsor/i,
  /no\s+.*sponsorship/i,
  /not\s+.*eligible\s+.*visa/i,
  /no\s+.*relocation/i,
  /cannot\s+.*relocation/i,
  /not\s+.*provide\s+.*visa/i,
  /must\s+.*have\s+.*existing\s+.*work\s+.*authorization/i,
  /no\s+.*work\s+.*authorization\s+.*sponsorship/i,
];

export function detectVisaSponsorship(text: string): boolean {
  if (!text) return false;

  const lower = text.toLowerCase();

  for (const negPattern of NEGATION_PATTERNS) {
    if (negPattern.test(text)) return false;
  }

  return VISA_SIGNALS.some((signal) => lower.includes(signal));
}
