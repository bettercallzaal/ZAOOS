---
topic: technology, infrastructure
type: tech-spec
status: READY TO BUILD — Hurricane executes after ZAOstock Eventbrite (Jul 21) and ZABAL marketplace (doc 1531)
last-validated: 2026-07-18
related-docs: 1126-lego-composability-architecture
board-tasks: 01ee91c7 (extract @zao/cowork npm package)
action-owner: Hurricane (build); Zaal (approve npm org + publish)
---

# 1551 — @zao/cowork: Shared Cowork Board UI Components

> **Why:** The ZAOcowork task board renders in zaalcaster (agent admin panel) and will render in more surfaces (zaoos-workspace dashboard, ZAO mobile, future partner surfaces). Every surface is currently copy-pasting status logic. `@zao/cowork` extracts TaskCard, StatusBadge, PriorityBadge, and keyboard hooks into a single published package so any ZAO app imports one package instead of duplicating.

> **Lego architecture context:** This is a Stage 1 STUD extraction per doc 1126. `@zao/cowork` follows the same pattern as `@zao/ui` (design tokens). It publishes to npm under the `@zao` org and is a peer-dep of `@zao/ui` (for tokens) and nothing else.

---

## Package Identity

```
Name:     @zao/cowork
Version:  0.1.0
License:  MIT
npm org:  @zao (create if not yet done; requires Zaal npm.js.org access)
Peer deps:
  react: ^18 || ^19
  @zao/ui: ^0.1     # for color tokens (if published) — otherwise inline tokens
```

No private registry. Public npm.org, scoped org. Consumers: `npm install @zao/cowork`.

---

## Exports

```typescript
// @zao/cowork
export { TaskCard } from './components/TaskCard';
export { StatusBadge } from './components/StatusBadge';
export { PriorityBadge } from './components/PriorityBadge';
export { useCoworkKeyboardShortcuts } from './hooks/useCoworkKeyboardShortcuts';
export type { CoworkTask, TaskStatus, TaskPriority } from './types';
```

---

## Shared Types (from ZAOcowork Supabase schema)

```typescript
// src/types.ts

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type TaskCategory = 'engineering' | 'community' | 'events' | 'design' | 'operations';

export interface CoworkTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  notes?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}
```

---

## Component Specs

### StatusBadge

Renders a pill badge for task status. Matches zaalcaster's dark-card styling (see `HatBadge.tsx` pattern).

```typescript
// src/components/StatusBadge.tsx
import type { TaskStatus } from '../types';

interface StatusBadgeProps {
  status: TaskStatus;
  /** compact = just the dot + text; full = pill with background */
  variant?: 'compact' | 'full';
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string; pill: string }> = {
  todo:        { label: 'To Do',       dot: 'bg-gray-400',   pill: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-400',   pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  blocked:     { label: 'Blocked',     dot: 'bg-red-400',    pill: 'bg-red-500/10 text-red-400 border-red-500/20' },
  done:        { label: 'Done',        dot: 'bg-green-400',  pill: 'bg-green-500/10 text-green-400 border-green-500/20' },
  cancelled:   { label: 'Cancelled',   dot: 'bg-gray-600',   pill: 'bg-gray-600/10 text-gray-500 border-gray-600/20' },
};

export function StatusBadge({ status, variant = 'full' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (variant === 'compact') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${config.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
```

### PriorityBadge

```typescript
// src/components/PriorityBadge.tsx
import type { TaskPriority } from '../types';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; pill: string }> = {
  P0: { label: 'P0',  pill: 'bg-red-500/15 text-red-400 border-red-500/25' },
  P1: { label: 'P1',  pill: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
  P2: { label: 'P2',  pill: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  P3: { label: 'P3',  pill: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-mono font-bold ${config.pill}`}>
      {config.label}
    </span>
  );
}
```

### TaskCard

The main card component. Renders a single `CoworkTask` row with expand-on-click for notes.

```typescript
// src/components/TaskCard.tsx
import { useState } from 'react';
import type { CoworkTask } from '../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

interface TaskCardProps {
  task: CoworkTask;
  /** Called when user clicks the card (optional — pass for selection UX) */
  onSelect?: (task: CoworkTask) => void;
  /** Called when user presses 'd' on focused card to mark done (optional) */
  onMarkDone?: (taskId: string) => void;
  /** Show notes inline when expanded (default: true) */
  showNotes?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function TaskCard({ task, onSelect, onMarkDone, showNotes = true }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      className="rounded-xl border border-white/10 bg-[#1a2a4a] p-4 cursor-pointer hover:border-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      onClick={() => { setExpanded(!expanded); onSelect?.(task); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { setExpanded(!expanded); onSelect?.(task); }
        if (e.key === 'd' && onMarkDone) { e.preventDefault(); onMarkDone(task.id); }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {task.priority && <PriorityBadge priority={task.priority} />}
            <StatusBadge status={task.status} variant="compact" />
          </div>
          <p className="mt-1 text-sm font-medium text-white leading-snug">{task.title}</p>
          <p className="mt-1 text-xs text-gray-500">{timeAgo(task.created_at)}</p>
        </div>
      </div>

      {expanded && showNotes && task.notes && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-xs text-gray-400 whitespace-pre-wrap">{task.notes}</p>
        </div>
      )}
    </div>
  );
}
```

### useCoworkKeyboardShortcuts

Board-level keyboard shortcuts hook. Attach to a container div or the document.

```typescript
// src/hooks/useCoworkKeyboardShortcuts.ts
import { useEffect, useCallback } from 'react';

interface CoworkKeyboardConfig {
  /** Called when user presses 'n' → open new task form */
  onNewTask?: () => void;
  /** Called when user presses '/' → focus search */
  onSearch?: () => void;
  /** Called when user presses 'r' → refresh tasks */
  onRefresh?: () => void;
  /** Called when user presses 'Escape' → close modal/panel */
  onEscape?: () => void;
  /** Guard: only activate when this ref's element is focused or is a parent */
  disabled?: boolean;
}

export function useCoworkKeyboardShortcuts(config: CoworkKeyboardConfig) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (config.disabled) return;
    // Don't fire shortcuts when user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    switch (e.key) {
      case 'n': config.onNewTask?.(); break;
      case '/': e.preventDefault(); config.onSearch?.(); break;
      case 'r': config.onRefresh?.(); break;
      case 'Escape': config.onEscape?.(); break;
    }
  }, [config]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

---

## Package Structure

```
packages/zao-cowork/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # barrel export
│   ├── types.ts          # CoworkTask, TaskStatus, TaskPriority
│   ├── components/
│   │   ├── TaskCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── PriorityBadge.tsx
│   └── hooks/
│       └── useCoworkKeyboardShortcuts.ts
└── README.md
```

**package.json:**
```json
{
  "name": "@zao/cowork",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "react": "^18 || ^19"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18"
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```

---

## Where It Lives (Source Repo)

Options for where the package source lives:

**Option A: In-tree under `packages/zao-cowork/`** (in `bettercallzaal/zaalcaster`)
- Pros: one repo to PR, CI inherits existing setup
- Cons: consumer is also the source — dogfooding confuses versioning

**Option B: Own repo `bettercallzaal/zao-cowork`**
- Pros: clean separation, can have its own changelog
- Cons: extra repo to maintain

**Recommendation: Option A** — put it in `zaalcaster/packages/zao-cowork/` for v0.1. Eject to own repo when there are 2+ separate consumer repos importing it.

---

## Which Surfaces Import It

| Surface | Current state | After @zao/cowork |
|---------|-------------|-------------------|
| zaalcaster agent admin panel | Inline status logic (no TaskCard) | `import { TaskCard } from '@zao/cowork'` |
| ZAOOS workspace dashboard (future) | Not built yet | Same import |
| ZAO mobile (future) | Not built yet | Same import (RN support pending) |

The immediate consumer is zaalcaster's agent admin panel at `src/components/admin/agents/AgentDashboard.tsx`. The AgentCard there already has the card layout — this package would generalize it for cowork tasks.

---

## Implementation Plan

1. Create `packages/zao-cowork/` in `bettercallzaal/zaalcaster`
2. Copy types from this doc
3. Build the 3 components + 1 hook
4. `npm run build` → verify dist output
5. Publish: `npm publish --access public` (from Zaal's npm account with @zao org access)
6. Consume in `src/components/admin/agents/AgentDashboard.tsx` (replace inline status logic)
7. PR: `feat(cowork): extract @zao/cowork 0.1.0 + consume in agent dashboard`

**Time estimate:** 3-4 hours for Hurricane.  
**Gate:** Zaal must have @zao npm org ready (or use `@bettercallzaal/cowork` as a fallback scope).

---

## Sources

- Board task `01ee91c7`: "extract @zao/cowork npm package — TaskCard, StatusBadge, PriorityBadge, keyboard hooks"
- Doc 1126 (Lego composability architecture): Stage 1 STUD extraction pattern
- `src/components/admin/agents/AgentCard.tsx`: styling reference (dark card pattern)
- `src/components/hats/HatBadge.tsx`: badge pill pattern and color conventions
- ZAOcowork Supabase schema: `tasks` table with `status`, `priority`, `category`, `notes`, `metadata` fields
