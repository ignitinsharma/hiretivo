# Hiretivo — Development Rules

# Version: 1.0

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

```
# WRONG
import { JobCard } from '@/components/shared'
import { calculateMatchScore } from '@/modules/matching'
import { UserRole } from '@/constants'

# CORRECT
import { JobCard } from '@/components/shared/JobCard'
import { calculateMatchScore } from '@/modules/matching/utils/calculate-match'
import { UserRole } from '@/constants/enums'
```

### 3.2 Always use path aliases — never relative paths across folders

```
# WRONG (relative cross-folder)
import { Button } from '../../../components/ui/button'

# CORRECT
import { Button } from '@/components/ui/button'
```

### 3.3 Relative imports are ONLY allowed within the same module folder

```
# OK — same module, same folder level
import { formatSalary } from './format-job'
import type { JobListItem } from '../types/job.types'
```

### 3.4 Enums — single source of truth

```
# ALWAYS import enums from here — both client and server
import { UserRole, JobStatus, ApplicationStatus } from '@/constants/enums'

# NEVER import from Prisma client directly in application code
import { UserRole } from '@prisma/client'  # WRONG
```

### 3.5 Zod schemas — shared between client and server

```
# Define in lib/validations/, import in both form components and server actions
import { CreateJobSchema } from '@/lib/validations/job.schema'
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

```typescript
# WRONG
const processJob = (job: any) => { ... }

# CORRECT
const processJob = (job: JobListItem): ProcessedJob => { ... }
```

---

## 5. COMPONENT RULES

### 5.1 Component hierarchy — strictly follow this

```
src/components/ui/          → shadcn/ui base only. Never customise these files.
src/components/forms/       → Reusable form inputs (FormInput, SkillsTagInput, FileUpload)
src/components/layout/      → Headers, Footer, NotificationBell
src/components/shared/      → Any component used in 2+ modules (JobCard, MatchScoreBadge)
src/modules/[domain]/components/  → Components that belong to ONE domain only
```

### 5.2 The 2+ rule

If a component is referenced in more than one module, it must live in `src/components/shared/`.
Do not duplicate components across modules.

### 5.3 Server vs Client components

```
# Default: Server Component (no directive needed)
# Add "use client" ONLY when you need:
  - useState, useEffect, useReducer
  - TanStack Query hooks (useQuery, useMutation)
  - Zustand store access
  - Browser APIs (window, localStorage, etc.)
  - Event handlers on interactive elements
  - Third-party client-only libraries

# Pages should be Server Components where possible
# Module containers (SeekerDashboard, PostJobForm) are Client Components
# Pure UI components (JobCard, SkillTag) stay as Server Components
```

### 5.4 Props — always typed, never loose

```typescript
# WRONG
export function JobCard({ job, onApply }: any) { ... }

# CORRECT
interface JobCardProps {
  job: JobListItem
  matchScore?: number
  onApply?: () => void
  variant?: 'default' | 'compact'
}
export function JobCard({ job, matchScore, onApply, variant = 'default' }: JobCardProps) { ... }
```

### 5.5 Component file structure — always in this order

```typescript
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

```typescript
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

```typescript
// server action — always re-validate even if client already validated
"use server";
export async function createJobAction(data: unknown) {
  const parsed = CreateJobSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten() };
  // proceed with parsed.data — fully typed, fully safe
}
```

### 7.4 Form component pattern

```typescript
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
  ```typescript
  queryClient.invalidateQueries({ queryKey: ["jobs"] });
  queryClient.invalidateQueries({ queryKey: ["recommendations"] });
  ```

---

## 9. API ROUTE RULES

### 9.1 Always validate auth + role in every protected route

```typescript
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.RECRUITER)
    return new Response("Forbidden", { status: 403 });
  // proceed
}
```

### 9.2 Always validate request body with Zod

```typescript
const body = await req.json();
const parsed = CreateJobSchema.safeParse(body);
if (!parsed.success)
  return Response.json({ error: parsed.error.flatten() }, { status: 400 });
```

### 9.3 Consistent response shape

```typescript
# Success
return Response.json({ data: result }, { status: 200 })

# Created
return Response.json({ data: result }, { status: 201 })

# Validation error
return Response.json({ error: parsed.error.flatten() }, { status: 400 })

# Unauthorized
return new Response('Unauthorized', { status: 401 })

# Forbidden
return new Response('Forbidden', { status: 403 })

# Not found
return new Response('Not found', { status: 404 })

# Server error
return Response.json({ error: 'Internal server error' }, { status: 500 })
```

### 9.4 Rate limiting on sensitive routes

Apply Upstash Ratelimit to:

- `POST /api/auth` — 10 req/min per IP
- `POST /api/jobs/[id]/apply` — 5 req/min per userId
- `POST /api/upload` — 20 req/min per userId

---

## 10. MODAL RULES

### 10.1 Modal state lives in Zustand — NOT in the parent component

```typescript
# WRONG — local state for a modal that affects global behaviour
const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

# CORRECT — Zustand UI store
const { openLoginModal, closeLoginModal } = useUIStore()
```

### 10.2 Modal components live in src/components/shared/

Any modal used in more than one place: `LoginModal`, `ApplyJobModal`, confirmation dialogs.
Domain-specific modals (used only in one module): `src/modules/[domain]/components/`

### 10.3 Modal mounting

Global modals (LoginModal, ApplyJobModal) are mounted ONCE in the relevant layout file — not instantiated on every page that might need them.

```typescript
// src/app/(public)/layout.tsx
<LoginModal />   // mounted once here — available on all public pages

// src/app/(seeker)/layout.tsx
<ApplyJobModal />  // mounted once here — available on all seeker pages
```

### 10.4 Modal pattern — always use shadcn/ui Dialog

```typescript
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

| Type             | Convention                    | Example                              |
| ---------------- | ----------------------------- | ------------------------------------ |
| React components | PascalCase.tsx                | `JobCard.tsx`, `MatchScoreBadge.tsx` |
| Hooks            | use-kebab-case.ts             | `use-matched-jobs.ts`                |
| Utilities        | kebab-case.ts                 | `calculate-match.ts`                 |
| Types files      | kebab-case.types.ts           | `job.types.ts`                       |
| Zod schemas      | kebab-case.schema.ts          | `job.schema.ts`                      |
| Zustand stores   | use-kebab-case-store.ts       | `use-auth-store.ts`                  |
| Services         | kebab-case.service.ts         | `jobs.service.ts`                    |
| Server actions   | kebab-case.ts                 | `create-job.ts`                      |
| Constants        | kebab-case.ts                 | `match-thresholds.ts`                |
| Pages            | page.tsx (Next.js convention) | `page.tsx`                           |
| Layouts          | layout.tsx                    | `layout.tsx`                         |

---

## 12. STYLING RULES

### 12.1 TailwindCSS only — no inline styles, no CSS modules

```typescript
# WRONG
<div style={{ marginTop: '16px', color: '#4F46E5' }}>

# CORRECT
<div className="mt-4 text-indigo-600">
```

### 12.2 Use cn() for conditional classes

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes-here',
  isActive && 'active-classes',
  variant === 'compact' && 'compact-classes'
)}>
```

### 12.3 shadcn/ui variants — use cva for component variants

```typescript
import { cva } from "class-variance-authority";
const badgeVariants = cva("base", {
  variants: {
    intent: { success: "...", warning: "...", danger: "..." },
  },
});
```

### 12.4 Responsive design — mobile first

```
# Always write mobile styles first, then add breakpoint overrides
className="w-full md:w-1/2 lg:w-1/3"
# NOT: className="lg:w-1/3 md:w-1/2 w-full"
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

## TypeScript

- strict: true ALWAYS — no exceptions
- NEVER use 'any' — use 'unknown' and narrow it
- All params + return types must be explicitly typed
- Zod schemas in src/lib/validations/ — shared client AND server
- All Prisma queries use generated TypeScript types

## Architecture

- Server Components by default — 'use client' only when needed
- API routes ONLY in src/app/api/
- All API responses: { success: boolean, data?: T, error?: string }
- NEVER send raw Prisma errors to client
- Auth: getServerSession() for all server-side checks
- Role checks: in middleware AND in every API route handler
- Recruiter: can ONLY access their own jobs + applications
