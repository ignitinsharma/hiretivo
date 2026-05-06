# Hiretivo — Development Rules

## Version: 3.0

**Apply these rules across ALL development sessions, ALL tools, ALL phases.**
**Reference this file at the start of every chat.**

---

## QUICK REFERENCE (Most Used)

### Before Building Anything

```
1. CHECK EXISTING CODE FIRST
   - Search src/services/, src/lib/, src/modules/*/ for existing functions
   - Search src/components/shared/ for reusable components
   - Check src/app/api/ for existing API routes
   - Never create duplicate functions or components

2. IF EXISTS → use it
3. IF NOT → build it
```

### Styling Priority Ladder

```
1. BRAND TOKENS    → bg-brand-primary, text-brand-foreground        [ALWAYS FIRST]
2. NATIVE TAILWIND → bg-white, text-gray-500, rounded-lg         [PREFERRED]
3. ARBITRARY      → bg-[#7560ff], text-[#0a0a0a]              [RARE - only if P1/P2 unavailable]
4. GLOBAL CSS    → Add to globals.css / tailwind.config.ts      [THEN USE P1]
5. style={{}}    → className="mt-4" NOT style={{marginTop:16}} [LAST RESORT ONLY]
```

### Imports

```ts
// Path aliases ALWAYS - never relative across folders
import { Button } from "@/components/ui/button"     // ✅
import { Button } from "../../../components/ui/button" // ❌

// Same module = relative OK
import { formatSalary } from "./format-job"
```

### Types

```ts
// NEVER any - use unknown + narrow
const processJob = (job: JobListItem): ProcessedJob => { }

// Props ALWAYS typed
interface JobCardProps {
  job: JobListItem
  matchScore?: number
  onApply?: () => void
}
```

### State

```ts
// Server data → TanStack Query
// Global UI → Zustand
// Forms → React Hook Form + Zod
// Local UI → useState
```

### Data Rendering

```ts
// NEVER repeat JSX - use .map()
{JOBS.map(job => <JobCard key={job.id} job={job} />)}

// ALWAYS handle all states
if (isLoading) return <JobListSkeleton />
if (isError) return <ErrorState />
if (!data?.jobs.length) return <EmptyState />
return <JobList jobs={data.jobs} />
```

---

## 1. PROJECT IDENTITY & STACK

### 1.1 Project Info

- **Project name:** Hiretivo
- **Domain:** hiretivo.com
- **What it is:** Skills-based remote job portal. Like Instahyre — NOT Naukri.
- **Core mechanic:** Match score = (seeker skills ∩ job required skills) / job required skills × 100
- **Two user types:** Job Seeker (role: SEEKER) and Recruiter (role: RECRUITER)
- **Auth gate:** Browse/search is public. Apply requires login — show LoginModal, not redirect.

### 1.2 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ App Router |
| Language | TypeScript (strict mode) |
| Package manager | pnpm only |
| UI components | shadcn/ui |
| Styling | TailwindCSS |
| Icons | Lucide React |
| Global state | Zustand |
| Server state | TanStack Query |
| Forms | React Hook Form |
| Validation | Zod (shared client + server) |
| ORM | Prisma |
| Database | Neon (serverless PostgreSQL) |
| Auth | Auth.js v5 |
| File storage | Cloudflare R2 |
| Cache/rate limit | Upstash Redis |
| Email | Resend |
| Date handling | date-fns |
| Hosting | Vercel |

### 1.3 Date Handling — Use date-fns

```ts
// Use date-fns for ALL date operations
import { format, addDays, isAfter } from 'date-fns'

// ❌ WRONG
new Date().toLocaleDateString()

// ✅ CORRECT
format(date, 'MMM d, yyyy')
format(addDays(now, 7), 'MMM d, yyyy')
```

---

## 2. STYLING HIERARCHY (MANDATORY)

### Priority Ladder — COPY THIS EXACTLY

```
PRIORITY 1: BRAND TOKENS          [ALWAYS FIRST]
↓ PRIORITY 2: NATIVE TAILWIND   [PREFERRED]
  ↓ PRIORITY 3: ARBITRARY       [ONLY if P1+P2 unavailable]
    ↓ PRIORITY 4: GLOBAL CSS   [ADD to config, then use P1]
      ↓ PRIORITY 5: style={{}} [LAST RESORT ONLY]
```

```ts
// ✅ CORRECT - Priority 1: Brand tokens first
className="bg-brand-primary text-brand-primary-foreground"

// ✅ CORRECT - Priority 2: Native Tailwind
className="bg-white text-gray-500 rounded-lg"

// ✅ CORRECT - Priority 3: Arbitrary only if token unavailable
className="bg-[#7560ff]"  // Only use if bg-brand-primary doesn't exist

// ❌ WRONG - style={{}} inline
style={{ marginTop: '16px', color: '#4F46E5' }}

// ✅ FIX - Use className instead
className="mt-4 text-purple-600"
```

### Brand Tokens (from DESIGN.md)

| Token | Value | Usage |
|-------|-------|-------|
| `bg-brand-primary` | `#7560ff` | Primary buttons, CTAs |
| `bg-brand-primary-dk` | `#5a47d9` | Button hover |
| `text-brand-primary-foreground` | `#ffffff` | Text on primary |
| `text-brand-foreground` | `#0a0a0a` | Headings, primary text |
| `text-brand-foreground-muted` | `#6b7280` | Body text, descriptions |
| `text-brand-foreground-secondary` | `#9ca3af` | Placeholders, captions |
| `border-brand-border` | `#e5e7eb` | Borders, dividers |
| `bg-brand-surface` | `#f9fafb` | Light backgrounds |
| `bg-brand-success` | `#16a34a` | Success states |
| `bg-brand-danger` | `#ef4444` | Error, destructive |

### Typography Scale

```ts
// Display / Hero
className="font-bold text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight"

// H1 / Page heading
className="font-bold text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight"

// H2 / Section heading
className="font-bold text-2xl md:text-3xl leading-snug tracking-tight"

// H3 / Card title
className="font-semibold text-xl leading-snug tracking-tight"

// Body
className="font-normal text-base leading-relaxed"

// Body muted
className="font-normal text-base text-muted-foreground leading-relaxed"

// Label
className="font-medium text-xs uppercase tracking-wider"
```

### Component Patterns

```ts
// Primary Button - ALWAYS use Button component with variant
import { Button } from "@/components/ui/button"
<Button variant="primary">Label</Button>

// Secondary Button
<Button variant="secondary">Label</Button>

// Ghost Icon Button
<Button variant="ghost" size="icon"><Mail /></Button>

// Card
className="rounded-xl border border-gray-200 bg-white p-6"

// Input
className="rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"

// Modal / Dialog
className="rounded-xl border border-gray-200"
```

### Button Variants Reference

| Variant | Use |
|--------|-----|
| `primary` | Main CTA, form submit |
| `secondary` | Secondary actions |
| `destructive` | Delete, remove |
| `ghost` | Inline, nav items |
| `link` | Text links |

### NEVER Do These

```ts
// ❌ NEVER inline styles
style={{ color: '#4F46E5' }}
style={{ marginTop: '16px' }}

// ❌ NEVER hardcoded hex in className (unless P3 rules applied)
className="text-[#34332s]"
className="bg-[#000000]"

// ❌ NEVER old purple/indigo colors
className="bg-indigo-600"
className="bg-purple-500"
className="bg-[#5952e5]"

// ❌ NEVER use slate-*, gray-* when brand tokens exist
className="text-slate-700"           // ✅ text-brand-foreground
className="text-gray-400"            // ✅ text-brand-foreground-muted

// ❌ NEVER shadows
className="shadow-lg"
className="shadow-md"

// ❌ NEVER dark mode
className="dark:bg-gray-900"
className="dark:text-white"

// ❌ NEVER font-extrabold (800+)
className="font-extrabold text-7xl"   // ✅ font-bold

// ❌ NEVER rounded-full on inputs/cards
className="rounded-full"             // ✅ rounded-lg or rounded-xl

// ❌ NEVER skip comments on functions/routes
// Every function needs: purpose, return value, key details
```

---

## 3. COMPONENT RULES

### 3.1 File Structure

```
src/components/ui/               → shadcn/ui base only - NEVER customize
src/components/forms/           → Reusable form inputs
src/components/layout/          → Headers, Footer
src/components/shared/         → Components used 2+ modules
src/modules/[domain]/components/ → Domain-specific only
```

### 3.2 The 2+ Rule

Components used in more than one module → `src/components/shared/`. Do NOT duplicate.

### 3.3 Server vs Client

```ts
// Server Component (default - no directive needed)
// Add "use client" ONLY when:
- useState, useEffect, useReducer
- TanStack Query hooks
- Zustand store access
- Browser APIs (window, localStorage)
- Event handlers
- Third-party client libraries
```

### 3.4 Props — Always Typed

```ts
interface JobCardProps {
  job: JobListItem
  matchScore?: number
  onApply?: () => void
  variant?: 'default' | 'compact'
}
export function JobCard({ job, matchScore, onApply, variant = 'default' }: JobCardProps)
```

### 3.5 Component Import Order

```ts
'use client'  // if needed - must be first line

// 1. React
import { useState } from 'react'

// 2. Next.js
import { useRouter } from 'next/navigation'

// 3. Third-party
import { useQuery } from '@tanstack/react-query'

// 4. Internal - lib, constants, store, hooks
import { UserRole } from '@/constants/enums'
import { useAuthStore } from '@/store/use-auth-store'

// 5. Module imports
import { calculateMatchScore } from '@/modules/matching/utils/calculate-match'

// 6. Component imports - shared first, then local
import { JobCard } from '@/components/shared/JobCard'

// 7. Type imports
import type { JobListItem } from '@/modules/jobs/types/job.types'

// 8. Interface definitions
interface Props { }

// 9. Component
export function MyComponent() { }
```

### 3.6 No Barrel Imports

```ts
// ❌ WRONG
import { JobCard } from "@/components/shared"
import { calculateMatchScore } from "@/modules/matching"

// ✅ CORRECT
import { JobCard } from "@/components/shared/JobCard"
import { calculateMatchScore } from "@/modules/matching/utils/calculate-match"
```

---

## 4. STATE & DATA

### 4.1 State Layer

| State Type | Tool | Example |
|-----------|-----|---------|
| Server data | TanStack Query | jobs list, applicants |
| Global UI | Zustand | modal, sidebar, auth |
| Form state | React Hook Form | inputs, validation |
| Local UI | useState | toggle, transient |
| URL/filter | useSearchParams | pagination |

### 4.2 Zustand Stores

```ts
// One store per domain
// use-auth-store.ts, use-ui-store.ts

// Keep thin - only global state
// Server data belongs in TanStack Query
// Use persist only for auth store
```

### 4.3 TanStack Query

```ts
// Query keys as arrays
const queryKey = ['jobs', filters]
const queryKey = ['job', id]

// staleTime: static = 5min, dynamic = 30s
// Handle isLoading, isError, data

// Invalidate after mutations
queryClient.invalidateQueries({ queryKey: ['jobs'] })
```

### 4.4 Forms — React Hook Form + Zod

```ts
const form = useForm<CreateJobInput>({
  resolver: zodResolver(CreateJobSchema),
  defaultValues: { }
})

// Zod schema in lib/validations/
// Validate in server actions too
const parsed = CreateJobSchema.safeParse(data)
if (!parsed.success) return { error: parsed.error.flatten() }
```

---

## 5. API & SERVER

### 5.1 Route Rules

```ts
// Always validate auth + role
const session = await auth()
if (!session?.user) return new Response('Unauthorized', { status: 401 })
if (session.user.role !== UserRole.RECRUITER) return new Response('Forbidden', { status: 403 })

// Validate request body with Zod
const parsed = CreateJobSchema.safeParse(await req.json())
if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

// Consistent response shape
Response.json({ data: result }, { status: 200 })
Response.json({ error: 'message' }, { status: 500 })
```

### 5.2 Rate Limiting (MANDATORY)

**ALL API routes MUST have rate limiting applied.** Use Upstash Redis ratelimit.

```ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limiter instance
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60s"),
})

// Apply to any API route
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous"
  const { success } = await ratelimit.limit(ip)
  if (!success) return new Response("Too Many Requests", { status: 429 })
  // ... rest of handler
}
```

**Default rate limits:**
| Endpoint Type | Limit |
|--------------|-------|
| Auth routes | 10 req/min per IP |
| Write operations (POST/PUT/DELETE) | 5 req/min per user |
| Read operations | 30 req/min per IP |
| File uploads | 5 req/min per userId |

### 5.3 Server Actions

```ts
"use server"
export async function createJobAction(data: unknown) {
  const parsed = CreateJobSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }
  // proceed with parsed.data
}
```

---

## 6. CODE QUALITY

### 6.1 DRY — Never Repeat JSX

```ts
// ❌ WRONG - repeated JSX
<tr><td className="py-4 px-4 text-sm">A</td></tr>
<tr><td className="py-4 px-4 text-sm">B</td></tr>

// ✅ CORRECT - data array + .map()
const ROWS = [{ label: 'A' }, { label: 'B' }]
{ROWS.map(row => <tr key={row.label}><td className={CELL_BASE}>{row.label}</td></tr>)}
```

### 6.2 Extract Repeated Classes

```ts
// ❌ WRONG - repeated className
className="py-4 px-4 text-sm text-gray-500"

// ✅ CORRECT - named constant
const CELL_BASE = 'py-4 px-4 text-sm'
const CELL_MUTED = 'text-brand-foreground-muted'
```

### 6.3 Static Data in Constants

```ts
// ❌ WRONG - hardcoded in JSX
<PricingCard title="Pro" price="$49" />

// ✅ CORRECT - typed config
const PRICING_TIERS = [{ id: 'pro', title: 'Pro', price: 49 }] as const
{PRICING_TIERS.map(tier => <PricingCard key={tier.id} tier={tier} />)}
```

### 6.4 Always Handle All States

```ts
if (isLoading) return <Skeleton />
if (isError) return <ErrorState onRetry={refetch} />
if (!data?.length) return <EmptyState />
return <Content data={data} />
```

### 6.5 Component Size

Keep components under ~80 lines JSX. Break into sub-components:
```
JobCard → JobCardHeader · JobCardSkills · JobCardFooter
Dashboard → DashboardStats · DashboardRecentJobs
```

### 6.6 Pre-commit Checklist

- [ ] No JSX repeated — use `.map()`
- [ ] No className repeated — use `cn()` or const
- [ ] No hardcoded copy in JSX — constants or props
- [ ] `any` type in props/handlers
- [ ] isLoading / isError / empty handled
- [ ] Mobile-first responsive (`sm:` → `md:` → `lg:`)
- [ ] aria-* on interactive elements
- [ ] No console.log or TODO
- [ ] All functions/API routes have descriptive comments

---

## 6.7 Mandatory Comments

Every function, API route, server action, and component must have a multi-line comment using `/* */`:

```ts
/*
 * POST /api/jobs
 * Creates a new job listing for recruiters
 * Request body: { title, description, requiredSkills, salary, location }
 * Returns: Created job object or validation errors
 */
export async function POST(req: NextRequest) {
  // ...
}

/*
 * calculateMatchScore
 * Calculates job-seeker match percentage based on skills overlap
 * @param required - Job required skills array
 * @param seeker - Seeker skills array
 * @returns number (0-100) or null if no skills match
 */
export function calculateMatchScore(required: string[], seeker: string[]): number | null {
  // ...
}

/*
 * JobCard
 * Displays job listing with match score badge and apply button
 * @param job - JobListItem object
 * @param matchScore - Optional match percentage (0-100)
 * @param onApply - Optional callback for apply button
 */
export function JobCard({ job, matchScore, onApply }: JobCardProps) {
  // ...
}
```

### Comment Requirements

- **API Routes**: Method (GET/POST/etc), purpose, request body if applicable, response format
- **Server Actions**: Purpose, input validation, return value, side effects
- **Utility Functions**: What it calculates/transforms, inputs, outputs
- **Components**: What it renders, props it accepts, key behaviors
- **Complex Logic**: Add inline comments for non-obvious code blocks

---

## 7. GIT & NAMING

### 7.1 Commit Format

```
type(scope): short description

feat(jobs): add skills tag input
fix(auth): correct oauth redirect
chore(db): add status index
refactor(matching): extract calculation
```

Types: `feat`, `fix`, `chore`, `refactor`, `style`, `test`, `docs`

### 7.2 Branch Naming

```
feature/phase-1-foundation
feature/job-detail-page
fix/login-modal-redirect
```

### 7.3 Never Commit

```
.env.local (any .env with values)
node_modules/
.next/
API keys, tokens, secrets
```

### 7.4 File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase.tsx | JobCard.tsx |
| Hooks | use-kebab-case.ts | use-matched-jobs.ts |
| Utils | kebab-case.ts | calculate-match.ts |
| Types | kebab-case.types.ts | job.types.ts |
| Schemas | kebab-case.schema.ts | job.schema.ts |
| Stores | use-kebab-store.ts | use-auth-store.ts |
| Services | kebab-case.service.ts | job.service.ts |
| Constants | kebab-case.ts | match-thresholds.ts |

---

## 8. QUICK REFERENCE (Bottom)

### Core Rules Summary

```ts
// CHECK FIRST - before building anything
// 1. Search services/, lib/, modules/*/, components/shared/, app/api/
// 2. If exists → use it. If not → build it
// 3. Never create duplicate functions/components

// STYLING - Priority ladder
className="bg-brand-primary"           // 1st: brand tokens
className="bg-gray-100"              // 2nd: native tailwind
className="bg-[#7560ff]"            // 3rd: arbitrary (rare)
className="mt-4" NOT style={{}}     // 5th: last resort

// IMPORTS - path aliases
import { X } from "@/path/folder"   // NEVER ../../../

// TYPES - never any
interface Props { job: Job; }
function fn(item: Item): Output { }

// STATE - right tool
TanStack Query → server data
Zustand → global UI
RHF + Zod → forms
useState → local

// RENDER - DRY
{JOBS.map(job => <JobCard />)}  // NEVER copy-paste JSX

// ERRORS - all states
if (isLoading) return <Skeleton />
if (isError) return <Error />
if (!data) return <Empty />
// data rendering

// DESIGN - match DESIGN.md
bg-brand-primary = #7560ff (purple)
text-brand-foreground = #0a0a0a
rounded-lg = buttons/inputs
rounded-xl = cards/modals
NO shadows - borders only
NO dark mode
```

---

**End of Rules**