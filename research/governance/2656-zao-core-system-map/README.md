---
topic: governance
type: decision
status: research-complete
last-validated: 2026-10-10
related-docs: "059, 075, 102, 115, 696, 1068, 1069, 1072, 1142, 1772, 942, 2558, 2562, 2642"
original-query: "zao-core lane job 1 (brief written 2026-10-10 16:45Z on Zaal's words, vault decisions item 67): a one-page map of how the five pieces (fractal v3, papers, Respect, Hats, zingfisher) fit together, what exists, what is specced, what is missing, cite file:line and doc numbers, before building anything. Zaal, verbatim: i do want to have a terminal focus on the ZAO, maybe the zoe can do this i ened to work on zao fractal v3 and the zao papers and the governace token thats illiquid that brings the whole zao togething include the hats protocol and charmverse type integration though zingfisher repo"
tier: STANDARD
lane: zao-core
---

# 2656 - The ZAO as one system: fractal v3, papers, Respect, Hats, zingfisher

> **Goal:** One page Zaal reads first. How the five pieces he named fit as one system, what exists, what is specced, what is missing, and the five places where the record contradicts itself. Every fact carries a path or a measurement taken on 2026-10-10. Nothing here is built; this is the map before the build.

## Key Decisions

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | "Fractal v3" already has a name and a spec: **Season 3, ZIP-2** in `bettercallzaal/zao-papers` | **USE ZIP-2 as the v3 spec. Do not start a second one.** Job 2 of this lane becomes "amend ZIP-2 against the bot as run", not "write v3" | `zips/zip-0002-season-3.md` (436 lines, status Draft, last-updated 2026-09-26) carries the three membership layers, the manifesto Hat, 90-day activation, the `IRespect` wrapper and six open items. Open PR zao-papers #14 (draft, head 31cdc88d) renames it to `zip-0000-season-3.md` and makes ZIP-2 "the ZIP system" on Zaal's 2026-10-08 ruling. One spec, in flight, with a renumber pending |
| 2 | **Which ledger is vote weight is unruled, and it is the hinge of the whole system** | **ASK ZAAL FIRST, before any Hats, wrapper or zingfisher proposal code.** A, B or C below | OREC reads OG only, and OG is frozen since 2025-12-20 (doc 2562 KD1, ZIP-2 Open Item 5). The platform ruling says OG + ZOR 1:1 (grill 2026-09-22 morning item 1). Snapshot counts OG + ZOR (doc 2642). The 09-26 grill left "exact vote-weight formula" open. Three surfaces, two formulas, no ruling |
| 3 | The zingfisher gate's "1:1 sum" is **wrong by 10^18** | **FIX before the proposal flow lands.** OG is an 18-decimal ERC-20; `respectGate.ts` sums raw OG wei with ZOR integers | MEASURED: `decimals()` on `0x34cE...6957` returns 18. Zaal's wallet reads OG `3094000000000000000000` and ZOR `858` through the deployed `/api/zao/membership`. `computeGovernanceWeightFromResults` (`packages/lib/src/zao/respectGate.ts:151-168`) adds them raw. ZAO OS does it right (`src/lib/respect/voteWeight.ts:14-15`, `formatEther` on OG) |
| 4 | Hats tree 226 is an org chart today and the membership substrate tomorrow | **KEEP the 09-22 ruling (org chart, no platform powers) for zingfisher until Season 3 ships the Manifesto Hat.** Then membership = wearing it | Grill 2026-09-22 afternoon item 18 rules org chart only. ZIP-2 sections 1 and 5 make the Manifesto Hat the membership credential and Hats the achievements layer. Both hold, in sequence. zingfisher reads `hatsTreeId: 226` from config and uses it nowhere (`packages/config/src/zao.ts:55`; zero call sites) |
| 5 | The papers are three documents in three states | **Whitepaper: amend in place. Manifesto: capture session (gates Season 3). Technical whitepaper: does not exist anywhere measured; drop it from the ICM box or write it** | Whitepaper v0.1, 12 chapter drafts in `ZAODEVZ/ZAOfractal/whitepaper/draft/ch00..ch11`, rendered at zaofractal.vercel.app (200), hub at thezao.xyz/papers (200). Manifesto: "does not exist yet", ZIP-2 Open Item 1. Technical whitepaper: not in `zao-website/lib/papers.ts` (one export, `WHITEPAPER`), not in zao-papers `papers/`, not in ZAOfractal. UNKNOWN location; the ICM box names it |
| 6 | ZIP approval should reuse Snapshot, not a new zingfisher vote, until the ledger is ruled | **ADOPT doc 2642's recommendation.** zingfisher's proposal flow (job 5) is drafting, discussion and the advisory record; the holder vote is Snapshot `zaal.eth`; execution is OREC | Doc 2642 inventoried four voting systems already built. Snapshot already weighs OG + ZOR, costs nothing, 16 proposals 2024-07 to 2025-12. The 09-22 ruling made the platform vote advisory anyway (item 7). zingfisher is absent from 2642's inventory and is a fifth surface; this doc adds it |

## The map

```
                         THE ZAO (impact network; ICM box: profit margin, data, IP rights back to artists)
                                                   |
        PAPERS say what it is            RESPECT says who counts            HATS say who holds what role
  zao-papers (ZIPs, MkDocs, Pages)    OG ERC-20 (frozen 2025-12-20)        tree 226, Optimism
  ZAOfractal/whitepaper (v0.1)        ZOR ERC-1155 (weekly, period 114)    17 project hats, manual eligibility
  manifesto: NOT WRITTEN              OREC reads OG only                   Manifesto Hat: SPECCED (ZIP-2)
             |                                   |                                     |
             +------------------- FRACTAL v3 = SEASON 3 (ZIP-2) ------------------------+
                      the weekly game (zao-fractal-bot, v2, Discord) mints ZOR via OREC;
                      Season 3 adds: manifesto mint, 3 membership layers, 90-day activation,
                      IRespect wrapper OREC reads, Hats achievements. Start 1 Dec 2026.
                                                   |
                                   ZINGFISHER (CharmVerse fork, AGPL-3.0)
                      the member's screen: join -> ZID -> member page (4 panels) -> proposals
                      reads Respect live from chain; Hats unused; proposals NOT BUILT
```

### What exists, what is specced, what is missing

| Piece | EXISTS (measured 2026-10-10) | SPECCED, not built | MISSING |
|---|---|---|---|
| **Fractal v3 / Season 3** | Weekly game live: ZOR minted every week, onchain `periodNumber` 114 at 2026-09-24 (ZIP-2 OI5). Bot v2 `bettercallzaal/zao-fractal-bot` (MIT, discord.js, viem, Supabase; migrations `supabase/migrations/0001..0007`; `web/app/(public)|(member)|(admin)` dashboard). PRs #29, #30, #34 merged | ZIP-2: provisional / full / active layers, Manifesto Hat, rolling 90-day activation (grill 09-26 midday r2), `IRespect` wrapper installed by one `setRespectContract` proposal, achievements via Hats, revocation by vote only, emergency council. Start 1 Dec 2026 (09-26 afternoon r4) | Manifesto text (OI1). External Solidity reviewer: Tadas (ORDAO) and Eden Fractal named, ask drafted, NOT SENT (09-26 midday r1). Ledger ruling (OI5). 21-week session hole, newest session row 2026-04-14, `respect_points` zero on 771 of 801 rows (09-26 afternoon r5, doc 2562 KD4). fractal.thezao.com: no DNS record (dig, 2026-10-10) |
| **Papers** | zao-papers: `zips/zip-0001-the-zao-framework.md` (390 lines, Draft, 2026-07-15), `zips/zip-0002-season-3.md`, `PROCESS.md`, `papers/` (Sparkz, WaveWarZ, COC Concertz, ZABAL Games, ai-policy-v1), `members/` (5 profiles). GitHub Pages 200. Whitepaper v0.1: 12 chapter drafts, `ZAODEVZ/ZAOfractal/whitepaper/draft/`, live at zaofractal.vercel.app/whitepaper (200); hub `zao-website/lib/papers.ts` (last touched 2026-07-23). ZAOfractal #20, #21 merged: 2 percent weekly decay marked RULED OUT (no-burn, 09-26 afternoon r6) | PR zao-papers #14 (draft): ZIP-2 becomes "the ZIP system", Season 3 moves to `zip-0000`. Zaal writes one ZIP per project himself (10-08 item 3). ZIP approval = holder vote, mechanism pending (10-08 item 5; doc 2642 recommends Snapshot). papers.thezao.com CNAME ruled (09-21 morning-7) | Manifesto. Technical whitepaper (named in ICM box; found nowhere). papers.thezao.com: no DNS record. Whitepaper is v0.1 Draft, ch04 still carries the ruled-out decay with an annotation, not a rewrite |
| **Respect** | OG `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` (ERC-20, 18 decimals, soulbound). ZOR `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (ERC-1155 id 0). OREC `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`, 72 h vote + 72 h veto. ICM box 2026-07-05: 156 holders (122 OG, 55 ZOR, 21 both), OG Gini 0.73. Doc 2642: Snapshot space `zaal.eth`, 16 proposals, strategies OG + ZOR | OG becomes the one-time achievements ledger (intro, socials, voted, ZAO 101, video) minted through OREC as custom transactions (09-26 afternoon r1). Respect splits by org: ZAO Fractal Respect (governance), ZAO Festivals Respect, WaveWarZ Respect later (r2; zao.config.ts tenants). OG gap sized: 41 ZOR-only wallets, 7,476 ZOR (spec Q10). Past OG repaired from Discord and session logs first (r5) | **The vote-weight ruling.** The OG gap mint (platform's first proposal, 09-22 item 18). Festivals ledger contract or table (onboarding spec Q1). OREC single-relayer: last 12 mints from one address (ZIP-2 security) |
| **Hats** | Tree 226 on Optimism, top hat `0x000000e2...`, Configurator 2/5, Governance Council Members 3/5, 17 project hats, manual eligibility, mutable (doc 059 lines 65-82). Leaf hats with sign-an-agreement eligibility live (ZIP-2 section 5). ZAO OS reads it: `src/lib/hats/constants.ts:12` `TREE_ID = 226` | Manifesto Hat (soulbound, immutable, `claimHatFor` gasless, OREC as eligibility party for revocation). Prune: ZAO 101 into ZAO Fractal, ZAO Cards into Festivals, Student LOANZ dormant, Location and Community become profile attributes, ZABAL Gamez the one new branch (ZIP-2 section 6) | Any wiring in zingfisher: `hatsTreeId` read, never used. Automation in the top four tree levels (ZIP-2 OI3). "ZAO Fractals" branch name conflict, deferred to Season 4 (OI4) |
| **zingfisher** | `bettercallzaal/zingfisher`, CharmVerse fork via KFMEDIA, AGPL-3.0 (LICENSE file read: dual AGPL-3.0 or commercial; `CHANGES.md` credits both). Branch `feat/join-flow-and-member-page` at ce1f918, 0 open PRs. `/learn` 200, `/join` 200 on zingfisher-webapp.vercel.app; `/member/0` 404 (preview serves the pre-09-22 build: its gate JSON still lists $ZABAL). Code: `packages/lib/src/zao/respectGate.ts` (241 lines, OG + ZOR gates lines 90-108), `zid.ts` (357), `pages/join.tsx` (320), `components/zao/MemberProfileView.tsx` (583; panels at lines 237, 375, 467, 530), `pages/api/zao/zid.ts` (200), 4 spec files. CharmVerse proposals module present: `apps/webapp/components/proposals/`, Prisma `Proposal`, `ProposalWorkflow`, `ProposalEvaluation` (types feedback, vote, rubric, pass_fail, sign_documents), `TokenGate` | Governance spec `zao-vault/projects/zao-governance-and-proposal-platform-spec-2026-09-22.md` with 10 rulings: OG + ZOR 1:1, any Respect drafts, 1,000 peer Respect publishes, snapshot at open, 72 h + 72 h, advisory, Hats org chart only, /zao alerts, zero-Respect read and comment. Onboarding spec: 7 open questions. Order: join and member page first, proposals after (09-22 item 19) | Proposal flow: zero code. Persistence: ZID profiles live in an in-memory `Map` (`zid.ts:233`), lost on restart; the full app needs Postgres (Zaal's spend decision). The units bug (KD3). ZID 0 vs 1 (below). Retired name `magnetiq.io` still in `packages/config/src/zao.ts:78` and `zao.config.ts`. The merged home's name (open since 09-22) | [CLAIM-OK: magnetiq-live this line names the retired string only to order its removal from zingfisher config]

### How a member moves through it (the flow the five pieces make)

1. **Join** at zingfisher `/join`: sign in, declare goals (item 30), name a voucher (item 29), get a ZID on the spot (item 12). Season 3 adds the manifesto mint as the join signature; the two are the same door and must not become two.
2. **Earn** in the fractal: weekly circle, Fibonacci 110 / 68 / 42 / 26 / 16 / 10, bot submits to OREC, OREC mints ZOR. One-time achievements become OG (09-26 r1). Festivals and incubated projects earn in their own ledgers (r2).
3. **Hold a role**: a hat in tree 226. Today manual; Season 3 makes achievements and the Manifesto Hat automatic.
4. **See it**: the member page's four panels read chain live (OG, ZOR, weight; standing and voucher; fractal history; proposals footprint).
5. **Decide**: draft in zingfisher (any Respect), publish at 1,000 peer Respect, discuss, advisory vote 72 h + 72 h veto; a ZIP that needs holder approval goes to Snapshot (doc 2642); anything on-chain goes to OREC by hand. The papers record what passed (ZIP status Accepted).

## Contradictions found (each one is Zaal's or a fix, never a guess)

| # | Surface A says | Surface B says | Resolve how |
|---|---|---|---|
| C1 | OREC vote weight = OG only, frozen (doc 2562 KD1, measured `respectContract()`) | Platform = OG + ZOR 1:1 (09-22 item 1); Snapshot = OG + ZOR (doc 2642) | **Zaal rules** (Next Actions row 1). Until then every surface must print which ledger it read |
| C2 | Zaal is **ZID 1** (grill 09-22 afternoon item 19, "humans count from one") | `zao.config.ts` header, `packages/lib/src/zao/zid.ts:14` and `pages/api/zao/zid.ts:79` hardcode **ZID 0** for Zaal, "ZID-000" | Code follows the ruling: PR to zingfisher, S |
| C3 | Platform snapshots weight at proposal open (09-22 item 3) | OREC reads live per voter at cast time (ZIP-2 section 3, measured from `Orec.sol`) | Not a conflict, a ruled divergence. Spec must say so in words on the proposal page |
| C4 | Season 3 starts **1 December 2026** (ZIP-2, 09-26 afternoon r4) | `handoffs/season3.md`, BLACKBOARD row 91 and the 1 November public announcement say **1 November** | Vault text is stale; the announcement of the move is Zaal's to send (r4). Lane updates its own brief only |
| C5 | OG + ZOR "1:1 unweighted sum" (ruling) | `respectGate.ts:151-168` sums wei and integers: Zaal reads as 3.094e21 + 858 | Bug. Fix with `formatUnits(og, 18)` before summing; add a spec that pins Zaal's wallet to 3,094 + 858 = 3,952 |
| C6 | Retired 2026-07-31: Magnetiq never referenced | `packages/config/src/zao.ts:78` `portalUrl: "https://magnetiq.io"`, mirrored in `zao.config.ts` and `research/002` | Remove in the same zingfisher PR as C2 and C5 | [CLAIM-OK: magnetiq-live this line names the retired string only to order its removal from zingfisher config]

Also noted, not contradictions: the ICM box says "~100+ unbroken weeks"; onchain `periodNumber` 114 at 2026-09-24 supports it. The brief's "thezao.xyz/papers redirects" is a 307 to `www.thezao.xyz/papers`, which returns 200: the hub works. ZIP-2 counts five code-level meanings of "member"; zingfisher adds two more (`isZaoMember`, any OG or ZOR > 0, and the in-memory ZID profile). Season 3's three layers are the fix and zingfisher should adopt them rather than add an eighth.

## What this lane does next, in order (the brief's jobs 2 to 5, re-sequenced by what the map found)

1. **Vote-weight ruling** to Zaal through the Grill lane, one question, A/B/C: (A, recommended) OREC repointed to a wrapper summing OG + ZOR so chain, Snapshot and platform agree; (B) ZOR only, OG retired to achievements as 09-26 r1 implies; (C) keep OG only. Everything in jobs 4 and 5 waits on this; jobs 2 and 3 do not.
2. **Job 2, fractal v3**: an amendment PR to ZIP-2 (after #14 lands, on `zip-0000-season-3.md`) reconciling it with the bot as run: v2 bot features, migration 0007, the 1 December date, the achievements-ledger ruling, and a "what v3 changes against v2" table. No bot deploy.
3. **Job 3, papers**: PR to `zao-website` fixing `lib/papers.ts` against the ICM box (impact network, three returns, Respect facts) and a PR to `ZAOfractal` for ch04 (decay rewritten, not annotated) and ch06 (OREC reads OG; wrapper roadmap). Publication is Zaal's tap. Flag "technical whitepaper" as unlocated.
4. **Job 4, Respect design note**: after the ruling; one doc, how Respect gates zingfisher, which hat grants what, how a fractal result becomes a record on the member page.
5. **Job 5, zingfisher**: one hygiene PR first (C2, C5, C6, plus a `governanceWeightReadFrom` label), flag-gated; then the proposal-flow spec from 09-21 item 9 mapped onto CharmVerse's `ProposalWorkflow` and `ProposalEvaluation` with a `vote` step weighted by the gate; then code, flag-gated, PR-only. Postgres is Zaal's spend decision and blocks nothing until the proposal step needs persistence.

## Also See

- [Doc 2642](../2642-zao-holder-approval-systems-inventory/) - four voting systems already built; Snapshot recommended for ZIP approval
- [Doc 2562](../2562-zao-fractal-state-and-build-plan/) - fractal state 2026-09-26, the OG-frozen finding, ranked Season 3 build list
- [Doc 2558](../2558-dao-periodic-reactivation-precedent/) - 90-day activation precedent behind ZIP-2 section 3
- [Doc 1069](../1069-fractal-discord-bot-voting-mechanism/) - how the bot votes today (v2 ground truth)
- [Doc 1068](../1068-zao-fractal-frontend-build-spec/) and [Doc 1072](../1072-fractal-own-frontend-tech-path/) - own frontend and ornode replacement
- [Doc 1142](../1142-fractal-error-recovery-framework/) - failure and recovery design feeding the whitepaper
- [Doc 059](../059-hats-tree-integration/) and [Doc 075](../075-hats-protocol-v2-updates/) - tree 226 state and Hats modules
- [Doc 696](../696-respect-fractal-lineage-summary/), [Doc 1772](../1772-eden-fractal-lineage/), [Doc 102](../102-fractals-frapps-ordao-page/), [Doc 115](../115-zao-data-reconciliation/), [Doc 942](../942-zao-fractal-whitepaper-outline-v2/)
- zao-vault: `projects/zao-governance-and-proposal-platform-spec-2026-09-22.md`, `projects/zao-onboarding-and-og-gap-spec-2026-09-22.md`, `projects/zao-membership-brainstorm-2026-09-11.md`, `handoffs/season3.md`, `decisions/grill-2026-09-22-seat-morning.md`, `decisions/grill-2026-09-26-zao-papers-afternoon.md`, `decisions/grill-2026-10-08-grill-morning.md`
- zingfisher: `research/006-project-status.md`, `zao.config.ts`, `CHANGES.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Rule the vote-weight ledger (A wrapper OG + ZOR, B ZOR only, C OG only); shipped when a decisions file carries his words | @Zaal, asked by zao-core via the Grill lane | Grill, one question | 2026-10-14 |
| zingfisher hygiene PR: ZID 1 for Zaal, `formatUnits` on OG before summing with a pinned test, remove `magnetiq.io`; shipped when the PR is READY with green vitest on `respectGate.spec.ts` | @zao-core lane | PR to bettercallzaal/zingfisher, flag-free (bug fixes) | 2026-10-12 | [CLAIM-OK: magnetiq-live this line names the retired string only to order its removal from zingfisher config]
| ZIP-2 amendment reconciling Season 3 with the v2 bot and the 09-26 rulings; shipped when a READY PR is open on zao-papers against the post-#14 file name | @zao-core lane | PR to bettercallzaal/zao-papers | 2026-10-17 |
| Papers PR: `lib/papers.ts` facts match the ICM box; ch04 and ch06 rewritten; "technical whitepaper" resolved as written or dropped; shipped when two READY PRs are open | @zao-core lane; publication @Zaal | PRs to zao-website and ZAOfractal | 2026-10-21 |
| Respect design note (how Respect gates zingfisher, Hats roles, fractal records); shipped as a ZAOOS research doc PR | @zao-core lane, after row 1 | PR to ZAOOS research/governance | 2026-10-24 |
| Proposal-flow spec on CharmVerse `ProposalWorkflow` + `ProposalEvaluation`, then flag-gated code; shipped when the spec doc PR is READY, then when the code PR is READY behind `ZAO_PROPOSALS_ENABLED=false` | @zao-core lane, after row 1 | PR to ZAOOS, then PR to zingfisher | 2026-10-31 |
| Postgres for the full zingfisher app (cost); shipped when he says yes or no | @Zaal | Spend decision via Grill | 2026-10-31 |
| Update `handoffs/season3.md` and BLACKBOARD row 91 from 1 November to 1 December; shipped when the vault commit lands | @orchestrator2 seat (vault owner) | Vault commit | 2026-10-12 |

## Sources

Method is stated per source. "curl" means raw bytes read by this session; "gh api" is the GitHub REST API; "file" is a local checkout read with `sed`/`grep`.

- [The ZAO ICM box llm.txt](https://useicm.com/api/objects/icm_ohb0F_XOYDz9Tw_w4yX3PA/llm.txt) - [FULL, curl, 2,039 bytes, HTTP 200, 2026-10-10]
- [zao-papers ZIP-2 Season 3](https://github.com/bettercallzaal/zao-papers/blob/main/zips/zip-0002-season-3.md) - [FULL, gh api contents, 436 lines]
- [zao-papers ZIP-1 The ZAO Framework](https://github.com/bettercallzaal/zao-papers/blob/main/zips/zip-0001-the-zao-framework.md) - [FULL, gh api contents, 390 lines]
- [zao-papers PROCESS.md](https://github.com/bettercallzaal/zao-papers/blob/main/PROCESS.md) and [README.md](https://github.com/bettercallzaal/zao-papers/blob/main/README.md) - [FULL, gh api contents]
- [zao-papers PR #14](https://github.com/bettercallzaal/zao-papers/pull/14) - [FULL, gh api pulls, body and files; draft, head 31cdc88d]
- [ZAO Papers on GitHub Pages](https://bettercallzaal.github.io/zao-papers/) - [FULL, curl HEAD, HTTP 200]
- [ZAOfractal whitepaper drafts](https://github.com/ZAODEVZ/ZAOfractal/tree/main/whitepaper/draft) - [PARTIAL, gh api contents listing only; chapter text not read this session, it is job 3's input]
- [Whitepaper live render](https://zaofractal.vercel.app/whitepaper/zao-fractal-whitepaper) - [FULL, curl, HTTP 200]
- [thezao.xyz/papers](https://www.thezao.xyz/papers) - [FULL, curl, 307 to www then 200]; `zao-website/lib/papers.ts` [FULL, file]
- OG Respect `decimals()` on Optimism via `optimism.publicnode.com` eth_call `0x313ce567` - [FULL, JSON-RPC, result 18]
- [zingfisher deployed gate for Zaal's wallet](https://zingfisher-webapp.vercel.app/api/zao/membership?address=0x7234c36a71ec237c2ae7698e8916e0735001e9af) - [FULL, curl, HTTP 200, OG 3094000000000000000000, ZOR 858]
- zingfisher checkout `~/Documents/zingfisher` at ce1f918: `packages/lib/src/zao/respectGate.ts`, `zid.ts`, `pages/api/zao/zid.ts`, `pages/join.tsx`, `components/zao/MemberProfileView.tsx`, `packages/config/src/zao.ts`, `zao.config.ts`, `LICENSE`, `CHANGES.md`, `node_modules/@charmverse/core/src/prisma/schema.prisma` (194 models) - [FULL, file]
- ZAO OS V1 checkout: `src/lib/hats/constants.ts`, `src/app/api/proposals/vote/route.ts`, `src/lib/respect/voteWeight.ts` - [FULL, file]
- zao-fractal-bot checkout at bdfa6fa: `README.md`, `LICENSE` (MIT), `supabase/migrations/`, `web/app/` - [FULL, file]
- ZAOOS research docs 059, 075, 102, 103, 104, 1068, 1069, 1072, 1142, 696, 500, 115, 942, 2558, 2562, 2642, 1772 - [FULL for Goal and Key Decisions sections, file; every number resolved with `zao-research-health --resolve`, ambiguous ones cited by topic path]
- zao-vault decisions `grill-2026-09-21-seat-evening.md` item 9, `grill-2026-09-22-seat-morning.md` items 1-32, `grill-2026-09-22-seat-afternoon.md` items 2, 18-20, `grill-2026-09-26-zao-papers-midday.md` and `-afternoon.md`, `grill-2026-10-08-grill-morning.md` items 3 and 5 (read from `origin/main`; the local clone was 960 commits behind) - [FULL, file and `git show`]
- zao-vault `handoffs/season3.md`, `handoffs/thezao.md`, `handoffs/fractaldata.md`, `handoffs/status/zaofractal.md`, `projects/zao-governance-and-proposal-platform-spec-2026-09-22.md`, `projects/zao-onboarding-and-og-gap-spec-2026-09-22.md` - [FULL for the sections cited, file]
- Upstream licences read from LICENSE files, not the API field: [charmverse/app.charmverse.io](https://github.com/charmverse/app.charmverse.io/blob/main/LICENSE) dual AGPL-3.0 or commercial, trademark clause; [KingfishersMediaLLC/kfmedia-learning-center](https://github.com/KingfishersMediaLLC/kfmedia-learning-center/blob/main/LICENSE) same text; [Hats-Protocol/hats-protocol](https://github.com/Hats-Protocol/hats-protocol/blob/main/LICENSE) AGPL-3.0; [sim31/ordao](https://github.com/sim31/ordao/blob/master/LICENSE) GPL-3.0 - [FULL, gh api contents, first lines]. Snapshots taken with `zao-research-snapshot` (charmverse 65 stars, last activity 2025-10-18; hats-protocol 98 stars, last activity 2024-07-23; ordao 3 stars, 17 open issues, last activity 2026-04-02)
- Community: [sim31/ordao issue #27, denial of Respect distribution through ERC-7702](https://github.com/sim31/ordao/issues/27) and [issue #20, proposal spam from accounts without Respect](https://github.com/sim31/ordao/issues/20) - [FULL, gh api issues]. [Hacker News, "First Results from the Fractal Governance Experiments"](https://news.ycombinator.com/item?id=31463993) - [FULL, Algolia API; 1 point, 0 comments, 2022: fractal governance has no HN community to speak of, which is itself the finding]
- NOT FOUND after search: a "technical whitepaper" in zao-website, zao-papers, ZAOfractal, or the ZAOOS index (`zao-research-index "whitepaper manifesto"`). Not searched: Zaal's Google Drive and Notion.
