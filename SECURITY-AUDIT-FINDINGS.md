# Security Audit Findings - Hiretivo

**Date:** 13 April 2026  
**Auditor:** GSD Security Auditor + Manual Review  
**Branch:** `security/audit-main`  
**Scope:** Full codebase security review

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| **Critical** | 1 | 🔴 Must fix immediately |
| **High** | 9 | 🟠 Must fix before production |
| **Medium** | 9 | 🟡 Should fix before production |
| **Low** | 5 | 🟢 Nice to have |

**Overall Assessment:** The application has a solid foundation with Auth.js, Zod validation on API routes, and role-based middleware. However, there are critical gaps in server action validation, role enforcement on API routes, and a debug endpoint that exposes environment configuration.

---

## CRITICAL FINDINGS

### 1. Debug Endpoint Exposing Environment Variables
- **File:** `src/app/api/debug/env/route.ts`
- **Severity:** **CRITICAL** 🔴
- **Issue:** Publicly accessible GET endpoint at `/api/debug/env` returns the presence/absence of all critical environment variables (DATABASE_URL, AUTH_SECRET, GOOGLE_CLIENT_ID, RESEND_API_KEY, R2_BUCKET_NAME) plus a 15-character prefix of the DATABASE_URL connection string. **Zero authentication or authorization.**
- **Impact:** 
  - Attackers can confirm which services are configured
  - Fingerprint database host from URL prefix (Neon project ID, database name)
  - Use as reconnaissance for targeted attacks
- **Recommendation:** **DELETE THIS FILE IMMEDIATELY.** The file's own comment says "DELETE THIS FILE after debugging!"
- **Action Required:**
  ```bash
  rm src/app/api/debug/env/route.ts
  ```

---

## HIGH FINDINGS

### 2. No Role Check on POST /api/jobs
- **File:** `src/app/api/jobs/route.ts:37-41`
- **Severity:** **High** 🟠
- **Issue:** POST handler checks `session?.user?.id` but does NOT verify `role === "RECRUITER"`. Any authenticated user (including SEEKER) can create jobs.
- **Impact:** Seekers could post fake jobs, spam the platform, or create deceptive listings
- **Recommendation:**
  ```typescript
  // Add before line 37
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  ```

### 3. Missing Role Check on PATCH/DELETE /api/jobs/[id]
- **File:** `src/app/api/jobs/[id]/route.ts:94-96` (PATCH), `line 163-165` (DELETE)
- **Severity:** **High** 🟠
- **Issue:** PATCH and DELETE handlers check `session?.user?.id` and verify ownership (`job.recruiterId !== session.user.id`), but never check that the user has `role === "RECRUITER"`.
- **Impact:** Role boundary violation — seekers who created jobs (via finding #2) could modify/delete them
- **Recommendation:** Add role check at the top of both handlers

### 4. POST /api/skills — Any Authenticated User Can Create Global Skills
- **File:** `src/app/api/skills/route.ts:26-30`
- **Severity:** **High** 🟠
- **Issue:** Skill creation only checks `session?.user?.id` with no role restriction. No rate limiting.
- **Impact:** 
  - Flood skills table with garbage data
  - Inject malicious skill names (stored and rendered in UI)
  - Disrupt matching engine by polluting skill taxonomy
- **Recommendation:** 
  - Restrict to admin/recruiter role only
  - Add rate limiting
  - Consider making skill management admin-only or seed from controlled source

### 5. Server Action `saveStep1` Accepts Unvalidated Input
- **File:** `src/app/actions/onboarding/seeker.ts:15-33`
- **Severity:** **High** 🟠
- **Issue:** Accepts raw object `{ situation: string; experienceLevel: string }` with **no Zod validation**. Values written directly to database with no length limits, sanitization, or type narrowing.
- **Impact:** 
  - Arbitrary string length (storage bloat)
  - Injection into downstream rendering contexts
  - While Prisma prevents SQL injection, unchecked length is a DoS vector
- **Recommendation:**
  ```typescript
  const step1Schema = z.object({
    situation: z.string().trim().min(1).max(500),
    experienceLevel: z.string().trim().max(100),
  });
  const parsed = step1Schema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid input' };
  ```

### 6. Server Action `saveStep2` Accepts Unvalidated Input with Type Assertion
- **File:** `src/app/actions/onboarding/seeker.ts:38-82`
- **Severity:** **High** 🟠
- **Issue:** Accepts `{ primaryRole, yearsOfExperience, skills }` without Zod validation. The `level` field is cast with `as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'` (line 63) without runtime validation.
- **Impact:** 
  - Data integrity violation
  - Potential runtime crashes
  - Storage of invalid enum values
- **Recommendation:** Add Zod validation schema for step 2 input and validate skill levels against enum before transaction

### 7. Server Action `saveStep4` Accepts Unvalidated Input
- **File:** `src/app/actions/onboarding/seeker.ts:131-167`
- **Severity:** **High** 🟠
- **Issue:** Accepts `{ salaryMin, salaryMax, currency, availability, workPreference }` with no Zod validation. `currency` stored directly with no validation. `salaryMin`/`salaryMax` accepted as `number | null` with no range checking.
- **Impact:** 
  - Negative salary values
  - Invalid currency codes
  - Excessively large numbers
- **Recommendation:**
  ```typescript
  const step4Schema = z.object({
    salaryMin: z.number().min(0).nullable(),
    salaryMax: z.number().min(0).nullable(),
    currency: z.string().length(3),
    availability: z.string().max(100).nullable(),
    workPreference: z.string().nullable(),
  });
  ```

### 8. `createJobFromOnboarding` Uses `as any` Type Assertion on jobType
- **File:** `src/app/actions/onboarding/recruiter.ts:85`
- **Severity:** **High** 🟠
- **Issue:** `jobType: data.jobType as any` bypasses TypeScript's type system entirely. Input typed as `string` with no validation.
- **Impact:** Database integrity violation or runtime crash with invalid jobType
- **Recommendation:** Validate against `JobType` enum before Prisma call using Zod

### 9. No Input Validation on `saveRecruiterProfile` Server Action
- **File:** `src/app/actions/onboarding/recruiter.ts:8-52`
- **Severity:** **High** 🟠
- **Issue:** `companyName` checked for emptiness (line 23), but all other fields (`website`, `companySize`, `bio`, `industry`, `fundingType`, `logo`) accepted without length limits or format validation. `website` not validated as URL.
- **Impact:** 
  - Stored XSS if website/bio contains script tags rendered without sanitization
  - Database bloat from unbounded strings
- **Recommendation:** 
  - Add Zod validation with max lengths
  - URL format validation for website
  - Ensure user-generated content is sanitized on render

### 10. Cron Routes Vulnerable to Timing Attack on CRON_SECRET
- **File:** `src/app/api/cron/match/route.ts:10-12`, `src/app/api/cron/stale-jobs/route.ts:11-13`
- **Severity:** **High** 🟠
- **Issue:** 
  - Simple string comparison (`authHeader !== \`Bearer ${process.env.CRON_SECRET}\``) is not constant-time
  - `CRON_SECRET` not validated at startup — if undefined, comparison becomes `authHeader !== "Bearer undefined"`, meaning anyone sending `Bearer undefined` passes
- **Impact:** 
  - If CRON_SECRET not set, anyone can trigger match computation and stale job processing
  - Timing attacks could allow attacker to deduce secret value
- **Recommendation:**
  ```typescript
  // Add at startup
  if (!process.env.CRON_SECRET) throw new Error("CRON_SECRET is required");
  
  // Use constant-time comparison
  import { timingSafeEqual } from 'crypto';
  const isValid = timingSafeEqual(
    Buffer.from(authHeader),
    Buffer.from(`Bearer ${process.env.CRON_SECRET}`)
  );
  ```

---

## MEDIUM FINDINGS

### 11. Middleware Fails Open on Database Errors
- **File:** `middleware.ts:100-115`, `line 145-157`
- **Severity:** **Medium** 🟡
- **Issue:** When database check for profile existence fails (for any reason other than "relation does not exist"), middleware calls `NextResponse.next()` — allowing request through without authorization.
- **Impact:** During database outage or error, unonboarded users could access protected dashboard routes
- **Recommendation:** Fail closed for non-schema errors — return 503 or redirect to maintenance page. Only fail open for specific "table doesn't exist" case during initial deployment

### 12. No Rate Limiting on POST /api/jobs
- **File:** `src/app/api/jobs/route.ts:37`
- **Severity:** **Medium** 🟡
- **Issue:** Job creation endpoint has no rate limiting. While plan gate limits FREE users to 1 active job, PRO/ENTERPRISE users could create hundreds of jobs rapidly.
- **Impact:** Spam, storage exhaustion, platform abuse
- **Recommendation:** Add rate limiting (e.g., 20 jobs/hour per userId) using existing `createRateLimiter` utility

### 13. No Rate Limiting on POST /api/skills
- **File:** `src/app/api/skills/route.ts:26`
- **Severity:** **Medium** 🟡
- **Issue:** Skill creation has no rate limiting, combined with no role restriction (finding #4)
- **Impact:** Attacker could flood skills table with thousands of entries rapidly
- **Recommendation:** Add rate limiting and role restriction

### 14. `x-forwarded-for` Header Can Be Spoofed for Rate Limiting
- **File:** `src/app/api/auth/change-password/route.ts:17`, `src/app/api/applications/route.ts:9`
- **Severity:** **Medium** 🟡
- **Issue:** Rate limiting uses `req.headers.get("x-forwarded-for") ?? "unknown"` or `"anonymous"`. This header can be set by client, allowing bypass by cycling through arbitrary values.
- **Impact:** Rate limiting on password changes (5/min) and job applications (5/min) can be bypassed
- **Recommendation:** 
  - Use `x-real-ip` header or `req.ip` property (more reliable on Vercel)
  - Alternatively, rate limit by user ID for authenticated endpoints

### 15. No CSRF Protection on API Routes
- **File:** All API routes
- **Severity:** **Medium** 🟡
- **Issue:** No CSRF protection mechanism (no CSRF tokens, no SameSite cookie verification, no double-submit cookie pattern). Auth.js with JWT sessions in cookies potentially vulnerable if session cookie doesn't have `SameSite=Strict` or `SameSite=Lax`.
- **Impact:** Attacker could craft malicious page triggering authenticated requests (creating jobs, changing settings)
- **Recommendation:** 
  - Verify Auth.js session cookies have `SameSite=Lax` or `SameSite=Strict`
  - Consider adding CSRF tokens for state-changing mutations

### 16. No Security Headers Configured in Next.js
- **File:** `next.config.mjs:1-20`
- **Severity:** **Medium** 🟡
- **Issue:** No `headers()` function defined. No Content-Security-Policy (CSP), no X-Frame-Options, no X-Content-Type-Options, no Referrer-Policy, no Permissions-Policy.
- **Impact:** 
  - Clickjacking (no X-Frame-Options)
  - MIME-type sniffing (no X-Content-Type-Options)
  - Various XSS vectors (no CSP)
- **Recommendation:**
  ```mjs
  const nextConfig = {
    async headers() {
      return [{
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;" },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
        ],
      }];
    },
  };
  ```

### 17. Resume Upload Infers File Type from MIME Type Only
- **File:** `src/app/actions/onboarding/seeker.ts:98`
- **Severity:** **Medium** 🟡
- **Issue:** Determines file extension purely from `resumeFile.type` (MIME type). MIME types are client-controlled and can be spoofed. No server-side content validation (magic bytes, file header checking). **Any non-DOCX MIME type defaults to `.pdf`**, including executables, scripts, or HTML files.
- **Impact:** Attacker could upload malicious `.exe`, `.js`, or `.html` file with spoofed MIME type
- **Recommendation:** 
  1. Validate file magic bytes server-side before upload
  2. Restrict allowed MIME types to strict allowlist
  3. Enforce maximum file size
  4. Set `Content-Disposition: attachment` on served files

### 18. No File Size Limit on Resume Upload
- **File:** `src/app/actions/onboarding/seeker.ts:96-100`
- **Severity:** **Medium** 🟡
- **Issue:** Only check is `resumeFile && resumeFile.size > 0`. No upper bound on file size.
- **Impact:** Storage cost abuse, potential DoS through large uploads, R2 bandwidth charges
- **Recommendation:**
  ```typescript
  const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB
  if (resumeFile.size > MAX_RESUME_SIZE) {
    return { success: false, error: "Resume must be under 5MB" };
  }
  ```

### 19. `BETTER_AUTH_SECRET` in .env.example Is Orphaned
- **File:** `.env.example:21`
- **Severity:** **Medium** 🟡
- **Issue:** Includes `BETTER_AUTH_SECRET="your-secret-here"` alongside `AUTH_SECRET`. Project uses Auth.js (next-auth), not Better Auth. Suggests migration in progress or copy-paste error.
- **Impact:** Confusion during deployment; potential for using incorrect or weak secret
- **Recommendation:** Remove `BETTER_AUTH_SECRET` from `.env.example` unless Better Auth is intentionally being adopted

---

## LOW FINDINGS

### 20. Password Schema Allows Weak Passwords
- **File:** `src/lib/validations/auth.ts:15`
- **Severity:** **Low** 🟢
- **Issue:** Password validation only requires `min(8).max(128)`. No complexity requirements (uppercase, lowercase, number, special character).
- **Impact:** Users can register with passwords like "password" or "12345678"
- **Recommendation:**
  ```typescript
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
  ```

### 21. Email Enumeration via Registration Response
- **File:** `src/app/api/auth/register/route.ts:29-33`
- **Severity:** **Low** 🟢
- **Issue:** Returns distinct 409 error with message "An account with this email already exists." Allows attackers to enumerate registered email addresses.
- **Impact:** Attacker can build list of valid user emails for phishing or credential stuffing
- **Recommendation:** Return generic 200 response: "If an account with this email exists, a verification email has been sent."

### 22. Search Parameter in Recruiter Applications Could Enable Timing-Based Enumeration
- **File:** `src/app/api/recruiter/applications/route.ts:72-78`
- **Severity:** **Low** 🟢
- **Issue:** `search` parameter performs case-insensitive `contains` query on seeker name and email. Unbounded (no max length on search string).
- **Impact:** Minimal — overly long search string could cause slow database queries
- **Recommendation:** Limit search string length (max 100 characters, min 2 characters)

### 23. No Audit Logging for Security-Sensitive Operations
- **File:** All API routes
- **Severity:** **Low** 🟢
- **Issue:** No structured audit logging for security-sensitive operations: password changes, role changes, job creation/deletion, interview scheduling.
- **Impact:** In security incident, no way to trace actions, actors, or timestamps
- **Recommendation:** Implement structured audit logging (database table or external service like Axiom/Logtail) for all security-sensitive mutations

### 24. Interview `meetLink` Not Validated as URL
- **File:** `src/lib/validations/interview.schema.ts` (inferred)
- **Severity:** **Low** 🟢
- **Issue:** `ScheduleInterviewSchema` accepts `meetLink` field, unclear if validated as proper URL. If just `z.string()`, attacker could submit `javascript:` URLs or data URIs.
- **Impact:** Stored XSS if meetLink rendered as `<a href>` without proper sanitization
- **Recommendation:** Validate with `z.string().url()` and ensure `https://` protocol. Sanitize on render.

---

## IMMEDIATE ACTION ITEMS (Priority Order)

### Phase 1: Critical (Do Now)
- [ ] **DELETE** `src/app/api/debug/env/route.ts` — production exposure risk

### Phase 2: High (Do Before Production)
- [ ] Add role checks to `POST /api/jobs`, `PATCH /api/jobs/[id]`, `DELETE /api/jobs/[id]`
- [ ] Add Zod validation to all 5 server actions that currently lack it:
  - `saveStep1`, `saveStep2`, `saveStep4` (seeker onboarding)
  - `saveRecruiterProfile`, `createJobFromOnboarding` (recruiter onboarding)
- [ ] Add file size and content-type validation to resume upload
- [ ] Add role check to `POST /api/skills`
- [ ] Add CRON_SECRET validation at startup and use constant-time comparison

### Phase 3: Medium (Should Do Before Production)
- [ ] Add security headers to `next.config.mjs`
- [ ] Add rate limiting to POST `/api/jobs` and POST `/api/skills`
- [ ] Fix middleware to fail closed on database errors (except schema errors)
- [ ] Fix `x-forwarded-for` header spoofing vulnerability
- [ ] Verify Auth.js session cookies have `SameSite=Lax` or `SameSite=Strict`
- [ ] Remove `BETTER_AUTH_SECRET` from `.env.example`

### Phase 4: Low (Nice to Have)
- [ ] Strengthen password validation requirements
- [ ] Make registration response generic to prevent email enumeration
- [ ] Add audit logging for security-sensitive operations
- [ ] Limit search parameter length in recruiter applications
- [ ] Validate interview `meetLink` as HTTPS URL

---

## Next Steps

1. **Review this document** with the team
2. **Create GitHub issues** for each finding (or group by phase)
3. **Prioritize Phase 1-2 fixes** immediately
4. **Schedule Phase 3-4** for upcoming sprints
5. **Re-audit** after fixes are deployed

---

**Document Location:** `SECURITY-AUDIT-FINDINGS.md`  
**Branch:** `security/audit-main`  
**Git Status:** Uncommitted changes to `.gitignore` and `BRANCHING-STRATEGY.md` (unrelated to audit)
