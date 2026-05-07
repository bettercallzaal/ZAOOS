# Nexus legacy-repos capture manifest

Captured 2026-05-07 BEFORE deleting 20 legacy public repos at github.com/bettercallzaal/NEXUSV*. Reason for capture: 17 of 20 repos publicly leaked Alchemy + OpenAI API keys via committed `.env` files. Public deletion is the only fix; archived contents preserve institutional memory.

## What's preserved here

### `readmes/` (20 files)
README.md from each legacy repo. Sizes range 9KB to 51KB. Tracks the feature evolution V1 -> V5.8.5.

### `V5.8.4-richest/` (the most feature-rich legacy)
Last-but-one push (2025-07-14, 213MB repo because of committed `.next/` build dir). Captured:
- `links.json` (73KB, **70 actual links** despite README claiming "5000+")
- `links-updated.json` (6KB)
- `generate-links.js` (3.5KB) - data generator script
- `enhanced-auto-tagger.js` (11.5KB) - the AI tagger that ZAONEXUS dropped
- `migrate-links-structure.js` (10.7KB)
- `update-links-structure.js` (17KB)
- `package.json` - dep reference (Privy + Wagmi + AI SDK + others ZAONEXUS doesn't use)
- `ai-tagging-and-links-fix.patch` (14KB) - patch with fixes
- `README.md` - claims wallet gating + AI tagging + 5000+ links capacity

### `V5.8.5-final/` (last legacy push 2025-07-19)
Just README. Identical to V5.8.4 README content. The V5.8.4 -> V5.8.5 diff was minor.

### `ZAONEXUS-current/` (current canonical, dormant since 2026-02-13)
- `links.ts` (22KB, **126 actual links** - the richest current catalog)
- `page.tsx` (22KB) - main UI with search
- `layout.tsx`
- `globals.css`
- `tailwind.config.js`
- `package.json` (Next.js 14 + React 18 + Tailwind v3, no DB)
- `README.md` (7.7KB) - claims "200+ curated"
- `CHANGELOG.md` (5.6KB)

## Reality vs claims

| Source | Claim | Actual | Verified |
|---|---|---|---|
| V5.8.4 README | "5000+ links capacity" | 70 links in `links.json` | python json count |
| ZAONEXUS README | "200+ curated" | 126 links | grep `url:` count |
| bettercallzaal.com/nexus.html | (not claimed) | 87 unique URLs | grep `href="https?://` |

V5.8.4's "5000+" is aspirational/vaporware. ZAONEXUS at 126 is the actual high-water mark. Doc 623's "5000+ lost in rewrite" lament was incorrect.

## What was technically lost in the V5.8.4 -> ZAONEXUS rewrite

Real losses (as in: code that worked, removed):
- **AI auto-tagging** (`enhanced-auto-tagger.js`) - OpenAI-driven category assignment. Preserved here. Could revive in canonical rebuild.
- **Wallet gating** ($ZAO Optimism + $LOANZ Base token-balance check via Wagmi). Source not yet captured (lives in src/lib/ + src/components/wallet/). If revival wanted, pull before delete.
- **Supabase backend** (PR #149 in ZAOOS shipped admin panels using this). Not in V5.8.4 src/ tree directly - that PR was server-side ZAOOS work.
- **Migration/update scripts** - `migrate-links-structure.js`, `update-links-structure.js`. Captured here.

What was NOT lost:
- "5000+ links" was never real
- Search (ZAONEXUS has it)
- Categories (ZAONEXUS has them)
- Mobile responsive (ZAONEXUS has it)

## Decision implications

For the canonical-rebuild phase (after key rotation + repo deletion):

1. **Start from ZAONEXUS as base** (126 links is the richest catalog).
2. **Merge bettercallzaal.com/nexus.html link content** (87 URLs, mostly umbrella brand page links).
3. **Optionally revive AI tagger** from `enhanced-auto-tagger.js` (preserved here).
4. **Optionally revive wallet gating** if member-only sections desired (would need separate capture of `src/lib/wallet/` from V5.8.4 BEFORE delete).
5. **Skip the "5000+" framing** in any new README. Curated 200-300 is the realistic target.

## Pre-deletion checklist

Before `gh repo delete` on the 20 legacy repos:

- [x] All 20 READMEs captured
- [x] V5.8.4 link data + AI tagger + migration scripts captured
- [x] ZAONEXUS current state captured (the canonical we're keeping is also captured here as backup)
- [ ] Wallet gating logic from V5.8.4 src/lib/ (if revival desired - see below)
- [ ] Alchemy + OpenAI API keys rotated at provider dashboards
- [ ] All deployments using rotated keys updated

## Next captures if wallet gating wanted

Run before deletion:
```bash
A=research/_archive/nexus-versions/V5.8.4-richest

gh api -H "Accept: application/vnd.github.raw" repos/bettercallzaal/NEXUSV5.8.4/contents/src/lib > /dev/null  # check tree first
# then capture wallet/, types/, hooks/ recursively
```

## Rotation targets

| Key | Where it lives | Action |
|---|---|---|
| `ALCHEMY_API_KEY` | dashboard.alchemy.com -> apps -> revoke + regen | Rotate |
| `OPENAI_API_KEY` | platform.openai.com -> api keys -> revoke + regen | Rotate |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Public, low risk, regen optional | Optional |

After rotation, update keys wherever they're used in any LIVE deployment (Vercel envs, VPS .env, etc.) - NOT in the legacy repos (they're being deleted).
