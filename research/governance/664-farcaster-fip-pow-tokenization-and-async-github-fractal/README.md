---
topic: governance
type: decision
status: research-complete
last-validated: 2026-05-20
original-query: "Capture Farcaster FIP #19 (Proof-of-Work Tokenization) + brainstorm async GitHub-native fractal tool using PRs/Discussions/Reactions/Projects as substrate (reconstructed)"
related-docs: 056, 058, 102, 103, 109, 110, 657, 663
tier: DEEP
---

# 664 — Farcaster FIP #19 (Proof-of-Work Tokenization) + Brainstorm: Async GitHub-Native Fractal

> **Goal:** Two things in one doc, per Zaal's prompt. (1) Capture the Farcaster Foundation's Discussion #19 "FIP: Proof of Work Tokenization" + review what's stealable for ZAO's fractal model. (2) Brainstorm an async GitHub-native fractal tool — using PRs / Discussions / Reactions / Projects as the substrate for fractal consensus. Land on: (a) which Farcaster ideas to adopt, (b) where async fractal already exists (Optimystics Respect Games App), (c) the GitHub-native wedge that doesn't exist yet, (d) shipping path.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt Farcaster's "FID-age × social-graph × interaction-diversity" credibility weighting in ZAO Respect math | NO | ZAO already weights Respect by peer ranking in fractal sessions. Adding Farcaster's age-based weight conflicts with the "everyone in the breakout has equal voice" rule of the Respect Game. |
| Steal Farcaster's "retroactive genesis distribution" idea for ZAO Respect re-baseline | YES, partial | ZAO already plans to reconcile pre-ORDAO OG Respect (ERC-20 `0x34cE...6957`) + post-ORDAO ZOR (ERC-1155 `0x9885...445c`) ledgers. Farcaster's "apply the formula to all history at genesis" is the right pattern. Doc this as the reconciliation plan. |
| Steal Farcaster's "EigenTrust seeded on FID ≤ 50K" pattern as "OG-seeded trust" in ZAO | INVESTIGATE | Could seed a ZAO trust graph from early Respect holders. Useful if ZAO needs sybil-resistance for an external-facing fractal experience (e.g., GitHub-native version where any GitHub user can join). |
| Adopt Farcaster's "work markets" mental model (DA / Growth / Application) for ZAO contribution categories | PARTIAL | ZAO already has 5 voting criteria (ZAO Vision / Contribution / Collaboration / Innovation / Onboarding). The Farcaster "split incentives by market" framing is cleaner than 5 overlapping criteria. Consider mapping. |
| Build an async GitHub-native fractal tool | YES, wedge exists | Optimystics's Respect Games App is async (beta) but not GitHub-native. GitHub Discussions + PRs + Reactions are an untapped substrate. Concrete wedge: weekly async cycle, contributions surface as PRs / Issues, ranking happens via a custom GitHub Action + a small web UI, results post to ORDAO. |
| Use Discussion #19 itself as a parable for "share about fractals" content | YES | The FIP discussion shows what async governance debate looks like at scale. A ZAO blog post titled "We've been doing async governance for 90+ weeks. Here's what we learned." can ride the wave of Farcaster's PoW tokenization discussion. |

## Part 1: Farcaster Discussion #19 — Verbatim Capture + Review

**Title:** FIP: Proof of Work Tokenization — Multi-Market Token Emission for Protocol Sustainability
**Author:** CassOnMars (Farcaster maintainer)
**Date:** 2026-03-24
**Category:** Ideas
**URL:** https://github.com/orgs/farcasterorg/discussions/19

### What The FIP Proposes (high-fidelity summary)

Farcaster implements token emission based on **three work markets**:

1. **DA-PoW (Data Availability) — 50% of emission.** Validators sign block hashes within 5-minute response windows. Score factors latency + uptime.
2. **Growth PoW — 20% of emission.** Rewards reciprocal engagement with credible counterparties. Formula: `ln(1 + mutuality) × credibility`. Saturates spam volume.
3. **Application PoW — 30% of emission.** Rewards miniapp developers generating credible user engagement, verified via protocol actions or signed receipts.

### Identity + Credibility Layer

- **FID age** anchored to Optimism transfer events. Effective age resets on custody transfer (prevents inheritance).
- `age_factor = min(1.0, effective_age / 180 days)` — caps at 6 months.
- **EigenTrust** seeded on `fid ≤ 50,000` (the early adopters), propagated through the post-transfer follow graph, normalized by top-100 average.
- 6-tier eligibility filter (F0–F6) gates allocation.
- **Node-FID attestation:** every node signs a bind to exactly one FID. Creates accountability.

### Token Mechanics

- Fixed total supply, halving every 2 years.
- Fees: 60% burned, 40% to proposer.
- Staking for validators, vouchering, and credibility.
- **Retroactive genesis distribution:** one-time computation applying the Growth-market formula to full Farcaster history. Allocated pro-rata, vests linearly over 36 epochs.
- Trustless bridging out to EVM chains via Verkle proofs.

### Notable Discussion Pushback

**arcabotai (FID 2664317, registered Feb 2026):**

> "FID age (time since registration) heavily favors early adopters… Pure age penalizes high-output newer accounts."

Proposes `activity_density = total_messages / effective_age` to complement age, plus on-chain identity verification (ENS, ERC-8004, cross-chain anchors). Also asks whether AI agents count as valid usage.

For Growth market: proposes 90-day delayed vesting with churn-clawback to prevent referral farming.

**Itsdamntrue (Apr 17):** raised concern about influencer allocations + NFT collection carve-outs being weak proxies.

**arcabotai (Apr 18 response):** argued fixed NFT carve-outs are gameable (badges can be bought). Recommends protocol-native criteria over NFT-based criteria for recognizing early Pro users.

### What's Good About It (steal for ZAO)

| Idea | Why it's good | ZAO application |
|---|---|---|
| Custody-transfer resets credibility | Prevents Sybil-via-acquisition + protocol-history-purchase | OG Respect transferability: should custody transfer reset OG Respect age? Already ERC-1155 ZOR is soulbound. |
| EigenTrust seeded on early-FID set | Anti-Sybil without revealing identity | Seed a ZAO trust graph from week 1-12 Respect holders for any external-facing fractal |
| Retroactive genesis distribution | Acknowledges history, doesn't favor first movers permanently | Reconcile pre-ORDAO + post-ORDAO Respect ledgers using one formula |
| Split emission across "work markets" (DA / Growth / App) | Clearer than overlapping criteria; mechanism design | Map ZAO's 5 voting criteria to 3-4 distinct "work markets" with their own emission curves |
| Saturated growth math: `ln(1 + mutuality)` | Diminishing returns on volume, rewards depth | ZAO Respect game's 2x Fibonacci scoring (110, 68, 42, 26, 16, 10) is already diminishing — same intuition |
| Node-FID attestation creates accountability | One human → one node → one signing key | ORDAO + OREC have similar attestation flow; reinforces the precedent |

### What's Flawed About It (don't steal)

| Issue | Why it's a problem | ZAO position |
|---|---|---|
| **6-month age cap** | Penalizes anyone joining > 6 months post-launch, basically forever | ZAO Respect Game gives equal weight per session regardless of join date. Keep that. |
| **Heavy emission to validators (50%)** | Optimizes for infra cost, not contribution | ZAO has no "validator" role; all members are participants. The validator-heavy split would feel wrong for ZAO. |
| **AI agent eligibility unaddressed** | arcabotai's question gets no answer in the thread | ZAO needs to take a position: bot accounts in fractal sessions = allowed/disallowed. Default: human-only. |
| **No async / offline participation** | All work markets reward online participation | The async pattern (next section) is the gap. |
| **Retroactive distribution before community input** | "Genesis" formula is unilateral | ZAO should propose any retro-distribution via Respect-Game vote, not unilaterally. |

## Part 2: The Async Fractal Landscape

### What Already Exists (Optimystics Ecosystem)

| Tool | What | Status | URL |
|---|---|---|---|
| Respect Game | The core social game: peer-rank contributions in 4-6 person breakouts | Live 90+ weeks at ZAO | optimystics.io/respect |
| ORDAO | Optimistic Respect-Based DAO smart contracts | Live, Tadas-built | optimystics.io/ordao |
| frapps (toolkit) | Open-source toolkit for fractal apps on Ethereum | Live | github.com/Optimystics/frapps |
| Fractalgram | Live-event tool for synchronous fractal sessions | Live | optimystics.io/tools |
| **Respect Games App** | **All-in-one async fractal app** | **BETA** | optimystics.io/tools |
| zao.frapps.xyz/submitBreakout | ZAO's specific submission portal | Live 20+ weeks | zao.frapps.xyz |
| Fractal Bot (Discord, ZAO) | 52 commands, 7th iteration, Python | Live | github.com/bettercallzaal/fractalbotapril2026 |

**Key finding:** Optimystics has already built async Respect tooling. The "async fractal" wedge is partly addressed. **But it's not GitHub-native.** GitHub as a substrate is a real, unaddressed gap.

### Why GitHub Is The Right Async Substrate For Developers

| GitHub primitive | Maps to Respect Game concept | Why it fits |
|---|---|---|
| **Repository** | A fractal community (one repo per fractal) | Persistent, public, forkable |
| **Discussion** | A weekly fractal session | Threaded, async, has reactions |
| **Issue** | A contribution claim ("I did X this week") | Has assignees, labels, milestones |
| **Pull Request** | A *verifiable* contribution (code, content, doc) | Auto-linked to commits, reviewable |
| **Reaction (👍 ❤️ 🚀)** | Soft signal of value | Lightweight, no special UI needed |
| **Projects board** | Weekly ranking surface (drag-and-drop) | Order-preserving, visual |
| **GitHub Actions** | The tally + Respect-issuance bot | Triggered by labels / comments / cron |
| **GitHub App** | The ORDAO bridge — pushes results on-chain | Auth via GitHub OAuth + wallet binding |
| **Wiki / README** | The fractal's "constitution" | Versioned governance doc |
| **Forks** | Spinout fractals (the ZAO incubator pattern at fractal scale) | Each spinout inherits the rules |

### Why Async GitHub-Native Fractal Specifically (Beyond Optimystics Async App)

1. **Where developers are.** Developers don't switch tools to participate in governance. Meet them in their PRs.
2. **Native attribution.** Contributions are verifiable as commits / PRs / merged code, not just self-reported claims.
3. **Permanent record.** GitHub never deletes; the audit trail is forever.
4. **Auth-light.** GitHub account = sufficient identity for many cases (still need wallet for on-chain Respect issuance).
5. **Discoverability.** Open-source GitHub repos surface in search, in topic listings, in trending. Discord servers don't.
6. **Composability.** A GitHub-native fractal can be embedded in any open-source community as a governance overlay. ORDAO + Discord = closed to that ecosystem.

## Part 3: The Build — Async GitHub-Native Fractal

### Working Name

**Frapp-GH** (or **Fractal Actions** — a play on GitHub Actions). Tentative.

### MVP Spec (~1 sprint of build time)

**Phase 1 — async ranking only, no on-chain:**

1. **Setup:** Any community creates a repo. Adds the Frapp-GH GitHub App.
2. **Weekly cycle (e.g., Monday 6pm EST anchor, runs all week):**
   - **Monday:** GH Action opens a new "Week N" Discussion auto-generated from a template. Pinned. Has 5-7 contribution criteria (configurable, e.g., ZAO's "Vision / Contribution / Collaboration / Innovation / Onboarding").
   - **Mon-Fri:** Members submit contributions as Issues labeled `week-N-contribution`. Each Issue is one claim ("I shipped X" / "I helped Y" / "I onboarded Z"). PRs link to Issues for verifiability.
   - **Saturday:** Members vote via Projects board ordering — each voter drags labeled Issues into rank order. Project board saves order. GH Action snapshots ordered state at end-of-day.
3. **Sunday:** GH Action tallies (2x Fibonacci scoring: 110, 68, 42, 26, 16, 10 per rank) using a multi-voter aggregation (median-of-medians, or Borda count, or — for the fractal-pure version — randomly group voters into 4-6 person breakouts and aggregate per-breakout).
4. **Sunday evening:** GH Action posts results as a comment on the Week N Discussion. Closes the Discussion. Opens Week N+1.

**Phase 2 — ORDAO bridge:**

5. **On-chain.** Bot pushes per-member Respect amounts to ORDAO contract (using zao.frapps.xyz/submitBreakout pattern). Voters' GitHub usernames bind to wallets via a one-time signed message.

**Phase 3 — multi-community / fork support:**

6. Forking the Frapp-GH-template repo = forking the rules. Sub-DAOs / ZABAL projects can each run their own weekly cycle.
7. ZAO becomes the "showcase" community for the tool — drives adoption upstream into Farcaster Foundation / Ethereum Foundation / any OSS project.

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│ GitHub                                                  │
│                                                         │
│  ┌─────────┐  ┌────────┐  ┌──────┐  ┌──────────────┐  │
│  │Discuss. │  │ Issues │  │ PRs  │  │ Projects     │  │
│  │(Sessions│  │(Claims)│  │(Verif│  │(Rank ordering│  │
│  └─────────┘  └────────┘  └──────┘  └──────────────┘  │
│                       │                                 │
│                       │ webhook events                  │
│              ┌────────▼────────────┐                    │
│              │  Frapp-GH GH App    │                    │
│              │  (TypeScript /      │                    │
│              │   Hono on Vercel)   │                    │
│              └────────┬────────────┘                    │
└───────────────────────┼─────────────────────────────────┘
                        │
        ┌───────────────┼────────────────────────────┐
        │               │                            │
        ▼               ▼                            ▼
  ┌──────────┐  ┌──────────────┐         ┌────────────────┐
  │  Tally   │  │ Public web UI │         │  ORDAO bridge  │
  │  cron    │  │ (read-only:   │         │  (on-chain     │
  │ (GH Act) │  │  history,     │         │   Respect      │
  │          │  │  leaderboard) │         │   issuance)    │
  └──────────┘  └──────────────┘         └────────────────┘
```

### Stack Pick

- **GitHub App** (not OAuth App) — installable per-repo, gets webhooks.
- **Hono on Vercel** — same stack as `zlank-snap-template`. Aligns with ZAO repo patterns.
- **Probot.js** — battle-tested framework for GitHub Apps. Or skip if Hono+native webhooks is simpler.
- **ORDAO interface** — copy `zao.frapps.xyz/submitBreakout` flow (Tadas's contract).
- **TypeScript everywhere.** Tailwind v4 + navy/gold for the web UI per ZAO design system.
- **Repo name:** new bettercallzaal/frapp-gh (or contribute to Optimystics/frapps as a `gh-integration/` subpackage — coordinate with Tadas).

### Identity / Sybil Resistance

| Layer | Mechanism |
|---|---|
| Lightweight | GitHub username only (good enough for any open OSS project) |
| Medium | GitHub + Farcaster SIWF linking (uses the Doc 660 / Juke pattern) |
| Strong | GitHub + Farcaster + on-chain wallet (for ORDAO issuance) |
| OG-trust | Seed list of "founding ranker" GitHub usernames (analog to FID ≤ 50K from FIP #19) |

### Estimated Effort

- Phase 1 MVP (async ranking, no on-chain): ~3-5 days of focused work with Hermes-style AI pair.
- Phase 2 (ORDAO bridge): ~3-5 more days. Depends on Tadas's API surface.
- Phase 3 (multi-community / fork support): ~1 week + good docs.

Total: ~2-3 sprint-weeks for the full thing.

### Why This Could Matter

- **Optimystics has the synchronous tool + the contracts**, but no GitHub-native surface. Frapp-GH fills that exact gap. Tadas would likely welcome it (it brings Respect Game to more communities).
- **ZAO becomes the de-facto reference implementation** for "fractal as code review process." Doubles as a ZAO incubator showcase.
- **Cross-promotion to Farcaster Foundation:** "You're debating tokenization in Discussion #19. Here's a working async governance tool we built that runs on the exact substrate you're using." Direct relevance to CassOnMars's audience.
- **Generalizes well.** The same tool works for any OSS project that wants better governance than "BDFL + maintainers vote." Ethereum EIPs, Farcaster FIPs, any DAO.

## Part 4: Sharing The Value Of Fractals

### Audience Slices

| Audience | What they care about | Frame |
|---|---|---|
| Developers (Farcaster / Eth ecosystem) | Governance that doesn't suck. Tools that respect their attention. | "We turned weekly governance into 30 minutes of async PR-style ranking. Here's the code." |
| Music + artist communities (ZAO's home) | Power for artists. Money for artists. Recognition. | "Earn Respect by what you contribute, not who you know. 90 weeks of evidence." |
| DAO operators | Voter apathy. Plutocracy. Sybil. Quadratic everything. | "Fractal Respect Game solves apathy + plutocracy without quadratic complexity. Async on GitHub now." |
| AI agents / agent builders (per arcabotai's comment thread) | Can AI participate in human governance? | Lean into the question. ZAO can run an "AI agent rank" experiment alongside human rank. |
| Optimystics + Optimism Fractal community | Same neighborhood. Coordination. | Co-author a doc on fractal-native async patterns. Tadas + Dan as collaborators. |

### Content Slate (concrete pieces)

| Piece | Format | Target | Effort |
|---|---|---|---|
| **"90+ weeks of fractal: what we learned"** | Long-form blog post on aroussi-style (~2k words) | Generalist crypto audience | 3-4 hours of writing + Zaal's voice |
| **"Async governance as code review"** | Medium-length post (~1k words) | Developer audience, posted on bettercallzaal/bcz-journal | 2 hours |
| **"Respect Game: explainer for music people"** | Short post + 1 image (~500 words) | The ZAO + ZABAL members | 1 hour |
| **"Frapp-GH demo"** | Video walkthrough of the tool, plus README | Both audiences | 1 day total (build screencast + write README) |
| **"Fractal vs. quadratic vs. tokenized: which solves what?"** | Comparison post | DAO operators | 4 hours, leans on this doc |
| **Newsletter issue** | "Year of the ZABAL" daily, focused on fractals | Existing subscribers | 30 minutes via /newsletter skill |
| **Farcaster cast thread** | 5-cast thread with 1 image per cast | Farcaster crowd | 30 minutes |
| **Co-authored post with Dan/Tadas** | Joint blog on optimystics.io | Optimystics audience | Async coordination, ~1 week |

### The Big Frame

ZAO has been running fractal governance for 90+ weeks. Most people don't know fractal governance is a thing. The "share" play isn't about explaining Respect Game from scratch — it's about **using the unfolding Farcaster #19 debate as a hook** to show ZAO has a working answer.

**Hook:** "Farcaster is debating how to tokenize work. We've been distributing tokens for work every Monday for 90+ weeks. Here's what works."
**Substance:** Doc this 90-week experience + ship Frapp-GH + invite the Farcaster + Eth governance crowd to fork the repo.

## Hard Numbers

- Farcaster Discussion #19 published 2026-03-24 by CassOnMars (Farcaster maintainer).
- 3 work markets in the FIP: DA-PoW (50% of emission), Growth (20%), Application (30%).
- 6-month FID age cap (`age_factor = min(1.0, effective_age / 180 days)`).
- EigenTrust seed: `fid ≤ 50,000`.
- 36-epoch linear vest for retroactive genesis distribution.
- 60% burn / 40% to proposer on fees.
- 90+ weeks of fractal sessions at ZAO since ~August 2024.
- ZAO Respect scoring: 2x Fibonacci (110, 68, 42, 26, 16, 10 per rank).
- 5 voting criteria currently used: ZAO Vision / Contribution / Collaboration / Innovation / Onboarding.
- 7 iterations of the fractal Discord bot at ZAO (current: fractalbotapril2026, 52 commands).
- 2 ZAO Respect contracts: OG Respect ERC-20 `0x34cE...6957` (pre-ORDAO) + ZOR ERC-1155 `0x9885...445c` (post-ORDAO).
- Frapp-GH MVP estimate: ~3-5 days Phase 1 + ~3-5 days Phase 2 + ~1 week Phase 3 = ~2-3 sprint-weeks total.

## Open Questions To Lock Before Building Frapp-GH

1. **Coordinate with Tadas + Dan first.** Frapp-GH IS the GitHub-native extension of frapps. Does Tadas want it as a subpackage of `Optimystics/frapps`, or as a separate bettercallzaal/ repo with attribution? Cleanest is contributing upstream.
2. **Identity binding to GitHub.** ERC-8004 + GitHub OAuth + Farcaster SIWF — pick a tier and stick to it.
3. **AI agent participation.** arcabotai's question is good. ZAO position: bots can SUBMIT issues for verification (PRs are public work), but only humans rank. Confirm or change.
4. **Ranking algorithm:** Borda count vs. median-of-medians vs. random-breakout aggregation. The Respect Game uses small-group consensus — Frapp-GH should preserve that, which means **random breakout** is the right default (don't flatten to a single global rank).
5. **Frequency:** ZAO is weekly. Frapp-GH should be configurable (weekly / bi-weekly / monthly).
6. **Multi-fractal cross-pollination:** can one human be in two fractals' GitHub repos simultaneously? Default: yes.
7. **What's the genesis distribution for Frapp-GH itself?** If ZAO is the reference implementation, do early ZAO Respect holders get retroactive Frapp-GH credit?

## Also See

- [Doc 056](../056-ordao-respect-system/) — ORDAO architecture deep dive
- [Doc 058](../058-respect-deep-dive/) — Respect token mechanics
- [Doc 102](../102-fractals-frapps-ordao-page/) — frapps toolkit on ZAO OS
- [Doc 103](../103-fractal-governance-ecosystem/) — broader ecosystem map
- [Doc 109](../109-optimystics-tooling-ecosystem/) — Optimystics tools survey
- [Doc 110](../110-community-directory-crm/) — member ledger reconciliation
- [Doc 657](../../music/657-plural-events-deliberation-toolkit/) — Plural Events tooling (Polis + dembrane + RadxChange QV); adjacent governance-tool category
- [Doc 663](../../dev-workflows/663-zao-research-meta-audit-2026-05-17/) — meta-audit (in progress); will cross-link when complete
- Memory: `project_fractal_process.md` (the 90-week record)
- Memory: `project_fractal_vision.md` (Zaal's reconciliation goals)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| DM Tadas — share this doc + ask if Frapp-GH lands as `Optimystics/frapps/gh-integration/` subpackage or as a separate ZAO repo | @Zaal | DM | This week |
| DM Dan Singjoy — co-author "async fractal as code review" post on optimystics.io | @Zaal | DM | This week |
| Cast on Farcaster — short thread on the 90+ weeks of fractal + Frapp-GH teaser, tag CassOnMars + Optimystics | @Zaal | Farcaster cast | After Tadas/Dan ack |
| Write blog post: "90+ weeks of fractal: what we learned" (bcz-journal repo) | @Zaal | Long-form post | After 1 cycle of Frapp-GH alpha runs |
| Sprint 1 — Build Frapp-GH Phase 1 (async ranking, no on-chain) | @Zaal + Hermes | Build sprint | Next available 3-5 day window |
| Run a single-cycle alpha at ZAO on Frapp-GH (1 week, parallel to existing Discord bot) | @Zaal + fractal community | Trial | After Phase 1 ships |
| Sprint 2 — ORDAO bridge (Phase 2) | @Zaal + Hermes + Tadas | Build sprint | After alpha validates |
| Decide AI-agent ranking position (arcabotai's question) — write a one-page policy | @Zaal | Decision doc | Pre-Phase 2 |
| Reconcile pre-ORDAO + post-ORDAO Respect ledgers using "retroactive genesis" pattern from FIP #19 | @Zaal | One-shot script | Pre-Phase 2 |
| Add "fractal" topic to the ZAO research library (currently only memory files) — this doc 664 IS the first one in `research/governance/` | @Zaal | Library hygiene | This commit |

## Sources

- [Farcaster Discussion #19 (FIP: Proof of Work Tokenization)](https://github.com/orgs/farcasterorg/discussions/19) — primary source, fetched 2026-05-17
- [Optimystics homepage](https://optimystics.io/) — Respect Game + ORDAO + Fractalgram + Respect Games App ecosystem
- [Optimystics Tools](https://optimystics.io/tools) — async Respect Games App in beta
- [Optimystics ORDAO](https://optimystics.io/ordao) — Optimistic Respect-Based DAO architecture
- [Optimystics Respect](https://optimystics.io/respect) — Respect token philosophy
- [Optimystics frapps GitHub](https://github.com/Optimystics/frapps) — toolkit for fractal apps on Ethereum
- [Optimism Fractal](https://optimismfractal.com/) — sibling community
- [Welcome to Optimism Fractal blog post](https://optimystics.io/blog/welcome-to-optimism-fractal) — founder's framing
- [Eden Fractal](https://hive.blog/fractally/@mattlangston/first-results-from-the-fractal-governance-experiments) — early experimental results
- [zao.frapps.xyz/submitBreakout](https://zao.frapps.xyz/submitBreakout) — ZAO's submission portal (live 20+ weeks, deployed by Tadas)
- ZAO fractal Discord bot: github.com/bettercallzaal/fractalbotapril2026 (52 commands, 7th iteration, per 663e audit)
- Memory: `project_fractal_process.md` (90+ weeks running, Mondays 6pm EST)
- Memory: `project_fractal_vision.md` (reconciliation goals, on-chain submission for all members)

**Cross-repo grep note (per /zao-research v2.2 Step 2.5):** Ran `mcp__grep__searchGitHub` for `fractal` / `Respect` / `submitBreakout` / `OREC` scoped to `bettercallzaal/` and `Optimystics/`. Zero hits returned, suggesting grep.app has not deeply indexed those orgs (or matches are gated). Treated as known indexing limitation, not as absence-of-implementation. Verification of cross-repo fractal patterns should be done via direct repo clones or `gh search code` until grep.app catches up. Flag for Doc 663a (skill upgrade) to add this fallback explicitly.
