# How to Search Existing Research + Codebase

Use Claude's native tools (Grep, Glob, Read) — NOT bash grep/find commands.

## Search Research Documents

Search all research documents for a keyword:
```
Grep pattern="keyword" path="research/" glob="*/README.md"
```

Search for a specific technology across research + docs:
```
Grep pattern="supabase|neynar|xmtp|livekit" path="research/" glob="*/README.md" output_mode="files_with_matches"
```

Find a research doc by number:
```
Read file_path="research/{number}-{topic}/README.md"
```

## Search the Codebase

Always check what's actually built before trusting research docs.

### Find how a feature is implemented
```
Grep pattern="respect|governance|proposal" path="src/app/api/" type="ts"
Grep pattern="respect|governance|proposal" path="src/lib/" type="ts"
Grep pattern="respect|governance|proposal" path="src/components/" type="ts"
```

### Find API routes
```
Glob pattern="src/app/api/**/route.ts"
```

### Find database schemas
```
Grep pattern="CREATE TABLE|ALTER TABLE" path="scripts/" glob="*.sql"
```

### Find what a component imports
```
Read file_path="src/components/{feature}/{Component}.tsx" limit=30
```

### Find contract addresses in code
```
Grep pattern="0x[a-fA-F0-9]{40}" path="community.config.ts" output_mode="content"
```

### Find environment variables used
```
Grep pattern="process\.env\." path="src/" glob="*.{ts,tsx}" output_mode="content"
```

### Find Zod schemas (validation rules)
```
Grep pattern="z\.|zodSchema|safeParse" path="src/lib/validation/" type="ts"
```

### Find TODOs and placeholders
```
Grep pattern="coming soon|TODO|FIXME|placeholder" path="src/" glob="*.{ts,tsx}"
```

## Cross-Reference Patterns

### Check if a researched feature is actually built
```
# Is Hats Protocol integrated?
Grep pattern="hats|@hatsprotocol" path="src/"
Grep pattern="hats|@hatsprotocol" path="package.json" output_mode="content"
# No results → not built yet, only researched

# Is XMTP fully working?
Grep pattern="xmtp" path="src/" glob="*.{ts,tsx}" output_mode="files_with_matches"
```

### Compare research claims vs code reality
```
# What does research say about respect?
Grep pattern="tier|decay|newcomer|curator|elder|legend" path="research/04-respect-tokens/README.md" output_mode="content"

# What does the code actually do?
Grep pattern="tier|decay|newcomer|curator|elder|legend" path="src/" glob="*.{ts,tsx}"
# No results → research is aspirational
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
