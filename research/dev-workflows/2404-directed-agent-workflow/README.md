---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-08-24
superseded-by:
related-docs: "2393, 2403, 2398"
original-query: "https://www.reddit.com/r/vibecoding/s/U3GoEDJQtG also research this flow"
tier: STANDARD
---

# 2404 - A 1,347-commit workflow that independently derived four of our rules

> **Goal:** Read a detailed account of directing an agent for six and a half
> weeks and extract what ZAO does not already have. The striking result is how
> much of it we arrived at separately - which is evidence the rules are real and
> not local superstition - and the three techniques we lack.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Adopt the self-critique subagent loop.** | Build, then critique your own work against the guidelines, then rebuild from the critique. We have adversarial verification of CLAIMS; we have nothing that makes a builder attack its own OUTPUT before shipping. |
| 2 | **Adopt "find your gateable core and gate it."** | Doc 2393 established ZAO is the high-risk profile because business judgment has no test suite. This is the answer to that, and we had not asked the question this way. |
| 3 | **Adopt the two-doc spec: PRODUCT + TECHNICAL, per feature.** | Our research docs are closer to one merged document. The split forces the "how" to be written down separately from the "what", and uncertainty to be marked rather than guessed. |
| 4 | **Do NOT adopt the pace or the numbers as a target.** | 36.4 commits/day on a greenfield monorepo by a founder with an existing software company. `feedback_no_arbitrary_targets` applies. |
| 5 | **Record the four independent derivations as validation.** | Four of his hard rules are ours, reached from a different problem in a different domain. That is worth more than any new technique on the page. |

## The four rules he derived independently

This is the most useful part of the post for ZAO, and it is not a technique.

### 1. Verify the effect, not the report

> **"Deploy in the same step and verify. Marketing and web app auto-build and
> deploy in the same turn as the change, and I check the served bundle hash
> actually flipped before believing it is live. No 'should be deployed.'"**

That is `silent-failure-guard.md` rule 1, arrived at from shipping a mobile game.
He checks a **content hash**, which is stronger than what we usually do - our
equivalent checks tend to assert an HTTP status or a row count. A hash proves the
artifact CHANGED, not merely that something responded.

Worth stealing verbatim: **"No 'should be deployed'"** is a better slogan than
anything in our rules file.

### 2. Real data or no data

> **"No fake stats, no fake testimonials, no fake live feeds anywhere on the
> surface. Every number is real engine output or a real screenshot. The moment
> you fake something on the surface you have started lying to yourself about how
> done you are."**

`anti-fabrication.md`, independently. And the second sentence is sharper than
ours: we frame fabrication as a trust problem for the reader. He frames it as a
**self-deception** problem for the builder - a fake number on a surface destroys
your own ability to know your progress. That reframing is the one to fold in.

Live relevance: doc 2392 found 112 ZAOstock research directories and none
measuring the outcome Zaal named. The lineup fallback is deliberately empty
rather than populated from memory. Same rule, same week, different organism.

### 3. Subagents get a hard contract, and the parent owns integration

> **"Strict contract: work only on your branch, commit, stop. Do not merge, do
> not touch the integration branch, do not switch branches. The parent owns
> integration."**

`agent-loops.md` rules 20 and 25, which we wrote after a subagent opened a PR
against the wrong branch's head. He states it as a contract given up front; we
state it as a prohibition learned from an incident. **The contract framing is
better** - it is enforceable at dispatch rather than discovered at cleanup.

### 4. Commit after every change; never leave a working tree dirty

> **"Standing rule: commit after every individual change, never leave edits
> staged across a work session. Moving this fast, an uncommitted working tree is
> how you lose an afternoon to a bad revert."**

`agent-loops.md` rule 11. And this one lands on a live finding: the repo audit
run the same night (`zao-workspace`) found **four repos with uncommitted work and
no git remote**, plus **`zolbot` carrying 17 uncommitted files for 39 days**.
He is describing the discipline whose absence we just measured.

## The three things we do not have

### 1. The self-critique subagent loop

> **"My favourite use: telling a design sub-agent to build a gallery, then write
> a brutal critique of its own work against my guidelines, then rebuild it better
> based on that critique. Design, tear it apart, elevate. The v2 was genuinely
> better because it had to name its own weaknesses first."**

ZAO has `zao-evaluator` - a fresh-context, no-write-tools grader that returns
PASS/NEEDS_WORK on a finished change. That is verification of a CLAIM by a
DIFFERENT agent.

This is different and complementary: the **same** agent, in the **same** session,
attacking its **own output** against a written standard before anything ships.
It costs one extra turn and it front-loads the critique that the evaluator would
otherwise have to send back.

The load-bearing phrase is *"because it had to name its own weaknesses first."*
An agent that has enumerated its own weaknesses cannot then claim the work is
clean - it has already contradicted itself on the record.

**Where this fits ZAO immediately:** the artifact-design work, the announcement
drafts, and any PR body. All three are surfaces where the first version is
usually shippable and rarely right.

### 2. "Find your gateable core and gate it"

> **"Not everything in a game can be deterministic, true. But the scoring engine
> here can be, so I made it the spine: identical inputs produce byte-identical
> output on client and server, or the build fails, and I set that gate up on day
> one. The value for vibecoding is that it gives the agent exactly one thing it
> can never quietly break."**

Doc 2393 established that ZAO is the high-risk profile - a business workspace
where "when the agent invents a problem it looks like plausible business
judgment, and there's no test suite to tell it it's wrong."

We recorded that as a hazard. **He answers it.** You do not need everything
gateable; you need to FIND the part that is, make it byte-exact, and let it be
the spine. It becomes the one thing the agent can never quietly break, which
makes moving fast everywhere else survivable.

**The open question for ZAO, and it is a good one: what is our gateable core?**
Candidates, none obviously right:

- **Receipts and effect counts.** Already schema'd (doc 2396 baseline). A given
  mission commits at most one effect, verifiable by constraint.
- **The doc-number reservation.** Already gated at the commit boundary, and it
  caught a bypass the same day it shipped.
- **Board state.** A card's status transitions could be made total and checked.
- **Published-surface truth.** Every number on a public page traces to a query.

The receipts one is closest to his description - deterministic, byte-comparable,
and it fails the build rather than warning.

### 3. The two-document spec, with uncertainty marked

> **"All 35 folders have the same two files: a PRODUCT doc (what it does, the UX,
> the screens) and a TECHNICAL doc (how it is built, the schema, the file paths,
> the contracts). Uncertainty is marked explicitly as an assumption that needs
> verification instead of the agent guessing."**

And the part that makes it work:

> **"The specs themselves came out of the two-way Q&A. I did not write them alone
> and hand them over. We drafted them together... the spec is where the joint
> thinking got frozen into something buildable."**

ZAO's research docs already carry Key Decisions and Sources. What they do not do
is separate WHAT from HOW into two files, or mark uncertainty as a named
assumption requiring verification. The second is the more valuable half - it is
`anti-fabrication.md`'s UNVERIFIED marker, applied forward to a plan rather than
backward to a finding.

## The framing worth keeping

> **"I treated the agent as a principal engineering architect I was building
> alongside... When it proposed something I did not fully understand I did not
> veto it and retreat to the stuff I already knew. That is the trap that keeps
> most people's projects shallow: your own knowledge becomes the ceiling for the
> whole system."**

This is the strongest paragraph in the post and it is not a technique. It names
a specific failure - vetoing what you do not understand, so the system can never
exceed you - and gives the alternative: make it explain, then decide.

It also matches something already in ZAO's rules from a different direction:
`feedback_teach_while_building` and the DreamNet Communication Standard both
require reports to teach rather than log.

## What to reject

- **The numbers as a target.** 1,347 commits, 36.4/day, a backend in 14 hours.
  Greenfield monorepo, founder of a software company, no existing users, no
  operational estate. `feedback_no_arbitrary_targets` applies directly.
- **"Whole backend in one day" as a transferable claim.** He says why himself:
  *"the reason a whole backend fit in a day is... the plan already existed"* -
  15 milestones with a dependency matrix and critical path written first. The
  day is the visible part; the plan is the cause.
- **The self-report as evidence of quality.** Commenters pushed back on both the
  product (*"it doesn't do a good job of teaching them the concepts"*) and the
  design (*"literally the same design AI gives you every time"*). The WORKFLOW
  account is detailed and checkable; the QUALITY claim is the author's.

## Honest limits

- **Nothing here is verified beyond the post.** No repo, no commit log, no
  independent confirmation of 1,347 commits. Every number is self-reported by an
  author with a product to promote, and he says so up front.
- **14 comments, all score 1.** No differentiated voting, so no "top comment"
  claim is made. The two substantive criticisms are quoted above.
- **The domain is a greenfield mobile game.** ZAO is an operational estate with
  live surfaces, money, and people. Doc 2393 is explicit that these are different
  risk profiles, and this author is in the safer one.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add the self-critique step to the subagent dispatch preamble in `anti-fabrication.md` rule 7 - build, critique against the standard, rebuild | @Zaal (Claude) | Rule PR | 2026-08-28 |
| Decide ZAO's gateable core. Recommend starting with receipts/effect-count, since doc 2396 already schema'd it | @Zaal | Decision | 2026-09-05 |
| Fold "No 'should be deployed'" and the bundle-hash check into `silent-failure-guard.md` | @Zaal (Claude) | Rule PR | 2026-08-28 |
| Fold the self-deception framing of fabrication into `anti-fabrication.md` - faking a surface destroys your own progress signal | @Zaal (Claude) | Rule PR | 2026-08-28 |
| Commit or discard the 17 files sitting dirty in `zolbot` for 39 days, and the four no-remote repos | @Zaal | Cleanup | 2026-08-30 |

## Sources

- [FULL - fetched 2026-08-24 via `zao-fetch-reddit.sh` v6 / Arctic Shift] r/vibecoding post `1vwipui`, *"I directed an AI agent to build a full mobile game + platform in 6.5 weeks"* by **u/nimloth** - full body plus 14 comments. Every quotation verbatim from that fetch.
- [FULL - measured 2026-08-23/24, this estate] The repo audit behind `zao-workspace`: 75 repos, 28.9 GB, four with uncommitted work and no remote, `zolbot` at 17 dirty files for 39 days. The live counterpart to his commit-discipline rule.
- [FULL - read on disk] `.claude/rules/silent-failure-guard.md`, `anti-fabrication.md`, `agent-loops.md` rules 11/20/25 - the four rules he derived independently.
- Doc 2393 (ZAO is the high-risk profile - the question this post answers), doc 2396 (the receipts schema that is the leading gateable-core candidate).
- Credit: **u/nimloth** for an unusually specific and self-critical account, and **u/thefooz** and **u/the-Gaf** for the product and design criticism that keeps the self-report honest.
