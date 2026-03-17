# Hiretivo — Project Context

> Paste this file at the start of ANY new chat in ANY AI tool (Cursor, Codex, Windsurf, Antigravity, Claude, etc.) to instantly restore full context.

---

## Project
- **Name:** Hiretivo
- **Domain:** hiretivo.com
- **Type:** Skills-based remote job portal (like Instahyre, not Naukri)
- **Repo:** Mono-repo — Next.js handles frontend + backend together

## Stack
- Framework: Next.js 14 App Router, TypeScript strict mode
- Package manager: pnpm
- UI: React 18, shadcn/ui, TailwindCSS, Lucide React
- State: Zustand (global), TanStack Query (server), React Hook Form (forms)
- Validation: Zod — shared between frontend and server actions
- Database: Neon PostgreSQL + Prisma ORM
- Auth: Auth.js v5 (next-auth beta) + Google OAuth + email/password
- Files: Cloudflare R2 (avatars, resumes, logos)
- Cache: Upstash Redis (recommendation feed + rate limiting)
- Email: Resend (verification, password reset, notifications)
- Hosting: Vercel

## Hard Rules (never break these)
1. No barrel imports — always import from the exact file path
2. Enums only from `@/constants/enums.ts` — never from Prisma directly
3. No `any` types — TypeScript strict throughout
4. Always use `@/` path aliases, never relative paths across folders
5. Component used in 2+ modules → move to `src/components/shared/`
6. No index.ts that just re-exports from another index.ts

## Key Files
- Enums: `src/constants/enums.ts`
- DB schema: `prisma/schema.prisma`
- Auth config: `src/lib/auth.ts`
- Prisma client: `src/lib/db.ts`
- Global stores: `src/store/use-auth-store.ts`, `src/store/use-ui-store.ts`
- Zod schemas: `src/lib/validations/`

## User Roles
- SEEKER → onboarding at /onboarding → dashboard at /dashboard
- RECRUITER → onboarding at /recruiter/onboarding → dashboard at /recruiter/dashboard

## Core Feature: Skills Matching
- Seeker has `skills: String[]` on SeekerProfile
- Job has `requiredSkills: String[]` on Job model
- Match score = (overlapping skills / total required skills) * 100
- Score >= 80: Strong Match, >= 60: Good Match, >= 40: Partial, rest: Low
- Recommendation feed cached in Redis per seeker, TTL 15 min
- Cache invalidated when seeker updates their skills

---

## Build Progress
<!-- Update this after completing each phase -->

- [x] Phase 1 — Foundation & project setup
- [ ] Phase 2 — Authentication system
- [ ] Phase 3 — Public pages
- [ ] Phase 4 — Seeker onboarding
- [ ] Phase 5 — Seeker dashboard + matching engine
- [ ] Phase 6 — Application flow
- [ ] Phase 7 — Recruiter onboarding
- [ ] Phase 8 — Recruiter features
- [ ] Phase 9 — Notifications
- [ ] Phase 10 — Polish + deploy

---

## Currently Working On
<!-- Update this every time you switch tasks -->
Phase: Phase 1 — Foundation & project setup
File: CONTEXT.md
Last thing done: Initialized Next.js project with UI and TS configuration
Next step: Configure shadcn/ui and TailwindCSS

---

## Known Issues / Blockers
<!-- Log anything broken or unclear here -->