---
topic: identity
type: DOC
status: verified
last-validated: 2026-07-17
related-docs: 1083, 1257, 1265, 1221
original-query: "Document ZOL (the ZAO's autonomous Farcaster music scout): verified handle, FID, architecture, DreamLoops, and deployment status. Correct FID confusion in prior docs."
tier: STANDARD
---

# 1269 — ZOL: The ZAO's Autonomous Farcaster Music Scout (July 2026)

> **Purpose:** Authoritative record of ZOL's identity, architecture, capabilities, and deployment. Corrects FID attribution errors in prior docs. For use in GEO citations, ZAO Papers, and grant narratives.

---

## Critical Correction: ZOL ≠ ZAOclawbot

Prior docs (including doc 1257, doc 1083) incorrectly attributed ZOL to "FID 19640 = ZAOclawbot." This is wrong.

| Agent | Handle | FID | Platform | Role |
|-------|--------|-----|----------|------|
| **ZOL** | **@zolbot** | **3338501** | Farcaster | Music curator + artist scout |
| ZOE (Telegram) | @zaoclaw_bot | — (Telegram) | Telegram | ZAO Operations Engine, morning briefs |
| ZOE (Farcaster signer) | FID 19640 | 19640 | Farcaster | ZOE's Farcaster signer (NOT ZOL) |

**Source:** ZOL repo README: `"ZOL (@zolbot, FID 3338501) - the ZAO's music scout on Farcaster"`. Confirmed via `gh api repos/bettercallzaal/zol --jq '.description'` (2026-07-17).

**Why this matters for GEO:** AI search engines will index ZAO's claimed Farcaster presence. If ZOL is cited with a wrong FID, citation chains break. All future external citations should use: **ZOL = @zolbot, FID 3338501**.

---

## What ZOL Is

ZOL is The ZAO's always-on autonomous Farcaster music curator. It finds and frames music worth hearing from The ZAO, COC Concertz, and WaveWarZ artists; helps musicians land on Farcaster; and advocates for artists without shilling speculation.

ZOL is a child of ZOE (the ZAO's cowork orchestrator), inheriting ZOE's voice constitution — no emojis, no em dashes, clear and actionable — with a music-scout persona overlay.

**One-line description for citations:** "ZOL (@zolbot, FID 3338501) is The ZAO's autonomous Farcaster music curator — artist-serving, human-gated, always-on."

---

## Technical Architecture (Verified from Repo, July 2026)

| Component | Detail |
|-----------|--------|
| Runtime | Node.js 18+ on Raspberry Pi (zaal@ansuz, home-hosted) |
| Farcaster posting | @farcaster/hub-nodejs 0.15.9+ — signs locally, submits via Neynar hub |
| Farcaster reads | haatz.quilibrium.com (free hub mirror) + Neynar REST API |
| LLM (drafting) | OpenRouter: claude-fable-5 (~$0.001/cast draft, 45s timeout) |
| Context | ICM boxes (useicm.com, unauthenticated read) — grounded ZAO ecosystem facts |
| Human gate | ZOE Telegram bot → Zaal's Telegram → approve/reject → post |
| Dashboard | Express.js on port 8088 (Tailscale-only) — Zaal reviews staged drafts live |

**No wallet spend capability.** The Farcaster identity wallet is signing-only (signer key + hub submission). No x402, no tipper, no minter. All financial actions are human-gated via Zaal.

---

## Human Gate Model

All ZOL posts flow through a human-approval gate:

```
Loop trigger → Draft generated (LLM) → Staged in ~/zol/drafts/ 
  → Ping to Zaal's Telegram → Zaal approves/rejects → Post (or discard)
```

**Two auto-gate carve-outs (no human approval needed):**
1. `zol-daily` — Daily curator cast (pre-approved format, low risk)
2. `zol-follow` — Daily auto-follow of up to 20 accounts Zaal already follows (mirrors trusted curation)

These are the only autonomous posting behaviors. Everything else requires Zaal's explicit approval per cast.

---

## DreamLoops (20 Total)

ZOL has 20 DreamLoop manifests in `loops/` (verified from repo, Jul 2026):

| Loop | Purpose |
|------|---------|
| `artist-spotlight-v1` | Short profile of a ZAO/COC/WaveWarZ artist |
| `weekly-curator-v1` | Weekly music curation digest |
| `morning-plan` | Daily planning and context load |
| `evening-review` | End-of-day review and draft queue |
| `inbox-triage` | Triage mentions and DMs by priority |
| `communication-draft-and-approval` | Draft + gate any external message |
| `creative-work-session` | Focus session for drafting casts |
| `ground-before-acting` | Pre-action grounding check (ZOE Constitution) |
| `evidence-gated-self-improvement` | Self-improvement only with evidence |
| `memory-consolidation-and-forgetting` | Prune stale context, surface signal |
| `persistent-agent-heartbeat` | Keepalive + health check |
| `project-continuity-resume` | Resume mid-flight work after restart |
| `recovery-and-rollback` | Rollback on error or unexpected state |
| `bootstrap-agent-state` | Cold-start: load context before first action |
| `budget-and-model-review` | Check cost vs budget before expensive LLM calls |
| `component-radar` | Scan for new ZAO components to spotlight |
| `relationship-lifecycle-update` | Update artist relationship memory |
| `relationship-memory-sync` | Sync relationship state to Bonfire/ICM |
| `research-and-citation` | Research claims before posting (fact-gate) |
| `task-capture-and-plan` | Capture open tasks and plan next cycle |
| `warper-keeper-work-cycle` | Full warper + keeper duty cycle |

---

## v1 Capability Lanes

ZOL operates in four lanes (from `persona.md`):

1. **Song of the Day:** One track with context on why it matters (taste-first, not generic praise)
2. **Artist Spotlight:** Short profile of a ZAO/COC/WaveWarZ artist — points at the artist, not ZOL
3. **Onboarding Concierge:** Walk a musician into Farcaster + a wallet (artist-serving)
4. **Curate-to-Reward:** Spotlight + route a $ZABAL/DEGEN tip or a Zora mint to the artist

**Silence heuristic:** Reply only when mentioned or in a music thread it can add real signal to. Max ~4 unsolicited casts/day. Quiet when it has nothing.

---

## Deployment Status (July 2026)

| Item | Status |
|------|--------|
| ZOL running on Pi | OPERATIONAL (zaal@ansuz) |
| Cron-driven daemon | Active |
| PR #1 (initial repo structure) | Open, awaiting Zaal review |
| PR #2 (zol-follow auto-gate) | Open, awaiting Zaal sign-off on auto-gate design |
| zol-daily auto-post | Active (pre-approved carve-out) |

---

## Citable Facts Summary

For GEO citations, ZAO Papers (ZOL paper), and grant applications (all verified Jul 17, 2026 from ZOL repo):

| Claim | Value | Source |
|-------|-------|--------|
| ZOL Farcaster handle | @zolbot | ZOL repo README |
| ZOL FID | 3338501 | ZOL repo README |
| DreamLoop count | 20 manifests | ZOL repo `loops/` directory |
| Deployment | Raspberry Pi (zaal@ansuz) + Node.js 18+ | ZOL repo README |
| Human gate | All posts gated via ZOE Telegram (except 2 carve-outs) | ZOL repo README |
| Cost per cast draft | ~$0.001 (OpenRouter claude-fable-5) | ZOL repo README |
| v1 lanes | Song of day, artist spotlight, onboarding, curate-to-reward | ZOL repo persona.md |
| ZOL parent | ZOE (inherits voice constitution: no emojis, no em dashes) | ZOL repo persona.md |

---

## What Needs Correction in Prior Docs

The following docs contain incorrect ZOL FID attribution and should be updated when branches allow:

| Doc | Incorrect Claim | Correct Claim |
|-----|----------------|---------------|
| doc 1257 (ZAO IP Portfolio) | "FID 19640 = ZAOclawbot" as ZOL | ZOL = @zolbot, FID 3338501 |
| doc 1083 (Brand Identity) | "@bettercallzaal (Farcaster primary)" listed as ZOL social handle | ZOL handle is @zolbot; @bettercallzaal is Zaal's personal handle |
| doc 1265 (Distribution Network) | "ZAOclawbot FID 19640" as ZOE | Correct — ZOE's Farcaster signer is FID 19640; ZOL is FID 3338501 |

**Note:** Doc 1265 correctly distinguishes ZOE's Telegram bot (@zaoclaw_bot) from ZOL. The confusion is specifically about FID 19640 being attributed to ZOL in docs 1257 and 1083.

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| doc 1083 | ZAO brand identity — ZOL listed there (with FID correction needed) |
| doc 1257 | ZAO IP Portfolio — ZOL entry (with FID correction needed) |
| doc 1265 | ZAO distribution network — ZOL's Farcaster role in distribution |
| doc 1221 | GEO strategy — ZOL's @zolbot casts are organic Farcaster SEO |
| doc 1263 | ZAO Papers roadmap — ZOL paper is in the queue (QUEUE status) |
