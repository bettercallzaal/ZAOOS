---
name: new-component
description: Use when creating a new React component — scaffolds with ZAO OS conventions (use client, dark theme, mobile-first, Tailwind v4)
disable-model-invocation: true
argument-hint: "[feature/ComponentName] e.g. music/TrackCard"
---

# New Component — Scaffold a ZAO OS Component

Creates a new component following all conventions from `.claude/rules/components.md`.

## Usage

```
/new-component music/TrackCard
```

Creates `src/components/music/TrackCard.tsx`.

## Scaffold Template

```tsx
"use client";

import { useState } from 'react';

interface TrackCardProps {
  // Define props here
}

export default function TrackCard({ }: TrackCardProps) {
  return (
    <div className="bg-[#0a1628] rounded-lg p-4">
      {/* Mobile-first layout — use sm: md: lg: for larger screens */}
    </div>
  );
}
```

## Rules

- Add `"use client"` for any component using hooks, event handlers, or browser APIs
- Design mobile-first — use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- Follow dark theme: navy `#0a1628` background, gold `#f5a623` primary accent
- Use `next/dynamic` with `{ ssr: false }` for heavy components
- Use Tailwind CSS v4 classes — no inline styles or CSS modules
- Use `@/` import alias for all project imports
- PascalCase file names matching the component name
- Ask the user what the component should do before writing
