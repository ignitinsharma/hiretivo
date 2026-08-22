# Hiretivo — Agent Instructions

This project has two authoritative rule files. Read both before writing any code.

## Required reading

1. **`CLAUDE.md`** — All development rules: stack, TypeScript, components, modules, forms, state, API routes, naming, styling, git. Follow every rule exactly.
2. **`DESIGN.md`** — Visual design system: colors, typography, spacing, buttons, cards, animations. No UI code without reading this first.

## Always-on skills

Load the **ponytail** skill (`skill({ name: "ponytail" })`) at the start of every session. It enforces YAGNI, stdlib-first, minimal code on all coding tasks. Do not add unrequested abstractions, boilerplate, or speculative features.

## Feature / new code

Before building any feature or multi-step task:
1. Load the **brainstorming** skill (`skill({ name: "brainstorming" })`) to explore intent, requirements, and design before implementation.
2. For any multi-step task, load **writing-plans** (`skill({ name: "writing-plans" })`) to produce a plan before touching code.

## Breaking changes — mandatory disclosure

Before building any feature, check whether the change breaks existing features
(e.g. Feature A touches shared code that Feature B depends on). If a breaking
change is found or expected:

1. STOP and notify the user in advance — list exactly what will break and why.
2. Do NOT start implementing until the user acknowledges.
3. After any change, call out affected areas so the user can test them.

Applies to shared utilities, components, types, API routes, DB schema, and any
code reused by other features. No silent breakage.

## Debugging

For any bug investigation, test failure, or unexpected behavior:
1. Load the relevant skill *before* touching code — **systematic-debugging** (`skill({ name: "systematic-debugging" })`) for general bugs, or **investigate** (`skill({ name: "investigate" })`) for gstack root-cause analysis.
2. The **iron law**: no fixes without root cause — patching symptoms without identifying root cause is a second bug, not a fix.
3. Follow the skill's process exactly (investigate → analyze → hypothesize → implement). Do not skip to implementation.

## Non-negotiable

- Follow CLAUDE.md and DESIGN.md as if they are hard constraints, not suggestions.
- When in doubt between two approaches, pick the one consistent with these files.
- Never invent colors, patterns, or abstractions not defined in these files.
