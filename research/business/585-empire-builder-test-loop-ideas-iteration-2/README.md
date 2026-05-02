---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-02
related-docs: 361, 582, 583, 584
tier: STANDARD
---

# 585 - Empire Builder x ZAO OS: Test-Loop Findings + Iteration-2 Idea Surface

> **Goal:** Capture what we learned by actually running the integration shipped in PR #412 against the live V3 API, list the bugs the live data revealed (now hot-fixed in PR #429), and use those findings to ideate a refined iteration-2 surface for the next 5-10 PRs.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Live test pipeline | KEEP. Repeating the tsx smoke script on every Empire Builder client change catches schema drift in seconds. Document as `scripts/empire-builder-smoke.ts` in a future PR. |
| Schema strictness | RELAX further. V3 docs and live API disagree on field names + nullability. Default to `.passthrough()` everywhere + nullable on optional string fields. |
| Empire-level vs summary-level totals | USE empire-level `total_distributed` / `total_burned` as canonical lifetime. The summary endpoint is a stale "recent 3" view, not lifetime. Hot-fixed in PR #429. |
| Iteration-2 priority | SHIP idea-A (cross-product slot dashboard) + idea-B (Voting Miniapp surface) first. Both unlock real ZABAL leaderboard slots already configured by Adrian + Zaal. Higher leverage than chasing Phase 3 write API. |
| Network-effect boosters | DRAFT a one-pager from the doc 584 Decision-#4 list (CLANKER, GLANKER, ARTBABY, BB, PUSH at 3-5x) as a Telegram-ready proposal Zaal can send Adrian. |
| /zabal channel chat embed | DEFER. Cobuild already does Farcaster-interaction-to-token-tip. Build EmpirePanel deep first; consider chat embed only after Phase 2 ships. |

## Test Loop - What We Did

1. Built MVP in PR #412 (client + 3 routes + EmpirePanel + Sidebar wire + EcosystemHero).
2. Doc 584 pulled live V3 data; found the empire address constant was wrong.
3. Patched config + types in commit `fee2ee1b` (PR #429 commit 1).
4. Ran a tsx smoke script (`/tmp/eb-smoke.mjs`, deleted after run) directly invoking `getZabalSnapshot()`, `discoverLeaderboards()`, `getEmpire()`. This hit the live V3 API end-to-end.
5. Caught 3 schema/parse bugs (see below). Patched in commit `8aa31c1f` (PR #429 commit 2).
6. Re-ran smoke. Live ZABAL state now correctly reported: $221 lifetime distributed, 178M burned, 7 slots, top-3 holders ticweb3 / ohnahji / diviflyy.
7. Curl smoke on the 3 server routes via the dev server: all return `401 unauthorized` cleanly when not logged in. Routes mounted, session check works, JSON shape correct.

## Bugs Found by Live Test

| # | Symptom | Root cause | Fix (in PR #429 commit 2) |
|---|---------|-----------|---------------------------|
| 1 | `discoverLeaderboards()` threw Zod validation error | Live API returns `leaderboard_type: null` for 4 of ZABAL's 7 slots; our schema declared the field optional but not nullable | `leaderboardSlotSchema` fields all `.nullable().optional()` |
| 2 | `lifetimeDistributedUsd: 0` despite real distributions on chain | API returns amount strings like `"$12.6"` (with dollar prefix); `Number("$12.6")` is `NaN` | `toNumber` strips non-numeric prefix before parsing |
| 3 | `lifetimeBurned: 0` despite 178M ZABAL burned | V3 docs say `burned`, live API returns `burned_rewards` (different field name) | Schema accepts both; client reads `summary.burned_rewards ?? summary.burned ?? []` |
| 4 | Lifetime totals were wrong even after #3 | Summary endpoint returns only the 3 most recent rewards of each kind; not lifetime | Prefer `empire.total_distributed` / `empire.total_burned` (canonical lifetime) over summary aggregation |

## Live ZABAL Snapshot (2026-05-02 via our integration)

```
empire: {"name":"ZABAL","rank":4.92,"total_distributed":221,"empire_address":"0xe0faa499d6711870211505bd9ae2105206af1462"}
slots count: 7
  - ZABAL holders / tokenHolders
  - Songjam Season 1 / null
  - ZAO RESPECT 1/5/26 / null
  - Zabal Voting Miniapp / api
  - Songjam Season 2 Ep2 / null
  - Songjam Season 2 Ep1 / null
  - ZABAL (Farcaster Only) / farToken
snapshot.totals: {"lifetimeDistributedUsd":221,"lifetimeBurned":178213603,"distributionCount":3,"burnCount":3}
top3: #1 @ticweb3 $8.26 | #2 @ohnahji $9.54 | #3 @diviflyy $7.41
```

3 specific numbers worth pinning:
- **$221** ZABAL lifetime distributed across all drops (vs top-20 floor $97).
- **178,213,603** ZABAL lifetime burned.
- **7** active leaderboard slots, of which **3** are cross-product (Songjam Season 1, Songjam Season 2 Ep1, Songjam Season 2 Ep2) and **1** is custom (Zabal Voting Miniapp, type `api`).

## Iteration-2 Idea Surface

10 new ideas, ranked by leverage. Each named to be createable as a follow-up GitHub issue.

| Idea | What | Endpoints / Code | Difficulty | Priority |
|------|------|-------------------|------------|----------|
| A. Cross-product slot dashboard | Replace flat slot pills with grouped tabs: "Holders" / "Farcaster Only" / "Songjam (3 seasons)" / "ZAO RESPECT" / "Voting". Each loads on click, caches, deep-links | EmpirePanel rewrite | 5/10 | HIGH |
| B. Zabal Voting Miniapp surface | Build a "Cast a Vote" surface in ZAO OS that submits a vote, then surfaces the user's rank on the `api` leaderboard slot. Real on-chain influence on ZABAL Empire score | New `/api/empire-builder/vote` POST + Voting tab in EmpirePanel | 6/10 | HIGH |
| C. Network-effect booster proposal one-pager | Generate a Telegram-ready proposal Zaal sends Adrian: add CLANKER + GLANKER + ARTBABY + BB + PUSH as ZABAL boosters at 3-5x | Markdown + screenshot | 1/10 | HIGH |
| D. Empire-rank delta tracker | Persist ZABAL's `rank` weekly to Supabase; chart trend; alert when rank drops a step | New cron + chart component | 5/10 | MEDIUM |
| E. Twin-drop scheduler | UI for Zaal to schedule pairs (raffle+weighted) ahead of time. Today: queue + reminder. Future: auto-execute via Phase 3 write API | New `/admin/empire-distributions` page | 5/10 | MEDIUM |
| F. Distribution recipient cast | When a distribution lands, auto-cast "$13.80 raffle dropped to @ticweb3, @ohnahji, @diviflyy + 7 others" in /zabal Farcaster | Refines existing issue #423 | 4/10 | MEDIUM |
| G. Owner badge everywhere | Show "OWNER" badge on Zaal's wallet in hero top-3, leaderboard rows, distribution feed, voting list. Already in EmpirePanel via PR #429; extend | Component prop addition | 2/10 | LOW |
| H. GLANKER ladder for ZAO members | Show each ZAO member their GLANKER rank (Adrian's empire) inside ZAO OS. Encourages them to hold GLANKER. GLANKER held = boost to glonkybot rank = network effect for both Adrian and ZAO | Reuse client lib for a new empire ID | 3/10 | LOW |
| I. Slot type explainer modal | Tooltip on slot pill: "tokenHolders = ranked by your $ZABAL balance. farToken = Farcaster engagement. api = custom-fed leaderboard. nft = NFT holders." | Component | 1/10 | LOW |
| J. ZAO RESPECT slot integration | The ZAO RESPECT 1/5/26 slot points at OG/ZOR respect tokens already running on Optimism (per `src/lib/respect/leaderboard.ts`). Cross-link the EB slot to our existing Respect drawer | UI link + mapping | 3/10 | LOW |

## Three Issues to Open Now (Iteration-2 Trio)

| New issue | Title | Source idea | Linked existing |
|------------|-------|--------------|-----------------|
| EB-16 | Cross-product slot dashboard in EmpirePanel | Idea A | extends #413 (EB-1) |
| EB-17 | Zabal Voting Miniapp - cast a vote surface | Idea B | new |
| EB-18 | Booster proposal one-pager for Adrian (CLANKER + GLANKER + ARTBABY + BB + PUSH at 3-5x) | Idea C | feeds #419 (EB-5) |

(Ideas D-J left as parking-lot follow-ups; create issues only when one becomes the next priority.)

## Sources

External (verified 2026-05-02):
- [Empire Builder API empires/<token>](https://empirebuilder.world/api/empires/0xbb48f19b0494ff7c1fe5dc2032aeee14312f0b07)
- [Empire Builder API leaderboards discovery](https://empirebuilder.world/api/leaderboards?tokenAddress=0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07)
- [Empire Builder API Voting Miniapp leaderboard](https://empirebuilder.world/api/leaderboards/5501171d-cf65-4fc0-8551-691628d6f0cd)
- [Empire Builder API ArtBaby leaderboards](https://empirebuilder.world/api/leaderboards?tokenAddress=0x09f3f0ee2cf938f56bc664ce85152209a7457b07)
- [Empire Builder API glonkybot distributions](https://empirebuilder.world/api/empire-rewards/0x33ac788bc9ccb27e9ec558fb2bde79950a6b9d5b/distribute)

Internal:
- PR #412 (MVP integration)
- PR #429 (hot-fix stack: address rename + nullable schemas + USD parsing + burned_rewards field name + empire-level totals)
- PR #428 (doc 584 deep dive)
- `research/business/582-empire-builder-v3-live-launch/README.md`
- `research/business/583-empire-builder-zao-os-integration-ideas/README.md`
- `research/business/584-empire-builder-farcaster-creator-playbooks/README.md`
- `src/lib/empire-builder/{config,types,client,cache}.ts`
- `src/components/chat/EmpirePanel.tsx`
- `src/lib/respect/leaderboard.ts` (linkable to slot 4 "ZAO RESPECT 1/5/26")

## Also See

- [Doc 584](../584-empire-builder-farcaster-creator-playbooks/) - the live-data deep dive that surfaced the bugs this doc tested for
- [Doc 583](../583-empire-builder-zao-os-integration-ideas/) - iteration-1 idea surface (15 ideas, 4 shipped)
- Issues #413-#427 - iteration-1 build queue

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Open issue EB-16 (cross-product slot dashboard) and link to #413 | @Claude | Issue | Today |
| Open issue EB-17 (Zabal Voting Miniapp surface) | @Claude | Issue | Today |
| Open issue EB-18 (booster proposal one-pager for Adrian) | @Claude | Issue | Today |
| Promote `/tmp/eb-smoke.mjs` to a versioned `scripts/empire-builder-smoke.ts` for repeat use | @Claude (next session) | PR | After PR #412 + #429 land |
| Send the EB-18 proposal to Adrian on Telegram | @Zaal | DM | Before Sunday 2026-05-04 |
| Pull glonkybot's leaderboards + farToken comparison to refine cross-product UX | @Claude (next session) | Research follow-up | Optional |
| Schedule recurring `last30days-skill` poll on @glankerempire X (per doc 584) | @Claude | `/schedule` after merges | After Sunday |

## Staleness Notes

- Tested 2026-05-02. ZABAL distributions and leaderboard scores update continuously; rank metric is dynamic. Re-run smoke weekly.
- All bugs in PR #429 are fixed against the live API as of fetch time. If V3 changes field names again, re-run smoke + extend schemas.
