# How to Search Existing Research + Codebase

## Search Research Documents

Search all research documents for a keyword:
```bash
grep -ri "keyword" research/*/README.md
```

Search for a specific topic across research + docs:
```bash
grep -ri "topic" research/*/README.md docs/*.md
```

Find which research docs mention a specific technology:
```bash
grep -rli "supabase\|neynar\|xmtp\|livekit" research/*/README.md
```

## Search the Codebase

These are critical — always check what's actually built before trusting research docs.

### Find how a feature is implemented
```bash
grep -ri "respect\|governance\|proposal" src/app/api/ --include="*.ts" -l
grep -ri "respect\|governance\|proposal" src/lib/ --include="*.ts" -l
grep -ri "respect\|governance\|proposal" src/components/ --include="*.tsx" -l
```

### Find database schemas
```bash
grep -ri "CREATE TABLE\|ALTER TABLE" scripts/*.sql
```

### Find API routes
```bash
find src/app/api -name "route.ts" -type f
```

### Find what a component imports/uses
```bash
grep -ri "import.*from" src/components/chat/ChatRoom.tsx
```

### Find contract addresses in code
```bash
grep -ri "0x[a-fA-F0-9]\{40\}" src/ --include="*.ts" --include="*.tsx"
grep -ri "0x[a-fA-F0-9]\{40\}" community.config.ts
```

### Find environment variables used
```bash
grep -ri "process.env\." src/ --include="*.ts" --include="*.tsx" -h | sort -u
```

### Find Zod schemas (validation rules)
```bash
grep -ri "z\.\|zodSchema\|safeParse" src/lib/validation/ --include="*.ts"
```

### Find what's "coming soon" or TODO
```bash
grep -ri "coming soon\|TODO\|FIXME\|placeholder" src/ --include="*.ts" --include="*.tsx"
```

## Cross-Reference Patterns

### Check if a researched feature is actually built
```bash
# Example: Is Hats Protocol integrated?
grep -ri "hats\|@hatsprotocol" src/ package.json
# If no results → not built yet, only researched

# Example: Is XMTP fully working?
grep -ri "xmtp" src/ --include="*.ts" --include="*.tsx" -l
# Shows all XMTP-related files
```

### Compare research claims vs code reality
```bash
# What does research say about respect?
grep -ri "tier\|decay\|newcomer\|curator\|elder\|legend" research/04-respect-tokens/README.md

# What does the code actually do?
grep -ri "tier\|decay\|newcomer\|curator\|elder\|legend" src/ --include="*.ts" --include="*.tsx"
# If code has none of these → research is aspirational, not implemented
```

## Key Files to Check First

| What | Where |
|------|-------|
| Contract addresses | `community.config.ts` |
| Auth flow | `src/lib/auth/session.ts` |
| API routes | `src/app/api/` |
| Database schemas | `scripts/*.sql` |
| Respect system | `src/lib/respect/` |
| Security policy | `SECURITY.md` |
| Project conventions | `CLAUDE.md` |
| Sprint plans | `docs/superpowers/plans/` |
| Canonical guide | `research/50-the-zao-complete-guide/README.md` |

## Also Check These Locations

- `docs/XMTP_RESEARCH.md` — XMTP v3 deep dive
- `docs/MINIAPP_RESEARCH.md` — Farcaster Mini App spec
- `docs/HIVE_RESEARCH.md` — Hive blockchain cross-posting
- `docs/neynar-credit-optimization.md` — Neynar API costs
- `docs/HUB_STREAMING.md` — Hub streaming patterns
- `docs/TESTING_CHECKLIST.md` — Testing procedures
- `SECURITY.md` — Security policy and key management
