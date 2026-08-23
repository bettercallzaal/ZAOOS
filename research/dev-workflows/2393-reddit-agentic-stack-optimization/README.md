---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-22
superseded-by:
related-docs: "2353, 2366, 2392"
original-query: "deep research reddit for optimization to our agentic stack"
tier: STANDARD
---

# 2393 - What r/ClaudeAI is doing that we are not

> **Goal:** Two threads Zaal sent, read in full including comment trees, mined
> for changes worth making to ZAO's agent stack. The most useful finding is not a
> technique - it is that one poster's failure mode is a precise description of
> our own risk profile, and the safe-looking counter-evidence in that thread does
> not apply to us.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Adopt "all findings are unfactual until proven with a use-case."** | One line, from a commenter, that would have killed several of today's wrong claims at source. Cheaper than our default-FAIL evaluator and applies to every session, not just high-stakes ones. |
| 2 | **Move model tiering from a rule to a hook.** | `claude-usage.md` already specifies which surface does what. Nothing enforces it. The OP injects per-model postures via a `UserPromptSubmit` hook so the posture arrives in every prompt regardless of which model is live. That is a mechanism, and mechanisms are what this estate keeps discovering it lacks. |
| 3 | **Make subagent returns numbers-and-paths, never raw dumps.** | Verbatim from the OP's Haiku posture. I hit exactly this failure today - a subagent-adjacent MCP call returned 312,138 characters and blew the context window. |
| 4 | **ZAO is the HIGH-RISK profile in that thread, not the safe one.** | The thread's strongest counter-evidence ("I built a 10k-line app, bulletproof, I never use skills or MCPs") describes a self-contained codebase. We are the opposite case, and the OP says so explicitly. |
| 5 | **Do NOT adopt Fable-as-orchestrator wholesale.** | Two commenters ran out of Fable tokens mid-flight and were left with an unsupervised Opus, which is worse than not starting. Our cap is shared across ~20 lanes, so we would hit that harder than a single-session user. |

## The finding that matters most

The OP of the second thread ran a setup with a hook injecting scope discipline
into every prompt, written rules, and PreToolUse gates - and Opus still spent
five hours inventing problems and "fixing" them until the repo had to be rolled
back. A commenter pushed back hard: *"I have never had this issue... i just
built a 10k line app... its been basically bullet proof... The only other thing
is i never use skills or MCPs."*

The OP's reply is the whole doc:

> "In a pure coding project like yours there's ground truth, the tests either
> pass or they don't. My workspace runs an actual company, sales data,
> marketing, customer comms, a dozen connected systems. **When Opus invents a
> problem there it looks like a plausible business judgment, 'this number looks
> off,' and there's no test suite to tell it it's wrong.** The MCP thing is
> probably part of it too, my workspace is wired into a dozen live systems
> through connectors which is exactly what widens the surface for Opus to invent
> something to fix. A self-contained codebase just doesn't give it anywhere to
> go."

**That is ZAOOS.** A cowork board, a CRM, a festival, sponsor money, five bots,
Supabase, Telegram, Farcaster, GitHub across two orgs, and ~250 deferred MCP
tools. We are not the bulletproof case. We are the case that broke.

And it explains a real pattern from today: every fabrication caught this session
was in the business layer, not the code layer. ZOL inventing artists. A subagent
inventing command output. Me claiming a fallback did not exist. **Nothing in a
test suite would have caught any of them**, because none of them were code.

## What is worth taking

### 1. "All findings are unfactual until proven with a use-case"

From a commenter, given as a directive they keep permanently:

> "They both fall flat if you allow them to assume bugs exist because they think
> the code has them, especially based on review findings. I keep a simple rule
> in my directives: **All findings are unfactual until proven with a use-case.**
> You spend fewer tokens because you don't chase ghosts."

We have `anti-fabrication.md` rule 2 (evidence or UNVERIFIED) and `loop-evals.md`
default-FAIL. Both are heavier than this and both are scoped - default-FAIL only
binds high-stakes loops. This is one sentence, binds everywhere, and pays for
itself in tokens rather than costing them.

**It would have caught two of today's misses directly.** The "no PA fallback
exists" claim had no use-case behind it. The farscout "healthy fifth bot" claim
was a heartbeat reading, not a demonstration of work.

### 2. Model postures as an injected payload, not a written rule

The OP's layout:

- `CLAUDE.md` - always-on rules
- `rules/router.md` - the routing map
- `model-postures.md` - per-model payloads, injected by a **`UserPromptSubmit`
  hook** based on which model is live

The postures themselves, quoted, with the ones that map onto real ZAO failures:

| Model | Posture line | Why it matters here |
|---|---|---|
| Opus (executor) | *"Do not replace grounding or fresh retrieval with confidence or self-review."* | Two subagents fabricated command output today doing exactly this |
| Opus | *"Deliver the requested scope and stop before unasked work."* | scope creep |
| Sonnet (fan-out) | *"Diagnose or report does not authorize a fix. A one-file request does not authorize related changes."* | the difference between an audit and an unrequested refactor |
| Sonnet | *"Do not create or delegate to subagents."* | prevents recursive fan-out, which is how a cap disappears |
| Haiku | *"Subagent returns come back as extracted key numbers and paths, never raw dumps."* | a 312KB tool result blew this session's context today |

Doc 2353 already covers ZAO model tiering. What it lacks is delivery. A hook is
the delivery.

### 3. Replace model evaluation with deterministic checks wherever possible

From the first thread:

> "I've been using AI to find areas where it's repeating things in my flows and
> areas that **ai evaluation can be swapped with deterministic linter rules or
> scripts** and setting automation for those tasks instead. This prevents AI
> from having to waste context on basic things... This both reduces token usage
> and hallucinations by keeping its context smaller."

This is independent confirmation of the derivation commissioned yesterday, which
concluded that all five of its diagnostic checks reduce to arithmetic rather
than reasoning. Two unrelated sources, same conclusion: **do not spend model
tokens on what a comparison operator answers.**

### 4. Build oracles, not reviews

The sharpest comment in either thread:

> "the fast junior dev framing is right but the missing half is **who does the
> checking**. a junior you review by reading their diff, and that scales to maybe
> 2 juniors. **agents scale way past what you can read**, so the review has to
> move from reading code to **building oracles the model cant talk its way
> past**... the sneaky one is ui: tests stay green while the button moved or
> stopped rendering, because nothing in the loop ever looks at the screen."

And, on non-coders specifically: *"the ones who last are the ones who find one
external source of truth and trust it over the model."*

That is the same shape as this week's false-green work, arrived at
independently. It also names something we have not done: **nothing in our loop
ever looks at the screen.** Doc 2392's `/artists` finding - HTTP 200 with six
error strings and zero artists - is precisely a green test over a broken page.

### 5. Write the spec so the review is boring

> "if there's no written spec to check the diff against, you end up reviewing a
> chat log and just trusting the vibe. Writing down what it's supposed to do
> before it starts makes the review boring, which is what you want."

We do this well already via research docs and briefs. Worth recording that the
practice is validated, not assumed.

## What to reject, and why

**Fable-as-orchestrator, wholesale.** It is the headline of the second thread and
it is the least transferable part. Two commenters:

> "I wish I could use Fable to orchestrate but it's just too expensive,
> especially in complex long running workflows like orchestration."

> "Yup. I'm using fable to orchestrate, and I run out of fable tokens too
> quickly, **leaving opus on its own, and it's ruined my repo.**"

The failure mode is worse than not adopting it: a supervisor that runs out
mid-run leaves an unsupervised executor, and you find out afterwards. Our cap is
shared across ~20 lanes rather than one session, so we would hit that wall
sooner and less predictably.

**"Just ask Claude how to use Claude."** One commenter offers this as the
answer. It is the single least reliable method in either thread - it is asking
the model to self-report, which is the failure this entire estate has spent a
week documenting.

## Honest limits

- **Reddit is walled from this machine.** Creds absent, public `.json` returns
  `text/html`, OAuth 403. Both threads were read through a **Redlib mirror**
  (`reddit.rtrace.io`), which returned the post bodies and 96 + 41 comment
  blocks. Vote counts and thread structure were not recovered, so **"top
  comment" is not a claim I can make** - quotes are selected on substance, not
  score.
- One thread's title came back as a Redlib interstitial rather than the real
  title; the actual slug is `dont_downgrade_from_opus_5_just_stop_letting_it`.
- **These are anecdotes from a self-selecting forum**, not measurements. The
  posture text is quoted verbatim and is real; the claim that it *works* is one
  person's report. Nothing here should be adopted without our own before/after.
- No credentials fix was attempted. A reddit `script` app remains the durable
  route and is on Zaal's queue.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add "all findings are unfactual until proven with a use-case" to `anti-fabrication.md` | @Zaal (Claude) | Rule PR | 2026-08-26 |
| Draft the `model-postures.md` + `UserPromptSubmit` hook, extending doc 2353 rather than replacing it. Do not enable until Zaal reviews the payloads | @Zaal (Claude) | Build | 2026-08-29 |
| Add "subagent returns are numbers and paths, never raw dumps" to the subagent dispatch preamble in `anti-fabrication.md` rule 7 | @Zaal (Claude) | Rule PR | 2026-08-26 |
| Decide whether anything in the loop should ever look at a rendered screen - the `/artists` 200-with-errors case argues yes | @Zaal | Decision | 2026-09-05 |
| Set up the reddit `script` app so threads can be read without a mirror | @Zaal | Credential | when convenient |

## Sources

- [FULL via Redlib mirror `reddit.rtrace.io`, 2026-08-22] [r/ClaudeAI - "Devs who actually use Claude Code properly (not vibe coding)"](https://www.reddit.com/r/ClaudeAI/comments/1vvo1a5/) - post body + 96 comment blocks, 64 substantive. Source of the oracles quote, the deterministic-linter quote, the written-spec quote.
- [FULL via the same mirror, 2026-08-22] [r/ClaudeCode - "Don't downgrade from Opus 5, just stop letting it..."](https://www.reddit.com/r/ClaudeCode/comments/1vvpkka/) - post body incl. the verbatim model-posture block, + 41 comment blocks, 28 substantive. Source of the postures, the pure-codebase-vs-business-workspace exchange, the Fable-cost objections, and "all findings are unfactual until proven with a use-case."
- [FULL - run 2026-08-22] `zao-fetch-reddit.sh --selftest` establishing that direct Reddit access is walled from this machine and the mirror is the only working route.
- [FULL - read on disk] `.claude/rules/anti-fabrication.md`, `claude-usage.md`, `loop-evals.md`, doc 2353, doc 2392 - the ZAO-side rules these findings extend.
