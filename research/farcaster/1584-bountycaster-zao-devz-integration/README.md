---
topic: farcaster, dev-workflows, community
type: integration-guide
status: DO NOW — R7 launches Jul 25; Bountycaster amplifies on the same day
last-validated: 2026-07-20
related-docs: 1534-zao-devz-bounty-campaign, 993-zol-farcaster-upgrades
board-tasks: None (supports R7/R8/R9 bounty discovery)
action-owner: Zaal (posts Bountycaster cast on Jul 25); ZOL (can auto-recast if configured)
---

# 1584 — Bountycaster Integration for ZAO Devz Bounties (R7/R8/R9)

> **What this is:** Setup guide for posting ZAO Devz bounties (R7/R8/R9) on Bountycaster — Farcaster's native bounty discovery platform. Doc 1534 covers the campaign design; this doc covers the exact Bountycaster cast format, workflow, and follow-up cadence. Post on Jul 25 alongside the R7 POIDH cast.

---

## What Bountycaster Is

**Bountycaster** (`bountycaster.xyz`) is a Farcaster-native directory of open bounties and job opportunities. Builders on Farcaster actively scan it for paid work. It's built by @bountybot (autodetects bounty casts) and curated in `/bounties` channel.

**How it works:**
1. Cast your bounty on Farcaster with a specific format
2. `@bountybot` (or the /bounties channel auto-indexer) picks it up and lists it on `bountycaster.xyz`
3. Builders find it and reply on Farcaster

The key advantage over POIDH alone: Bountycaster reaches Farcaster-native builders who browse `bountycaster.xyz` for gigs but may not know about `poidh.xyz`. POIDH handles escrow; Bountycaster handles discovery.

---

## How to Post a Bountycaster-Compatible Cast

### Required Format

Cast text must contain:
- The word "bounty" or "🔵" (Bountycaster's detection keyword)
- The reward amount + token
- A clear description of the task
- A link or CTA

**@bountybot auto-picks up:** any cast in /bounties channel OR any cast mentioning @bountybot

### R7 Bounty Cast (Jul 25 — post in /bounties and /zabal)

```
🔵 Bounty — ZABAL Gamez Bug Fixes (R7)

Fix real bugs in our open-source game platform. Get paid.

Reward: 5,000–10,000 ZABAL + $10–25 USDC (split among valid fixes)
Deadline: Aug 10

What we need:
→ Bug fixes in zabalgamez.com codebase
→ PR to bettercallzaal/ZAOOS or relevant repo
→ Working vercel preview as proof

Judged by @bettercallzaal. POIDH escrow on Base: [POIDH R7 link]

Reply to claim a bug. Code → merge → earn.

@bountybot
```

**Post to:** /bounties and /zabal on Farcaster  
**Time:** Jul 25, morning (aim for 9am ET before the R7 POIDH cast)

---

### R8 Bounty Cast (After Aug 15, when R8 seeds)

```
🔵 Bounty — WaveWarZ Farcaster Mini App (R8)

Build the WaveWarZ battle viewer as a Farcaster Mini App.

Reward: 20,000–50,000 ZABAL (split if multiple contributors)
Deadline: Sep 5

What we need:
→ frames.js Mini App showing current WaveWarZ battle state
→ Deploy to Vercel with a live preview URL
→ Matches the Phase 1 spec: [ZAOOS 1518 link]

Judge: @bettercallzaal. POIDH escrow on Base: [POIDH R8 link]

Reply here to claim. @bountybot
```

**Post to:** /bounties, /zabal, /miniapps  

---

### R9 Bounty Cast (After R8 completes, ~Sep)

```
🔵 Bounty — ZABAL Marketplace (R9)

Build a minimal $1 box-store for the ZABAL ecosystem.

Reward: 10,000–20,000 ZABAL
Deadline: Sep 30

What we need:
→ 3 API routes: list, buy, verify (spec in ZAOOS doc 1531)
→ On-chain tx verification via viem
→ No escrow, no marketplace fees — just the routes

Judge: @bettercallzaal. POIDH R9: [POIDH R9 link]

Spec: ZAOOS 1531-zabal-marketplace-box-store-api-spec
Reply to start. @bountybot
```

**Post to:** /bounties, /zabal, /ethereum  

---

## Step-by-Step: Jul 25 Bountycaster Launch

### 1. Post R7 Bountycaster Cast (9am ET)

Copy the R7 cast text above. Post in:
- `/bounties` channel (primary — this is where @bountybot indexes)
- `/zabal` channel (community visibility)
- Cross-post to X with the same text + #web3bounty hashtag (via Iman)

**Add one line at the bottom:** `POIDH: [poidh.xyz/base URL after seeding]`

You can seed POIDH first, get the URL, then add it to the Bountycaster cast.

### 2. Seed POIDH R7 (9:30am ET)

Go to `zpoidh/docs/create-bounty.html` → seed 5,000-10,000 ZABAL → get the POIDH URL.

Doc 1534 has the full POIDH seeding steps.

### 3. Edit Cast with POIDH URL (Optional)

If Farcaster allows editing, add the POIDH URL to the Bountycaster cast. If not, reply to your own cast with the POIDH URL:

```
POIDH escrow link: [url]
Submit a PR + proof screenshot → earn ZABAL
```

### 4. DM Builders (10am ET)

Per doc 1534, DM the top ZABAL Games builders individually:
```
hey [name] — we just launched a bug fix bounty for ZABAL Gamez.
ZABAL rewards + USDC. Your kind of thing.
Spec: [bountycaster.xyz or POIDH link]
```

DM via Farcaster DM (preferred) or Telegram if already connected.

### 5. ZOL Recast (If Configured)

If ZOL can see the /bounties cast and is configured to recast on ZAO keywords, it will auto-recast the bounty. If not, Zaal manually recasts from @bettercallzaal.

---

## Tracking: Who Replied?

Bounty replies come in as:
- Farcaster replies on the original cast
- GitHub PR submissions (verify the PR is real, addresses the bug)

**Zaal's weekly check (until Aug 10):** Scan replies on the Jul 25 Bountycaster cast. Any new claimant? DM them to confirm they understand the spec.

Doc 1534 covers the review and payout process after Aug 10.

---

## Channels to Cross-Post For Each Bounty

| Bounty | Primary | Secondary | X hashtag |
|--------|---------|-----------|-----------|
| R7 (bug fixes) | /bounties | /zabal | #web3bounty |
| R8 (Mini App) | /bounties | /zabal, /miniapps, /ethereum | #FarcasterMiniApp |
| R9 (marketplace) | /bounties | /zabal, /ethereum | #solidity #web3dev |

---

## Why Bountycaster Over GitHub Issues Alone

| Channel | Audience | Reach | Effort |
|---------|----------|-------|--------|
| POIDH | On-chain bounty hunters | Small (poidh.xyz audience) | Seed once |
| Bountycaster (/bounties) | Farcaster builders | 200-400 people browse /bounties | One cast |
| GitHub Issues (labelled `bounty`) | GitHub browser devs | Medium (depends on repo stars) | Label + description |
| X / Twitter | Broad web3 | Large (if reposted by Iman) | Requires cross-post |

Use all four in parallel for R7. The 10× lift comes from Bountycaster reaching the Farcaster-native builders who won't see POIDH or GitHub issues on their own.

---

## Sources

- Doc 1534: ZAO Devz bounty campaign design (R7/R8/R9 specs, POIDH setup, Iman roles)
- Bountycaster: bountycaster.xyz (live directory of Farcaster bounties)
- /bounties channel: warpcast.com/~/channel/bounties
- @bountybot: Farcaster's bounty indexer bot — tag it to ensure listing
