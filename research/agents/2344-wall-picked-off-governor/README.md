# The Wall Governor: cap what is PICKED OFF, not what is working

**Doc 2344** | **Status:** SPEC (no code in this PR, no daemon ever) | **Card:** 6437e936 | **Owner:** fleet-build lane | **Date:** 2026-08-20

## Executive summary

The original card said "cap scheduler - max 2-3 hot lanes, rest queued." Zaal's naming of the lane surface as THE WALL inverted that spec, and this doc locks the inverted design: the governor caps ZAAL'S ATTENTION (max 2-3 lanes picked off the wall at once), never the number of lanes working. Lanes on the wall should be many and all producing. There is no daemon - every mechanism below is state read at render time by `zj`/`zao-wall`, plus explicit one-tap commands.

Zaal, verbatim: "lets call it the wall so i can have things on the wall autonomous but i can pick things off the wall and have them be active."

## Why this is urgent (measured 2026-08-20)

A 48h audit found 45 of 46 Claude sessions stamped WAITING and exactly ONE working. 13 of 14 lanes idle, 3 parked on menus only Zaal can answer, 14 PRs open on his merge. On 2026-08-19, 5 lanes hit the shared Claude cap in one hour, pausing mid-work and wedging typed directives. The bottleneck was never capacity - it was that everything routed back to Zaal while the wall sat still.

## The model (two states, one invariant)

| State | Meaning | Behavior | Count |
|---|---|---|---|
| ON THE WALL | autonomous | takes the recommended option on every non-gated call, keeps going; blocks ONLY on money / public-outbound / irreversible / Zaal-only facts (lane-autonomy, PR #3161) | unbounded - more is better |
| PICKED OFF | active, Zaal engaged | menus, taste calls, gated taps live here | max 2-3 |

**The invariant: an idle lane that is on the wall is a BUG, not a resting state.** A wall lane stopped on a non-gated question means its brief failed to grant the autonomy it needed - the defect is in the brief, and the fix is a brief repair, not an answer relayed through Zaal.

## Design

### 1. Picked-off is an explicit mark, never an inference

State lives in one file: `~/.claude/state/picked.json` - `{"picked": [{"proj": ..., "session": ..., "at": ...}]}`.

**Naming reconciliation (2026-08-20, same day):** the metawall lane shipped `zao-wall` in ZAOOS PR #3196 while this spec was being written - the BOARD half (which CARDS each lane owns: `--claim/--release/--unclaimed`). Its docstring already names the missing "other half"; THIS spec is that other half - the SESSION half (which LANES Zaal has picked). One wall, one command: pick/hang extend the SAME `zao-wall` tool once #3196 merges, not a second binary:

```
zao-wall --pick <lane>    # Zaal engages a lane - add to picked set
zao-wall --hang <lane>    # back on the wall - remove from picked set
zao-wall --picked         # picked set + count, "N/3"
```

`pick` past 3 does NOT refuse (never block Zaal) - it prints which lanes are currently picked and asks which to hang, exactly one prompt. Why explicit and not inferred: inferring engagement from prompt activity misreads every metawall/lane-send push as Zaal, and misreads a quiet-but-engaged lane as abandoned. The mark is one tap and always true (state-claims: name the source - here the source is Zaal's own declaration).

### 2. zj renders the two states at a glance

- New column: `PICKED` / `wall` per Claude lane (join on proj+session against picked.json).
- Header line: `picked-off: N/3`, amber past 3.
- `zj --next`: with everything shipped elsewhere in this queue, "next" means the wall lane MOST WORTH PICKING - oldest WAITING lane whose last line is a gated ask. It suggests; it never acts.

### 3. Cap-pause detection demotes, render-time only

zj already reads pane text. Add one pattern: the usage-limit banner ("usage limit", "resets at") tags the lane `CAPPED`. A capped lane cannot be meaningfully picked, so it renders as wall+CAPPED regardless of the picked set (the mark is retained and revives when the banner clears). No process is touched - detection changes a label, never a lane.

### 4. Idle-on-wall is surfaced as a defect

Definition: a wall lane WAITING > 30 min whose last line is NOT a gated ask. Renders in zj as `IDLE-BUG`, and `zao-tap-digest` (card 190a964e, dotfiles PR #48) grows one section: "idle-on-wall (brief defects): N" listing them. The remedy named in the digest line is "repair the brief", not "answer the question" - answering through Zaal is exactly the routing this kills.

Gated-ask detection is honest-first: v1 treats a lane as gated-blocked only when its status `last` line or pane tail matches the gate vocabulary (merge/approve/publish/send/pay/migration/Zaal). Anything else waiting is presumed a defect and listed; a false positive costs one glance, a false negative hides a stalled lane for a day (measured: two lanes sat five days on a trust prompt reading as healthy).

### 5. What was deliberately dropped from the original card

- **"Starting a 4th lane prompts which to pause or queues the wake"** - dropped. Pausing/queueing WORK is capping the wrong resource; wall lanes are supposed to be many.
- **Any daemon** - dropped. All state is read when a human (or metawall) runs zj/zao-wall/tap-digest. A governor daemon is a new autonomous loop and would need its own doc + approval (no-new-bots rule); nothing here needs one.
- **"fleet" naming** - unavailable; fleet already means the VPS cheap-loops.

## DONE WHEN (from the card, restated against this design)

1. zj distinguishes on-the-wall from picked-off at a glance - column + N/3 header.
2. A lane idle on a non-gated question is treated as a defect in its brief - IDLE-BUG in zj + a tap-digest section naming the brief as the fix.
3. The picked-off count is visible and holdable at 2-3 - `zao-wall list`, the zj header, and the over-cap hang prompt.

## Implementation plan (follow-up PRs, all small)

1. Extend `zao-wall` (ZAOOS scripts/agents/zao-wall.py, PR #3196) with `--pick/--hang/--picked` + picked.json - after #3196 merges.
2. zj patch (zaal-dotfiles): picked column, N/3 header, CAPPED tag, IDLE-BUG tag, `--next` reread. One PR, no behavior change to attach/jump.
3. `zao-tap-digest` idle-on-wall section (3 lines, after PR #48 merges).

Each lands as its own card so the wall can pick them up independently.

## 2026-08-22 Review Notes

- **Spec status confirmed:** This is a pure spec doc (no code, no daemon). The "cap what's PICKED OFF, not what's working" design is the confirmed intent. Board card 6437e936 tracks implementation.
- **Connection to statusline (doc 2323):** The wall governor's attention-cap (max 2-3 lanes picked off) feeds directly into the LANES segment proposed in doc 2323 — the bar would show `lanes 3w/5z` (working/waiting). The two specs are complementary; the statusline audit (due Aug 22) was the visible surface, this doc is the attention model underneath it.
- **Wall system now under test:** As of this review (2026-08-22), the ZOE research pipeline has been down since 21:07 UTC (auth expiry, doc 2377). With ZOE autonomous work paused, Zaal's manual attention is the only active lane — exactly the scenario the wall governor is designed to help manage.

## Sources

- Card 6437e936 (Supabase cowork tracker) - original spec + the 2026-08-20 re-spec written into its notes after Zaal named the wall.
- lane-autonomy rule (PR #3161); the 48h idle audit (45/46 WAITING, 2026-08-20 morning); the 2026-08-19 five-lanes-capped-in-one-hour incident.
- Live code read: `~/bin/zj` (probe + pane-text state machine, the NEVER-STARTED/TRUST-GATE precedent), `~/bin/zao-cc-state.sh` + transitions log (dotfiles PR #46), `zao-tap-digest` (PR #48).
- Siblings: doc 2314 (fleet interface - the phone side of the same nervous system), handoff-discipline.md (waiting% metric this governor exists to drive down).
