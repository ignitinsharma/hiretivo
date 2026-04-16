---
phase: 10-settings-restructure-auth-guards
plan: 01
status: complete
---

## Plan 01: Recruiter Settings Restructure + Backend APIs

### What was built

**Recruiter Settings Page:**
- Removed Company tab (4 → 3 tabs: Profile, Security, Billing)
- Replaced avatar upload button with initials-only circle derived from name
- Added DeleteAccountSection with AlertDialog type-to-confirm pattern

**Prisma Schema:**
- Added `deletedAt DateTime?` field to User model
- Migration pushed to database

**Seeker Validation Schema:**
- Created `SeekerSettingsSchema` with all profile fields
- Uses `.or(z.literal(""))` for optional string fields
- `salaryMin/salaryMax` as `number.int().min(0).nullable().optional()`

**Seeker Settings API (`/api/seeker/settings`):**
- GET: Returns User + SeekerProfile fields (name, email, headline, bio, location, situation, primaryRole, salaryMin, salaryMax, currency, availability, resumeKey, skills)
- PATCH: Validates with SeekerSettingsSchema, updates User.name and SeekerProfile fields in parallel via Promise.all
- Auth + role check (SEEKER only) + rate limiting (20/min)

**Delete Account API (`/api/auth/delete-account`):**
- POST: Soft-deletes user (deletedAt set, PII anonymized: name→"Deleted User", email→"deleted-{id}@hiretivo.invalid", passwordHash→null, image→null)
- Shared endpoint for both SEEKER and RECRUITER
- Rate limited (3/min per userId)
- Stripe cancellation placeholder for Phase 11

### Key Decisions
- Used `z.input<typeof SeekerSettingsSchema>` for form type compatibility with react-hook-form
- Password security uses `zodResolver` pattern matching recruiter settings

### Deviations
- None
