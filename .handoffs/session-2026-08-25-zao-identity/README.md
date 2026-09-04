---
lane: zao-identity
session: 2026-08-25
machine: mac
surface: orca (pane closing for app restart)
repo: /Users/zaalpanthaki/Documents/ZAO OS V1
worktree: /tmp/wt-2418b
branch: ws/research-2418-seniority-roster
orca-task: task_4474cefec1ca (zid-identity-buildout)
status: phase 1 complete, clean stop
---

# zao-identity - session 2026-08-25 - ZID phase 1 ground truth

## State: clean. Nothing in flight, nothing uncommitted, nothing half-written.

All work is committed and was already pushed before the no-push order. The
worktree is clean and `HEAD` equals `origin/ws/research-2418-seniority-roster`.

| Artifact | Where | State |
|---|---|---|
| Doc 2419 (renumbered from 2418) | `research/identity/2419-zid-state-and-signup-spec/README.md` | PR #3327 **MERGED** (as 2418), renumber in #3328 |
| Seniority roster, all 122 holders | `research/identity/2419-zid-state-and-signup-spec/seniority-roster.md` | PR #3328 **OPEN** |
| Vault note corrections | `~/zao-vault/projects/zao-token-holders-zids.md` | pushed, `0a08e2f` |
| Cross-lane map row | `~/zao-vault/handoffs/IN-FLIGHT.md` | pushed, `0a08e2f` |
| Orca worker_done | `msg_70f2d2859090` | sent |

**The one thing to watch on resume: PR #3328.** It carries the seniority roster
AND the 2418-to-2419 renumber. Until it merges, `main` has **two doc 2418s** -
`research/farcaster/2418-hypersnap-state-and-zao-feasibility` and
`research/identity/2418-zid-state-and-signup-spec`. That is a known, deliberate
temporary state, not drift. Nothing else depends on it.

## What was delivered (task spec had four items, all four done)

**1. Verify the migration was applied.** It is. `users.zid` is a live column on
the ZAOOS application database and `assign_next_zid` is a registered RPC. This
closes conflict 3 in the vault note, which had recorded it unverified because the
app database is a different Supabase project from the cowork tracker.

**2. Seniority query for the 122 holders.** Run. All 518 `Transfer` events,
complete history 2024-07-30 to 2025-12-20. All 122 ranked by first receipt with
**no ties**. Zaal is rank 1 on chain. Balance order and seniority order are
almost uncorrelated (Spearman rho **0.125**).

**3. Allocation policy.** Narrowed, not decided. 99 and 100 are eliminated by
arithmetic from two independent directions. Real choice is 500 or 1000.

**4. Signup-flow spec.** Seven requirements, four already hold. Section 4 of the
doc.

**Nothing was assigned, changed, or reserved.** The only call that touched
`assign_next_zid` used a deliberately invalid parameter name so PostgREST would
reject it before execution.

## The findings a resuming session must not re-derive

- **Three ZIDs exist: 1, 3, 4.** Zaal is **already ZID 1 in production**. ZID 2
  is a hole. So "Zaal is ZID 0" is now an `UPDATE` on a live row, not a naming
  choice, and it opens whether ZID 1 gets reassigned.
- **The Assign-ZID button has never run** - 0 `user.assign_zid` rows out of 38
  audit events. The whole mechanism is built, shipped, and never exercised.
- **Predicted latent bug:** `zid_seq` was never advanced, so the first press
  returns 1, collides with Zaal's existing 1, and throws a 500. The second press
  succeeds, which makes it look transient. Predicted, deliberately not triggered.
- **The "54.4% of Respect is unnameable" figure is an ENS artifact.** Real gap is
  **18.2%** (83 addresses, 6,986 of 38,484). Four of the five largest "unnamed"
  holders are already `users` rows.
- **`team_members.wallet` is empty** - 14 rows, 0 wallets. That lead is dead; do
  not re-check it.
- **ZID 3 is `ohnahji.eth`**, the address the whitepaper lane logged as having no
  ENS match and being undocumented anywhere.
- **The three hand-assigned ZIDs match seniority ranks 1, 2, 3 exactly**, offset
  by the hole at 2.
- **Doc 005 describes a different object** than what shipped and needs
  superseding.
- The Respect ledger has been **static since 2025-12-20**, so the roster will not
  drift while decisions are pending.

## Exact resume point

**Resume at: the Farcaster verified-address lookup over the 83 unmatched
holders.** It is the only remaining lead for shrinking the 18.2% naming gap and
it is fully specified:

```
GET https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=<csv>
    -H "x-api-key: $NEYNAR_API_KEY"
```

in chunks over the 83 addresses. The key is in the repo `.env`. The public
`user-by-verification` endpoint on both `api.farcaster.xyz` and
`client.farcaster.xyz` now returns 401, so Neynar is the path. This session hit a
permission prompt on that command and did not retry it, per the harness rule
about denied calls - so it needs either an approval or a differently shaped
command.

The addresses are derivable in one pass: fetch the 122 holders from Blockscout,
fetch `users` wallets, intersect, take the complement. Method is in doc 2419's
Method table.

**Second, if that is blocked:** nothing else in this lane can proceed without a
Zaal tap. Every remaining item below is gated.

## Open Zaal taps (6, all still open, none taken)

| # | Tap | What is already settled for him |
|---|---|---|
| 1 | ZID 0 vs staying ZID 1 | It is a live-row `UPDATE`, not a naming call. If 0, does ZID 1 get reassigned or stay empty? Either way `project_four_pillars` and doc 005 need correcting. |
| 2 | Reserved-block size | 99 and 100 eliminated by arithmetic twice over. **500 or 1000.** 1000 covers the whole 188-to-1,000 L6 journey. |
| 3 | What orders the reserved block | Roster now exists in full, so this is a choice about using a list, not a research task. Also worth asking whether the ZID-to-seniority match on 1/3/4 was deliberate. |
| 4 | Run the `setval` fix | `SELECT setval('zid_seq',(SELECT COALESCE(MAX(zid),0) FROM users));` - safe and idempotent under any answer to 2 and 3. Live write, so his. |
| 5 | Public/private field split for artist data | Three tiers proposed in doc 2419 section 4.4. Publishing artist details publishes about other people, so the tier-1 list is his approval, not an engineering default. |
| 6 | Whether ZID 2 stays a hole | Records say Candy; the database says nobody. |

Blocked sibling task `task_51b6759027de` (zid-allocation) is gated on tap 2, and
queue item 5 (community member write-ups) is gated on tap 3.

## Structural finding for the run, not for this lane

The hypersnap-research lane and this one branched off the **same** `origin/main`
(`98b825df`) minutes apart, both scanned 2418 as free, and both were correct at
scan time because neither had pushed. Both merged - hypersnap at 01:04:59Z
(#3326), this one at 01:07:41Z (#3327). Hypersnap was first, so this one
relocated to 2419.

The pre-flight collision scan cannot see a sibling that has not pushed yet. A
number-reservation step in the orchestration run would close it. Surfaced to the
coordinator in the worker_done message; not built here.

Related: PR #3327 also auto-merged **while a follow-up commit was being pushed to
its branch**, stranding that commit - `agent-loops.md` rule 37, recovered by
cherry-picking onto a fresh branch off current `main` rather than re-PRing the
stale one. That is what #3328 is.

## Not done, deliberately

- No ZID assigned, changed, or reserved.
- `zid_seq`'s current value not read - PostgREST does not expose sequences, and
  the alternatives were DDL or a call that burns a value.
- No ENS-to-person mapping attempted. The lane brief records two wrong matches
  from a fuzzy substring pass. An ENS name is a claim about a wallet, never proof
  of a person.
- Nothing pushed after the wind-down order. This handoff is committed only.
