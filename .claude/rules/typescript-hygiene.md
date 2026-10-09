# TypeScript Hygiene

From `affaan-m/everything-claude-code` `rules/typescript/` at SHA `8bdf88e5` (doc 441). Examples: `research/dev-workflows/2649-rules-history/archive/typescript-hygiene.md`.

- Explicit parameter + return types on EXPORTED functions, shared utilities, public class methods. Let TS infer obvious locals.
- `interface` for extendable object shapes; `type` for unions, intersections, tuples, mapped and utility types. Prefer string-literal unions over `enum` unless interop requires it.
- **No `any` in application code.** `unknown` for external/untrusted input, narrowed with `instanceof Error`, typeof checks, or Zod. Generics when the type depends on the caller.
- React props: a named `interface`; type callback props explicitly; no `React.FC`.
- `catch (error: unknown)`, narrowed before reading `.message`.
- Env vars: read into a const and throw at module load if missing, not at first use.
- No `console.log` in production code (components, routes, agents). Use a logger; `console.error` in server routes for caught errors only.
- NEW API routes prefer `interface ApiResponse<T> { success: boolean; data?: T; error?: string; meta?: { total: number; page: number; limit: number } }`. Existing routes need no refactor.
