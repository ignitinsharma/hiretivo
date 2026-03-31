# Codebase Concerns

**Analysis Date:** 2026-04-01

## Tech Debt

**Missing Test Infrastructure:**
- Issue: No testing framework configured despite npm script `test` which exits with error message
- Files: `package.json`
- Impact: Cannot verify code quality, regression testing impossible, CI/CD cannot validate builds
- Fix approach: Install Jest or Vitest, create test files for critical paths (auth, validation, API routes), configure GitHub Actions for automated testing on commits

**No API Route Protection/Middleware:**
- Issue: Only one API route exists (`/api/auth`), but no global middleware or request validation for potential future routes
- Files: No middleware.ts found at root; only auth routes implemented
- Impact: New API routes may lack rate limiting, CORS handling, authentication checks if developer forgets to implement
- Fix approach: Create `src/middleware.ts` to handle global CORS, rate limiting (using existing `@upstash/ratelimit`), authentication, and request logging

**Unimplemented Server Actions:**
- Issue: `/src/app/actions/auth` directory exists but is empty; expected to contain server-side auth handlers
- Files: `src/app/actions/auth/` (empty)
- Impact: Form submissions using server actions may fail or behave unexpectedly if auth handlers are missing
- Fix approach: Implement server actions for sign-up, login, and password reset with proper error handling

**Missing Environment Variable Documentation:**
- Issue: 8+ critical env vars required (DATABASE_URL, RESEND_API_KEY, R2_*, UPSTASH_*) but not documented
- Files: `src/lib/prisma.ts`, `src/lib/redis.ts`, `src/lib/r2.ts`, `src/lib/resend.ts`
- Impact: Developers cannot set up local environment; production deployment may fail silently if vars missing
- Fix approach: Create `.env.example` with all required variables; add setup guide to README.md

## Known Bugs

**Password Reset Flow Missing:**
- Symptoms: No password recovery mechanism visible in auth flows
- Files: `src/app/(auth)/seeker/login/page.tsx`, `src/app/(auth)/recruiter/login/page.tsx`
- Trigger: User forgets password → no recovery link/reset flow → stuck
- Workaround: Manual support intervention (not ideal)

**File Upload Validation Missing:**
- Symptoms: Resume upload in `StepResume.tsx` accepts file without validating type/size
- Files: `src/modules/seeker-onboarding/components/StepResume.tsx`
- Trigger: User uploads 500MB file or non-PDF → crashes R2 upload or fails silently
- Workaround: None; currently depends on client-side browser validation

**Google OAuth Configuration Optional But Not Handled:**
- Symptoms: Google signin fails gracefully if env vars missing, but no UI indication to user that OAuth unavailable
- Files: `src/auth.ts` (lines 22-38), Google provider conditionally included
- Trigger: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing → OAuth button shown but non-functional
- Workaround: Only use credentials-based auth; remove Google button from UI

## Security Considerations

**Password Storage Insufficient:**
- Risk: Passwords validated for min 8 chars but no strength meter or check against common passwords
- Files: `src/lib/validations/auth.ts` (line 52: `.min(8)`)
- Current mitigation: bcryptjs used for hashing (good), but no breach database check
- Recommendations: Add zxcvbn library for strength estimation; check passwords against Have I Been Pwned API before storing

**Session Callback Database Query on Every Request:**
- Risk: `jwt` and `session` callbacks query Prisma database every time session is refreshed (could be thousands per day)
- Files: `src/auth.ts` (lines 83-91, 118-126)
- Current mitigation: Caching could be added, but currently no caching layer between JWT and DB
- Recommendations: Implement Redis caching for user role/plan with 1-hour TTL; only bypass cache on explicit session update

**Next-Auth Beta Version:**
- Risk: Using `next-auth@5.0.0-beta.30` — beta software in production means potential security patches, API changes
- Files: `package.json` (line 49)
- Current mitigation: None explicit
- Recommendations: Plan upgrade to stable v5 release when available; monitor next-auth security advisories

**File URL Expiration Documentation:**
- Risk: Resume files uploaded to R2 with signed URLs expiring in 1 hour, but no indication to seekers that links expire
- Files: `src/lib/r2.ts` (lines 54-63)
- Current mitigation: Comments document this, but runtime doesn't prevent expired-link access attempts
- Recommendations: Add error page for expired file access; implement refresh-URL mechanism; store file keys in DB for re-generation

**No CSRF Protection Visible:**
- Risk: Form submissions use NextAuth which handles CSRF, but no explicit middleware verification
- Files: `src/app/(auth)/*/page.tsx` forms rely on NextAuth callbacks
- Current mitigation: NextAuth's built-in CSRF protection
- Recommendations: Add explicit CSRF token verification middleware if moving away from NextAuth

**Credentials Provider Stores Passwords:**
- Risk: Credentials are used but `signIn('credentials', {email, password, ...})` call passes extra fields (name, role, companyName) that aren't standard
- Files: `src/app/(auth)/recruiter/register/page.tsx` (line 84-90)
- Current mitigation: Fields not stored in session callback, only validated role/plan from DB
- Recommendations: Separate registration from sign-in; use dedicated POST endpoint for registration; verify signIn doesn't leak credentials in logs

## Performance Bottlenecks

**Oversized Components Without Code Splitting:**
- Problem: `sidebar.tsx` (773 lines), `pricing-client.tsx` (661 lines), `page.tsx` (704 lines) sent as full bundles to client
- Files: `src/components/ui/sidebar.tsx`, `src/app/(public)/pricing/pricing-client.tsx`, `src/app/page.tsx`
- Cause: Large client components in tree, no route-level code splitting beyond Next.js defaults
- Improvement path: Extract components into separate files (e.g., SidebarItem, PricingCard); use React.lazy() for below-fold content; implement route prefetching

**N+1 Database Queries in Session Callback:**
- Problem: User role/plan fetched from DB on every jwt/session callback, potentially 10+ times per request across auth state checks
- Files: `src/auth.ts` (lines 83-91, 118-126: redundant SELECT * queries)
- Cause: Callbacks don't cache results between jwt and session phases
- Improvement path: Cache user metadata in Redis with 5-min TTL; invalidate on session update only

**Missing Image Optimization:**
- Problem: `next.config.mjs` has empty `remotePatterns: []`, preventing Next.js Image optimization
- Files: `next.config.mjs` (line 5)
- Cause: No remote image domains configured
- Improvement path: Add Cloudflare R2 domain to remotePatterns; implement Image component in place of `<img>` tags

## Fragile Areas

**Onboarding State Management:**
- Files: `src/store/use-recruiter-onboarding-store.ts`, `src/store/use-seeker-onboarding-store.ts`
- Why fragile: State persisted to localStorage via zustand's persist middleware; migration function exists but only handles oldStep > 4; if schema changes (e.g., new step added), old data becomes invalid
- Safe modification: Add version field to persisted state; implement comprehensive migrate function for each field; add validation before using persisted data
- Test coverage: No tests visible for store migrations; store updates in components lack validation

**Authentication Redirect Flow:**
- Files: `src/app/(auth)/recruiter/register/page.tsx` (lines 81-115), `src/app/(auth)/seeker/register/page.tsx`
- Why fragile: Registration uses `signIn()` callback, but redirect logic on success is hardcoded to `/recruiter/onboarding` or `/seeker/onboarding`; if those routes move or change structure, signup breaks silently
- Safe modification: Extract redirect URL to constant; add error logging if redirect fails
- Test coverage: No tests for signup flow; hard to verify redirect behavior without E2E tests

**Resume File Upload and Display:**
- Files: `src/modules/seeker-onboarding/components/StepResume.tsx`, `src/lib/r2.ts`
- Why fragile: File stored with key pattern `resumes/{seekerId}/resume.pdf`; if seekerId changes, old resume key becomes inaccessible; no orphan cleanup if new resume uploaded
- Safe modification: Add migration for seekerId changes; implement orphan cleanup; version file keys
- Test coverage: No unit tests for R2 upload/delete; can't verify file lifecycle

**Form Validation Duplication:**
- Files: `src/lib/validations/auth.ts` contains 6+ similar schemas (loginSchema, seekerLoginSchema, recruiterLoginSchema) with slight variations
- Why fragile: Changing core validation (e.g., email format) requires updating multiple schemas; easy to miss one and create validation inconsistency
- Safe modification: Extract shared validation rules to constants; compose schemas from reusable parts
- Test coverage: No test coverage for validation schemas

## Scaling Limits

**Single R2 Bucket Without Prefix Isolation:**
- Current capacity: 1 bucket with prefixes (resumes/, avatars/, company-logos/); can scale to millions of files
- Limit: No tenant isolation; if multi-tenant in future, all data mixes
- Scaling path: Add org/company ID to prefix; implement per-tenant access policies; add lifecycle rules to delete orphaned resumes > 30 days old

**Redis Rate Limiting Single Instance:**
- Current capacity: @upstash/redis REST API can handle ~1000 req/min per endpoint
- Limit: As user base grows, rate limits may hit (10 auth reqs/min, 5 apply/min shared across all users); no per-user quota
- Scaling path: Implement per-user rate limiting tier based on plan (FREE: 5 applies/day, PRO: unlimited); add burst allowance

**Prisma Database Without Read Replicas:**
- Current capacity: Single Neon database connection via adapter-pg
- Limit: Heavy queries (dashboard analytics, talent search) may slow writes; no replication for failover
- Scaling path: Enable Neon auto-scaling; add Prisma caching layer or implement read replicas via Neon's multi-region

## Dependencies at Risk

**Next.js 14.2.35 (Non-LTS):**
- Risk: Next.js 14.2 will be end-of-life in April 2026; v15 released; upgrading may require Turbopack migration
- Impact: Security patches will stop; performance improvements in v15 unavailable; newer packages will require v15
- Migration plan: Upgrade to Next.js 15 when stable; test error/not-found components (changed in v15); validate build times

**NextAuth 5.0.0-beta.30:**
- Risk: Beta version; breaking changes possible; no guaranteed upgrade path to final release
- Impact: Auth logic may break on v5 final release; API surface may change
- Migration plan: Pin exact version; monitor releases; plan upgrade 2 weeks after v5 final released; test credential flow thoroughly

**@Prisma/Adapter-pg (Brand New):**
- Risk: PrismaAdapter for PostgreSQL is new (v7.5.0); may have edge cases with connection pooling
- Impact: Connection leaks possible under high load; type mismatches between adapter and client
- Migration plan: Monitor for connection issues in staging; implement connection pooling limits; test disaster scenarios (DB down)

**Resend Email Service (Third-Party):**
- Risk: Email delivery depends on Resend API uptime; no fallback mail service
- Impact: Password reset, onboarding emails fail if Resend down; users cannot recover accounts
- Migration plan: Implement queue system (Bull, RabbitMQ) for email retry; add fallback SMTP service

## Missing Critical Features

**Email Verification on Signup:**
- Problem: Users can register with any email; no verification step ensures real email before account use
- Blocks: Spam account creation, fake account abuse, notification delivery failures
- Fix: Add verification token step after signup; use Resend to send verification link; block unverified users from accessing features

**Two-Factor Authentication (2FA):**
- Problem: No 2FA for account security; single password compromise = full account takeover
- Blocks: Enterprise plan feature; compliance requirements (some companies require 2FA)
- Fix: Implement TOTP or SMS 2FA; add to settings page; require for PRO/ENTERPRISE tiers

**Job Application Deduplication:**
- Problem: Users can apply to same job multiple times; no duplicate check
- Blocks: Spam applications, recruiter confusion, analytics accuracy
- Fix: Add unique constraint on (userId, jobId); return existing application instead of creating duplicate

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: Validation schemas, rate limiters, file upload helpers, auth callbacks
- Files: `src/lib/validations/`, `src/lib/rate-limit.ts`, `src/lib/r2.ts`, `src/auth.ts`
- Risk: Refactoring breaks validation without detection; auth logic regression undetectable
- Priority: High — auth and validation are highest-risk areas

**No Integration Tests:**
- What's not tested: End-to-end signup/login flow, resume upload → display, job application → recruiter sees it
- Files: All API routes, server actions, database operations
- Risk: Can't verify features work together; E2E tests with real DB/R2 take 10+ minutes to run
- Priority: High — need smoke tests for critical user paths

**No E2E Tests:**
- What's not tested: UI flows, form validation, error states, OAuth flow
- Files: All page components
- Risk: Visual regressions undetectable; accessibility regressions undetected
- Priority: Medium — Playwright setup recommended

**Missing Storybook:**
- What's not tested: Component behavior in isolation (sidebar, modal, form states)
- Files: All components in `src/components/`
- Risk: Can't verify components render correctly with different props; integration bugs with form/dialog composition
- Priority: Medium — helpful for component debugging but not critical for MVP

---

*Concerns audit: 2026-04-01*
