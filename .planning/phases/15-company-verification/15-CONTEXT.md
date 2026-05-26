# Phase 15: Company Verification — Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Source:** Product brainstorm — v1.1 Trust & Conversion milestone
**Depends on:** Phase 8 (RecruiterProfile model, recruiter settings page), Phase 9 (admin panel foundation)

<domain>
## Phase Boundary

Phase 15 fixes the trust asymmetry on Hiretivo: engineers go through a rigorous 4-step verification + admin review, but any recruiter can post jobs with a Gmail account. This creates friction for engineers who question whether the company posting is real.

The solution is a two-level company verification system with automatic domain matching and a manual review fallback for freemail users.

**In scope:**
- RecruiterProfile schema extension (4 new fields)
- Level 1 auto-verification: email domain matches companyWebsite domain → instant verified
- Level 2 manual: freemail users submit LinkedIn URL + work email → admin reviews
- Recruiter settings "Company Verification" section
- "Verified Company ✓" / "Unverified" badge on JobCard, job detail, talent pool recruiter context
- Admin /admin/companies page for Level 2 pending review queue
- Email to recruiter on Level 2 approve/reject

**Out of scope:**
- LinkedIn API integration for company validation (URL stored, not verified via API)
- Automated LinkedIn scraping
- Re-verification on company details change (deferred)
- Company size / industry tagging (deferred)
- Stripe/payment-method-as-verification (deferred)

</domain>

<decisions>
## Implementation Decisions (LOCKED)

### Schema Extension — RecruiterProfile
```prisma
model RecruiterProfile {
  // ... existing fields ...
  companyVerified      Boolean   @default(false)
  companyVerifiedAt    DateTime?
  companyLinkedInUrl   String?
  companyWorkEmail     String?
}
```

### Level 1 — Auto-verification Logic
```ts
function isFreemailDomain(email: string): boolean {
  const FREEMAIL = ['gmail.com','yahoo.com','hotmail.com','outlook.com',
                    'protonmail.com','icloud.com','live.com','msn.com',
                    'ymail.com','googlemail.com']
  const domain = email.split('@')[1]?.toLowerCase()
  return FREEMAIL.includes(domain)
}

function emailMatchesCompanyDomain(email: string, companyWebsite: string): boolean {
  const emailDomain = email.split('@')[1]?.toLowerCase()
  // Normalize website: strip https://, www., trailing slash, path
  const siteDomain = companyWebsite
    .replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0].toLowerCase()
  return emailDomain === siteDomain
}
```

If `!isFreemailDomain(email) && emailMatchesCompanyDomain(email, companyWebsite)`:
→ Set `companyVerified=true`, `companyVerifiedAt=now()` immediately. No admin review needed.

If `isFreemailDomain(email)` OR email domain ≠ website domain:
→ Level 2 flow: store companyLinkedInUrl + companyWorkEmail, queue for admin review.
→ `companyVerified` stays false until admin approves.

### API Route: POST /api/recruiter/verify-company
```
POST /api/recruiter/verify-company
Auth: session required, role RECRUITER
Body: { companyLinkedInUrl?: string, companyWorkEmail?: string }
Rate limit: writeRateLimiter (5/min)

Response (Level 1 auto): { verified: true, level: 1 }
Response (Level 2 queued): { verified: false, level: 2, message: "Submitted for review" }
```

### Recruiter Settings — Company Verification Section
Location: in `src/app/recruiter/settings/page.tsx`, add "Company Verification" section at bottom.

States:
1. **Auto-verified** (companyVerified=true, auto): Green badge "Verified Company ✓" + verified date
2. **Pending Level 2** (companyVerified=false, companyWorkEmail set): Yellow "Verification pending — usually reviewed within 24hrs"
3. **Unverified — eligible for Level 1** (companyVerified=false, email matches domain): Show "Verify your company" button → POST /api/recruiter/verify-company → auto-verifies instantly
4. **Unverified — needs Level 2** (companyVerified=false, freemail): Show form: LinkedIn Company URL (required) + Work Email (required) + "Submit for Verification" button

### Badge Display
**Verified**: `<span className="inline-flex items-center gap-1 text-xs font-medium text-brand-success border border-brand-success/30 rounded-full px-2 py-0.5"><CheckCircle className="w-3 h-3" />Verified Company</span>`
**Unverified**: `<span className="inline-flex items-center gap-1 text-xs font-medium text-brand-foreground-secondary border border-brand-border rounded-full px-2 py-0.5"><Shield className="w-3 h-3" />Unverified</span>`

Show on:
- `src/components/shared/JobCard.tsx` — company name row
- `src/app/jobs/[id]/page.tsx` — job detail company section
- Talent pool recruiter context (wherever recruiter company is shown in talent pool unlock cards)

### Admin Company Verification Page — /admin/companies
Simple list of Level 2 pending verifications.
Each row: recruiter name, company name, submitted companyLinkedInUrl (clickable), companyWorkEmail, submitted date.
Actions: Approve (sets companyVerified=true, sends approval email) | Reject (sends rejection email with reason).
Route: GET /api/admin/companies (list) + POST /api/admin/companies/[id]/review (approve/reject).
Auth: admin email gate (same pattern as /admin/verification).

### Email Notifications
On Level 2 approve: "Your company Acme Inc has been verified on Hiretivo. Your job postings now show a Verified Company badge."
On Level 2 reject: "We were unable to verify [company]. Reason: [reason]. Please update your company details in settings and resubmit."
Use existing Resend client in `src/lib/resend.ts` (or `src/lib/emails/`).

### Rate Limiting
POST /api/recruiter/verify-company → writeRateLimiter (5/min) per CLAUDE.md
GET /api/admin/companies → dataFetchRateLimiter (30/min)
POST /api/admin/companies/[id]/review → writeRateLimiter (5/min)

### Claude's Discretion
- Exact placement of verification badge in JobCard (before or after company name)
- Whether to show unverified badge to seekers or only show verified badge (hide unverified entirely) — suggest: show both for transparency
- Email template design (follow existing email patterns in src/lib/emails/)
- Whether to recheck Level 1 when recruiter updates companyWebsite (suggest: yes, re-run check on settings save)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema (read + modify)
- `prisma/schema.prisma` — RecruiterProfile model; add 4 new fields

### Recruiter Settings (read + modify)
- `src/app/recruiter/settings/page.tsx` — existing settings page; add Company Verification section
- `src/app/api/recruiter/settings/route.ts` — existing PATCH handler (understand pattern)

### Job Card & Detail (read + modify)
- `src/components/shared/JobCard.tsx` — add verified/unverified badge
- `src/app/jobs/[id]/page.tsx` — add badge to company section

### Admin Panel (read + extend)
- `src/app/admin/` — existing admin page structure; add /admin/companies
- `src/app/admin/verification/page.tsx` — pattern for admin queue list page

### Email
- `src/lib/emails/` or `src/lib/resend.ts` — existing email client and templates; follow exact pattern

### Auth & Rate Limiting
- `src/lib/rate-limit.ts` — writeRateLimiter, dataFetchRateLimiter
- `src/lib/auth.ts` or auth config — admin email gate pattern (used in /admin/verification routes)

### Design System
- `DESIGN.md` — brand tokens (brand-success for verified badge)
- `CLAUDE.md` — mobile-first, no shadows, border-only

### Prior Phase Patterns
- `src/app/api/admin/verification/[id]/review/route.ts` — admin review approve/reject pattern
- `.planning/phases/09-verification-system/09-03-PLAN.md` — admin route + email pattern

</canonical_refs>

<deferred>
## Deferred

- LinkedIn API verification (just store URL; don't call LinkedIn API)
- Re-verification trigger when companyWebsite changes in settings
- Company size / industry / headcount fields
- Payment method as proxy for company legitimacy
- Automated domain WHOIS lookup for extra confidence
- Batch admin review tools

</deferred>

---
*Phase: 15-company-verification*
*Context gathered: 2026-05-26*
*Branch: feat/pivot-2.0*
