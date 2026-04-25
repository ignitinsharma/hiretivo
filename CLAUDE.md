# Hiretivo — Development Rules

# Version: 2.0

# Apply these rules across ALL development sessions, ALL tools, ALL phases.

# This file lives at the root of the repo. Reference it at the start of every chat.

---

## 1. PROJECT IDENTITY

- **Project name:** Hiretivo
- **Domain:** hiretivo.com
- **What it is:** Skills-based remote job portal. Like Instahyre — NOT Naukri.
- **Core mechanic:** Match score = (seeker skills ∩ job required skills) / job required skills × 100
- **Two user types:** Job Seeker (role: SEEKER) and Recruiter (role: RECRUITER)
- **Auth gate:** Browse/search is public. Apply requires login — show LoginModal, not redirect.

---

## 2. STACK (DO NOT DEVIATE)

| Layer                | Technology                      |
| -------------------- | ------------------------------- |
| Framework            | Next.js 14+ App Router          |
| Language             | TypeScript — strict mode always |
| Package manager      | pnpm only                       |
| UI components        | shadcn/ui                       |
| Styling              | TailwindCSS                     |
| Icons                | Lucide React                    |
| Global state         | Zustand                         |
| Server state / cache | TanStack Query (React Query)    |
| Forms                | React Hook Form                 |
| Validation           | Zod (shared client + server)    |
| ORM                  | Prisma                          |
| Database             | Neon — serverless PostgreSQL    |
| Auth                 | Auth.js v5 (next-auth beta)     |
| File storage         | Cloudflare R2                   |
| Cache / rate limit   | Upstash Redis                   |
| Email                | Resend                          |
| Hosting              | Vercel                          |

---

## 3. ABSOLUTE IMPORT RULES

### 3.1 No barrel imports

```ts
// WRONG
import { JobCard } from "@/components/shared";
import { calculateMatchScore } from "@/modules/matching";
import { UserRole } from "@/constants";

// CORRECT
import { JobCard } from "@/components/shared/JobCard";
import { calculateMatchScore } from "@/modules/matching/utils/calculate-match";
import { UserRole } from "@/constants/enums";
```

### 3.2 Always use path aliases — never relative paths across folders

```ts
// WRONG (relative cross-folder)
import { Button } from "../../../components/ui/button";

// CORRECT
import { Button } from "@/components/ui/button";
```

### 3.3 Relative imports are ONLY allowed within the same module folder

```ts
// OK — same module, same folder level
import { formatSalary } from "./format-job";
import type { JobListItem } from "../types/job.types";
```

### 3.4 Enums — single source of truth

```ts
// ALWAYS import enums from here — both client and server
import { UserRole, JobStatus, ApplicationStatus } from "@/constants/enums";

// NEVER import from Prisma client directly in application code
import { UserRole } from "@prisma/client"; // WRONG
```

### 3.5 Zod schemas — shared between client and server

```ts
// Define in lib/validations/, import in both form components and server actions
import { CreateJobSchema } from "@/lib/validations/job.schema";
```

---

## 4. TYPESCRIPT RULES

- **No `any` type.** Ever. Use `unknown` and narrow it, or define a proper interface.
- **No type assertions (`as SomeType`)** unless you can add a comment explaining why it's safe.
- **All function parameters and return types must be typed** — no implicit `any`.
- **Prefer `interface` for object shapes**, `type` for unions, intersections, and computed types.
- **Export types separately** from implementation using `export type { }`.
- **No `@ts-ignore`** — fix the actual type error.
- **`@ts-expect-error`** is allowed only in test files with a comment explaining why.

```ts
// WRONG
const processJob = (job: any) => { ... }

// CORRECT
const processJob = (job: JobListItem): ProcessedJob => { ... }
```

---

## 5. COMPONENT RULES

### 5.1 Component hierarchy — strictly follow this

```
src/components/ui/                    → shadcn/ui base only. Never customise these files.
src/components/forms/                 → Reusable form inputs (FormInput, SkillsTagInput, FileUpload)
src/components/layout/                → Headers, Footer, NotificationBell
src/components/shared/               → Any component used in 2+ modules (JobCard, MatchScoreBadge)
src/modules/[domain]/components/      → Components that belong to ONE domain only
```

### 5.2 The 2+ rule

If a component is referenced in more than one module, it must live in `src/components/shared/`.
Do not duplicate components across modules.

### 5.3 Server vs Client components

```ts
// Default: Server Component (no directive needed)
// Add "use client" ONLY when you need:
//   - useState, useEffect, useReducer
//   - TanStack Query hooks (useQuery, useMutation)
//   - Zustand store access
//   - Browser APIs (window, localStorage, etc.)
//   - Event handlers on interactive elements
//   - Third-party client-only libraries

// Pages should be Server Components where possible
// Module containers (SeekerDashboard, PostJobForm) are Client Components
// Pure UI components (JobCard, SkillTag) stay as Server Components
```

### 5.4 Props — always typed, never loose

```ts
// WRONG
export function JobCard({ job, onApply }: any) { ... }

// CORRECT
interface JobCardProps {
  job: JobListItem
  matchScore?: number
  onApply?: () => void
  variant?: 'default' | 'compact'
}
export function JobCard({ job, matchScore, onApply, variant = 'default' }: JobCardProps) { ... }
```

### 5.5 Component file structure — always in this order

```ts
'use client' // if needed — must be first line

// 1. React imports
import { useState } from 'react'

// 2. Next.js imports
import { useRouter } from 'next/navigation'

// 3. Third-party imports
import { useQuery } from '@tanstack/react-query'

// 4. Internal imports — lib, constants, store, hooks (in that order)
import { UserRole } from '@/constants/enums'
import { useAuthStore } from '@/store/use-auth-store'

// 5. Module imports
import { calculateMatchScore } from '@/modules/matching/utils/calculate-match'

// 6. Component imports — shared first, then local
import { JobCard } from '@/components/shared/JobCard'
import { JobFilters } from './JobFilters'

// 7. Type imports
import type { JobListItem } from '@/modules/jobs/types/job.types'

// 8. Interface/type definitions for this file
interface Props { ... }

// 9. Component definition
export function MyComponent({ ... }: Props) { ... }
```

---

## 6. MODULE RULES

### 6.1 Module structure — every module follows this shape

```
src/modules/[domain]/
├── components/     UI components that belong ONLY to this domain
├── hooks/          Custom hooks for this domain
├── queries/        TanStack Query hooks (use-fetch-*.ts, use-mutate-*.ts)
├── types/          TypeScript types for this domain (*.types.ts)
├── utils/          Pure helper functions for this domain
└── index.ts        Public API — only export what other modules need
                    (internal components are NOT exported here)
```

### 6.2 When to create a new module

Create a module when a feature has:

- 3 or more components that belong exclusively to it
- Its own data fetching / mutations
- A conceptually distinct domain

Do NOT create a module for:

- Single components → `src/components/shared/`
- Generic utilities → `src/utils/`
- Reusable form inputs → `src/components/forms/`

### 6.3 Cross-module imports

Modules should NOT import from each other's internal files.
If module A needs something from module B, it must import from B's `index.ts` only.
If something is needed by 3+ modules, extract it to `src/components/shared/` or `src/utils/`.

---

## 7. FORM RULES

### 7.1 Always use React Hook Form + Zod — never uncontrolled forms

```ts
const form = useForm<CreateJobInput>({
  resolver: zodResolver(CreateJobSchema),
  defaultValues: { ... }
})
```

### 7.2 Zod schema lives in lib/validations/ — not in the component file

```
src/lib/validations/auth.schema.ts
src/lib/validations/job.schema.ts
src/lib/validations/seeker.schema.ts
src/lib/validations/application.schema.ts
```

### 7.3 Server actions validate independently — never trust client data

```ts
"use server";
export async function createJobAction(data: unknown) {
  const parsed = CreateJobSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };
  // proceed with parsed.data — fully typed, fully safe
}
```

### 7.4 Form component pattern

```ts
const onSubmit = async (data: CreateJobInput) => {
  setIsSubmitting(true);
  try {
    const result = await createJobAction(data);
    if (result?.error) {
      toast.error("Something went wrong");
      return;
    }
    toast.success("Job posted successfully");
    router.push("/recruiter/jobs");
  } catch {
    toast.error("Unexpected error. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 8. STATE MANAGEMENT RULES

### 8.1 State layer — use the right tool for the job

| State type                  | Tool                  | Example                              |
| --------------------------- | --------------------- | ------------------------------------ |
| Server data (API responses) | TanStack Query        | jobs list, applicants, notifications |
| Global UI state             | Zustand               | modal open/close, sidebar, auth user |
| Form state                  | React Hook Form       | all form inputs and validation       |
| Local component state       | useState              | toggle, counter, transient UI        |
| URL / filter state          | useSearchParams + URL | search filters, pagination, tab      |

### 8.2 Zustand stores

- One store per domain — `use-auth-store.ts`, `use-ui-store.ts`
- Keep stores thin — only state that is genuinely global
- Do NOT put server data in Zustand — that belongs in TanStack Query
- Use `persist` middleware only for auth store (persisted to localStorage)

### 8.3 TanStack Query

- Always define query keys as arrays: `['jobs', filters]`, `['job', id]`
- Set appropriate `staleTime`: static data = 5 min, frequently changing = 30s
- Always handle `isLoading`, `isError`, and `data` states in the UI
- Invalidate related queries after mutations:

```ts
queryClient.invalidateQueries({ queryKey: ["jobs"] });
queryClient.invalidateQueries({ queryKey: ["recommendations"] });
```

---

## 9. API ROUTE RULES

### 9.1 Always validate auth + role in every protected route

```ts
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.RECRUITER)
    return new Response("Forbidden", { status: 403 });
  // proceed
}
```

### 9.2 Always validate request body with Zod

```ts
const body = await req.json();
const parsed = CreateJobSchema.safeParse(body);
if (!parsed.success)
  return Response.json({ error: parsed.error.flatten() }, { status: 400 });
```

### 9.3 Consistent response shape

```ts
return Response.json({ data: result }, { status: 200 }); // Success
return Response.json({ data: result }, { status: 201 }); // Created
return Response.json({ error: parsed.error.flatten() }, { status: 400 }); // Validation error
return new Response("Unauthorized", { status: 401 });
return new Response("Forbidden", { status: 403 });
return new Response("Not found", { status: 404 });
return Response.json({ error: "Internal server error" }, { status: 500 });
```

### 9.4 Rate limiting on sensitive routes

Apply Upstash Ratelimit to:

- `POST /api/auth` — 10 req/min per IP
- `POST /api/jobs/[id]/apply` — 5 req/min per userId
- `POST /api/upload` — 20 req/min per userId

---

## 10. MODAL RULES

### 10.1 Modal state lives in Zustand — NOT in the parent component

```ts
// WRONG — local state for a modal that affects global behaviour
const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

// CORRECT — Zustand UI store
const { openLoginModal, closeLoginModal } = useUIStore();
```

### 10.2 Modal components live in src/components/shared/

Any modal used in more than one place: `LoginModal`, `ApplyJobModal`, confirmation dialogs.
Domain-specific modals (used only in one module): `src/modules/[domain]/components/`

### 10.3 Modal mounting

Global modals (LoginModal, ApplyJobModal) are mounted ONCE in the relevant layout file — not instantiated on every page that might need them.

```ts
// src/app/(public)/layout.tsx
<LoginModal />    // mounted once here — available on all public pages

// src/app/(seeker)/layout.tsx
<ApplyJobModal /> // mounted once here — available on all seeker pages
```

### 10.4 Modal pattern — always use shadcn/ui Dialog

```ts
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Never build custom modal from scratch — use Dialog
```

---

## 11. FILE NAMING RULES

| Type             | Convention              | Example                              |
| ---------------- | ----------------------- | ------------------------------------ |
| React components | PascalCase.tsx          | `JobCard.tsx`, `MatchScoreBadge.tsx` |
| Hooks            | use-kebab-case.ts       | `use-matched-jobs.ts`                |
| Utilities        | kebab-case.ts           | `calculate-match.ts`                 |
| Types files      | kebab-case.types.ts     | `job.types.ts`                       |
| Zod schemas      | kebab-case.schema.ts    | `job.schema.ts`                      |
| Zustand stores   | use-kebab-case-store.ts | `use-auth-store.ts`                  |
| Services         | kebab-case.service.ts   | `jobs.service.ts`                    |
| Server actions   | kebab-case.ts           | `create-job.ts`                      |
| Constants        | kebab-case.ts           | `match-thresholds.ts`                |
| Pages            | page.tsx                | `page.tsx`                           |
| Layouts          | layout.tsx              | `layout.tsx`                         |

---

## 12. STYLING RULES

### 12.1 TailwindCSS only — no inline styles, no CSS modules

```ts
// WRONG
<div style={{ marginTop: '16px', color: '#4F46E5' }}>

// CORRECT
<div className="mt-4 text-indigo-600">
```

### 12.2 Use cn() for conditional classes

```ts
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes-here',
  isActive && 'active-classes',
  variant === 'compact' && 'compact-classes'
)}>
```

### 12.3 shadcn/ui variants — use cva for component variants

```ts
import { cva } from "class-variance-authority";

const badgeVariants = cva("base", {
  variants: {
    intent: { success: "...", warning: "...", danger: "..." },
  },
});
```

### 12.4 Responsive design — mobile first

```ts
// CORRECT — mobile styles first, breakpoint overrides after
className = "w-full md:w-1/2 lg:w-1/3";

// WRONG
className = "lg:w-1/3 md:w-1/2 w-full";
```

---

## 13. MATCHING ENGINE RULES

These rules apply whenever touching matching logic:

- Match score calculation lives ONLY in `src/modules/matching/utils/calculate-match.ts`
- Score is always an integer 0–100
- Comparison is always case-insensitive + trimmed
- Score is stored on the `Application` model at creation time — never recalculated on read
- Recommendation feed cache key: `"recommendations:{userId}"` in Redis, TTL 15 minutes
- Invalidate cache whenever seeker updates their skills
- Score thresholds are imported from `@/constants/enums` (MatchThreshold)
- Never hardcode 80, 60, 40 — always use `MatchThreshold.STRONG`, `MatchThreshold.GOOD`, `MatchThreshold.PARTIAL`

---

## 14. GIT RULES

### 14.1 Commit message format

```
type(scope): short description

feat(jobs): add skills tag input to post job form
fix(auth): correct redirect after google oauth login
chore(db): add index on application status field
refactor(matching): extract score calculation to pure function
```

Types: `feat`, `fix`, `chore`, `refactor`, `style`, `test`, `docs`

### 14.2 Branch naming

```
feature/phase-1-foundation
feature/phase-3-job-detail-page
fix/login-modal-redirect
```

### 14.3 Never commit

- `.env.local` or any `.env` with real values
- `node_modules/`
- `.next/`
- Any file with API keys, tokens, or secrets

---

## 15. UI CODE QUALITY — DRY & PRODUCTION-READY

> These rules govern how UI code must be written. Every piece of UI must read like a senior engineer wrote it — readable, non-repetitive, and maintainable. Violations found in code review are treated the same as TypeScript errors: block the PR.

### 15.1 Never repeat JSX structure — use data arrays + .map()

Repeated JSX blocks (table rows, list items, cards, nav links) MUST be extracted into a typed data array and rendered via `.map()`. Copy-pasting the same JSX block more than once is a hard violation.

The pattern seen in the screenshot — raw `<tr>` blocks repeated for every feature row with identical `className` strings — is **forbidden**.

```tsx
// ❌ WRONG — copy-pasted JSX, class strings repeated, impossible to maintain
<tr>
  <td className="py-6 px-4 text-sm font-semibold text-slate-700">Smart Interview Scheduling</td>
  <td className="py-6 px-4 text-sm text-slate-400">—</td>
  <td className="py-6 px-4 text-sm text-slate-600">Basic</td>
<td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">✓</td>
<td className="py-6 px-4 text-sm text-slate-600">{isAnnual ? 'Full' : 'Custom Pipeline'}</td>
</tr>
// ... same pattern repeated 8 more times

// ✅ CORRECT — typed config, single cell renderer, one render loop
type PlanValue = string | boolean | null

interface FeatureRow {
  feature: string
  starter: PlanValue
  pro: PlanValue
  enterprise: PlanValue
}

// Defined at module level — outside the component
const FEATURE_ROWS: FeatureRow[] = [
  { feature: 'Smart Interview Scheduling', starter: null,    pro: 'Basic', enterprise: true  },
  { feature: 'ATS Dashboard',             starter: null,    pro: 'Basic', enterprise: true  },
  { feature: 'API Access',                starter: null,    pro: true,    enterprise: true  },
  { feature: 'Support',                   starter: 'Email', pro: 'Email + Chat', enterprise: true },
  { feature: 'Team Seats',                starter: null,    pro: null,    enterprise: true  },
]

function FeatureCell({ value, isAnnual }: { value: PlanValue; isAnnual?: boolean }) {
  if (value === null)  return <td className={cn(TD_BASE, 'text-slate-400')}>—</td>
  if (value === true)  return <td className={cn(TD_BASE, 'text-brand-primary font-bold')}>✓</td>
  if (value === 'pipeline') {
    return <td className={cn(TD_BASE, 'text-slate-600')}>{isAnnual ? 'Full' : 'Custom Pipeline'}</td>
  }
  return <td className={cn(TD_BASE, 'text-slate-600')}>{value}</td>
}

// In the component
{FEATURE_ROWS.map((row) => (
  <tr key={row.feature}>
    <td className={cn(TD_BASE, 'font-semibold text-slate-700')}>{row.feature}</td>
    <FeatureCell value={row.starter} />
    <FeatureCell value={row.pro} isAnnual={isAnnual} />
    <FeatureCell value={row.enterprise} />
  </tr>
))}
```

### 15.2 Extract repeated className strings into named constants

If the same Tailwind string appears more than once, pull it into a `const` or `cva` variant. Never repeat a long `className` string.

```tsx
// ❌ WRONG — same string copy-pasted across the file
<td className="py-6 px-4 text-sm text-slate-400">...</td>
<td className="py-6 px-4 text-sm text-slate-400">...</td>
<td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">...</td>
<td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">...</td>

// ✅ CORRECT — named, reusable, easy to update globally
const TD_BASE    = 'py-6 px-4 text-sm'
const CELL_MUTED = cn(TD_BASE, 'text-slate-400')
const CELL_BODY  = cn(TD_BASE, 'text-slate-600')
const CELL_LABEL = cn(TD_BASE, 'font-semibold text-slate-700')
const CELL_PRO   = cn(TD_BASE, 'font-bold text-brand-primary bg-brand-primary-light/50')
const CELL_CHECK = cn(TD_BASE, 'font-bold text-brand-primary')
```

### 15.3 Conditional rendering — no inline ternary sprawl in JSX

Conditional JSX that spans multiple lines or branches belongs in a sub-component or helper, not inlined in the return.

```tsx
// ❌ WRONG — logic buried inside JSX, hard to read and test
<td className="py-6 px-4 text-sm text-slate-600">
  {isAnnual ? "Priority" : "Priority + Phone"}
</td>;

// ✅ CORRECT — named component, clear intent, easy to change
function SupportCell({ isAnnual }: { isAnnual: boolean }) {
  return (
    <td className={CELL_BODY}>{isAnnual ? "Priority" : "Priority + Phone"}</td>
  );
}
```

### 15.4 All static display data belongs in config constants — never hardcoded in JSX

Nav links, pricing tiers, feature lists, FAQ items, tab labels, step indicators — define them as typed arrays at module level. The component only renders; it does not own content.

```tsx
// ❌ WRONG — content hardcoded in JSX, impossible to update without touching the component
<PricingCard title="Starter" price="Free" features={['5 job posts', 'Basic support']} />
<PricingCard title="Pro"     price="$49"  features={['Unlimited posts', 'ATS', 'Priority support']} />

// ✅ CORRECT — typed config, single source of truth
interface PricingTier {
  id:           string
  title:        string
  monthlyPrice: number
  annualPrice:  number
  features:     string[]
  highlighted:  boolean
  cta:          string
}

// src/constants/pricing.ts
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter', title: 'Starter', monthlyPrice: 0, annualPrice: 0,
    features: ['5 job posts', 'Basic support'],
    highlighted: false, cta: 'Get started',
  },
  {
    id: 'pro', title: 'Pro', monthlyPrice: 49, annualPrice: 39,
    features: ['Unlimited posts', 'ATS Dashboard', 'Priority support'],
    highlighted: true, cta: 'Start free trial',
  },
]

// Component — renders only, owns no content
{PRICING_TIERS.map((tier) => (
  <PricingCard key={tier.id} tier={tier} isAnnual={isAnnual} />
))}
```

### 15.5 Constant file placement

```
src/constants/enums.ts          → UserRole, JobStatus, MatchThreshold (single source of truth — existing rule)
src/constants/pricing.ts        → PRICING_TIERS, FEATURE_ROWS, PLAN_LIMITS
src/constants/nav.ts            → NAV_LINKS, FOOTER_LINKS, DASHBOARD_NAV
src/constants/site.ts           → SITE_NAME, SITE_URL, META_DEFAULTS

src/modules/jobs/constants/     → JOB_TYPES, EXPERIENCE_LEVELS, SALARY_RANGES (domain-specific only)
src/modules/seeker/constants/   → SKILL_CATEGORIES, PROFILE_STEPS
```

### 15.6 Keep components small — extract sub-components aggressively

A component whose JSX exceeds ~80 lines is doing too much. Break it.

```
// ✅ Correct decomposition
PricingSection
├── PricingToggle          (monthly / annual switch)
├── PricingGrid            (.map over PRICING_TIERS)
│   └── PricingCard        (single tier card)
│       ├── PricingCardHeader
│       ├── PricingFeatureList
│       └── PricingCardCta
└── PricingCompareTable    (.map over FEATURE_ROWS)
    └── FeatureCell        (single cell renderer)

// ✅ Same pattern for other domains
JobCard → JobCardHeader · JobCardSkills · JobCardFooter · JobCardActions
Dashboard → DashboardStats · DashboardRecentJobs · DashboardActivity
```

### 15.7 Always handle all data states — never assume data exists

```tsx
// ❌ WRONG — crashes on load, shows nothing on error
return <JobList jobs={data.jobs} />;

// ✅ CORRECT — all three states handled
if (isLoading) return <JobListSkeleton />;
if (isError)
  return <ErrorState message="Failed to load jobs" onRetry={refetch} />;
if (!data?.jobs.length) return <EmptyState message="No jobs found" />;
return <JobList jobs={data.jobs} />;
```

### 15.8 Naming — components and variables must be self-documenting

```tsx
// ❌ WRONG — vague, context-free names
function Card() {}
function Item() {}
const data = [...]
const val = isAnnual ? x : y

// ✅ CORRECT — domain-aware, unambiguous
function JobCard() {}
function ApplicationListItem() {}
const ACTIVE_JOB_FILTERS: JobFilter[] = [...]
const displayedPrice = isAnnual ? tier.annualPrice : tier.monthlyPrice
```

### 15.9 Pre-commit checklist — before marking any UI task done

Run through this before every PR. Any unchecked item is a reason to block merge.

- [ ] No JSX block appears more than once — use `.map()` with typed data arrays
- [ ] No `className` string appears more than once — use `cn()`, `cva()`, or named `const`
- [ ] No hardcoded copy in JSX — all strings live in constants or come from props
- [ ] No `any` in props, handlers, or event types
- [ ] `isLoading`, `isError`, and empty states are all handled
- [ ] Mobile-first responsive classes applied (`sm:` → `md:` → `lg:`)
- [ ] All interactive elements have correct `aria-*` attributes
- [ ] No `console.log` left in code
- [ ] No `TODO` comments committed — open a GitHub issue instead
- [ ] Component is under ~80 lines of JSX — if not, split it

---

## 16. DESIGN SYSTEM — MANDATORY FOR ALL UI CODE

> `DESIGN.md` at the repo root is the single source of truth for all visual decisions.
> Every UI feature MUST follow it. No exceptions.

### 16.1 Always reference DESIGN.md before writing any UI

Before writing any component, page, or layout:
1. Read `DESIGN.md` for colors, typography, spacing, and component patterns
2. Use only colors defined in `DESIGN.md` — never invent new hex values
3. Use only typography scale from `DESIGN.md` — never freestyle font sizes

### 16.2 Color usage rules (from DESIGN.md)

```tsx
// Primary CTA button — always Primary Indigo + White text
className="bg-[#5952e5] text-white rounded-full hover:scale-105 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#5952e5]/30"

// Primary text
className="text-[#0e0f0c]"

// Muted / secondary text
className="text-[#868685]"

// Card / container border
className="border border-[rgba(14,15,12,0.12)] rounded-2xl"

// Light primary surface / badge background
className="bg-[rgba(89,82,229,0.1)]"

// NEVER use green/lime colors for brand elements:
// ❌ bg-[#9fe870], text-[#163300], bg-[#e2f6d5], emerald-*, green-*
// ✅ Use bg-[#5952e5], text-white, bg-[rgba(89,82,229,0.1)] instead
```

### 16.3 Typography rules (from DESIGN.md)

```tsx
// Display hero — Wise Sans 900, 0.85 line-height, calt
className="font-display text-[96px] font-black leading-[0.85] [font-feature-settings:'calt']"

// Section heading
className="font-display text-[64px] font-black leading-[0.85] [font-feature-settings:'calt']"

// Card title
className="font-sans text-[26px] font-semibold leading-[1.23] tracking-[-0.39px] [font-feature-settings:'calt']"

// Body
className="font-sans text-[18px] font-normal leading-[1.44] tracking-[0.18px] [font-feature-settings:'calt']"

// Body semibold (default reading weight)
className="font-sans text-[18px] font-semibold leading-[1.44] tracking-[-0.108px] [font-feature-settings:'calt']"
```

### 16.4 Button rules (from DESIGN.md)

```tsx
// Primary pill button — always this pattern
<button className="bg-[#5952e5] text-white font-semibold px-[16px] py-[5px] rounded-full transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#5952e5]/30">
  Label
</button>

// Secondary subtle pill
<button className="bg-[rgba(89,82,229,0.08)] text-[#0e0f0c] font-semibold px-4 py-2 rounded-full transition-transform hover:scale-105 active:scale-95">
  Label
</button>
```

### 16.5 Card / container rules (from DESIGN.md)

```tsx
// Standard card (max 16px radius)
className="rounded-2xl border border-[rgba(14,15,12,0.12)] p-6"

// Large card / table container (max 24px)
className="rounded-3xl border border-[rgba(14,15,12,0.12)] p-8"

// Small card
className="rounded-2xl border border-[rgba(14,15,12,0.12)] p-4"
```

### 16.6 Input / modal rules (from DESIGN.md)

```tsx
// Input fields — max 16px border-radius, primary color focus
className="rounded-2xl border border-input focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/30"

// Modal / Dialog — max 16px border-radius
className="rounded-2xl"

// NEVER use rounded-[30px] or rounded-[40px] on inputs/modals
// NEVER use rounded-full on input fields
```

### 16.6 Animation rules (from DESIGN.md)

```tsx
// All interactive elements use scale — never color-only hover
className="transition-transform hover:scale-105 active:scale-95"

// Never do this (color-only hover, no scale)
className="hover:bg-green-400"  // WRONG
```

### 16.7 What NOT to do

```tsx
// WRONG — using green/lime colors (old brand)
className="bg-[#9fe870] text-[#163300]"  // WRONG — old Wise green
className="bg-emerald-500 text-emerald-100"  // WRONG — use primary instead

// WRONG — inventing colors not in DESIGN.md
className="bg-indigo-600 text-white rounded-lg"

// WRONG — light font weights on display text
className="text-6xl font-medium"

// WRONG — relaxed line-height on display
className="font-black text-8xl leading-tight"  // leading-tight = 1.25, not 0.85

// WRONG — traditional box shadow
className="shadow-lg"

// WRONG — excessive border-radius on inputs/modals
className="rounded-[30px]"  // WRONG — max 16px on inputs/modals
className="rounded-[40px]"  // WRONG — max 24px on cards

// CORRECT — primary color CTA
className="bg-[#5952e5] text-white rounded-full"

// CORRECT — ring shadow only (from DESIGN.md)
className="shadow-[rgba(89,82,229,0.12)_0px_0px_0px_1px]"

// CORRECT — input with primary focus
className="rounded-2xl border border-input focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/30"
```

---

## TypeScript (quick reference)

- `strict: true` always — no exceptions
- NEVER use `any` — use `unknown` and narrow it
- All params + return types must be explicitly typed
- Zod schemas in `src/lib/validations/` — shared client AND server
- All Prisma queries use generated TypeScript types

## Architecture (quick reference)

- Server Components by default — `'use client'` only when needed
- API routes ONLY in `src/app/api/`
- All API responses: `{ data?: T, error?: string }`
- NEVER send raw Prisma errors to client
- Auth: `auth()` for all server-side checks
- Role checks: in middleware AND in every API route handler
- Recruiter: can ONLY access their own jobs + applications

---

## 17. CLIENT API SERVICE LAYER

### 17.1 Axios only for client API calls

- Client-side API calls must use the typed axios instance from `src/lib/axios.ts`.
- Never call `fetch()` from pages, components, hooks, or TanStack Query functions.
- Never import `apiClient` directly in a page or component. Always call a service function.
- `apiClient` uses `baseURL: "/api"`, so service paths must be relative API paths like `/jobs`, not `/api/jobs`.
- Axios error normalization happens in `src/lib/axios.ts`; do not add `res.ok` checks or manual JSON parsing in UI code.

### 17.2 Service file rules

- Put client API wrappers in `src/services/*.service.ts`.
- One service per domain is preferred: `job.service.ts`, `application.service.ts`, `seeker.service.ts`, `recruiter.service.ts`, `billing.service.ts`, `auth.service.ts`, `skill.service.ts`.
- Services are pure TypeScript modules. No React imports, no hooks, no Zustand stores, no router, no toast.
- Every service function must have explicit parameter types and explicit `Promise<T>` return types.
- Never return `Promise<any>`.
- Services may transform raw API responses into existing UI/domain types when that transformation already existed at the call site.

### 17.3 Query and mutation hooks

```ts
// CORRECT
queryFn: () => jobService.getJobs(filters)

// WRONG
queryFn: async () => {
  const res = await fetch('/api/jobs')
  return res.json()
}
```

- TanStack Query `queryFn` and mutation functions should delegate to a single service call.
- Keep existing `queryKey`, `enabled`, `staleTime`, retry, and invalidation behavior unchanged unless the feature requires a behavior change.
- UI side effects stay in hooks/components: toast, router navigation, modal close, form reset, and query invalidation.

### 17.4 Server-side exceptions

- Server Actions (`"use server"`) do not use axios. They call Prisma or server utilities directly.
- API route handlers under `src/app/api/` do not use axios. They are the API server.
- Non-fetch URL construction strings such as email verification links and OAuth callback URLs may still contain `/api/`.

### 17.5 Tailwind spacing discipline

- Prefer Tailwind scale utilities over arbitrary pixel values whenever the value exists in Tailwind.
- Use `px-5`, `py-4`, `w-20`, `h-10`, `gap-6`, etc. instead of `px-[20px]`, `py-[16px]`, `w-[80px]`, `h-[40px]`, `gap-[24px]`.
- Arbitrary values are allowed only when DESIGN.md explicitly requires a non-scale value, such as `text-[96px]`, `leading-[0.85]`, color tokens, or custom ring shadows.

### 17.6 Domain enum discipline

- Never hardcode domain enum values directly in application logic, services, validators, or API routes.
- Import enum values and enum value arrays from `src/constants/enums.ts`.
- This applies to roles, plans, job status, application status, interview status, job type, work type, apply type, skill level, billing period, currency, pricing tier IDs, and AI message roles.
- Zod schemas must use exported enum value arrays such as `USER_ROLE_VALUES`, `JOB_STATUS_VALUES`, `JOB_TYPE_VALUES`, and `BILLING_PERIOD_VALUES`.
- Literal strings are still allowed for user-facing copy, CSS classes, route paths, query keys, and labels.
