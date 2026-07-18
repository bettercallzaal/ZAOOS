---
topic: technology, agents
type: action-complete
status: PR-open
last-validated: 2026-07-18
related-docs: 1269-zol-farcaster-music-scout-jul2026, 1083, 892-being-an-agent-on-farcaster-2026
board-task: ZOL: flip on the 2 new DreamLoops (weekly-curator + artist-spotlight)
action-owner: Zaal (merge PR #61 in bettercallzaal/zol after Pi dry-run passes)
---

# 1512 — ZOL DreamLoops Activated: weekly-curator-v1 + artist-spotlight-v1

> **Status:** ZOL PR #61 open (`feat/activate-weekly-curator-artist-spotlight`). Merge after running dry-runs on the Pi. No auto-post risk — both loops are draft-only, human-gated.

---

## What Was Done

Two ZOL DreamLoops were promoted from `status: "draft"` to `"active_local"` and added to the `scheduledLoops` array in `scripts/dl-run.js`. They now execute when `DREAMLOOPS_ENABLED=1` is set in the Pi's `/home/zaal/.zao/private/zol.env`.

| Loop | Manifest | Trigger | Output |
|------|----------|---------|--------|
| `weekly-curator-v1` | `loops/weekly-curator-v1.manifest.json` | Weekly, Monday 6am UTC | Draft recap of ZOL's last 7 days → `~/zol/drafts/`, requires Zaal approval |
| `artist-spotlight-v1` | `loops/artist-spotlight-v1.manifest.json` | Weekly / on-demand | Draft spotlight of a ZAO/COC/WaveWarZ artist → `~/zol/drafts/`, requires Zaal approval |

**Both loops are draft-only.** No auto-posting. All output goes to `~/zol/drafts/` and waits for Zaal's approval via ZOE Telegram.

---

## Why These Two

ZOL's four capability lanes are: Song of Day, Artist Spotlight, Onboarding Concierge, and Curate-to-Reward. These two loops directly cover two of the four:

- **artist-spotlight-v1** → Lane 2 (Artist Spotlight): short profiles of ZAO/COC/WaveWarZ artists, rotating with a 60-day cooldown per artist
- **weekly-curator-v1** → Lane 1/4 hybrid: a weekly recap of ZOL's best finds, pulling from `recent-casts.json` + Bonfire recall

Both had their handlers (`src/handlers/weekly-curator.js`, `src/handlers/artist-spotlight.js`) and dry-run scripts (`scripts/dl-dry-run-weekly-curator.js`, `scripts/dl-dry-run-artist-spotlight.js`) already written and merged. Activation was blocked only on manifest status + `scheduledLoops` registration.

---

## How DreamLoops Work in ZOL

`scripts/dl-run.js` is the orchestrator. It:
1. Checks `DREAMLOOPS_ENABLED=1` — exits cleanly if off (zero disruption to existing ZOL behavior)
2. Loads the `zol-overlay-v1` capsule (permission boundary)
3. Runs each loop in `scheduledLoops` in order, loading its manifest from `loops/`
4. Writes a receipt per loop; exits 1 if any loop errored

Each loop has its own cooldown enforcement:
- `weekly-curator-v1`: `check-week-already-done` step skips if already ran this calendar week (writes sentinel to state)
- `artist-spotlight-v1`: 60-day history state prevents artist repeats across runs

**Safe to add to the daily cycle** — both no-op after their first weekly run.

---

## Activation Checklist (for Zaal on Pi)

- [ ] `git pull` on Pi (ZOL repo) to get PR #61 after merge
- [ ] `node scripts/dl-dry-run-weekly-curator.js` → all PASS
- [ ] `node scripts/dl-dry-run-artist-spotlight.js` → all PASS
- [ ] `DREAMLOOPS_ENABLED=1 node scripts/dl-run.js` (mock mode) → both loops appear in summary
- [ ] Verify weekly-curator draft lands in `~/zol/drafts/` with `staged-for-approval`
- [ ] Verify artist-spotlight draft lands in `~/zol/drafts/` with `staged-for-approval`
- [ ] Set `DREAMLOOPS_ENABLED=1` in `/home/zaal/.zao/private/zol.env` to make it permanent
- [ ] First real draft: Zaal reviews via ZOE Telegram → approve to post

---

## What Didn't Change

- All existing ZOL services (`zol-daily`, `zol-reply`, `zol-calendar`) are untouched
- No new systemd units needed — weekly loops enforce their own cooldown internally
- `DREAMLOOPS_ENABLED` defaults to `0`; existing ZOL behavior is preserved until Zaal sets the flag

---

## Post-Activation: What ZOL Starts Producing

Once enabled, ZOL will draft (but not post without approval):

**Weekly Curator (Mondays):**
> ZOL has been listening. This week's best find: [artist/track] — [1-2 lines of genuine context, not hype]. [Warpcast link to the artist's cast or track]

**Artist Spotlight (weekly/on-demand):**
> [Artist name] — [what they make, what they've shipped, why they matter to ZAO]. Find them at [handle]. [Farcaster cast link]

Both drafts land in `~/zol/drafts/` → ZOE pings Zaal → Zaal approves/rejects per cast. No autonomous posting.

---

## Related Docs

- [Doc 1269 — ZOL Identity + DreamLoop architecture](../../identity/1269-zol-farcaster-music-scout-jul2026/) — ZOL FID, architecture, 20 DreamLoop manifest list
- [Doc 892 — Being an agent on Farcaster 2026](../farcaster/892-being-an-agent-on-farcaster-2026/) — Neynar score, ZOL operating norms, silence heuristic
- [Doc 1083 — ZAO brand identity](../../identity/1083-zao-brand-identity/) — ZOL's voice constitution (inherited from ZOE)

## Source

- ZOL repo: `bettercallzaal/zol` — `loops/` directory, `scripts/dl-run.js` (verified 2026-07-18)
- ZOL PR #61: `feat/activate-weekly-curator-artist-spotlight`
