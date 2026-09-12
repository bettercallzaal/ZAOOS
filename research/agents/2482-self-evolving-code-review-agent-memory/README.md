---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-11
superseded-by:
related-docs: "agents/523-zao-agentic-systems-full-audit-fix-pr-pipeline, agents/689-ai-agent-memory-personal-systems, agents/2481-strands-agents-tools"
original-query: "https://x.com/sumanth_077/status/2098416224803987968?s=46"
tier: STANDARD
---

# 2482 - The self-evolving code review agent: borrow the feedback loop, not the stack

> **Goal:** Decide what the ZAO agent stack should take from Sumanth Kowligi's
> self-evolving code review agent (X, 2026-09-11). The answer is to skip the
> stack, which is a vendor demo with no licence, and to build its one real idea:
> our five critics review the same way on their thousandth run as on their first,
> because no critic reads what a reviewer accepted or rejected last time.

## Key Decisions

| # | Decision | Call | Why (evidence) |
|---|---|---|---|
| 1 | Adopt or fork the project's code | **SKIP** | `Sumanth077/Hands-On-AI-Engineering` has **no LICENSE file** (`gh api .../contents/LICENSE` returns 404, and the snapshot reads "NONE - all rights reserved"). Unlicensed is all-rights-reserved, not public domain (`.claude/rules/credit-attribution.md`). We can read it and cite it; we cannot copy it. |
| 2 | Adopt its storage stack (Actian VectorAI DB, Docker, Ollama, Streamlit) | **SKIP** | The README recommends 16 GB RAM and 10 GB disk for the DB, embeddings and a local `qwen3:4b-instruct` (2.5 GB) on one machine. ZOE's VPS runs the whole fleet. The tweet says "a vector database"; the README names one vendor in seven places, so the stack is the demo's point, not ours. |
| 3 | Its central idea: store the reviewer's accept / reject / edit as retrievable rules | **ADOPT, against our own critics** | Measured 2026-09-11: `bot/src/hermes/critic.ts` (595 lines) contains **0 references** to memory, past reviews or history, and the three ZOE critics (`bot/src/zoe/critics/`) are the same. Every review starts from a fixed system prompt. |
| 4 | Where to put the first loop | **`zao-retired-names`, not the critics** | The allow file already IS this pattern by hand: 56 allowed lines and 4 held, each with a written reason for why a line is not copy. It is a persisted review decision that changes the next run's behaviour. The missing half is retrieval: nothing reads those reasons when judging a new line. |
| 5 | The `LearnedInsight` record shape (rule, rationale, polarity, scope, confidence) | **COPY THE SHAPE, write our own code** | Five fields, and `polarity: reinforce \| avoid \| refine` is the one that matters: it makes "stop flagging this" a first-class stored outcome, which is what our hand-written `feedback_*.md` memories already do in prose. |
| 6 | Its "self-evolving" claim | **Read it precisely** | Its own README says the term means non-parametric adaptation: "The Qwen3 model weights and base prompts do not change." Nothing is trained. It is retrieval-augmented review with a human in the loop, and its reflection prompt explicitly says "Do not claim that the model was retrained." |

## What the link actually is

A thread by **Sumanth (@Sumanth_077)**, posted 2026-09-11 14:19 UTC, 233 likes,
16 replies, 27,103 views when read. It links one directory in his
`Hands-On-AI-Engineering` repo: a Streamlit app where a local LLM reviews a diff,
an engineer accepts, rejects or edits each comment, and those decisions are
distilled into natural-language rules stored in a vector DB for the next review.

The repo overall: **3,425 stars, 862 forks, 9 open issues, 7 contributors**, last
activity 2026-09-08 (`zao-research-snapshot`, first look). The top two
contributors by commits are `cyberholics` (270) and `Tiioluwani` (227); the owner
has 38. It is a collection of demos, not a maintained product.

The thread does not mention the vendor. The README names **Actian VectorAI DB**
as the memory store, with a `docker-compose.yml` that "accepts the VectorAI DB
EULA". Read the repo, not the thread.

## Findings

### The loop, as built (from the source, not the thread)

`self_evolving_agent/graph.py` runs five LangGraph nodes: retrieve, review, human
feedback, reflect, persist. The human gate is a LangGraph `interrupt` after
comment generation, so the graph pauses and resumes on the same thread ID with
one decision per comment.

Two collections, both embedded with `BAAI/bge-small-en-v1.5`:

| Collection | Holds | Retrieved by |
|---|---|---|
| `review_insights` | distilled rules with polarity, scope, confidence, source review metadata | cosine similarity to the incoming diff, top-k, above a minimum score |
| `review_trajectories` | the reviewed change, the comments, the engineer's decisions, a reflection summary, rejection metrics | same query vector |

`memory.py` embeds only the first 8,000 characters of the diff as the query
(`diff_text[:8000]`), and `_search` drops any hit below `min_score`. So a long
diff is matched on its head, and a review with no similar history retrieves
nothing and falls back to the base prompt. Neither is a flaw; both are limits
worth knowing before copying the design.

### The part worth stealing is in the prompts, not the plumbing

`prompts.py` is 1,550 bytes and carries the whole contract. Two lines do the work:

- The reviewer is told that retrieved insights are team guidance "including
  negative lessons that say not to flag accepted team practices", while
  trajectories "are examples, not authoritative rules".
- The reflector is told to produce "one compact, testable rule per useful lesson",
  not to create a rule from ambiguous feedback, and not to duplicate lessons
  within a batch.

That is the same discipline this estate applies to its own memories by hand: a
rule with a reason, scoped, and no rule from a feedback signal nobody understood.

### Our critics, measured today

| Critic | File | Reads past review outcomes? |
|---|---|---|
| Hermes critic (scores the coder's diff, gates the auto-PR) | `bot/src/hermes/critic.ts`, 595 lines | **No** - 0 matches for memory, past, previous or history |
| research-critic (the Hard Requirements gate on every research doc) | `bot/src/zoe/critics/research-critic.ts` | **No** |
| comms-critic (brand voice, anti-fabrication, on every external draft) | `bot/src/zoe/critics/comms-critic.ts` | **No** |
| task-result-critic (semantic fit on every worker output) | `bot/src/zoe/critics/task-result-critic.ts` | **No** |

`gh search code "CRITIC_SYSTEM" --owner=bettercallzaal --owner=ZAODEVZ` returns
these and nothing else, so there is one implementation per critic and no second
copy to keep in sync.

### We already store the decisions. We do not retrieve them.

The estate writes review outcomes down in three places, all natural language, all
with reasons, none retrievable by a running agent:

- `zaal-dotfiles/claude/retired-names-allow.json` - 56 allowed lines and 4 held,
  each with a reason saying why the line is not copy. Machine-readable, content
  hashed, and read by a tool - the closest thing we have to `review_insights`.
- `~/zao-vault/decisions/` - 45 decision files.
- `~/.claude/projects/.../memory/` - 11 memory files, of which the `feedback_*`
  ones are exactly ExpeL's "avoid" polarity in prose: do not use blocking
  pickers, do not make an archived repo private to quiet a check.

The gap is retrieval. A human or a session reads these; no critic does.

### Community signal: none

Hacker News Algolia returns **0 stories** for "ExpeL experiential learner" and
**15** for `"code review" agent memory`, the highest at 8 points. The pattern is
not being discussed; the paper it comes from is real
(ExpeL: LLM Agents Are Experiential Learners, arXiv 2308.10144, published
2023-08-20) and the demo is one person's weekend-scale project. Treat the idea as
worth testing and the popularity as zero evidence either way.

## The smallest version worth building here

Not a vector DB. The first loop should run where the decisions already are:

1. `zao-retired-names check` reports a NEW line in an instruction path.
2. Before reporting it, it looks for an allowed line whose reason covers the same
   shape - today by path and pattern, not embeddings.
3. It prints that reason alongside the finding: "the retirement rule itself must
   name what it retires - this looks like the same case".

That is retrieval of a stored human decision at the moment of the next judgement,
which is the whole idea, with no new service and no new dependency. If it earns
its place there, the same shape moves to the Hermes critic, whose accept/reject
signal already exists: **a merged PR is an accept and a closed one is a reject**,
and both are in the GitHub API we already read.

## Also See

- [agents/523 - ZAO agentic systems audit + fix-PR pipeline](../523-zao-agentic-systems-full-audit-fix-pr-pipeline/) - where the Hermes coder/critic pair is specified
- [agents/689 - AI agent memory + personal knowledge systems](../689-ai-agent-memory-personal-systems/)
- [agents/2481 - Strands Agents Tools](../2481-strands-agents-tools/) - the other "adopt the package?" call this week, also SKIP

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build the retrieval half in `zao-retired-names check`: print the reason of the nearest allowed line beside each NEW finding. Shipped when a check run shows a stored reason next to a new line | @zj | PR (zaal-dotfiles) | 2026-09-19 |
| Measure the accept/reject signal already available: count merged vs closed Hermes auto-PRs over the last 90 days, so we know whether the Hermes critic has enough outcomes to learn from. Shipped when the count is in this doc | @zj | Measurement | 2026-09-19 |
| Re-snapshot the repo (`zao-research-snapshot Sumanth077/Hands-On-AI-Engineering`) and record the delta from 3,425 stars; a spike changes nothing about the licence | @zj | Measurement | 2026-10-11 |
| No adoption work on the project's code or its vendor stack | @zj | wontfix | wontfix |

## Sources

1. [FULL, `zao-fetch-x.sh`, tier 0 fxtwitter, raw text] Sumanth (@Sumanth_077), "I built a self-evolving code review agent!", 2026-09-11 14:19 UTC, 233 likes / 16 replies / 27,103 views - https://x.com/sumanth_077/status/2098416224803987968 (read 2026-09-11)
2. [FULL, `gh api .../contents`, base64-decoded raw] Project README, 184 lines - https://github.com/Sumanth077/Hands-On-AI-Engineering/tree/main/ai_agents/self_evolving_code_review_agent (HTTP 200, verified 2026-09-11)
3. [FULL, `gh api`, raw] `self_evolving_agent/memory.py`, `prompts.py`, `models.py` - the retrieval, the two prompts, and the `LearnedInsight` record
4. [FULL, `gh api` + `zao-research-snapshot`] Repo metadata: 3,425 stars, 862 forks, 9 open issues, 7 contributors, last activity 2026-09-08 - https://github.com/Sumanth077/Hands-On-AI-Engineering
5. [FULL, `gh api .../contents/LICENSE`] 404, no licence file - all rights reserved
6. [FULL, arXiv API] ExpeL: LLM Agents Are Experiential Learners, arXiv 2308.10144v3, published 2023-08-20 - https://arxiv.org/abs/2308.10144
7. [FULL, HN Algolia API, keyless] 0 stories for "ExpeL experiential learner"; 15 for `"code review" agent memory`, top 8 points - https://hn.algolia.com/api/v1/search
8. [FULL, local] `bot/src/hermes/critic.ts` (595 lines, 0 memory references) and `bot/src/zoe/critics/{research,comms,task-result}-critic.ts`
9. [FULL, local] `zaal-dotfiles/claude/retired-names-allow.json` - 56 allowed, 4 held, each with a reason
