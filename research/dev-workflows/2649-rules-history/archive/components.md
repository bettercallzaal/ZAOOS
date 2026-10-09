---
description: Rules for React components
globs: src/components/**/*.tsx
---

# Component Conventions

- Add `"use client"` directive at top of any component that uses hooks, event handlers, or browser APIs.
- Design mobile-first — use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) to enhance for larger screens.
- Follow the dark theme: navy `#0a1628` background, gold `#f5a623` primary accent.
- Use `next/dynamic` with `{ ssr: false }` for heavy components (SearchDialog, SongSubmit, ProfileDrawer).
- Use Tailwind CSS v4 classes. No inline styles or CSS modules.
- Use `@/` import alias for all project imports.
