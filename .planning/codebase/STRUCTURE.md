# Codebase Structure

## Overview

Next.js 15 App Router project using a feature-module architecture. Two distinct user roles (recruiter, seeker) each have their own module tree, route group, and dashboard.

---

## Top-Level Directory Layout

```
hiretivo/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   ├── components/             # Shared/reusable UI components
│   ├── modules/                # Feature modules (business logic + UI per domain)
│   ├── store/                  # Zustand global state stores
│   ├── lib/                    # Utilities, DB clients, validations
│   ├── types/                  # Global TypeScript type augmentations
│   └── auth.ts                 # NextAuth configuration entry point
├── prisma/                     # Prisma schema and migrations
├── public/                     # Static assets
├── .planning/                  # GSD planning artifacts
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

---

## `src/app/` — Route Tree

Organized using Next.js route groups:

```
src/app/
├── (auth)/                     # Auth route group (no shared layout)
│   ├── recruiter/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── onboarding/page.tsx
│   └── seeker/
│       ├── login/page.tsx
│       ├── register/page.tsx
│       └── onboarding/page.tsx
├── (public)/                   # Public-facing pages
│   ├── pricing/page.tsx
│   └── how/page.tsx
├── recruiter/                  # Recruiter dashboard (protected)
│   ├── layout.tsx              # Recruiter shell layout
│   ├── dashboard/page.tsx
│   ├── jobs/page.tsx
│   ├── applications/page.tsx
│   ├── talent/page.tsx
│   └── settings/page.tsx
├── seeker/                     # Seeker dashboard (protected)
│   ├── layout.tsx              # Seeker shell layout
│   ├── dashboard/page.tsx
│   ├── applications/page.tsx
│   └── settings/page.tsx
├── api/                        # API Routes
│   ├── auth/
│   │   ├── [...nextauth]/      # NextAuth handler
│   │   ├── signup/
│   │   └── resend-verification/
│   ├── onboarding/
│   │   └── step1/ … step5/    # Seeker onboarding steps
│   └── recruiter/
│       └── onboarding/         # Recruiter onboarding
├── jobs/[id]/page.tsx          # Public job detail
├── companies/[id]/page.tsx     # Public company profile
├── about/page.tsx
├── error.tsx                   # Error boundary
├── not-found.tsx               # 404 page
├── layout.tsx                  # Root layout (fonts, providers)
├── page.tsx                    # Landing page
└── globals.css
```

---

## `src/modules/` — Feature Modules

Each module owns its own components, hooks, queries, types, and utils:

```
src/modules/
├── recruiter/
│   ├── dashboard/
│   │   ├── components/         # ActiveJobsList, ApplicationTrendChart, etc.
│   │   └── data/               # mock-dashboard-data.ts
│   └── jobs/
│       └── components/         # PostJobModal.tsx
├── recruiter-onboarding/
│   ├── components/             # RecruiterOnboardingContainer + step components
│   ├── hooks/
│   ├── queries/
│   ├── types/
│   └── index.ts                # Public module export
├── seeker/
│   ├── applications/
│   │   ├── components/         # ApplicationCard, ApplicationList
│   │   ├── data/               # mock-applications.ts
│   │   └── types/
│   ├── dashboard/
│   │   ├── components/         # ProfileStrengthCard, RecommendedJobsList, etc.
│   │   └── data/               # mock-dashboard-data.ts
│   └── settings/
│       └── components/         # PersonalInfoSection, PasswordSecuritySection, etc.
└── seeker-onboarding/
    ├── components/             # SeekerOnboardingContainer + StepWelcome, StepSkills, etc.
    ├── hooks/
    ├── queries/
    ├── types/
    ├── utils/
    └── index.ts
```

---

## `src/components/` — Shared Components

```
src/components/
├── auth/
│   ├── AuthLayout.tsx          # Shared auth page wrapper
│   ├── OAuthButton.tsx
│   └── PasswordInput.tsx
├── forms/
│   └── skills-tag-input.tsx
├── landing/                    # Landing page sections
├── layout/
│   ├── Header.tsx
│   └── Footer.tsx
├── shared/
│   └── ApplyJobModal.tsx       # Global job apply modal
└── ui/                         # shadcn/ui components (Button, Input, etc.)
```

---

## `src/store/` — Zustand Stores

```
src/store/
├── use-recruiter-onboarding-store.ts   # Multi-step recruiter onboarding state
├── use-seeker-onboarding-store.ts      # Multi-step seeker onboarding state
└── use-ui-store.ts                     # Global UI state (modals, toasts)
```

---

## `src/lib/` — Utilities & Clients

```
src/lib/
├── prisma.ts           # Prisma singleton client
├── redis.ts            # Redis/Upstash client
├── r2.ts               # Cloudflare R2 storage client
├── resend.ts           # Resend email client
├── rate-limit.ts       # Rate limiting helper
├── utils.ts            # cn() and general utilities
└── validations/
    ├── auth.ts
    ├── job.ts
    ├── profile.ts
    ├── recruiter-onboarding.schema.ts
    └── seeker-onboarding.schema.ts
```

---

## Key File Locations

| Purpose | Path |
|---------|------|
| Root layout | `src/app/layout.tsx` |
| Landing page | `src/app/page.tsx` |
| NextAuth config | `src/auth.ts` |
| Prisma client | `src/lib/prisma.ts` |
| Tailwind config | `tailwind.config.ts` |
| Seeker onboarding store | `src/store/use-seeker-onboarding-store.ts` |
| Recruiter onboarding store | `src/store/use-recruiter-onboarding-store.ts` |
| Global error page | `src/app/error.tsx` |
| 404 page | `src/app/not-found.tsx` |

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Pages | `page.tsx` | `src/app/recruiter/dashboard/page.tsx` |
| Layouts | `layout.tsx` | `src/app/recruiter/layout.tsx` |
| React components | PascalCase `.tsx` | `StepWelcome.tsx`, `AuthLayout.tsx` |
| Hooks | camelCase with `use-` prefix, kebab-case file | `use-seeker-onboarding-store.ts` |
| Stores | `use-[name]-store.ts` | `use-ui-store.ts` |
| Validation schemas | `[name].schema.ts` | `seeker-onboarding.schema.ts` |
| Types files | `[name].types.ts` | `application.types.ts` |
| Mock data | `mock-[name].ts` | `mock-dashboard-data.ts` |
| API routes | `route.ts` inside route directory | `src/app/api/auth/signup/route.ts` |
| Path aliases | `@/` maps to `src/` | `@/components/ui/button` |

---

## Adding New Code

- **New feature** → create `src/modules/[role]/[feature]/` with components/, hooks/, types/
- **New page** → add `page.tsx` under `src/app/[role]/[route]/`
- **New API endpoint** → add `route.ts` under `src/app/api/[path]/`
- **New component** → `src/components/shared/` if cross-cutting, module folder if feature-specific
- **New validation** → `src/lib/validations/[name].schema.ts`
- **New store** → `src/store/use-[name]-store.ts`

---

*Generated: 2026-04-01*
