---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-06-10
superseded-by:
related-docs: "836, 829, 833, 832, 824"
original-query: "Make the goal keep mining and find the best way to distribute and capture good information from media like this"
tier: STANDARD
---

# 838 - Media Capture & Distribute Pipeline (the standing system)

> **Goal:** Turn this session's ad-hoc "fetch -> read -> doc" motion into a repeatable ZAO pipeline: capture good information from media (X articles, videos, threads, Reddit, Farcaster, podcasts), synthesize it once, and distribute it everywhere - so mining compounds instead of evaporating.

## The one-line answer

**Capture -> Synthesize -> Distribute, with the inbox as the universal funnel, the research library + Bonfire as the synthesis store, and a routing layer to the social surfaces.** ZAO already owns every piece; the gap is they're disconnected. Wire them into one loop and the "keep mining" goal runs itself.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Keep the ZOE inbox (`zoe-zao@agentmail.to`) as the universal CAPTURE funnel - forward anything, anywhere** | It is the lowest-friction capture surface (forward from a phone). Now that the keyless trio fetches every link type FULL (docs 824/822/823), a forwarded link is a complete capture, not a title. One funnel, all media types. |
| 2 | **Add a recurring MINING engine as the second capture source (push, not just pull)** | The inbox is pull (Zaal forwards). The doc-836 + round-2 mining workflows are push - they go find signal from known high-signal authors. Schedule the mining workflow weekly (cron, like the fetch-healthcheck) so new agent/AI content is captured without Zaal lifting a finger. |
| 3 | **Route each capture to the RIGHT synthesis store by type: deep -> research doc, queryable -> Bonfire episode, durable fact -> memory** | Don't dump everything in one place. A 2,500-word talk -> a research doc (836/829). A one-line decision -> a memory. A "what did X say about Y" fact -> a Bonfire episode (agent-queryable). This is the synthesis layer that makes captures retrievable later. |
| 4 | **Distribution is a routing layer, not a manual step: high-signal synthesis auto-drafts to `/socials` + `/newsletter` + Bonfire, queued for one-tap Zaal review** | The leak today is that good synthesis dies in a research doc nobody re-reads. Every doc with public-shareable signal should auto-generate a Farcaster/X draft (`/socials`) and a newsletter blurb, queued for approval. Distribution closes the loop: shared content attracts more captures. |

## Findings - the pipeline, stage by stage

### Stage 1 - CAPTURE (get the raw signal in)

| Surface | What it captures | Status |
|---------|------------------|--------|
| ZOE inbox (forward to AgentMail) | any link/idea from phone | live; keyless-fetch now (doc 824) |
| Keyless fetch trio | Reddit / X+Articles / Farcaster, FULL bodies | live (docs 822/823/824) |
| `zao-ingest.sh` | YouTube / Spotify / podcast / video -> transcript | live (used for the Anthropic Skills talk, doc 829) |
| Mining workflow | push-discovery from known authors | built this session (docs 836 + round 2); not yet recurring |
| WebFetch / exa | articles, blogs, GitHub | live |

**Gap:** the inbox is pull-only and mining is one-shot. Fix = schedule the mining workflow (Decision 2).

### Stage 2 - SYNTHESIZE (turn signal into retrievable knowledge)

| Store | For | Retrieval |
|-------|-----|-----------|
| Research library (`research/**/README.md`, 836+ docs) | deep synthesis, decisions, comparisons | grep / future MCP resource server |
| Bonfire knowledge graph (`zabal.bonfires.ai`) | queryable episodes - "what did X say about Y" | POST /delve (doc on Bonfire recall) |
| Memory files (`feedback_*`, `project_*`) | durable facts + corrections | loaded each session |
| Cowork tracker | actions that fell out of a capture | Kanban |

**This is the Thariq "compound knowledge base" vision (doc 829/836):** anything captured + written down is usable by a future agent. The research library + Bonfire + memory are exactly that - they compound. **Gap:** captures don't auto-flow to Bonfire (a research doc rarely becomes an episode), so the agent-queryable layer is under-fed.

### Stage 3 - DISTRIBUTE (push the synthesis out)

| Surface | Reach | Status |
|---------|-------|--------|
| `/socials` skill | Farcaster + X (Firefly), Telegram, Discord, LinkedIn | live, manual |
| `/newsletter` | paragraph.xyz/@zao daily blog | live, manual |
| ZOE Telegram posts | 4-category daily pings | live |
| `/clipboard` | copy-ready share blocks | live |
| Bonfire | agent-to-agent distribution (other ZAO bots query it) | live |

**Gap:** distribution is fully manual and disconnected from synthesis. A doc ships, then someone separately decides to socialize it - usually never. Fix = Decision 4 (auto-draft from synthesis).

### The closed loop (the "best way")

```
  forward / mine  ->  fetch FULL (keyless trio + ingest)  ->  synthesize
       ^                                                          |
       |                                                          v
   more captures  <-  distribute (socials/newsletter/Bonfire)  <- route by value
```

The loop is what makes it a *system* rather than a chore: distributed content attracts new forwards + followers, which feed the next capture. Mining keeps the top of the funnel full even when Zaal is heads-down.

## ZAO Application - what to build (smallest -> biggest)

1. **Schedule the mining workflow weekly** (cron, mirrors `zao-fetch-healthcheck`). Push-capture runs itself. (small)
2. **Capture -> Bonfire bridge:** every research doc's Key Decisions auto-post as a Bonfire episode (PII-scrubbed per `pii-hygiene`). Feeds the agent-queryable layer. (medium)
3. **Synthesis -> `/socials` auto-draft:** a doc tagged shareable generates a Farcaster/X draft + newsletter blurb, queued in the inbox/clipboard for one-tap Zaal approval. (medium)
4. **ZOE as the pipeline orchestrator:** ZOE runs the loop - mines, routes captures to the right store, queues distribution drafts. The standing "keep mining" engine. (big; the doc-759-class orchestrator job)

## Also See

- [Doc 836](../../agents/836-x-account-mining-agent-patterns/) - the mining that prompted this (capture in action)
- [Doc 829](../../agents/829-anthropic-agent-skills-talk/) - Thariq/Anthropic "compound knowledge base" vision
- [Doc 824](../824-keyless-forkable-fetch-trio/) - the keyless capture layer

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Schedule the round-2 mining workflow weekly (cron, like fetch-healthcheck) | @Zaal | Infra | This week |
| Build the research-doc -> Bonfire episode bridge (PII-scrubbed) | @Zaal | Build | Next sprint |
| Wire synthesis -> /socials auto-draft (queued for approval, not auto-post) | @Zaal | Build | Next sprint |
| Decide ZOE's role as pipeline orchestrator (mines + routes + queues distribution) | @Zaal | Decision | When bandwidth |

## Sources

- This session's lived pipeline: inbox drain (docs 832/833), keyless fetch trio (824/822/823), ingest (829), mining (836 + round 2) `[FULL - primary; the system was run end-to-end this session]`
- [Thariq - compound knowledge base / skills as memory](https://github.com/shanraisshan/claude-code-best-practice/blob/main/tips/claude-thariq-tips-17-mar-26.md) `[FULL - the "write it down for a future agent" thesis underpinning the synthesis layer]`
- ZAO existing surfaces: `/socials`, `/newsletter`, `/clipboard`, `/bonfire`, `zao-ingest.sh`, the cowork tracker `[FULL - existing skill/tool inventory]`
