# 113 — ZAO Fractal Bot + Process Deep Dive (March 2026)

> **Status:** Research complete — ground truth from founder + code analysis
> **Date:** 2026-03-22
> **Goal:** Document the actual ZAO fractal process, the Discord bot that runs it, and integration opportunities with ZAO OS

## Key Facts (From Founder Zaal)

| Fact | Detail |
|------|--------|
| **Running since** | 90 weeks (~August 2024) |
| **Regular schedule** | Mondays at 6pm EST |
| **Flexible play** | Can happen anytime/anywhere with 4+ people who haven't played that week |
| **zao.frapps.xyz** | Live for 20+ weeks, deployed by Tadas |
| **Zaal's fractal history** | Started at Optimism Fractal week 6, then Eden Fractal, then founded ZAO Fractals |
| **Eden Fractal** | Active member, has earned Respect on Base, been on council |
| **Two Respect types** | OG ZAO Respect (ERC-20) for one-time distributions + ZOR/OREC for weekly consensus |
| **Relationship with Dan/Tadas** | Very friendly, active daily/weekly discussions |

## The ZAO Voting Criteria

From thezao.com and the fractal session prompt:

1. **The ZAO Vision** — advancing music, art, and technology
2. **Contribution** — impactful work that pushes the collective vision forward
3. **Collaboration** — teamwork, uplifting others
4. **Innovation** — creative thinking, groundbreaking ideas
5. **Onboarding New Members** — helping newcomers join ZAO and Web3

## Two Types of ZAO Respect

| Token | Type | Contract | Purpose |
|-------|------|----------|---------|
| **OG ZAO Respect** | ERC-20 (child) | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | One-time distributions: introductions, articles, being on website. NOT weekly consensus. |
| **ZOR Respect** | ERC-1155 (ORDAO) | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Weekly consensus results from the Respect Game, submitted via OREC |

**Key distinction:** OG Respect is for rewarding specific contributions (25 pts for intro, 50 pts for article). ZOR is ONLY for weekly Respect Game consensus results submitted through ORDAO/OREC.

## The Fractal Bot (`fractalbotmarch2026`)

### Overview

- **Platform:** Discord bot (not Telegram, not web)
- **Language:** Python 3.10+ with discord.py >= 2.0
- **Repo:** [github.com/bettercallzaal/fractalbotmarch2026](https://github.com/bettercallzaal/fractalbotmarch2026)
- **Version:** v1.6 (7th major iteration since v1)
- **Hosted on:** bot-hosting.net
- **52 slash commands** total
- **Web dashboard:** Next.js 14 at zao-fractal.vercel.app (Neon Postgres, NextAuth Discord OAuth)

### How a ZAO Fractal Session Works (Step-by-Step)

**Phase 1 — Gathering:**
Members join the "Fractal Waiting Room" voice channel in Discord. Must have registered wallet (`/register`) and posted an introduction.

**Phase 2 — Randomization:**
Admin runs `/randomize` to split members into fractal rooms (max 6 per room). Bot auto-moves members into voice channels.

**Phase 3 — Presentations:**
Facilitator runs `/timer`. Bot detects all members in the voice channel and posts a "Meet Your Group" embed. Timer runs 4 min per speaker with interactive controls: Done, Skip, Come Back, +1 Min, Raise Hand, Pause/Resume, reactions.

**Phase 4 — Voting (Sequential Elimination):**
1. Facilitator runs `/zaofractal` — confirms group, enters fractal number + group number
2. Bot creates a thread (e.g., "Fractal 5 - Group 2"), adds all members
3. **Voting starts at Level 6 (highest):**
   - Bot posts colored voting buttons — one per candidate
   - Bot joins voice to play ascending-pitch audio
   - Each member clicks who they think contributed most
   - Votes are **public** — announced in thread
   - Members can change votes at any time
4. **Winner detection:** Simple majority (`ceil(members / 2)`)
5. Winner removed from pool, next level starts (6 -> 5 -> 4 -> 3 -> 2 -> 1)
6. Last remaining candidate gets Level 1

**Phase 5 — On-Chain Submission:**
1. Bot posts final rankings with Respect points
2. Bot generates pre-filled URL to `zao.frapps.xyz/submitBreakout?groupnumber=N&vote1=WALLET1&vote2=WALLET2...`
3. Member clicks link and confirms transaction in frapps UI
4. OREC contract records the consensus result on Optimism

### Fibonacci Scoring (2x Era — Year 2)

| Rank | Level | Respect |
|------|-------|---------|
| 1st | 6 | 110 |
| 2nd | 5 | 68 |
| 3rd | 4 | 42 |
| 4th | 3 | 26 |
| 5th | 2 | 16 |
| 6th | 1 | 10 |

### Bot Architecture

```
fractalbotmarch2026/
├── main.py                    # Entry point, opus loading, extension loading
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
│   ├── guide.py               # /guide + inline leaderboard
│   └── intro.py               # Cached #intros lookup
├── utils/
│   ├── safe_json.py           # Atomic JSON writes
│   └── web_integration.py     # Webhook to web dashboard
└── data/                      # 5 JSON flat files for persistence
```

### Additional Bot Features (Beyond Fractal Voting)

- **Proposal system:** `/propose` creates text/governance/funding proposals with threaded discussion
- **Curation voting:** `/curate` for yes/no votes (e.g., Artizen Fund nominations)
- **Respect-weighted voting:** Vote power = total on-chain Respect (OG + ZOR)
- **7-day auto-expiry** on proposals
- **Hats Protocol:** `/hats`, `/hat`, `/myhats`, `/claimhat` with Discord role sync
- **Wallet management:** `/register`, `/wallet`, ENS resolution with Keccak-256 namehash

### Bot Evolution (7 Major Versions)

| Repo | Date | Notes |
|------|------|-------|
| `fractalbotv1old` | Early 2025 | Original version |
| `fractalbotV3June2025` | June 2025 | V3 |
| `ZAO-FRACTAL-BOTV2` | ~2025 | V2 iteration |
| `fractalbotnov2025` | Nov 2025 | November iteration |
| `fractalbotdec2025` | Dec 2025 | December iteration |
| `fractalbotfeb2026` | Feb 2026 | ETH Boulder version |
| `fractalbotmarch2026` | March 2026 | **Current v1.6** |

### OG ZAO Respect Point Values

| Activity | Points |
|----------|--------|
| Introduction in #introductions | 25 |
| Camera on during meeting | 10 per meeting |
| Full article | 50 |
| Short article | 10 |
| Editorial work | 10 |
| Being an artist on thezao.com | 50 |
| Community contributions | Per fractal ranking |

---

## Integration Opportunities with ZAO OS

### What ZAO OS Should Add (from Zaal: "all the data and information in one place")

| Feature | Current Location | ZAO OS Integration |
|---------|-----------------|-------------------|
| Fractal session history | Bot JSON files + history.json | Already in Supabase (`fractal_sessions`, `fractal_scores`) |
| Leaderboard | Bot `/guide` command (raw eth_call) | Already built at `/api/respect/leaderboard` |
| Wallet registration | Bot `/register` command | Could sync to `users.respect_wallet` |
| Hats tree | Bot `/hats` command | Already built at `/api/hats/tree` |
| Proposal voting | Bot `/propose` in Discord | Could mirror in `/fractals` Proposals tab |
| On-chain submission link | Bot generates frapps URL | Could embed frapps submit UI in `/fractals` |
| Session scheduling | Manual (Mondays 6pm EST) | Add calendar/scheduling to Sessions tab |
| Results display | Bot posts in #general | Real-time results in `/fractals` Sessions tab |

### Phase 2 Features for /fractals Page

Based on this research, the `/fractals` page should add:

1. **Live session status** — is a fractal happening right now? Who's playing?
2. **Submit results** — embed or link to `zao.frapps.xyz/submitBreakout` with pre-filled wallets
3. **Weekly eligibility** — show which members haven't played this week yet
4. **OG Respect history** — show non-fractal Respect distributions (intros, articles, etc.)
5. **Voting criteria card** — the 5 ZAO vision criteria displayed prominently
6. **Bot stats** — 90 weeks of sessions, total participants, total Respect distributed
7. **Fractal schedule** — next Monday 6pm EST + "play anytime with 4+ people" reminder

### Webhook Integration Path

The bot has `utils/web_integration.py` that posts webhook events to a dashboard. ZAO OS could:
1. Add a webhook endpoint at `/api/fractals/webhook`
2. Receive real-time events: session started, round completed, results finalized
3. Update the `/fractals` page in real-time via Supabase Realtime

---

## bettercallzaal GitHub — Related Repos (68 total)

Key fractal/ZAO repos:
- `zabalbot` — Zabal bot (TypeScript)
- `zaomusicbot` — ZAO music bot (JavaScript)
- `ZAO-Leaderboard` — Standalone Respect leaderboard (TypeScript)
- `Aurdour` — Professional two-deck DJ platform with Flow Mode auto-DJ
- `ZOUNZ` — Farcaster Music Mini App (AI music gen, Audius, Zora NFTs)
- `eliza1` — ElizaOS fork for autonomous agents

---

## Sources

- [fractalbotmarch2026 GitHub](https://github.com/bettercallzaal/fractalbotmarch2026)
- [thezao.com/zao-token](https://www.thezao.com/zao-token)
- [bettercallzaal GitHub profile](https://github.com/bettercallzaal)
- Research docs 56, 58, 102, 103, 104, 105, 106, 108, 109 in this library
- Direct context from founder Zaal (March 22, 2026)
