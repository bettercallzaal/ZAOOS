---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "2444, 2434, 2198, 2178, 2127, 2319, 2324, 928, 2349, 2461, 2471, 2407, 875"
original-query: "/zao-research the best practices for building an orchestrator and lets build this into the next claude code session."
tier: DEEP
---

# 2456 - Orchestrator practice, measured against our own run: the estate is right about supervision and wrong about where its own state lives

> **Goal:** Test the seven measured findings of ZAO's 2026-08-31/09-01 orchestration run against a decade of outside practice, answer the five open questions in the `orcresearch` brief, and name the concrete divergences. Every recommendation is grounded in that run, not in generic advice.

## Re-research summary, 2026-09-25 (read this first)

**The centerpiece finding - the live `zao-lanes` tmux prefix-match bug - was fixed, and fixed the same week this doc was written.** `~/zaal-dotfiles/bin/zao-lanes` commit `1311c97` (Tue Sep 1 06:56:47 2026 -0400) moved `classify()` to `-t "=name:"` (exact session match, trailing colon required) and made a paneless row render `NO-PANE`, a state excluded from `UNREACHABLE_STATES`'s complement (i.e. never treated as healthy). Re-measured live today: `tmux capture-pane -p -t "=this-lane-definitely-does-not-exist-zz9:"` returns rc=1 `can't find session`, with no prefix-match onto any real session. The fix's own commit message records the exact positive control the Next Actions table asked for - `-t '=invented:' rc=1 refuses` - measured before the fix shipped. **Caveat:** that control lives in the commit message, not in the automated `--selftest` suite; `SELFTEST_CASES` in the script tests the text-based question/unsent detectors against captured pane fixtures, not a live-tmux invented-session assertion. `zao-lanes --selftest` passes today (5 pane shapes, 2 status lines) but does not itself re-run the invented-name check on every invocation. Net: **fixed and verified twice (commit-time and today), not self-guarding against regression** the way the Next Action literally asked for.

**Decision 9 (this doc's own recommendation) was wrong about direction, and the correction is instructive.** This doc recommended folding lane tooling *into* `zorca` because it was "public, MIT, already documents its conventions." What actually happened, decided 2026-09-06 and recorded in `zorca/README.md` plus `~/zao-vault/notes/zao-orchestrator-2026-09-05.md`: **`zorca` was retired to a pointer and the layer consolidated into `zaal-dotfiles/bin` instead** - the opposite move. Reasoning on record: `zaal-dotfiles/bin` already held 105-109 of the tools, `~/bin` already pointed there, and `zorca`'s three surviving tools were two-thirds stale (`zorca-brief` was an 18-line stub of a 113-line tool - the safety tool that exists because Orca drops the head of long messages - and anyone cloning the "public MIT orchestration layer" got the broken copy). The four tools that existed *only* in zorca (`zorca-actuator`, `zorca-actuator-test`, `zorca-gui-test`, `zorca-lane-enqueue`, 845 lines) were merged into dotfiles first (PR #103), verified present, and only then was zorca gutted - explicitly to avoid the "diff before you delete" failure this same estate paid for once on a 39-worktree consolidation. Being public and MIT was not the deciding factor; being where the tools and the symlink already were, was. **This doc's own diagnosis (decision 9, "no single home") was correct; its prescription (which direction) was not what Zaal chose.**

**Between this doc and the decision, a second research doc intervened and should have been the one this doc's Next Action deferred to.** [Doc 2461](../2461-herdr-agent-runtime/) (STANDARD, same day, 2026-09-01) found a 34,377-star Apache-2.0 runtime (`herdr`) whose entire pitch is the exact gap this doc's decision 9 treats as a repo-location question: semantic agent state (`blocked/working/done/idle`) as a first-class runtime feature instead of scraped pane text. Its Next Actions explicitly said "hold the zorca lane-tool consolidation until [herdr evaluation] lands." That hold was not the path taken - the consolidation happened anyway on 2026-09-06, and nothing in the record shows herdr's install script was ever read or a lane run under it. herdr is worth flagging again here because it is still unresolved, not because the consolidation ignored it maliciously - the two docs' Next Actions simply pointed in different directions and the faster one won.

**Reddit access changed twice more since 09-01, and today it works - the doc's own FAILED marking is now stale.** `zao-fetch-reddit.sh --selftest` today still reports creds ABSENT and the public `.json` walled (unchanged since 08-14). But `zao-fetch-reddit.sh <url>` itself, run live today against a real thread (`r/vibecoding` `1wjydgz`), **returned full post text, score and author via Arctic Shift** (`arctic-shift.photon-reddit.com`, keyless, added to the script as v6 on 2026-08-23). This doc's FAILED marking reflected the state before that route existed. Mark reddit **PARTIAL->FULL depending on route**: `--selftest`'s canned checks (token/oauth/`.json`) are still all failing exactly as before, but the actual working path the script falls back to is live and was just used successfully. The credential Next Action (`~/.zao/private/reddit.env`) is still not done and is no longer the blocker it was.

**Not yet done, unchanged since 09-01:** the brief template gained no `output format` or `effort budget` fields (checked `~/zao-vault/handoffs/TEMPLATE.md` in full - it added a `status:` five-value taxonomy and a "what was tried and did NOT work" section since, both good, but not the two fields this doc asked for). `zao-selftest` (now 2,284 lines, grown substantially) has no detection-time or reset-time metric anywhere - grepped the whole file and the wider `bin/` tree for `detection.time`/`reset.time`/`MTTR`; zero hits outside an unrelated rate-limit "reset time" in `zao-repo-scout`. The two playbooks were **not** consolidated by cross-reference the way decision 6 asked (see below) - they independently converged in content instead.

**Shipped and not asked for by name, but answering the same Next Action:** a `/lane-init` skill exists at `~/.claude/skills/lane-init/SKILL.md` (created 2026-09-09), matching the proposed initializer almost exactly - "Author a lane's founding brief by MEASURING the world rather than recalling it. Produces the brief, a JSON done-list the lane may only flip booleans in, and the first commit." Its own rationale cites the same four false-brief incidents this doc's era produced. This is the strongest single piece of follow-through in the whole Next Actions table.

---

## Key Decisions (recommendations first, 2026-09-01 grades kept; 2026-09-25 status added)

| # | Decision | Grounded in | Grade | 2026-09-25 status |
|---|---|---|---|---|
| 1 | **Fix `zao-lanes` first: it reported one lane's health on another lane's row today, with exit code 0.** `classify()` calls `tmux capture-pane -t <name>` for lanes that came from `claude agents --json` and have no tmux session. tmux **prefix-matches**, so `-t orc` resolved to the `orcresearch` pane. Measured with controls: `orc` and `orcresearch` captures were byte-identical (`diff -q` equal), `-t zaostock` returned rc=1 "can't find pane". Use exact-match targets (`-t "=name"`) and render a native-only lane as NO-PANE, never as a state. | `~/zaal-dotfiles/bin/zao-lanes:150`. 5 agents in the registry, 3 tmux sessions. The board showed `orc WORKING ctx 23%` for a session the brief says was at 81%. | A | **SHIPPED, commit `1311c97`, 2026-09-01. Re-verified live 2026-09-25.** |
| 2 | **The orchestrator's context problem is not solved by handoff or compaction. It is solved by never holding the messy work.** Hightouch's "dynamic subagents": the main thread offloads any multi-step subtask to an isolated thread and gets back only the answer. Their words: compaction approaches "patch up the symptoms without addressing the root cause: you're cleaning up after the fact." orc hit 81% because it did lane work itself, not because 10 hours is too long. | Amplify/Hightouch (FULL); Anthropic multi-agent (FULL): "spawn fresh subagents with clean contexts while maintaining continuity through careful handoffs" | A | Not independently re-measured this cycle; no contradicting evidence found. |
| 3 | **ADOPT the initializer/worker split. ZAO has the worker prompt and no initializer.** | Anthropic, *Effective harnesses for long-running agents*, 2025-11-26 (FULL) | A | **SHIPPED - `/lane-init` skill, `~/.claude/skills/lane-init/`, created 2026-09-09.** |
| 4 | **Keep the completion state in JSON, not prose.** | Measured `~/zao-vault/handoffs/*.md`, n=73, mean 136 lines | A | The `lane-init` skill produces "a JSON done-list the lane may only flip booleans in" per its own description - this is now built into the initializer rather than into the template. |
| 5 | **The estate's supervision rules are ahead of the published literature - keep them.** | Anthropic multi-agent (FULL) vs `~/zao-vault/notes/lane-supervision-playbook.md` | A | No new literature found that changes this; holds. |
| 6 | **Consolidate the two playbooks.** `zorca/PLAYBOOK.md` (2026-08-25) and `~/zao-vault/notes/lane-supervision-playbook.md` (2026-08-31). | Both files read 2026-09-01 | A | **NOT done as a merge.** `zorca/PLAYBOOK.md` was updated 2026-09-01 (its own `updated:` field) but still does not cite the vault note or vice versa - see below. |
| 7 | **Silence-as-health is a solved problem: the dead-man's switch, and SRE's rule is that a page must be actionable.** | `sre.google/sre-book/...` (FULL), `sre.google/workbook/...` (FULL) | A | Sources re-fetched and re-quoted 2026-09-25, unchanged. |
| 8 | **Some lanes should be cron.** | Anthropic multi-agent (FULL); HN 46081704 (FULL); `.claude/rules/code-over-inference.md` | A | Holds; no new evidence against it. |
| 9 | **The lane tooling has no single home... Decide the home before adding more tools.** | Measured across `~/Documents/zorca`, `~/zaal-dotfiles/bin` (101 scripts), `~/zao-status/bin` (10), `bettercallzaal/hermes-orchestrator` | B | **DECIDED, 2026-09-06 - in the opposite direction this doc recommended.** See summary above. Diagnosis correct; prescription wrong. |

---

## Zaal's question: is there a repo for the ZAO lanes?

Asked mid-session on 2026-09-01: *"see if theres a repo for that and then we can open that repo and dive in more to improving that with our orchestration."*

**As of 2026-09-01, yes, four of them, and that was the problem. As of 2026-09-25, the answer has changed: one of the four retired itself.**

| Repo | Visibility / licence | Size (09-01) | Size (09-25, re-measured) | Runs daily? |
|---|---|---|---|---|
| [`bettercallzaal/zorca`](https://github.com/bettercallzaal/zorca) | public, **MIT** (LICENSE file re-read 2026-09-25: unchanged, MIT, Zaal/The ZAO copyright) | 30 files, 8,003 LOC, described as "the ZAO orchestration layer" | **Retired to a pointer README, 2026-09-06. `gh api` today: 0 stars, size 370 KB, pushed 2026-09-21. Local checkout: 38 files, 8,314 total lines (mostly `.git`-adjacent docs/README/PLAYBOOK now, not tools).** | No - explicitly says so in its own README |
| `bettercallzaal/zaal-dotfiles` (`~/bin` is a symlink into it) | private | 101 scripts | **259 files in `bin/`, 70,016 total lines. `~/bin` confirmed still a symlink to this directory (re-verified 2026-09-25; also independently re-confirmed by doc 2471 on 09-07/09-08 after an initial misreading).** | yes |
| `bettercallzaal/zao-status` | private | 10 scripts | 10 scripts, unchanged | yes |
| [`bettercallzaal/hermes-orchestrator`](https://github.com/bettercallzaal/hermes-orchestrator) | public, 1 star, pushed 2026-08-31, "not cloned on this Mac" | 75 KB | **`gh api` today: 2 stars (was 1), pushed 2026-09-01, size 95 KB. NOW CLONED at `~/Documents/hermes-orchestrator` (commit `b3a77bd`, Tue Sep 1 13:44:02 2026). Contains real `src/` (router, orchestrator, supervisor, learner, autonomy, adapters) at package.json version 0.5.0 - more than the README's own header claims ("pre-alpha... first working code lands in PR1"), which is itself now stale relative to the code.** | not cloned on this Mac -> **now cloned, still not run** |

The improvement-target recommendation this doc made ("the improvement target is `zorca`... fold the vault playbook in, move the lane tools out of dotfiles into it") **was not what happened.** `zaal-dotfiles/bin` absorbed the four zorca-only tools (`zorca-actuator`, `zorca-actuator-test`, `zorca-gui-test`, `zorca-lane-enqueue`, 845 lines, via PR #103) and `zorca` was retired to a pointer instead, per `zorca/README.md` and `~/zao-vault/notes/zao-orchestrator-2026-09-05.md`. Verified 2026-09-25: `zorca/README.md` states "109 tools in `zaal-dotfiles/bin`... all four present and executable" as the outcome, and that the local `zorca` checkout was found 4 commits behind origin at the time of the decision - a fact this doc did not have.

---

## The live finding: the board lied on 2026-09-01, and the fix landed the same day

`zao-lanes` builds its row list from two sources and says so in a comment at `~/zaal-dotfiles/bin/zao-lanes`:

> "Neither source is authoritative alone... Reading one is how a monitor reports health it cannot see."

`classify(name)` ran `tmux capture-pane -p -t <name>` for **every** row, including rows that came only from `claude agents --json` and had no tmux session at all. Measured on 2026-09-01 10:45 EDT: `-t orc` and `-t orcresearch` were byte-identical (3,804 bytes each), `-t zaostock` correctly failed with rc=1. The board printed `WORKING orc ctx 23%` for a session actually at 81%.

**Updated 2026-09-25: this was fixed the same day it was found.** Commit `1311c97` ("fix(zao-lanes): tmux -t prefix-matched, so lanes reported each other's state"), authored by Zaal, Tue Sep 1 06:56:47 2026 -0400. The commit message is worth quoting because it documents a wrong first attempt and the correction, which is exactly the discipline this doc argued for elsewhere: the author's first fix was `-t "=name"` (no trailing colon), which is parsed as a tmux *window* target and always returns rc=1 - so the board went uniformly blank. The corrected form, `-t "=name:"` (trailing colon forces an exact *session* match), was verified with the same three-lane control this doc used:

```
-t '=orcresearch:'  rc=0  reads      -t '=orc:'       rc=1  refuses
-t '=obsidian:'     rc=0  reads      -t '=zaostock:'  rc=1  refuses
-t '=zaofractal:'   rc=0  reads      -t '=invented:'  rc=1  refuses
```

Re-run today (2026-09-25) against a genuinely invented session name: `tmux capture-pane -p -t "=this-lane-definitely-does-not-exist-zz9:"` returns rc=1, `can't find session`, against a live tmux server with 5 real sessions (`dotfiles2`, `dreamnet`, `finance`, `grill`, `zaoonparagraph`) - no prefix-match false positive. `classify()` returns `NO-PANE` on any such rc!=0, and `NO-PANE` is in `UNREACHABLE_STATES` alongside `ASKING` and `DEAD` - it cannot render as a healthy state. `zao-lanes --selftest` runs today and passes (5 pane shapes, 2 status lines).

**The one gap against the literal Next Action:** "selftest asserts an invented lane returns NO-PANE" was verified *once*, by hand, in the commit that shipped the fix - it is not wired into `SELFTEST_CASES` (which cover the text-based ASKING/unsent detectors against captured fixtures) as a standing regression guard. A future edit to the `-t` construction would not be caught by `--selftest` today; it would need to be caught by re-running the manual three-lane control shown above. This is a real, if narrow, gap - the fix is correct and live, but not self-defending.

Same failure family as the 2026-08-29 `orchestrators.json` incident (an audit that killed a live orchestrator on "no Orca pane"). That mechanism (treating absence-of-pane as information about the named thing) is now explicitly guarded against here via `NO-PANE` as a distinct, unreachable state.

---

## The five questions in the brief, answered (2026-09-01 findings; re-verified 2026-09-25 where checkable)

### 1. Context exhaustion - what does practice actually do?

Four distinct positions found, and they are not variants of each other.

| Position | Source | Mechanism | Verdict for ZAO |
|---|---|---|---|
| **Bridge it** - progress file + git log + feature list, read at session start | Anthropic, *Effective harnesses*, 2025-11-26 (FULL, re-fetched 2026-09-25, HTTP 200, quote intact) | "an initializer agent that sets up the environment on the first run, and a coding agent tasked with making incremental progress in every session, while leaving clear artifacts for the next" | **ZAO now does both halves.** `/lane-init` (created 2026-09-09) is the initializer this doc asked for. |
| **Never fill it** - offload every multi-step subtask to an isolated thread, keep only the answer | Hightouch via Amplify (FULL, re-fetched 2026-09-25, HTTP 200, quotes intact) | `write_file`/`read_file` buffering plus "dynamic subagents"; "maintain context density without losing any fidelity" | Still the direct answer to orc-at-81%; no new evidence this was implemented as a mechanism. |
| **Spawn a successor** - fresh subagent with a clean context, continuity through handoff | Anthropic multi-agent (FULL, re-fetched 2026-09-25, HTTP 200, quote intact) | plan saved to Memory because ">200,000 tokens... will be truncated" | Already ZAO's `handoff-discipline.md`. Unchanged. |
| **Throw it away** - do not bridge at all | HN 46081704, `mips_avatar` (FULL, re-fetched 2026-09-25, thread still resolves, 125 points / 37 comments, author present) | "If the piece didn't work out by the time you hit 200k context on Claude you are going to start over... throw the code out." | Genuine dissent, unchanged. |

Also re-checked: HN `zacwellmer` on compaction ("borks our sessions... good luck keeping your skills and prompts intact") - thread `46695855` still resolves, 45 points, created 2026-01-20, author and quote both present.

### 2. Supervision topology

Anthropic's limits quote re-verified verbatim in the 2026-09-25 refetch: "our lead agents execute subagents synchronously... the lead agent can't steer subagents, subagents can't coordinate, and the entire system can be blocked while waiting for a single subagent to finish searching." ZAO's `SendMessage`/`lane-send` answer remains unchanged and current.

`daxfohl`'s dissent on a supervisor-as-agent (HN 46081704) re-verified present in the thread today, same text. No update to ZAO's `zao-evaluator` design found this cycle.

### 3. What belongs in a brief

Anthropic's four-field contract re-verified. **Updated 2026-09-25: the brief template itself was not extended with `output format` or `effort budget`** - read `~/zao-vault/handoffs/TEMPLATE.md` in full (4,161 bytes, last modified 2026-09-07). It gained a `status:` five-value taxonomy (`unconsumed`/`consumed`/`ready`/`closed`/`superseded`) and a "what was tried and did NOT work" section - both real improvements, neither the one asked for. The gap this doc identified (73 briefs, output format and effort budget both weak-to-absent) is unresolved by the template; it may be resolved procedurally by `/lane-init`, which measures rather than asserts, but that skill's own text does not mention an output-format or effort-budget field either. **Open.**

### 4. Liveness and heartbeats

SRE's four-parameter framing (precision, recall, detection time, reset time) re-verified in the 2026-09-25 refetch of the SRE Workbook - the exact phrase "precision, recall, detection time, and reset time simultaneously" is still on the page. **Updated 2026-09-25: detection time and reset time are still unmeasured anywhere in the estate.** `zao-selftest` (grown from its 09-01 state to 2,284 lines) now has considerably more heartbeat-style checks (`heartbeats`, per-job `job:*` checks with last-run timestamps, `notify-delivered`) but none of them compute or print a detection-time or reset-time number - they report "beating within window" (a precision/recall-shaped pass/fail), not "N minutes to detect, N minutes to clear." Grepped the whole `zaal-dotfiles/bin` tree for `detection.time|reset.time|MTTR`; only unrelated hit is a rate-limit "reset time" string in `zao-repo-scout`. **Not shipped.**

### 5. When NOT to orchestrate

No new evidence found this cycle contradicting the cost/fit/90-10-curve argument. HN `roughly` quote re-verified present in thread 46081704 today.

---

## The seven findings, scored against outside practice (unchanged 2026-09-25 unless noted)

| # | ZAO finding (measured 2026-08-31/09-01) | Outside practice says | Net | 2026-09-25 |
|---|---|---|---|---|
| 1 | Silence is the dominant failure mode | Dead-man's switch; SRE symptom-over-cause | CONFIRMED | Detection/reset time still not added as numbers - see Q4 above. |
| 2 | A presence-only check passes when its subject is dead | SRE's symptom vs cause | CONFIRMED | The live instance (`zao-lanes`) that motivated this is now fixed. |
| 3 | The verification is likelier to be wrong than the thing verified | HN `adidoit` on strong-worded instructions | CONFIRMED | `zao-assert` still the correct response; this doc's own re-research followed the same discipline throughout (re-measured rather than re-asserted every claim). |
| 4 | Neither party wins by rank | Not found anywhere in the literature | ZAO ORIGINAL | Unchanged; still not published to `zorca/PLAYBOOK.md` as this doc recommended. |
| 5 | Relay only what changes the principal's next action | Independently rediscovered by Anthropic and SRE | CONFIRMED | Unchanged. |
| 6 | Two writers in one working tree is the recurring collision | HN `yaskou`, re-verified present in thread 48680842 today | CONFIRMED | Unchanged; doc 2471 found a related but distinct collision class (merged-but-not-installed tools) the same month. |
| 7 | Delegation is bounded by brief quality | Anthropic's field list | CONFIRMED | `/lane-init` now exists to enforce this; brief template itself still lacks output-format/effort-budget fields. |

---

## Contradictions left standing (not synthesised away)

1. **Bridge vs restart** (Anthropic vs `mips_avatar`). Still unresolved in general; both sources re-verified live 2026-09-25.
2. **Separate evaluator agent: works or does not** (ZAO `loop-evals.md` vs HN `daxfohl`). Unresolved; `daxfohl`'s comment re-verified present.
3. **Anthropic's own future-work admission** ("it's still unclear whether a single, general-purpose coding agent performs best... or a multi-agent architecture") - unchanged in the 2026-09-25 refetch.
4. **New, found this cycle: this doc's own decision 9 vs the path actually taken.** Not a literature contradiction - a self-contradiction between what this doc recommended (fold into zorca) and what Zaal decided six days later (retire zorca into dotfiles). Recorded plainly above rather than smoothed over.

## Playbook consolidation (decision 6) - re-checked 2026-09-25

`zorca/PLAYBOOK.md` frontmatter: `updated: 2026-09-01` (was `2026-08-25` at last validation - it moved, contrary to what a stale, un-consolidated file would look like). `~/zao-vault/notes/lane-supervision-playbook.md` remains a separate file, undated in frontmatter but content-dated "31 August 2026" in its own first line. **Grep of each for the other's name still returns nothing** - the two were not formally merged or cross-linked, but `zorca/PLAYBOOK.md`'s content did move forward on its own, so the two have not diverged further even though they were never united. This is a partial, not a full, resolution of decision 6.

## Staleness audit, 2026-09-25

- Anthropic *Effective harnesses*: published 2025-11-26, now ~10 months old. Re-fetched, HTTP 200, 15,173 characters of stripped text, all quoted lines verified present.
- Anthropic multi-agent Research post: re-fetched, HTTP 200, 27,834 characters, all quoted lines verified present including the 90.2% figure.
- Google SRE Book ch.6 / SRE Workbook ch.5: re-fetched, HTTP 200 both, all quoted lines verified present. Stable, as expected for a 2016/2018 source.
- Hightouch/Amplify: re-fetched, HTTP 200, all quoted lines verified present.
- HN 46081704 / 46695855 / 48680842: all three re-fetched via the Algolia items API. Points and dates match the original doc exactly (125/45/6 points; 2025-11-28, 2026-01-20 and 2026-06-26). Total comment counts (recursively counted, not just top-level): 37 / 5 / 7. Every named commenter (`mips_avatar`, `imron`, `_boffin_`, `daxfohl`, `adidoit`, `threecheese`, `roughly`, `vidarh`, `zacwellmer`, `verdverm`, `yaskou`) confirmed still present with matching text.
- `zorca/PLAYBOOK.md`: no longer 7 days stale against the vault playbook - both are current, but still uncited by each other.
- LangGraph multi-agent concepts page: re-checked, same failure as before - `curl` returns HTTP 200 with 549 bytes (empty shell); the alternate `docs.langchain.com` path now returns HTTP 404 (previously also 404). Still not cited for any quote. No change.

---

## Also See

- [Doc 2444](../2444-always-on-orchestrator/) - the tick, the 91.5% context-handling figure, and the registry that decision 1 extends
- [Doc 2434](../2434-harness-engineering-six-layer-map/) - the six-layer harness map
- [Doc 2198](../2198-agent-orchestration-production-harness-loop/) - harness vs loop; the gate is everything
- [Doc 2178](../2178-agent-harness-orchestrator-workers/) - one orchestrator, many workers
- [Doc 2127](../2127-loop-harness-engineering-anthropic/) - loop/harness engineering alignment audit
- [Doc 928](../928-agent-loop-best-practices/) - the base rulebook behind `.claude/rules/agent-loops.md`
- [Doc 2349](../../infrastructure/2349-vps-loop-starvation/) - the 13 loops that wrote nothing in seven days (note: bare "2349" is ambiguous - `governance/2349-dkp-points-rewards-model` also exists; this is the infrastructure one)
- [Doc 2461](../2461-herdr-agent-runtime/) - NEW (2026-09-01, same week): the herdr runtime evaluation that asked to hold the exact consolidation this doc's decision 9 recommended, and was not the path taken
- [Doc 2471](../../dev-workflows/2471-zao-lane-workflow-audit/) - NEW (2026-09-07, corrected 2026-09-08): confirms `~/bin` is a symlink to `zaal-dotfiles/bin`, and finds a related but distinct failure - merged tools not reaching `$PATH`
- [Doc 2407](../../dev-workflows/2407-orca-tmux-lane-integration/) - Orca and the Wall blind in the same way
- [Doc 875](../875-nousresearch-hermes-7day-setup-vs-zao-hermes/) - the other Hermes, name-collision with `hermes-orchestrator`

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| ~~`zao-lanes` targets `-t "=name"` and renders NO-PANE for registry-only lanes~~ - **SHIPPED**, commit `1311c97`, 2026-09-01 | @Zaal | PR (zaal-dotfiles) | DONE 2026-09-01 |
| Wire the invented-lane-name -> NO-PANE control into `zao-lanes --selftest`'s `SELFTEST_CASES` as a live regression guard (currently only verified by hand in the fix commit) (shipped = selftest asserts it on every run) | @Zaal | PR (zaal-dotfiles) | 2026-10-03 |
| ~~Fold `lane-supervision-playbook.md` into `zorca/PLAYBOOK.md`~~ - **NOT DONE as a merge**; both updated independently and still do not cite each other. Add the cross-reference (shipped = each file names the other) | @Zaal | PR (zorca + zao-vault) | 2026-10-03 |
| Add `output format` and `effort budget` fields to `~/zao-vault/handoffs/TEMPLATE.md` - still absent as of 2026-09-25 despite two other template changes landing since (shipped = template committed with both fields) | @Zaal | PR (zao-vault) | 2026-10-03 |
| ~~Write the initializer prompt~~ - **SHIPPED**, `~/.claude/skills/lane-init/SKILL.md`, created 2026-09-09 | @Zaal | Skill | DONE 2026-09-09 |
| ~~Decide the single home for lane tooling~~ - **DECIDED 2026-09-06**, opposite direction from this doc's recommendation: `zaal-dotfiles/bin` is the home, `zorca` retired to a pointer | @Zaal | Decision | DONE 2026-09-06 |
| Add detection-time and reset-time as printed numbers to `zao-selftest`'s heartbeat/job checks - confirmed absent after a full-file grep, 2026-09-25 (shipped = selftest prints both for at least the heartbeat check class) | @Zaal | PR (zaal-dotfiles) | 2026-10-10 |
| Evaluate herdr per doc 2461's own unactioned Next Actions (LICENSE file read, Claude Code CLI compatibility, one lane run under it) now that the consolidation it asked to gate has already happened - decide whether to revisit or explicitly drop (shipped = decision recorded in doc 2461 or a superseding doc) | @Zaal | Research | 2026-10-03 |
| Read `hermes-orchestrator`'s now-cloned `src/` (router, supervisor, learner, autonomy) against `package.json`'s claimed v0.5.0 - its own README still says "pre-alpha, PR1 not landed," which is inconsistent with the code present (shipped = a doc or note reconciling README vs code state) | @Zaal | Research | 2026-10-10 |
| Establish the reddit `script` app credential at `~/.zao/private/reddit.env` - lower priority now that Arctic Shift (`zao-fetch-reddit.sh` v6) provides a working keyless route, confirmed live 2026-09-25, but `--selftest`'s own checks (token/oauth/`.json`) still all fail (shipped = `--selftest` reports token 200, or Arctic Shift formally adopted as the primary path in the script's own header) | @Zaal | Config | 2026-10-10 |

## Sources

Method is stated per source, per `.claude/rules/research-grounding.md`. WebFetch was not used for any quoted line. All external sources re-fetched 2026-09-25.

- [Anthropic - Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - **[FULL - `curl` + HTML strip, 15,173 chars stripped text, HTTP 200, re-verified 2026-09-25]** All three quoted lines (initializer/coding-agent split, "look around, see that progress had been made," JSON-vs-Markdown) confirmed present verbatim.
- [Anthropic - How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) - **[FULL - `curl` + HTML strip, 27,834 chars stripped text, HTTP 200, re-verified 2026-09-25]** Synchronous-execution limits quote, "spawn fresh subagents," 90.2% figure, and "distracting each other with excessive updates" all confirmed present verbatim.
- [Google SRE Book, ch.6 - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) - **[FULL - `curl` + HTML strip, HTTP 200, re-verified 2026-09-25]** Alert-fatigue passage and "every page should be actionable" confirmed present verbatim.
- [Google SRE Workbook, ch.5 - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/) - **[FULL - `curl` + HTML strip, HTTP 200, re-verified 2026-09-25]** "Precision, recall, detection time, and reset time simultaneously" confirmed present verbatim.
- [Amplify Partners - How Hightouch built their long-running agent harness](https://www.amplifypartners.com/blog-posts/how-hightouch-built-their-long-running-agent-harness) - **[FULL - `curl` + HTML strip, HTTP 200, re-verified 2026-09-25]** "Patch up the symptoms without addressing the root cause," "maintain context density without losing any fidelity," and the "dynamic subagents" section header all confirmed present.
- [HN 46081704 - discussion of Anthropic's long-running harness](https://news.ycombinator.com/item?id=46081704) - **[FULL - Algolia `items` API, whole comment tree, re-verified 2026-09-25]** 125 points, 37 comments (recursively counted), 2025-11-28. All cited commenters (`roughly`, `mips_avatar`, `imron`, `_boffin_`, `daxfohl`, `adidoit`, `threecheese`, `vidarh`) confirmed present with matching text.
- [HN 46695855 - How Hightouch built their long-running agent harness](https://news.ycombinator.com/item?id=46695855) - **[FULL - Algolia `items` API, re-verified 2026-09-25]** 45 points, 2026-01-20, 5 comments. `zacwellmer` quote confirmed present verbatim.
- [HN 48680842 - Ask HN: multi-agent orchestration for personal use](https://news.ycombinator.com/item?id=48680842) - **[FULL - Algolia `items` API, re-verified 2026-09-25]** 6 points, 2026-06-26, 7 comments. `verdverm` and `yaskou` confirmed present with matching text.
- [bettercallzaal/zorca](https://github.com/bettercallzaal/zorca) - **[FULL - `gh api` + LICENSE file re-read 2026-09-25: MIT, unchanged]** Re-measured: 0 stars, 370 KB, pushed 2026-09-21, retired to a pointer README on 2026-09-06 with `bin/` removed. Local checkout: 38 files, 8,314 lines (docs, not tools, as of this retirement).
- [bettercallzaal/hermes-orchestrator](https://github.com/bettercallzaal/hermes-orchestrator) - **[FULL - now cloned locally at `~/Documents/hermes-orchestrator`, commit `b3a77bd`, contents read directly, upgrading from the 09-01 PARTIAL]** 2 stars (was 1), pushed 2026-09-01, size 95 KB. `package.json` version 0.5.0 with real `src/` (router, orchestrator, supervisor, learner, autonomy, adapters, patterns), which is more code than its own README header ("pre-alpha... first working code lands in PR1") claims exists.
- [LangGraph - multi-agent concepts](https://langchain-ai.github.io/langgraph/concepts/multi_agent/) - **[FAILED - re-checked 2026-09-25: `curl` HTTP 200 with 549 bytes (empty app shell); `docs.langchain.com/oss/python/langgraph/multi-agent` HTTP 404, unchanged from 09-01]** Still not cited for any quote.
- Reddit - **[PARTIAL, upgraded from FAILED]** `zao-fetch-reddit.sh --selftest`, 2026-09-25: creds still ABSENT, token endpoint 401, public `.json` still `text/html`. But `zao-fetch-reddit.sh <url>` run live 2026-09-25 against `r/vibecoding/comments/1wjydgz` **succeeded via Arctic Shift** (`arctic-shift.photon-reddit.com`, keyless, in the script since v6, 2026-08-23), returning full post text, score (327) and author. No reddit source is quoted in this doc's substantive findings (the original doc used none), but the access-state claim is corrected: reddit is reachable today through the script's fallback path, not blocked outright as the 09-01 version stated.
- Local, measured 2026-09-25: `~/zaal-dotfiles/bin/zao-lanes` (git log + live tmux control), `~/Documents/zorca/README.md` and `PLAYBOOK.md`, `~/zao-vault/notes/lane-supervision-playbook.md`, `~/zao-vault/handoffs/TEMPLATE.md`, `~/.claude/skills/lane-init/SKILL.md`, `~/bin/zao-selftest` (2,284 lines, full-file grep), `~/zao-vault/notes/zao-orchestrator-2026-09-05.md`, `zao-research-index` for "zao-lanes" / "lane supervision playbook" / "initializer prompt" / "herdr", `gh api` for `bettercallzaal/zorca` and `bettercallzaal/hermes-orchestrator`.
