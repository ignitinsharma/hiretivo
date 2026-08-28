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
  // ===== ASHBY (24) — remote-first, hire globally including India =====
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
  { name: 'Temporal', website: 'temporal.io', ats: AtsSource.ASHBY, boardToken: 'temporal' },
  { name: 'Sanity', website: 'sanity.io', ats: AtsSource.ASHBY, boardToken: 'sanity' },
  { name: 'Twenty', website: 'twenty.com', ats: AtsSource.ASHBY, boardToken: 'twenty' },
  { name: 'Mintlify', website: 'mintlify.com', ats: AtsSource.ASHBY, boardToken: 'mintlify' },

  // ===== GREENHOUSE (15) — tier-1 remote-friendly =====
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
  { name: 'Cloudflare', website: 'cloudflare.com', ats: AtsSource.GREENHOUSE, boardToken: 'cloudflare' },
  { name: 'Elastic', website: 'elastic.co', ats: AtsSource.GREENHOUSE, boardToken: 'elastic' },
  { name: 'MongoDB', website: 'mongodb.com', ats: AtsSource.GREENHOUSE, boardToken: 'mongodb' },
  { name: 'Tailscale', website: 'tailscale.com', ats: AtsSource.GREENHOUSE, boardToken: 'tailscale' },
  { name: 'Vercel', website: 'vercel.com', ats: AtsSource.GREENHOUSE, boardToken: 'vercel' },

  // ===== GREENHOUSE (12 added) — funded startups, remote-friendly =====
  { name: 'Coinbase', website: 'coinbase.com', ats: AtsSource.GREENHOUSE, boardToken: 'coinbase' },
  { name: 'Lyft', website: 'lyft.com', ats: AtsSource.GREENHOUSE, boardToken: 'lyft' },
  { name: 'DoorDash', website: 'doordash.com', ats: AtsSource.GREENHOUSE, boardToken: 'doordash' },
  { name: 'Instacart', website: 'instacart.com', ats: AtsSource.GREENHOUSE, boardToken: 'instacart' },
  { name: 'Airtable', website: 'airtable.com', ats: AtsSource.GREENHOUSE, boardToken: 'airtable' },
  { name: 'Dropbox', website: 'dropbox.com', ats: AtsSource.GREENHOUSE, boardToken: 'dropbox' },
  { name: 'Intercom', website: 'intercom.com', ats: AtsSource.GREENHOUSE, boardToken: 'intercom' },
  { name: 'Brex', website: 'brex.com', ats: AtsSource.GREENHOUSE, boardToken: 'brex' },
  { name: 'Lattice', website: 'lattice.com', ats: AtsSource.GREENHOUSE, boardToken: 'lattice' },
  { name: 'Fivetran', website: 'fivetran.com', ats: AtsSource.GREENHOUSE, boardToken: 'fivetran' },
  { name: 'Scale AI', website: 'scale.com', ats: AtsSource.GREENHOUSE, boardToken: 'scaleai' },
  { name: 'Perplexity', website: 'perplexity.ai', ats: AtsSource.GREENHOUSE, boardToken: 'perplexityai' },

  // ===== LEVER (19 added) — API fetchable, capped 5/board =====
  { name: 'Netflix', website: 'netflix.com', ats: AtsSource.LEVER, boardToken: 'netflix' },
  { name: 'Affirm', website: 'affirm.com', ats: AtsSource.LEVER, boardToken: 'affirm' },
  { name: 'Shopify-Lever', website: 'shopify.com', ats: AtsSource.LEVER, boardToken: 'shopify' },
  { name: 'Duolingo', website: 'duolingo.com', ats: AtsSource.LEVER, boardToken: 'duolingo' },
  { name: 'Nuro', website: 'nuro.ai', ats: AtsSource.LEVER, boardToken: 'nuro' },
  { name: 'Palantir-Lever', website: 'palantir.com', ats: AtsSource.LEVER, boardToken: 'palantir' },
  { name: 'Asana', website: 'asana.com', ats: AtsSource.LEVER, boardToken: 'asana' },
  { name: 'Quora', website: 'quora.com', ats: AtsSource.LEVER, boardToken: 'quora' },
  { name: 'Coursera', website: 'coursera.org', ats: AtsSource.LEVER, boardToken: 'coursera' },
  { name: 'Braze', website: 'braze.com', ats: AtsSource.LEVER, boardToken: 'braze' },
  { name: 'Mixpanel', website: 'mixpanel.com', ats: AtsSource.LEVER, boardToken: 'mixpanel' },
  { name: 'Outreach', website: 'outreach.io', ats: AtsSource.LEVER, boardToken: 'outreach' },
  { name: 'Segment', website: 'segment.com', ats: AtsSource.LEVER, boardToken: 'segment' },
  { name: 'Whatnot', website: 'whatnot.com', ats: AtsSource.LEVER, boardToken: 'whatnot' },
  { name: 'Faire', website: 'faire.com', ats: AtsSource.LEVER, boardToken: 'faire' },
  { name: 'Retool-Lever', website: 'retool.com', ats: AtsSource.LEVER, boardToken: 'retool' },
  { name: 'Loom', website: 'loom.com', ats: AtsSource.LEVER, boardToken: 'loom' },
  { name: 'Carta', website: 'carta.com', ats: AtsSource.LEVER, boardToken: 'carta' },
  { name: 'Flexport', website: 'flexport.com', ats: AtsSource.GREENHOUSE, boardToken: 'flexport' },

  // ===== ASHBY (15 added) — big + small startups, verified live 200 + meetsQualityBar =====
  { name: 'Cohere', website: 'cohere.com', ats: AtsSource.ASHBY, boardToken: 'cohere' },
  { name: 'Harvey', website: 'harvey.ai', ats: AtsSource.ASHBY, boardToken: 'harvey' },
  { name: 'Airwallex', website: 'airwallex.com', ats: AtsSource.ASHBY, boardToken: 'airwallex' },
  { name: 'Crusoe', website: 'crusoe.ai', ats: AtsSource.ASHBY, boardToken: 'crusoe' },
  { name: 'Docker', website: 'docker.com', ats: AtsSource.ASHBY, boardToken: 'docker' },
  { name: 'Benchling', website: 'benchling.com', ats: AtsSource.ASHBY, boardToken: 'benchling' },
  { name: 'Perplexity Ashby', website: 'perplexity.ai', ats: AtsSource.ASHBY, boardToken: 'perplexity' },
  { name: 'Anyscale', website: 'anyscale.com', ats: AtsSource.ASHBY, boardToken: 'anyscale' },
  { name: 'Exa', website: 'exa.ai', ats: AtsSource.ASHBY, boardToken: 'exa' },
  { name: 'Character AI', website: 'character.ai', ats: AtsSource.ASHBY, boardToken: 'character' },
  { name: 'Pylon', website: 'pylon.ai', ats: AtsSource.ASHBY, boardToken: 'pylon' },
  { name: 'Arch', website: 'arch.dev', ats: AtsSource.ASHBY, boardToken: 'arch' },
  { name: 'Browserbase', website: 'browserbase.com', ats: AtsSource.ASHBY, boardToken: 'browserbase' },
  { name: 'Zapier', website: 'zapier.com', ats: AtsSource.ASHBY, boardToken: 'zapier' },
  { name: 'Confluent', website: 'confluent.io', ats: AtsSource.ASHBY, boardToken: 'confluent' },
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
