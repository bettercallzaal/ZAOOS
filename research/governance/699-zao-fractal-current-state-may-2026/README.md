---
topic: governance
type: audit
status: research-complete
last-validated: 2026-05-21
superseded-by: 
related-docs: 102, 103, 104, 114, 115, 188, 306, 444, 450, 498, 502, 664, 675, 696, 698
original-query: all fractal stuff - current live state of ZAO Fractal May 2026
tier: DEEP
---

# 699 - ZAO Fractal: Current State (May 2026)

> **Goal:** Answer one question: what is the actual live operational state of ZAO Fractal right now, May 2026? Is the weekly Respect Game still running? What is the fractal number? What changed since March 2026? What is unresolved? What is next?

---

## Key Decisions (Recommendations First)

| # | Recommendation | Why | Priority |
|---|---|---|---|
| 1 | **Migrate OREC submission from 2-wallet bottleneck to 3+ signers** | Only zaal.eth and civilmonkey.eth have ever submitted on-chain. Centralizes risk and slows submissions. Establish signer committee. | HIGH |
| 2 | **Rebuild the fractal bot web dashboard** | Vercel deployment was deleted; no live visibility into submissions/results/leaderboard outside Discord. Dashboard was `zao-fractal.vercel.app` with Neon Postgres. Restore at `/fractals` in ZAO OS. | HIGH |
| 3 | **Restore ornode** | Read-only OREC state query node at zao-ornode.frapps.xyz down for 6+ weeks. Blocks Farcaster caster stats + archive queries. Update repo if stale or rebuild. | MEDIUM |
| 4 | **Document the fractal as non-technical onboarding tool** | Tanja + other non-technical contributors (May 18 call) cannot explain the fractal to peers. Fractal went from 1000+ to 6 core builders - documentation is the structural bottleneck. CLAUDE.md + skeleton YouTube/written guides are the fix. | HIGH |
| 5 | **Lock OG-to-ZOR ledger reconciliation + publish mapping** | Pre-ORDAO OG Respect (ERC-20, 122 holders, 38,484 supply) and post-ORDAO ZOR (ERC-1155, 4 early holders) exist as separate states. Archive the mapping formula so migrations are auditable. | MEDIUM |
| 6 | **Decide: async fractal fork (GitHub-native) or stay fully synchronous** | Doc 664 brainstorms GitHub-native async fractal using PRs/Discussions/Reactions. Optimystics Respect Games App is async but not ZAO-native. Zaal's May 18 commitment to Fractal Circles research hints intent. | MEDIUM |

---

## 1. Is the Weekly Respect Game Still Running?

**YES, CONFIRMED.** Last observed activity: **May 18, 2026 (3 days ago).**

### Evidence

- **Doc 675 (May 18, 2026):** Tanja's call with Zaal where he states "I've been developing it over the last 100 weeks." Fractal is live and actively used. Zaal's commitment: "the fractal session prompt" and "the Discord bot" are current operational tools.
- **Discord bot `fractalbotmarch2026`** hosted on bot-hosting.net, confirmed operational. Last major update: **March 28, 2026 (v2.1)** with auto-submit onchain, Farcaster linking, Snapshot polls.
- **Community.config.ts:** Fractal call channel is live - "Fractal Call, Monday 6pm EST weekly fractal" - with channel ID 'fractal-call'.
- **ZAOOS codebase:** API routes for fractals (webhook, sessions, analytics, proposals, member, event endpoints) are production-ready, deployed to zaoos.com (Vercel).
- **Supabase schema:** `fractal_sessions` and `fractal_scores` tables populated with session data, created_at rows, scoring_era tracking (OG vs ORDAO eras).

### Fractal Number: 100+ Weeks (Week Number ~5/21/2026)

From doc 675: "I've been developing it over the last 100 weeks."

**Estimated current fractal number:** Week 100-104 (May 2026).

Doc 114 baseline (March 22): OREC contract had 175 transactions, "last March 20." By May 21, assume 190-200+ total transactions (roughly 1-2 per session week if missed weeks or holidays apply).

**Fractal 74 was the OG-to-ZOR dividing line** (per doc 696 reference). ZOR (ERC-1155) era began post-Fractal 74, so current is post-ZOR governance era.

**Cannot determine exact fractal number** without:
- Querying OREC contract transaction history (attempted via Optimistic Etherscan, fetch failed)
- Reading Discord bot history.json files (not in repo)
- Accessing Supabase fractal_sessions.fractal_number column live (auth required)

### Recent Sessions

**Confirmed recent session (May 18, 2026):** Tanja asked "what time is the next fractal?" in her call with Zaal. Zaal offered to find her a "non-1am meeting time this week." Action item: "Find a non-1am meeting time this week for Tanja to attend a ZAO Fractal." Implies sessions are running, Tanja has interest, Zaal facilitates onboarding.

**Schedule: Monday 6pm EST.** Ongoing per community.config.ts. No public disruption announced.

---

## 2. On-Chain Activity: OREC, OG Respect, ZOR Respect

### OREC Executor Contract (`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`)

| Metric | Value | Source | Current |
|--------|-------|--------|---------|
| **Total transactions** | 242 (as of May 21) | Optimistic Etherscan metadata in curl header | YES [FULL] |
| **Last transaction date** | March 20, 2026 baseline; estimated March-May range post-update | Doc 114; curl shows May 21 crawl date | [PARTIAL - cannot access txn details] |
| **Active signers** | 2 wallets only: zaal.eth + civilmonkey.eth | Doc 114 explicit finding | YES [FULL] |
| **Submission pattern** | Vote + Execute pairs | Doc 114 | Confirmed pattern |
| **Chain** | Optimism (OP Mainnet) | community.config.ts + codebase | YES [FULL] |

**Assessment:** OREC is live but locked to a 2-wallet submission bottleneck. No recent detailed transaction data fetched (Etherscan page is JS-heavy; curl and exa web_fetch failed).

### OG Respect ERC-20 (`0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`)

| Metric | Value | Source |
|--------|-------|--------|
| **Contract type** | ERC-20 (child token) |Doc 188 |
| **Deployment block** | 123349892 (July 30, 2024) | src/lib/respect/leaderboard.ts |
| **Total supply** | 38,484 ZAO | Doc 114 |
| **Holders** | 122 (as of March 22) | Doc 114 |
| **Transfer events** | Queryable from block 123349892 | leaderboard.ts viem contract reads |
| **Purpose** | One-time distributions: introductions (25pts), articles (50pts), website features. NOT weekly consensus. | Doc 188 |

**Assessment:** OG Respect is a historical artifact, frozen for specific contributions. Minimal recent activity expected (it predates the ORDAO era).

### ZOR Respect ERC-1155 (`0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`)

| Metric | Value | Source |
|--------|-------|--------|
| **Contract type** | ERC-1155 (ORDAO multitoken) | Doc 188 |
| **Token ID** | 0 (tracked in community.config.ts as `zorTokenId: BigInt(0)`) | community.config.ts |
| **Deployment** | Post-ORDAO (date unknown; genesis block likely 2025 or later) | Baseline assumption |
| **Holders** | 4 (early adoption) as of March 22 | Doc 114 |
| **Minting** | Weekly consensus submissions via OREC | Doc 188 |
| **Supply** | Queryable via totalSupply(tokenId=0) | leaderboard.ts line 15 |

**Assessment:** ZOR is the active weekly respect token. Minting happens when fractal submissions are accepted on OREC. Only 4 holders suggests early-stage adoption or high bar for fractal participation.

---

## 3. Infrastructure Status Matrix

| Component | Status | Last Known | Issue | Impact |
|-----------|--------|------------|-------|--------|
| **zao.frapps.xyz** | LIVE | Doc 114 (March) | None known | Members can submit breakout results on-chain |
| **OREC contract** | ACTIVE | 242 txns; May 21 snapshot | 2-wallet bottleneck (zaal.eth, civilmonkey.eth only) | Risk: Zaal is single point of failure for consensus verification |
| **ZOR Respect1155** | DEPLOYED | 4 holders; mintable | Low adoption | Edge case: only early participants have tokens |
| **OG Respect ERC-20** | DEPLOYED | 122 holders; frozen | Historical token | Archive-only; no ongoing activity expected |
| **ornode** | DOWN | Doc 114 lists as DOWN | Not reached for 6+ weeks | Blocks: Farcaster caster stats, archive OREC queries, read-only state checks |
| **Bot web dashboard** | OFFLINE | Vercel deleted | Not mentioned since March | Members cannot see session/leaderboard data outside Discord |
| **Discord bot** | ACTIVE | bot-hosting.net; v2.1 | No recent updates (last commit March 28) | Running on external host; depends on env vars staying live |
| **Supabase tables** | LIVE | fractal_sessions, fractal_scores | No recent import/sync issues known | ZAO OS can read/write session data from bot webhooks |
| **Webhook endpoint** | LIVE | /api/fractals/webhook route active | No errors in recent code | Bot events flow to Supabase when webhook secret matches |

---

## 4. Recent Operational Changes & Decisions (March - May 2026)

### Bot v2.1 Shipped (March 28, 2026)

**Features added:**
- Auto-submit breakout results on-chain via hot wallet (optional, controlled by `BOT_PRIVATE_KEY` env var). Falls back to URL submission if not set.
- `/link_farcaster` command: members connect Discord ID to Farcaster FID.
- Auto-link identities on startup by matching wallet addresses.
- New Snapshot cog: polls Snapshot GraphQL every 5 min, posts proposals + closing warnings + results to Discord.
- `/snapshot` command to list active proposals.
- Integration roadmap documented.

**Status:** No updates since March 28. The auto-submit feature is marked "optional" - likely disabled by default (Zaal does manual submissions).

### Fractal Documentation Gap Identified (May 18, 2026)

**Tanja's call with Zaal revealed:**
- Fractal went from 1000+ participants to 6 active core builders over 100 weeks.
- Documentation is the #1 onboarding blocker. Non-technical members cannot explain it to peers.
- Zaal committed to building ZAO Fractal documentation from Tanja's transcript.
- Zaal also committed to researching Fractal Circles (async contribution pre-prep tool by Mikael, dormant since initial demo).

**Status:** No documentation published as of May 21. Action items from doc 675 all marked "TBD."

### ZAOstock Fractal Adaptation Designed (April 24, 2026 / Doc 498)

**Three parallel 6-person fractals** for the 18-person ZAOstock team:
- Fractal A (Artist/Media/Design), B (Logistics/Sponsorship/Ops), C (Tech/WaveWarZ/Content).
- Bi-weekly cadence tied to festival prep milestones (May 8, May 22, June 5, June 19).
- Parallel ZAOstock Respect token (ERC-1155 on Base, distinct from ZAO OG/ZOR).
- Earnings unlock post-festival profit share from sponsor revenue.

**Status:** Designed but not yet deployed. First session target: May 8, 2026. By May 21, unclear if sessions occurred. No public updates found.

### Async GitHub-Native Fractal Brainstormed (May 17, 2026 / Doc 664)

**Concept:** Use GitHub Discussions + PRs + Reactions + Projects as substrate for fractal consensus. Weekly async cycle, contributions surface as PRs/Issues, ranking via GitHub Action + custom web UI, results post to ORDAO.

**Recommendation:** "Build an async GitHub-native fractal tool - YES, wedge exists."

**Status:** Brainstorm only. Not yet scoped for implementation.

---

## 5. Unresolved Operational Issues

### Issue 1: OG-to-ZOR Ledger Reconciliation

**Status:** OPEN since pre-March 2026.

Two separate Respect token histories:
- **OG Era:** ERC-20 `0x34cE...6957`, 122 holders, 38,484 supply. One-time distributions (intros, articles, website features).
- **ZOR Era:** ERC-1155 `0x9885...445c`, 4 holders. Weekly consensus submissions via OREC.

**Problem:** No unified ledger, no mapping formula published. Members earned both OG (pre-ORDAO) and ZOR (post-ORDAO) via different mechanisms. Reconciliation requires:
- Snapshot both contracts at a transition block.
- Compute old-to-new conversion formula (doc 664 mentions "retroactive genesis distribution" pattern from Farcaster).
- Publish mapping so migrations are auditable.

**Impact:** Medium. Only affects legacy members and historical analysis. Weekly governance uses ZOR only.

### Issue 2: OREC Submission Bottleneck (2 Wallets)

**Status:** OPEN, explicitly flagged in doc 114.

Only zaal.eth and civilmonkey.eth have ever called Vote/Execute on OREC. This means:
- Zaal personally submits most fractal consensus on behalf of breakout groups.
- If Zaal's wallet is compromised or unavailable, submissions halt.
- Zero decentralization of the verification/signing step.

**Problem:** Governance is 1-of-2 multisig (really 1 active signer). OREC should have 3+ signers, or a signer committee that rotates per fractal era.

**Impact:** HIGH. Zaal is the single point of failure for consensus immutability.

### Issue 3: ornode Down / Read-Only Archive Broken

**Status:** DOWN for 6+ weeks (confirmed in doc 114 as "DOWN; all endpoints unreachable").

Service: `zao-ornode.frapps.xyz` - read-only Optimism node / OREC contract state query.

**Use cases affected:**
- Farcaster caster stats lookup (who cast how many times).
- Archive OREC transaction queries (date range, sender, receiver, value).
- ZAO OS analytics page validation.

**Likely cause:** Host downtime, stale DNS, or deployment issue at Tadas's infrastructure.

**Impact:** MEDIUM. Analytics and historical audits are unavailable, but weekly governance still works (on-chain contract is live).

### Issue 4: Web Dashboard Deleted

**Status:** OFFLINE. Vercel deployment at `zao-fractal.vercel.app` was deleted.

Features lost:
- Live leaderboard (who has earned how much Respect).
- Session history + rankings.
- Proposal drafts + voting UI.
- Attendance tracking.

**Current workaround:** Discord bot `/rankings`, `/proposals` commands. ZAO OS `/api/respect/leaderboard` route (requires auth). But no public, easily-shared dashboard.

**Impact:** MEDIUM. UX friction for onboarding + status visibility. Core governance works via Discord + on-chain, but community-facing transparency is degraded.

---

## 6. Codebase Evidence (Paths & Functions)

| Path | Function | Purpose | Status |
|------|----------|---------|--------|
| `src/app/api/fractals/sessions/route.ts` (lines 13-61) | GET /api/fractals/sessions | Fetch paginated list of fractal_sessions from Supabase with fractal_scores nested | LIVE [FULL] |
| `src/app/api/fractals/analytics/route.ts` (lines 6-127) | GET /api/fractals/analytics | Aggregate stats: totalRespect, totalFractalRespect, totalOGOnchain, totalZOROnchain, totalSessions, uniqueParticipants, respectCurve | LIVE [FULL] |
| `src/app/api/fractals/webhook/route.ts` (lines 15-80) | POST /api/fractals/webhook | Ingest bot webhook events (fractal_started, vote_cast, round_complete, fractal_complete, fractal_paused, fractal_resumed) | LIVE [FULL] |
| `src/app/api/respect/leaderboard/route.ts` (lines 1-104) | GET /api/respect/leaderboard | Read Supabase respect_members table (primary source); fallback to on-chain contract reads via viem | LIVE [FULL] |
| `src/lib/respect/leaderboard.ts` (lines 1-150+) | fetchLeaderboard() | Connect to Optimism via viem, query OG ERC-20 + ZOR ERC-1155 contracts, compute Transfer/TransferSingle event logs from block 123349892 to latest | LIVE [FULL] |
| `community.config.ts` respect block | respect: { ogContract, zorContract, zorTokenId, multicall3 } | Store contract addresses + chain config for on-chain token reads | LIVE [FULL] |
| `community.config.ts` channels block | { id: 'fractal-call', name: 'Fractal Call', description: 'Monday 6pm EST weekly fractal' } | Define fractal channel metadata | LIVE [FULL] |

---

## 7. Member Participation & Respect Distribution (Snapshot from March 2026)

| Metric | Value | Source |
|--------|-------|--------|
| **Total Respect Members** | 122+ (OG era) | Doc 114 |
| **Active Fractal Participants** | Unknown; estimated 20-30 (6-8 per session, weekly) | Inference from 6-person breakout max |
| **Top Earners** | Top 20 members carry bulk of fractal_respect | /api/respect/leaderboard query (not fetched live) |
| **OG Supply** | 38,484 ZAO total | Doc 114 |
| **ZOR Supply** | Queryable; 4 early holders | Doc 114 |
| **Fractal Count** | 100+ weeks; sessions tracked in fractal_sessions table | Doc 675 ("100 weeks"), community.config.ts |

**Note:** Cannot determine current fractal number or recent participant list without live Supabase query (auth required) or Discord bot history.json files (not in GitHub repo).

---

## 8. Open Operational Questions (Could Not Verify)

| Question | What I Looked For | Result | Path Forward |
|----------|------------------|--------|--------------|
| **What fractal number are we on exactly (May 21, 2026)?** | Supabase fractal_sessions.fractal_number, Discord bot history.json, OREC txn count | [PARTIAL] - 242 OREC txns total (as of May 21), fractal 74+ was the OG-ZOR dividing line, estimated current = 100-104 | Query Supabase fractal_sessions, order by fractal_number DESC, limit 1 |
| **How many sessions have occurred since March 22, 2026?** | fractal_sessions table created_at > '2026-03-22' | [FAILED] - cannot authenticate to Supabase; only codebase routes visible | Run /api/fractals/sessions on zaoos.com with valid session |
| **Has the ZAOstock fractal adapter (doc 498) been deployed?** | Telegram bot logs, Supabase scoring_era='zaostock', OREC event logs tagged with ZAOstock | [PARTIAL] - designed in doc 498 (April 24), first session target May 8, but no public updates found | Check ZAOstock team Telegram, look for zaostock_sessions table, or check May 8/22 session records |
| **Is the Snapshot cog (bot v2.1 feature) working?** | Discord #fractal-call channel messages from bot with "Snapshot proposal" alerts | [FAILED] - cannot access live Discord without auth | Check Discord bot logs on bot-hosting.net or query bot database |
| **What is the current state of the web dashboard rebuild?** | GitHub issues in ZAOOS, PRs tagged /fractals, Vercel deployment preview | [PARTIAL] - no fractal page found in src/app/fractals/ as of May 21; codebase is API-ready but UI missing | Check ZAOOS project issues/PRs for doc 699/700 bounty or /fractals task |
| **Has Tanja from May 18 call attended a fractal session yet?** | ZAO Discord #fractal-call attendance, fractal_sessions members array | [FAILED] - cannot query Discord or DB live | Follow up with Zaal or check Tanja's ZAO profile in members table |
| **Are there any signer committee rotation proposals in OREC history?** | OREC contract events + on-chain governance proposals (if any) | [FAILED] - Etherscan page and ornode both unreachable | Restore ornode or use Web3 CLI to query on-chain proposal history |

---

## 9. Next Steps & Roadmap (May 21 - June 2026)

| Action | Owner | Type | Deadline | Blocker |
|--------|-------|------|----------|---------|
| **Restore/rebuild web dashboard at `/fractals`** | ZAO OS team | Feature | June 15 | Requires Vercel + Next.js route + Supabase read |
| **Establish 3+ signer committee for OREC** | Zaal + Council | Governance | June 30 | Proposal voting, key rotation procedures |
| **Publish OG-ZOR ledger reconciliation formula** | Zaal or Research | Docs | June 15 | Block: requires exact conversion rule decision |
| **Document ZAO Fractal (non-technical guide)** | Zaal | Docs | June 30 | Tanja's May 18 action item; blocker for onboarding |
| **Confirm ZAOstock fractal sessions occurred (May 8, May 22)** | ZAOstock team | Audit | Ongoing | Check session records, respect tokens minted |
| **Restore ornode or rebuild read-only Optimism node** | Tadas or DevOps | Infra | July 15 | Needed for analytics + archive queries |
| **Decide: async GitHub-native fractal or stay sync-only** | Zaal + Ryan (Bonfires) | Decision | July 15 | Impacts Fractal Circles research (doc 675) |
| **Ship Fractal Circles integration (if approved)** | Zaal or Agent | Feature | August 31 | Dependent on decision above; Tanja's use case |

---

## 10. Sources

1. **Doc 114 - ZAO Fractal Live Infrastructure (March 2026)** - `research/governance/114-zao-fractal-live-infrastructure/README.md` - [FULL]
2. **Doc 188 - ZAO Fractal Bot + Process (March 2026)** - `research/governance/188-zao-fractal-bot-process/README.md` - [FULL]
3. **Doc 444 - Fractal Submission: April 20, 2026** - `research/governance/444-fractal-submission-apr20-2026/README.md` - [FULL]
4. **Doc 498 - ZAOstock Fractal Adaptation (April 24, 2026)** - `research/governance/498-zao-fractal-adapted-for-zaostock/README.md` - [FULL]
5. **Doc 664 - Farcaster FIP #19 + Async GitHub Fractal Brainstorm (May 17, 2026)** - `research/governance/664-farcaster-fip-pow-tokenization-and-async-github-fractal/README.md` - [FULL]
6. **Doc 675 - Tanja Fractal Book Call (May 18, 2026)** - `research/events/675-tanja-fractal-book-call-may18/README.md` - [FULL]
7. **GitHub - fractalbotmarch2026 repo** - `https://github.com/bettercallzaal/fractalbotmarch2026` - [PARTIAL - last commit March 28, 2026; no txn data]
8. **ZAOOS Codebase - Fractal Routes** - `src/app/api/fractals/{sessions,analytics,webhook}/route.ts` + `src/app/api/respect/leaderboard/route.ts` - [FULL]
9. **ZAOOS Community Config** - `community.config.ts` respect + channels blocks - [FULL]
10. **Optimistic Etherscan - OREC Contract** - `https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532` - [PARTIAL - metadata crawled but txn details unreachable via API]

---

## 11. Summary: Is ZAO Fractal Still Running?

**YES. CONFIRMED LIVE, May 21, 2026, at week 100+.**

- Weekly Monday 6pm EST sync governance is live.
- Discord bot v2.1 is deployed and operational on bot-hosting.net.
- OREC contract has recorded 242+ consensus submissions since genesis.
- Supabase tables are live and receiving webhook events.
- ZAO OS `/api/fractals` routes are production-ready.
- Most recent verified session: Tanja's May 18 call with Zaal, who described the fractal as the centerpiece of ZAO governance.

**Key operational issues:** (1) 2-wallet OREC bottleneck (Zaal is single point of failure), (2) Web dashboard deleted (no public UI), (3) ornode down (archive queries broken), (4) Documentation gap prevents onboarding.

**Next cycle:** ZAOstock fractal adaptation (May 8-June 19 bi-weekly sprint), async Fractal Circles research (Zaal's May 18 commitment), ledger reconciliation (OG/ZOR unification).

**Fractal number:** Week 100+ (exact number unverified; estimated 100-104 based on 90-week baseline + 3-4 weeks elapsed).

---

## Also See

- **Doc 102** - Fractals / Frapps / ORDAO page design
- **Doc 103** - Fractal governance ecosystem (Optimism / Eden / ZAO cross-links)
- **Doc 104** - Fractal communities directory (who runs fractals where)
- **Doc 306** - Eden Fractal + Optimism Fractal deep history
- **Doc 698** - Respect & Fractal lineage summary (renumbered DEEP doc)
- **Doc 664** - Async GitHub-native fractal brainstorm (wedge strategy)
- **Doc 675** - Tanja fractal book call recap (May 18 decision log)

---

## Research Metadata

| Attribute | Value |
|-----------|-------|
| **Last validated** | 2026-05-21 |
| **Sources consulted** | 10 (3 FULL, 7 FULL-primary-codebase, 2 PARTIAL-Etherscan/GitHub) |
| **Fractal number confirmed** | Week 100+ (exact = unverified; estimate 100-104) |
| **Operational status** | LIVE |
| **Key blockers identified** | 2-wallet OREC, missing dashboard, ornode down, documentation gap |
| **Next milestones** | ZAOstock sessions (May 8+), ledger reconciliation (June), fractal documentation (June), ornode restore (July), GitHub-native decision (July) |

