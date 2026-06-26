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
  // ===== ASHBY =====
  { name: 'OpenAI', website: 'openai.com', ats: AtsSource.ASHBY, boardToken: 'openai' },
  { name: 'Linear', website: 'linear.app', ats: AtsSource.ASHBY, boardToken: 'linear' },
  { name: 'Vercel', website: 'vercel.com', ats: AtsSource.ASHBY, boardToken: 'vercel' },
  { name: 'Notion', website: 'notion.so', ats: AtsSource.ASHBY, boardToken: 'notion' },
  { name: 'Cursor', website: 'cursor.com', ats: AtsSource.ASHBY, boardToken: 'cursor' },
  { name: 'Ramp', website: 'ramp.com', ats: AtsSource.ASHBY, boardToken: 'ramp' },
  { name: 'Supabase', website: 'supabase.com', ats: AtsSource.ASHBY, boardToken: 'supabase' },
  { name: 'PostHog', website: 'posthog.com', ats: AtsSource.ASHBY, boardToken: 'posthog' },
  { name: 'Replit', website: 'replit.com', ats: AtsSource.ASHBY, boardToken: 'replit' },
  { name: 'Mercury', website: 'mercury.com', ats: AtsSource.ASHBY, boardToken: 'mercury' },
  { name: 'Airtable', website: 'airtable.com', ats: AtsSource.ASHBY, boardToken: 'airtable' },
  { name: 'Plaid', website: 'plaid.com', ats: AtsSource.ASHBY, boardToken: 'plaid' },
  { name: 'Reddit', website: 'reddit.com', ats: AtsSource.ASHBY, boardToken: 'reddit' },
  { name: 'Runway', website: 'runway.com', ats: AtsSource.ASHBY, boardToken: 'runway' },
  { name: 'Loom', website: 'loom.com', ats: AtsSource.ASHBY, boardToken: 'loom' },
  { name: 'Deel', website: 'deel.com', ats: AtsSource.ASHBY, boardToken: 'deel' },
  { name: 'Resend', website: 'resend.com', ats: AtsSource.ASHBY, boardToken: 'resend' },
  { name: 'Warp', website: 'warp.dev', ats: AtsSource.ASHBY, boardToken: 'warp' },
  { name: 'Modal', website: 'modal.com', ats: AtsSource.ASHBY, boardToken: 'modal' },
  { name: 'Clerk', website: 'clerk.com', ats: AtsSource.ASHBY, boardToken: 'clerk' },
  { name: 'Infisical', website: 'infisical.com', ats: AtsSource.ASHBY, boardToken: 'infisical' },
  { name: 'Raycast', website: 'raycast.com', ats: AtsSource.ASHBY, boardToken: 'raycast' },
  { name: 'Poolside', website: 'poolside.ai', ats: AtsSource.ASHBY, boardToken: 'poolside' },
  { name: 'Sentry', website: 'sentry.io', ats: AtsSource.ASHBY, boardToken: 'sentry' },
  { name: 'Render', website: 'render.com', ats: AtsSource.ASHBY, boardToken: 'render' },
  { name: 'Neon', website: 'neon.tech', ats: AtsSource.ASHBY, boardToken: 'neon' },
  { name: 'Railway', website: 'railway.com', ats: AtsSource.ASHBY, boardToken: 'railway' },
  { name: 'Trigger.dev', website: 'trigger.dev', ats: AtsSource.ASHBY, boardToken: 'triggerdev' },
  { name: 'Fellow', website: 'fellow.co', ats: AtsSource.ASHBY, boardToken: 'fellow' },
  { name: 'Lago', website: 'lago.com', ats: AtsSource.ASHBY, boardToken: 'lago' },
  { name: 'Alchemy', website: 'alchemy.com', ats: AtsSource.ASHBY, boardToken: 'alchemy' },
  { name: 'Uniswap', website: 'uniswap.org', ats: AtsSource.ASHBY, boardToken: 'uniswap' },
  { name: 'WorkOS', website: 'workos.com', ats: AtsSource.ASHBY, boardToken: 'workos' },
  { name: 'Clerky', website: 'clerky.com', ats: AtsSource.ASHBY, boardToken: 'clerky' },
  { name: 'Zapier', website: 'zapier.com', ats: AtsSource.ASHBY, boardToken: 'zapier' },

  // ===== GREENHOUSE =====
  { name: 'Anthropic', website: 'anthropic.com', ats: AtsSource.GREENHOUSE, boardToken: 'anthropic' },
  { name: 'Figma', website: 'figma.com', ats: AtsSource.GREENHOUSE, boardToken: 'figma' },
  { name: 'Datadog', website: 'datadoghq.com', ats: AtsSource.GREENHOUSE, boardToken: 'datadog' },
  { name: 'Stripe', website: 'stripe.com', ats: AtsSource.GREENHOUSE, boardToken: 'stripe' },
  { name: 'Airbnb', website: 'airbnb.com', ats: AtsSource.GREENHOUSE, boardToken: 'airbnb' },
  { name: 'Coinbase', website: 'coinbase.com', ats: AtsSource.GREENHOUSE, boardToken: 'coinbase' },
  { name: 'Pinterest', website: 'pinterest.com', ats: AtsSource.GREENHOUSE, boardToken: 'pinterest' },
  { name: 'Discord', website: 'discord.com', ats: AtsSource.GREENHOUSE, boardToken: 'discord' },
  { name: 'Dropbox', website: 'dropbox.com', ats: AtsSource.GREENHOUSE, boardToken: 'dropbox' },
  { name: 'Instacart', website: 'instacart.com', ats: AtsSource.GREENHOUSE, boardToken: 'instacart' },
  { name: 'HubSpot', website: 'hubspot.com', ats: AtsSource.GREENHOUSE, boardToken: 'hubspot' },
  { name: 'PagerDuty', website: 'pagerduty.com', ats: AtsSource.GREENHOUSE, boardToken: 'pagerduty' },
  { name: 'GitLab', website: 'gitlab.com', ats: AtsSource.GREENHOUSE, boardToken: 'gitlab' },
  { name: 'Squarespace', website: 'squarespace.com', ats: AtsSource.GREENHOUSE, boardToken: 'squarespace' },
  { name: 'Asana', website: 'asana.com', ats: AtsSource.GREENHOUSE, boardToken: 'asana' },
  { name: 'Robinhood', website: 'robinhood.com', ats: AtsSource.GREENHOUSE, boardToken: 'robinhood' },
  { name: 'Checkr', website: 'checkr.com', ats: AtsSource.GREENHOUSE, boardToken: 'checkr' },
  { name: 'Toast', website: 'toasttab.com', ats: AtsSource.GREENHOUSE, boardToken: 'toast' },
  { name: 'Gusto', website: 'gusto.com', ats: AtsSource.GREENHOUSE, boardToken: 'gusto' },
  { name: 'Movable Ink', website: 'movableink.com', ats: AtsSource.GREENHOUSE, boardToken: 'movableink' },
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
