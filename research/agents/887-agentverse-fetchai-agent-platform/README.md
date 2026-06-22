---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-21
superseded-by:
related-docs: 262, 601, 759, 883
original-query: "https://agentverse.ai/agents/launch?sign_up=true /zao-research this and then /clipboard how i should use it"
tier: STANDARD
---

# 887 — Agentverse (Fetch.ai): What It Is + How ZAO Should Use It

> **Goal:** Understand Agentverse (the page behind that sign-up link), decide whether ZAO should publish an agent there, and give Zaal a concrete first-run path.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **DO launch ONE hosted "ZAO concierge" agent as a discovery experiment** | Free tier, no infra, no FET needed for hosted agents. The real prize is **ASI:One discoverability** - when someone asks Fetch.ai's ASI:One LLM about web3 music communities / DAOs, a well-README'd ZAO agent can get routed the query. Costs ~30 min + a good README. |
| 2 | **Make it READ-ONLY / informational, NOT a new autonomous loop** | ZAO's "no new bots without doc" rule (Doc 601) - this doc IS that approval, but the agent must be a discovery/FAQ surface (answers "what is ZAO / ZAOstock / how to join"), not a process that acts. It does NOT replace or join the ZOE/Hermes stack. |
| 3 | **Do NOT migrate the ZAO agent stack to Agentverse** | ZOE/Hermes are Telegram-native, locked architecture (Doc 759). Agentverse is Python/uAgents, stateless-per-call, crypto-token-coupled, early-stage (reliability + downtime complaints, weak monitoring). Wrong home for ZAO's core ops. Use it as a shop-window, not a kitchen. |
| 4 | **Skip FET/token spend for now** | Hosted agents register to ASI Mainnet **free** under the subscription plan. Only LOCAL agents need a FET-funded wallet. Stay on hosted; no crypto friction. The ASI:One API key (asi1.ai) is the only credential needed for chat. |
| 5 | **Reuse the Agentverse "Agent Listing Generator" + feed it ZAO's canonical pitch** | The README is what ASI:One indexes for routing. Feed it the canonical one-line pitch ("decentralized impact network") + ZAOstock/ZABAL context so the agent gets matched to the right queries. |

## What Agentverse Is

- **Agentverse** = Fetch.ai's cloud platform to **create, host, and discover AI agents**. Browser-based code editor (the "Agent Editor"), Python templates, an agent **Marketplace**, and managed hosting. The sign-up link (`agentverse.ai/agents/launch?sign_up=true`) drops you straight into the "Launch an Agent" flow.
- **Who runs it:** Fetch.ai (UK, founded 2017), a founding member of the **ASI Alliance** (merged with SingularityNET + CUDOS under the **ASI token**, formerly FET).
- **The stack:** agents are built with the **uAgents** Python framework, register on the **Almanac** smart contract (Fetch.ai/Cosmos chain), and become discoverable + callable.
- **ASI:One** = Fetch.ai's "Web3-native LLM." Unlike a closed LLM, it **routes user queries to registered agents** that act as domain experts (book a hotel, answer specialist questions). This is the distribution channel - get your agent indexed, ASI:One sends it real traffic. There is also an **ASI:One consumer app** (iOS 4.9/5, 34 reviews).
- **Agent types:** `Hosted` (cloud, managed, no infra), `Local` (your machine, needs FET-funded wallet), `Mailbox` (offline message inbox so the agent need not be always-on), `Proxy`, `Custom`. Marketplace search filters: `is:hosted`, `is:local`, `is:mailbox`, etc.
- **Hosted agent mechanics:** one `agent.py`, **stateless** - globals reset after each call; persistence needs **Agent Storage**. Pre-built templates (stock price, nearby restaurants, blank). Config/seed/address are pre-set and can't be overwritten. Click `Run`.
- **Discoverability ranking:** implement the **Agent Chat Protocol (ACP)** for a ranking boost + ASI:One compatibility; keep the agent **Active**; optimize **README + metadata + tags + category** (README is full-text indexed by ASI:One). Inactive agents decay in search.
- **Pricing:** **Free tier** to build + deploy hosted agents; Mainnet registration free for hosted under subscription. FET/ASI tokens needed for local-agent wallets + some network functions. **Pricing across products is not transparent** (a repeated community complaint).
- **CLI:** `AVCTL` for log-in/project/deploy. **FetchCoder** is their terminal coding agent for building Agentverse-compatible agents.

## Findings

### How to actually launch one (the path behind the link)

1. Sign up at agentverse.ai (the link). Also create an **ASI:One API key** at asi1.ai (developer dashboard) if you want chat/ASI:One compatibility.
2. **My Agents** tab -> **+ New Agent** / **Launch an Agent** -> **Create an Agent**.
3. Pick a **template** (start with **Blank**) -> name it -> **Launch Agent**.
4. Assign **3 keywords** (classification + discoverability) -> **Launch My Agent**.
5. **Build tab** -> paste your `agent.py` (uAgents + a `Protocol(spec=chat_protocol_spec)` for ACP; point the OpenAI client at `base_url='https://api.asi1.ai/v1'` with your ASI:One key). `agent.include(protocol, publish_manifest=True)`.
6. Run -> it registers in the Almanac -> **Chat with Agent** button appears -> test it, then it's reachable by ASI:One.
7. Fill the **README + metadata + avatar** - this is what gets you found.

### Community verdict (what to expect)

- **Agent Finder (2026-05): 7/10.** "Genuinely innovative but firmly developer-focused." Best for Python devs exploring multi-agent systems, not plug-and-play teams.
- **Strengths:** free tier removes the barrier, decentralized discovery is technically impressive, fast first agent (15-30 min in the web UI), built-in simulator.
- **Weaknesses (consistent across reviews):** reliability/downtime ("Agent sync failed", breaking schema changes without migration guides), **minimal monitoring/observability**, **sparse docs**, **no production-ready official SDK** (JS/TS wrappers barebones), a **500 req/min** rate limit that bites orchestration, crypto-token friction for non-crypto users, small ecosystem vs LangChain/LlamaIndex. Sentiment ~70-80% positive but with a steady reliability-complaint tail.
- Net: fine for a **low-stakes discovery experiment**, not for a production-critical ZAO service. Matches Decision 1+3.

### ZAO fit

ZAO already runs a locked agent stack (ZOE/Hermes, Doc 759) and killed its multi-bot fleet (Doc 601). Agentverse is **not** a place to rebuild that. It IS a cheap **distribution surface**: a single informational "ZAO concierge" agent that ASI:One can route ecosystem questions to. Adjacent prior research: Doc 262 (Virtuals Protocol as an agent payment rail) - same "agent economy" theme, different chain. If the discovery experiment shows real ASI:One traffic, revisit monetized Agent Functions later.

### Staleness / caveats

- Current as of **2026-06-21**. Fast-moving early-stage platform; re-verify pricing + the exact launch UI in ~30 days.
- FET has rebranded under the **ASI** token (ASI Alliance merger) - naming in older docs lags.
- Reliability complaints are recent (2025-2026) and recurring - assume occasional downtime for any agent you host.

## Also See

- [Doc 262](../262-virtuals-protocol-agent-rail/) - Virtuals Protocol agent payment rail (sibling "agent economy" theme)
- [Doc 601](../601-agent-stack-cleanup-decision/) - no-new-bots rule (this experiment must stay informational)
- [Doc 759](../759-zoe-orchestrator-locked/) - ZOE locked architecture (do not migrate to Agentverse)
- [Doc 883](../883-korro-ai-agent-company-audit/) - another external agent platform/company audit (same compare-and-decide shape)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Sign up at agentverse.ai + create ASI:One API key (asi1.ai) | @Zaal | Account setup | This week |
| Launch ONE hosted "ZAO concierge" agent (Blank template, ACP enabled), README = ZAO canonical pitch + ZAOstock/ZABAL context | @Zaal | Experiment | This week |
| Test via "Chat with Agent" + ASI:One Chat ("connect me to an agent about web3 music communities") | @Zaal | Verify | After launch |
| If ASI:One sends real traffic in 30 days, write a follow-up doc on monetized Agent Functions | @Zaal | Research | 2026-07-21 |

## Sources

- [Agentverse Explorer (agentverse.ai)](https://agentverse.ai) - `[FULL]` - via exa (direct WebFetch 403'd)
- [The Agentverse - Fetch.ai Docs](https://fetch.ai/docs/concepts/agent-services/agentverse-intro) - `[FULL]`
- [Hosted Agents / Quickstart - Agentverse Docs](https://docs.agentverse.ai/documentation/create-agents/hosted-agents) - `[FULL]` (via exa highlights)
- [Enable the Chat Protocol (ACP) - Agentverse Docs](https://docs.agentverse.ai/documentation/getting-started/enable-chat-protocol) - `[FULL]` (incl. sample uAgents/ASI:One code)
- [Agent Search Optimization - Agentverse Docs](https://agentverse.ai/docs/search) - `[FULL]`
- [Agentverse Review 2026 - Agent Finder (7/10)](https://agent-finder.co/reviews/agentverse) - `[FULL]`
- [Agentsindex: Agentverse (rate limits, SDK gaps)](https://agentsindex.ai/agentverse) - `[FULL]`
- [Tekai: Fetch.ai review (ASI Alliance, uAgents, FetchCoder)](https://tekai.dev/catalog/fetch-ai) - `[FULL]`
- [firmsuggest: Fetch.ai / ASI:One / Agentverse breakdown (sentiment)](https://www.firmsuggest.com/blog/what-is-fetchai-full-breakdown-of-asi-one-agentverse-pros-cons-ecosystem-insights/) - `[FULL]`
- [r/FetchAI_Community developer walkthrough](https://www.reddit.com/r/FetchAI_Community/comments/1b2y69q/) - `[PARTIAL - thread referenced via review aggregators, original is 2024]`
