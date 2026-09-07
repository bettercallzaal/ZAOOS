---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-07
superseded-by:
related-docs: 2469, 2470, 2198, 2178, 1006
original-query: "/zao-research our workflwo please"
tier: STANDARD
---

# 2471 — Our workflow: what it is, and the one gap that makes tools disappear

> **Goal:** Measure the ZAO lane workflow end to end and find where it actually
> breaks. It breaks in one place nobody was watching: **a merged PR does not reach
> the machine.** Four tools built this week are in git and not installed, including
> the sweep the orchestrator seat uses to see its own lanes.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Add an install step to the definition of done for any `bin/` tool.** A tool is not shipped when its PR merges; it is shipped when `which <tool>` answers | Four tools merged this week, zero installed. Measured below |
| 2 | **Do NOT run `bootstrap.sh` to fix it.** It symlinks `bin/` wholesale and would hide `~/bin/ww-set-rpc`, which exists only there | The documented mechanism is right in principle and destructive in this state. Zaal's call, not a lane's |
| 3 | **Keep copies, not symlinks, and add a sync check** | chezmoi's argument applies here: this estate runs a mac, a Pi and a VPS with different tool sets, and a symlink farm assumes identical machines |
| 4 | **Lane count is not the constraint. Idle capacity is** | 8 idle lanes measured, exactly 1 genuinely blocked. Adding or merging lanes changes nothing |
| 5 | **The board must never drop a card silently** | 362 of 575 open cards appear in no view of the tool that exists to show them |

## The workflow, measured 2026-09-07

| Layer | What it is | Size |
|---|---|---|
| **Lanes** | tmux sessions, one Claude each, briefed from `handoffs/<lane>.md` | 14 sessions, 10 live, 3 empty shells |
| **The board** | `zj` - joins `~/.claude/state/status-<sid>.json` to `tmux list-sessions` | 1,232 lines |
| **Outbound** | `lane-send` types into a pane. Lands every time | 288 lines |
| **Inbound** | `zao-sweep` asks via pane, reads answers from `handoffs/status/<lane>.md` | 199 lines |
| **The lock** | `zorca-lock` - one orchestrator seat at a time | 37 lines |
| **Cards** | `zao-wall.py` against Supabase | 240 lines |
| **Briefs** | `handoffs/*.md`, one per lane, plus status files | 71 briefs, 10 status |
| **Conventions** | `notes/orca-organization.md` | 11 in-file, numbered to 20; 9 hazards |
| **Loops** | mac crontab, plus 7 Pi scripts | 8 mac + 7 Pi |

Inbound is a file, not a message, for a measured reason: `SendMessage` resolves by
name against a registry holding **732 peers**, most of them dead Remote Control
rows, and roughly four sends in six fail. `lane-send` types into a pane and always
lands. **The request goes out through the channel that works; the answer comes back
through the channel that persists.**

## THE FINDING: a merged PR does not reach the machine

`$PATH` contains `~/bin`. It does **not** contain `~/zaal-dotfiles/bin`. And
`~/bin` is a real directory of **copies** — `~/bin/lane-send` is a regular file
dated 2 September, not a symlink.

So the install path is manual, undocumented in practice, and nobody was doing it.
Measured today, in the repo and **not installed**:

```
zao-sweep              199 lines   the seat's own status sweep
zao-research-health    196 lines   2,172 docs, 218 colliding numbers
zao-research-snapshot  246 lines   the GitHub-creator CRM
zao-skill-audit        197 lines   82 skills, 54 never invoked
zorca-actuator, zorca-actuator-test, zorca-gui-test, zorca-lane-enqueue
```

**`zao-sweep` is the sharpest case.** It was built on 2026-09-06 to fix a sweep
that half-worked, tested against the live estate, PR'd, and merged into
`zaal-dotfiles` main on 2026-09-07. It ran fine all through its own development —
from the working tree of its feature branch. **The moment its PR merged and the
branch was deleted, the file left the working tree**, and because it had never been
copied to `~/bin`, `which zao-sweep` returned nothing.

The tool the orchestrator uses to see whether its lanes are alive was uninstalled
by the act of merging it.

Nothing failed. No error, no missing-file message in any log, no check. The next
`zao-sweep` invocation would simply have said `command not found`, and the seat
would have concluded the lanes were quiet.

**This is the estate's own named signature failure**, and the repo says so in its
own words. From `bin/zao-vault-toc`, written 2026-09-02 about a different tool:

> A tool that exists, works, and runs nowhere is the estate's signature failure -
> so the fix is the wiring, not another manual run.

That header then adds, dated 2026-09-04: **"it happened again."** This is the third
recorded instance and the first where the tool was the observability layer itself.

### Why `bootstrap.sh` is not the fix, today

`bootstrap.sh:32` does `link "$REPO/bin" "$HOME/bin"` — it symlinks the whole
directory, and `README.md:13` documents `bin/` as symlinked. **The documented design
and the actual state disagree**, which is its own finding.

Running it now would back up `~/bin` and replace it with a symlink. That would
install all eight missing tools in one step. It would also hide **`ww-set-rpc`**,
which exists in `~/bin` and in no repo — it would survive only inside
`~/bin.<timestamp>.bak`.

That is a decision about how every tool on the machine resolves, so it is Zaal's.
The four tools were installed as copies instead, matching the current state, and
verified by outcome: `zao-sweep` now reports 10 live lanes and
`zao-research-health` reports 2,172 docs.

## Four more gaps, all measured today

**The board hides 63% of its own work.** `zao-wall.py`'s `bucket()` sorts on
`lane`, `route=agent` and `route=human`, and silently drops everything else. Of 575
open cards: 114 on the wall, 40 unclaimed, 59 needs-Zaal — and **362 in no bucket
at all** (233 at `route='prep'`, 129 with no route). Hidden inside them: 11
ZAOSTOCK cards with the event 26 days out, 10 ARTIZEN cards, and 13 marked
`in_progress` that no view shows.

**Idle capacity, not lane count, is the constraint.** Of eight idle lanes, exactly
one was genuinely blocked. The rest said plainly that nothing blocked them — they
had no next task. Routing 64 cards onto lanes moved unclaimed from 104 to 40 in
under a minute, and within the hour three lanes had returned a card as "not mine"
and the open count had fallen 575 → 569 without anyone being asked.

**Two needs-Zaal lists exist and neither knows about the other.** The board holds
59 `route=human` cards; the vault holds `handoffs/needs-zaal.md`. Reconciling them
is chosen and unstarted.

**A tap is not a measurement, and the seat made that error today.** An
orchestrator-built page asked "Created the three Drive folders yet?" with yes/no
buttons. Zaal tapped yes. The seat relayed that to two lanes as measured fact
without reading the Drive it can read directly. The folders did not exist; the
`Artists/` directory had not changed since 24 August. Same family as everything
above: **a signal treated as evidence because checking was one step further than
anyone went.**

## What the field does, and where we differ

Dotfiles practice splits exactly on our question. GNU Stow and its successors are
**symlink farms**: one repo, symlinks into `$HOME`, and the stated benefit is
sharing files across devices. chezmoi deliberately **copies**, and its argument is
the one that applies to us — symlinks only work when the file is identical on every
machine, and templating for machine-specific differences is why copying wins.

This estate runs a mac, a Pi (`ansuz`) and a VPS with genuinely different tool
sets: the Pi runs `start-fleet.sh` and seven daemons that have no meaning on the
mac. **So copying is the right call and the README is wrong**, not the other way
round. What is missing is not symlinks; it is a **check that the copy is current**,
which neither approach gives you for free.

Nothing in the search surfaced a named pattern for "merged but never installed" in
an agent-operated repo. Treat that as a gap in the literature rather than evidence
it is rare — this estate hit it three times in six days.

## Also see

- **Doc 2469** — loops vs graphs; "the loop lives inside a node, the graph lives
  between them". **NOT YET MERGED** — still on `ws/research-2469-*`, so there is no
  path to link. Verified 2026-09-07; link it when that branch lands
- **Doc 2470** — avoiding fabrication in agentic systems, which this document is the
  sibling of. **NOT YET MERGED**, same reason
- [Doc 2198](../../agents/2198-agent-orchestration-production-harness-loop/) — what teams actually run
- [Doc 1006](../1006-agentic-coding-weaknesses-easy-fixes/) — agentic coding weaknesses

## Next actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide symlink vs copy for `~/bin`, knowing `ww-set-rpc` exists only there — shipped when `README.md:13` matches reality either way | @Zaal | Decision | 2026-09-12 |
| Add `which <tool>` to the definition of done for any `bin/` PR — shipped when it is a line in `notes/orca-organization.md` as convention 21 | @Zaal (seat drafts) | Convention | 2026-09-09 |
| Give `zao-wall.py` a fourth bucket so no card is dropped — shipped when `--json` counts sum to `open` | @Zaal (any lane) | PR | 2026-09-12 |
| Reconcile the board's 59 `route=human` cards into `handoffs/needs-zaal.md` — shipped when the board's needs_zaal count is 0 or every card is mirrored | @Zaal (obsidian lane) | PR | 2026-09-14 |
| Re-run `zao-skill-audit` now that it is installed — shipped when a measured number replaces the 2026-09-06 one | @Zaal (seat) | Measurement | 2026-09-09 |

## Sources

- `~/zaal-dotfiles/bootstrap.sh`, `README.md`, `bin/zao-vault-toc` — **[FULL]** read on disk 2026-09-07
- `~/zaal-dotfiles/bin/*` vs `~/bin/*` — **[FULL]** `comm` against `git ls-tree origin/main`, 2026-09-07
- `~/Documents/ZAO OS V1/scripts/agents/zao-wall.py` — **[FULL]** read, and its buckets counted against a live 575-card fetch
- `~/zao-vault/handoffs/`, `notes/orca-organization.md` — **[FULL]** counted 2026-09-07
- [Managing dotfiles with chezmoi | Lobsters](https://lobste.rs/s/czy3bp/managing_dotfiles_with_chezmoi) — **[PARTIAL]** search-result synthesis; the symlink-vs-copy argument is quoted from the result summary, not the thread
- [Better Dotfiles | Hacker News](https://news.ycombinator.com/item?id=41453264) — **[PARTIAL]** same
- [Using GNU Stow to manage your dotfiles | Hacker News](https://news.ycombinator.com/item?id=25549462) — **[PARTIAL]** same
- [chezmoi discussion #4533](https://github.com/twpayne/chezmoi/discussions/4533) — **[PARTIAL]** same

**Honest limit on the external half.** The three community sources are
**PARTIAL**: they came back as search-result summaries and the fetch ladder was not
climbed on them, because the load-bearing half of this document is the internal
measurement and padding it with un-fetched threads would be the exact failure
Convention 20 describes. The symlink-vs-copy reasoning is directionally quoted,
not verbatim. **Do not cite this doc for what the chezmoi maintainers said.**
