# Design: Pivot Hiretivo → "Apply Faster" Seeker Tool

**Date:** 2026-07-01
**Status:** Approved for planning
**Supersedes:** `~/.claude/plans/so-u-know-u-velvet-yeti.md` (this doc refines it) and memory `project_pivot_v2`
**Execution:** `2026-07-02-EXECUTION-GUIDE.md` — developer playbook (new-chat kickoff, code placement, refactor flow, dev cases, LIVE status table). Schema canon: `2026-07-01-pivot-DATA-MODEL.md`. Per-phase plans: `../plans/2026-07-01-p*.md`.

---

## 1. Overview & Positioning

Pivot Hiretivo from a two-sided remote-job marketplace into a **seeker-only "get hired faster" tool**, modeled on Tsenta but differentiated on **fit, honesty, and global reach**.

Core loop: aggregate ATS jobs into a **match-ranked feed** → one-click **AI-tailored resume + cover letter** → **assisted apply** into the source ATS → **track** every application with an interview-rate feedback loop.

**Positioning:** *"Apply smarter, not more."* Not "we fire 600 applications for you" (Tsenta) — instead, **apply faster to jobs you'll actually get**, with resumes tailored honestly (never fabricated).

Existing brand tokens/theme stay. Seeker gets a sidebar shell and Tsenta-like pages.

---

## 2. Locked Decisions

| Area | Decision |
|------|----------|
| **Apply engine** | **Assisted (v1):** generate tailored PDF + cover, deep-link to source ATS, show copy-paste cheatsheet, user submits on the ATS themselves. **No server-side automation in v1.** Chrome extension autofill = fast-follow (Phase 8.5), NOT deferred to Phase 9. |
| **Onboarding** | Tsenta-style but **progressive** and **globalized**. Keep: resume upload→parse, location, contact. **Globalize** work-eligibility (country-based, not US-visa list). Prefs/D&I optional. **Drop** the "app password for Workday" step (automation-only). Keep the Honest/Aggressive optimize toggle; **drop** "auto-approve" (no automation → always preview). |
| **Pricing meter** | **AI credits**, not application count. `1 credit = 1 job tailored (resume + cover bundled)`. Rationale: in assisted v1 an application costs us nothing; AI tokens are the real cost. Application-metering returns only when automation ships. |
| **Tiers (Ladder A)** | **FREE 8/mo · PRO $9/mo → 400 · MAX $19/mo → 1000.** Annual = 10× monthly (2 months free). Positioned under Tsenta's $19/600. |
| **Free taste** | Yes — 8 AI tailors/mo on free. Don't hard-wall AI to zero (kills conversion). |
| **Model** | Default **Gemini 2.5 Flash**; benchmark vs 2.0 Flash at Phase 4 and downshift if quality holds. **Gemini direct** in prod (no OpenRouter markup). `AI_MODEL` env-swappable. Never ship on `:free` model in prod (rate-limits, no SLA). |
| **Watermark** | **None on the resume PDF, ever, any tier** — it's an employer-facing doc; a watermark hurts the candidate. Growth lever = **referral code** (Tsenta has it on upload screen). |
| **Tracker** | Kanban + **free-text notes + status-update log** per card (remember "shortlisted 12 Jul" etc). |
| **Recruiter side** | Hidden behind `NEXT_PUBLIC_RECRUITER_ENABLED` flag (default false). Code/models/APIs kept intact. |

---

## 3. Differentiators (the moat) — all in v1

Reuse existing systems, so cheap to add; together they're a "smarter apply" story Tsenta can't match.

1. **Match-ranked feed + credit warning.** Reuse `match.ts` skill-overlap scoring. Rank feed by fit; warn before a user burns a credit on a low-match job. Honest + saves credits = trust. This is existing IP as a moat.
2. **"Apply smarter, not more" + Honesty brand.** Positioning/copy (≈free). Contrarian to Tsenta's volume play in a market where ATS are drowning in AI-spam and response rates are crashing. "Tailored, never fabricated."
3. **Interview-rate analytics from tracker.** Compute the user's real funnel (applied → response → interview → offer) by match-band; surface *"70%+ match jobs get you 3× callbacks — focus there."* Turns the tracker into an optimization engine. Builds on Phase 6.
4. **Global-first** (structural advantage). See §5.

---

## 4. End-to-End User Journey

1. **Sign up** → OAuth/email, defaults to SEEKER. No role picker. Recruiter world invisible.
2. **Onboard (progressive)** → upload resume → AI parses → **review/correct** extracted profile. That's enough to start browsing. ATS-form fields (location, work-auth, D&I) are completed **before first apply**, not up front.
3. **Dashboard** → sidebar shell, "Top job matches" row, applications/credits-left widget.
4. **Browse feed** → match-ranked, filters (incl. `locationClass`), job cards with match ring + skills chips + Apply/Pass, detail drawer, "view original posting."
5. **Apply → wizard** → Optimize resume (AI) → edit → Generate cover → edit → **Submit (assisted):** render ATS-safe PDF → R2, open source ATS in new tab, show copy-paste cheatsheet, user submits, marks "I applied." Credit consumed **only on success**.
6. **Tracker** → kanban (Applied/Ghosted/Interviewing/Rejected/Offer), notes + status log, CSV in/out, re-open artifacts, funnel analytics.
7. **Add own link** → paste any URL; known ATS → parse; blocked/unknown → manual JD paste fallback → same wizard.
8. **Quota wall** → free 8 exhausted → upsell → Dodo upgrade (monthly/annual) → limit rises.

---

## 5. Global-First

**Meaning:** our wedge is **remote roles that hire across borders** (Linear, Supabase, PostHog, etc — already in the registry), the segment US-tuned Tsenta ignores.

- **Work-auth by country**, not US visas ("authorized in [country]? need sponsorship?").
- **Feed filters use existing `locationClass`** (`worldwide | us-only | emea | india | onsite`) — no new modeling.
- **D&I questions shown for US jobs only** (US-EEO artifacts; hide elsewhere).
- **Multi-currency pricing** (₹/€) if Dodo supports it.

**Honest caveat:** coverage is a curated tech-startup list. Position as **"remote jobs that hire worldwide,"** not "every job everywhere." Deepen later by expanding the registry + adding a Workday normalizer.

---

## 6. Pricing Economics

Token estimate per job (resume + cover): **~7k input + 3k output.**

| Model | ~$/job | 400 jobs (PRO) | 1000 jobs (MAX) |
|-------|--------|----------------|-----------------|
| Gemini 2.0 Flash | ~$0.002 | ~$0.80 | ~$2.00 |
| Gemini 2.5 Flash | ~$0.010 | ~$4.00 | ~$10.00 |
| Gemini 2.5 Pro | ~$0.039 | ~$15.60 | ~$39.00 (loss) |

Ladder A on Flash-class = healthy margins (PRO ≥55%, MAX ≥47% even if fully consumed). Real consumption is far below quota (most users apply 20–100/mo), so effective margin is higher. **Never run this on a Pro-class model.** All non-AI costs (R2, Neon, Vercel, Upstash) are <5% of variable cost — the only lever that matters is model × tokens/job. Set PDF retention (e.g. 90 days) so R2 doesn't grow unbounded.

*(Prices approximate as of Jan 2026 — verify live at Phase 4/8 build.)*

---

## 7. Edge Cases / Gaps & Assignment

| # | Gap | Handling | Phase |
|---|-----|----------|-------|
| 1 | **Resume parser** (onboarding depends on it; not in original plan) | PDF→text→LLM→structured profile→**user review/correct**. Scanned/image PDF → OCR or manual fallback. | 1c / 3 (must-fix) |
| 2 | **ATS-safe PDF** | Single-column, standard fonts, real text, no images/tables-for-content. Constraint on template, also a selling point. | 3b (must-fix) |
| 3 | **Credit refund on failure** | Decrement credit only after artifact saved successfully. | 4 / 8 (must-fix) |
| 4 | **Apply dedup** | Unique `(userId, jobId)` / `(userId, normalizedUrl)`; show "already applied." | 5 (must-fix) |
| 5 | **PII / GDPR** | **v1-minimum:** encrypt self-ID fields, account-delete wipes DB + R2, D&I optional/"prefer not." Full DPA/consent UI = fast-follow. | cross-cutting (v1-min) |
| 6 | **Progressive onboarding** | Onboarding = upload+parse+review only; ATS-form fields due before first apply. | 1c (must-fix) |
| 7 | **JD fetch fallback** | Known ATS → parse; blocked/unknown (LinkedIn/Indeed) → manual JD-paste textarea. | 7 (must-fix) |
| 8 | **Stale/closed jobs** | Show "posted X ago" + "may be closed" on old jobs; rely on ingestion expiry. No live-checking. | 2 (light touch) |

---

## 8. Revised Phase Roadmap (shippable chunks)

Each row = one branch → one PR into `staging`.

| Phase | Branch | Ships |
|-------|--------|-------|
| **1a** | `feature/pivot-p1a-flags-gate` | Recruiter flag + `middleware` gate + hide recruiter UI + seeker-default signup |
| **1b** | `feature/pivot-p1b-shell` | `AppSidebar` + `SEEKER_NAV_ITEMS` + shell layout + stub routes |
| **1c** | `feature/pivot-p1c-onboarding` | Resume parser + review UI, globalized work-auth, progressive onboarding, drop password step, optimize toggle |
| **2** | `feature/pivot-p2-feed` | Match-ranked feed, filters (incl. locationClass), job cards, save/pass, detail drawer, dashboard row, stale-job flag |
| **3a** | `feature/pivot-p3a-schema` | Migrations: `Certification`, `ApplicationDefaults` (global work-auth), enums |
| **3b** | `feature/pivot-p3b-pdf` | `@react-pdf/renderer` + `ResumeDocument` (ATS-safe) + R2 render |
| **3c** | `feature/pivot-p3c-profile` | Profile page + edit forms |
| **4** | `feature/pivot-p4-ai` | Tailor + cover prompts, `AiFeature` credits (+refund-on-fail), model benchmark, stream routes |
| **5** | `feature/pivot-p5-wizard` | Apply wizard, assisted submit, per-field data (extension-ready), dedup, records |
| **6** | `feature/pivot-p6-tracker` | Kanban + notes/status-log + CSV + interview-rate analytics |
| **7** | `feature/pivot-p7-link` | Add-your-own-link → JD fetch (+ manual-paste fallback) → wizard |
| **8** | `feature/pivot-p8-pricing` | AI-credit quota, Ladder A tiers, annual, sidebar counter, pricing page |
| **8.5** | `feature/pivot-p8.5-extension` | Chrome extension autofill (reads Phase-5 field data) — fast-follow |
| **9** | later | Automation auto-submit, managed inbox + OTP, app-password step, multi-resume-profile, networking, full GDPR, Workday normalizer, registry expansion |

**Dependency spine:** 1a → 1b → 1c → 2 → 3a → 3b → 3c → 4 → 5 → (6 ∥ 7) → 8 → 8.5

---

## 9. Reuse Map (do NOT rebuild)

ATS ingestion `src/lib/ats/*` (+ normalizers, registry, `locationClass`) · match `src/lib/match.ts` · AI `src/lib/openrouter.ts` (`AI_MODEL`/`AI_PROVIDER` swap) + `ai-prompts.ts` + `lib/billing/ai-daily-limit.ts` (extend for monthly AI credits) · storage `src/lib/r2.ts` · billing `src/lib/dodo.ts` + `constants/billing.ts` + `lib/billing/*` + webhook · sidebar `RecruiterSidebar.tsx` → generalize to `AppSidebar` + `SidebarContext` + `constants/nav.ts` · profile data `SeekerProfile`/`WorkExperience`/`Education`/`SeekerSkill` + `modules/seeker-onboarding/*` · feed `api/seeker/feed/route.ts` · job detail `modules/jobs/components/*` · rate-limit/redis `lib/rate-limit.ts` + `lib/redis.ts` · saved/dismissed `api/seeker/saved-jobs` + `dismissed-jobs`.

---

## 10. Out of Scope (v1)

Server-side auto-submit automation · managed inbox / OTP capture · app-password / ATS auto-account-creation · multiple resume profiles per user · networking module · full GDPR (DPA, consent banners, export UI) · Workday/iCIMS normalizers · broad non-tech / local-board job coverage.

---

## 11. Cross-Cutting Rules (CLAUDE.md)

Branch per phase (`staging` pull → `feature/*` → PR into `staging`; never push main/staging) · enums not string unions · path aliases · brand tokens first · mobile-first · doc-comment every fn/route/component · rate-limit every route · Zod client + server · handle isLoading/isError/empty/data.

---

## 12. End-to-End Verification (after v1 phases 1a–8)

1. `pnpm tsc` + `pnpm lint` clean; migrations apply (`migrate dev` DB1).
2. Sign up seeker → upload resume → parser prefills → review/correct → browse feed immediately.
3. Complete ATS-form fields → apply to a real ATS job → wizard → ATS-safe tailored PDF + cover → assisted submit opens correct ATS → record created → shows in tracker with notes/status-log.
4. Feed is match-ranked; low-match job shows credit warning; failed AI generation does NOT consume a credit.
5. Paste external Greenhouse/Lever/Ashby link → parses; blocked link → manual-paste fallback works.
6. Exhaust free 8 → upsell → simulate Dodo upgrade webhook (monthly + annual) → quota raised.
7. `/recruiter/*` gated off; recruiter code still builds.
8. Account delete wipes DB rows + R2 artifacts; D&I fields shown only for US jobs.
