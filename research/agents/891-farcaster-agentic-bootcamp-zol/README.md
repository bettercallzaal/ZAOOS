---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-23
superseded-by:
related-docs: 761, 762, 759, 770, 773
original-query: "[DEEP] Farcaster Agentic Bootcamp (Builders Garden + Neynar, Mar 30-Apr 10 2026) - full synthesis of all sessions plus a concrete build plan for ZOL: a Farcaster-native agent run by ZOE on the Pi (ansuz). Primary sources = the session transcripts the user pasted + Privy docs. Tie patterns to a ZOL architecture grounded in existing ZOE code."
tier: DEEP
---

# 891 - Farcaster Agentic Bootcamp Synthesis + the ZOL Build Plan

> **Goal:** Distill every session of the Builders Garden x Neynar Farcaster Agentic Bootcamp (Mar 30 - Apr 10 2026) into reusable patterns, then turn those patterns into a concrete build plan for **ZOL** - a Farcaster-native agent that ZOE runs from the Pi (ansuz).

## What ZOL is

ZOL is a Farcaster account that ZOE operates as its own first-class agent: you talk to ZOE, and ZOL is the face it wears on the Farcaster feed - reading mentions, drafting casts, holding a wallet, building reputation. The bootcamp is the playbook; this doc maps each lesson onto the code ZAO already has.

The important finding up front: **ZOL is not greenfield.** ZOE already carries a Farcaster agent skeleton under `bot/src/zoe/caster/` and `bot/src/zoe/farcaster/` (built in docs 761/762). ZOL is mostly *activation + persona + hosting on the Pi*, not new construction.

---

## Key Decisions

| # | Decision | Why | Grounding |
|---|----------|-----|-----------|
| 1 | **Build ZOL on the existing `caster/` pipeline, do NOT start fresh** | `bot/src/zoe/caster/index.ts` already implements draft -> safety -> human-approval -> sign -> publish. The bootcamp's "agents are loops with personalities" is already coded. | `bot/src/zoe/caster/index.ts` |
| 2 | **Event-driven loop, polling on the Pi (not webhooks first)** | Jack Dishman (Clanker): webhooks need a public server; polling is simpler for an MVP. The Pi is behind a home NAT, so polling the read node beats exposing a webhook. ZOE already has both: gRPC stream (`event-stream.ts`) for the self-hosted node, poll as fallback. | `bot/src/zoe/farcaster/event-stream.ts` |
| 3 | **Use Privy for ZOL's wallet, with a signer + spend policy** | Privy gives scoped "signer" keys + per-transaction spend caps + allow/deny lists, exactly the "agent can spend up to $X" control the Privy session demoed. Solves the nonce-management gotcha Clanker hit. | Privy session (Madeleine Charity) |
| 4 | **Keep the mandatory human-approval gate for casts + onchain actions** | Already enforced in `caster/index.ts` ("reads/likes auto-allow; casts/replies and all onchain $ZABAL actions require approval"). Matches Privy's "user has the last word" and ZAO's no-rogue-bot rule. | `bot/src/zoe/caster/index.ts`; CLAUDE.md Primary Surfaces |
| 5 | **Register ZOL in EIP-8004 (identity + reputation) once it casts** | 8004 is a "LinkedIn for agents" - 100k+ agents, 20k MAA as of Jan 2026. Cheap identity + a reputation surface ZOL earns over time. Farcaster profile and 8004 augment each other. | 8004 session (Vittorio Rivabella) |
| 6 | **Drafting runs on OpenRouter, concierge stays on Claude Max** | Already the split in `caster/reason.ts`: stateless cast drafting = OpenRouter (user-selectable, swappable to Router402/x402 later); tool-using concierge turns = Claude Max via `callClaudeCli`. This is the cheap-model-for-cheap-task lesson (Saltorius, Cassie). | `bot/src/zoe/caster/reason.ts` |
| 7 | **Simulate human limits (slow, tired, scheduled, forgetful)** | Cassie Hart's core realism lesson: deterministic/always-online output is the uncanny valley + the #1 bot tell. Bake cooldowns, an activity budget, and an "alive hours" flag into ZOL. | Multi-agent session (Cassie Hart) |
| 8 | **Defer x402/MPP commerce to Phase 2** | x402 write-hub payment already exists (`farcaster/x402.ts`, 0.001 USDC/cast via Neynar). Agent-to-agent commerce + paid endpoints are real but not needed for ZOL v1 (read + cast + reputation). | `bot/src/zoe/farcaster/x402.ts` |

---

## Part 1 - Bootcamp synthesis (the 6 sessions)

### Session 3 - Agents 101 (Jack Dishman + Grin, Neynar)

The mental model that anchors everything else: **an agent is an event-driven loop - trigger, decide, act, repeat - with a personality.**

- **Five layers:** ingestion (X/Farcaster/cron/chain events) -> message queue -> agent core (the "soul.md", taste + decision tree) -> action layer (deploy, reply, fetch) -> state store.
- **Two listener types:** **webhook** (Neynar pushes a payload when a cast mentions you - reactive, needs a public server) vs **polling** (cron pulls recent mentions every minute, stores processed IDs to dedupe - works without a public endpoint, used for the X bot because X webhooks are pricey).
- **Structured output > regex.** Early Clanker parsed `ACTION: reply` out of plain text with regex; LLMs hallucinate, so they moved to tool/structured outputs that trigger actions predictably and chain.
- **Conditionals before the LLM** to kill spend: rate-limit per user (e.g. 10 actions/day unless paid), check cheap DB state before paying for an inference. "Avoid spending redundant calls to third-party services, API credits, AI tokens."
- **Idempotency keys** are mandatory: webhooks fire twice, crons double-process. Store a dedupe key + a `pending/failed/success` column so a crash can resume.
- **Dead-letter queue:** on failure, store the failed state + alert rather than retry-storm; it isolates third-party outages.
- **Queue only when you feel the pain.** Both Dishman and Grin: the Neynar agent has *no* queue ("webhook comes in, we handle it all in the function"). Add Upstash/QStash (~$2/mo) for blockchain ordering (nonce conflicts) and cost offload, not on day one.

### Session 4 - Memory, Context & Reasoning (Saltorius, Laser)

"Everything is context. The whole crux is efficient prompting." Every LLM is stateless; state is reconstructed and injected deliberately.

- **Two memories:** short-term (the message array you append to) and long-term (fine-tune / vector DB / a tree of MD files + an orchestrator that picks which to inject - the most recent pattern).
- **Context rot:** quality collapses past ~45% of the context window. On a 200k model, real ceiling is ~80-90k tokens. Combat with compaction (summarize the conversation, restart the window with the summary).
- **Model-specific prompting:** Haiku wants persona/creative-writing framing; Gemini wants hard rules; some want XML tags; image models (Nano Banana) want JSON. There is no universal prompt.
- **The pipeline is a modified ETL:** extract (Neynar user data + top casts + top replies = captures voice) -> curate (structure for the model) -> transform (condense to MD + front-matter) -> load (inject into prompt). "Top casts" are the highest-signal personality input.
- **Prompt structure (tiered, signal-maximizing):** system instructions + identity/persona, then long-term context (vector/db), then session state, then social context, then a *small* user prompt. Models over-index on the most recent tokens, so keep prompts short and chunked.
- **Self-updating context:** OpenClaw-style agents rewrite their own injected MD files from learnings, producing emergent behavior. Claude Code's leaked "dreaming": it reads all MD files and distills the most meaningful events into a <=200-300 line file injected every run.
- **Front-matter for cheap recall:** put a description block at the top of each memory MD; the orchestrator reads only front-matter to decide relevance, then fetches the full file - avoids parsing every file every turn.
- **Vector DB = semantic search (RAG):** encode pages, semantic-search the user input, return top-scored pages, inject those. Graph-RAG adds relationships between pages. "Good context engineering usually outperforms a fine-tune, for far less time/money."

### Session 5 - Give Your Agent a Wallet (Madeleine Charity, Privy)

Privy = auth + key management abstraction between app and chain. Acquired by Stripe.

- **Server wallets via API**, not tied to a user - exactly the agent case. Keys live in a TEE, reconstituted only per-request via Shamir secret sharing (sharded at rest, never persistent in the enclave). ~99.99% uptime claim; export the key if you want to self-custody/sign locally.
- **Configurable ownership:** owners (full control) vs **signers** (scoped). Give the agent a *signer* key, attach a **policy** (spend <= $X/tx, allow/deny addresses, stateful limits over time). Prevents "agent drains the wallet."
- **Key quorums:** require N-of-M signatures - e.g. an agent signs, a verification agent co-signs before the tx hits the API, cryptographically enforced.
- **EOA or smart account** (your choice); native gas sponsorship; native on-ramp/bridging.
- **Payment rails:** x402 (payment inside an HTTP request - wrap `fetch`, get the 402, retry with payment, ~5 lines) and MPP (Stripe/Tempo's Machine Payment Protocol - sessions: authorize once, then many payments without re-signing; good for streaming/compute). Privy supports both. The nonce-management gotcha that bit Clanker is handled by Privy embedded accounts.

### Session 7 - Embedded Capital & Agentic Commerce (Samuel Zeller)

Why Farcaster is the agent substrate, plus the payment-protocol landscape.

- **Every Farcaster user is a wallet** + has a mini-app surface + is permissionless + has a Neynar reputation score. X gets you flagged/banned as a bot; Farcaster lets humans and agents coexist as equals. "It's all about distribution, and Farcaster already has it."
- **x402 vs MPP:** x402 is base-layer, supported in every browser/most wallets, best for many users / one-off resource buys. MPP adds **sessions** (authorize once, pay many times), batching, streaming - but is tied to Tempo (only ~4 nodes; centralized) for some methods. Default to x402 for breadth; MPP when you need continuous metered access. Cloudflare supports both.
- **Open Wallet Standard + passkeys:** passkey-created wallets (face/fingerprint), device-bound, easy to spin up for agents; recovery is the weak point.
- **Product shapes that open up:** pay-per-read content (earn per *view* not per follower), agent-to-agent commerce gated by Neynar score (spam-resistant), micro-payments for compute/API/data, AI research that *buys* paywalled sources, agents claiming physical locations, group games humans + agents play together.
- **Tools mentioned:** Hermes + Factory/Droid as long-running autonomous coding harnesses ("allow everything", run overnight); Carpathy-style auto-research loops (optimize one metric per loop).

### Session 9 - Identity & Reputation, EIP-8004 (Vittorio Rivabella, Ethereum Foundation)

8004 = on-chain "internet of agents." Three registries:

- **Identity registry** (live) - register an agent, expose endpoints (API/MCP/A2A/ENS/DNS/email). "LinkedIn for agents."
- **Reputation registry** (live) - aggregated score from user/agent feedback + **watchtowers** (cron jobs that ping the agent, check uptime/latency, verify return values match the declared registration file). x402 payment hashes can be wrapped into the reputation payload so a score has provenance.
- **Validation registry** (end of month) - TEE-replicates an inference to prove the agent ran what it advertised; for high-stakes ops.
- **Adoption:** test net Sep 2025 -> mainnet Jan 2026; 100k+ registered agents, 20k monthly active; all major chains supported; enterprise interest (Visa, GoDaddy) precisely because reputation needs many independent data providers. **Not only for agents** - APIs/price-feeds/data services register too (e.g. Redstone wrapped with x402). Register at `8004scan`; SDK = agent-zero.
- Reputation is "the best place to build" - it can't be solved by one company.

### Session 10 - Multi-Agent Systems & Open Coordination (Cassandra Heart, Quilibrium)

The realism + cost playbook, plus the orchestration architecture.

- **Personas have dimensions:** tone, domain expertise, risk tolerance, social behaviors, engagement style. A JSON persona record carries metadata (agent id, persona prompt, topics, **activity budget**, **cooldown**, **priority weight**) - most of it is *not* the prompt, it's coordination metadata.
- **Selection by score, not round-robin:** for an event, score each agent by topic match + semantic relevance + recency + remaining budget + randomness noise, softmax, pick the top. Randomness avoids deterministic (bot-tell) output.
- **Realism = simulate human limits:** humans are slow, get tired, give up, forget, get distracted, and go offline on a schedule. The biggest bot tell (from her 2016 research) was *always online* - bake an "alive hours" boolean. "Why be people? Because that's what people want to deal with."
- **Orchestrator + sub-agents:** a flagship orchestrator ingests + plans + delegates one-thing-only sub-agents on cheap models (deliberate=Haiku, vote=Gemini Flash, cards=Grok), synthesizes. "Don't use a large model to orchestrate - you can do this with code." Radical control of each sub-agent's context window.
- **Cost discipline:** smaller models (Haiku/mini) by default; big model only as a filter, ideally just code. Cheaper infra: self-host Hypersnap for the Neynar API (vs $500/mo), QStorage/Q-libs over S3/SQS.
- **Hard warning:** never aim human-like multi-agent systems at political-interference campaigns (FBI trail). Stated from experience.

---

## Part 2 - The cross-cutting patterns (what to actually reuse)

| Pattern | One-line | ZAO already has it? |
|---------|----------|---------------------|
| Event-driven loop | trigger -> decide -> act -> repeat | Yes - `caster/index.ts` + `farcaster/event-stream.ts` |
| Polling over webhooks (for NAT/Pi) | cron-pull mentions, dedupe by id | Partial - gRPC stream exists; add a poll fallback |
| Structured output | tools/JSON not regex | Use OpenRouter structured outputs in `reason.ts` |
| Conditionals + idempotency | cheap gate before the LLM; dedupe keys | Add to caster trigger handler |
| Memory: front-matter MD tree | orchestrator reads front-matter, fetches full | ZOE already does MD memory (`memory.ts`) |
| Context rot ceiling (45%) | compact past ~80k tokens | ZOE concierge already compacts |
| Privy signer + spend policy | scoped key, per-tx cap, allow-list | New - wire Privy for ZOL wallet |
| x402 micro-payment | pay-per-write/read in the HTTP call | Yes - `farcaster/x402.ts` |
| 8004 identity + reputation | register agent, earn watchtower score | New - register ZOL |
| Realism limits | cooldown, budget, alive-hours, randomness | New - add to caster persona record |
| Orchestrator + cheap sub-agents | flagship plans, mini executes | Yes - `decompose.ts`/`dispatch.ts`/`workers.ts` |
| Human-approval gate | y/n before any cast / onchain | Yes - `caster/index.ts` |

---

## Part 3 - The ZOL build plan

### Where it runs

ZOL runs as a process under ZOE on the **Pi (ansuz)** - or on the consolidated fleet box if the Pi's home NAT proves limiting. Polling-first (the Pi can't easily expose a webhook). Reads are free (self-hosted/Hypersnap read node); only writes cost (x402 micro-payment per cast). See `project_pi_ansuz_pihole` and `project_vps_consolidation`.

### Architecture (maps the 5 layers onto existing files)

| Layer | Bootcamp concept | ZOL implementation |
|-------|------------------|--------------------|
| Ingestion | webhook/poll listener | `farcaster/event-stream.ts` (gRPC) + a cron poll fallback for the Pi |
| Queue | message queue (optional) | none for v1 (Grin: add only when it hurts); ZOE's `turn-queue.ts` if needed |
| Agent core | soul.md + decision tree | a ZOL persona MD (front-matter) seeded from `caster` + ZOE `memory.ts` |
| Reasoning | cheap model for stateless gen | `caster/reason.ts` (OpenRouter, user-selectable model) |
| Action | reply/cast/like/onchain | `caster/index.ts` -> `farcaster/write.ts` (sign + submit), Privy for $ |
| State | dedupe + memory | dedupe table (idempotency keys) + ZOE memory + 8004 reputation |

### Persona record (the realism metadata, per Cassie)

```json
{
  "agentId": "zol",
  "persona": "<ZOL voice MD - ZAO/ZABAL taste, builder energy>",
  "topics": ["zao", "zabal", "$zabal", "music", "farcaster agents"],
  "activityBudgetPerDay": 12,
  "cooldownSeconds": 90,
  "aliveHours": "13:00-04:00 UTC",
  "priorityWeight": 1.0
}
```

Selection: only act if relevance > threshold, budget remains, outside cooldown, and within alive-hours - plus randomness noise so replies aren't deterministic.

### Phased rollout

| Phase | Scope | New work | Exists |
|-------|-------|----------|--------|
| **0** | Smoke test: ZOL casts once from the Pi | env wiring on the Pi, first-cast | `scripts/first-cast.ts`, `farcaster/write.ts`, `signer.ts` |
| **1** | Read + reply with approval gate | poll fallback, persona MD, dedupe table | full `caster/` pipeline + `event-stream.ts` |
| **2** | Wallet + reputation | Privy signer + spend policy, register in 8004 | `farcaster/x402.ts` for write payments |
| **3** | Multi-source "what I think" loop (the consult-orchestrator) | OpenRouter panel + read-state + learning | `decompose.ts`/`dispatch.ts`/`workers.ts`, `learn.ts`, `reflexion.ts` |

Phase 3 is the consult-orchestrator concept brainstormed separately (ZOE consults a model panel + the fleet, synthesizes its own view, learns) - it shares the same OpenRouter + memory plumbing ZOL uses.

### Cost notes (current as of 2026-06-23)

- **Reads:** free via the self-hosted read node (avoids Neynar's ~$500/mo API; Cassie + Samuel both flagged this).
- **Writes:** ~0.001 USDC per cast via x402 to the Neynar write hub (`farcaster/x402.ts`).
- **Drafting:** OpenRouter per-token, user-selectable model (Haiku/Sonnet tier) - the cheap-model-for-stateless-task rule.
- **8004 registration:** one-time on-chain fee (Base/Sei), then free watchtower reputation.

### Open risks

1. **Pi behind home NAT** - webhooks need exposure; mitigate with polling or run ZOL on the fleet box. (Decision 2.)
2. **Ed25519 signer custody** - QKMS cannot sign Ed25519 (`farcaster/signer.ts`); the key sits in `FARCASTER_SIGNER_PRIVATE_KEY` (noble, in-process). Keep it off-repo, on the Pi only.
3. **Name clash** - "ZOL" collides with "ZOLs" (ZAO contribution credits) in the brand glossary. Confirm the agent name with Zaal before public launch.
4. **Approval-gate fatigue** - every cast needs y/n in Telegram. Fine at low volume; revisit auto-allow rules if ZOL gets chatty (doc 761 already scopes reads/likes to auto-allow).

---

## Also See

- [Doc 761](../761-zao-farcaster-multiagent-quilibrium-stack/) - the ZAO Farcaster multi-agent / caster stack this builds on
- [Doc 762](../../farcaster/762-quilibrium-stack-verification/) - stack verification: Neynar write hub + x402 + Ed25519 signer verdict
- [Doc 759](../759-agent-best-practices-and-zoe-orchestrator-gap/) - agent best practices + ZOE orchestrator gap
- [Doc 770](../770-zoe-orchestrator-audit/) / [Doc 773](../773-zoe-orchestrator-high-fixes/) - ZOE orchestrator audit + fixes (decompose/dispatch/workers)
- `project_pi_ansuz_pihole`, `project_vps_consolidation` (memory) - where ZOL hosts

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm the agent name ("ZOL" vs alternative, given ZOLs-credits clash) | @Zaal | Decision | Before Phase 0 |
| Phase 0: wire Farcaster signer + FID env on the Pi, run `scripts/first-cast.ts` | @Zaal | Build | Next session |
| Phase 1: add poll fallback to `event-stream.ts` + dedupe table + ZOL persona MD | @Zaal | PR | After Phase 0 |
| Phase 2: wire Privy server wallet + spend policy for ZOL; register ZOL in 8004 (8004scan) | @Zaal | PR | After Phase 1 |
| Add realism metadata (cooldown/budget/alive-hours/randomness) to the caster persona record | @Zaal | PR | With Phase 1 |
| Decide host: Pi (NAT, polling) vs fleet box (webhook-capable) | @Zaal | Decision | Phase 1 |

## Sources

- **[FULL]** Bootcamp Session #3 "Agents 101" - Jack Dishman + Grin (Neynar), transcript pasted by Zaal, Apr 1 2026
- **[FULL]** Bootcamp Session #4 "Memory, Context & Reasoning" - Saltorius (Laser), transcript pasted, Apr 2 2026
- **[FULL]** Bootcamp Session #5 "Give Your Agent a Wallet" - Madeleine Charity (Privy), transcript pasted, Apr 3 2026
- **[FULL]** Bootcamp Session #7 "Embedded Capital & Agentic Commerce" - Samuel Zeller, transcript pasted, Apr 7 2026
- **[FULL]** Bootcamp Session #8 "Going Viral on Farcaster" - Sayeed (a town, Emerge), transcript pasted, Apr 8 2026
- **[FULL]** Bootcamp Session #9 "Identity & Reputation (EIP-8004)" - Vittorio Rivabella (Ethereum Foundation), transcript + Gemini summary pasted, Apr 9 2026
- **[FULL]** Bootcamp Session #10 "Multi-Agent Systems & Open Coordination" - Cassandra Heart (Quilibrium), transcript pasted, Apr 10 2026
- **[FULL]** Bootcamp Notion agenda screenshot (builders-garden.notion.site/farcaster-agentic-bootcamp), pasted by Zaal
- **[PARTIAL - referenced via the Privy session, not separately fetched]** Privy docs: docs.privy.io, /security/wallet-infrastructure/secure-enclaves, /controls/overview, /recipes/agent-integrations/x402, /mpp, /openclaw-agentic-wallets
- **[FULL - codebase]** `bot/src/zoe/caster/{index,reason}.ts`, `bot/src/zoe/farcaster/{event-stream,read-node,signer,write,x402}.ts`, `bot/src/zoe/{decompose,dispatch,workers,learn,reflexion,memory}.ts`
