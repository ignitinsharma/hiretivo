---
status: resolved
trigger: "Investigate issue: pricing-page-plan-count-and-dodo-prices"
created: 2026-04-26T00:00:00+05:30
updated: 2026-04-26T00:35:00+05:30
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: Human verification confirmed fixed.
test: User verified lint, TypeScript, local /pricing HTTP 200, and code/config values.
expecting: Debug session can be archived and committed.
next_action: archive session and commit fix/docs

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Pricing UI should expose only Free, Pro, and Custom sections/plans. Pro should present the current Dodo monthly/annual prices for USD and INR. Free and Custom should not appear as additional paid plan variants.
actual: Pricing UI is showing five plan sections/cards.
errors: No runtime error provided; visual/data mismatch.
reproduction: Open the pricing page and inspect plan cards/sections.
started: Current pricing implementation after recent paid workflow work; user reports it is wrong now.

## Eliminated
<!-- APPEND only - prevents re-investigating -->

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-04-26T00:05:00+05:30
  checked: .planning/debug/knowledge-base.md
  found: No matching pricing/data mismatch entry; existing entry is recruiter onboarding redirect loop.
  implication: No prior known root cause to test first.
- timestamp: 2026-04-26T00:05:00+05:30
  checked: common-bug-patterns.md
  found: Symptom maps to Data Shape / API Contract and State Management because wrong data is displayed with no runtime error.
  implication: Highest-probability hypotheses are stale/static pricing data or multiple sources of truth.
- timestamp: 2026-04-26T00:05:00+05:30
  checked: rg for pricing/Dodo/plan terms
  found: Pricing page imports PRICING_CONFIG from src/constants/pricing.ts; checkout uses src/constants/billing.ts for Dodo product IDs.
  implication: Need to compare display data with checkout/billing data.
- timestamp: 2026-04-26T00:12:00+05:30
  checked: src/constants/pricing.ts
  found: PRICING_CONFIG contains five entries: Free, Starter, Growth, Pro, Enterprise.
  implication: Pricing page shows five cards because it renders this array directly.
- timestamp: 2026-04-26T00:12:00+05:30
  checked: src/app/(public)/pricing/pricing-client.tsx
  found: Card grid maps PRICING_CONFIG without filtering; handleCtaClick only handles Free and Pro.
  implication: Starter/Growth/Enterprise are stale display-only plans and not valid checkout variants.
- timestamp: 2026-04-26T00:12:00+05:30
  checked: src/constants/billing.ts and src/lib/validations/checkout.schema.ts
  found: Dodo product mappings and checkout schema only support Pro monthly/annual in USD/INR.
  implication: Public pricing data should have a single paid Pro tier with monthly and annual Dodo prices, plus Free and Custom.
- timestamp: 2026-04-26T00:28:00+05:30
  checked: pnpm exec tsc --noEmit
  found: TypeScript verification passed.
  implication: Pricing type changes are valid.
- timestamp: 2026-04-26T00:28:00+05:30
  checked: PRICING_CONFIG via pnpm exec tsx
  found: Config now contains exactly Free, Pro, Custom. Pro USD is monthly 149 and annualTotal 1426; Pro INR is monthly 7999 and annualTotal 71986; Custom has null USD/INR.
  implication: Source data now matches the required public plan count and Dodo Pro product prices.
- timestamp: 2026-04-26T00:28:00+05:30
  checked: pnpm lint
  found: ESLint passed with no warnings or errors; command emitted a Node engine warning because current Node is v20.19.0 while package.json wants 22.x.
  implication: Static lint verification passed despite local Node version mismatch warning.
- timestamp: 2026-04-26T00:35:00+05:30
  checked: Human verification checkpoint response
  found: User verified pnpm lint, pnpm exec tsc --noEmit, local curl -I http://localhost:3000/pricing returned HTTP 200, and config inspection confirms exactly Free/Pro/Custom with requested Pro USD/INR prices.
  implication: Fix is confirmed in the local workflow and debug session can be resolved.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: Stale static PRICING_CONFIG had five public tiers and the pricing page rendered the entire array directly, while billing/checkout only supports the Pro Dodo products.
fix: Reduced PRICING_CONFIG to Free, Pro, and Custom; removed stale Starter/Growth/public Enterprise pricing; changed pricing card to use Custom with no public price and Pro annual Dodo product totals.
verification: pnpm exec tsc --noEmit passed; pnpm lint passed; direct PRICING_CONFIG inspection showed exactly three plans and requested Pro USD/INR Dodo prices; user confirmed local /pricing returns HTTP 200 and code/config inspection matches expected output.
files_changed: ["src/constants/pricing.ts", "src/app/(public)/pricing/pricing-client.tsx"]
