# Coding Conventions

## Language & Tooling

- **TypeScript** throughout — strict mode implied via `tsconfig.json`
- **ESLint** + Next.js defaults for linting
- **Prettier** (likely, inferred from consistent formatting)
- Path alias: `@/` → `src/`

---

## File & Directory Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| React component files | PascalCase | `StepWelcome.tsx`, `AuthLayout.tsx` |
| Hook/store files | kebab-case | `use-seeker-onboarding-store.ts` |
| Utility/lib files | kebab-case | `rate-limit.ts`, `prisma.ts` |
| Validation schemas | `[name].schema.ts` | `seeker-onboarding.schema.ts` |
| Type definition files | `[name].types.ts` | `application.types.ts` |
| Mock data files | `mock-[name].ts` | `mock-dashboard-data.ts` |
| Route pages | `page.tsx` (Next.js convention) | |
| Route layouts | `layout.tsx` | |
| API handlers | `route.ts` | |

---

## Component Patterns

### Client Components

Use `"use client"` directive at the top for interactive components:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepWelcomeProps {
  onNext: () => void;
  onSkip?: () => void;
}

export function StepWelcome({ onNext, onSkip }: StepWelcomeProps) {
  const [errors, setErrors] = useState<string[]>([]);
  // ...
}
```

### Named exports preferred over default exports for components:

```tsx
// Preferred
export function StepWelcome(...) {}

// Avoid
export default function StepWelcome(...) {}
```

### Props interfaces declared inline above component:

```tsx
interface ComponentNameProps {
  onNext: () => void;
  onSkip?: () => void;
}
```

---

## Import Order

Consistent order observed:
1. React/Next.js imports
2. Third-party library imports (lucide-react, etc.)
3. Internal component imports (`@/components/...`)
4. Internal utility/lib imports (`@/lib/...`)
5. Type imports (`import type {...}`)
6. Store imports (`@/store/...`)

Blank line separates groups.

---

## State Management

### Zustand stores

Defined with `create` + `persist` middleware for onboarding flows:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SeekerOnboardingState {
  currentStep: SeekerOnboardingStep;
  // ... state fields
  setCurrentStep: (step: SeekerOnboardingStep) => void;
  // ... actions
}

export const useSeekerOnboardingStore = create<SeekerOnboardingState>()(
  persist(
    (set, get) => ({
      // implementation
    }),
    { name: 'seeker-onboarding' }
  )
);
```

- State and actions co-located in single store interface
- Store file name: `use-[name]-store.ts`
- Hook name: `use[Name]Store` (camelCase)

---

## Validation

Zod-based schemas in `src/lib/validations/`:

```ts
// seeker-onboarding.schema.ts
export const SITUATION_OPTIONS = [...] as const;
export type SeekerSituation = typeof SITUATION_OPTIONS[number];

export function validateSeekerStep1(data: {...}): { valid: boolean; errors: string[] } {
  // validation logic
}
```

- Validation functions return `{ valid: boolean; errors: string[] }` shape
- Constants (options arrays) exported as `const` with `as const`
- Types derived from constants with `typeof ARRAY[number]`

---

## Error Handling in Components

Client-side validation errors stored in `useState<string[]>([])`:

```tsx
const [errors, setErrors] = useState<string[]>([]);

const handleContinue = () => {
  const validation = validateSeekerStep1({ ... });
  if (!validation.valid) {
    setErrors(validation.errors);
    return;
  }
  setErrors([]);
  onNext();
};
```

Error messages derived via helper function, not inline ternaries.

---

## Styling

- **Tailwind CSS** utility classes throughout
- `cn()` helper from `@/lib/utils` for conditional class merging:
  ```tsx
  className={cn("base-classes", condition && "conditional-class")}
  ```
- **shadcn/ui** component library in `src/components/ui/`
- Design tokens via CSS variables (Tailwind config)
- Font: `Plus Jakarta Sans` via `next/font/google`

---

## Module Exports

Feature modules use barrel `index.ts` exports:

```ts
// src/modules/seeker-onboarding/index.ts
export * from './components/SeekerOnboardingContainer';
export * from './types/seeker-onboarding.types';
```

---

## Type Augmentation

NextAuth session types extended in `src/types/next-auth.d.ts` using module augmentation pattern.

---

## Mock Data Pattern

During early development, mock data files used for UI:

```ts
// src/modules/recruiter/dashboard/data/mock-dashboard-data.ts
export const mockDashboardData = { ... };
```

These are collocated within their feature module's `data/` subdirectory.

---

*Generated: 2026-04-01*
