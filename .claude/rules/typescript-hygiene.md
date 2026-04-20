---
description: TypeScript hygiene rules merged from ECC rules/typescript/ (doc 441/442)
globs: "**/*.ts,**/*.tsx"
---

# TypeScript Hygiene

Additive rules cherry-picked from `affaan-m/everything-claude-code` `rules/typescript/` pinned SHA `8bdf88e5`. Extends existing `.claude/rules/api-routes.md`, `components.md`, `tests.md`.

## Types

- Add explicit parameter + return types to EXPORTED functions, shared utilities, public class methods.
- Let TS infer obvious local variable types. Don't over-annotate locals.
- Use `interface` for object shapes that may be extended/implemented. Use `type` for unions, intersections, tuples, mapped types, utility types.
- Prefer string-literal unions over `enum` unless interop requires enum.

## `any` is banned

- No `any` in application code.
- Use `unknown` for external/untrusted input. Narrow with `instanceof Error`, typeof checks, or Zod before using.
- Use generics when a value's type depends on the caller.

```typescript
// CORRECT
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}
```

## React props

- Define component props with a named `interface`. Type callback props explicitly.
- Do NOT use `React.FC`.

```typescript
interface UserCardProps {
  user: User
  onSelect: (id: string) => void
}

function UserCard({ user, onSelect }: UserCardProps) { /* ... */ }
```

## Error handling in try/catch

- Type the caught error as `error: unknown`, not `error: any` or implicit.
- Narrow before accessing `.message`.

```typescript
try { /* ... */ }
catch (error: unknown) {
  logger.error('Operation failed', error)
  throw new Error(getErrorMessage(error))
}
```

## Env var validation

- Read env vars into a const, throw at module load if missing (not at first use).

```typescript
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('OPENAI_API_KEY not configured')
```

## No `console.log` in production

- No `console.log` statements in production code (components, routes, agents).
- Use proper logger. `console.error` in server routes for caught errors only.
- `ecc-silent-failure-hunter` agent + `ecc-hookify-rules` skill can wire an auto-check.

## API response shape (applies to `src/app/api/**/route.ts`)

For consistent client-side handling, prefer this shape where useful:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: { total: number; page: number; limit: number }
}
```

Already-shipped routes with ad-hoc shapes don't need refactoring — apply to NEW routes.

## Source

Merged 2026-04-20 from ECC `rules/typescript/coding-style.md`, `patterns.md`, `security.md`. Pinned SHA `8bdf88e5ad8877bcd00a4aba7ccbfb50f235f10f`. See `research/dev-workflows/441-everything-claude-code-integration/` for provenance.
