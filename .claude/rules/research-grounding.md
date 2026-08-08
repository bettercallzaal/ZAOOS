# Research Grounding - real fetches, or it is UNVERIFIED

Research subagents FABRICATE citations. On 2026-08-03, four research scouts (Reddit/GitHub/X,
HN/blogs, frameworks/papers, products) each made ~ONE real fetch, then returned long, mutually-
agreeing syntheses with **invented arxiv IDs, HN thread numbers, and exact percentages**. They
were caught only because the orchestrator checked the `tool_uses` count and recognized the arxiv
IDs as fabricated. A fifth scout, dispatched with a hard "REAL FETCHES ONLY" instruction, made 23
real fetches and honestly reported two 403/429 failures - proving the fix is the instruction + the
verify, not hope. This rule makes grounded research the default and fabrication cheap to catch.
Sibling to `anti-fabrication.md` (the general rule) - this is its research-loop-specific teeth.

## The one principle

**A cited source is not grounding unless it was actually fetched and read.** Every specific
claim, number, quote, URL, or repo in a research output traces to a page the agent fetched THIS
run - or it is marked UNVERIFIED. This mirrors Anthropic Hermes's "grounded-citations" (claims
fact-checked against actual page text) and ZAO's Proof Drops (a claim anchored to quotable evidence).

## RAW TEXT, NOT A SUMMARY - the WebFetch trap (added 2026-08-08)

A fetch is not automatically grounding. **`WebFetch` does not return the page** -
its own description says it "answers `prompt` against it **using a small fast
model**". You receive that model's answer about text you never saw, so every
quote, number and name in it is recall, not source.

- **Never quote from WebFetch.** Attribute it as a summary or do not use it.
- **Load-bearing claims come from RAW text**: `curl` plus an HTML strip, an
  official JSON API, or ZAO's keyless fetchers (`zao-fetch-reddit.sh`,
  `zao-fetch-farcaster.sh`, FxTwitter) - all of which return raw by construction.
- **State the METHOD in Sources**, not just FULL/PARTIAL/FAILED, so a reader can
  tell a verbatim quote from a reconstructed one.
- **The same trap applies to subagents.** A subagent's prose report IS a summary.
  If its specifics matter, have it write the raw text to a file and return the
  PATH - then quote from disk (`anti-fabrication.md` rule 1).
- WebFetch stays fine for triage: does this page exist, what is it broadly about.
  The line is whether a sentence will be quoted, carry a number, or support a
  decision.

Full audit and the community source: doc 2250.

## Dispatching a research subagent (the enforced prompt)

Every research/audit subagent prompt MUST include, verbatim-equivalent:

> REAL FETCHES ONLY. Actually fetch pages with WebFetch/WebSearch and report per-URL
> FULL/PARTIAL/FAILED. Do NOT synthesize from memory and invent citations - prior scouts
> fabricated arxiv IDs / thread numbers / percentages and were caught. Every specific claim,
> number, tool name, or repo MUST come from a page you fetched THIS run. If you cannot fetch
> something, say FAILED and move on - never fill the gap with a plausible invention. A short
> grounded answer beats a long fabricated one.

## The orchestrator's verify (before trusting ANY research subagent)

1. **Check the effort against the claims.** A "deep research" that returns 20 cited sources but
   made ~1 tool call did NOT read them - treat its specifics as UNVERIFIED. The subagent usage
   footer (`tool_uses`, `subagent_tokens`) is the tell.
2. **Spot-check one load-bearing citation.** Open a cited URL (or `gh api` a claimed repo/stat).
   If it does not exist or does not say what was claimed, discard that scout's specifics - keep
   only the directional architecture, and say so.
3. **Convergence is not proof.** Multiple scouts agreeing (they did, 2026-08-03) is a strong
   directional signal, NOT verification - fabrications rhyme because they draw the same training
   priors. Verify anyway.
4. **When you write the doc, keep only what you can stand behind.** Drop fabricated citations
   explicitly (doc 2188 did this: "4 scouts converged; their citations were fabricated; kept the
   pattern, discarded the sources"). Mark retained items FULL/PARTIAL as in `zao-research`.

## Cheaper than a scout: fetch it yourself

For a small, high-stakes research question, do the WebSearch/WebFetch INLINE rather than dispatch
a subagent that might fabricate. The orchestrator fetching directly (as on the Paragraph +
August-2026-agents research, 2026-08-03) is both grounded and often faster than a fan-out.

## Guards

- This does NOT ban subagent research - fan-out is still right for broad sweeps. It bans TRUSTING
  a subagent's specifics without the fetch-count check + a spot-check.
- Directional patterns from a low-fetch scout can still be useful (well-established architecture)
  - just never quote its numbers or citations as fact.
- Ties to Proof Drops (`src/lib/dreamnet/proof-drop/`): a research finding worth keeping is a
  claim + its quotable evidence - the same shape, enforced.

## Source

Established 2026-08-03 from the four-fabricating-scouts incident (docs 2187/2188 research). The
fix (demand real fetches + verify the count) is proven by the fifth scout's 23 grounded fetches.
Siblings: `anti-fabrication.md` (rules 2, 5, 33), `silent-failure-guard.md`, `agent-loops.md`
(rule 33 verify subagent claims). Companion build: Proof Drops + Hermes grounded-citations.
