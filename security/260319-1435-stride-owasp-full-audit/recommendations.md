# Recommendations — Priority Order

## Priority 1 — High (Fix This Sprint)

### 1. Restrict next/image remote patterns
**Finding:** [SSRF via image proxy](./findings.md#finding-2)
**Effort:** 10 minutes
```typescript
// next.config.ts — Replace hostname: '**' with specific domains
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.supabase.co' },
    { protocol: 'https', hostname: 'imagedelivery.net' },
    { protocol: 'https', hostname: 'i.imgur.com' },
    { protocol: 'https', hostname: '*.warpcast.com' },
    { protocol: 'https', hostname: 'res.cloudinary.com' },
    { protocol: 'https', hostname: 'ipfs.io' },
    { protocol: 'https', hostname: '*.neynar.com' },
    // Add other specific PFP/image CDN domains as needed
  ],
},
```

### 2. Strengthen CSP — remove unsafe-eval/unsafe-inline
**Finding:** [CSP weaknesses](./findings.md#finding-1)
**Effort:** 1-2 hours (may require testing with all embedded content)
```typescript
// Use nonce-based CSP if Next.js supports it in your version,
// or at minimum remove unsafe-eval
"script-src 'self' 'unsafe-inline' https://neynarxyz.github.io ...",
// If unsafe-eval is only needed for dev:
...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : []),
```

### 3. Update Next.js to 16.2.0
**Finding:** [Dependency vulnerabilities](./dependency-audit.md)
**Effort:** 15 minutes + testing
```bash
npm install next@16.2.0
npm audit fix
```

## Priority 2 — Medium (Fix This Month)

### 4. Add Zod validation to `/api/users/follow`
**Finding:** [Missing validation](./findings.md#finding-3)
**Effort:** 5 minutes
```typescript
import { z } from 'zod';
const followSchema = z.object({
  targetFid: z.number().int().positive(),
});

// In POST and DELETE handlers:
const parsed = followSchema.safeParse(await request.json());
if (!parsed.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
const { targetFid } = parsed.data;
```

### 5. Add Zod validation to song submission DELETE
**Finding:** [Missing validation](./findings.md#finding-8)
**Effort:** 5 minutes
```typescript
const deleteSchema = z.object({ id: z.string().uuid() });
const parsed = deleteSchema.safeParse(await req.json());
if (!parsed.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
const { id } = parsed.data;
```

### 6. Add security audit logging
**Finding:** [No audit logging](./findings.md#finding-7)
**Effort:** 1-2 hours
```sql
-- Create audit log table
CREATE TABLE security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_fid INTEGER NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'allowlist', 'message', 'proposal'
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. Move rate limiting to shared store for production
**Finding:** [In-memory rate limiting](./findings.md#finding-5)
**Effort:** 2-4 hours
- Use Vercel KV, Upstash Redis, or Supabase for shared state
- Or accept the limitation if running single-instance

### 8. Move nonce stores to shared store for production
**Finding:** [In-memory nonce stores](./findings.md#finding-6)
**Effort:** 1-2 hours (can share the same Redis/KV as rate limiting)

## Priority 3 — Low (Backlog)

### 9. Update .env.example webhook comment
**Finding:** [Misleading comment](./findings.md#finding-11)
**Effort:** 1 minute

### 10. Consider dynamic admin check
**Finding:** [Cached isAdmin](./findings.md#finding-9)
**Effort:** 15 minutes — add `isAdmin(fid)` check in `requireAdmin()` instead of trusting session

### 11. Document IP header trust requirements
**Finding:** [IP spoofing](./findings.md#finding-10)
**Effort:** 5 minutes — add note to SECURITY.md about hosting platform header requirements

### 12. Add mini app webhook security
**Finding:** [Unverified webhook](./findings.md#finding-4)
**Effort:** 30 minutes — add IP allowlist or shared secret header
