# Loop Evals - a rubric every autonomous loop passes BEFORE it opens a PR

Adopted 2026-08-02 from Andrej Karpathy's agent model (loops + harnesses > autonomous
agents; the "march of nines"; agents bloat and copy-paste). This rule is the
write-side gate the model asks for: an autonomous ZOE/fleet loop does not get to
declare a change good because "a PR opened" - it must pass a small, checkable eval
rubric first, and the rubric result is reported so a human can see it. This is the
concrete "improve toward Karpathy's model" move: turn the vague "verify before done"
into a per-loop pass/fail an operator can read.

Siblings: `agent-loops.md` (rule 1 ground-truth, rule 8 PR-only gate, rule 35
overnight = docs-only), `silent-failure-guard.md` (a 200/exit-0 is not proof),
`anti-fabrication.md` (a claim is not a fact until checked), `code-restraint.md`
(the anti-bloat check below is restraint made measurable).

## Why (Karpathy, well-sourced; the two exact X links Zaal sent 402'd - UNVERIFIED)

- **March of nines.** End-to-end success is p^n. A 95%-per-step loop over 10 steps
  succeeds ~59% of the time. You cannot buy reliability with a better model alone -
  you buy it by gating each step. So each loop step that can be wrong gets a check.
- **Agents bloat and copy-paste.** Karpathy's loudest complaint: agents "implement an
  inefficient, bloated, brittle construction over 1000 lines" where 100 would do,
  duplicate blocks, and leave dead code. So every code-writing loop runs an explicit
  anti-bloat pass before it PRs.
- **Verification is the human skill.** The eval loop IS the product (agent-loops rule
  17 - "the loop is the product"). Building the rubric is the work, not overhead.

## The gate - a loop MUST pass ALL applicable checks before opening a PR

Applicability is by loop TYPE. A research/docs loop runs A + F. A code-writing loop
(repo-improver, error-remediation, fix-PR) runs all of A-F.

- **A. Ground truth green.** `npm run typecheck` = 0 errors, the build/`esbuild`
  bundles, relevant `vitest` passes, and (for bot code) a non-entrypoint boot-import
  succeeds. A missing verifier is a FAIL, not a pass (silent-failure-guard rule 3,
  agent-loops rule 30). tsc-alone is NOT enough (agent-loops rule 1).
- **B. No regression in coverage.** Test COUNT after >= test count before. A change
  that silently drops tests fails (the never-ran-tests incident, silent-failure-guard).
- **C. Anti-bloat pass (the Karpathy check).** Before PR, the loop reviews its OWN
  diff and answers, in the PR body:
    - Did I duplicate a block instead of reusing an existing component/hook/lib
      helper? (code-restraint rung 2 - reuse outranks rewrite.)
    - Is any new function a variant of one that already exists? If so, why not extend it?
    - Did I leave dead code / an unused import / a commented-out block? Remove it.
    - Diff size sane for the change? A 500+-line diff for a small fix is a smell -
      justify it or shrink it.
  A code loop that cannot answer these does not PR. Run `biome check` on the touched
  paths; a lint regression fails the gate.
- **D. Scope honesty.** The PR changes ONLY what the task named. Unrelated edits
  (a drive-by refactor, a reformat of an untouched file) fail - split them out.
- **E. Safety unchanged.** Zod validation, session/auth checks, error handling, and
  RLS assumptions are intact or strengthened, never removed (code-restraint: restraint
  never cuts safety). No secret/PII enters the diff (secret-hygiene, pii-hygiene) -
  the case-insensitive scan is its own standalone step, not `&&`-chained to the commit
  (agent-loops rule 27).
- **F. Evidence in the report.** The PR body / loop report states each check's result
  with PROOF (the typecheck output, the before/after test count, the biome result) -
  not "all good." "Done/shipped/fixed" without proof is banned (anti-fabrication rule 6).

## Per-loop reliability (the march-of-nines metric)

Each autonomous loop tracks a running reliability number and self-gates on it:

- `reliability = merged / (merged + auto-reverted + human-rejected)` over a trailing
  window. A loop whose reliability drops below its target STOPS opening PRs and flags
  a human - it does not keep shipping into a falling success rate.
- Targets by stakes: low-stakes (research/docs) 90%; code loops 95%; anything that
  touches a live route or a deploy path 99%+. Higher stakes = higher bar, per the
  march of nines (a rare failure on a deploy path is far more expensive than on a doc).
- The number is REPORTED (in the loop's self-report / the board), so the count never
  surprises Zaal (workflow-discipline rule 2 - a loop self-reports what it opened).

## High-stakes gate: default-FAIL, fresh-context evaluator

For any HIGH-STAKES loop output (a code change to a live route, a deploy-path edit, a
security-relevant finding, anything graded "critical"), the builder does not grade its own
work. A SEPARATE evaluator - fresh context, NO write/edit tools - reviews the work against
EVIDENCE and returns PASS / NEEDS_WORK. This is Anthropic's long-running-agent harness
pattern (the `cwc-long-running-agents` "Default-FAIL Contract"), verified 2026-08-03, and it
is strictly stronger than "the builder self-verifies."

- **Default-FAIL.** Every gate criterion starts `false`. It flips to `true` ONLY when the
  evaluator opens the cited evidence (the typecheck output, the failing-then-passing test,
  the file:line) and confirms it. Absent evidence = stays failed. A criterion the evaluator
  cannot verify is NEEDS_WORK, never a silent pass (extends `silent-failure-guard.md` and
  `anti-fabrication.md` rule 2 - evidence or UNVERIFIED).
- **Fresh context, no write tools.** The evaluator is a distinct agent/subagent that did not
  build the change and cannot edit it - so it cannot rationalize its own work or quietly
  "fix and pass." It only reads, checks evidence, and votes. This is the concrete form of
  `agent-loops.md` rule 33 (verify a subagent's claims) + rule 7 (subagent for bounded
  verification).
- **Applies to high-stakes only.** Low-stakes prose/doc loops do not need a separate
  evaluator (that would burn the cap for no gain - `claude-usage.md`); the A-F gate above is
  enough. Reserve the fresh-context evaluator for changes whose failure is expensive.

## Review the direction the change was FOR, not only the direction you fear

Added 2026-09-12 after a reviewer approved a security-gate fix, verified the
dangerous direction correctly, and never checked the direction the fix existed
for. The gate shipped still broken in exactly the case the PR was written to
close, and stayed broken on main until someone hit it.

Their own account, and the sentence is the rule:

> I checked whether the fix could UNDER-report - the dangerous direction in a
> security gate - and correctly found it could not. I never checked whether it
> still OVER-reports in the case the PR existed to fix. **I verified the
> direction I feared instead of the direction the change was for.**

Both directions matter and they are different questions. A gate has a failure
mode you are afraid of (it lets something through) and a failure mode that is
the entire reason for the change (it blocks something it should not). Checking
only the first is how a fix ships with its own purpose unmet, and it reads as a
thorough review the whole way through, because the check that WAS run was real.

### The mechanism that stops the second check: a coherent justification

The line that was approved carried a comment explaining why the shortcut was
safe:

    # Either the other parent genuinely added nothing, or the diff failed.
    # Both are indistinguishable here, so do not filter.

They were never indistinguishable - the subprocess call discarded a returncode
that says which. But the reasoning was RIGHT THERE and internally consistent, so
the reviewer read it, found it sound, and stopped.

> **A comment that explains why a shortcut is safe is the most effective thing
> there is at stopping a reviewer checking**, because the reasoning is right
> there and coherent. Coherent-and-false beats absent.

An absent justification invites the question. A present, plausible, wrong one
answers it before it is asked. So a comment asserting that something cannot be
distinguished, cannot happen, or is safe by construction is the highest-value
thing in a diff to verify, not the thing that lets you skip verifying.

### What to do

1. **Name both directions before reviewing a gate or filter.** Write down what
   it must never let through AND what it must never block. Check each.
2. **Test the case in the PR title.** If the PR says it fixes X, the review is
   not done until X is demonstrated fixed - by a control that is red without the
   change, not by reading the diff and agreeing with it.
3. **Treat an impossibility claim in a comment as the thing to check.** "Both
   are indistinguishable", "this cannot be empty", "safe because" - open the API
   and confirm. Comments outlive the code they justify, and the next reader
   inherits the assertion without the doubt.
4. **When correcting such a comment, name the false claim rather than quietly
   replacing it** - the next reader meets the correction where the mistake was
   made. Prefer a signature that cannot express the confusion at all (a type
   that returns `None` for "could not read" versus `[]` for "read, empty") over
   a comment telling people not to make it.
5. **A negative result is reported as a negative result.** "I could not
   construct a case" is not "the problem is not there", and the weaker claim is
   what leaves the door open for someone to check again. In this incident the
   author said exactly that to a peer, went to build the peer's missing fixture,
   and discovered the case WAS reachable - which is the only reason it was found.

### Its twin lives in another repo, and they must be edited together

`~/zao-vault/AGENTS.md` **rule 10** is the same lesson stated from the other
side: *"a selector that is right about what it names can still be wrong about
what you wanted"*, and *"before trusting a count, state what it would read IF
THE THING YOU FEAR HAD HAPPENED. If that value is the same as the pass value,
the count is not a check."*

That last sentence is this section's subject in different words - a check that
cannot come out differently, and a review that only exercises the direction you
were already worried about, are the same failure wearing two hats. The two files
were written the same afternoon by lanes talking to each other and **neither
pointed at the other until it was noticed**, which is the drift this very rule
describes, occurring inside the rules. Vault added their half in `c6b0a38`; this
is the reciprocal, because a one-way pointer is half a link.

Deliberately a CROSS-REFERENCE rather than a merge: the audiences differ.
`.claude/rules/*.md` auto-loads into every session in this repo; `AGENTS.md` is
read by lanes doing ZAO work across the estate. **Editing either means checking
the other.**

### Guard

This does not mean re-review everything. It is two extra questions - which
direction did I check, and which one was this change for - and one habit: the
most confident sentence in the diff is the one to verify.

## Guards

- This gate is PR-only. Passing the rubric earns a PR, never an auto-merge or a
  gated action (outbound, on-chain, spend stay human-gated - agent-loops rule 8).
- The rubric is a floor, not a ceiling - a loop may add checks, never skip an
  applicable one. If a check cannot run, that is a FAIL (fail closed), not a skip.
- Do not perform the rubric as theater. A check that surfaces nothing real reports
  "clean" honestly; a check that fails BLOCKS the PR (anti-fabrication rule 4 - grade
  down, a fabricated pass is worse than a caught fail).
- Overnight/unsupervised: even a passing code change is NOT auto-applied to live
  routes - the deliverable is the reviewable PR (agent-loops rule 35).

## Source

Andrej Karpathy's 2025-2026 agent model (loops + harnesses; march of nines; agents
bloat) via research task (board #9075, 2026-08-02). The two exact X posts Zaal linked
(x.com/0xkkai, x.com/sairahul1) returned 402 and are UNVERIFIED; the Karpathy
synthesis is separately sourced. This rule operationalizes his model into ZAO's
existing PR-only harness. The default-FAIL fresh-context evaluator section was folded
in 2026-08-03 from Anthropic's `cwc-long-running-agents` harness (Default-FAIL Contract),
verified FULL via the agent-tooling research task. Companion: `agent-loops.md`,
`silent-failure-guard.md`, `anti-fabrication.md`, `code-restraint.md`, `workflow-discipline.md`.

The "review the direction the change was FOR" section was added 2026-09-12 from
ZAOOS #3502 (a security-gate fix that shipped still broken in the case it was
written to close) and #3505 (the correction), across the zaoos-review, vault and
dotfiles lanes. The reviewer who made the error diagnosed and reported it
themselves after reproducing the defect independently; the "coherent-and-false
beats absent" formulation is theirs. Siblings for that section:
`noisy-signal-guard.md` (a check that cannot reach zero - this is a check that
cannot fail, and a justification that discourages writing one),
`confirm-before-claiming-absence.md` (a negative result is not an absence),
`silent-failure-guard.md` rule 5 (a security scan that passes on error), and its
cross-repo twin `~/zao-vault/AGENTS.md` rule 10 (pointer added there in
c6b0a38 - edit either and check the other).
