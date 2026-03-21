## Currently Working On
<!-- Update this every time you switch tasks -->
Phase: Phase 1 — Auth & Onboarding
File: —
Last thing done: Foundation setup — Prisma v7 schema, Auth.js v5, R2/Redis/Resend libs, shadcn, validations

---

## Known Issues / Blockers
<!-- Log anything broken or unclear here -->
- Apply DB migrations once `DATABASE_URL` points at Neon: `pnpm prisma migrate deploy` (or `pnpm db:migrate`).

# Hiretivo — Context Handoff

## What is Hiretivo?
Skills-based remote job portal. Brand: #5c54e6.
Stack: Next.js 14, TypeScript strict, pnpm, shadcn/ui, Tailwind,
Prisma, Neon PostgreSQL, Auth.js v5, R2, Upstash Redis, Resend, Vercel.
Two users: SEEKER (matched feed only) and RECRUITER (matched candidates only).
Match score = (seeker skills ∩ job skills) / job skills × 100
Tagline: 'Where skills meet opportunity. Remotely.'

## Current Phase
Phase [X] — [Name]

## Completed Last Session
- [list what was built]

## Current Task
[what needs to be done next]

## Blockers
[any current issues]

## Files Modified
- [list changed files]

## Decisions Made
- [log any choices like 'using dnd-kit over react-beautiful-dnd']

## DO NOT
- Do not change Prisma schema without asking
- Do not add npm packages without asking
- Do not change folder structure in src/
- Do not use 'any' type