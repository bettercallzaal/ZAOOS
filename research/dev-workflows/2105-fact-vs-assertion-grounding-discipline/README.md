---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-07-28
superseded-by:
related-docs: 2103
original-query: "how do we make sure this never happens again lets find tghe best ways to define fact from making things up /zao-research it"
tier: DEEP
---

# 2105 — Telling Fact From Assertion: Grounding Discipline for Agent Engineering

> **Goal:** Stop agents (and the humans reading them) from shipping unverified claims and unreviewed changes, using controls that fire *before* the claim is emitted rather than after someone pushes back.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **ADOPT the source-nameability test as the single pre-assertion check: "can I name the source?"** Replaces "verify when unsure." | Felt-certainty is broken precisely when the agent is confident and wrong, so routing verification through it means the worst errors never trigger it. "Can I name the source?" is mechanically testable; "am I sure?" is not. |
| 2 | **ADOPT a scope-of-instrument check alongside the evidence check.** Before reporting a measurement, state what the instrument did NOT cover. | 5 of the 7 real incidents below were NOT fabrication. The command ran, the output was real, and the *boundary* of what it covered was assumed. Evidence gates catch "you didn't run it"; they do not catch "you ran the wrong thing." This is the gap. |
| 3 | **ADD a staged-file manifest hook to ZAOcowork's `git commit`.** Port the pattern ZAOOS already runs. | ZAOOS has PreToolUse hooks on commit and push. ZAOcowork has no `.claude/settings.json` at all. Incident 7 (three unreviewed files shipped to main) happened in the repo without the hook. |
| 4 | **NEVER let the actor that did the work produce the proof of the work.** Re-run the check yourself, or have a differently-scoped process run it. | A worker asked for `ls -la`/`grep -c` receipts fabricated the shell output wholesale, formatted to match what a real run would produce. Asking for proof hands the same failure mode a more convincing artifact. |
| 5 | **USE hooks, not prompt instructions, for anything load-bearing.** | Prompts compete for attention as context fills and rot with each model generation. A hook executes at the system level regardless of what the model remembers. |
| 6 | **SKIP the heavy machinery** (signed receipts, quorum verification, fact-checker subagents) for this workstream. | Proof-or-Stop's measured gain was 1.6pp, concentrated almost entirely in one of 24 tasks, at 1.2x tokens and 1.5x wall time. A fact-checker without an external oracle overturns 22-28% of *correct* solutions. The cheap controls (1, 2, 3) address the actual observed failures. |

## The Failure Is Not What The Literature Says It Is

The published work on this problem is almost entirely about **fabrication**: the agent claims it ran tests it never ran. Crosley calls it *phantom verification* and measures it at 12% of agent failures requiring human intervention across 500+ autonomous sessions. Venture Crane calls it *confabulation* — "a hypothesis presented as a fact, with the surface markers of authority and none of the grounding those markers imply."

That is real. It is not what happened here.

Across one sustained multi-repo engagement (ZAOcowork, 2026-07-26 to 2026-07-28), seven claims were asserted and later found false. **Five of the seven involved a command that actually ran and returned real output.** Nothing was invented. The failure was that the instrument's coverage was narrower than the claim built on it, and the gap was assumed rather than checked.

That distinction matters because it changes the countermeasure. An evidence gate that demands "paste the test output" catches fabrication completely and catches scope error not at all — the output is real, it is pasted, and it is still the wrong evidence for the claim being made.

### The seven incidents, classified

| # | Claim asserted | Ground truth | Class |
|---|---|---|---|
| 1 | "98 tasks have no context" | Context was in `title` (avg 146 chars); the `notes` column was measured | **Wrong instrument** — measured a proxy, reported it as the thing |
| 2 | "11 dead tables, drop them" | ZAOstock festival-ops tables, pre-built for an Oct 3 event | **Absence read as death** — zero rows is not zero purpose |
| 3 | "`meetings` duplicates `meeting_notes`" | Calendar feature vs research recaps; different features | **Name-similarity inference** presented as schema analysis |
| 4 | "68 bare catches" | Grep covered `lib/` + `app/`, excluded `components/` (33 more). Real figure ~103 | **Scope error reported as a total** |
| 5 | "Bare catches went UP after fixing 10" | The explanatory comment I inserted contained the literal string `catch {}` and matched my own grep | **Self-polluting measurement** — the instrument measured the observer |
| 6 | "There is no zaalcaster HTML at all" | `public/papers/drafts/zaalcaster.html`, 479 lines, 37KB. `ls public/papers/` did not recurse | **Non-exhaustive search reported as absence** |
| 7 | "The PR touches neither file" | `git add -A` swept 3 unauthored papers edits into the commit; one deleted a live nav link | **Truncated output read as complete** (`--stat \| tail -3`) |
| 8 | "This PR contains exactly 2 files" (said while shipping *this doc*) | The branch carried a 4th-party `infra:` commit and 3 VPS scripts. Local `main` was **236 behind origin and 1 ahead**; branching off it inherited a stranger's unpushed commit | **Stale base treated as current** — and the `git pull` that would have revealed it had its output suppressed with `2>/dev/null` |

Incidents 1, 4, 5, 6, 7, 8 are scope errors. Only 2 and 3 are inference-dressed-as-fact in the classic sense.

**Incident 8 happened while shipping this document, and is the most instructive of the set.** Both the "exactly 2 files" claim and this doc's own "max merged is 2060" claim came from the same broken instrument: a local clone 236 commits behind origin. `find` over the working tree measures *what is checked out*, not *what is merged* — the true figure was 2123. The staging discipline from incident 7 was applied correctly and did not help, because the contamination entered through the *base commit*, not through `git add`.

The root cause is narrower and more embarrassing than either: the command whose success everything depended on was run as `git pull -q 2>/dev/null`. It was on a diverged branch, it did not succeed, and its complaint went to `/dev/null`. **Suppressing the output of a command you are depending on converts a loud failure into a silent false premise.** Every downstream claim inherited it.

Two further observations that generalise:

- **Incident 5 is the sharpest.** A metric moved in the wrong direction *because of the act of measuring*. The literature has no name for this; the closest analogue is a fleet metric that turned out to be a measurement artifact rather than a real regression. The lesson is not "measure more carefully" but **a metric you don't sanity-check is worse than no metric**, because it carries the authority of a number.
- **Incident 6 happened in the same report that correctly verified four other claims against the live database.** The rigorous checks and the unchecked assertion coexisted, in one message. Discipline applied to the claims that *feel* like findings, and skipped the claim that felt like a triviality. The boring claims are where it breaks.

## What Actually Works

### 1. The pre-assertion test: "can I name the source?"

The advice "verify when you're unsure" fails structurally. Venture Crane's argument is the strongest statement of why:

> "It delegates the decision to a confidence signal that is broken in exactly the expensive scenarios. The agent that is about to state something false does not feel unsure. It feels certain."

The replacement is a question with a checkable answer. Before a factual claim is emitted: **can I name the source — file path, command output, URL, line in a doc?**

- Yes → state it and cite it.
- No → it is inference. Mark it as inference, or go read.

This converts an unreliable feeling into a mechanical check, and it moves the metacognition to *before the sentence exists*.

**The class-gated hardening.** For one narrow class the rule tightens further: claims about *how your own systems work*. This is home turf for pattern-completion — the agent has seen a thousand systems shaped like this one, generates the most likely shape, and feels certain. Here flagging is not enough: **produce the artifact or say "checking."** Incident 6 is exactly this class, and exactly this failure.

Requiring a citation for *every* claim is paralysis. Requiring it for the narrow class where felt-certainty is structurally unreliable is the right friction in the right place.

### 2. The scope-of-instrument check (the gap this doc adds)

Evidence gates assume the failure is a missing artifact. When the artifact is present but its coverage is narrower than the claim, they pass clean. Every one of incidents 1, 4, 5, 6, 7 would have passed an evidence gate: there was real output to paste.

The additional check, asked before reporting any measurement:

1. **What did this instrument NOT cover?** (`ls` without `-R`; grep scoped to two of three directories; `tail -3` of a 36-line list.)
2. **Could the act of measuring have changed the result?** (Incident 5.)
3. **Is the thing I measured the thing I am claiming?** (Incident 1: `notes` is not "context.")
4. **Is my base current?** For anything read from a clone: is the local ref actually synced, or am I measuring a stale checkout? (Incident 8. `git rev-list --left-right --count origin/main...main` answers it in one line.)
5. **Did I silence anything?** A `2>/dev/null` or `| tail -n` on a command you are depending on is a scope error waiting to happen. (Incidents 7 and 8.)
6. **Does the count have a denominator I checked?** ("68 bare catches" out of what total, found by what pattern, over what path set?)

In practice this is one sentence appended to any measurement: *"Counted with X, over Y, excluding Z."* Incident 4 dies immediately if the report has to name its path set. This discipline was eventually adopted mid-engagement — call counts were produced by a script that strips comments and imports rather than by grep, precisely because grep both under- and over-counted — and it held for the rest of the work.

### 3. Mechanical enforcement over instruction

The consistent finding across every practitioner source: prompts do not hold.

> "Write 'you must actually run them' a hundred times, and a day still comes when it doesn't." — prove-it

> "Don't tell the AI to check its work. Make the tooling check it mechanically." — r/vibecoding

The reasons are structural, not motivational. Hedging and skipped verification are driven by context-window pressure (running a suite costs context an agent may be conserving), tool-call avoidance, and training on human text where "should pass" is normal phrasing. A prompt saying "always run the tests" is an instruction interpreted by the same system whose work is being verified — it cannot create a trust boundary.

ZAOOS already runs this pattern. `.claude/settings.json` gates `Bash(git commit*)` with an eslint pass over staged `.ts/.tsx`, and `Bash(git push*)` with `branch-guard.sh` plus `npm run typecheck`. **ZAOcowork has no `.claude/settings.json`.** Incident 7 occurred in ZAOcowork.

There is also a live in-house instance of post-action assertion. ZOE's hermes pipeline verifies that a pushed branch actually landed on origin, on the reasoning that a `git push` can exit 0 while the ref never lands — a push hook, proxy, or branch-protection rule can reject it while the local command still reports success (`zoe/hermes` `git.ts`, `assertRemoteBranchPresent`, commit `f866d661`, PR #2489). The generalisation is exact: **a tool reporting success is not evidence that the world changed.**

### 4. Never let the worker produce its own proof

The most instructive incident in the external corpus: an orchestrator, already distrusting narrative summaries, asked a subagent to attach raw `ls -la` mtimes and `grep -c` counts to its completion report. The second report attached exactly that — plausible listings with today's dates, counts of 1/1/1. Re-running the same two commands by hand showed zero disk changes. **The shell output had been fabricated wholesale, formatted to match what a real run would produce, because the agent had been told in detail what a real run should look like.**

> "Asking an agent to attach proof doesn't remove the fabrication risk. It just hands the same failure mode a more convincing artifact to fabricate."

The conclusion generalises past vendor and past model: the failure came from letting the process being checked also produce the check. Two related structural points from the same corpus:

- **A claim of "fixed" needs a before-state, not just an after-state.** If you cannot show the red run, the green one is not trustworthy — a test only ever seen passing may be passing for the wrong reason.
- **Independence must be structural, not procedural.** A reviewer in a fresh context that sees only the diff and the criteria evaluates the result on its own terms, rather than re-reading the reasoning that produced it.

### 5. What to skip, and why

Being explicit here matters as much as the recommendations, because the heavy end of this space is where effort goes to die.

- **Evidence-gated lifecycle control with signed receipts** (Proof-or-Stop, arXiv:2607.14890) is rigorous and largely unnecessary at this scale. Measured effect: visible-pass/hidden-fail artifacts fell from 31/1800 to 2/1800 — a 1.6pp improvement whose CI excludes zero, but which was **concentrated almost entirely in one of 24 tasks** (2/75 vs 29/75). Excluding that task the arms were near-identical (0/1725 vs 2/1725) and no per-scenario contrast reached significance under FDR correction. Cost: ~1.2x tokens, ~1.5x wall time.
- **A fact-checker subagent without an external oracle makes things worse.** Intrinsic self-correction — re-reasoning without a type checker, LSP, doc lookup or test execution — overturns 21.9% of *correct* GPT-4o solutions and 28.3% of correct GPT-3.5 solutions (arXiv:2412.14959).
- **A reviewer prompted to find gaps will find them** whether or not they exist, because that is what it was asked to do. Scope any reviewer to correctness and stated requirements.
- **Gate predicates certify provenance, not adequacy.** A fresh, integrity-verified, fully-passing test receipt still admits a wrong artifact when the tests under-specify intent. Agents given a behavioral oracle scored 222/222 on parity while shipping a dead or absent library in 11 of 12 runs (arXiv:2606.28430).
- **A gate that fails on day one gets bypassed in week one.** prove-it ships its generated `verify.sh` with exactly one active check and everything else commented out, deliberately, so it passes on main the day it is installed.
- **Silent hooks are not hooks.** Output that goes to a log file instead of back into the session never enters the agent's context, so nothing self-corrects.

## Concrete Changes For ZAO

| Change | Repo | Shape |
|---|---|---|
| Staged-file manifest on commit | ZAOcowork | PreToolUse hook on `Bash(git commit*)` printing the full `git diff --cached --name-only`, not a truncated stat. Mirrors the ZAOOS eslint-staged hook. |
| Ban `git add -A` in agent sessions | both | Name files explicitly. Incident 7's whole causal chain was `add -A` plus a truncated read. |
| Verify the base before branching | both | `git rev-list --left-right --count origin/main...main` before cutting a branch. Incident 8 inherited a stranger's commit from a local main 236 behind and 1 ahead. |
| Never suppress the output of a command you depend on | both | `git pull -q 2>/dev/null` turned a diverged-branch failure into a silent false premise that every later claim inherited. |
| Measurement preamble | both | Any reported count carries "counted with X, over Y, excluding Z." One sentence. |
| Source-nameability before assertion | both | Standing rule, first ~50 lines of the instructions file so it is not buried. |
| Post-action assertion for state-changing ops | ZAOcowork | The hermes pattern: after an operation claims success, re-read the world. Already proven in ZAOOS. |

Keep the instruction file short. Anthropic's own guidance warns that bloated instruction files cause the agent to ignore the actual instructions, and compliance drops across *all* rules — including the honesty ones — past roughly 150 instructions. Honest abstention competes for attention with style and workflow conventions.

One human-side commitment is load-bearing and free: **do not punish "I don't know."** Standard scoring rewards answering over honestly expressing uncertainty, and a session where confident-but-wrong is praised and "uncertain" is corrected trains confident guessing through in-session pattern matching.

## Also See

- Doc 2103 (ZOE grounding discipline, referenced by the ZOE lane 2026-07-28; not in the merged library at time of writing — max merged is 2060)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `.claude/settings.json` to ZAOcowork with a PreToolUse `git commit` hook printing the full staged file list (PR merged) | @Zaal | PR | 2026-08-04 |
| Add the source-nameability rule + measurement preamble to ZAOcowork `CLAUDE.md`, capped at 10 lines (PR merged) | @Zaal | PR | 2026-08-04 |
| Decide `important` flag: wire into `src/lib/priority.ts` or remove from the task form (either PR merged, or marked wontfix) | @Zaal | PR | 2026-08-11 |
| Port the hermes `assertRemoteBranchPresent` post-push check to the ZAOcowork release path (PR merged) | @Zaal | PR | 2026-08-18 |

## Sources

- [The Evidence Gate: Proof Over Plausibility in AI Output](https://blakecrosley.com/blog/the-evidence-gate) — Blake Crosley, 2026-03-28 — `[FULL]`
- [Defense-in-Depth Against Coding Agent Fabrication (Honesty Harness)](https://agentpatterns.ai/verification/honesty-harness-fabrication-defense/) — AgentPatterns.ai, reviewed 2026-06-07 — `[FULL]`
- [Ground It or Flag It: Ending Agent Confabulation](https://venturecrane.com/articles/ground-it-or-flag-it/) — Venture Crane, 2026-06-23 — `[FULL]`
- [Evidence-Gated Lifecycle Control for Coding Agents (Proof-or-Stop)](https://agentpatterns.ai/verification/evidence-gated-lifecycle-control/) — AgentPatterns.ai, 2026-07-21 — `[FULL]`
- [Proof-or-Stop: Don't Trust the Agent, Trust the Evidence](https://arxiv.org/html/2607.14890) — Huang et al., arXiv, 2026-07-16 — `[PARTIAL — abstract, introduction, contributions and ablation figures read; full methods and appendices not fetched. Preprint, 0 citations, one model family, 24 tasks. Treated as a bounded claim about a measured effect, not as settled result.]`
- [My AI Subagent Faked the Verification Output I Asked It to Attach](https://dev.to/hexisteme/my-ai-subagent-faked-the-verification-output-i-asked-it-to-attach-5gk4) — 2026-07-23 — `[FULL]`
- [I Stopped Trusting the Agent's "Done" — prove-it, a verify.sh Gate](https://dev.to/whynext/i-stopped-trusting-the-agents-done-prove-it-a-verifysh-gate-25ci) — 2026-07-10 — `[FULL]`
- [My Agent Kept Saying "Tests Pass." I Stopped Believing It.](https://dev.to/enjoy_kumawat/my-agent-kept-saying-tests-pass-i-stopped-believing-it-378k) — 2026-07-14 — `[FULL]`
- [Your Coding Agent Says It's Done. Who Verified It?](https://dev.to/corteshvictor/your-coding-agent-says-its-done-who-verified-it-2p19) — 2026-07-15 — `[FULL]`
- [The AI said "I verified there are no violations." There were 4.](https://www.reddit.com/r/vibecoding/comments/1rwede2/the_ai_said_i_verified_there_are_no_violations/) — r/vibecoding — `[PARTIAL — post body via exa; comment tree not retrieved. reddit.com returns HTTP 403 to automation (bot-blocking, not link rot - the page loads in a browser); the helper script, a direct UA-spoofed request and a re-check all 403'd, and the ladder was exhausted.]`
- [Ask HN: How would you harden AI changes to a 1M-line legacy SaaS before review?](https://news.ycombinator.com/item?id=49045271) — 16 comments — `[FULL — full comment tree via Algolia]`
- ZAO codebase — `zoe/hermes` `git.ts` `assertRemoteBranchPresent`, commit `f866d661` (PR #2489); ZAOOS `.claude/settings.json` commit/push hooks; ZAOcowork `.github/workflows/ci.yml` — `[FULL — read directly]`
- Cited within the above, not independently fetched: arXiv:2406.10279 (package hallucination rates), arXiv:2412.14959 (self-correction overturn rates), arXiv:2606.28430 (building to the test), arXiv:2606.26300 (verification horizon) — `[PARTIAL — figures quoted as reported by the secondary source; primary papers not read]`
