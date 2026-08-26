---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-26
superseded-by:
related-docs: "1659, 2353, 2239, 599c, 2188"
original-query: "/zao-research on https://x.com/tomcrawshaw01/status/2091876187459264831 - Zaal wants more on Hermes (the Hermes Agent - note doc 1659-v5 found Hermes Agent is OpenMatter's template, so this connects to the ZOE v2 lane's runtime question; cite that). Extract what is new versus what we already know about Hermes, and what it implies for running ZOE v2 on OpenMatter."
tier: STANDARD
---

# 2422 - Hermes Agent, plainly explained: one new idea, one inert switch, one name we need to settle

> **Goal:** Read Tom Crawshaw's 15-concept Hermes Agent explainer against what [doc 1659 v5](../1659-openmatter-network-agent-platform-eval.md) already measured, and say what it changes for running ZOE on the OpenMatter deploy - if anything.

## What the source is, and its bias

"15 Hermes Agent Concepts Explained In Plain English", Tom Crawshaw (@tomcrawshaw01), 2026-08-24, 137 favourites / 6 replies / 30,618 views. It is the companion article to a YouTube walkthrough (`youtu.be/lGtBPrSrnjY`) and it **ends on a sales CTA** - a free 30-minute AI audit call at `theaiarchitects.com`, offering to "build the Hermes Agent for you". Second article in two days that reaches ZAO as a well-written explainer with a product at the end (see [doc 2421](../../dev-workflows/2421-company-brain-hq-vs-zao-vault/)).

That does not make it wrong. It is the clearest plain-English map of the Hermes harness anyone has written, and it is a practitioner describing a setup he runs daily, not a spec sheet. But it is a **concepts explainer, not new capability information**, and it should not be cited as evidence about what the container can do - doc 1659 v5 measured that from Nous' own docs and from a live deploy.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Nothing here changes the OpenMatter verdict.** Doc 1659 v5 already closed the capability question by observation: the container is `nousresearch/hermes-agent`, and it ships profiles, skills, memory, sessions, cron, hooks, a web dashboard, multi-profile supervision and an OpenAI-compatible API. Use this article for vocabulary and one structural idea. | 1659 v5 measured the deploy, the two ports, and quoted Nous verbatim on the gate: *"Hermes itself needs a configured provider and tool backends for the API server to be useful."* An explainer written by a third party cannot outrank that. |
| 2 | **ADOPT the per-task model routing - by turning on a switch we already shipped.** `ZOE_TASK_COMPLEXITY_ROUTING=1` is **unset**, so `decompose.ts`'s three-tier router emits a cost class per subtask that nothing consumes. | The article's most concrete habit is routing per task rather than per subscription ("plan it with GPT 5.6 through OpenRouter, then write it with Kimi K3, set up in my agent's file so it happens automatically"). [Doc 2353](../2353-model-tiering-and-escalation/) decision 5 already identified this exact flag as built, shipped and inert. An outside article independently arriving at our unshipped feature is the cheapest possible argument for shipping it. |
| 3 | **PROFILES are the one genuinely new structural idea.** A profile is a durable, role-scoped Hermes setup with its own SOUL.md, AGENTS.md, memory, skills, model choice and conversation history - not a prompt, not a bot. | This sits in a gap our architecture explicitly leaves empty. CLAUDE.md's rule is that a new brand voice is *a persona block in ZOE's runtime memory*, never a new bot. A profile is the middle term neither option covers: heavier than a persona block (own memory, own skills, own model), lighter than a Telegram bot (no new token, no new process, no new deploy). Worth a design conversation; **not** worth building today. |
| 4 | **FLAG, do not resolve: "ZOE v2" is on the do-not-propose list.** `CLAUDE.md` line 170 lists "ZOE v2 / Agent Zero migration plan" among surfaces decommissioned 2026-05-04, and `IN-FLIGHT.md` confirms none of that list appears in `bot_heartbeats`. The runtime question in the dispatch is real; the name it arrived under is retired. | Only Zaal can settle whether the OpenMatter runtime question is a revival of a killed plan or a different question wearing its name. Guessing either way is a fact-only-Zaal-knows call (`lane-autonomy.md`), so this doc names the collision and stops. |
| 5 | **SKIP porting ZOE onto the harness.** `bot/src/zoe/` is **130 TypeScript modules** today. | The harness gives you profiles, skills, memory and hooks for free; it does not give you 130 modules of accumulated ZAO-specific logic, and doc 2239 (the capability map) already documents only 105 of them - we cannot even fully enumerate what a port would have to carry. Reaching for a runtime change while the inventory is 26 modules stale is the wrong order of operations. |
| 6 | **Do NOT move our handoff threshold on this article's say-so.** He writes a handoff document at 50-60% context, and 40% on Anthropic models. `handoff-discipline.md` rule 2 says 75%. | One practitioner's habit is an anecdote, not a measurement (`liveness-probe-guard.md` rule 6). Recording the disagreement is useful; changing a rule that was written from a specific failure - the wavewarz lane dying at 90% with no brief - is not. |

## Findings

### 1. What is genuinely new, measured against doc 1659 v5

Doc 1659 v5's addendum runs to 988 lines and already covers the container, both ports (8642 OpenAI-compatible API + health, 9119 dashboard behind `HERMES_DASHBOARD=1`), the endpoint list, the naming collision, and the "running is not working" gate. Against that baseline:

| Concept in the article | New to us? | Note |
|---|---|---|
| Harness and model as separate layers | **No** | This is the premise of our whole cheap-fleet ladder (doc 2188) |
| Per-task model routing | **Partly** | We have failover (claude -> codex -> openrouter -> ollama); he describes routing by *intent*, which is what `decompose.ts` does and what the unset flag gates |
| Five interfaces (terminal, desktop, Telegram, voice, Discord voice) | **No** | ZOE is on Telegram with voice-in live; ZAI is the Discord voice capture (built, not deployed) |
| SOUL.md / AGENTS.md / CONTEXT.md / VOICE.md / corrections.md | **No** | Near one-to-one with `CLAUDE.md` + `.claude/rules/` + the 154 `feedback_*` memories. Same shape, different filenames |
| Compression + handoff documents | **No** | `handoff-discipline.md`, at a different threshold - see decision 6 |
| The agent loop (prompt, tools, answer) | **No** | - |
| Tools, MCP servers, plugins | **No** | He runs the Superpowers plugin; so do we |
| Memory (what) vs skills (how) | **No** | Our exact split, and doc 2421 just wrote the routing table for it |
| Hooks fire in a shell, not as context | **No** | `.claude/settings.json`; his .env-blocking hook is our `secret-hygiene.md` in a different form |
| **Profiles** | **YES** | See decision 3 - the one idea with no ZAO equivalent |
| Subagents as temporary helpers | **No** | The Agent tool |
| Gateways and where it runs (local / VPS / shared cloud) | **No**, but sharpens one thing | "Shared cloud so a team all accesses the same tools, context and API keys" is precisely what the OpenMatter deploy would be for. Our ZOE is already on a VPS |
| Scheduled tasks + webhooks | **No** | cron + the existing webhook surfaces |
| **Kanban with an agent per stage** | **Partly** | Our board is task truth and our lanes are agents, but no stage has an agent *assigned* - tasks do not move between agents by stage. His SEO pipeline (writer -> editor -> orchestrator) is a real pattern we do not run |
| Four security layers (user auth, tool permissions, approvals, hooks) | **No** | Permission modes, deny rules, gates, hooks - all four, all live |

**Fourteen of fifteen concepts describe something ZAO already runs.** That is the honest headline, and it is a good sign rather than a disappointing one: it means the stack we assembled independently matches what a daily practitioner of a 234k-star harness converged on. The two exceptions - profiles and stage-assigned kanban - are both about *structuring multiple agents*, which is exactly the seam ZAO is at right now.

### 2. One habit worth stealing verbatim: `/learn`

> "You can install skills other people have shared, and you can create your own by typing /learn, which turns a process you just went through into a skill."

We create skills by hand, and we persist lessons by hand into `.claude/rules/` or a `feedback_*` memory (`agent-loops.md` rule 6, whose routing table [doc 2421](../../dev-workflows/2421-company-brain-hq-vs-zao-vault/) just made explicit). The friction is real: a lesson that needs a human to sit down and write a rule is a lesson that often does not get written. A `/learn`-shaped command - "take what we just did and propose the skill or rule for it, for me to approve" - is a small, PR-only, entirely reversible thing to build, and it targets the review gap doc 2421 named rather than widening it.

This is a **candidate, not a decision** - `code-restraint.md` rung 2 says check what already exists first, and `/reflect`, `/retro` and `/agentic-issue` all live in the same neighbourhood.

### 3. The naming problem is now three-deep

Doc 599c flagged the "Hermes" collision on 2026-05-21 and recommended keeping our name internal-only. Doc 1659 v5 said that recommendation "now has teeth, because the estate contains both at once". This article adds a third: a public, well-circulated explainer that makes "Hermes Agent" mean Nous Research's harness to anyone who reads it.

The three, kept straight:

| Name | What | Where |
|---|---|---|
| `bot/src/hermes/` | **Ours.** The auto-PR coder/critic pipeline, folded into ZOE 2026-06-29 | ZAOOS |
| Hermes Agent | **Nous Research's** self-hosted harness, `nousresearch/hermes-agent` | Docker Hub, 8.3M pulls |
| Hermes Agent (harness adaptation) | A platform target listed in the Superpowers skill's own platform-adaptation table | `superpowers:using-superpowers` |

Any sentence about "Hermes" in a ZAO doc, PR title, or lane brief needs a qualifier from here on. That is not pedantry - it is the difference between "restart Hermes" meaning our PR pipeline and meaning a container with a funded credit wallet behind it.

### 4. What it implies for the runtime question

Stripped of the name dispute, the question the dispatch is really asking is: **should ZOE's runtime be a harness we configure rather than a bot we maintain?**

What the article usefully clarifies is that the choice is not all-or-nothing. His setup is one harness with several *profiles*, reached through *gateways*, and the profiles differ only by files. Mapped onto ZAO, the cheapest useful experiment is not a migration at all:

1. The OpenMatter deploy already runs the container ("The ZAO Newsletter" project, 1 deployment, 12.35 credits, per 1659 v5).
2. Give it **one profile with one job** - the job named in the deploy - and a Telegram gateway.
3. Compare it against what ZOE already does for that same job.
4. Decide from the comparison, not from an architecture diagram.

That is reversible, cheap, bounded, and it answers the runtime question with evidence instead of a plan. It also depends on the gate 1659 v5 named: a configured provider and tool backends, without which the deploy is running-not-working. **The blocker is unchanged, and this article does not clear it.**

## Also see

- [Doc 1659](../1659-openmatter-network-agent-platform-eval.md) - OpenMatter eval + the v5 addendum that measured the live `nousresearch/hermes-agent` deploy, the ports, and the running-is-not-working gate. **The primary source for anything factual about the container.**
- [Doc 2353](../2353-model-tiering-and-escalation/) - model tiering; decision 5 is the inert routing flag this doc argues for switching on
- [Doc 2239](../2239-zoe-capability-map/) - the ZOE capability map, last-validated 2026-08-07 at 105 modules against 130 on disk; card 239f3ebe tracks the refresh
- [Doc 599c](../599c-hermes-agent-prior-art-reddit/) - where the naming collision was first flagged, 2026-05-21
- [Doc 2421](../../dev-workflows/2421-company-brain-hq-vs-zao-vault/) - the correction-routing table, and the review gap `/learn` would target
- `~/zao-vault/handoffs/openmatter.md` - the live relationship brief (Zaal owes Chris B a reply; credits discrepancy unresolved)

## Next actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Settle the name: is the OpenMatter runtime question a revival of the decommissioned "ZOE v2 / Agent Zero" item on `CLAUDE.md` line 170, or a separate question needing its own name? Nothing downstream should use "ZOE v2" until this is answered | @Zaal | Decision | 2026-08-28 |
| Set `ZOE_TASK_COMPLEXITY_ROUTING=1` and confirm from logs that a subtask's cost class actually changes the model used (doc 2353 decision 5); PR merged | @Zaal | PR | 2026-08-29 |
| Refresh doc 2239's capability map to the real 130 modules before any runtime decision - card 239f3ebe already exists for it | @Zaal | Card | 2026-09-02 |
| Give the existing OpenMatter deploy ONE profile + one job + a gateway, and compare against ZOE on that same job. Gated on the provider/tool-backend config that doc 1659 v5 named | @Zaal | Experiment | 2026-09-05 |
| Decide whether `/learn` is worth building or is already covered by `/reflect` + `/retro` + `/agentic-issue` | @Zaal | Decision | 2026-09-05 |

## Sources

- [x.com/tomcrawshaw01/status/2091876187459264831](https://x.com/tomcrawshaw01/status/2091876187459264831) - "15 Hermes Agent Concepts Explained In Plain English", Tom Crawshaw, 2026-08-24, 137 favs / 6 replies / 30,618 views - **[FULL]** method: `~/bin/zao-fetch-x.sh` tier 0 (`api.fxtwitter.com`, article-body aware), 105 blocks of raw article text; saved to `~/.zao/private/x-tomcrawshaw-hermes-concepts-20260826.txt`. All quotes verbatim from that raw text. Article ends on a `theaiarchitects.com` sales CTA - disclosed above.
- `youtu.be/lGtBPrSrnjY` - the source video the article is based on - **[FAILED - not attempted]** method: none. The article is the author's own written version of it; transcribing the video was not needed to answer the question and is not claimed as read.
- [Doc 1659 v5](../1659-openmatter-network-agent-platform-eval.md), 988 lines - **[FULL]** method: `git show origin/main:...` (the working tree was on an older branch and did not yet contain v5 - worth noting, since reading the local copy alone would have missed the entire Hermes finding)
- [Doc 2353](../2353-model-tiering-and-escalation/) - **[FULL]** method: `git show origin/main:...`
- `CLAUDE.md` line 170 (decommissioned list) and `~/zao-vault/handoffs/IN-FLIGHT.md` line 71 (`bot_heartbeats` confirms none of that list is running) - **[FULL]** method: grep on disk
- `bot/src/zoe/*.ts` = **130** modules - **[FULL]** method: `ls | wc -l`, 2026-08-26
