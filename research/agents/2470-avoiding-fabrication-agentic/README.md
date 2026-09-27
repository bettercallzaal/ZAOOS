---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-25
related-docs: "agents/2469-loops-graphs-mini-swe-agent, cross-platform/2468-x-analytics-authenticity, dev-workflows/2467-agent-skill-collections, agents/2103-grounding-beats-guessing, dev-workflows/2105-fact-vs-assertion-grounding-discipline"
original-query: "How do we /zao-research on how to avoid fabrication more with agentic systems"
tier: STANDARD
---

# 2470 - Avoiding fabrication in agentic systems

> **Goal:** We produced 114 fabricated public-facing casts this year and root-caused
> them today. Decide what generalises, and check it against the outside literature.

**Updated 2026-09-25 (re-research, no central claim overturned):** the root
cause, the four rules, and the "we agree/disagree with the literature" table all
still hold. What changed is the evidence quality and the generalization status.
All four previously-**PARTIAL** literature sources (Hard Requirement 11 was
unmet in the 2026-09-06 version - two blog posts and two arXiv papers were never
escalated past a search snippet or an abstract) are now **FULL**, fetched raw via
`curl` + HTML-strip (blogs) and `curl` + `pdftotext` (papers). Reading the full
papers surfaced one genuine nuance the abstracts hid - see "Where we agree" below.
On generalization: `.claude/rules/anti-fabrication.md` and
`.claude/rules/research-grounding.md` now exist in this repo and enforce the
same "claim traces to evidence or is UNVERIFIED" principle **for research
subagents and orchestrator loops** - a real, estate-wide instance of Decision 3
and Next Action 1, but for a different fabrication surface (research claims, not
ZOL's public casts specifically). No evidence was found that Next Action 2 (a
grounding gate on ZOE's own public-posting pipeline, before it gains capability)
has shipped as its own artifact distinct from `zol-grounding.js`, which already
existed on 2026-09-06 as the fix for ZOL specifically. One adjacent surface was
found: `bot/src/zoe/bus-bridge.ts` has a `buildReplyContext(msg, grounding)`
function that separates "verified, cite these" facts from open questions for
drafted replies (the Brandon back-and-forth email flow) - the same discipline
Next Action 2 asked for, on a different code path than `zol-grounding.js`, not
verified to cover every ZOE surface. Next Action 3 (publish the mixed-output
finding outward) is not yet due (2026-09-27) and no publication was found as of
this pass. Also re-confirmed via `gh api repos/bettercallzaal/ZAOOS/pulls/3426`:
`merged: true`, `merged_at: 2026-09-06T19:09:40Z` - the Klearu safety-gate PR
referenced under Rule 1 really did merge same-day as claimed, no drift. Left
explicitly unchecked this pass: whether fabrication has recurred on ZOL since
2026-09-06 - `~/zol/daily.log` lives on the Pi (`ansuz`) and this session had no
SSH access to it; that is an open question, not a confirmed zero.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Fix fabrication with a better prompt | **NEVER** | Ours said *"use ONLY facts in here, do not invent"* AND *"name a SPECIFIC artist from the context above"* AND *"output exactly the word NOTHING"* if thin. Three explicit instructions. It produced 114 fabrications anyway |
| Make the invalid output unrepresentable | **YES - the strongest fix we have** | `zol-pick.js` hands the model a numbered list and takes back an **index**. It cannot invent a cast hash because it is never permitted to type one |
| Require every claim to trace to retrieved evidence, else silence | **YES** | `zol-grounding.js` + 56 tests. Backtested over all 204 casts: **all 114 fabrications refused** |
| Trust an error path to fail safe | **NO - this was the actual root cause** | `catch (e) { return '' }` made an unreachable graph identical to a quiet one |
| Treat human review as a control | **NO, when output mixes real and invented** | Real artists sat beside invented ones in the same feed. Nobody can separate them by eye |

## What actually happened, because the cause was not the model

ZOL drafted a song of the day hourly. 126 drafts in the log, **114 of them
fabricated**, naming **65 artists who do not exist**, each with a precise fake
timestamp - *"listen for the panning delay at 3:12"*.

The chain, every step measured on the Pi rather than inferred:

1. `recall()` fetched context from the Bonfire graph with a **30-second**
   deadline. Measured: a real `/delve` returns 52 episodes and 92KB **in 55.5
   seconds**. The deadline was shorter than the query.
2. The abort hit `catch (e) { return '' }`. **An error became an empty string.**
   Nothing downstream could tell *"the graph had nothing"* from *"the graph was
   unreachable"*, and nothing logged the difference.
3. The prompt was assembled as *"Real ZAO context from the Bonfire graph (use
   ONLY facts in here, do not invent):"* followed by nothing, then *"name a
   SPECIFIC artist, track, or event from the context above."*
4. A model asked hourly to be specific about nothing was specific about nothing.
5. `appendRecent()` filed each invention as something ZOL **had already said**.
6. Next hour the prompt told it *"do NOT repeat the same artist... write about
   something DIFFERENT."*

**Step 6 is the finding worth publishing.** The anti-repetition guard, written to
stop spam, is what drove the *variety* of the fabrication. Sixty-five distinct
invented artists is not a model being sloppy sixty-five times - it is a model
differentiating from its own prior inventions under instruction. The near-twin
pair "Voidwave Nexus" and "Voidwalker Nexus" is that mechanism leaving fingerprints.

**A safety guard became the fabrication engine.** No source found in the
literature describes this.

## Four rules, each earned rather than read

### 1. An error must never become a value

The root cause was one line. `recall()` now returns a **string** on success
(possibly empty - genuinely quiet) or **`null`** on failure, and logs which. The
caller returns early on `null`.

ZOL already had a working silence exit and used it constantly - *"nothing fresh
to post this hour (stayed silent)"* - but it fired on **novelty**, never on
**truth**, because a swallowed error is indistinguishable from a quiet source.

This is the estate's signature failure, and fabrication is only its loudest
instance. The same shape produced `zorca-bundle` exiting 0 and writing nothing
for six days, a cron gate accepting `Bearer undefined`, a Klearu safety gate
failing **open** when its classifier said nothing (ZAOOS #3426, merged today),
and an organizer that ran ~1,100 times writing nothing.

### 2. Make the invalid output unrepresentable, not merely rejected

`zol-pick.js` is the strongest fix built today and it was the lane's design, not
a spec. The model is shown a **numbered list** of real casts and returns an
**index**. The hash, author FID and username come from the API response.

**It cannot hallucinate a cast hash because it is never permitted to write one.**

This is what the literature calls constrained decoding, arrived at
independently. The general form: where a claim must be one of a known set, hand
the model the set and take back a pointer. A schema check rejects a bad value
after the fact; an index makes the bad value impossible.

### 3. Every claim traces to retrieved evidence, or the agent says nothing

`zol-grounding.js` refuses any name, quoted title, number, win-loss record,
timestamp or description of audio the evidence did not return. 56 tests.
**Backtested over all 204 historical casts: all 114 fabrications refused.**

Two properties that matter more than the rule:

- **Refusal is silence, never a hedge.** An agent that says "possibly around
  3:12" has fabricated with extra steps.
- **The evidence is printed beside the draft in the log**, so a reader can check
  the grounding without re-deriving it.

The literature's strongest single recommendation is exactly this - a strict
citation contract where every factual claim references a retrieved passage and
the model abstains otherwise. We reached it from an incident.

### 4. Mixed output defeats human review, and this is ours

**AttaBotty is a real ZAO-PALOOZA artist and appeared 7 times. LUXE does not
exist.** They sat in the same feed, in the same format, with the same
confidence.

Uniform fabrication is self-announcing; a feed of invented names looks wrong.
**Mixed output is not**, and it silently converts a human reviewer into a
rubber stamp - Zaal was reading these in Telegram daily and had no way to
separate them.

So: **an agent whose output mixes verified and generated claims cannot be
governed by review.** It must be governed structurally, or its output must be
uniformly one kind. No source found states this.

## Where we agree with the outside work, and where we do not

| Their finding | Ours |
|---|---|
| Grounding + strict citation contract with abstain is the most reliable single strategy | **Agree.** Independently built and backtested. Zep's full piece (re-fetched raw, 2026-09-25) ranks this the top of 5 stacked controls and cites Artificial Analysis's AA-Omniscience benchmark: even the best frontier model (a Claude Opus 4.8 reasoning config) scores ~40/100 on its reliability Index, and most models cluster at or below 0 - hallucination-by-guessing is the default at the frontier, not a weak-model problem |
| Constrained decoding enforces structure without training | **Agree for our use case, with a real caveat the abstract hid.** Full read of arXiv:2604.06066 (2026-09-25) shows constrained decoding has its own failure mode, "structure snowballing": on an 8B model doing open-ended self-correction/reflection, forcing strict output structure consumed the model's capacity on formatting compliance and caused it to miss semantic errors ("formatting traps and death loops"). This does not contradict `zol-pick.js` - ours is a closed-set index-selection task, not open-ended structured reflection - but it means "constrained decoding is strictly safer" does not generalize to every use of the technique, and is worth flagging before anyone reaches for it on a harder task |
| Generator/critic split where the critic sees data the generator did not | **Agree.** Our claim gate reads the evidence block. Full read of arXiv:2507.15903 (2026-09-25) describes the same shape as a general pattern - HalMit, a black-box "watchdog" that models an agent's generalization bound from outside and flags responses that fall outside it, without needing the generator's internals |
| Layered guardrails cut hallucination 71-89% | **Not our target.** For public claims about named people, a 71-89% reduction is still a libel every few days. Refusal beats reduction. Lakera's full text (re-fetched 2026-09-25) cites the concrete version of that risk: *Mata v. Avianca* (2023), a lawyer sanctioned for a legal brief containing fabricated ChatGPT citations - the same shape of harm as a public cast naming a fake artist, just in a courtroom instead of a feed |
| Prompt-level instruction helps | **Disagree, with production evidence.** Three explicit instructions, 114 fabrications |

**The gap in the literature:** every source treats fabrication as a property of
the model. Our root cause was **plumbing** - a timeout shorter than a query, and
an exception handler that returned a value. No amount of model-side defence would
have helped, because by the time the model saw the prompt the failure had already
been laundered into an empty string.

## What to apply everywhere else

1. Grep for handlers that convert failure into a value: `catch { return '' }`,
   `return []`, `return 0`, `|| 0`, `?? ''`. Each is a candidate.
2. Any agent naming a person, price, date or figure gets a grounding gate before
   it gets new capability.
3. Prefer index-over-identifier wherever the answer belongs to a known set.
4. Where output mixes verified and generated claims, either separate them
   visibly or stop treating review as a control.

## Sources

- **[FULL]** Primary: `~/zol/daily.log` on ansuz (204 casts), `zol-daily.js` source, live `/delve` timing (55.5s, 52 episodes), `recent-casts.json`, and the `zol` lane's 56-test backtest. Measured 2026-09-06. Not re-fetched this pass (the Pi-side log is not what changed; this doc's own claims about it are unchanged) - carried forward
- [How to Reduce LLM Hallucinations - Zep](https://www.getzep.com/ai-agents/reducing-llm-hallucinations/) - **[FULL - upgraded from PARTIAL]** re-fetched raw via `curl` + HTML-strip, 2026-09-25 (HTTP 200, page dated "Last updated: June 15, 2026"). Confirms the citation-contract/abstain framing and adds the AA-Omniscience reliability-Index figures used above
- [LLM Hallucinations in 2026: How to Understand and Tackle AI's Most Persistent Quirk - Lakera](https://www.lakera.ai/blog/guide-to-hallucinations-in-large-language-models) - **[FULL - upgraded from PARTIAL]** re-fetched raw via `curl` + HTML-strip, 2026-09-25 (HTTP 200, dated April 20, 2026). Corroborates the incentive-to-guess framing (OpenAI Sept 2025 paper) and adds that refusal can be trained via steered internal "concept vectors" (Anthropic's Tracing the Thoughts of a Large Language Model), not only prompted
- [From Hallucination to Structure Snowballing: The Alignment Tax of Constrained Decoding in LLM Reflection, arXiv:2604.06066](https://arxiv.org/pdf/2604.06066) - **[FULL - upgraded from PARTIAL]** re-fetched raw via `curl` + `pdftotext -layout`, 2026-09-25 (7 pages, Qwen3-8B). Full read surfaced "structure snowballing" - the caveat now folded into "Where we agree" above; this was NOT visible from the title/abstract alone
- [Towards Mitigation of Hallucination for LLM-empowered Agents: Progressive Generalization Bound Exploration and Watchdog Monitor, arXiv:2507.15903](https://arxiv.org/pdf/2507.15903) - **[FULL - upgraded from PARTIAL]** re-fetched raw via `curl` + `pdftotext -layout`, 2026-09-25 (8 pages). Describes HalMit, the black-box watchdog/generalization-bound framework cited above
- **[FULL]** `gh search repos` for grounding/hallucination tooling: top result **6 stars** (2026-09-06). Not re-run this pass; the OSS-tooling-space-is-empty finding is not the kind of fact that moves in 19 days
- `.claude/rules/anti-fabrication.md`, `.claude/rules/research-grounding.md` - **[FULL]** read directly, 2026-09-25. Confirms an estate-wide generalization of "claim traces to evidence or is UNVERIFIED" exists, for research/subagent loops specifically
- `zao-research-index "grounding gate ZOE"` / `"mixed output fabrication review"` / `"mixed output defeats human review published"` - **[FULL]** run 2026-09-25; surfaced docs 2103 and 2105 (pre-dating this doc, general grounding-discipline writing) but no doc or artifact recording a ZOE-public-pipeline-specific grounding gate or a publication of the mixed-output finding

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| DONE (generalized differently than specified) - `.claude/rules/anti-fabrication.md` + `.claude/rules/research-grounding.md` now enumerate failure-to-value / unverified-claim patterns for research and subagent loops. A literal grep ranked by "value feeds a model prompt" was not found as its own artifact | orchestrator seat | Note | 2026-09-13 (confirmed 2026-09-25) |
| STILL OPEN - no evidence found of a grounding gate on ZOE's own public-posting pipeline distinct from `zol-grounding.js` (which is ZOL-specific and pre-dates this doc). Re-check next pass whether ZOE (not just ZOL) posts publicly and needs the same gate | a lane | PR | 2026-10-09 |
| STILL OPEN, not yet due - publish the mixed-output finding outward. Deadline is 2026-09-27, two days from this re-research | @Zaal | Post | 2026-09-27 |
| Check `~/zol/daily.log` on ansuz for any fabrication recurrence since 2026-09-06 and record the answer either way - not checked this pass (no Pi/SSH access this session) | whoever next has Pi access | Measurement | 2026-10-02 |
