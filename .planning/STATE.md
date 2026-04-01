# State: Hiretivo

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-01)

**Core value:** Seekers see only the jobs they match — match score drives every surface, from feed ranking to per-skill breakdowns.
**Current focus:** Milestone v1.0 — defining requirements and roadmap

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-01 — Milestone v1.0 started

## Accumulated Context

- All UI pages are pre-built via Stitch — never modify components, layouts, or styles
- Tech stack is fixed: Next.js 14 App Router, TypeScript strict, Prisma + Neon PostgreSQL, Auth.js v5, Cloudflare R2, Upstash Redis, Resend, Vercel
- Plan tiers (FREE/STARTER/GROWTH/ENTERPRISE) are visible everywhere but no payment processing in V1
- matchScore formula: `(|seeker.skills ∩ job.requiredSkills|) / |job.requiredSkills| × 100`
- Codebase maps available at `.planning/codebase/`
- Research artifacts available at `.planning/research/`
