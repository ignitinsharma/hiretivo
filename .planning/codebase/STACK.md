# Technology Stack

**Analysis Date:** 2026-04-01

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code, APIs, and components
- JavaScript - Configuration files (Next.js, PostCSS, Tailwind)

**Secondary:**
- SQL - PostgreSQL queries (via Prisma)
- HTML5/CSS3 - Markup and styling (via React/Tailwind)

## Runtime

**Environment:**
- Node.js (version unspecified, use latest LTS recommended)

**Package Manager:**
- pnpm 10.32.1
- Lockfile: pnpm-lock.yaml (generated)

## Frameworks

**Core:**
- Next.js 14.2.35 - Full-stack React framework with App Router
- React 18.3.1 - UI library
- React DOM 18.3.1 - React rendering target

**Authentication:**
- NextAuth 5.0.0-beta.30 - Session management and authentication
- @auth/prisma-adapter 2.11.1 - Adapter for NextAuth + Prisma

**Styling & UI:**
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- @tailwindcss/postcss 4.2.1 - PostCSS plugin for Tailwind
- Radix UI (multiple components) - Headless UI component library
  - @radix-ui/react-checkbox 1.3.3
  - @radix-ui/react-dialog 1.1.15
  - @radix-ui/react-label 2.1.8
  - @radix-ui/react-progress 1.1.8
  - @radix-ui/react-select 2.2.6
  - @radix-ui/react-separator 1.1.8
  - @radix-ui/react-slot 1.2.4
  - @radix-ui/react-switch 1.2.6
  - @radix-ui/react-tabs 1.1.13
  - @radix-ui/react-tooltip 1.2.8
- Sonner 2.0.7 - Toast notification library
- Next-themes 0.4.6 - Theme management (light/dark mode)
- Lucide React 0.577.0 - Icon library

**Form Handling:**
- React Hook Form 7.71.2 - Form state management
- @hookform/resolvers 5.2.2 - Form validation resolvers
- Zod 4.3.6 - Schema validation and TypeScript inference

**State Management:**
- Zustand 5.0.12 - Lightweight state management
- @tanstack/react-query 5.90.21 - Server state and caching
- @tanstack/react-query-devtools 5.91.3 - React Query development tools

**Database:**
- Prisma 7.5.0 - ORM and database toolkit
- @prisma/client 7.5.0 - Prisma client
- @prisma/adapter-pg 7.5.0 - PostgreSQL adapter
- pg 8.20.0 - PostgreSQL driver

**Email:**
- Resend 6.9.4 - Email delivery service SDK

**Rate Limiting & Caching:**
- @upstash/ratelimit 2.0.8 - Serverless rate limiting
- @upstash/redis 1.37.0 - Serverless Redis client

**Cloud Storage:**
- @aws-sdk/client-s3 3.1010.0 - AWS S3 SDK
- @aws-sdk/s3-request-presigner 3.1010.0 - S3 signed URL generation

**Utilities:**
- bcryptjs 3.0.3 - Password hashing
- date-fns 4.1.0 - Date utilities
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 - Classname utility
- tailwind-merge 3.5.0 - Tailwind class merging
- tailwindcss-animate 1.0.7 - Tailwind animation utilities
- dotenv 17.3.1 - Environment variable loading

**Testing:**
- No testing framework configured (test script returns error)

**Build/Dev:**
- PostCSS 8.5.8 - CSS processor
- TypeScript 5.9.3 - Type checking
- ESLint 8.57.1 - Code linting
- eslint-config-next 14.2.35 - Next.js ESLint rules
- tsx 4.21.0 - TypeScript executor for scripts
- Prisma CLI 7.5.0 - Database schema management

## Key Dependencies

**Critical:**
- `@prisma/client` - Database access and schema
- `next-auth` - Authentication and session management
- `@tanstack/react-query` - Server state synchronization
- `zustand` - Client state (roles, plans, UI state)

**Infrastructure:**
- `@upstash/redis` - Cache and rate limiting
- `@aws-sdk/client-s3` - File uploads (resumes, avatars, logos)
- `resend` - Email notifications
- `pg` - Direct PostgreSQL access when needed

## Configuration

**Environment:**
- Configuration via `.env.local` (present, not committed)
- Required vars: DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, UPSTASH_*, R2_*, RESEND_API_KEY
- See `.env.local` for current values (do not read for security)

**Build:**
- `next.config.mjs` - Next.js configuration (minimal, React strict mode enabled)
- `tsconfig.json` - TypeScript compiler options with strict mode, path aliases
- `tailwind.config.ts` - Tailwind CSS configuration with custom theme colors
- `postcss.config.js` - PostCSS configuration for Tailwind
- `.eslintrc.json` - ESLint extends next/core-web-vitals
- `components.json` - Component library configuration (CLI metadata)

**Path Aliases:**
```typescript
@/* → ./src/*
@/components/* → ./src/components/*
@/modules/* → ./src/modules/*
@/lib/* → ./src/lib/*
@/store/* → ./src/store/*
@/constants/* → ./src/constants/*
@/hooks/* → ./src/hooks/*
@/types/* → ./src/types/*
@/utils/* → ./src/utils/*
@/services/* → ./src/services/*
```

## Platform Requirements

**Development:**
- Node.js LTS (version unspecified in .nvmrc, use latest stable)
- pnpm 10.32.1
- PostgreSQL connection string (DATABASE_URL)
- Google OAuth credentials
- Upstash Redis (serverless)
- Cloudflare R2 storage credentials
- Resend API key

**Production:**
- Node.js runtime (Next.js supports Node.js 18+)
- PostgreSQL database (Neon or compatible)
- Upstash Redis (serverless)
- Cloudflare R2 (S3-compatible object storage)
- Resend email service
- Deployment: Next.js supports Vercel, AWS Lambda, Docker, Node.js servers

---

*Stack analysis: 2026-04-01*
