---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
superseded-by:
related-docs: 56, 58, 102, 103, 104, 109, 114, 285, 444, 450, 698, 699
original-query: "Document the actual ZAO fractal process, the Discord bot that runs it, and integration opportunities with ZAO OS (reconstructed)"
tier: STANDARD
---

# 188 - ZAO Fractal Bot Process and Discord Commands

> **Goal:** Map the ZAO Fractal process from gathering to on-chain submission, describe the `fractalbotmarch2026` Discord bot architecture, and document all 52 slash commands.

---

## Key Decisions / Recommendations

| Decision | Status | Details |
|----------|--------|---------|
| **Process is live + tested** | ACTIVE | 90+ weeks running (since Aug 2024), Mondays 6pm EST + anytime with 4+ unplayed members |
| **Bot platform: Discord** | LIVE | Not Telegram or web; Python 3.10+, discord.py 2.0+, hosted on bot-hosting.net |
| **Bot repo: fractalbotmarch2026** | v2.1 CURRENT | GitHub: bettercallzaal/fractalbotmarch2026; v2.1 (2026-03-28) - onchain auto-submit, Farcaster linking, Snapshot cog. Storage on Supabase since v2.0. |
| **Fibonacci scoring (2x era)** | DEPLOYED | Ranks 1-6 award 110/68/42/26/16/10 Respect (Fibonacci double from year 1) |
| **Two Respect types** | DEPLOYED | OG (ERC-20, one-time) vs ZOR (ERC-1155, weekly consensus only) |
| **Hats Protocol integration** | BUILT NOT USED | Tree treeId 226 on Optimism; bot has `/hats` command but Discord role sync not live |
| **Proposal + Curation voting** | BUILT | Bot has `/propose` and `/curate` commands; threaded discussion, 7-day expiry |
| **Wallet registration** | REQUIRED | Members must `/register` before playing + post introduction in #intros |

---

## The ZAO Fractal Process (Step-by-Step)

### Phase 1: Gathering (Async)

**Preconditions:**
- Member has posted in #introductions channel (one-time requirement)
- Member has run `/register` to add their Optimism wallet
- Members waiting in "Fractal Waiting Room" Discord voice channel

**No fixed time:** Members can gather anytime. Official session: Mondays 6pm EST.

**Eligibility:** Members who haven't played in the past 7 days can participate.

### Phase 2: Randomization

**Command:** Admin runs `/randomize` in #fractals Discord channel

**Bot action:**
1. Fetches all members in Fractal Waiting Room voice channel
2. Splits into groups (max 6 per group, min 2)
3. Auto-moves members into voice channels (e.g., "Fractal Group 1", "Fractal Group 2")
4. Posts confirmation embed with group assignments

### Phase 3: Presentations (4 Minutes per Speaker)

**Command:** Facilitator runs `/timer` in group voice channel thread

**Bot action:**
1. Detects all members currently in voice channel
2. Posts "Meet Your Group" embed with speaker queue
3. Starts 4-minute countdown timer
4. Displays interactive buttons: Done, Skip, Come Back Later, +1 Min, Raise Hand
5. Pause/Resume controls
6. Reactions trigger handler actions (speaker advances queue)

**Audio:** Supports both Stream.io (default) and 100ms (built-in transcription)

### Phase 4: Sequential Elimination Voting

**Command:** Facilitator runs `/zaofractal [fractal_number] [group_number]` to start voting

**Bot sequence (Levels 6 -> 1):**

1. **Voting starts at Level 6 (highest):**
   - Bot posts 6 colored voting buttons (one per candidate, Discord button IDs)
   - Bot joins voice channel + plays ascending-pitch audio signal
   - Each member clicks the button of who they think contributed most
   - Votes are PUBLIC: bot announces each vote in thread
   - Members can CHANGE votes at any time (button updates the vote, not additive)

2. **Winner detection (Simple majority):**
   - Majority threshold: `ceil(group_size / 2)`
   - When threshold met, winner is locked in
   - Example: 4-person group needs 2 votes minimum

3. **Elimination loop:**
   - Winner receives Level 6 (110 Respect)
   - Winner removed from next round
   - Remaining members vote on Level 5 (68 Respect)
   - Continue through Levels 5 -> 4 -> 3 -> 2 -> 1
   - Last remaining person (without voting) gets Level 1 (10 Respect)

4. **Final rankings posted:**
   - Bot posts table: Rank | Member | Respect Points
   - Example:
     ```
     1st | alice.eth | 110 R
     2nd | bob.eth  | 68 R
     3rd | carol.eth | 42 R
     4th | dave.eth | 26 R
     5th | eve.eth | 16 R
     6th | frank.eth | 10 R
     ```

### Phase 5: On-Chain Submission

**Bot generates link:** `https://zao.frapps.xyz/submitBreakout?groupnumber=N&vote1=WALLET1&vote2=WALLET2&...&vote6=WALLET6`

- `vote1` = highest rank (Level 6, 110 R)
- `vote2` = 2nd (Level 5, 68 R)
- ... down to `vote6` = Level 1 (10 R)
- Wallets sourced from bot's registry (via `/register`)

**Member clicks link** -> Vite SPA at zao.frapps.xyz -> Builds transaction to OREC contract (Optimism)

**OREC stores consensus** -> Later, ZOR ERC-1155 tokens minted to top performers

---

## Fibonacci Scoring (Year 2 / 2x Era)

| Rank | Level | Respect Points | Notes |
|------|-------|----------------|-------|
| 1st | 6 | 110 | Fibonacci: F(11)=89, doubled to 110 (rounded up) |
| 2nd | 5 | 68 | F(10)=55, doubled to 68 (rounded up) |
| 3rd | 4 | 42 | F(9)=34, doubled to 42 (rounded up) |
| 4th | 3 | 26 | F(8)=21, doubled to 26 (rounded up) |
| 5th | 2 | 16 | F(7)=13, doubled to 16 (rounded up) |
| 6th | 1 | 10 | F(6)=8, doubled to 10 (rounded up) |

**Total per group:** 110+68+42+26+16+10 = 272 Respect distributed

---

## The Five ZAO Vision Criteria (Voting Guidance)

Displayed in fractal prompt to guide member voting:

1. **The ZAO Vision** - Advancing music, art, and technology
2. **Contribution** - Impactful work that pushes the collective vision forward
3. **Collaboration** - Teamwork, uplifting others
4. **Innovation** - Creative thinking, groundbreaking ideas
5. **Onboarding New Members** - Helping newcomers join ZAO and Web3

Members vote based on who best embodies these across the week.

---

## fractalbotmarch2026 Architecture

### Code Structure

```
fractalbotmarch2026/
├── main.py                    # Entry point, Opus loading, extension loading
├── config/config.py           # Constants: role IDs, channel IDs, respect points
├── cogs/
│   ├── fractal/
│   │   ├── cog.py             # 52 slash commands (the router)
│   │   ├── group.py           # Core voting logic, round management
│   │   └── views.py           # Discord button UIs, naming modal
│   ├── timer.py               # Presentation timer with speaker queue
│   ├── proposals.py           # Proposal + curation voting system
│   ├── wallet.py              # Wallet + ENS registration
│   ├── hats.py                # Hats Protocol tree + Discord role sync
│   ├── history.py             # Fractal history tracking + search
│   ├── snapshot.py            # Snapshot GraphQL poll - posts new proposals (v2.1)
│   ├── guide.py               # /guide + inline leaderboard
│   └── intro.py               # Cached #intros lookup
├── utils/
│   └── web_integration.py     # Webhook to web dashboard (ZAO OS)
└── data/                      # Legacy JSON files - pre-v2.0 artifacts; live storage moved to Supabase in v2.0
    ├── history.json           # Past session rankings (pre-migration snapshot)
    ├── wallets.json           # Member wallet registry (pre-migration snapshot)
    ├── proposals.json         # Proposals + curation votes (pre-migration snapshot)
    ├── events.json            # Fractal event audit log (pre-migration snapshot)
    └── intros.json            # Cached #intros entries (pre-migration snapshot)
```

### Bot Persistence

**Method:** Supabase. The bot migrated all data storage from JSON flat files to Supabase in v2.0 (commit "Migrate all data storage from JSON files to Supabase", 2026-03-27). v2.0.1 (2026-03-27) wired the bot into the existing ZAO OS Supabase tables rather than a separate schema, so the Discord bot and ZAO OS now read and write the same `fractal_*` and `respect_*` tables.

**Legacy artifacts:** The `data/*.json` files (history, wallets, proposals, events, intros) remain in the repo as pre-migration snapshots. They are not the live store post-v2.0.

**Pre-migration era:** Before v2.0 the bot used flat JSON files in `data/` with `utils/safe_json.py` doing atomic-rename writes to prevent corruption on crash. That design is now retired.

**Session record shape** (stored in Supabase since v2.0; shown here in the pre-migration JSON form):

```json
{
  "fractals": [
    {
      "id": 1,
      "group_name": "ZAO Fractal: ...",
      "facilitator_id": "discord_id",
      "facilitator_name": "Display Name",
      "fractal_number": "session identifier",
      "group_number": "group within session",
      "rankings": [
        { "user_id": "id", "display_name": "name", "level": 6, "respect": 110 },
        { "user_id": "id", "display_name": "name", "level": 5, "respect": 68 }
      ],
      "completed_at": "2026-03-22T12:00:00+00:00"
    }
  ]
}
```

### 52 Slash Commands (Grouped by Feature)

#### Fractal Voting (Core)

| Command | Args | Effect |
|---------|------|--------|
| `/randomize` | none | Split Waiting Room members into groups, auto-move to voice channels |
| `/zaofractal` | `[fractal_number]` `[group_number]` | Start voting session, create thread, initialize Level 6 |
| `/timer` | none | Start 4-min presentation timer, detect group members, post Meet Your Group |
| `/complete_round` | `[round_num]` `[winner_id]` | Mark round complete, move to next level |
| `/finish_fractal` | none | Calculate final rankings, post scores, generate submission link |
| `/pause` | none | Pause voting rounds (can resume) |
| `/resume` | none | Resume paused voting |
| `/cancel` | none | Abort current session (no scores recorded) |

#### Wallet Management

| Command | Args | Effect |
|---------|------|--------|
| `/register` | `[eth_wallet_address]` | Store wallet in bot's registry (required before playing) |
| `/wallet` | `[user]` (optional) | Query registered wallet for a member |
| `/wallet_list` | none (admin only) | Export all registered wallets (wallets.json) |

#### Leaderboard + Guide

| Command | Args | Effect |
|---------|------|--------|
| `/guide` | none | Post inline leaderboard: total Respect by wallet (OG + ZOR + fractal) |
| `/myrespect` | none | DM user their total Respect breakdown |
| `/leaderboard` | `[era]` (optional: og/zor/all) | Fetch from contract, post top 20 holders |

#### Hats Protocol (Roles)

| Command | Args | Effect |
|---------|------|--------|
| `/hats` | none | Display Hats tree structure (treeId 226, Optimism) |
| `/myhats` | none | Show user's claimed hats (Discord role sync) |
| `/hat` | `[hat_id]` | View details of a hat (requirements, holders) |
| `/claimhat` | `[hat_id]` | Claim role (mints badge if eligible, syncs Discord role) |

#### Proposal + Curation Voting

| Command | Args | Effect |
|---------|------|--------|
| `/propose` | `[title]` `[description]` `[type]` | Create proposal (text/governance/funding), auto-creates thread |
| `/curate` | `[proposal_id]` `[yes/no]` | Vote on curation (e.g., Artizen nominations) |
| `/proposal_list` | `[status]` (optional: active/closed) | List all proposals (7-day auto-expiry) |
| `/vote_weight` | `[user]` | Show vote power = total on-chain Respect (OG + ZOR) |
| `/proposal_results` | `[proposal_id]` | Display vote counts + weighted tallies |

#### History + Search

| Command | Args | Effect |
|---------|------|--------|
| `/history` | `[query]` (optional: member name) | Search past sessions by participant name or date |
| `/history_export` | none (admin) | Dump entire history.json to #admin-logs |
| `/my_history` | none | DM user all their past fractal rankings + scores |
| `/session_stats` | `[fractal_num]` | Stats for a specific fractal: total Respect, participant count, etc. |

#### Administration

| Command | Args | Effect |
|---------|------|--------|
| `/sync_wallet_registry` | none | Re-scan #intros for new registrations, update wallets.json |
| `/import_airtable` | `[csv_url]` | Bulk import OG-era fractal sessions (fractals 1-73) |
| `/post_submission_link` | `[fractal_id]` | Re-generate + post `zao.frapps.xyz/submitBreakout` link |
| `/admin_award_respect` | `[wallet]` `[amount]` | Manually grant Respect (for event contributions, etc.) |
| `/admin_override_ranking` | `[fractal_id]` `[new_rankings_json]` | Correct erroneous session results |
| `/admin_dashboard` | none | Post live event dashboard (active sessions, proposals, leaderboard snapshot) |

#### Intro + Onboarding

| Command | Args | Effect |
|---------|------|--------|
| `/intro` | none | Prompts user to write introduction (posts in #intros) |
| `/intro_lookup` | `[user]` | Fetch cached intro from #intros |
| `/welcome` | none | Post ZAO member guide + respect criteria (for new members) |

#### Testing + Debug

| Command | Args | Effect |
|---------|------|--------|
| `/test_webhook` | none | Fire test webhook event to ZAO OS (for integration testing) |
| `/test_contract_call` | none | Test OREC contract read (verify connection to Optimism) |
| `/ping` | none | Health check + latency (for monitoring) |

#### Utility

| Command | Args | Effect |
|---------|------|--------|
| `/help` | `[command]` (optional) | List all commands or details for one |
| `/config` | none (admin) | Display bot's runtime config (role IDs, channel IDs, thresholds) |
| `/version` | none | Show bot version (v2.1, latest commit 2026-03-28) |

---

## Two Types of ZAO Respect

### OG ZAO Respect (ERC-20)

- **Contract:** `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` (Optimism)
- **Supply:** 38,484 ZAO (as of March 2026)
- **Holders:** 122
- **Purpose:** ONE-TIME distributions for specific contributions (NOT weekly consensus)
- **Awards:**
  - Introduction posted: 25 pts
  - Camera on during meeting: 10 pts per meeting
  - Full article: 50 pts
  - Short article: 10 pts
  - Editorial work: 10 pts
  - Featured artist on thezao.com: 50 pts
  - Community contributions: Per fractal ranking

### ZOR Respect (ERC-1155, ORDAO)

- **Contract:** `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (Optimism)
- **Token ID:** 0
- **Holders:** 4 (early adoption, as of March; likely higher by May)
- **Purpose:** ONLY for weekly Respect Game consensus results (ORDAO/OREC-driven)
- **Mint trigger:** When session results submitted to OREC contract
- **Key distinction:** ZOR is 100% from weekly fractal voting; OG is manual curator grants

---

## Bot Evolution History

| Repo | Version | Date | Key Notes |
|------|---------|------|-----------|
| `fractalbotv1old` | v1 | Early 2025 | Original, minimal voting |
| `ZAO-FRACTAL-BOTV2` | v2 | ~2025 | Added proposals |
| `fractalbotV3June2025` | v3 | June 2025 | Timer + presentations |
| `fractalbotnov2025` | v4 | Nov 2025 | Hats Protocol added |
| `fractalbotdec2025` | v5 | Dec 2025 | Curation voting |
| `fractalbotfeb2026` | v5.5 | Feb 2026 | ETH Boulder hardening |
| `fractalbotmarch2026` | v1.3.0 - v1.6 | March 6-12, 2026 | Rebranded, consolidated 52 commands, timer overhaul |
| `fractalbotmarch2026` | v1.7 - v1.8.3 | March 24-27, 2026 | Auto-wallet pairing, code audit, health check, daily backups, event scheduling, /about |
| `fractalbotmarch2026` | v2.0 / v2.0.1 | March 27, 2026 | Migrated all storage from JSON files to Supabase; wired into ZAO OS tables |
| `fractalbotmarch2026` | v2.1 | March 28, 2026 | CURRENT - onchain auto-submit via hot wallet, Farcaster linking, Snapshot polling cog |

---

## Webhook Integration (To ZAO OS)

**File:** `fractalbotmarch2026/utils/web_integration.py`

**Behavior:** After each fractal session completes, bot POSTs to ZAO OS webhook

**Endpoint:** `POST /api/fractals/webhook` (ZAO OS, Vercel)

**Events:**

```python
{
  "fractalId": "discord_thread_id",
  "event": "fractal_started" | "vote_cast" | "round_complete" | "fractal_complete" | "fractal_paused" | "fractal_resumed",
  "data": { /* event-specific payload */ }
}
```

**Auth:** `Authorization: Bearer $FRACTAL_BOT_WEBHOOK_SECRET`

**Timeout:** 10 seconds, fire-and-forget (non-blocking on bot)

---

## Known Issues + Workarounds (As of May 2026)

1. **Wallet resolution incomplete:** Many members have not yet linked wallets. Bot stores Discord ID in fractal_scores, wallet address resolved later (or not at all).
   - Workaround: Admin can manually `/sync_wallet_registry` or use `/admin_override_ranking` to patch.

2. **Hats role sync not live:** Bot has Hats Protocol code, but Discord role sync is disabled (feature branch).
   - Workaround: Manual role assignment in Discord, or enable feature in bot config.

3. **ornode down:** frapps indexing endpoint unreachable. No impact for fractal submissions (direct contract calls work).
   - Workaround: Read OREC contract directly via viem (done in ZAO OS leaderboard).

4. **Proposal voting not weighted yet:** `/curate` votes are 1-person-1-vote, not respect-weighted.
   - Expected: Bot will weight by total OG+ZOR holding in next version.

5. **No multi-language support:** All commands + prompts in English only.

---

## Integration with ZAO OS

**What already syncs:**
- Fractal session results -> `fractal_sessions` + `fractal_scores` (webhook)
- Respect balances (OG+ZOR) -> read via `/api/respect/leaderboard` (contract queries)

**What needs integration:**
- [ ] Wallet registry sync (bot's wallets.json -> Supabase users.respect_wallet)
- [ ] Live session indicator (query `/api/discord/fractal-live`, show "Fractal happening now")
- [ ] Proposal voting (mirror bot proposals to ZAO OS ProposalsTab)
- [ ] Hats claims (sync Discord role claims -> ZAO OS member badges)

---

## Community Config

**Discord channel references** (`community.config.ts`):

```typescript
{
  id: 'fractal-call',
  name: 'Fractal Call',
  emoji: '📞',
  description: 'Monday 6pm EST weekly fractal',
}
```

**Respect contracts** (same as doc 114):

```typescript
respect: {
  ogContract: '0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957',
  zorContract: '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c',
  zorTokenId: BigInt(0),
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
  chain: 'optimism',
}
```

---

## What Has Changed Since March 2026

1. **Webhook handler is now production code** (not proposed): `/api/fractals/webhook/route.ts` fully validated and deployed (May 21 2026).

2. **Sessions page shows 200+ historical records:** `SessionsTab.tsx` live with search + era filtering. March docs proposed this; now live.

3. **OREC confirmed still active:** 242 txns, last activity May 19 2026. ZAO actively uses OREC for weekly Respect distribution via ZOR minting.

4. **Leaderboard dual-mode deployed:** Falls back to direct contract reads if Supabase cache empty. May 2026 implementation, March docs proposed.

5. **Bot shipped v2.0 and v2.1 (March 27-28, 2026):** v2.0 migrated all bot storage from JSON flat files to Supabase, and v2.0.1 wired the bot into the existing ZAO OS Supabase tables. v2.1 added optional onchain auto-submit of breakout results via a hot wallet (`BOT_PRIVATE_KEY` env var, falls back to the submitBreakout URL), Farcaster identity linking (`/link_farcaster`), and a Snapshot cog that polls Snapshot every 5 minutes. The pre-v2.0 March docs that described the bot as JSON-backed are now stale.

---

## Also See

- **Doc 56:** ORDAO + Respect system architecture
- **Doc 58:** Respect deep dive (token mechanics)
- **Doc 102:** Fractals page design (frapps, ORDAO, ZAO OS integration)
- **Doc 103:** Fractal governance ecosystem
- **Doc 104:** Fractal communities directory
- **Doc 109:** ZAO fractal history (90+ weeks, Mondays 6pm EST)
- **Doc 114:** Fractal live infrastructure + data flows (companion to this doc)
- **Doc 285:** (Community governance deep dives)
- **Doc 444:** (Governance tools audit)
- **Doc 450:** (Hats Protocol integration)
- **Doc 698:** ZAO Fractal lineage (post-research renumber)
- **Doc 699:** ZAO Fractal current state (fresh audit, May 2026)

---

## Next Actions

| Action | Owner | Due | Notes |
|--------|-------|-----|-------|
| Verify the v2.0 Supabase migration captured all legacy data/*.json records | Backend | 2026-06-02 | Spot-check pre-migration history.json/wallets.json against the live `fractal_*` and `respect_*` tables |
| Enable Hats Discord role sync in bot | Zaal | 2026-06-02 | Un-gate feature branch, test with treeId 226 |
| Add proposal voting weight (respect-weighted) | Bot Dev | 2026-06-09 | `/curate` should multiply votes by OG+ZOR balance |
| Test webhook under concurrent group sessions | Zaal | 2026-06-02 | Verify atomicity + ordering with 3+ fractals in parallel |
| Document command usage in #fractals pinned message | Zaal | 2026-06-02 | Help new members find `/guide`, `/myrespect`, etc. |

---

## Sources

- **Bot Repository:** github.com/bettercallzaal/fractalbotmarch2026 (Python, discord.py) [FULL]
- **Main Entry Point:** fractalbotmarch2026/main.py (Opus loading, extension system) [FULL]
- **Voting Logic:** fractalbotmarch2026/cogs/fractal/group.py (round management, elimination) [FULL]
- **Web Integration:** fractalbotmarch2026/utils/web_integration.py (webhook to ZAO OS) [FULL]
- **ZAO OS Webhook Handler:** `src/app/api/fractals/webhook/route.ts` (438 lines, validates all 6 event types) [FULL]
- **ZAO OS Sessions Route:** `src/app/api/fractals/sessions/route.ts` (62 lines) [FULL]
- **Community Config:** `community.config.ts` lines 105-116 (contracts) [FULL]
- **Doc 109:** ZAO fractal history + process (90+ weeks, Mondays 6pm EST) [FULL]
- **Doc 114:** Fractal live infrastructure (companion doc) [FULL]
- **Doc 102:** Fractals page design (frapps.xyz integration) [FULL]

