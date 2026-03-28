# 40 — Codebase Audit Guide: Step-by-Step

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** A practical, copy-pasteable guide to audit the ZAO OS codebase for security, quality, performance, and accessibility

---

## Quick Start: 45-Minute Minimum Audit

If you're short on time, these 7 checks cover the critical security baseline:

```bash
# 1. Dependency vulnerabilities (2 min)
npm audit

# 2. Environment variable exposure (5 min)
grep -r "NEXT_PUBLIC_" src/ --include="*.ts" --include="*.tsx" -l

# 3. API route auth check (15 min — manually review each)
find src/app/api -name "route.ts"

# 4. Supabase RLS check (10 min — run in Supabase SQL Editor)
# SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

# 5. Type check (2 min)
npx tsc --noEmit

# 6. Secret scan (5 min)
grep -rn "sk_\|pk_\|apikey\|secret\|password" src/ --include="*.ts" --include="*.tsx" -i | grep -v "process\.env" | grep -v "\.d\.ts"

# 7. Session security (5 min)
grep -r "sameSite\|httpOnly\|secure" src/ --include="*.ts" --include="*.tsx"
```

---

## Full Audit: Phase-by-Phase

### Phase 1: Install Tools

```bash
# Security scanning
npm install -D eslint-plugin-security

# Dead code and unused dependencies
npm install -D knip

# Code duplication
npm install -g jscpd

# Bundle analysis
npm install -D @next/bundle-analyzer

# License checking
npm install -g license-checker
```

### Phase 2: Automated Scans (30 min)

Run all of these and save output:

```bash
# Type check
npx tsc --noEmit 2>&1 | tee audit-types.txt

# Lint with security rules
npx eslint . --max-warnings 0 2>&1 | tee audit-lint.txt

# Dependency vulnerabilities
npm audit 2>&1 | tee audit-deps.txt

# Unused code and dependencies
npx knip 2>&1 | tee audit-unused.txt

# Code duplication
jscpd src/ --min-lines 10 --min-tokens 50 2>&1 | tee audit-duplication.txt

# License check
license-checker --summary 2>&1 | tee audit-licenses.txt
```

### Phase 3: Security Review (1-2 hours)

#### Environment Variables

```bash
# Find all NEXT_PUBLIC_ variables — only safe-for-browser values should use this prefix
grep -r "NEXT_PUBLIC_" src/ --include="*.ts" --include="*.tsx" -l

# Find all process.env references
grep -r "process\.env\." src/ --include="*.ts" --include="*.tsx"
```

> [!CAUTION]
> These must NEVER be `NEXT_PUBLIC_`: Supabase service role key, Neynar API key, XMTP private keys, iron-session secret, APP_SIGNER_PRIVATE_KEY

#### API Route Authentication

```bash
# List all API routes
find src/app/api -name "route.ts" -o -name "route.tsx"
```

For EACH route, verify it checks authentication before doing anything:
- Calls `getIronSession()` at the top
- Returns 401/403 if no valid session
- Validates user has permission for the specific resource

#### Input Validation

```bash
# Find routes that accept user input
grep -rn "request.json\(\)\|searchParams\|params\." src/app/api --include="*.ts"
```

Every endpoint accepting user input MUST validate with Zod:
```typescript
const result = schema.safeParse(await request.json());
if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
```

#### XSS Prevention

```bash
# The most dangerous React pattern
grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx" --include="*.ts"

# URL-based XSS
grep -rn "href={" src/ --include="*.tsx" | grep -v "next/link"
```

#### SQL Injection

```bash
# Find raw SQL or template literal queries
grep -r "\.rpc\(" src/ --include="*.ts" --include="*.tsx"
grep -r "sql\`" src/ --include="*.ts" --include="*.tsx"
```

Supabase JS client uses parameterized queries by default — but check for string concatenation in query filters.

#### Secret Scanning

```bash
# Hardcoded secrets
grep -rn "sk_\|pk_\|apikey\|api_key\|secret\|password\|token" src/ --include="*.ts" --include="*.tsx" -i | grep -v "process\.env" | grep -v "\.d\.ts" | grep -v "// " | grep -v "interface\|type "

# Hardcoded URLs with keys
grep -rn "https://.*key=" src/ --include="*.ts" --include="*.tsx"

# Verify .gitignore
grep -E "\.env|\.key|\.pem" .gitignore
```

#### Session Security

```bash
grep -r "iron-session\|ironSession\|getIronSession\|sessionOptions" src/ --include="*.ts" -l
```

Verify: `httpOnly: true`, `secure: true` (prod), `sameSite: 'lax'`, password 32+ chars from env var, reasonable TTL.

#### Rate Limiting

```bash
grep -rn "rate\|limiter\|rateLimit\|throttle" src/ --include="*.ts" --include="*.tsx"
```

Critical endpoints to protect: auth, message sending, file upload, external API calls.

#### Webhook Verification

```bash
grep -r "webhook" src/app/api --include="*.ts" -l
grep -r "signature\|verify\|hmac" src/app/api --include="*.ts"
```

Every webhook must verify signatures before processing.

#### CORS & CSP

```bash
grep -r "Access-Control\|cors\|Content-Security-Policy" src/ next.config.* --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs"
```

### Phase 4: Code Quality Review (1 hour)

#### Type Safety

```bash
# Find all `any` types
grep -rn ": any" src/ --include="*.ts" --include="*.tsx"
grep -rn "as any" src/ --include="*.ts" --include="*.tsx"

# Type assertions
grep -rn "as [A-Z]" src/ --include="*.ts" --include="*.tsx"

# Non-null assertions
grep -rn "\!\." src/ --include="*.ts" --include="*.tsx"

# Suppressed type checking
grep -rn "@ts-ignore\|@ts-expect-error\|@ts-nocheck" src/ --include="*.ts" --include="*.tsx"
```

Every `any` is a hole in type safety. Replace with proper types or `unknown` + narrowing.

#### Error Handling

```bash
# Empty catch blocks
grep -rn "catch.*{" src/ --include="*.ts" --include="*.tsx" -A 1 | grep "}"

# Unhandled promises
grep -rn "\.then(" src/ --include="*.ts" --include="*.tsx" | grep -v "\.catch("

# Console.log cleanup
grep -rn "console\.\(log\|warn\|error\|debug\)" src/ --include="*.ts" --include="*.tsx"
```

#### TODO Inventory

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP\|WORKAROUND" src/ --include="*.ts" --include="*.tsx"
```

#### Dead Code

```bash
npx knip
```

### Phase 5: Performance Review (30 min)

#### Bundle Size

```bash
ANALYZE=true npm run build
# Or: npx next experimental-analyze
```

Look for: client bundles >200KB/route, packages that should be server-only, unnecessary large imports.

#### Client vs Server Components

```bash
# Count client components
grep -rl "'use client'" src/ --include="*.tsx" --include="*.ts" | wc -l

# List them
grep -rl "'use client'" src/ --include="*.tsx" --include="*.ts"
```

For each: does it truly need client interactivity? Can heavy logic move to Server Components?

#### React Query Cache

```bash
grep -rn "useQuery\|useMutation\|useInfiniteQuery" src/ --include="*.ts" --include="*.tsx" -A 5 | grep "staleTime\|gcTime"
```

Missing `staleTime` defaults to 0 (refetch every mount). Set appropriate values.

#### Image Optimization

```bash
# Find raw img tags that should be next/image
grep -rn "<img " src/ --include="*.tsx"
```

#### Database Queries

```bash
# Find Supabase queries
grep -rn "supabase\.\(from\|rpc\)" src/ --include="*.ts" --include="*.tsx" -A 3
```

Look for: queries in loops (N+1), missing `.select()` specificity, missing `.limit()`.

### Phase 6: Supabase Audit (15 min)

Run in Supabase SQL Editor:

```sql
-- Check RLS status on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all RLS policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

Verify:
- RLS enabled on ALL tables with user data
- `service_role` key NEVER in client-side code
- `anon` key only accesses what RLS allows

```bash
# Service role key exposure check
grep -rn "SUPABASE_SERVICE_ROLE\|service_role\|supabaseAdmin" src/ --include="*.ts" --include="*.tsx"
```

### Phase 7: Web3 Audit (15 min)

```bash
# Private key handling
grep -rn "privateKey\|mnemonic\|seed" src/ --include="*.ts" --include="*.tsx"

# Neynar key protection
grep -rn "NEYNAR" src/ --include="*.ts" --include="*.tsx"

# Wallet/signing code
grep -rn "privateKeyToAccount\|signMessage\|signTypedData" src/ --include="*.ts" --include="*.tsx"
```

Verify: private keys server-side only, Neynar key not `NEXT_PUBLIC_`, signing happens server-side.

### Phase 8: Accessibility (15 min)

```bash
# Images without alt text
grep -rn "<img\|<Image" src/ --include="*.tsx" | grep -v "alt="

# Buttons without labels
grep -rn "<button" src/ --include="*.tsx" | grep -v "aria-label\|aria-labelledby"

# Interactive elements without keyboard handlers
grep -rn "onClick" src/ --include="*.tsx" | grep -v "onKeyDown\|button\|Button\|<a \|<Link"

# Missing form labels
grep -rn "<input\|<select\|<textarea" src/ --include="*.tsx" | grep -v "aria-label\|id=.*label"
```

Also run Lighthouse Accessibility audit in Chrome DevTools on each major page. Target: 90+.

---

## Prioritizing Findings

| Severity | Definition | Fix When |
|----------|-----------|----------|
| **Critical** | Exploitable now, data loss or unauthorized access | Immediately |
| **High** | Significant security risk | Within 1 week |
| **Medium** | Security hygiene, defense-in-depth | Within 1 month |
| **Low** | Code quality, best practices | Next sprint |

---

## Using Claude Code for Auditing

### Security Review (per directory)

```
"Audit all files in src/app/api/ for:
1. Authentication check at start of every handler
2. Input validation with Zod
3. Proper error responses (no stack traces leaked)
4. Rate limiting considerations
5. No state changes on GET requests"
```

```
"Audit all files in src/lib/ for:
1. Type safety (no 'any')
2. Error handling (try/catch on async)
3. No hardcoded config (use env vars)
4. Separation of concerns"
```

```
"Audit all files in src/components/ for:
1. XSS vulnerabilities
2. Accessibility (alt text, ARIA, keyboard nav)
3. Proper 'use client' usage
4. No direct API calls (should go through hooks)
5. useEffect cleanup"
```

### Pattern Search

```
"Find all security anti-patterns in src/:
- 'any' type on user input
- API routes without auth
- dangerouslySetInnerHTML without sanitization
- Environment variables exposed to client
- Hardcoded secrets"
```

---

## Ongoing Health

### Pre-Commit Hooks (Husky + lint-staged)

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### CI Pipeline (GitHub Actions)

```yaml
name: Code Health
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint .
      - run: npx vitest run --coverage
      - run: npx next build
      - run: npx knip
      - run: npm audit --audit-level=high
```

### Monthly Health Checks

1. `npm audit` — new vulnerabilities
2. `npx knip` — accumulated dead code
3. `npm outdated` — stale dependencies
4. Bundle analysis — size creep
5. Review TODO/FIXME inventory
6. Lighthouse accessibility score

---

## Sources

- [OWASP Top 10:2025](https://owasp.org/Top10/2025/en/)
- [OpenSSF AI Code Assistant Security Guide](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions)
- [Knip Dead Code Detection](https://knip.dev/)
- [eslint-plugin-security](https://github.com/eslint-community/eslint-plugin-security)
- [Snyk](https://snyk.io/)
- [Socket.dev](https://socket.dev/)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog)
- [Supabase Security Testing](https://supabase.com/docs/guides/security/security-testing)
- [Next.js Security Headers](https://nextjs.org/docs/app/guides/security-headers)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig/)
- [Claude Code Review Plugin](https://code.claude.com/docs/en/code-review)
- [Claude Code Security Review Action](https://github.com/anthropics/claude-code-security-review)
