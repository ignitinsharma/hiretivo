import { AtsSource } from '@/constants/enums';

export interface AtsCompany {
  name: string;
  website: string;
  ats: AtsSource;
  boardToken: string;
  logoUrl?: string;
  remoteOnly?: boolean;
}

export const COMPANY_REGISTRY: AtsCompany[] = [
  // ===== ASHBY (20) — remote-first, hire globally including India =====
  // OpenAI removed: jobs say "Remote" but mean "Remote - US". Classifier marks worldwide incorrectly.
  { name: 'Linear', website: 'linear.app', ats: AtsSource.ASHBY, boardToken: 'linear' },
  { name: 'Cursor', website: 'cursor.com', ats: AtsSource.ASHBY, boardToken: 'cursor' },
  { name: 'Supabase', website: 'supabase.com', ats: AtsSource.ASHBY, boardToken: 'supabase' },
  { name: 'PostHog', website: 'posthog.com', ats: AtsSource.ASHBY, boardToken: 'posthog' },
  { name: 'Replit', website: 'replit.com', ats: AtsSource.ASHBY, boardToken: 'replit' },
  { name: 'Sentry', website: 'sentry.io', ats: AtsSource.ASHBY, boardToken: 'sentry' },
  { name: 'Render', website: 'render.com', ats: AtsSource.ASHBY, boardToken: 'render' },
  { name: 'Neon', website: 'neon.tech', ats: AtsSource.ASHBY, boardToken: 'neon' },
  { name: 'Railway', website: 'railway.com', ats: AtsSource.ASHBY, boardToken: 'railway' },
  { name: 'Trigger.dev', website: 'trigger.dev', ats: AtsSource.ASHBY, boardToken: 'triggerdev' },
  { name: 'Infisical', website: 'infisical.com', ats: AtsSource.ASHBY, boardToken: 'infisical' },
  { name: 'WorkOS', website: 'workos.com', ats: AtsSource.ASHBY, boardToken: 'workos' },
  { name: 'Warp', website: 'warp.dev', ats: AtsSource.ASHBY, boardToken: 'warp' },
  { name: 'Modal', website: 'modal.com', ats: AtsSource.ASHBY, boardToken: 'modal' },
  { name: 'Poolside', website: 'poolside.ai', ats: AtsSource.ASHBY, boardToken: 'poolside' },
  { name: 'Resend', website: 'resend.com', ats: AtsSource.ASHBY, boardToken: 'resend' },
  { name: 'Runway', website: 'runway.com', ats: AtsSource.ASHBY, boardToken: 'runway' },
  { name: 'Ramp', website: 'ramp.com', ats: AtsSource.ASHBY, boardToken: 'ramp' },
  { name: 'Notion', website: 'notion.so', ats: AtsSource.ASHBY, boardToken: 'notion' },
  { name: 'Plaid', website: 'plaid.com', ats: AtsSource.ASHBY, boardToken: 'plaid' },

  // ===== GREENHOUSE (10) — tier-1 remote-friendly =====
  { name: 'Anthropic', website: 'anthropic.com', ats: AtsSource.GREENHOUSE, boardToken: 'anthropic' },
  { name: 'Figma', website: 'figma.com', ats: AtsSource.GREENHOUSE, boardToken: 'figma' },
  { name: 'Stripe', website: 'stripe.com', ats: AtsSource.GREENHOUSE, boardToken: 'stripe' },
  { name: 'Datadog', website: 'datadoghq.com', ats: AtsSource.GREENHOUSE, boardToken: 'datadog' },
  { name: 'GitLab', website: 'gitlab.com', ats: AtsSource.GREENHOUSE, boardToken: 'gitlab' },
  { name: 'Discord', website: 'discord.com', ats: AtsSource.GREENHOUSE, boardToken: 'discord' },
  { name: 'Gusto', website: 'gusto.com', ats: AtsSource.GREENHOUSE, boardToken: 'gusto' },
  { name: 'Robinhood', website: 'robinhood.com', ats: AtsSource.GREENHOUSE, boardToken: 'robinhood' },
  { name: 'Checkr', website: 'checkr.com', ats: AtsSource.GREENHOUSE, boardToken: 'checkr' },
  { name: 'Grafana Labs', website: 'grafana.com', ats: AtsSource.GREENHOUSE, boardToken: 'grafana' },
];

export function getCompaniesBySource(source: AtsSource): AtsCompany[] {
  return COMPANY_REGISTRY.filter((c) => c.ats === source);
}

/* Check for duplicate company names across registry — dev only */
if (process.env.NODE_ENV !== 'production') {
  const allNames = COMPANY_REGISTRY.map((c) => c.name.toLowerCase());
  const duplicates = allNames.filter((name, i) => allNames.indexOf(name) !== i);
  if (duplicates.length > 0) {
    console.warn(`[registry] Duplicate companies found: ${[...new Set(duplicates)].join(', ')}`);
  }
}
