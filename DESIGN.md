# Design System — Hiretivo

## 1. Visual Theme & Atmosphere

Hiretivo is a skills-based remote job portal with a clean, confident monochrome aesthetic. The design operates on a pure white canvas with near-black text (`#0a0a0a`) and black primary buttons — a minimalist, professional look inspired by modern SaaS design. Inter serves as the body font with tight letter-spacing on headings, creating a crisp, authoritative voice.

**Key Characteristics:**

- Inter at weight 700–800 for headings — bold, tight letter-spacing
- Black (`#000000`) primary buttons with white text — clean, confident
- Inter body at weight 400–500 — readable, neutral
- Near-black (`#0a0a0a`) primary text, gray (`#6b7280`) body text
- Subtle grid background pattern on hero sections
- No shadows — depth from borders only
- No accent colors — fully monochrome
- Light mode only — no dark mode

## 2. Color Palette & Roles

### Primary (Monochrome)

- **Near Black** (`#0a0a0a`): Primary text, headings
- **Black** (`#000000`): Primary CTA buttons, strong emphasis
- **White** (`#ffffff`): Background, button text on black
- **Light Gray** (`#f9fafb`): Subtle background sections, surfaces
- **Border Gray** (`#e5e7eb`): All borders, dividers, secondary buttons

### Text Colors

- **Foreground** (`#0a0a0a`): Headings, primary text, labels
- **Foreground Muted** (`#6b7280`): Body text, descriptions, subtitles
- **Foreground Secondary** (`#9ca3af`): Tertiary text, placeholders, captions

### Semantic

- **Success** (`#16a34a`): Success states, positive indicators
- **Danger** (`#ef4444`): Error, destructive actions
- **Warning** (`#f59e0b`): Warnings

### Surfaces

- **Background** (`#ffffff`): Page background, card backgrounds
- **Surface** (`#f9fafb`): Light background sections, hover states
- **Surface Hover** (`#f3f4f6`): Hover state for surfaces
- **Grid Line** (`rgba(0,0,0,0.04)`): Hero grid pattern lines

### Removed Colors

- All indigo/purple accent colors removed
- All dark mode colors removed
- No brand accent scale — fully monochrome

## 3. Typography Rules

### Font Families

- **Headings**: `DM Sans`, weight 600–700
- **Body / UI**: `DM Sans`, weight 400–500, fallbacks: `Helvetica, Arial`

### Hierarchy

| Role            | Font     | Size              | Weight | Line Height | Letter Spacing | Usage |
| --------------- | -------- | ----------------- | ------ | ----------- | -------------- | ----- |
| Display         | DM Sans  | 3.5rem (56px)     | 700    | 1.1         | -0.02em        | Hero headings |
| H1              | DM Sans  | 2.5rem (40px)     | 700    | 1.2         | -0.015em       | Page headings |
| H2              | DM Sans  | 2rem (32px)       | 700    | 1.25        | -0.01em        | Section headings |
| H3              | DM Sans  | 1.5rem (24px)     | 600    | 1.3         | -0.005em       | Card titles |
| H4              | DM Sans  | 1.25rem (20px)    | 600    | 1.4         | 0              | Subsection titles |
| Body-lg         | DM Sans  | 1.125rem (18px)   | 400    | 1.6         | 0              | Lead paragraphs |
| Body            | DM Sans  | 1rem (16px)       | 400    | 1.6         | 0              | Default body text |
| Body-sm         | DM Sans  | 0.875rem (14px)   | 400    | 1.5         | 0              | Small text, captions |
| Label           | DM Sans  | 0.75rem (12px)    | 500    | 1.4         | 0.05em         | Badges, labels |

### Principles

- **Weight 600–700 for headings**: DM Sans SemiBold/Bold for display headings — authoritative.
- **Tight letter-spacing**: Negative letter-spacing on headings creates dense, impactful text.
- **Weight 400–500 for body**: DM Sans Regular/Medium for readable, neutral body text.

## 4. Component Stylings

### Buttons

**Primary Black**

- Background: `#000000` (Black)
- Text: `#ffffff` (White), weight 500, size 0.875rem
- Padding: 0.625rem 1.25rem (10px 20px)
- Radius: 0.5rem (8px)
- Border: None
- Hover: Background `#1a1a1a`
- Active: Background `#333333`
- Focus: Ring with black color
- No shadow, no gradient

**Secondary Outlined**

- Background: `#ffffff` (White)
- Text: `#374151` (Gray-700), weight 500, size 0.875rem
- Padding: 0.625rem 1.25rem (10px 20px)
- Radius: 0.5rem (8px)
- Border: 1px solid `#e5e7eb`
- Hover: Background `#f9fafb`
- Active: Background `#f3f4f6`
- No shadow

**Button Sizes**

| Size | Padding | Font Size | Use Case |
|------|---------|-----------|----------|
| sm | 0.375rem 0.75rem | 0.75rem | Small actions |
| md (default) | 0.625rem 1.25rem | 0.875rem | Standard buttons |
| lg | 0.75rem 1.5rem | 1rem | Prominent CTAs |

### Input Fields

- Border-radius: 0.5rem (`rounded-lg`)
- Default border: `1px solid #e5e7eb`
- Focus: `ring-2 ring-black/20 border-black`
- Height: 2.5rem (h-10)
- Background: White
- No shadow

### Cards & Containers

- Radius: 0.75rem (12px, `rounded-xl`)
- Border: `1px solid #e5e7eb`
- Background: White
- Padding: 1.5rem (24px)
- No shadow — depth from border only
- Hover: Border color `#d1d5db`

### Feature Pills/Badges

- Background: `#f9fafb`
- Border: `1px solid #e5e7eb`
- Radius: 9999px (full)
- Padding: 0.375rem 0.875rem
- Font: 0.875rem, weight 500
- Icon: Small icon left of text

### Modals/Dialogs

- Border-radius: 0.75rem (`rounded-xl`)
- Border: `1px solid #e5e7eb`
- Overlay: `bg-black/50`
- No shadow

### Navigation

- Background: White, sticky
- Border-bottom: `1px solid #e5e7eb`
- Links: Weight 500, muted foreground, hover foreground (black)
- Active: Foreground (black)
- CTA in nav: Primary button style (black fill)

### Grid Background Pattern

- Subtle grid lines behind hero sections
- Line color: `rgba(0,0,0,0.04)`
- Grid cell size: 64px × 64px
- Implemented via CSS `background-image` with linear-gradient

## 5. Layout Principles

### Spacing System

- Base unit: 4px (Tailwind default)
- Use standard Tailwind spacing scale

### Border Radius Scale

- Buttons/Inputs: 0.5rem (8px, `rounded-lg`)
- Cards: 0.75rem (12px, `rounded-xl`)
- Pills/Badges: 9999px (full, `rounded-full`)
- Avatars/Icons: 50% (circle)

## 6. Depth & Elevation

| Level           | Treatment                | Use |
| --------------- | ------------------------ | --- |
| Flat (Level 0)  | No shadow                | Default |
| Border (Level 1)| `1px solid #e5e7eb`      | Cards, inputs, sections |

**Shadow Philosophy**: No shadows. Depth comes from borders and whitespace only.

## 7. Do's and Don'ts

### Do

- Use DM Sans weight 600–700 for headings
- Apply tight letter-spacing on headings (`-0.02em` to `-0.01em`)
- Use Black (`#000000`) for primary CTAs with white text
- Use subtle borders (`#e5e7eb`) for depth
- Apply grid background pattern on hero sections
- Use DM Sans weight 400–500 for body text
- Use black for input focus rings
- Keep all UI monochrome — no accent colors

### Don't

- Don't use indigo/purple colors anywhere
- Don't use shadows — borders only
- Don't use dark mode
- Don't use accent colors for brand elements
- Don't use `rounded-full` on inputs/cards — use `rounded-lg` or `rounded-xl`
- Don't use heavy font weights (800+) — 700 is max for Geist Sans
- Don't use ultra-tight line-height (0.85) — use 1.1+

## 8. Responsive Behavior

### Breakpoints

| Name    | Width      | Key Changes   |
| ------- | ---------- | ------------- |
| Mobile  | <576px     | Single column |
| Tablet  | 576–992px  | 2-column      |
| Desktop | 992–1440px | Full layout   |
| Large   | >1440px    | Expanded      |

## 9. Tailwind Implementation Reference

> Copy-paste ready. Use these exact class strings — do not invent alternatives.

### Colors (Tailwind arbitrary values)

```
Near Black text:           text-[#0a0a0a]
Black bg:                  bg-[#000000]
White bg:                  bg-white
Muted text:                text-[#6b7280]
Secondary text:            text-[#9ca3af]
Border:                    border-[#e5e7eb]
Surface bg:                bg-[#f9fafb]
Surface hover:             bg-[#f3f4f6]
Grid line:                 rgba(0,0,0,0.04)
```

### OR use brand tokens (preferred)

```
Foreground:                text-brand-foreground
Foreground muted:          text-brand-foreground-muted
Primary bg:                bg-brand-primary
Primary foreground:        text-brand-primary-foreground
Border:                    border-brand-border
Surface:                   bg-brand-surface
Success:                   text-brand-success
Danger:                    text-brand-danger
```

### Typography classes

```
Display:
font-bold text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight

H1:
font-bold text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight

H2:
font-bold text-2xl md:text-3xl leading-snug tracking-tight

H3:
font-semibold text-xl leading-snug tracking-tight

Body:
font-normal text-base leading-relaxed

Body muted:
font-normal text-base text-muted-foreground leading-relaxed

Label:
font-medium text-xs uppercase tracking-wider
```

### Component patterns

```tsx
// Primary CTA button
<button className="bg-black text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors">

// Secondary button
<button className="bg-white text-gray-700 font-medium text-sm px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">

// Standard card
<div className="rounded-xl border border-gray-200 bg-white p-6">

// Feature pill
<span className="bg-gray-50 border border-gray-200 rounded-full px-3.5 py-1.5 text-sm font-medium">

// Input field
<input className="rounded-lg border border-gray-200 focus:ring-2 focus:ring-black/20 focus:border-black">

// Badge / tag
<span className="bg-gray-100 text-gray-700 font-medium text-sm px-3 py-1 rounded-full">

// Modal / Dialog
<DialogContent className="rounded-xl border border-gray-200">

// Nav hover item
<div className="hover:bg-gray-50 rounded-lg transition-colors">

// Grid background (CSS)
background-image: linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
background-size: 64px 64px;
```

### Rules for AI agents

1. NEVER use indigo/purple colors — fully monochrome
2. NEVER use shadows — borders only
3. NEVER use dark mode
4. NEVER use `rounded-full` on inputs/cards — use `rounded-lg` or `rounded-xl`
5. NEVER use font-extrabold (800) — max font-bold (700) for DM Sans
6. ALWAYS use black (`#000000`) for primary buttons
7. ALWAYS use outlined style for secondary buttons
8. ALWAYS use subtle borders (`#e5e7eb`) for cards and inputs
9. ALWAYS apply grid background on hero sections
10. ALWAYS use DM Sans font — no other fonts

---

## 10. Agent Prompt Guide

### Quick Color Reference

- Text: Near Black (`#0a0a0a`)
- Background: White (`#ffffff`)
- Primary button: Black (`#000000`) with white text
- Secondary button: White with gray border
- Body text: Gray (`#6b7280`)
- Borders: Light gray (`#e5e7eb`)
- Surface: Light gray (`#f9fafb`)

### Example Component Prompts

- "Create hero: white background with subtle grid pattern. Headline at 56px Inter weight 800, tight letter-spacing, #0a0a0a text. Black pill CTA (#000000, rounded-lg, white text). Secondary outlined button with gray border."
- "Build a card: rounded-xl, 1px solid #e5e7eb, white background. Title at 24px Inter weight 600, body at 16px weight 400, gray text."

### Iteration Guide

1. DM Sans 600–700 for headings with tight letter-spacing
2. Black (#000000) for primary buttons — white text
3. Outlined secondary buttons with gray borders
4. No shadows — borders only for depth
5. Grid background pattern on hero sections
6. Fully monochrome — no accent colors anywhere
7. Light mode only — no dark mode
