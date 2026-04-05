# 132 — Snapshot Weekly Priority Polls for ZAO OS

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Build a one-click weekly priority poll system using Snapshot, replicating the zaal.eth format with ZAO workstream choices
> **Builds on:** Doc 131 (On-Chain Governance), Doc 31 (DAO Governance)

---

## Key Decision

| Decision | Recommendation |
|----------|----------------|
| **SDK** | `@snapshot-labs/snapshot.js` — TypeScript SDK for creating proposals + voting programmatically |
| **Space** | Use existing `zaal.eth` space OR create dedicated `thezao.eth` space |
| **Voting type** | `approval` — members can select multiple workstreams (weighted by token holdings) |
| **Automation** | One-click "Create This Week's Poll" button in ZAO OS admin panel — pre-fills all fields, admin just clicks confirm + signs with wallet |
| **Voting period** | 7 days (Monday 6PM EST to next Monday 6PM EST, aligned with fractal schedule) |
| **Embed** | Display active Snapshot polls in ZAO OS governance tab via Snapshot GraphQL API |

---

## How It Works

### The Flow

```
Admin clicks "Create Weekly Poll" in ZAO OS
  → Pre-filled proposal (title, body, choices, dates) appears
  → Admin reviews, optionally edits
  → Admin signs with wallet (MetaMask/WalletConnect)
  → Proposal created on Snapshot via snapshot.js SDK
  → Poll appears in ZAO OS governance tab + on snapshot.box
  → Members vote directly in ZAO OS or on Snapshot
  → Results visible in both places
```

### Template Proposal

**Title:** `ZAO Weekly Priority Vote — Week of {date}`

**Body:**
```markdown
It's time to decide what ZAO will prioritize this week. This vote determines where our collective energy, resources, and coordination will go from Monday, {startDate} at 6PM EST through {endDate}.

**How it works:**
- Vote using your weighted $ZAO / Respect holdings
- The winning focus areas will set the DAO's primary workstreams for the week
- After voting, post in the /zao channel with specific tasks you'd like to see happen

**Why this matters:**
ZAO is powered by **Zeal. Alignment. Ownership.** Your vote directs real projects, resources, and deliverables.
```

**Choices (configurable per project):**

| # | Choice | Description |
|---|--------|-------------|
| 1 | WAVEWARZ | Competitive Web3 music battles (online + IRL) |
| 2 | ZAO FRACTAL | Fractal governance + Respect Game |
| 3 | ZAO FESTIVALS | IRL culture-build (ZAO-CHELLA) |
| 4 | ZAO CARDS | Digital/physical collectibles |
| 5 | COC CONCERTZ | Community of Communities live shows |
| 6 | ZAO NEWSLETTER | Daily/weekly updates |
| 7 | Student $LOANZ | Web3 education funding |
| 8 | ZAO Calendar | Single source of truth for events |
| 9 | Let's Talk About Web3 | Weekly live show |
| 10 | Midi-ZAO-NKZ | MIDI-PUNKZ collab |

---

## Technical Implementation

### 1. Install Snapshot.js

```bash
npm install @snapshot-labs/snapshot.js
```

### 2. Create Proposal (Code Pattern)

```typescript
import snapshot from '@snapshot-labs/snapshot.js';
import { Web3Provider } from '@ethersproject/providers';

const hub = 'https://hub.snapshot.org';
const client = new snapshot.Client712(hub);

async function createWeeklyPoll(web3Provider: Web3Provider, account: string) {
  const now = new Date();
  // Next Monday 6PM EST
  const start = getNextMonday6PMEST();
  const end = start + 7 * 24 * 60 * 60; // +7 days

  const receipt = await client.proposal(web3Provider, account, {
    space: 'zaal.eth', // or 'thezao.eth'
    type: 'approval', // multiple choice allowed
    title: `ZAO Weekly Priority Vote — Week of ${formatDate(start)}`,
    body: WEEKLY_POLL_BODY_TEMPLATE,
    choices: [
      'WAVEWARZ',
      'ZAO FRACTAL',
      'ZAO FESTIVALS',
      'ZAO CARDS',
      'COC CONCERTZ',
      'ZAO NEWSLETTER',
      'Student $LOANZ',
      'ZAO Calendar',
      "Let's Talk About Web3",
      'Midi-ZAO-NKZ',
    ],
    start: Math.floor(start / 1000),
    end: Math.floor(end / 1000),
    snapshot: await getLatestBlock(),
    plugins: JSON.stringify({}),
    labels: ['weekly-priority'],
    app: 'zao-os',
  });

  return receipt;
}
```

### 3. Read Polls (Snapshot GraphQL)

```graphql
query {
  proposals(
    where: { space: "zaal.eth", state: "active" }
    orderBy: "created"
    orderDirection: desc
  ) {
    id
    title
    body
    choices
    start
    end
    state
    scores
    scores_total
    votes
    type
  }
}
```

**Endpoint:** `https://hub.snapshot.org/graphql`

### 4. Vote on a Poll

```typescript
await client.vote(web3Provider, account, {
  space: 'zaal.eth',
  proposal: proposalId,
  type: 'approval',
  choice: [1, 3, 5], // indices of selected choices (1-based)
  reason: '',
  app: 'zao-os',
});
```

---

## Implementation Plan

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/lib/snapshot/client.ts` | Snapshot.js SDK wrapper — create poll, vote, read |
| `src/app/api/snapshot/polls/route.ts` | GET — fetch active polls via GraphQL; POST — create weekly poll |
| `src/components/governance/SnapshotPolls.tsx` | Display active + past Snapshot polls with inline voting |
| `src/components/governance/CreateWeeklyPoll.tsx` | Admin one-click poll creator with pre-filled template |
| `src/app/(auth)/fractals/ProposalsTab.tsx` | Add "Snapshot Polls" section between ZOUNZ and Community |
| `community.config.ts` | Add `snapshot.space`, `snapshot.choices` config |

### Effort: ~8 hours total

| Task | Effort |
|------|--------|
| Snapshot.js SDK integration + client wrapper | 2 hrs |
| Create Weekly Poll admin UI | 2 hrs |
| Display polls with voting (GraphQL + vote signing) | 3 hrs |
| Wire into governance tab + community.config | 1 hr |

---

## Multi-Project Support

The user wants this for **different projects**. The template system supports this:

```typescript
// community.config.ts
snapshot: {
  space: 'zaal.eth',
  projects: {
    zao: {
      label: 'ZAO Weekly Priority',
      choices: ['WAVEWARZ', 'ZAO FRACTAL', 'ZAO FESTIVALS', ...],
    },
    bandz: {
      label: 'B&Z Builds Weekly',
      choices: ['Website', 'Mini App', 'Research', 'Content', ...],
    },
  },
}
```

Each project gets its own poll template. Admin selects project → one click → poll created.

---

## Sources

- [Snapshot.js SDK — GitHub](https://github.com/snapshot-labs/snapshot.js/)
- [Snapshot.js Docs](https://docs.snapshot.box/tools/snapshot.js)
- [Snapshot Voting Types](https://docs.snapshot.box/user-guides/proposals/voting-types)
- [Snapshot GraphQL API](https://docs.snapshot.box/)
- [Snapshot Create Proposal Docs](https://docs.snapshot.box/proposals/create)
- [zaal.eth Snapshot Space](https://snapshot.box/#/s:zaal.eth)
- [Doc 131 — On-Chain Governance](../../_archive/131-onchain-proposals-governance/)
