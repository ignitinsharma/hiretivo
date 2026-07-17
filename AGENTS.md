# Hiretivo — Agent Instructions

This project has two authoritative rule files. Read both before writing any code.

## Required reading

1. **`CLAUDE.md`** — All development rules: stack, TypeScript, components, modules, forms, state, API routes, naming, styling, git. Follow every rule exactly.
2. **`DESIGN.md`** — Visual design system: colors, typography, spacing, buttons, cards, animations. No UI code without reading this first.

## Always-on skills

Load the **ponytail** skill (`skill({ name: "ponytail" })`) at the start of every session. It enforces YAGNI, stdlib-first, minimal code on all coding tasks. Do not add unrequested abstractions, boilerplate, or speculative features.

## Non-negotiable

- Follow CLAUDE.md and DESIGN.md as if they are hard constraints, not suggestions.
- When in doubt between two approaches, pick the one consistent with these files.
- Never invent colors, patterns, or abstractions not defined in these files.
