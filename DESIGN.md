# Design System — Hiretivo

## 1. Visual Theme & Atmosphere

Hiretivo is a skills-based remote job portal with a confident, modern indigo/purple accent. The design operates on a clean white canvas with near-black text (`#0e0f0c`) and a signature Primary Indigo (`#5952e5`) — a rich, professional purple that communicates trust and innovation. Inter serves as the body font with weight 600 as the default for emphasis, creating a consistently confident voice.

**Key Characteristics:**
- Inter at weight 900, 0.85 line-height — bold headlines
- Primary Indigo (`#5952e5`) accent with white text — professional, modern
- Inter body at weight 600 as default — confident, not light
- Near-black (`#0e0f0c`) primary text
- Scale(1.05) hover animations — buttons physically grow
- OpenType `"calt"` on all text
- Pill buttons (rounded-full) for CTAs, max 16px radius for cards/inputs
- Semantic color system with comprehensive state management

## 2. Color Palette & Roles

### Primary Brand
- **Near Black** (`#0e0f0c`): Primary text, background for dark sections
- **Primary Indigo** (`#5952e5`): Primary CTA button, brand accent
- **White** (`#ffffff`): Button text on primary bg
- **Light Primary** (`rgba(89, 82, 229, 0.1)`): Soft primary surface, badge backgrounds
- **Pastel Primary** (`rgba(89, 82, 229, 0.15)`): Hover accent

### Accent Variants (Primary Indigo family)
- **Accent 50** (`#F3F3FD`): Lightest background tint
- **Accent 100** (`#E7E6FB`): Light background
- **Accent 200** (`#D0CDF8`): Light border/fill
- **Accent 300** (`#B8B4F4`): Muted text/icon
- **Accent 400** (`#A09CF0`): Medium accent
- **Accent 500** (`#8883EC`): Medium accent
- **Accent 600** (`#716AE9`): Hover state
- **Accent 700** (`#5952e5`): **Primary — use for buttons, links, focus**
- **Accent 800** (`#3B3699`): Dark accent
- **Accent 900** (`#1E1B4C`): Darkest accent

### Semantic
- **Success Green** (`#059669`): Success states, positive indicators
- **Danger Red** (`#d03238`): Error, destructive actions
- **Warning Yellow** (`#ffd11a`): Warnings
- **Info Cyan** (`rgba(56,200,255,0.10)`): Info tint background
- **Bright Orange** (`#ffc091`): Warm accent

### Neutral
- **Warm Dark** (`#454745`): Secondary text, borders
- **Gray** (`#868685`): Muted text, tertiary
- **Light Surface** (`#f5f5f7`): Subtle light surface background

## 3. Typography Rules

### Font Families
- **Display**: `Inter`, weight 900 — OpenType `"calt"` on all text
- **Body / UI**: `Inter`, fallbacks: `Helvetica, Arial`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Mega | Inter | 126px (7.88rem) | 900 | 0.85 (ultra-tight) | normal | `"calt"` |
| Display Hero | Inter | 96px (6.00rem) | 900 | 0.85 | normal | `"calt"` |
| Section Heading | Inter | 64px (4.00rem) | 900 | 0.85 | normal | `"calt"` |
| Sub-heading | Inter | 40px (2.50rem) | 900 | 0.85 | normal | `"calt"` |
| Alt Heading | Inter | 78px (4.88rem) | 600 | 1.10 (tight) | -2.34px | `"calt"` |
| Card Title | Inter | 26px (1.62rem) | 600 | 1.23 (tight) | -0.39px | `"calt"` |
| Feature Title | Inter | 22px (1.38rem) | 600 | 1.25 (tight) | -0.396px | `"calt"` |
| Body | Inter | 18px (1.13rem) | 400 | 1.44 | 0.18px | `"calt"` |
| Body Semibold | Inter | 18px (1.13rem) | 600 | 1.44 | -0.108px | `"calt"` |
| Button | Inter | 18px–22px | 600 | 1.00–1.44 | -0.108px | `"calt"` |
| Caption | Inter | 14px (0.88rem) | 400–600 | 1.50–1.86 | -0.084px to -0.108px | `"calt"` |
| Small | Inter | 12px (0.75rem) | 400–600 | 1.00–2.17 | -0.084px to -0.108px | `"calt"` |

### Principles
- **Weight 900 for display**: Inter Black (900) for display headings — bold and commanding.
- **0.85 line-height for display**: Ultra-tight display line-height creates dense, impactful text blocks.
- **"calt" everywhere**: Contextual alternates enabled on ALL text.
- **Weight 600 as body default**: Inter Semibold is the standard reading weight — confident, not light.

## 4. Component Stylings

### Buttons

**Primary Indigo Pill**
- Background: `#5952e5` (Primary Indigo)
- Text: `#ffffff` (White)
- Padding: 5px 16px
- Radius: 9999px (pill)
- Hover: scale(1.05) — button physically grows
- Active: scale(0.95) — button compresses
- Focus: ring with primary color
- Loading: overlays spinner, disables interaction

**Secondary Subtle Pill**
- Background: `rgba(89, 82, 229, 0.08)` (primary at 8% opacity)
- Text: `#0e0f0c`
- Padding: 8px 12px 8px 16px
- Radius: 9999px
- Same scale hover/active behavior

### Input Fields
- Border-radius: max 16px (`rounded-2xl`)
- Default border: `border-input`
- Focus: `focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary`
- Height: 40px (h-10)

### Cards & Containers
- Radius: 12px (small), 16px (medium), 24px (large cards)
- Border: `1px solid rgba(14,15,12,0.12)` or `1px solid rgba(89,82,229,0.15)` (primary accent)
- Shadow: `rgba(89,82,229,0.12) 0px 0px 0px 1px` (ring shadow)

### Modals/Dialogs
- Border-radius: max 16px (`rounded-2xl`)
- Overlay: `bg-black/80`

### Navigation
- Primary-tinted navigation hover: `rgba(89,82,229,0.08)`
- Clean header with logo
- Pill CTAs right-aligned

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 1px, 2px, 3px, 4px, 5px, 8px, 10px, 11px, 12px, 16px, 18px, 19px, 20px, 22px, 24px

### Border Radius Scale
- Minimal (2px): Links
- Standard (10px): Comboboxes
- Input (16px): Input fields, small cards, modals
- Card (16px): Cards, buttons, radio
- Medium (20px): Medium cards
- Large (24px): Feature cards
- Pill (9999px): CTA buttons, badges, images
- Circle (50%): Icons, avatars

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Default |
| Ring (Level 1) | `rgba(89,82,229,0.12) 0px 0px 0px 1px` | Card borders |
| Inset (Level 2) | `rgba(89,82,229,0.2) 0px 0px 0px 1px inset` | Input focus |

**Shadow Philosophy**: Minimal shadows — ring shadows only. Depth comes from the bold primary accent against the neutral canvas.

## 7. Do's and Don'ts

### Do
- Use Inter weight 900 for display — boldness IS the brand
- Apply line-height 0.85 on display — ultra-tight is intentional
- Use Primary Indigo (#5952e5) for primary CTAs with white (#ffffff) text
- Apply scale(1.05) hover and scale(0.95) active on buttons
- Enable "calt" on all text
- Use Inter weight 600 as the body default
- Use primary color for input focus rings

### Don't
- Don't use light font weights for headings — only 900 for display
- Don't relax the 0.85 line-height on display — the density is the identity
- Don't use #9fe870 (lime green), #e2f6d5, or #163300 — these are the OLD brand colors
- Don't use green/emerald/lime for brand elements — use primary indigo (#5952e5)
- Don't use `rounded-[30px]` or `rounded-[40px]` on inputs/modals — max 16px
- Don't skip the scale animation on buttons
- Don't use traditional shadows — ring shadows only

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <576px | Single column |
| Tablet | 576–992px | 2-column |
| Desktop | 992–1440px | Full layout |
| Large | >1440px | Expanded |

## 9. Tailwind Implementation Reference

> Copy-paste ready. Use these exact class strings — do not invent alternatives.

### Colors (Tailwind arbitrary values)
```
Near Black text:           text-[#0e0f0c]
Primary Indigo bg:         bg-[#5952e5]
Primary Indigo text:       text-[#5952e5]
White on primary:          text-white
Light Primary bg:          bg-[rgba(89,82,229,0.1)]
Card border:               border-[rgba(14,15,12,0.12)]
Primary ring shadow:       shadow-[rgba(89,82,229,0.12)_0px_0px_0px_1px]
```

### OR use brand tokens (preferred)
```
Primary bg:                bg-brand-primary
Primary text:              text-brand-primary
Primary foreground:        text-brand-primary-foreground
Light primary bg:          bg-brand-primary-light
Accent subtle:             bg-brand-accent-subtle
Accent pastel:             bg-brand-accent-pastel
Surface bg:               bg-brand-surface
Heading text:             text-brand-heading
Body text:                text-brand-body
Muted text:               text-brand-muted
Muted secondary:           text-brand-muted-secondary
Success:                  bg-brand-success text-brand-success
Danger:                   bg-brand-danger text-brand-danger
```

### Typography classes
```
Display hero:     font-black text-[96px] leading-[0.85] [font-feature-settings:'calt']
Section heading:  font-black text-[64px] leading-[0.85] [font-feature-settings:'calt']
Sub-heading:      font-black text-[40px] leading-[0.85] [font-feature-settings:'calt']
Card title:       font-semibold text-[26px] leading-[1.23] tracking-[-0.39px] [font-feature-settings:'calt']
Feature title:    font-semibold text-[22px] leading-[1.25] tracking-[-0.396px] [font-feature-settings:'calt']
Body:             font-normal text-[18px] leading-[1.44] tracking-[0.18px] [font-feature-settings:'calt']
Body semibold:    font-semibold text-[18px] leading-[1.44] tracking-[-0.108px] [font-feature-settings:'calt']
Caption:          font-normal text-[14px] leading-[1.5] tracking-[-0.084px] [font-feature-settings:'calt']
```

### Component patterns
```tsx
// Primary CTA button
<button className="bg-[#5952e5] text-white font-semibold text-[18px] px-4 py-[5px] rounded-full transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#5952e5]/30">

// Secondary button
<button className="bg-[rgba(89,82,229,0.08)] text-[#0e0f0c] font-semibold px-4 py-2 rounded-full transition-transform hover:scale-105 active:scale-95">

// Standard card (max 16px radius)
<div className="rounded-2xl border border-[rgba(14,15,12,0.12)] p-6">

// Large card / table wrapper (max 24px)
<div className="rounded-3xl border border-[rgba(14,15,12,0.12)] p-8">

// Input field (max 16px radius)
<input className="rounded-2xl border border-input focus-visible:border-[#5952e5] focus-visible:ring-2 focus-visible:ring-[#5952e5]/30">

// Badge / tag
<span className="bg-brand-primary-light text-brand-primary font-semibold text-sm px-3 py-1 rounded-full">

// Modal / Dialog (max 16px radius)
<DialogContent className="rounded-2xl">

// Nav hover item
<div className="hover:bg-[rgba(89,82,229,0.08)] rounded-full transition-colors">
```

### Rules for AI agents
1. NEVER use green/lime colors (`#9fe870`, `#e2f6d5`, `#163300`, `emerald-*`, `green-*`) for brand elements — use primary indigo `#5952e5`
2. NEVER use `shadow-sm`, `shadow-md`, `shadow-lg` — only `shadow-[rgba(89,82,229,0.12)_0px_0px_0px_1px]` or `card-shadow` utility
3. NEVER use `rounded-[30px]` or `rounded-[40px]` on inputs/modals — use `rounded-2xl` (16px) max
4. NEVER use `rounded-3xl` on inputs/modals — use `rounded-2xl` max
5. NEVER use `font-bold` for display — use `font-black` (weight 900)
6. NEVER use `leading-tight` for display — use `leading-[0.85]`
7. ALWAYS add `transition-transform hover:scale-105 active:scale-95` to every button
8. ALWAYS enable `[font-feature-settings:'calt']` on all text
9. ALWAYS use loading state on buttons that call APIs
10. ALWAYS use primary color (#5952e5) for input focus rings

---

## 10. Agent Prompt Guide

### Quick Color Reference
- Text: Near Black (`#0e0f0c`)
- Background: White (`#ffffff` / off-white)
- Accent: Primary Indigo (`#5952e5`)
- Button text: White (`#ffffff`)
- Secondary: Gray (`#868685`)
- Light bg: `rgba(89,82,229,0.1)`

### Example Component Prompts
- "Create hero: white background. Headline at 96px Inter weight 900, line-height 0.85, 'calt' enabled, #0e0f0c text. Indigo pill CTA (#5952e5, rounded-full, 5px 16px padding, white text). Hover: scale(1.05)."
- "Build a card: rounded-2xl, 1px solid rgba(14,15,12,0.12). Title at 22px Inter weight 600, body at 18px weight 400."

### Iteration Guide
1. Inter 900 at 0.85 line-height — the extreme weight IS the brand
2. Primary Indigo (#5952e5) for buttons and accents — white text on primary background
3. Scale animations (1.05 hover, 0.95 active) on all interactive elements
4. "calt" on everything — contextual alternates are mandatory
5. Inter 600 for body — confident reading weight
6. Inputs: rounded-2xl max, primary color focus ring
7. Modals: rounded-2xl max, no mega-radius