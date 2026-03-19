---
description: Rules for API route handlers
globs: src/app/api/**/*.ts
---

# API Route Conventions

- Validate ALL input with Zod `safeParse` before processing. Return 400 with error details on failure.
- Check session with `getSession()` before any authenticated operation. Return 401 if missing.
- Always return `NextResponse.json(...)` — never plain `Response` or raw strings.
- Wrap handler body in try/catch. Log errors server-side, return sanitized 500 response to client.
- NEVER expose server-only env vars (`SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY`) in responses.
- Use `Promise.allSettled` for parallel fault-tolerant operations.
- Keep route files at `/api/[feature]/[action]/route.ts`.
