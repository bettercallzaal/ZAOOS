---
topic: business
type: strategy
status: research-complete
last-validated: 2026-06-06
related-docs: "799, 797, 701, 654, 630, 794, 644"
original-query: "research zabalgames.com/projects, add a research page, and find ZAO OS projects we can split out as ZABAL Games projects"
tier: STANDARD
scope: "connect the ZABAL Games Path-A 'adopt-a-project' rail (zabalgames.com/projects) to the ZAO OS split candidates from docs 797/799 — every splittable surface is a ready-made adoptable project whose deliverable IS its graduation"
---

# 800 — ZABAL Games adoptable projects from ZAO OS split candidates

> **The insight.** ZABAL Games Path A (doc 701, skill Part 3) hands builders "a curated list of started/in-progress ZAO projects to adopt and run with." The split analysis (797/799) produced exactly that list from the other direction: surfaces ready to leave the monorepo. **A split candidate = an adoptable project**, because the ZABAL Games bar (live URL + open-source repo + 60s demo + `/zabal` cast — doc 701 Part 7) *is* a graduation: extracting a surface into its own MIT repo, deployed and demoed, is both a valid submission and the exact "own repo, own domain, code deleted from ZAOOS" outcome the lab wants. The builder gets a real artifact + Respect; ZAO gets the extraction done by motivated people, with a mentor embedded.

## Access notes (what this doc could and couldn't reach)
- **`zabalgames.com/projects` is bot-blocked (HTTP 403)** to automated fetches; web search surfaced nothing specific. So the live project listing wasn't read directly.
- **The canonical site lives in `github.com/ZAODEVZ/zabalgames`** (per doc 786) — a *separate* repo outside this session's scope (`bettercallzaal/zaoos` only). **This doc cannot add entries to the live `/projects` page directly.** It drafts the entries here in the ZAOOS research library; hand them to the ZAODEVZ repo to publish (see Hand-off below).
- Source of truth used instead: doc 701 (canonical event state) Part 4 adoptable list, the `zabal-games-context` skill Part 3, and docs 797/799.

## Why this is a clean fit
- **The deliverable bar matches the extraction checklist.** Doc 701 Part 7 wants live URL + public MIT/Apache repo + demo + cast. Docs 797/799 want config-injection + a standalone repo + a stable API. Same work.
- **Difficulty is tunable.** The 799 package table already ranks candidates by effort (S/M/L), so projects can be sorted from good-first-issue to mentor-paired-ambitious.
- **It compounds the lab.** Each extracted package gets consumed back by ZAOOS as a versioned dependency (799 "publish-and-consume-back"), so a successful submission immediately reduces ZAOOS coupling debt.

---

## Proposed adoptable projects (drafted from 797/799)

Tiered by builder difficulty. Each is scoped so the ZABAL Games bar = a shippable extraction.

### Tier 1 — Good first projects (solo, ~weekend, effort S)
These are already near-standalone in 799 (zero/near-zero `@/` coupling) — ideal for a single builder.

| Project | What the builder ships | Source | Mentor fit |
|---|---|---|---|
| **`@zao/openrank-client`** | Extract `src/lib/openrank/client.ts` (149 LOC, zero `@/` imports) into a published npm pkg + a tiny demo page that scores any FID. No public OpenRank Farcaster SDK exists — real OSS value. | 799 #1 | Arthur (Neynar) |
| **`@zao/ordao-reader`** | Extract `src/lib/ordao/client.ts` (OREC / Optimism fractal-governance reader, pure viem) — inject contract addresses + RPC as config. Demo: read live proposals/respect balances. | 799 #2 | Vlad (Respect Game) |
| **`is-music-url`** | Publish `src/lib/music/isMusicUrl.ts` (35 LOC, has tests) as a "classify any music URL by platform" micro-package. Ships naturally with the player project below. | 799 #5 | — |

### Tier 2 — Strong solo / pair (effort M)
Real de-coupling work (parameterize branding, inject credentials), high reuse.

| Project | What the builder ships | Source | Mentor fit |
|---|---|---|---|
| **`@zao/social-broadcast`** | Extract `src/lib/publish/**` (1,708 LOC) — "post once to X/Bluesky/Telegram/Discord/Lens/Hive/Threads." Parameterize the ~10 hard-coded ZAO branding strings into injected config; leave `auto-cast.ts` behind. The skill Part 4 explicitly wants a "custom relay (Farcaster + X + Bluesky)" — this is it. | 799 #4 | kmac.eth |
| **`@zao/react-omniplayer`** | Extract the universal audio player (`src/providers/audio/**`, ~1,900 LOC, 43 consumers). Replace 2 hard-coded `/api/music/scrobble` fetches with `onScrobble` callbacks; lift `RadioProvider` out of core. **This is the unlock for graduating Music** (797's blocker). Skill names Sonata (MIT) as the reference. | 799 #6 | CannonJones (media) |
| **`@zao/neynar-kit`** | Extract the `neynar.ts` wrapper (583 LOC, 56 call sites) — 37 Neynar v2 fns + the novel **Hypersnap read-proxy failover** (free reads via self-hosted node, doc 643). Inject `NEYNAR_API_KEY`/read-base. Leave the Supabase-bound auth/gate layer behind. | 799 #6 (runner-up) | Arthur (Neynar) |

### Tier 3 — Ambitious / mentor-paired (effort M–L, August Finals scale)
Product-altitude graduations from 797/799.

| Project | What the builder ships | Source | Mentor fit |
|---|---|---|---|
| **`hermes-pr-bot`** | Spin out the Hermes autonomous coder→critic→auto-PR bot (`bot/src/hermes/` + the Devz two-bot narrator + the `claude-cli` wrapper) as a repo-agnostic OSS tool. Hook: "$0 marginal cost on a Claude Max plan." **Must close the 4 doc-794 HIGH trust issues first** (this hardening is itself a great submission). The skill already points builders at `hermes-orchestrator` as the agent-harness reference. | 799 Altitude A; 794 | (agent-stack) |
| **ZAO Respect / fractal-governance product** | The 797 #1 product spinout — a clean-room "fractal contribution governance" app on the `ordao`/`openrank`/`hats` engine. Aligns with the skill's governance thesis (Vlad, doc 738). | 797 #1 | Vlad |
| **Gated Farcaster community-client template** | Turn ZAOOS itself into a forkable "gated Farcaster miniapp" boilerplate — swap `community.config.ts` (already the templating seam, 43 importers), point at your own Supabase + Neynar. The highest-leverage "split": not extracting *out*, but making the core forkable. | 799 Altitude C | Zaal |

---

## How this extends the doc-701 list
Doc 701 Part 4's candidate adoptable list (8 items, "NEEDS ZAAL CONFIRMATION") is mostly *content/ops* projects (Songjam leaderboard migration, POIDH leaderboard, clip flywheel, a new ZOE skill). The 797/799-derived projects above are *infrastructure extraction* projects — a different, complementary flavor that produces reusable `@zao/*` packages and graduated products. **Recommend merging both into one confirmed Path-A rail**, tagged by type (content / extraction) and difficulty (Tier 1–3).

## Hand-off (since the live site is out of repo scope)
To actually publish these on `zabalgames.com/projects`, the entries need to land in **`ZAODEVZ/zabalgames`** (not reachable from this session). Two options:
1. I generate a ready-to-paste markdown/JSON block in the shape that repo's `/projects` page expects (need to see its current data format), and Zaal commits it there.
2. Grant this session scope on `ZAODEVZ/zabalgames` and I open a PR directly.

## Open items / drift
- Doc 701's adoptable list is still unconfirmed (701 Part 4 + its own Next-Action note). Confirming it is a pre-June-bootcamp Zaal decision — these Tier 1–3 entries are inputs to that.
- The Hermes spinout depends on closing the doc-794 HIGHs (don't ship an "autonomous unattended" OSS tool with the critic's bare-`Bash` gap open).
- Licensing: ZABAL Games requires MIT/Apache (doc 701 Part 7); confirm each extracted package ships under one.

## See also
- `research/business/799-split-candidates-second-pass-packages-agents/` — the package/agent/template altitudes these projects come from.
- `research/business/797-graduation-candidates-monorepo-split/` — the product-graduation first pass.
- `research/events/701-zabal-games-canonical-state/` — the canonical event doc + the existing Part-4 adoptable list.
- `.claude/skills/zabal-games-context/SKILL.md` — Path A/B, the stack, and the submission bar.
