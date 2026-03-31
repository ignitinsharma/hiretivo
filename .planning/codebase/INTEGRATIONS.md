# External Integrations

**Analysis Date:** 2026-04-01

## APIs & External Services

**Authentication:**
- Google OAuth 2.0 - Social login for seeker and recruiter registration
  - SDK/Client: next-auth Google provider
  - Auth: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (optional, auth still works via credentials)

**Email Delivery:**
- Resend - Transactional email service
  - SDK/Client: resend 6.9.4
  - Auth: RESEND_API_KEY
  - Usage: User registration confirmations, notifications, onboarding emails
  - Implementation: `src/lib/resend.ts` with SendEmailInput interface

## Data Storage

**Databases:**
- PostgreSQL (Neon recommended based on schema comments)
  - Connection: DATABASE_URL (required)
  - Client: Prisma 7.5.0 with @prisma/adapter-pg
  - Adapter: PrismaPg for connection pooling
  - Schema location: `prisma/schema.prisma`
  - Models: User, SeekerProfile, RecruiterProfile, Job, Application, Interview, Skill, JobMatch, ClickEvent, Account, Session, VerificationToken (Auth.js models)

**File Storage:**
- Cloudflare R2 (S3-compatible object storage)
  - Connection: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (required)
  - Client: @aws-sdk/client-s3 3.1010.0
  - Presigner: @aws-sdk/s3-request-presigner 3.1010.0
  - Implementation: `src/lib/r2.ts`
  - Storage structure:
    - `resumes/{seekerId}/resume.pdf` - Seeker resumes (private, signed URLs)
    - `avatars/{userId}/avatar.webp` - User profile photos
    - `company-logos/{recruiterId}/logo.webp` - Company logos (public)
  - Optional public base URL: R2_PUBLIC_URL (if set, serves public URLs instead of signed)

**Caching & Rate Limiting:**
- Upstash Redis (serverless)
  - Connection: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (required)
  - Client: @upstash/redis 1.37.0
  - Implementation: `src/lib/redis.ts` with singleton pattern
  - Rate limits configured in `src/lib/rate-limit.ts`:
    - Auth POST: 10 req/min per IP
    - Job apply: 5 req/min
    - File upload: 20 req/min

## Authentication & Identity

**Auth Provider:**
- NextAuth 5.0.0-beta.30 (custom setup)
  - Implementation: `src/auth.ts` using PrismaPg adapter
  - Session strategy: JWT
  - Providers:
    1. Google OAuth (conditional, only if GOOGLE_CLIENT_ID/SECRET set)
    2. Credentials (email/password with bcryptjs hashing)
  - Password hashing: bcryptjs 3.0.3 with compare function
  - Custom JWT callbacks: Stores user role (SEEKER/RECRUITER) and plan (FREE/PRO/ENTERPRISE) in token
  - Session callbacks: Loads role and plan from database if missing in token

**Database Models for Auth:**
- Account: OAuth provider accounts (Auth.js model)
- Session: Session tokens (Auth.js model)
- VerificationToken: Email verification tokens (Auth.js model)
- User: Core user model with:
  - role: SEEKER or RECRUITER
  - plan: FREE, PRO, or ENTERPRISE
  - passwordHash: bcryptjs hash (for credentials auth)
  - Relations to SeekerProfile, RecruiterProfile, and job interactions

**Auth Routes:**
- POST/GET `/api/auth/[...nextauth]` - NextAuth handler
  - Runtime: nodejs (not edge)
  - Source: `src/app/api/auth/[...nextauth]/route.ts`

## Monitoring & Observability

**Error Tracking:** None detected

**Logs:**
- Prisma logging configured in `src/lib/prisma.ts`:
  - Development: logs errors and warnings
  - Production: logs errors only
- Application: Uses console methods directly in some places

## CI/CD & Deployment

**Hosting:** Not specified (supports Next.js deployment targets)

**CI Pipeline:** None detected

**Build Process:**
- `npm run dev` - Local development with Next.js hot reload
- `npm run build` - Production build (next build)
- `npm start` - Production server (next start)
- `npm run lint` - ESLint via Next.js
- Database:
  - `npm run db:generate` - Generate Prisma client
  - `npm run db:migrate` - Run migrations in dev
  - `npm run db:push` - Sync schema without migrations (dev only)
  - `npm run db:studio` - Prisma Studio UI

## Environment Configuration

**Required env vars:**
```
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Google OAuth (optional, auth still works without)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=  # Optional, for public file serving

# Resend Email
RESEND_API_KEY=

# Next.js
NODE_ENV=production
```

**Secrets location:**
- `.env.local` - Local development (git-ignored)
- Production: environment-specific (Vercel, Docker, VM secrets manager)

**Development helpers:**
- `.env.local` file present (verified existence, contents not read)
- dotenv 17.3.1 for loading environment variables

## Webhooks & Callbacks

**Incoming:** None detected

**Outgoing:**
- None explicit, but likely planned for:
  - Email notifications via Resend
  - Third-party integrations for job postings or external applications

## Data Models

**Core entities:**
- User (base entity, holds auth and subscription info)
- SeekerProfile (extends User with resume, skills, experience)
- RecruiterProfile (extends User with company info)
- Job (posted by recruiters with required skills, salary range, type)
- Application (seeker applies to job)
- Interview (scheduled between seeker and recruiter via application)
- Skill (normalized skill list)
- JobMatch (computed match score between job and seeker)
- ClickEvent (analytics tracking for job clicks)

**Enums:**
- Role: SEEKER, RECRUITER
- JobType: FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP
- ApplyType: INTERNAL, EXTERNAL
- JobStatus: DRAFT, OPEN, PAUSED, CLOSED
- SkillLevel: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
- AppStatus: PENDING, REVIEWED, SHORTLISTED, REJECTED, WITHDRAWN
- WorkType: REMOTE, HYBRID, ONSITE
- PlanTier: FREE, PRO, ENTERPRISE
- InterviewStatus: SCHEDULED, COMPLETED, CANCELLED, NO_SHOW

---

*Integration audit: 2026-04-01*
