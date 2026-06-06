---
topic: business
type: strategy
status: research-complete
last-validated: 2026-06-02
related-docs: "696, 702, 703, 124, 695, 743, 601"
original-query: "research more projects in here we can split off into their own repos"
tier: STANDARD (four independent split-readiness sub-agents, one surface each + parent triage of the smaller surfaces)
scope: "monorepo-wide graduation-candidate assessment — Music/ZOUNZ, Spaces/Live, WaveWarZ, Respect/Governance, + triage of Sopha/CRM/Nexus/Portal/Empire-Builder/Directory/Staking"
---

# 797 — Graduation candidates: what can split off into its own repo

> **Goal.** Apply the "Monorepo as Lab" graduation test to every distinct surface in ZAOOS and find what's actually ready to spin out. Graduation = (1) production-ready, (2) shareable publicly, (3) attracts NEW users beyond the 188, (4) self-contained enough to clone with no shared deps — and on graduation the code is **deleted** from ZAOOS with routes redirecting. So **coupling is the real test**, not size or maturity.

## Method
Four independent `general-purpose` sub-agents each assessed one big surface against a fixed schema (inventory → owned DB tables → coupling-out → coupling-in → external integrations → brand/domain → 3-criteria score → effort → verdict), all file:line-cited. The parent (this session) triaged the smaller surfaces directly and reconciled the findings.

## Headline finding

**The big, obvious-looking candidates are the *least* graduation-ready — they're platform infrastructure, not leaf products.** The one surface that cleanly passes is **Respect / Fractals / Governance**, precisely because it's bounded (9 owned tables, near-zero reverse coupling) and sits on an inherently cross-DAO pattern. WaveWarZ turns out to already be external. Music and Spaces fail the self-containment test hard.

## Ranked verdict

| Surface | Verdict | Effort | Why |
|---|---|---|---|
| **Respect / Fractals / Governance** | ✅ **graduate-candidate #1** | **M** (straight cut) / L (multi-tenant product) | Production-proven (100+ weeks live), 9 cleanly-owned tables, near-zero reverse coupling, cross-DAO-reusable pattern. Blockers are *productization*, not architecture. |
| **Music / ZOUNZ** | ⛔ **not-yet** (invert deps first) | L | The audio player is mounted **app-wide** and consumed by 8+ surfaces (chat, home, nav, OS widget, spaces). "Delete on graduation" would break core. |
| **Spaces / Live audio** | ⛔ **not-yet** (pick a product first) | L | Four overlapping experiments in one namespace (Juke + Stream.io + dead 100ms + Livepeer). Hard-coupled to FID auth + token gate → can't onboard new users. No brand. |
| **WaveWarZ** | ↗️ **already external** | S (decommission) | An external company (own domains, GitHub org, DB, contracts; Zaal is co-founder). ZAOOS only has a scraper + iframe embed. Decision = keep partner integration vs. decommission. |

---

## 1. Respect / Fractals / Governance — the one to graduate

**What it is.** A Fractally / Optimism-Fractal "Respect Game" implementation, ZAO-flavored: soulbound respect-token leaderboards (OG ERC-20 `0x34cE…6957`, ZOR ERC-1155 `0x9885…445c` on Optimism), ORDAO/OREC on-chain governance (`0xcB05…Be532` via `ornode2.frapps.xyz` + on-chain fallback), live fractal sessions (Fibonacci respect curve, fed by an external Discord bot), respect-weighted internal proposals with auto-publish to Farcaster/X/Bluesky/Telegram, Snapshot weekly polls (`zaal.eth`), Hats Protocol roles (tree #226), and OpenRank engagement scores.

**Why it passes:**
- **Production-ready: Yes** — live 100+ weeks (doc 703); hardened webhook (timing-safe auth, per-event Zod, fail-closed); unit tests on proposals/snapshot/hats; ORDAO has ornode→contract fallback.
- **Self-contained: Yes** — 9 dedicated tables (`respect_*`, `fractal_*`, `proposal*`); only `users`/`agent_config` shared. **Reverse coupling is minimal**: 3 importers of the generic `openrank` util + one `HatBadge` in chat's ProfileDrawer + a couple of nav links. The home dashboard only *links* to `/fractals`, doesn't embed it.
- **Attracts new users: Partial→Yes** — the fractal model is explicitly cross-DAO (Fractally→Eden→OP Fractal→ZAO). A multi-tenant "respect-game / DAO-governance toolkit" is the compelling new-user story. Config is already templated in `community.config.ts` (lines 102-260, with "deploy your own hat tree / snapshot space" comments).

**Blockers (productization, not architecture):**
1. Contract addresses are hard-coded literals in `lib/respect/leaderboard.ts:5-7` and `lib/ordao/client.ts:9-10` (vs. the config block) — config-ize for multi-tenancy.
2. `zaoos.com` URLs hard-coded in `proposals/route.ts:162,177`; Snapshot space bound to `zaal.eth`.
3. The fractal Discord bot (`fractalbotmarch2026`) is **already an external repo** — needs an explicit home alongside the graduate.
4. Extraction snags: leave a copy of `openrank` (generic Farcaster util, imported by `api/social/*` + a cron) and the `HatBadge` (chat) behind; do **not** take `lib/staking/*` ($ZABAL conviction staking — different surface) or `lib/ens/*` (identity subnames).

**Two graduation paths:** (a) **straight ZAO-instance extraction** — Medium effort, clean cut; (b) **multi-tenant fractal-governance product** other DAOs deploy — larger, but that's where "attracts new users" actually lives. Recommend deciding (a) vs (b) before starting.

## 2. Music / ZOUNZ — not yet; invert the dependency first

Most feature-complete surface in the lab (39 API routes, 66 components, 11 platform player providers, 17 owned tables with recoverable archived migrations). **But it fails self-containment decisively:** the audio player is mounted application-wide (`(auth)/providers.tsx`, `(auth)/layout.tsx`, `spaces/SpacesLayoutClient.tsx`) and consumed by chat song-embeds (`api/chat/send` `extractAndSaveSongs`), the home hero, bottom nav, the OS desktop widget, and spaces listening rooms. Under the delete-on-graduation rule, spinning it out today **breaks core ZAOOS**. Curation is also wired into `respect_members`. No brand/domain; the only public page (`/listen`) is actually a *Juke* page, not music.

**The real graduation work is a refactor, not a move:** extract the player into a standalone app/package with its own identity layer and have ZAOOS consume it via an API/package boundary (invert the current reverse-coupling). That precedes any "ready to share" claim. **Note:** ZOUNZ ≠ the music product — it's a Nouns Builder DAO on Base (governance/auction) that merely shares the name; it would travel with governance if anything.

## 3. Spaces / Live audio — not yet; it's a graveyard-plus-pivot

Not one product but four in one namespace: **Juke** (mature, tested, the go-forward partner path — but Juke owns the audio), a hand-built **Stream.io** X-Spaces clone (~19 components, **zero tests**), the **100ms/FISHBOWLZ** stack (CLAUDE.md says "killed 2026-05-04" but it's still the synced source for the standalone fishbowlz.com — see Incidental Findings §1; do NOT delete), and lightly-used **Livepeer**. 11 owned tables. Hard-coupled to Farcaster-FID auth (`useAuth`/`getSessionData`, ~34 hits) and on-chain ZAO token gating (`tokenGate.ts`) — which **structurally blocks onboarding non-ZAO users** (criterion 3). No brand/domain/bot. Needs 3-4 paid third-party media accounts re-provisioned. If anything graduates, it's a focused **"Juke-powered live audio for communities"** spinout, and only after an auth/onboarding redesign (Large effort, gated on an unmade product decision).

## 4. WaveWarZ — already graduated externally

An external company (founder Ikechi Nwachukwu; Zaal is co-founder/partner) with its own domains (`wavewarz.com` + two Vercel dashboards), GitHub org (CandyToyBox), Supabase backend, and Solana+Base contracts. **ZAOOS only holds a thin downstream layer** — an iframe embed + a scraper pulling its Intelligence dashboard into two ZAO tables (`wavewarz_artists`, `wavewarz_battle_log`) that feed governance/feed/profile. There's no ZAO-owned product here to move. **Decision is integration vs. decommission**, not graduation. Given the active ZABAL Games tie-in and Zaal's partner role, keeping a lightweight, correct partner embed is the saner path.

---

## Triaged out (not candidates) — with reasons
- **Sopha** — an *external* curation product ZAO integrates with (`lib/sopha/client.ts` calls Sopha's API; research doc 124 is "what can ZAO borrow"). Nothing of ours to split.
- **Empire-Builder** — a client+cache wrapper around an external partner API. Integration.
- **CRM / Portal** — internal ops tools (member CRM; link-routing portal). Not new-user-facing.
- **Nexus** — "ZAO Nexus" curated ecosystem links directory (100+ links ported from a V2). Could be a tiny standalone links-site, but it's a static directory — marginal value.
- **Directory** — core community member feature; stays.
- **Staking** ($ZABAL conviction staking on Base) — small, contract-UI; a different surface from the respect game (don't conflate).

## Incidental findings worth a follow-up (not in scope, but surfaced)
1. **FISHBOWLZ — NOT dead code (correction, 2026-06-06).** An earlier read of this surface called the 100ms/FISHBOWLZ stack "dead code to delete." That was wrong. The `/fishbowlz` skill shows FISHBOWLZ is a **live dev-in-ZAOOS → sync-to-`bettercallzaal/fishbowlz` → deploy-to-fishbowlz.com** standalone product: ZAOOS is the *source of truth* and syncs `src/app/fishbowlz/`, `src/app/api/fishbowlz/`, `src/components/{spaces,fishbowlz}/`, `src/lib/fishbowlz/` (shared `fishbowl_*` Supabase tables). Deleting it would break the sync pipeline. **Do NOT delete.** Note the contradiction to resolve: CLAUDE.md lists FISHBOWLZ as "killed 2026-05-04 / decommissioned," while the skill treats it as an active synced standalone — the standalone repo / fishbowlz.com status is unconfirmed (out-of-repo). Per Zaal (2026-06-06): leave it untouched. The 100ms/HMS media stack *within* this surface may still be retired separately, but only after confirming the standalone deploy doesn't depend on it (the skill syncs `components/spaces`).
2. **WaveWarZ bugs — FIXED (2026-06-06).** Response-shape mismatch (`Leaderboard.tsx` + `BattleLog.tsx` parsed `res.json()` as an array but the routes return `{artists}`/`{battles}`) and the stale `nexus/links.ts` `wavewarz.io` URL (→ `www.wavewarz.com`) are corrected.
3. **Doc-vs-reality gap — FIXED (2026-06-06).** CLAUDE.md's Project Map listed a `contracts/` Solidity directory that doesn't exist; corrected to point at the external-deployment references in `community.config.ts` + `src/lib/{respect,ordao,zounz,staking}`.

## Recommended next actions
1. **Pick the Respect/Governance graduation path** (ZAO-instance cut vs. multi-tenant product) — that's the genuine spinout opportunity and a Zaal business decision.
2. If pursued, write a graduation decision doc (analogous to the ZAOstock spinout) and config-ize the hard-coded contract addresses first.
3. ✅ Done (2026-06-06): WaveWarZ bugs fixed, CLAUDE.md `contracts/` reference corrected. FISHBOWLZ left untouched (it's a synced standalone, not dead code — see Incidental Findings §1).
4. Treat Music's "graduation" as a *dependency-inversion refactor* on the backlog, not a near-term spinout.
