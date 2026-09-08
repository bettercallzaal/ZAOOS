---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-09-08
superseded-by:
related-docs: 2473, 2411, 070, 161, 202, 1031, 493
original-query: "OUTSIDE VIEW research doc: how do serious practitioners run many long-lived autonomous coding agents in parallel with one human approving (our setup: 15 tmux Claude Code sessions, one human dispatching via 46-char typed messages, target ~1hr/day in 15-min bursts); and how do agents efficiently retrieve from a large private markdown corpus (ours: 2,205 docs, 3.97M words / ~5.3M tokens, no index, no embeddings, grep -ri over 67MB). DEEP tier, community-only, doc 2474, paired with internal audit doc 2473."
tier: DEEP
---

# 2474 — Outside view: fleets of coding agents and grep-scale retrieval

> **Goal:** What does the rest of the world actually do for (A) one human approving many
> long-lived coding agents, and (B) retrieval over a private markdown corpus the size of
> ZAO's research library (2,205 docs / ~5.3M tokens)? External sources only — no ZAO
> internals.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Don't build a vector DB for the research library. Build SQLite FTS5 (BM25) first, add a small local embedding model only for paraphrase queries, fused with Reciprocal Rank Fusion.** | This is the exact architecture measured working at 2-8x our doc count (16,894 files → 23ms hybrid queries, 83MB single file, zero API calls) and independently recommended at *our exact scale* ("a couple thousand markdown notes" — AutoKaam, 2026-06-01), where FTS5-only carried 93.5% precision on the literal-token queries (doc numbers, brand names, slugs) that dominate ZAO's real query pattern |
| 2 | **Stop running 15 tmux lanes as flat, independently-typed sessions. Restructure into an explicit coordinator layer** (Claude Code's own `/batch` fan-out, or a lead/manager pattern) so Zaal approves at the coordinator, not per-worker | No practitioner report found sustains more than 6-8 concurrently-reviewed agents (malux85, HN) without ceding to a manager layer; the highest-volume reports of "10-20 parallel agents, one human" (Cognition/Devin) all route through a coordinator that scopes, monitors and compiles — never 15 flat peers |
| 3 | **Move status reporting from live dispatch to async proof-of-work review** — an agent's status file should say "here is proof this passed" (screenshot/test output/diff), not "here is what I'm doing" | This is the specific mechanism Devin uses to get a human to ~1hr/day: the human's job shrinks from "supervise execution" to "review a completed, self-verified artifact." Cognition reports test-runs-approved-per-day "more than doubled" after they shipped this pattern (2026-05) |
| 4 | **Turn on Claude Code's `auto` permission mode + curated `/permissions` allowlists on every lane**, reserving Manual mode for genuinely novel/risky actions | This is Anthropic's own, currently-shipped fix for exactly this pain: a classifier model reviews routine actions and blocks only scope-escalation/unknown-infra/hostile-content, cutting the "click through every one of 15 lanes' prompts" load without removing a human backstop |
| 5 | **Treat "15 always-on parallel coding agents" as a mismatch with vendor guidance, not a scale target to defend.** Cap fan-out to what each task's parallelizability actually supports | Anthropic's own multi-agent engineering post states plainly that "most coding tasks involve fewer truly parallelizable tasks than research" and that early over-eager fan-out (50 subagents for a simple query) was a bug they had to prompt away — a fixed fleet of 15 running regardless of task shape reproduces that exact failure mode |
| 6 | **Adopt `AGENTS.md` at the root as the cross-tool convention, with `@AGENTS.md` imported at the top of `CLAUDE.md`**, rather than treating CLAUDE.md as the only memory file | Read natively by 20+ tools (Codex, Cursor, Copilot, Jules, Aider, Windsurf, Zed, Amp, Factory, Devin) and adopted by 60,000+ repos under Linux Foundation stewardship; ZAO already runs more than one agent tool/lane shape, and duplicating conventions per tool is the exact drift AGENTS.md exists to stop |

## Question A — one human, many parallel coding agents

### What's actually shipping (first-party, verified against vendor docs)

**Claude Code itself** ships four distinct answers to "run many sessions with less human
babysitting," documented on the current (2026) version of its own best-practices page
[FULL - curl]:

1. **`auto` permission mode** — now the *built-in default* on Pro/Max/Team plans for
   interactive and VS Code sessions. "A separate classifier model reviews most actions
   instead of you and blocks only what looks risky, such as scope escalation, unknown
   infrastructure, or hostile-content-driven actions." Manual mode (ask-before-every-write)
   is the default only on other plans.
2. **Permission allowlists + sandboxing** — pre-approve specific tools (`npm run lint`,
   `git commit`) and enable OS-level sandboxing so Claude "works more freely within defined
   boundaries." Explicitly framed as the fix for "after the tenth approval you're clicking
   through rather than reviewing."
3. **`/batch <instruction>`** — splits one change across **5 to 30 subagents**, each in its
   own git worktree, each opening its own PR. The human reviews PRs, not sessions. The
   fallback for driving this from outside Claude Code is a shell loop over `claude -p
   "<prompt>" --allowedTools "Edit,Bash(git commit *)"` per file/task.
4. **Agent view / Agent teams** — `claude agents` dispatches sessions that keep running in
   the background, watchable from one screen; "Agent teams" (experimental, disabled by
   default) adds "automated coordination of multiple sessions with shared tasks, messaging,
   and a team lead."

Source: [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices) [FULL - curl + strip, verified against the live page 2026-09-08]

**Anthropic's own multi-agent research-system post** [FULL - curl] gives the numbers behind
why fan-out helps and where it stops helping:

- Multi-agent (Opus 4 lead + Sonnet 4 subagents) beat single-agent Opus 4 by **90.2%** on
  their internal research eval.
- **Token usage alone explains 80% of the performance variance** on the BrowseComp eval;
  tool-call count and model choice explain the rest.
- Agents use **~4x** the tokens of a chat interaction; multi-agent systems use **~15x**.
- Parallelizing 3-5 subagents (lead) and 3+ tools per subagent (workers) **cut research time
  by up to 90%**.
- The explicit counter-case: **"most coding tasks involve fewer truly parallelizable tasks
  than research, and LLM agents are not yet great at coordinating and delegating to other
  agents in real time."** Early versions made the mistake of "spawning 50 subagents for
  simple queries" — fixed by embedding effort-scaling rules (1 agent / 3-10 calls for simple
  fact-finding; 10+ agents only for genuinely complex, dividable work).

Source: [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), published 2025-06-13 [FULL - curl + strip, re-verified 2026-09-08]

**This is a direct, unresolved tension with ZAO's setup.** ZAO runs 15 parallel *coding*
lanes continuously — the exact category Anthropic's own engineering team says has "fewer
truly parallelizable tasks" than the research workload the fan-out pattern was built for.
Fifteen fixed lanes regardless of task shape is architecturally closer to "spawn 50
subagents for a simple query" than to the scaling-rule discipline the same post recommends.

### Devin / Cognition — the closest real-world match to "one human, many agents"

Cognition's own engineering blog is the most direct evidence of a company managing 10-20+
agents against one human's attention budget, and it explicitly rejects the flat-fleet shape:

- **"Multi-Agents: What's Actually Working"** (2026-04-22): *"Our original observations
  still hold today for parallel-writer swarms: most of the sexy ideas in that space still
  don't see meaningful adoption... unstructured swarms, arbitrary networks of agents
  negotiating with each other, is mostly a distraction. The practical shape is
  map-reduce-and-manage: a manager splits work, children execute, the manager synthesizes
  and reports back."* [PARTIAL - exa web_search highlights, substantial excerpts]
- Their working pattern keeps **writes single-threaded** — one coding agent writes, a
  second reviewer agent (Devin Review) catches bugs (**avg. 2 bugs/PR, ~58% severe**) and
  the two iterate *before* a human ever opens the PR.
- "Devin can now Manage Devins" (child-session delegation): the parent Devin scopes,
  assigns, monitors, resolves conflicts, and compiles results from managed child sessions —
  the human interacts with the coordinator, not each child.
- A named report of the raw parallelism ceiling: *"engineers running 10 to 20 Devins in
  parallel, each with its own dev server... this is something you simply can't do on a
  single laptop"* — for cloud-based **autonomous verification** work specifically (the
  agent tests its own app and returns a video/screenshot proof), not live human-supervised
  coding.
- Devin's 2025 performance review states test-coverage clients see typically rise from
  **50-60% to 80-90%**, and that Devin's failure mode is different from a junior human's:
  it "performs worse when you keep telling it more after it starts" — i.e. it needs
  up-front scoping, not live steering, which is the opposite of a human typing 46-char
  messages into a session mid-task.

Sources: [Multi-Agents: What's Actually Working](https://cognition.com/blog/multi-agents-working) (2026-04-22), [Devin can now Manage Devins](https://cognition.com/blog/devin-can-now-manage-devins), [Devin's 2025 Performance Review](https://cognition.com/blog/devin-annual-performance-review-2025) (2025-11-14), [Verifying Agentic Development at Scale](https://www.linkedin.com/pulse/verifying-agentic-development-scale-ido-pesok-meohc) (2026-05-29) — all [PARTIAL - exa web_search highlights; not independently re-fetched with curl since Cognition's blog is a JS app shell under curl]

### The open-source tmux/worktree fleet tooling — what actually has traction

| Repo | Stars | Open issues | Last push | License (from LICENSE file) | Verdict |
|---|---|---|---|---|---|
| `All-Hands-AI/OpenHands` | 86,657 | 676 | 2026-09-07 | MIT | Full agent framework, not fleet-specific, active and current |
| `SWE-agent/SWE-agent` | 20,270 | 100 | 2026-09-07 | MIT | Research-grade single-agent SWE-bench harness, healthy ratio |
| `Aider-AI/aider` | 48,820 | 1,855 | 2026-05-22 | Apache-2.0 | **Stale** — no push in ~3.5 months against 1,855 open issues; "architect mode" (separate planner/coder roles) is real but the project's cadence has slowed |
| `smtg-ai/claude-squad` | 8,442 | 57 | 2026-08-20 | AGPL-3.0 (LICENSE file has no header text, spdx classified AGPL-3.0) | tmux+worktree session manager built specifically for this use case; healthiest issue ratio of the group |
| `stravu/crystal` | 3,115 | 68 | 2026-02-26 | MIT | Desktop multi-Claude-session manager; **stale**, 6+ months no push |
| `BloopAI/vibe-kanban` | 28,033 | 539 | 2026-04-24 | Apache-2.0 | Kanban-for-agents; **stale relative to star count** — no push in ~4.5 months, 539 open issues is a real backlog |
| `ruvnet/claude-flow` | 71,387 | 946 | 2026-09-08 (today) | MIT | Very active, but 946 open issues on a swarm-orchestration framework is a heavy backlog — treat popularity and health as separate axes, per the skill's own standing warning about ComposioHQ's 74,586-star / 1,410-issue / no-recent-commit repo |

Method: `gh api repos/<owner>/<repo>` for stars/issues/pushed_at; `gh api
repos/<owner>/<repo>/contents/LICENSE --jq .content | base64 -d` for the license text
itself, per the "read the file, not the classifier field" rule. [FULL - gh api, verified
2026-09-08]

**Practitioner sentiment (Hacker News, both threads read in full via the keyless Algolia
API)** — this is where the real ceiling on "one human, many agents" shows up, and it is well
below 15:

- **bob1029**: *"One 'slow' agent can outpace many fast ones if they're making a lot of
  mistakes... just because we can consume $100 of tokens in 60 seconds doesn't mean we
  should."* Argues for strict serial depth-first dispatch, zero parallel tool calls.
- **koliber**: *"the limiting factor is my attention. Even when I really tried to do this in
  parallel I could not meaningfully run more than three sessions."*
- **ecesena**: tmux, 4 panes, 4 workspaces — but *"most of the times I use 2 concurrently...
  the limit tbh is me and my ability to keep up with what's happening."* Notably works in
  security/crypto and says he must "audit the results very carefully" — the more the review
  matters, the lower his real concurrency.
- **malux85**: *"6-8 running nearly 24/7, any more than that and there's too much for me to
  review."* The single highest sustained-concurrency number found in this search, and it is
  tied explicitly to a 20-year developer's own review bandwidth, not to tooling.

Sources: [Ask HN: How do you run parallel agent sessions?](https://news.ycombinator.com/item?id=46682551) (2026-01-19, 7 pts / 2 comments, read in full) [FULL - Algolia API]; [Ask HN: How many AI agents do you actively use?](https://news.ycombinator.com/item?id=49092442) (2026-07-29, 4 pts / 17 comments, read in full) [FULL - Algolia API]

**Contradiction, flagged and not resolved:** bob1029's anti-parallelism position and
Anthropic/Cognition's pro-fan-out position are not actually in conflict once you separate by
task shape — bob1029 is arguing about open-ended/creative problem-solving, Anthropic and
Cognition both restrict their parallelism claims to well-scoped, independently-verifiable
subtasks (migrations, per-page QA, per-module test-writing). The unresolved part for ZAO:
which of those two shapes describes each of the 15 current lanes has not been established
by this outside-view pass — that's a question for the internal audit (doc 2473), not
answerable from community sources alone.

### The permission/approval-batching landscape beyond Claude Code

- **Cursor background agents**: run in the cloud, triggered from Slack/dashboard/API/repo
  YAML; async by design (the read side of Mintlify's assistant, built on the same async
  pattern, serves >23M queries/month with an entirely separate sync-vs-async harness split
  for exactly this reason — see Question B sources).
- **Aider's "architect mode"**: splits planning (one model/role proposes a plan) from
  editing (a second role executes it) inside a *single* session rather than across a fleet —
  a cheaper, lower-parallelism version of the writer/reviewer split Devin and Claude Code
  both also ship. Aider's own repo cadence has slowed (see table above), so treat this as a
  documented pattern more than a maintained product to depend on.
- **No practitioner report found** of a sustainable 15-flat-lane, single-human-typing setup
  at anything like ZAO's throughput target. Every real report of double-digit parallelism
  (Devin's 10-20, Cognition's fleet-of-Devins-per-repo) routes through an explicit
  coordinator and/or autonomous self-verification before the human sees anything — never
  flat peers dispatched by hand-typed messages.

## Question B — retrieval over a 2,205-doc / ~5.3M-token markdown corpus

### The threshold that actually matters first: are we even past "just paste it in"?

Anthropic's own Contextual Retrieval post states the baseline directly: **"If your knowledge
base is smaller than 200,000 tokens (about 500 pages of material), you can just include the
entire knowledge base in the prompt... with no need for RAG or similar methods."** ZAO's
corpus is ~5.3M tokens — **~26x past that threshold**. This is not a case where the answer
is "don't bother with any retrieval layer"; some external index is required. The question is
which kind.

Source: [Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval), published 2024-09-19 [FULL - curl + strip, re-verified 2026-09-08]. That post's own headline numbers (relevant if ZAO ever adds embeddings on top of lexical search): Contextual Embeddings alone cut top-20 retrieval failure by **35%** (5.7%→3.7%); combined with Contextual BM25, **49%** (5.7%→2.9%); combined with reranking, **67%**. One-time contextualization cost with prompt caching: **$1.02 per million document tokens**.

### The live "grep vs. RAG" debate — both sides, not smoothed into consensus

**The empirical paper everyone is citing:** *"Is Grep All You Need? How Agent Harnesses
Reshape Agentic Search"* (Sen, Kasturi, Lumer, Gulati, Subbiah; arXiv:2605.15184, submitted
2026-05-14). Abstract, read directly: across a 116-question LongMemEval subset, using
Claude Code, Codex, and Gemini CLI as harnesses plus a custom agent (Chronos), **"grep
generally yields higher accuracy than vector retrieval,"** but **"overall scores still
depend strongly on which harness and tool-calling style is used, even when the underlying
conversation data are the same."** [FULL - curl, abstract page only; the PDF body was not
fetched — treat the per-harness breakdown below as HN-reported, not independently verified
against the paper's own tables]

The 42-comment HN thread on this paper (read in full via Algolia) surfaces real, unresolved
pushback — flagged explicitly rather than smoothed:

- **SkyPuncher**: *"Table 2 and 3 tell you basically all you need to know. When you use a
  harness that is tuned towards programming (Codex and Claude Code), grep wins. When you use
  a neutral harness, vector search wins."* — i.e. the headline "grep wins" result may be an
  artifact of testing on coding-tuned harnesses, not a general truth about markdown/document
  retrieval.
- **quinncom**: *"Don't presume this study has anything to do with programming. They
  measured an agent's ability to search long conversations, not code."* — LongMemEval is a
  conversational-memory benchmark, not a docs-corpus benchmark; the read-across to a
  2,205-document research library is an inference, not a tested claim.
- **yetanotherjosh**: argues the benchmark itself favors literal-string recall ("exact
  dates, counts, preferences, spans... stable under tokenization") over the kind of query
  ("a conversation about a Beethoven sonata, then a question about classical music") where
  embeddings would be expected to win — i.e. possible benchmark selection bias toward grep.
- **softwaredoug** (an independent search-relevance consultant, commenting on his own related
  work): *"grep is fine if you don't care about tokens and you have less than 100k files...
  it requires you to eat tokens... if you think grep is great, it's because you've been
  social engineered to organize your content to be findable"* — i.e. grep's apparent
  performance is partly a property of well-organized corpora, not the tool itself.

Sources: [arXiv:2605.15184 abstract](https://arxiv.org/abs/2605.15184) [FULL - curl]; [HN
thread, 42 comments](https://news.ycombinator.com/item?id=48460863) [FULL - Algolia API, read
in full]

**The vendor counter-argument** (LlamaIndex, a company that sells RAG infrastructure — read
this bias directly, not smoothed away): their own published piece on the same paper agrees
grep is the right tool up to a specific, named ceiling, and states that ceiling explicitly:
**"A text corpus is available... the corpus is small (hundreds to thousands of documents), so
an agent can pick which files to search without drowning in a low signal-to-noise ratio."**
Past that: *"the original grep takes more than 4 seconds to scan 1,000,000 files... even with
sub-second alternatives like ripgrep, the noise from random, out-of-scope matches quickly
fills the agent's context window."* Their stated breakdown point for needing semantic search
is when a corpus reaches "millions of documents," is heterogeneous/unstructured (PDFs,
slides, scans), or when queries use vocabulary the corpus doesn't ("revenue recognition" vs.
"ASC 606").

Source: [Is grep all you need? Lexical VS Semantic Search for Agents](https://www.llamaindex.ai/blog/is-grep-all-you-need-lexical-vs-sematic-search-for-agents), published 2026-05-26 [FULL - curl + strip, re-verified 2026-09-08]

**Where ZAO sits in this debate, stated plainly:** 2,205 documents, all plain markdown, is
squarely inside LlamaIndex's own "grep is fine" band ("hundreds to thousands... a handful of
markdown notes") and nowhere near their stated "millions of documents, unstructured formats"
threshold for needing semantic search. The arXiv paper's "grep wins" result is contested for
transferring to a non-coding, non-conversational corpus like ZAO's — so neither side of this
debate, taken alone, tells ZAO what to build. What resolves it is the third category of
evidence below: reports measured on a corpus in ZAO's own shape and scale.

### The evidence that actually matches ZAO's scale (markdown corpora, thousands of files)

This is the load-bearing section — real, numbered reports at 500 to ~17,000 markdown files,
bracketing ZAO's 2,205:

1. **AutoKaam, "I Gave My AI Agents a Memory With SQLite FTS5 (No Vector DB)"** (2026-06-01)
   — describes *exactly* ZAO's situation: "a self-hosted stack of coding and ops agents...
   share a folder of markdown notes... for a personal corpus of a couple thousand markdown
   notes... my queries are names, project slugs, error codes, config flags, the literal
   token I half-remember." Measured head-to-head against a local vector model (bge-m3):

   | Retriever | Keyword queries (p@3) | Paraphrase queries (hit@3) |
   |---|---|---|
   | FTS5 BM25 | 93.5% | 38% |
   | Pure vector (bge-m3) | 97.4% | 50% |

   Shipped design: a small regex router sends ID/slug/error-code-shaped queries to FTS5 and
   everything else to the vector path — because "pure vector almost never returns zero hits,
   so an exact-token query for a specific ID would get plausible-looking neighbours instead
   of the one correct file." Retrieval cost on the FTS5 path: sub-second, zero tokens, zero
   API calls. [PARTIAL - exa web_search highlights; substantial verbatim excerpts including
   the table above, not independently re-fetched via curl]

2. **Blake Crosley, "Building a Hybrid Retriever for 16,894 Obsidian Files"** (2026-03-01) —
   the largest comparable corpus found (~8x ZAO's doc count). Measured numbers: **raw `grep
   -rl` over the vault takes 11-66 seconds** depending on term and "returns hundreds of
   low-relevance matches"; "FTS5-only search became unusable for the author above ~3,000
   files due to keyword collision rates" (directly bracketing ZAO's 2,205 — i.e. ZAO is
   close to the point where lexical-only would start degrading for this specific author's
   corpus and query mix, though the failure threshold is corpus- and query-dependent, not a
   hard universal number). His hybrid fix — FTS5 BM25 + Model2Vec static-embedding vectors,
   fused with Reciprocal Rank Fusion, all in one SQLite file — returns the right result in
   **23ms end-to-end** from an **83MB database holding 49,746 chunks**, with **zero API
   calls**. Full reindex: **4 minutes**; incremental reindex: **under 10 seconds**. Chunking
   is done at heading boundaries, not whole-file. Embedding model: Model2Vec's
   `potion-base-8M` — 7.6M parameters, CPU-only, no GPU, ~30MB, reported at "up to 500x" the
   inference speed of a full sentence-transformer for a documented ~11% MTEB score cost.
   [PARTIAL - exa web_search highlights, substantial verbatim excerpts including all numbers
   above; not independently re-fetched via curl]

3. **hkfi.dev, "From Keyword Search to Vector Search: A Practical Guide with SQLite"**
   (2026-02-28) — smaller corpus (~500 notes / 2,000 chunks) but a clean head-to-head query
   table (FTS5 wins on "error code 502", "React useState"; vector wins on "meeting notes" →
   "standup recap", "feeling stuck" → notes about blockers) and a directly stated
   recommendation to run both ("many production search systems... work this way"). Measured
   on an M1 MacBook: FTS5 query **<1ms**, vector query **~5-15ms** including query embedding.
   [PARTIAL - exa web_search highlights]

4. **recalso.hashnode.dev, on-device hybrid search architecture** (2026-07-12) — states the
   design principle most directly transferable to ZAO: *"A broad keyword scope [FTS5]...
   cheap to build, cheap to keep fresh, and it nails the exact-match queries that embeddings
   fumble. A narrow semantic scope [embeddings]... bounded by consent [or, for ZAO, by
   cost/complexity] rather than by disk size."* Reports an **86x** improvement moving
   filename lookup from a linear scan onto FTS5 (their own single-machine measurement, flagged
   by the source itself as one-machine/one-corpus). [PARTIAL - exa web_search highlights]

5. **`briansunter/vannevar`** (open-source reference implementation) — FTS5 + HNSW vector
   index + RRF fusion for local markdown search, fully offline via a quantized ONNX embedding
   model (nomic-embed-text-v1.5, ~111MB). Reported latencies on its own bundled benchmark: FTS
   queries ~0.1ms, vector search ~14ms, fused hybrid ~11ms. This is a directly reusable
   open-source shape rather than a report to merely cite. [PARTIAL - exa web_search
   highlights; repo not independently checked for stars/issues/license in this pass]

**Synthesis, stated as a decision, not a hedge:** every source measured at or above ZAO's
corpus size uses the *same* architecture — SQLite FTS5/BM25 as the default path, a small
local (not hosted) embedding model as a secondary path for paraphrase-shaped queries,
fused with Reciprocal Rank Fusion, chunked at heading boundaries rather than per-file. None
of them reach for LanceDB, Chroma, Pinecone, or any hosted vector database at this scale —
the one hosted-vector example found (Mintlify's ChromaFs, below) is a different problem
shape entirely (a public-facing chat product serving 23M+ queries/month across many
concurrent users, not a private single-operator research library).

### The adjacent case that is NOT ZAO's case, so it should not set ZAO's architecture

**Mintlify's ChromaFs** (2026-03-24) is the most-cited "we replaced RAG with grep" story
this quarter and is frequently misread as "grep beat vector search." Read directly, it is
the opposite: Mintlify's docs corpus is **already stored in a Chroma vector database**, and
ChromaFs is a *grep-shaped interface layered on top of that same vector database* — a
virtual filesystem that intercepts `grep`/`cat`/`ls`/`find` calls and translates them into
Chroma queries, because their actual bottleneck was **sandbox session-creation latency**
(46 seconds p90 to clone a real repo into a container), not retrieval quality. Their fix cut
that to **~100ms** and eliminated per-conversation compute cost (~$0.0137/conversation → ~$0)
at their scale (850,000 conversations/month, 23M+ queries/month). This is a real, well-
measured result, but it answers "how do I give an agent a fast filesystem interface over a
database I already have," not "should ZAO build a vector database." ZAO has no existing
vector infrastructure and no per-conversation-latency problem at 15 lanes — this pattern
does not transfer.

Sources: [How we built a virtual filesystem for our Assistant](https://www.mintlify.com/blog/how-we-built-a-virtual-filesystem-for-our-assistant), 2026-03-24 [FULL - exa web_fetch, full page text retrieved]; [Inside Mintlify's Agent Stack](https://theairuntime.com/p/inside-mintlifys-agent-stack), 2026-05-06 [PARTIAL - exa web_search highlights]; [HN discussion](https://news.ycombinator.com/item?id=47618223) [PARTIAL - exa web_search highlights, partial comment excerpts only]

### Agent memory / knowledge-base conventions

- **`AGENTS.md`**: an open, vendor-neutral Markdown convention, now stewarded by the Linux
  Foundation's Agentic AI Foundation, adopted by **60,000+ repositories**, read natively by
  20+ tools (OpenAI Codex, Cursor, GitHub Copilot, Google Jules, Aider, Windsurf, Zed,
  Sourcegraph Amp, Factory, Devin, and more). Claude Code reads `CLAUDE.md` instead; the
  documented interop pattern is a one-line `@AGENTS.md` import at the top of `CLAUDE.md`
  rather than duplicating content. Precedence rule: user chat prompt > nearest `AGENTS.md` >
  parent `AGENTS.md`. OpenAI's own Codex monorepo ships **88** nested `AGENTS.md` files, one
  per subproject — evidence this scales past a single root file for large multi-part
  estates. Sources: [agents.md](https://agents.md/) [PARTIAL - exa web_search highlights];
  [Atlan docs on AGENTS.md](https://docs.atlan.com/agents/concepts/agents-md) [PARTIAL - exa
  web_search highlights]
- **`SKILL.md`**: Anthropic's separate, narrower spec — a reusable, packaged capability
  (with required YAML frontmatter, bundled scripts, references) versus `AGENTS.md`'s
  freeform project-convention text. The documented rule of thumb, per the same source set:
  "if you would tell every new engineer this, it belongs in AGENTS.md. If only the engineer
  using Claude Code, CLAUDE.md. If it's a packaged, reusable capability with code, SKILL.md."
- **MCP resource servers**: not evidenced in this pass as a mainstream pattern specifically
  for *markdown research-library* retrieval — the community sources found for MCP in this
  search were about tool/action servers (GitHub, Slack, etc.), not document-corpus resource
  servers. This is a gap in what this outside-view pass could verify, not a claim that no
  such pattern exists; flagged rather than filled with inference. [Not found — do not treat
  absence as evidence of absence beyond "not surfaced by this search"]

## Contradictions, stated explicitly (not resolved into false consensus)

| # | Source A | Source B | The actual disagreement |
|---|---|---|---|
| 1 | arXiv 2605.15184 abstract: "grep generally yields higher accuracy than vector retrieval" | HN commenter SkyPuncher, reading the paper's own Table 2/3: result flips to favor vector search on "neutral" (non-coding-tuned) harnesses | Whether the "grep wins" headline is a property of retrieval itself or an artifact of testing only on coding-tuned harnesses (Claude Code, Codex) — unresolved in the paper's own abstract |
| 2 | softwaredoug: "grep is fine if you don't care about tokens and you have less than 100k files" | LlamaIndex: grep viable only up to "hundreds to thousands" of documents before signal-to-noise and latency degrade | Two different people naming two very different ceilings (100,000 files vs. a few thousand) for when grep-only stops working — not reconciled anywhere in the sources found |
| 3 | Anthropic's own engineering blog: multi-agent fan-out is a poor fit for "most coding tasks" (fewer parallelizable subtasks than research) | ZAO's current architecture: 15 parallel long-lived *coding* agents, run continuously | This is not two sources disagreeing with each other — it is ZAO's live setup in tension with its own primary vendor's published guidance about when parallel fan-out helps |
| 4 | bob1029 (HN): strict serial dispatch beats parallel fan-out; "just because we can consume $100 of tokens in 60 seconds doesn't mean we should" | Anthropic + Cognition: parallel fan-out cuts research time up to 90%, fleet-of-agents raises test coverage 50-60%→80-90% | Resolved by task shape, not universally: every pro-parallelism source restricts the claim to well-scoped, independently verifiable subtasks; bob1029's counter-example is open-ended problem-solving. Which of ZAO's 15 lanes are which shape is not established by outside sources |

## Sources

1. [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — Anthropic, 2025-06-13 [FULL - curl + HTML strip, re-verified 2026-09-08]
2. [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices) — Anthropic, current as of 2026-09-08 [FULL - curl + HTML strip]
3. [Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) — Anthropic, 2024-09-19 [FULL - curl + HTML strip, re-verified 2026-09-08]
4. [Ask HN: How do you run parallel agent sessions?](https://news.ycombinator.com/item?id=46682551) — 2026-01-19, 7 pts, 2 comments, read in full [FULL - HN Algolia API]
5. [Ask HN: How many AI agents do you actively use?](https://news.ycombinator.com/item?id=49092442) — 2026-07-29, 4 pts, 17 comments, read in full [FULL - HN Algolia API]
6. [Ask HN: Why are so many rolling out their own AI/LLM agent sandboxing solution?](https://news.ycombinator.com/item?id=46699324) — 2026-01-20, 32 pts, 18 comments, read in full [FULL - HN Algolia API]
7. [Is Grep All You Need? How Agent Harnesses Reshape Agentic Search](https://arxiv.org/abs/2605.15184) — Sen, Kasturi, Lumer, Gulati, Subbiah, arXiv:2605.15184, submitted 2026-05-14 [FULL - curl, abstract page; PDF body not fetched]
8. [HN discussion of arXiv:2605.15184](https://news.ycombinator.com/item?id=48460863) — 164 pts, 64 comments (42 read in full) [FULL - HN Algolia API]
9. [Is grep all you need for RAG?](https://softwaredoug.com/blog/2026/04/06/agentic-search-is-having-a-grep-moment.html) — Doug Turnbull, 2026-04-06 [FULL - curl + HTML strip]
10. [Is grep all you need? Lexical VS Semantic Search for Agents](https://www.llamaindex.ai/blog/is-grep-all-you-need-lexical-vs-sematic-search-for-agents) — LlamaIndex, 2026-05-26 [FULL - curl + HTML strip]
11. [How we built a virtual filesystem for our Assistant](https://www.mintlify.com/blog/how-we-built-a-virtual-filesystem-for-our-assistant) — Mintlify, 2026-03-24 [FULL - exa web_fetch, full page]
12. [Inside Mintlify's Agent Stack](https://theairuntime.com/p/inside-mintlifys-agent-stack) — The AI Runtime, 2026-05-06 [PARTIAL - exa web_search highlights]
13. [I Gave My AI Agents a Memory With SQLite FTS5 (No Vector DB)](https://autokaam.com/tutorials/fts5-bm25-memory-for-ai-agents-markdown/) — AutoKaam, 2026-06-01 [PARTIAL - exa web_search highlights, substantial verbatim excerpts]
14. [Building a Hybrid Retriever for 16,894 Obsidian Files](https://blakecrosley.com/blog/hybrid-retriever-obsidian) — Blake Crosley, 2026-03-01 [PARTIAL - exa web_search highlights, substantial verbatim excerpts]
15. [From Keyword Search to Vector Search: A Practical Guide with SQLite](https://hkfi.dev/blog/post/keyword-to-vector-search-sqlite) — hkfi, 2026-02-28 [PARTIAL - exa web_search highlights]
16. [Local Memory for AI Coding Agents: SQLite vs Vector DB](https://www.devcrea.com/ai-agent-memory-system) — Ekin Yalgın, 2026-07-17 [PARTIAL - exa web_search highlights]
17. [Hybrid search on-device: why we index every filename with SQLite FTS5](https://recalso.hashnode.dev/hybrid-search-on-device-why-we-index-every-filename-with-sqlite-fts5-and-embed-only-what-matters) — recalso, 2026-07-12 [PARTIAL - exa web_search highlights]
18. [Vannevar (briansunter/vannevar)](https://briansunter.com/projects/vannevar) — local hybrid FTS5+HNSW markdown search [PARTIAL - exa web_search highlights]
19. [Multi-Agents: What's Actually Working](https://cognition.com/blog/multi-agents-working) — Cognition (Walden Yan), 2026-04-22 [PARTIAL - exa web_search highlights, substantial excerpts]
20. [Devin can now Manage Devins](https://cognition.com/blog/devin-can-now-manage-devins) — Cognition [PARTIAL - exa web_search highlights]
21. [Devin's 2025 Performance Review: Learnings From 18 Months of Agents At Work](https://cognition.com/blog/devin-annual-performance-review-2025) — Cognition, 2025-11-14 [PARTIAL - exa web_search highlights]
22. [Verifying Agentic Development at Scale](https://www.linkedin.com/pulse/verifying-agentic-development-scale-ido-pesok-meohc) — Ido Pesok, 2026-05-29 [PARTIAL - exa web_search highlights]
23. [AGENTS.md](https://agents.md/) — open spec site [PARTIAL - exa web_search highlights]
24. [AGENTS.md | Atlan Documentation](https://docs.atlan.com/agents/concepts/agents-md) [PARTIAL - exa web_search highlights]
25. GitHub repo data (stars/issues/pushed_at/license) for `All-Hands-AI/OpenHands`, `SWE-agent/SWE-agent`, `Aider-AI/aider`, `smtg-ai/claude-squad`, `stravu/crystal`, `BloopAI/vibe-kanban`, `ruvnet/claude-flow` — [FULL - `gh api`, license read from LICENSE file per Hard Requirement 13, verified 2026-09-08]

**Reddit: FAILED.** `~/bin/zao-fetch-reddit.sh --selftest` was run first, per the task's
fetch discipline. Result: creds absent, OAuth token endpoint returns HTTP 401, public
`.json` endpoints return `text/html` (walled), 0/3 sampled Redlib mirrors answered. No
Reddit source was substituted with a WebSearch snippet. This is a known, dated condition of
this machine's headless routes (also recorded in ZAO research doc 2282), not specific to
this topic.

## Also See

- [Doc 2473 — The orchestrator's own capability audit](../2473-orchestrator-capability-audit/) — the paired internal-view doc measuring ZAO's actual tool/skill/lane usage against this outside view
- [Doc 2411 — We have thirty tools and use six](../../dev-workflows/2411-tool-usage-audit-measured/) — measured MCP/tool usage inside ZAO; relevant to whether an MCP resource server for the research library would actually get called
- [Doc 070 — Sub-agents vs Agent Teams](../070-subagents-vs-agent-teams/) — prior ZAO mapping of these two paradigms, pre-dating Claude Code's now-shipped "Agent teams" feature
- [Doc 161 — Agent Harness Engineering (LangChain)](../161-agent-harness-engineering-langchain/) — virtual filesystems and the Ralph Loop, relevant background to the ChromaFs pattern above
- [Doc 1031 — Zaal's Second Brain](../../dev-workflows/1031-second-brain-system-design/) — the retrieval-habit half of ZAO's own knowledge system, worth reconciling with the FTS5 recommendation here

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Prototype a SQLite FTS5 (BM25) index over the 2,205-doc research library, chunked at H2/H3 boundaries with frontmatter fields as indexed columns; benchmark query latency against current `grep -ri` on the 20 most-recent real research queries | Zaal | PR to ZAOOS | 2026-09-19 |
| Decide whether to add a secondary local-embedding path (Model2Vec-style, CPU-only) behind a lexical/semantic query router, based on the FTS5-only benchmark's paraphrase-query failure rate | Zaal | Decision doc, re-research this doc | 2026-10-03 |
| Draft an `AGENTS.md` at the ZAOOS repo root that `@`-imports into the existing `CLAUDE.md`, covering build/test/structure conventions currently duplicated across tool-specific files | Zaal | PR to ZAOOS | 2026-09-19 |
| Redesign at least one of the 15 tmux lanes to report status as a completed, self-verified artifact (diff + test result, not a live narration) and measure whether it reduces Zaal's typed-message volume for that lane over one week | Zaal | Pilot, tracked in cowork tracker | 2026-09-22 |
| Read doc 2473 (internal audit) alongside this doc and produce a combined recommendation on lane count and coordinator structure, since this outside-view pass could not determine which of the 15 lanes are genuinely parallelizable-task-shaped vs. exploratory-shaped | Zaal | Follow-up research doc | 2026-09-15 |
