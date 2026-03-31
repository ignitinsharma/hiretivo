# Testing

## Current State

**No application tests exist in this codebase.** The only test files found are inside `node_modules` (Zod library's own test suite). There is no `__tests__/` directory, no `*.test.ts` or `*.spec.ts` files in `src/`, and no test configuration files.

---

## Test Infrastructure

| Tool | Status |
|------|--------|
| Jest | Not configured |
| Vitest | Not configured |
| Playwright | Not configured |
| Cypress | Not configured |
| Testing Library | Not installed |

No `jest.config.*`, `vitest.config.*`, or `playwright.config.*` files detected.

---

## What Needs Testing (Gaps)

Given the codebase structure, the following areas have zero test coverage:

### High Priority

- **Authentication flows** — signup, login, email verification, password reset
- **Onboarding step validation** — `validateSeekerStep1`/step2/etc. in `src/lib/validations/`
- **API routes** — `/api/auth/signup`, `/api/onboarding/step1–5`, `/api/recruiter/onboarding`
- **Zustand stores** — state transitions in `use-seeker-onboarding-store.ts`, `use-recruiter-onboarding-store.ts`

### Medium Priority

- **Shared components** — `AuthLayout`, `PasswordInput`, `OAuthButton`, `ApplyJobModal`
- **Form components** — `skills-tag-input`
- **Route access control** — recruiter/seeker layout auth guards

---

## Recommended Stack (When Adding Tests)

Given the Next.js 15 + TypeScript stack:

```
Unit/Integration: Vitest + @testing-library/react
E2E: Playwright
```

### Suggested setup commands

```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
pnpm add -D playwright @playwright/test
```

### Suggested config location

```
vitest.config.ts         # Unit test config
playwright.config.ts     # E2E config
src/__tests__/           # Unit tests
e2e/                     # Playwright E2E tests
```

---

## Validation Schemas Are Testable Immediately

The validation functions in `src/lib/validations/` are pure functions — easiest entry point for adding tests:

```ts
// Example: src/__tests__/lib/validations/seeker-onboarding.test.ts
import { validateSeekerStep1 } from '@/lib/validations/seeker-onboarding.schema';

test('rejects missing situation', () => {
  const result = validateSeekerStep1({ situation: undefined, experienceLevel: 'junior' });
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('Please select your current situation');
});
```

---

## Mocking Patterns (Observed in Code)

Currently, feature modules use static mock data files in `data/` subdirectories:
- `src/modules/recruiter/dashboard/data/mock-dashboard-data.ts`
- `src/modules/seeker/dashboard/data/mock-dashboard-data.ts`
- `src/modules/seeker/applications/data/mock-applications.ts`

These mock files are embedded in the module and used directly in components — not dependency-injected. When real API/DB integration is added, these will need to be replaced with proper service layer calls.

---

*Generated: 2026-04-01*
