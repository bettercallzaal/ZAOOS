# How to Search Existing Research

## Quick Search Commands

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

## Common Search Patterns

### Find API information
```bash
grep -ri "endpoint\|/v2/\|/api/" research/*/README.md
```

### Find pricing/cost information
```bash
grep -ri "pricing\|cost\|\$/mo\|free tier" research/*/README.md
```

### Find tool recommendations
```bash
grep -ri "recommend\|best for\|verdict" research/*/README.md
```

### Find implementation details
```bash
grep -ri "npm install\|import.*from\|setup\|configuration" research/*/README.md
```

### Find comparisons
```bash
grep -ri "vs\|comparison\|alternative" research/*/README.md
```

## Also Check These Locations

- `docs/XMTP_RESEARCH.md` — XMTP v3 deep dive
- `docs/MINIAPP_RESEARCH.md` — Farcaster Mini App spec
- `docs/HIVE_RESEARCH.md` — Hive blockchain cross-posting
- `docs/neynar-credit-optimization.md` — Neynar API costs
- `docs/HUB_STREAMING.md` — Hub streaming patterns
- `docs/TESTING_CHECKLIST.md` — Testing procedures
- `SECURITY.md` — Security policy and key management
- `RESEARCH.md` — Condensed research brief (root)
