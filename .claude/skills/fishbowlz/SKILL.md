---
name: fishbowlz
description: Manage the standalone FISHBOWLZ project — sync from ZAO OS, push to GitHub, deploy to fishbowlz.com. Build features here, ship there.
---

# FISHBOWLZ — Standalone Product Management

Build in ZAO OS (full context + agents) → sync to standalone repo → deploy to fishbowlz.com.

## Usage

- `/fishbowlz` — interactive, asks what you need
- `/fishbowlz sync` — sync all FISHBOWLZ files to standalone repo + push
- `/fishbowlz status` — check standalone repo state, Vercel deploy status
- `/fishbowlz build <feature>` — build a feature in ZAO OS, then sync to standalone
- `/fishbowlz push` — push standalone repo to GitHub (triggers Vercel deploy)
- `/fishbowlz diff` — show what's different between ZAO OS and standalone

## Architecture

```
ZAO OS (dev)                    fishbowlz repo (prod)
/Users/zaalpanthaki/            /Users/zaalpanthaki/
  Documents/ZAO OS V1/            Documents/fishbowlz/
  ├── src/app/fishbowlz/          ├── src/app/fishbowlz/     (synced)
  ├── src/app/api/fishbowlz/      ├── src/app/api/fishbowlz/ (synced)
  ├── src/components/spaces/       ├── src/components/spaces/  (synced)
  ├── src/components/fishbowlz/   ├── src/components/fishbowlz/ (synced)
  ├── src/lib/fishbowlz/          ├── src/lib/fishbowlz/     (synced)
  └── (800+ other files)          ├── src/app/page.tsx        (landing - standalone only)
                                  ├── community.config.ts     (stub)
                                  └── src/lib/env.ts          (stub)
```

**Same Supabase DB** — both sites read/write the same `fishbowl_*` tables.

**GitHub repos:**
- ZAO OS: `bettercallzaal/ZAOOS`
- Standalone: `bettercallzaal/fishbowlz`

**Domains:**
- ZAO OS: zaoos.com/fishbowlz
- Standalone: fishbowlz.com

## Paths

| What | ZAO OS Path | Standalone Path |
|------|-------------|-----------------|
| Source repo | `/Users/zaalpanthaki/Documents/ZAO OS V1` | `/Users/zaalpanthaki/Documents/fishbowlz` |
| Sync script | `scripts/sync-fishbowlz.sh` | — |
| Pages | `src/app/fishbowlz/` | `src/app/fishbowlz/` |
| API | `src/app/api/fishbowlz/` | `src/app/api/fishbowlz/` |
| Components | `src/components/{spaces,fishbowlz,ui}/` | same |
| Lib | `src/lib/fishbowlz/` | same |
| Hooks | `src/hooks/useAuth.ts, useLiveTranscript.ts` | same |
| 100ms | `src/app/api/100ms/token/route.ts` | same |
| Migrations | `supabase/migrations/*fishbowl*` | same |

## Sync Process

### Full sync (run sync script + push):

```bash
# From ZAO OS directory
bash scripts/sync-fishbowlz.sh /Users/zaalpanthaki/Documents/fishbowlz
cd /Users/zaalpanthaki/Documents/fishbowlz
git add -A
git commit -m "sync: update from ZAO OS — <describe changes>"
git push origin main
```

### Quick sync (single file changed):

```bash
# Copy the specific file
cp "src/app/fishbowlz/[id]/page.tsx" "/Users/zaalpanthaki/Documents/fishbowlz/src/app/fishbowlz/[id]/page.tsx"
cd /Users/zaalpanthaki/Documents/fishbowlz
git add -A && git commit -m "sync: <what changed>" && git push origin main
```

### After sync — check for broken imports:

The standalone repo has stubs for ZAO-specific modules:
- `src/lib/env.ts` — env var access (stub, not the ZAO OS validated version)
- `src/types/index.ts` — session types (subset of ZAO OS types)
- `community.config.ts` — minimal config (not the full ZAO OS config)
- `src/lib/logger.ts` — console logger (not the ZAO OS structured logger)
- `src/lib/db/audit-log.ts` — noop audit log (not the ZAO OS Supabase version)

If a synced file imports something new from ZAO OS, you need to either:
1. Add it to the sync script
2. Create a stub in the standalone repo

Run `npx tsc --noEmit` in the standalone repo after every sync to catch missing imports.

## Standalone-Only Files (don't overwrite on sync)

These files exist only in the standalone repo:
- `src/app/page.tsx` — landing page for fishbowlz.com
- `src/app/layout.tsx` — standalone layout (no ZAO OS nav/providers)
- `community.config.ts` — minimal stub
- `src/lib/env.ts` — env stub
- `src/types/index.ts` — type stubs
- `src/lib/logger.ts` — console logger stub
- `src/lib/db/audit-log.ts` — noop audit stub
- `.npmrc` — legacy-peer-deps for React 19

## Database Migrations

Migrations are synced but must be applied manually to Supabase:

```sql
-- All fishbowl migrations in order:
-- 1. supabase/migrations/20260404_fishbowlz.sql (core tables)
-- 2. supabase/migrations/20260405_fishbowl_chat.sql
-- 3. supabase/migrations/20260405_fc_identity_gating.sql
-- 4. supabase/migrations/20260405_fishbowl_scheduled.sql
-- 5. supabase/migrations/20260405_fishbowl_hand_raise.sql
-- 6. supabase/migrations/20260405_fishbowl_rotation_timer.sql
-- 7. supabase/migrations/20260405_fishbowl_summary.sql
```

## Env Vars (Vercel)

Both projects use the SAME env vars (same Supabase, 100ms, Neynar):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_100MS_ACCESS_KEY
HMS_APP_SECRET
NEXT_PUBLIC_100MS_TEMPLATE_ID
NEYNAR_API_KEY
ZAO_OFFICIAL_SIGNER_UUID
ZAO_OFFICIAL_NEYNAR_API_KEY
ZAO_OFFICIAL_FID
SESSION_SECRET
ANTHROPIC_API_KEY
NEXT_PUBLIC_SITE_URL  ← different per project (zaoos.com vs fishbowlz.com)
```

## VIP Layer (ZAO OS only)

Users who access FISHBOWLZ through zaoos.com get VIP treatment:
- Verified ZAO badge on avatar
- Priority in hand raise queue
- Access to FC-gated rooms
- Respect-weighted speaker time

This logic lives in ZAO OS only — the standalone site has the base experience.

## Building New Features

Always build in ZAO OS first (we have context, agents, skills). Then sync:

1. Build the feature in ZAO OS (modify files in `src/app/fishbowlz/`, `src/app/api/fishbowlz/`, etc.)
2. Test on zaoos.com
3. Run `/fishbowlz sync` to push to standalone
4. Verify standalone builds: `cd /Users/zaalpanthaki/Documents/fishbowlz && npx tsc --noEmit`
5. Push: `git push origin main`

## Hackathon Notes

- **Farcaster Hackathon** — FISHBOWLZ is the submission
- **Domain:** fishbowlz.com
- **GitHub:** github.com/bettercallzaal/fishbowlz
- **Demo:** fishbowlz.com (production) or zaoos.com/fishbowlz (with VIP features)
