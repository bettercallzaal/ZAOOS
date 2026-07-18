---
topic: technology, agents, farcaster
type: action-guide
status: DO NOW
last-validated: 2026-07-18
related-docs: 1269-zol-farcaster-music-scout-jul2026, 1512-zol-dreamloops-activation, 892-being-an-agent-on-farcaster-2026
board-task: ZOL: Farcaster wiki entries + deepen learning (Neynar)
action-owner: Zaal (run on Pi after ZOL PR #61 merges)
---

# 1515 — ZOL: Farcaster Wiki Entries + Neynar Learning Expansion

> **Goal:** Audit ZOL's current Neynar search terms and wiki grounding (`zao-context.md`), propose expansions, and identify stale facts to refresh. Concrete changes ready to apply on Pi.

---

## What ZOL's Learning System Does

ZOL has two learning mechanisms:

| Script | What it does | Output |
|--------|--------------|--------|
| `scripts/zol-neynar-learn.js` | Searches Neynar for ZAO-ecosystem terms, finds 5 most recent casts per term | Appends to `~/zol/farcaster-agent/neynar-learnings.md` |
| `scripts/zol-learn-zaal.js` | Monitors Zaal's Farcaster feed (FID 19640), summarizes posts, quote-casts every 4th strong one | Appends to `~/zol/zaal-learnings.md` |

The "wiki entries" referred to in the board task are ZOL's grounding docs:
- `docs/zao-context.md` in the ZOL repo — curated facts ZOL can safely reference
- ICM boxes at `useicm.com` — thezao, zabalgamez, zao-assistant (live); wavewarz, zaal (content drafted, not yet minted)

---

## Current Neynar Search Terms (Audit)

Default terms in `zol-neynar-learn.js` (as of Jul 2026):

```js
["The ZAO", "WaveWarZ", "ZABAL Gamez", "thezao.xyz", "COC Concertz"]
```

**Coverage gaps:**

| Missing term | Why it matters |
|-------------|----------------|
| `@zolbot` | ZOL's own handle — what are people saying about/to ZOL? |
| `Sparkz` | ZAO's upcoming creator token mechanism — who's talking about it already? |
| `ZOR` | ZAO's on-chain governance token — community mentions |
| `ZAOstock` | The Oct 3 flagship event — ticket interest, artist buzz |
| `ZABAL` | The ZAO's fungible reputation currency — community discussion |
| `BetterCallZaal` | Zaal's X/Farcaster handle — founder mentions often miss "The ZAO" framing |
| `ZAOville` | The June festival — post-event discussion still relevant |
| `zor holder` | Governance token holder discussions |

**Recommended expanded TERMS array:**

```js
const TERMS = process.argv.slice(2).length ? process.argv.slice(2) : [
  "The ZAO",
  "WaveWarZ",
  "ZABAL Gamez",
  "thezao.xyz",
  "COC Concertz",
  "@zolbot",
  "Sparkz ZAO",
  "ZAOstock",
  "ZABAL",
  "BetterCallZaal"
];
```

**Why not every term:** `zol-neynar-learn.js` makes one API call per term with a 5-cast limit. 10 terms = 10 Neynar calls, well within rate limits. Stay under ~15 to keep the learning pass fast (run daily or weekly).

---

## `zao-context.md` Stale Facts (Audit)

Source: `docs/zao-context.md` in ZOL repo, cross-checked against Jul 2026 ZAOOS docs.

| Section | Current claim | Status | Update |
|---------|--------------|--------|--------|
| ZOR holders | "156 unique Respect holders (122 OG + 55 ZOR, 21 hold both)" | **Stale** (Jul 5 data) | Pull fresh count from `zao.xyz/governance` or OREC contract |
| Respect Game weeks | "~100+ unbroken weeks since 2024-07-30" | **Stale** — now ~104 weeks (Jul 18 2026) | Update to "104+ unbroken weeks (as of Jul 2026)" |
| WaveWarZ volume | "~491 SOL (~$33K)... 8.7-8.9 SOL artist payouts" | **Directional only** (doc 974, Jul 6) | Safe to leave with the "never cite without live check" guard |
| ICM box wavewarz | "not yet minted" | **Possibly stale** | Verify at useicm.com — if live, update to "live" |
| ICM box zaal | "not yet minted" | **Possibly stale** | Verify at useicm.com — if live, update to "live" |
| Bonfire read path | "returns `[]` until admin runs labeling" | **Still accurate** (Jul 18) | No update needed |
| ZABAL Games 2026 | "July open build month (goal: 200 distinct builders)" | **Time-sensitive** | After Jul 31, update to actual builder count |

---

## Proposed `zao-context.md` Additions

The following topics are missing from `zao-context.md` entirely, but ZOL will need to reference them (especially after artist-spotlight-v1 activates):

### Add: COC Concertz
```markdown
## COC Concertz (source: ZAOOS research docs)

Monthly live-streamed music concerts produced by Zaal and The ZAO. 7 episodes as of Jul 2026,
unbroken monthly cadence since [launch date]. COC #7 was livestreamed [date]; COC #8 date TBD
(decision pending, doc 1511). Artists earn from the event pool; shows are archived and eligible
for JubJub monetization.

**ZOL guidance:** Reference COC when spotlighting COC artists. Never claim a specific attendance
or earnings number without checking live (same rule as WaveWarZ).
```

### Add: ZAOstock
```markdown
## ZAOstock 2026 (source: ZAOOS research + Eventbrite docs)

ZAO's flagship in-person music festival, scheduled Oct 3, 2026, Ellsworth ME (venue TBD).
General Admission $20 (Eventbrite). Features: WaveWarZ live community battle (charity donation
winner), Respect-weighted artist lineup vote, Fractal session. First live application of
Africa Battle Week format (Sep 26 digital preview). ZOR holders get the decision power on
charity recipient.

**ZOL guidance:** Can reference ZAOstock when spotlighting artists who will or might perform.
Never confirm lineup without Zaal's approval.
```

### Add: Sparkz
```markdown
## Sparkz (source: ZAOOS research docs 1095, 1094b, 1476)

ZAO's upcoming creator token mechanism. Deploys on Clanker (Base), each artist or creator
gets their own fungible token. "Access coins" or "culture coins" framing — not speculative
investment, but a cultural membership / access layer. Stage 1: ideation wizard (builder: Zaal).
Jango (creator #1) and Hurricane (creator #3, WaveWarZ founder) are planned early creators.
Timeline: V1 in progress; no public launch date as of Jul 2026.

**ZOL guidance:** Can reference Sparkz as "coming soon" or "in build." Never claim a launch
date or specific tokenomics without Zaal's sign-off.
```

---

## How to Apply These Changes on the Pi

### Step 1: Expand Neynar search terms

```bash
# On Pi: edit scripts/zol-neynar-learn.js
# Replace the TERMS line with the expanded array above
# Run a test pass:
node scripts/zol-neynar-learn.js
# Check output:
tail -50 ~/zol/farcaster-agent/neynar-learnings.md
```

### Step 2: Update `docs/zao-context.md`

```bash
# On Pi: edit docs/zao-context.md
# - Update ZOR holder count (pull from live source)
# - Update Respect Game week count (104+ as of Jul 18)
# - Add COC Concertz, ZAOstock, Sparkz sections
# Commit + PR to bettercallzaal/zol
```

### Step 3: Verify ICM box status

Visit `useicm.com` and search for:
- `wavewarz` — is the box live? If so, update `zao-context.md` source tag
- `zaal` — is the box live? If so, update `zao-context.md` source tag

---

## What "Wiki Entries" Likely Means for Farcaster

The Farcaster ecosystem maintains informal "wiki" entries — primarily:
1. **Warpcast profile bio** — ZOL's FID 3338501, @zolbot — should have a clear bio citing ZAO
2. **ICM boxes** — ZOL's primary grounding source (see above)
3. **`neynar-learnings.md`** — ZOL's growing Neynar search journal

A "Farcaster wiki entry" as a public-facing artifact means: when someone searches "ZAO" or "WaveWarZ" on Farcaster, ZOL's casts are the canonical signal. The goal is not a static wiki page but a continuous presence — which is exactly what the weekly-curator-v1 and artist-spotlight-v1 DreamLoops (now activated in PR #61) produce.

**One additional action:** Verify @zolbot's Warpcast profile bio accurately describes ZOL as "The ZAO's autonomous Farcaster music curator — artist-serving." If the bio is generic or empty, update it at warpcast.com/~/settings while logged in as @zolbot.

---

## Priority Order for Zaal on Pi

| Task | Estimated time | Blocking? |
|------|---------------|-----------|
| 1. Expand TERMS in `zol-neynar-learn.js` | 5 min | No, but improves signal immediately |
| 2. Run `node scripts/zol-neynar-learn.js` with new terms | 2 min | No |
| 3. Update `zao-context.md`: week count + COC/ZAOstock/Sparkz sections | 20 min | No, but ZOL's drafts will be better |
| 4. Verify ICM box status (wavewarz, zaal) at useicm.com | 5 min | No |
| 5. Check @zolbot Warpcast bio | 2 min | No |
| 6. Commit `zao-context.md` + TERMS change as a PR to bettercallzaal/zol | 5 min | No |

Total: ~35 minutes on Pi. No new dependencies, no API keys beyond what ZOL already has.

---

## Related Docs

- [Doc 1269 — ZOL identity + DreamLoop architecture](../../identity/1269-zol-farcaster-music-scout-jul2026/) — FID 3338501, ICM box architecture, 20 DreamLoop manifests
- [Doc 1512 — ZOL DreamLoops activation](./1512-zol-dreamloops-weekly-curator-artist-spotlight/) — PR #61, Pi activation checklist
- [Doc 892 — Being an agent on Farcaster 2026](../farcaster/892-being-an-agent-on-farcaster-2026/) — Neynar score, ZOL silence heuristic

## Sources

- ZOL repo: `docs/zao-context.md` (Jul 18, 2026 audit)
- ZOL repo: `scripts/zol-neynar-learn.js` (Jul 18, 2026 audit)
- ZAOOS research docs: 1269, 1512, 892, 1095, 1094b, 1476, 1511
