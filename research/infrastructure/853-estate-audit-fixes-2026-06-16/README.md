# Doc 853 — ZAO Estate Audit + Fixes (2026-06-16)

**tier:** STANDARD
**date:** 2026-06-16
**sibling-of:** [Doc 836 — ZAOOS Repo Estate Census](../836-zaoos-repo-estate-census/)
**branch:** `claude/zao-os-estate-audit-o156hm`

Adversarial audit of the ZAO estate: verify each claim, fix what is safe in-repo,
hand off what needs infra access or live network (this environment's egress is
locked to GitHub hosts only — every other host returns proxy 403).

## Priority summary

| # | Task | Status | Where |
|---|------|--------|-------|
| 1 | Build/CI red until fix-build merged | ✅ **already merged** (PR #849) + verified | typecheck clean |
| 2 | Drop drift ratchet 7 → 0 | ✅ **fixed** | commit `df02c41` |
| 6 | Triage 3 crit / 19 high CVEs | ✅ **partly fixed** (3 crit → 0) | commit `73abb8a` |
| 7 | Canonical members list for Nexus /journeys | ✅ **shipped** (schema+generator+seed) | commit `906e969` |
| 5 | Finish-or-kill half-built features | ⚠️ **no-op by design** — premise was wrong | see below |
| 3 | Delete 54 Vercel + 2 Supabase | 🚦 **needs human** (no infra access + 1 false positive) | see below |
| 4 | Validate data-feed URLs (Nexus harvest) | 🔒 **blocked here** — files out of scope + no network egress | see below |

## What I fixed (committed)

### Task 1 — Build (verify only)
`ws/fix-build-estate-fs-utils` (PR #849, commit `8f69ba6`) is **already merged into
main**. The task description was stale. Verified the tree is green: `npm run
typecheck` → exit 0. No action needed.

### Task 2 — Drift ratchet 7 → 0 (`df02c41`)
Estate control plane reports **0 fails** (`[OK] drift`, counts in CLAUDE.md/AGENTS.md
match live). Tightened `tools/estate-control-plane/config.json`
`baseline.ratchetMaxFails` 7 → 0 so any **new** estate debt now blocks a PR (CI reads
this value in `estate-health.yml`). Verified `run-checks --ci --max-fails=0` → exit 0;
control-plane unit tests 8/8.

### Task 6 — Security: 3 critical → 0 (`73abb8a`)
`npm audit`: 3 critical / 21 high (brief said 19). The **3 criticals are one chain** —
`shell-quote` pulled in via `@neynar/nodejs-sdk` → openapi codegen — a build-time
devDependency, never in the wallet flow or browser bundle. Added npm `overrides` for
safe, same-major / build-time transitive deps: `shell-quote`, `path-to-regexp`,
`@xmldom/xmldom`, `basic-ftp`, `defu`, `tmp`, `lodash-es`, `form-data`.
**Result: critical 3 → 0, high 21 → 13. Typecheck clean.**

**Deliberately NOT bumped — needs a coordinated wallet-stack upgrade + QA (sign-in /
signing / Snapshot voting / Arweave):** `ws`, `lodash`, `lodash.set`,
`@snapshot-labs/snapshot.js` (direct), `@ethersproject/providers`, `@dha-team/arbundles`,
plus `fast-uri` (governance validation path) and `picomatch` (2→4 major, vitest risk).
**`secp256k1` (GHSA-584q-6j8j-r5pm, key-extraction) has `fixAvailable: false`** — highest
human-priority; needs an upstream patch or dependency replacement under
`@dha-team/arbundles` + `@hiveio/dhive`. All of these are already in the control-plane
`auditAllowlist`.

### Task 7 — Canonical members list (`906e969`)
Shipped `data/members.schema.json`, `data/members.json` (seed), and
`scripts/generate-members.ts`. The generator builds the full list from the
source-of-truth Supabase tables (`allowlist` + `respect_members`) and derives **real**
milestones (Onchain OG, respect tier, fractal sessions) — no fabricated dates, public
fields only. Seed currently holds **one verifiably-public entry**; populating the real
~188-member list needs a DB run (`SUPABASE_SERVICE_ROLE_KEY`) — **needs human / CI job**.
Did **not** hand-seed other members: that is consent-gated third-party PII
(`.claude/rules/pii-hygiene.md`). **→ Affects Nexus:** this is the file Nexus /journeys
should harvest.

## Task 5 — Half-built features: the premise was wrong (no destructive change)

The estate "coming soon" / "not yet configured" flags are **runtime env-gates on
fully-built features**, not dead code. Removing them would have destroyed working
pipelines. Traced every import:

| Feature | Reality | Verdict |
|---------|---------|---------|
| Music NFT mint (`MintTrack`) | Full Arweave impl (`@ardrive/turbo-sdk`, `src/lib/music/arweave.ts`), reachable from `/music`. Returns 503 only because `ARWEAVE_WALLET_KEY` is unset. **"Arweave unwired" is false** — it's unconfigured, not unwired. | **KEEP** |
| Ambient mixer | Noise generators work (Web Audio); nature-sound rows are intentionally disabled placeholders. | **KEEP** |
| Kick connect | Full OAuth+PKCE (`/api/auth/kick/*`), gated on unset `KICK_CLIENT_ID`. | **KEEP** |
| Festival photos | **Never built** — only static "Photos coming soon" text on an otherwise-functional, nav-unlinked `/festivals` page. Nothing to remove. | flag: confirm /festivals soft-launch before any delete |
| `CountdownTimer` | Orphaned in `src/` but **reserved for the ZAOstock spinout migration**. | leave for graduation |

Recommendation: set the env vars to activate Mint/Kick when ready; do **not** delete.
Only genuinely-absent thing is festival photo upload.

## Task 3 — Dead infra (needs human; one false positive found)

Cannot execute from here (no Vercel/Supabase credentials; network egress is GitHub-only).
Verification done against Doc 836:
- **Supabase**: the 2 INACTIVE projects (`zaalp99…Project`, `supabase-chestnut-pebble`)
  are well-documented and deletable — pending a dashboard check that they hold no
  needed data.
- **Vercel**: the "54" is **not literally enumerable** from the repo (12 `nexusv-*`
  names are elided; prose uses `(xN)` shorthand). **False positive:**
  `zao-leaderboard.vercel.app` is on the kill-list yet is **still live-embedded** in
  `src/app/(auth)/ecosystem/page.tsx:94` (`embeddable: true`). Deleting it breaks the
  /ecosystem Leaderboard card. **Repoint that embed to the internal `/zao-leaderboard`
  route before deleting.** Also note: `zao-stock` (hyphenated dead dupe) must not be
  confused with the live `zaostock`.
- Re-run `scripts/estate-audit/audit.sh` with fresh read-only tokens for the
  authoritative current list rather than acting on the 2026-06-10 snapshot.

**→ Affects Nexus:** before any deletion, re-check none of the survivors are still
linked from the public directory; the `zao-leaderboard` embed is the live counter-example.

## Task 4 — Data-feed URL validation (blocked in this environment)

Cannot run here: (1) the files live in repos **outside this session's scope**
(`ZAODEVZ/zabalgames/data/*.json`, `bettercallzaal/bettercallzaal-coding-hub/projects.json`)
— confirmed access-denied; (2) network egress is **GitHub-only**, so no live 200-checks
on `lu.ma`, `zabalgamez.com`, etc. Hand off to a human/CI runner with network. Method:
GET each URL, drop/fix non-200s, confirm `workshop-leads` `luma_url` values resolve, and
**flag aspirational URLs (e.g. `zabalgamez.com/recordings/*`) so the Nexus does not
publish them as live.** (Confirmed those patterns are not referenced inside ZAOOS.)

## Anything that affects the public Nexus directory
- **Task 7** gives Nexus a real ingestion target (`data/members.json` + schema) — run the
  generator to populate.
- **Task 3** — do not delete `zao-leaderboard.vercel.app` while it is embedded; re-check
  pruned survivors are not still referenced by Nexus.
- **Task 4** — the harvested feeds still need a live-URL pass before they are trusted as
  the public source.
