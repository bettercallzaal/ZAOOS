---
topic: agents
type: audit
status: research-complete
last-validated: 2026-07-28
related-docs: 928, 2103
original-query: "Deep audit of the fleet / multi-terminal coordination layer (Zaal's self-identified weakest area) and start shipping fixes toward killing the clipboard paste-bus. 2-hour autonomous block."
tier: DEEP
---

# 2104 - Fleet / multi-terminal coordination - deep audit + first fixes

> **Goal:** Ground the real state of the fleet/multi-terminal layer, find why the clipboard paste-bus persists, and ship the first fixes toward killing it. All findings verified against live state (branch refs, session state, live DB), not assumed.

## Key findings (grounded)

1. **The paste-bus is a two-terminal relay through Zaal, not a fleet-wide problem.** Live right now: 2 human-driven CC terminals (ZOE + cowork, both WORKING) + 9 autonomous VPS loops. The loops poll the cowork board and ask via `zao-ask` (Telegram) - they coordinate fine. The paste-bus is specifically **ZOE <-> cowork**, two human-driven sessions that neither poll a shared channel, so Zaal copy-pastes between them. The fix is a channel those two (and any terminal) can read/write without a human relay.
2. **Coordination tooling is all *status*, no *messaging*.** `cockpit`, `zao-fleet` (TG push), `zao-harness` (web GUI) all show you *what needs you*. `zao-ask` sends questions *to Zaal*. There was **no terminal-to-terminal message relay** - the exact gap the paste-bus fills by hand.
3. **Branch graveyard: 709 ws/ branches, only 5 merged.** ~700 are unmerged; just **4 have an open PR**. So ~700 are orphaned - 97 from April, 163 May, 147 June, 297 July. This bloats every `git fetch` AND poisons the `/zao-research` doc-numbering scan (which reads `ws/research-*` refs - the root of the 2026-07-22 trillion-doc-number bug). It's also a blunt signal that the fleet creates far more branches than it lands.
4. **`cockpit`'s HOLDS line is hardcoded** (a static string edited by hand), so it goes stale silently - the opposite of the board-as-living-doc principle everything else follows.

## Fixes shipped this block (tested, live)

### `zao-relay` + `zao-inbox` - terminal-to-terminal message relay (the paste-bus fix)
Migration-free cross-machine messaging over the shared cowork Supabase (one "relay hub" row, `legacy_id 9000`, messages in its `metadata.relays[]` - zero board pollution, no schema change). Works from the Mac, the VPS loops, and the Pi - anything with the cowork creds.

```
zao-relay send <to-lane> "<message>"   # drop a message into a lane's inbox
zao-inbox <my-lane>                     # read + ACK my messages (thin wrapper)
zao-relay peek <lane>                   # read without acking
zao-relay count                         # pending-per-lane (cockpit reads this)
```

Tested end-to-end: send zoe->cowork, `count` showed `cowork:1`, `zao-inbox cowork` printed + acked it, `count` went empty. Instead of Zaal copy-pasting ZOE's message into the cowork terminal, ZOE runs `zao-relay send cowork "..."` and the cowork terminal runs `zao-inbox cowork` (one command, pulls all pending). Multiple relays accumulate and drain in one read.

### `cockpit` relay surface
`cockpit` now shows `RELAYS  pending: cowork:1` at a glance (reads `zao-relay count`, degrades silently if unavailable). So Zaal *sees* cross-terminal messages waiting without being the live relay himself.

### `zao-branch-prune` - the branch-graveyard tool
Categorizes every ws/ branch: MERGED (safe delete), ORPHAN (unmerged + no open PR + older than AGE_DAYS), INFLIGHT (open-PR or recent - **never** deleted). Dry-run by default; `--execute merged|orphan` to act; `AGE_DAYS` tunable. Ran this block: deleted the **5 merged + 86 orphans >90d** (709 -> 618). The ~300 orphans in the 30-90d band are tool-ready for Zaal's one-command sweep.

## Why the relay actually reduces the paste-bus

The paste-bus cost is per-message copy+paste in both directions. The relay changes it to: sender runs one `send`, receiver runs one `inbox` that drains *all* pending messages. For the autonomous loops it's a poll they already do (board-adjacent). For the two human terminals it's one command instead of N copy-pastes. Full elimination needs the receiving terminal to auto-run `zao-inbox` at session start (a hook) - that's the next step, boarded below.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Wire `zao-inbox <lane>` into each terminal's session-start hook so relays surface with zero prompt | @Zaal | Config | 2026-08-04 |
| ZOE uses `zao-relay send cowork` instead of clipboards for cowork coordination (adopt it) | @Zaal (ZOE) | Behavior | 2026-07-28 |
| Sweep the 30-90d orphan branches: `AGE_DAYS=30 zao-branch-prune --execute orphan` (~300) | @Zaal | Command | 2026-08-04 |
| Make `cockpit` HOLDS dynamic (read from a board lane / open-PR labels) instead of the hardcoded string | @Zaal | Bot task | 2026-08-08 |

## Also See

- [Doc 2103](../2103-grounding-beats-guessing/) - the grounding discipline this audit practiced (verified every claim vs live state)
- [Doc 928](../928-agent-loop-best-practices/) - agent loop operating rules

## Sources

- First-party, all verified live 2026-07-28: `git ls-remote`/`branch -r --merged` (branch counts), `~/.claude/state/status-*.json` (live sessions), `~/bin/{cockpit,zao-fleet,zao-harness,zao-ask,zao-relay,zao-branch-prune}` (fleet tooling), the cowork Supabase (relay + branch tests). [FULL]
