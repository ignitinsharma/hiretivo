export interface AtsCompany {
  name: string;
  website: string;
  ats: 'ashby' | 'greenhouse' | 'lever';
  boardToken: string;
  logoUrl?: string;
  remoteOnly?: boolean;
}

export const COMPANY_REGISTRY: AtsCompany[] = [
  // ===== ASHBY =====
  { name: 'OpenAI', website: 'openai.com', ats: 'ashby', boardToken: 'openai' },
  { name: 'Linear', website: 'linear.app', ats: 'ashby', boardToken: 'linear' },
  { name: 'Vercel', website: 'vercel.com', ats: 'ashby', boardToken: 'vercel' },
  { name: 'Notion', website: 'notion.so', ats: 'ashby', boardToken: 'notion' },
  { name: 'Cursor', website: 'cursor.com', ats: 'ashby', boardToken: 'cursor' },
  { name: 'Ramp', website: 'ramp.com', ats: 'ashby', boardToken: 'ramp' },
  { name: 'Supabase', website: 'supabase.com', ats: 'ashby', boardToken: 'supabase' },
  { name: 'PostHog', website: 'posthog.com', ats: 'ashby', boardToken: 'posthog' },
  { name: 'Replit', website: 'replit.com', ats: 'ashby', boardToken: 'replit' },
  { name: 'Mercury', website: 'mercury.com', ats: 'ashby', boardToken: 'mercury' },
  { name: 'Airtable', website: 'airtable.com', ats: 'ashby', boardToken: 'airtable' },
  { name: 'Plaid', website: 'plaid.com', ats: 'ashby', boardToken: 'plaid' },
  { name: 'Reddit', website: 'reddit.com', ats: 'ashby', boardToken: 'reddit' },
  { name: 'Runway', website: 'runway.com', ats: 'ashby', boardToken: 'runway' },
  { name: 'Loom', website: 'loom.com', ats: 'ashby', boardToken: 'loom' },
  { name: 'Deel', website: 'deel.com', ats: 'ashby', boardToken: 'deel' },
  { name: 'Resend', website: 'resend.com', ats: 'ashby', boardToken: 'resend' },
  { name: 'Warp', website: 'warp.dev', ats: 'ashby', boardToken: 'warp' },
  { name: 'Modal', website: 'modal.com', ats: 'ashby', boardToken: 'modal' },
  { name: 'Clerk', website: 'clerk.com', ats: 'ashby', boardToken: 'clerk' },
  { name: 'Infisical', website: 'infisical.com', ats: 'ashby', boardToken: 'infisical' },
  { name: 'Raycast', website: 'raycast.com', ats: 'ashby', boardToken: 'raycast' },
  { name: 'Poolside', website: 'poolside.ai', ats: 'ashby', boardToken: 'poolside' },
  { name: 'Sentry', website: 'sentry.io', ats: 'ashby', boardToken: 'sentry' },
  { name: 'Render', website: 'render.com', ats: 'ashby', boardToken: 'render' },
  { name: 'Neon', website: 'neon.tech', ats: 'ashby', boardToken: 'neon' },
  { name: 'Railway', website: 'railway.com', ats: 'ashby', boardToken: 'railway' },
  { name: 'Trigger.dev', website: 'trigger.dev', ats: 'ashby', boardToken: 'triggerdev' },
  { name: 'Fellow', website: 'fellow.co', ats: 'ashby', boardToken: 'fellow' },
  { name: 'Lago', website: 'lago.com', ats: 'ashby', boardToken: 'lago' },
  { name: 'Alchemy', website: 'alchemy.com', ats: 'ashby', boardToken: 'alchemy' },
  { name: 'Uniswap', website: 'uniswap.org', ats: 'ashby', boardToken: 'uniswap' },
  { name: 'WorkOS', website: 'workos.com', ats: 'ashby', boardToken: 'workos' },
  { name: 'Clerky', website: 'clerky.com', ats: 'ashby', boardToken: 'clerky' },
  { name: 'Zapier', website: 'zapier.com', ats: 'ashby', boardToken: 'zapier' },

  // ===== GREENHOUSE =====
  { name: 'Anthropic', website: 'anthropic.com', ats: 'greenhouse', boardToken: 'anthropic' },
  { name: 'Figma', website: 'figma.com', ats: 'greenhouse', boardToken: 'figma' },
  { name: 'Datadog', website: 'datadoghq.com', ats: 'greenhouse', boardToken: 'datadog' },
  { name: 'Stripe', website: 'stripe.com', ats: 'greenhouse', boardToken: 'stripe' },
  { name: 'Airbnb', website: 'airbnb.com', ats: 'greenhouse', boardToken: 'airbnb' },
  { name: 'Coinbase', website: 'coinbase.com', ats: 'greenhouse', boardToken: 'coinbase' },
  { name: 'Pinterest', website: 'pinterest.com', ats: 'greenhouse', boardToken: 'pinterest' },
  { name: 'Discord', website: 'discord.com', ats: 'greenhouse', boardToken: 'discord' },
  { name: 'Dropbox', website: 'dropbox.com', ats: 'greenhouse', boardToken: 'dropbox' },
  { name: 'Instacart', website: 'instacart.com', ats: 'greenhouse', boardToken: 'instacart' },
  { name: 'HubSpot', website: 'hubspot.com', ats: 'greenhouse', boardToken: 'hubspot' },
  { name: 'PagerDuty', website: 'pagerduty.com', ats: 'greenhouse', boardToken: 'pagerduty' },
  { name: 'GitLab', website: 'gitlab.com', ats: 'greenhouse', boardToken: 'gitlab' },
  { name: 'Squarespace', website: 'squarespace.com', ats: 'greenhouse', boardToken: 'squarespace' },
  { name: 'Asana', website: 'asana.com', ats: 'greenhouse', boardToken: 'asana' },
  { name: 'Robinhood', website: 'robinhood.com', ats: 'greenhouse', boardToken: 'robinhood' },
  { name: 'Checkr', website: 'checkr.com', ats: 'greenhouse', boardToken: 'checkr' },
  { name: 'Toast', website: 'toasttab.com', ats: 'greenhouse', boardToken: 'toast' },
  { name: 'Gusto', website: 'gusto.com', ats: 'greenhouse', boardToken: 'gusto' },
  { name: 'Movable Ink', website: 'movableink.com', ats: 'greenhouse', boardToken: 'movableink' },
];

export function getCompaniesBySource(source: 'ashby' | 'greenhouse' | 'lever'): AtsCompany[] {
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
