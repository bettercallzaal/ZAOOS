---
description: Rules for React components
globs: src/components/**/*.tsx
---

# Component Conventions

mechanism: none yet (since 2026-10-23, #4150)

- Add `"use client"` directive at top of any component that uses hooks, event handlers, or browser APIs.
- Design mobile-first - use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) to enhance for larger screens.
- Follow the dark theme: navy `#0a1628` background, gold `#f5a623` primary accent.
- Use `next/dynamic` with `{ ssr: false }` for heavy components (SearchDialog, SongSubmit, ProfileDrawer).
- Use Tailwind CSS v4 classes. No inline styles or CSS modules.
- Use `@/` import alias for all project imports.
- Cut taglines, helper text and secondary labels that only restate what the layout already shows; if a screen needs them to make sense, fix the layout. Never cut accessible names (a form `<label>`, an `aria-label` on an icon-only control), error or empty-state messages, or brand copy set in `community.config.ts`. Source: Vox (@voxyz_ai), x.com/voxyz_ai/status/2113254050170843418, 2026-10-22; reasoning in `research/dev-workflows/2700-agents-md-vox-ux-dx-ax-lines/`.
