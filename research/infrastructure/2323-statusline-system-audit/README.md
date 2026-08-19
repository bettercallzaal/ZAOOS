---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-08-19
related-docs: 2319, 2321
original-query: "we still have 192 according to our status bar please audit our status bar stuff everywhere and /zao-research more about it and next steps with fixing it and updating it to have more important info"
tier: STANDARD
---

# 2323 - Status Line System Audit: where every number comes from, what lies, what to add

> **Goal:** Trace every number on the Claude Code status bar to its source, name what is stale or misleading (the "192" jam figure first), and specify the fixes plus the higher-value info the bar should carry (waiting lanes, tap count, cap state).

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | FIX the refresher's silent gh failure NOW: keep last-good values + an `err` flag instead of writing `""` | Measured live 2026-08-19: cache wrote `prs:""` and `ci:""` while `gh` interactively returned 5 and success - the needs-you count silently undercounted (showed 1, should be 2 at the PR>=5 threshold). A vanished segment is indistinguishable from healthy (silent-failure-guard) |
| 2 | ADD a LANES segment (working/waiting counts from local tmux) - the single most valuable missing number | The day's biggest ops finding (9 of 9 lanes waiting on Zaal, discovered only by a hand audit) was invisible to the bar that exists to surface exactly this |
| 3 | ADD a TAPS count + a CAP marker | Taps = clipboard pages awaiting sends (24h) + route=human cards due today. CAP = any local lane paused on the usage limit (5 lanes hit it in one hour on 2026-08-19 and nothing showed) |
| 4 | DE-DUPE the grill display: `192 open/192 queued` prints one quantity twice whenever requeued=0, and neither number is the board backlog | Show `grill <outstanding> / board <todo-total>` - two different truths instead of one truth twice |
| 5 | MERGE PR #3163 (grill auto-reconcile) before tuning any grill threshold | The 192 counts asked-but-unanswered Telegram cards and never learns about board closes; 23 stale entries were hand-reconciled 2026-08-19 (209 -> 186) and the number climbed back to 192 as ZOE kept sending. Until reconcile ships, the number cannot fall by working the board |

## How the status line actually works (provenance map, all paths verified 2026-08-19)

```
~/.claude/settings.json statusLine (refreshInterval 2)
  -> ~/bin/zao-cc-statusline.sh          (wrapper)
       1. [WORKING]/[WAITING] badge   <- ~/.claude/state/status-<session>.json
                                         flipped by hooks via zao-cc-state.sh
                                         (SessionStart/Notification/Stop -> WAITING,
                                          UserPromptSubmit/PreToolUse -> WORKING)
       2. [CAVEMAN] badge             <- caveman plugin statusline
       3. fleet segment               <- ~/bin/zao-statusline (python, render-only)
            reads ~/.zao/status.json (cache), NO network in the render path;
            kicks ~/bin/zao-status-refresh in background when cache age > 180s;
            paints a "?" staleness marker when age > 900s
  zao-status-refresh (background, lock-guarded) writes the cache:
    - prs:   gh REST /pulls count
    - zoe:   ssh vps systemctl is-active + 401-count from journal (auth-aware)
    - grill: ssh vps -> /home/zaal/.zao/zoe/backlog-grill-state.json
             outstanding = asked - answered - requeued  (THE 192)
             queued      = asked - answered             (incl requeued)
             age         = state-file mtime age
    - ci:    gh REST latest main run conclusion
    - needs: computed (grill>=20, prs>=5, ci!=success, zoe!=active)
```

All scripts are git-tracked in zaal-dotfiles (the vanishing-dependencies rule
held: zao-cc-state.sh carries its own 2026-08-12 rebuild scar in a comment).

## Findings

| # | Finding | Evidence |
|---|---------|----------|
| 1 | **The 192 is ZOE's Telegram-card debt, not the board queue.** It counts cards ZOE sent that were never answered via its buttons. Board has 346 open todos (37 routed to Zaal); the two numbers measure different things and only the unification PR #3163 makes them converge | VPS state file read 2026-08-19: asked 351+, answered 142+23 reconciled; board via cowork REST |
| 2 | **Silent gh degradation, live right now.** Cache at 13:06 held `prs:""`, `ci:""`; both commands succeed interactively (5 / success at 13:5x). Any transient gh failure erases the segment AND removes its needs-you contribution, with no error shown | ~/.zao/status.json vs direct `gh api` runs, both 2026-08-19 |
| 3 | **`open/queued` redundancy.** queued differs from open only by requeued cards; requeued=0 today, so the bar reads "192 open/192 queued" - one number twice. The intent (Zaal 2026-08-17: "not just 20/20 but like 150/200") wanted the WHOLE queue visible; the board total is the missing denominator | zao-status-refresh source + live cache |
| 4 | **Missing: lanes, taps, cap.** The bar knows nothing about local tmux lanes (9/9 waiting went unseen), pending Zaal taps (~15 at peak today), or cap-paused lanes (5 in one hour, each wedging typed directives) | 2026-08-19 workflow review, vault notes/workflow-review-2026-08-19.md |
| 5 | **What already works well:** render/refresh split (no network in the render path, Claude Code cancels in-flight scripts), atomic cache writes, staleness shown not hidden, quiet-when-healthy collapse, ZOE auth-aware liveness (post-401-incident), grill-age suffix | script sources, design comments verified against behavior |
| 6 | **GRILL_CEILING=200 hand-mirrors a VPS env var** (ZOE_GRILL_MAX_OUTSTANDING) - documented in-code, but it is another instance of the mirror-drift class the day kept finding | zao-statusline source |
| 7 | Official statusLine contract confirmed current: stdin JSON per update, ~300ms debounce, in-flight script cancelled on next update - the local design constraint comments match the shipped docs | code.claude.com/docs statusline page, fetched raw 2026-08-19 (70,460 bytes) |

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge PR #3163 (grill auto-reconcile + verdict sync) - jam number becomes board-truth; shipped-criteria: statusline grill count falls when board cards close | @Zaal | PR merge | 2026-08-21 |
| zaal-dotfiles PR: refresher keeps last-good prs/ci + writes `err_prs`/`err_ci` flags; render paints a dim `gh?` marker instead of dropping segments. Shipped: a forced gh failure still renders numbers + marker | @Zaal (fleet-build lane preps) | PR | 2026-08-22 |
| Same PR: LANES segment - refresher walks local tmux (zj's process-walk pattern) and caches `lanes_working`/`lanes_waiting`; render shows `lanes 3w/5z`, joins needs-you when waiting>=5. Shipped: bar shows lane counts within one refresh cycle | @Zaal (fleet-build lane preps) | PR | 2026-08-22 |
| Same PR: TAPS + CAP - taps = clipboard pages <24h + route=human due-today (cowork REST); cap = count of panes matching the usage-limit banner. Shipped: `taps N` and `CAP n` render when non-zero | @Zaal (fleet-build lane preps) | PR | 2026-08-22 |
| Same PR: grill display becomes `grill <open> / board <todo>` (drop queued when equal to open). Shipped: no duplicated number on the bar | @Zaal (fleet-build lane preps) | PR | 2026-08-22 |
| Pair with the tap-windows digest build (board card 190a964e) so bar counts and phone digest share one collector | @Zaal (agent lane) | Board card | 2026-08-24 |

## Also See

- [Doc 2319](../../dev-workflows/2319-handoff-workflow-audit/) - waiting% metric this bar should surface
- [Doc 2321](../../dev-workflows/2321-vault-organizer-pass/) - the organizer/queue system feeding the board counts
- Board cards: 6b6875d1 (grill unification, PR #3163), 190a964e (tap digest), 6437e936 (cap scheduler)
- Vault: notes/workflow-review-2026-08-19.md (the day's evidence base)

## Sources

- ~/zaal-dotfiles/bin/zao-cc-statusline.sh, zao-statusline, zao-status-refresh, zao-cc-state.sh - [FULL - read in entirety, method: direct file read 2026-08-19]
- ~/.zao/status.json live cache + mtime - [FULL - direct read, 2026-08-19 13:06 snapshot]
- /home/zaal/.zao/zoe/backlog-grill-state.json (VPS) - [FULL - read via ssh 2026-08-19; asked/answered/requeued counted]
- bot/src/zoe/backlog-grill-runner.ts (outstandingCount + nextTask) - [FULL - direct file read]
- `gh api` live comparisons (pulls count, actions conclusion) - [FULL - run directly 2026-08-19]
- [Claude Code status line docs](https://code.claude.com/docs/en/statusline.md) - [FULL - fetched raw via curl 2026-08-19, 70,460 bytes; verified stdin-JSON contract + 300ms debounce + in-flight cancellation]
- Community-source note: this is an internal-tooling audit; Reddit is walled from this machine (doc 2282) and no external community thread covers these private scripts. External grounding = the official statusline doc above.
