# 64 — Incented Protocol: ZABAL Campaigns & ZAO OS Integration

> **Status:** Research complete
> **Date:** March 18, 2026
> **Goal:** Document how ZABAL uses Incented.co for community coordination campaigns, and map integration opportunities into ZAO OS

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **What Incented is** | Human Coordination Protocol — 4-stage staking-based pipeline for community task management (Propose → Prioritize → Execute → Validate) |
| **ZABAL usage** | ZABAL has an active organization at `incented.co/organizations/zabal` running community campaigns |
| **ZAO OS integration** | EMBED Incented campaign feeds in the `/contribute` page — replace static GitHub bounties link with live Incented tasks |
| **Governance alignment** | USE Incented's validation staking alongside ZAO Respect weighting — Respect holders validate higher-impact tasks |
| **Auth integration** | Incented uses Privy for account abstraction — ZAO OS uses wallet auth (SIWE), so link via wallet address |
| **Priority** | Add Incented campaign embed to ZAO OS as part of the contributor experience — this is a live, working coordination tool ZABAL already uses |

---

## What Is Incented?

**Incented** is a Web3 coordination protocol for community-based organizations. It provides infrastructure for transparent, staking-incentivized collaboration.

**Tagline:** "The Human Coordination Protocol"

**URL:** [incented.co](https://incented.co)

### The 4-Stage Protocol

Every task flows through 4 stages, each powered by a staking mechanism:

| Stage | What Happens | Staking Role |
|-------|-------------|-------------|
| **1. Proposition** | Members submit task proposals (build a website, create marketing plan, write documentation) | Proposer stakes to signal commitment |
| **2. Prioritization** | Community members stake FOR or AGAINST proposals to signal what should be done next | Higher stake = higher priority weight |
| **3. Execution** | Any member claims and completes a prioritized task, submitting work for review | Executor stakes to claim exclusive rights |
| **4. Validation** | Community reviews submissions by staking FOR/AGAINST quality | Higher stakes = stronger quality signal; prevents gaming |

### Key Design Features

- **Staking at every stage** — ensures skin-in-the-game for proposers, voters, executors, and validators
- **Anti-gaming design** — prioritizations and validations are weighted to prevent popularity-based manipulation
- **Web2-style auth** via Privy (account abstraction) — low friction onboarding
- **Transparent rewards** — every submission tracked, every vote has consequences, every reward visible
- **Grant management** — supports grants, bounties, and contributor programs

### Platform Structure

| Concept | Description |
|---------|-------------|
| **Organization** | A community entity (e.g., ZABAL) that runs programs |
| **Program** | A funded initiative with a treasury and reward pool |
| **Campaign** | A set of tasks within a program with defined goals |
| **Task** | An individual unit of work to be proposed, claimed, executed, and validated |

---

## How ZABAL Uses Incented

ZABAL (`incented.co/organizations/zabal`) operates as an organization on Incented, running coordination campaigns for the BCZ → ZAO → WaveWarZ ecosystem.

### ZABAL Ecosystem Context (from Paragraph update, Dec 2025)

- **$ZABAL** is on Base chain at `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07`
- ZABAL is the "primary streaming + coordination engine" for the ecosystem
- **SongJam** integration tracks ZABAL mentions across X with multiplier mechanics
- **ZAO Fractal** provides weekly governance ritual — contribution, respect, community-led recognition
- Token strategy: December Sing Points → ZAO Respect recipients → multipliers → $SANG staking (square-root amplifier)
- Long-term vision: ZAO Stock 2026 (Maine-based physical event)

### What Campaigns Likely Look Like

Based on Incented's protocol structure and ZABAL's community focus:

| Campaign Type | Example Tasks |
|---------------|--------------|
| **Content creation** | Stream highlights, music reviews, community recaps |
| **Development** | Build features, fix bugs, write documentation |
| **Community growth** | Onboarding guides, social posts, event organization |
| **Music curation** | Song submissions, playlist creation, artist spotlights |
| **Governance** | Proposal drafting, research, fractal facilitation |

---

## ZAO OS Integration Opportunities

### 1. Embed Incented Campaign Feed in `/contribute`

**Current state:** `src/app/(auth)/contribute/page.tsx` has a static link to GitHub bounties.

**Upgrade:** Replace or augment with a live Incented campaign feed showing active ZABAL tasks.

```
Option A: iframe embed of incented.co/organizations/zabal
Option B: API integration (if Incented exposes a REST API)
Option C: Link out to Incented with deep-link to ZABAL org
```

**Simplest first step:** Add an Incented link card alongside the existing GitHub card in `/contribute`:

```tsx
<a href="https://incented.co/organizations/zabal" target="_blank">
  <p>Incented Campaigns</p>
  <p>View active ZABAL tasks, claim bounties, earn rewards</p>
</a>
```

### 2. Align Validation with Respect

Incented's validation staking could integrate with ZAO's Respect system:

| Incented Feature | ZAO OS Equivalent | Integration |
|-----------------|-------------------|-------------|
| Staking weight on validation | Respect balance | Higher Respect → heavier validation vote |
| Proposer reputation | ZID + Respect score | Show ZID and Respect on Incented profiles |
| Reward distribution | Respect-weighted governance | Respect holders get priority on high-impact tasks |

This requires Incented to support external reputation signals (check if their API allows custom weights).

### 3. Surface Active Campaigns in Chat

Add a `/campaigns` or `/bounties` command in the /zao Farcaster channel that pulls active Incented tasks:

```
/campaigns → Shows top 5 active ZABAL tasks from Incented
/claim [task-id] → Links to Incented to claim a task
```

This keeps task visibility inside ZAO OS without requiring users to leave the app.

### 4. Governance Proposal Pipeline

Use Incented's 4-stage protocol for ZAO governance proposals instead of the current free-text system:

| Current (ZAO OS) | With Incented |
|-------------------|--------------|
| Free-text proposal → Respect-weighted vote → pass/fail | Propose → Community stakes to prioritize → Execute → Validate with staking |
| No execution tracking | Execution tracked on Incented with deliverables |
| No validation mechanism | Community validates completed work |

This is a bigger integration — would require routing governance from `src/app/api/proposals/` through Incented's protocol.

### 5. Wallet-Based Identity Link

Both systems use wallet-based identity:
- ZAO OS: SIWE auth with wallet address → iron-session
- Incented: Privy account abstraction → wallet address

Link users by wallet address. When a ZAO member connects their wallet, check if they have an Incented profile and surface their campaign activity.

---

## Technical Integration Considerations

| Question | Status |
|----------|--------|
| Does Incented have a public API? | Unknown — no API docs found publicly. Check `docs.incented.co` directly. |
| What blockchain does Incented use? | Likely EVM-compatible (Privy supports Ethereum, Optimism, Base). Needs confirmation. |
| Can Incented display external reputation (Respect)? | Unknown — the protocol design suggests extensibility but no documentation found. |
| Does Incented support embedding? | Unknown — check if `incented.co/organizations/zabal` allows iframe embedding. |
| Is there a webhook/event system? | Unknown — would be needed for real-time task feeds in ZAO OS. |

**Action:** Reach out to the Incented team directly to confirm API access, embedding options, and custom reputation integration. The platform is still relatively early (blog posts from Jan 2024, protocol design stage).

---

## Comparison: Incented vs Alternatives

| Feature | Incented | Dework | Gitcoin | Coordinape |
|---------|----------|--------|---------|------------|
| **Task management** | Yes (4-stage staked) | Yes (Trello-like) | Grants only | No (peer recognition only) |
| **Staking mechanism** | Yes (every stage) | No | No | No |
| **Validation** | Community-staked | Admin-approved | Milestone-based | Peer allocation |
| **Anti-gaming** | Staking penalizes bad actors | Manual moderation | Sybil resistance | Circle-based trust |
| **Auth** | Privy (account abstraction) | Wallet / Discord | Passport / wallet | Wallet |
| **Grant management** | Yes | Limited | Primary focus | No |
| **Best for** | Staking-aligned communities | Project management | Public goods funding | Team recognition |

**Incented wins for ZAO** because the staking mechanism aligns with ZAO's Respect philosophy — skin-in-the-game at every step, not just voting.

---

## Implementation Roadmap

| Phase | What | Effort |
|-------|------|--------|
| **Phase 1** | Add Incented link card to `/contribute` page | 30 minutes |
| **Phase 2** | Confirm Incented API availability, test embedding | 1 session |
| **Phase 3** | Build live campaign feed component (if API exists) | 1 day |
| **Phase 4** | Integrate Respect weighting into Incented validation | Requires Incented team collaboration |
| **Phase 5** | Route governance proposals through Incented protocol | 1 week + protocol design |

**Start with Phase 1 immediately** — it's a single component addition to an existing page.

---

## Sources

- [Incented — The Human Coordination Protocol](https://incented.co)
- [ZABAL on Incented](https://incented.co/organizations/zabal)
- [Incented Program Design Guide](https://docs.incented.co/program-managers/program-design-guide)
- [Incented Protocol & UI Design Blog](https://blog.incented.co/designs/)
- [What is Incented?](https://whatis.incented.co)
- [ZABAL Update 3 — Paragraph](https://paragraph.com/@thezao/zabal-update-3) — ecosystem context, SongJam, fractal, ZAO Stock 2026
- [Incented Demo](https://demo.incented.co)
- [$ZABAL on Base](https://basescan.org/token/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07) — token contract
- [Doc 31 — Governance/DAO/Tokenomics](../31-governance-dao-tokenomics/) — current ZAO governance design
- [Doc 56 — ORDAO Respect System](../56-ordao-respect-system/) — OREC governance, Respect1155 scoring
