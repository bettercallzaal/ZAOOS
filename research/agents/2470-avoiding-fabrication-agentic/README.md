---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-06
related-docs: 2469, 2468, 2467
original-query: "How do we /zao-research on how to avoid fabrication more with agentic systems"
tier: STANDARD
---

# 2470 - Avoiding fabrication in agentic systems

> **Goal:** We produced 114 fabricated public-facing casts this year and root-caused
> them today. Decide what generalises, and check it against the outside literature.

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
| Grounding + strict citation contract with abstain is the most reliable single strategy | **Agree.** Independently built and backtested |
| Constrained decoding enforces structure without training | **Agree, and stronger.** Return an index, not a validated string |
| Generator/critic split where the critic sees data the generator did not | **Agree.** Our claim gate reads the evidence block |
| Layered guardrails cut hallucination 71-89% | **Not our target.** For public claims about named people, a 71-89% reduction is still a libel every few days. Refusal beats reduction |
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

- **[FULL]** Primary: `~/zol/daily.log` on ansuz (204 casts), `zol-daily.js` source, live `/delve` timing (55.5s, 52 episodes), `recent-casts.json`, and the `zol` lane's 56-test backtest. Measured 2026-09-06
- [Reducing LLM Hallucinations - Zep](https://www.getzep.com/ai-agents/reducing-llm-hallucinations/) - **[PARTIAL]** via WebSearch summary, not fetched raw; cited for the citation-contract and abstain framing only
- [Guide to Hallucinations in LLMs - Lakera](https://www.lakera.ai/blog/guide-to-hallucinations-in-large-language-models) - **[PARTIAL]** same method
- [From Hallucination to Structure Snowballing: constrained decoding](https://arxiv.org/pdf/2604.06066) - **[PARTIAL]** title and abstract framing only
- [Mitigation of Hallucination for LLM-empowered Agents](https://arxiv.org/pdf/2507.15903) - **[PARTIAL]** same
- **[FULL]** `gh search repos` for grounding/hallucination tooling: top result **6 stars**. The OSS tooling space is empty; there is nothing to glue

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Grep the estate for failure-to-value handlers (`catch { return '' }` and kin) and list them ranked by whether the value feeds a model prompt. Shipped when that list exists | orchestrator seat | Note | 2026-09-13 |
| Apply the grounding-gate rule to ZOE before it gains capability - it names people and posts to Telegram. Shipped when a gate exists or a doc says why not | a lane | PR | 2026-09-20 |
| Publish the mixed-output finding outward. It is ours, it cost 114 casts, and no source states it | @Zaal | Post | 2026-09-27 |
