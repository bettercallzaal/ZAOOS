---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-23
superseded-by:
related-docs: "2394, 2393, 2353"
original-query: "https://www.reddit.com/r/coolgithubprojects/s/VY8IKQicWC look into this"
tier: STANDARD
---

# 2395 - dev-house: we cannot use the code, and one comment on it is worth more than the repo

> **Goal:** Evaluate `SinghAbhinav04/dev-house` ("Hackeroom"), a Claude Code
> multi-agent team harness Zaal sent. Decide whether to adopt, borrow, or pass -
> and extract what is genuinely transferable.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Do NOT adopt or vendor the code. Licensing forbids it.** | `LICENSE` is **PolyForm Noncommercial 1.0.0**. GitHub reports it as `NOASSERTION`, so the API's license field alone would have missed this. The ZAO operates commercially (BCZ Strategies LLC, sponsors, ticketed festivals). This is not a close call. |
| 2 | **Do not adopt the product either, on maturity grounds.** | Created **2026-08-22**, one day before this review. 8 stars, 0 forks, one author. Independent of the licence, that is not a dependency to build a lane system on. |
| 3 | **Borrow one architectural idea: the unconditional clamp.** | Their PreToolUse hook makes `.claude/` unwritable for every member, unconditionally, with no manifest value able to unlock it. That is the mechanized form of a ZAO rule we currently enforce by discipline only. |
| 4 | **Adopt one phrase, and the thinking behind it.** | A commenter's critique - *"this is availability logic being applied to a safety boundary"* - names a failure class we have three rules circling and no short name for. |
| 5 | **Ideas are free, expression is not.** | Reading the design and reimplementing our own is fine and is what this doc recommends. Copying the hook's code is not, under PolyForm NC. |

## The licence, because it is the decisive fact and it is easy to miss

```
GET /repos/SinghAbhinav04/dev-house      -> "license": { "spdx_id": "NOASSERTION" }
GET /repos/SinghAbhinav04/dev-house/license -> "PolyForm Noncommercial License 1.0.0"
```

`NOASSERTION` reads like "no licence stated," which would be its own reason for
caution. It actually means GitHub's classifier did not recognise the file. The
real terms only appear from the second endpoint.

**PolyForm Noncommercial permits use only for noncommercial purposes.** The ZAO
runs sponsored events, sells tickets, and operates through an LLC. So: no
vendoring, no copying the hook, no adapting the manifest schema verbatim.

`credit-attribution.md` already says *"If a project's license is unclear, check
BEFORE using it - do not adopt code we cannot legally + attributably use."* This
is the first recorded case where the check changed the outcome, and where the
convenient endpoint gave the wrong answer. **Check `/license`, not the repo
object.**

## What the project is

A team of Claude Code sessions you compose yourself: each "member" gets a name,
role, model, permission level and skill set, seated in a `Planner -> Coder ->
Reviewer -> Tester -> Auditor` pipeline, visualised as a pixel-art office. The
team is data, not code: three coders and no reviewer is a valid configuration,
and an empty seat means that phase does not run.

Four claims the author says he went deep on. Assessed against what ZAOOS already
has, per `code-restraint.md` rungs 1-2:

| Their claim | Do we already have it? |
|---|---|
| Composable roles, per-member model | **Yes.** `zao-build-orchestrator` (Opus) / `zao-builder` (Sonnet) / `zao-formatter` (Haiku) / `zao-evaluator`, plus the `Workflow` tool's `pipeline()` and `parallel()`. Doc 2353 covers tiering. |
| Per-member token and cost tracking | **Yes.** `zao-spend` prices session transcripts and puts cost next to the PRs it bought. |
| Memory shared as a tiny index, full read on demand | **Yes, and measured.** Doc 2365 established `MEMORY.md` is a byte-bound index over 416 topic files, 190 unreachable from it, and topic files cost zero context until read. Same architecture, arrived at independently. |
| Skills isolated per agent, not dumped into everyone | **No, and this one lands.** See below. |

Three of four are things we already run. That is the expected result of the
restraint ladder and it is why the ladder exists.

## The one thing worth taking: the unconditional clamp

From the hook's own header, verbatim:

> "The manifest is data the hook *consults*; it is not a grant of authority.
> These clamps are unconditional and no manifest value can unlock them:
> - writes to `.claude/` are denied for every member (that is what stops an
>   agent from editing this hook or its own permissions)
> - the Agent tool is blocked for everyone (no recursive spawning)
> - Bash cannot mutate hooks/settings, create links, spawn `claude`
> - any tool not explicitly handled is denied
> - a member absent from the manifest is denied outright"

**That first clamp is `feedback_no_self_grant_settings_write`, mechanized.** Our
rule says a process widening its own permissions is a self-grant, not a grant.
We enforce it with discipline. It was exercised the same day this doc was
written: asked directly to stop the permission prompts, the correct action was
to produce the allow-block and hand it to Zaal rather than write it. Discipline
held - but discipline is what holds until it doesn't, and a prompt injection
from fetched web content does not read our rules.

`.claude/` unwritable is the version that holds regardless.

**"Any tool not explicitly handled is denied"** is the Default-FAIL contract from
`loop-evals.md` pointed at permissions instead of grading. We already accept that
shape for high-stakes evaluation; our permission model is the opposite - a large
`allow` list with a small `deny` list, i.e. allow-by-default for anything unlisted.
Worth noting as a difference, not necessarily a defect: ours is a single trusted
operator's machine, theirs is a harness for arbitrary user-authored agents.

**The author is honest about the limits**, which is why the design is worth
reading:

> "this is a role guardrail, not a security sandbox. A sufficiently adversarial
> agent could bypass bash-level grep filters via indirect execution (`python3 -c`,
> `eval`, `base64`). For true isolation, use OS-level sandboxing."

Correct, and rare. Their Bash clamp is a `grep -Eiq` over the command string;
this doc should not oversell it either.

## The comment that is worth more than the repo

u/kantorcodes1, on the Docker isolation fallback:

> "the Docker fallback is the part i'd probably make fail closed. if i chose
> isolation for a run and Claude auth breaks, continuing on the host changes the
> safety boundary instead of just availability."

The author's reply concedes it completely, and the concession is the most useful
paragraph in the whole thread:

> "if Docker isn't available when the run starts, it's one `console.warn` to the
> server's stdout, latched to once per process, then host spawn. Nothing reaches
> the event log or the UI. And the two roles that default to `preferIsolated` are
> the coder and tester - the ones with Bash and project writes. **So the quiet
> path relocates exactly the members isolation was there for.** You're right:
> **this is availability logic being applied to a safety boundary.**"

### Why this matters here

We have three rules circling this exact failure and no name for it:

- `silent-failure-guard.md` rule 3: *"A missing tool is a FAIL, not a pass."*
- `loop-evals.md`: default-FAIL, absent evidence stays failed.
- `liveness-probe-guard.md`: never spawn a replacement without killing the original.

**"Availability logic applied to a safety boundary"** is the general form of all
three, and it is sharper than any phrasing we currently use. The distinction it
draws is the load-bearing one: when a safety mechanism is unavailable, degrading
gracefully is correct for *availability* and catastrophic for *safety*, and the
same code path cannot serve both.

The secondary detail is equally instructive: the failure was **one `console.warn`,
latched once per process**. Not silent by design - silent by *volume management*.
That is `noisy-signal-guard.md` and `silent-failure-guard.md` colliding: the
de-duplication that keeps a log readable is the same mechanism that hides the one
occurrence that mattered.

## Honest limits of this review

- **I read the hook, not the system.** 188 files; I read `approval-gate.sh`
  (14,825 bytes) plus the repo tree and metadata. Claims about the orchestrator,
  the Docker runner and the memory index come from the author's own post and
  reply, not from reading that code.
- **The comment thread is 3 comments.** Arctic Shift reported 3 while the post
  record said 0 - the archive lag documented in doc 2394. There may be more by now.
- **Scores are all 1**, so nothing here is "the top comment"; these are the only
  comments.
- **8 stars, one day old.** Nothing about traction is being claimed. The ideas
  are assessed on their merits, not on adoption.
- I did **not** verify the author's claims about per-member cost tracking or
  skill isolation by reading that code. They are reported as claims.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add "availability logic applied to a safety boundary" to `silent-failure-guard.md` as the named general form of rule 3, crediting the thread | @Zaal (Claude) | Rule PR | 2026-08-27 |
| Write our own PreToolUse clamp denying writes to `.claude/**` unconditionally - mechanizing `feedback_no_self_grant_settings_write` instead of relying on discipline. Our own code, not theirs | @Zaal (Claude) | Build | 2026-09-02 |
| Add to `credit-attribution.md`: check the `/license` endpoint, not the repo object - `NOASSERTION` hides real terms | @Zaal (Claude) | Rule PR | 2026-08-27 |
| Decide whether per-agent skill isolation is worth pursuing against the measured 46,515-token boot cost (doc 2394) | @Zaal | Decision | 2026-09-05 |

## Sources

- [FULL - fetched 2026-08-23 via `zao-fetch-reddit.sh` v6 / Arctic Shift] r/coolgithubprojects post `1vw0ceq`, *"Hackeroom - give Claude Code a dev team you hire yourself, and watch them work in an office"* by **u/Inevitable_Fan5157** - full body plus 3 comments. The Docker-fallback exchange with **u/kantorcodes1** is quoted verbatim above.
- [FULL - fetched 2026-08-23] `api.github.com/repos/SinghAbhinav04/dev-house` - created `2026-08-22T18:32:35Z`, pushed `2026-08-23T08:46:34Z`, 8 stars, 0 forks, TypeScript, `license.spdx_id: NOASSERTION`.
- [FULL - fetched 2026-08-23] `api.github.com/repos/SinghAbhinav04/dev-house/license` - **PolyForm Noncommercial License 1.0.0**. The decisive source, and the one the repo object does not give you.
- [FULL - fetched 2026-08-23] `raw.githubusercontent.com/.../pipeline/.claude/hooks/approval-gate.sh` - 14,825 bytes, "Hardened v3 - manifest driven". All hook quotations are from its header and its `DENY BY DEFAULT` section.
- [FULL - fetched 2026-08-23] repo tree, 188 files, not truncated - used to confirm which permission-related files exist before claiming any absence.
- [FULL - read on disk] `.claude/rules/silent-failure-guard.md`, `loop-evals.md`, `liveness-probe-guard.md`, `code-restraint.md`, `credit-attribution.md`, and memory `feedback_no_self_grant_settings_write` - the ZAO side of every comparison drawn here.
- Credit: **SinghAbhinav04** for dev-house, and **u/kantorcodes1** for the critique that produced the most useful sentence in the thread. Neither is affiliated with The ZAO.
