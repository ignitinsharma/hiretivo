# Architecture

**Analysis Date:** 2026-04-01

## Pattern Overview

**Overall:** Next.js App Router with modular feature-based architecture and role-based separation

**Key Characteristics:**
- Server-side rendering with Next.js 14 and TypeScript
- Two distinct user roles with separate dashboard/layout hierarchies (Recruiter and Seeker)
- Modular feature-based organization under `/src/modules/`
- Database-first approach with Prisma ORM and PostgreSQL
- Centralized state management using Zustand for UI state
- NextAuth.js for authentication with JWT sessions
- Zod for runtime validation with schema-first design

## Layers

**Presentation Layer:**
- Purpose: UI components and pages
- Location: `src/app/`, `src/components/`
- Contains: Page components, layout wrappers, UI primitives (Radix), shared components
- Depends on: Module components, store, validations, hooks
- Used by: Routes and entry points

**Module Layer:**
- Purpose: Feature-specific business logic and components organized by domain
- Location: `src/modules/`
- Contains: Feature-specific components, types, mock data, business logic
- Depends on: Presentation components, services, store
- Used by: App routes via page components

**Service/Integration Layer:**
- Purpose: External service orchestration and database access
- Location: `src/lib/` (utilities and configurations)
- Contains: Prisma client initialization, AWS S3 client, Redis/rate-limiting, Resend email service
- Depends on: Environment configuration
- Used by: API routes, server-side page logic

**State Management Layer:**
- Purpose: Client-side ephemeral state (modals, UI state)
- Location: `src/store/`
- Contains: Zustand stores for UI state (ApplyJobModal, PostJobModal)
- Depends on: Nothing
- Used by: Components across the app

**Validation Layer:**
- Purpose: Runtime schema validation for inputs and API payloads
- Location: `src/lib/validations/`
- Contains: Zod schemas for auth, jobs, profiles, onboarding
- Depends on: Zod library
- Used by: Forms, API routes, server actions

**Authentication Layer:**
- Purpose: User identity and session management
- Location: `src/auth.ts`, `src/app/api/auth/[...nextauth]/`
- Contains: NextAuth configuration, JWT callbacks, credential provider
- Depends on: Prisma, bcryptjs, NextAuth
- Used by: Middleware (implicit), server components

## Data Flow

**User Authentication Flow:**

1. User submits credentials on login/register page (`src/app/(auth)/*/login|register`)
2. Form validates against Zod schema (`src/lib/validations/auth.ts`)
3. Credentials sent to NextAuth handler (`src/app/api/auth/[...nextauth]/route.ts`)
4. NextAuth delegates to custom Credentials provider in `src/auth.ts`
5. Provider queries Prisma for user, validates bcrypt hash
6. JWT token created with user role and plan from callback
7. Session updated with role/plan enriched from database in session callback
8. User redirected to role-specific dashboard

**Job Application Flow:**

1. Seeker clicks "Apply" button in job detail view
2. `useUIStore` global store triggers `openApplyModal(jobId)`
3. Modal component `src/components/shared/ApplyJobModal.tsx` rendered globally
4. Form submission validates against job application schema
5. Database record created via Prisma
6. Application status tracked in `ApplicationStatus` enum
7. Seeker can view application history in dashboard

**Onboarding Flow:**

1. New user routed to role-specific onboarding route
   - Recruiter: `src/app/(auth)/recruiter/onboarding`
   - Seeker: `src/app/(auth)/seeker/onboarding`
2. Zustand store (`src/store/use-recruiter-onboarding-store.ts` or `use-seeker-onboarding-store.ts`) manages multi-step state
3. Steps rendered via module components (`src/modules/onboarding/` or `src/modules/seeker-onboarding/`)
4. Form data validated at each step
5. On completion, user profile persisted to database
6. Redirect to role-specific dashboard

**State Management:**

- **Global UI State:** Zustand stores in `src/store/` (modal open/close state, job ID for apply)
- **Server State:** Prisma client (`src/lib/prisma.ts`) single instance pattern
- **Session State:** NextAuth JWT with enriched callbacks
- **Form State:** React Hook Form for multi-step forms with Zod validation

## Key Abstractions

**Role-Based Routing:**

- Purpose: Isolate recruiter and seeker experiences with separate layouts
- Examples: `src/app/recruiter/layout.tsx`, `src/app/seeker/layout.tsx`
- Pattern: Protected routes via middleware (implicit NextAuth), role check on layout/page components

**Module/Feature Organization:**

- Purpose: Co-locate related components, types, and mock data by domain
- Examples: `src/modules/recruiter/dashboard/`, `src/modules/seeker-onboarding/`
- Pattern: Each module exports public interface via `index.ts` barrel files, local components not exported

**UI Component System:**

- Purpose: Reusable, composable UI primitives
- Examples: `src/components/ui/` (Radix-based components: Button, Dialog, Select, Tabs)
- Pattern: Wrapper components expose Radix props, styled with Tailwind via className

**Zod Schema-First Validation:**

- Purpose: Single source of truth for data shape and constraints
- Examples: `src/lib/validations/job.ts`, `src/lib/validations/seeker-onboarding.schema.ts`
- Pattern: Define schema with `z.object()`, infer TypeScript type with `z.infer<typeof schema>`

**Enum Synchronization:**

- Purpose: Prevent type mismatches between Prisma enums and UI code
- Examples: `src/constants/enums.ts` mirrors Prisma schema enums
- Pattern: Never import `@prisma/client` enums in UI code; use app-wide constants instead

## Entry Points

**Public Homepage:**
- Location: `src/app/page.tsx`
- Triggers: Direct navigation to `/`
- Responsibilities: Hero section, job search preview, navigation to auth

**Auth Routes:**
- Location: `src/app/(auth)/recruiter/login`, `src/app/(auth)/recruiter/register`, `src/app/(auth)/seeker/login`, `src/app/(auth)/seeker/register`
- Triggers: User authentication flow
- Responsibilities: Form rendering, validation, NextAuth sign-in integration

**NextAuth Handler:**
- Location: `src/app/api/auth/[...nextauth]/route.ts`
- Triggers: All authentication requests (sign-in, sign-out, callback, session)
- Responsibilities: Route requests to NextAuth handlers, delegate to configured providers

**Recruiter Dashboard:**
- Location: `src/app/recruiter/dashboard/page.tsx`
- Triggers: Authenticated recruiter navigation
- Responsibilities: Render recruiter-specific dashboard components from `src/modules/recruiter/dashboard/`

**Seeker Dashboard:**
- Location: `src/app/seeker/dashboard/page.tsx`
- Triggers: Authenticated seeker navigation
- Responsibilities: Render seeker-specific dashboard components from `src/modules/seeker/dashboard/`

**Job Detail:**
- Location: `src/app/jobs/[id]/page.tsx`
- Triggers: User clicks on job card or direct URL
- Responsibilities: Fetch job details, render job detail components, trigger apply modal on button click

## Error Handling

**Strategy:** Error boundaries at layout level, graceful fallbacks for missing data

**Patterns:**
- `src/app/error.tsx` - Global error boundary for unhandled exceptions
- `src/app/not-found.tsx` - Custom 404 page
- Zod parsing failures return `null` in auth provider (fails gracefully)
- Database query failures allow components to render skeleton/fallback UI
- Try-catch blocks in server-side data fetching (implicit in page components)

## Cross-Cutting Concerns

**Logging:** Console-based, debug mode in development (Prisma logs in dev)

**Validation:** Zod schema validation at form submission, API route entry points; type safety via TypeScript inference

**Authentication:** NextAuth.js JWT strategy with session enrichment callbacks; role/plan stored in token and session

**Authorization:** Implicit via route segment groups `(auth)` and `(public)`; explicit role checks in components (planned)

---

*Architecture analysis: 2026-04-01*
