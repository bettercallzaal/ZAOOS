# 317 - Farcaster Agentic Bootcamp Week 1: Session Transcripts & Extracted Insights

> **Status:** Research complete
> **Date:** April 9, 2026
> **Source:** Sessions 1-6 of the Builders Garden Farcaster Agentic Bootcamp (March 30 - April 6, 2026)
> **Goal:** Extract actionable patterns from 238-participant bootcamp covering Farcaster building blocks, mini apps, agent architecture, context engineering, agentic wallets, and hands-on agent deployment. All insights mapped to ZAO OS integration points.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Agent architecture pattern** | USE event-driven (trigger -> decide -> act -> repeat). Webhook-first with Neynar push notifications, polling as fallback. No long-running processes |
| **Message queuing** | USE Upstash QStash at $2/month for dead letter queues and retry logic. Skip queuing for MVP, add when scaling |
| **Context window management** | ENFORCE the 45% rule - never exceed 45% of context window or quality degrades (context rot). Use front matter on MD files for relevance filtering |
| **LLM orchestration** | USE orchestrator + sub-agents pattern. Flagship model (Claude Opus/GPT-5.3) orchestrates, cheap models (Haiku, Gemini Flash) execute discrete tasks. Saves 60-80% on token costs |
| **Agent hosting** | START with Vercel serverless (webhook + cron endpoints). Move to VPS only for always-on requirements (XMTP, complex compute) |
| **Mini app development** | USE Farcaster Studio (neynar.com/studio) for prototyping. 3 requirements: farcaster.json manifest, fc:frame embed tag, SDK ready() call. Export code when ready |
| **Agent wallet** | USE Privy for wallet infra - Stripe-acquired, Shamir key sharding in TEE, policy engine with spending limits, gas sponsorship for smart accounts |
| **Agent payments** | USE x402 protocol to wrap fetch calls with payment from Privy wallet. 5 lines of code. $0.001 per Neynar API call. No API key needed |
| **Action parsing** | USE structured output (tool use / function calling) over regular expressions. More reliable, handles edge cases, built into all major LLMs |
| **Agent identity** | REGISTER a dedicated FID for each agent. Agents are first-class citizens on Farcaster - identical to human accounts on-chain |
| **Memory architecture** | IMPLEMENT three tiers: static (soul.md personality), runtime (API calls, web search), stored (database). Cache external lookups aggressively |
| **Prompt structure** | ORDER prompts top-to-bottom: system instructions + identity -> long-term context (vector DB) -> session state -> social context -> user input. Models overindex on most recent content |

## Agent Hosting Comparison

| Approach | Cost | When to Use | Scaling | Limitations |
|----------|------|-------------|---------|-------------|
| **Vercel Serverless** | Free tier -> pay per invocation | MVP, event-driven agents, webhook + cron | Auto-scales, costs grow with traffic | 10s execution limit (free), no persistent connections |
| **VPS (Railway/AWS/Hostinger)** | $5-50/month fixed | Always-on agents, XMTP listeners, complex compute, multi-agent orchestration | Manual scaling, predictable cost | Pays 24/7 even when idle |
| **Farcaster Studio** | Free (Neynar hosted) | Mini app prototyping, vibe coding, rapid iteration | Limited to mini apps, built-in Vercel deploy | Code exportable but Studio-optimized |

**Verdict:** Start every agent on Vercel serverless. Two endpoints: `/api/webhooks/agent` (event-driven) and `/api/cron/agent` (scheduled). Move to VPS only when the agent needs persistent WebSocket connections or sub-second response times.

## Session-by-Session Breakdown

### Session 1: Farcaster Building Blocks (March 30)

**Speaker:** Naina Sachdev (Dev3Pack)

Farcaster's hybrid architecture separates identity from social data:

```
On-Chain (OP Mainnet)                Off-Chain (Hubs / Snapchain)
------------------------------       --------------------------------
ID Registry   - owns FID            Casts, follows, reactions
Key Registry  - app signing keys    Real-time event subscriptions
Store Registry - storage units       Full message history
```

**Four pillars for agent builders:**

1. **Open social graph** - agents query follows, casts, channels, and relationships with zero restrictions. Reading requires no permission and 5 lines of code via Neynar API
2. **Composable identities** - agents get their own FID, becoming first-class citizens with permanent on-chain identity
3. **Event-driven architecture** - agents subscribe to real-time events from hubs (mentions, follows, reactions, cast.created)
4. **On-chain + off-chain composability** - identity is permanent (on-chain), social data is scalable (off-chain)

**Key fact:** Writing to Farcaster requires a signer ID from Neynar. Reading is permissionless.

### Session 2: Miniapps 101 (March 31)

**Speaker:** Lucas (Neynar)

A mini app is a web app rendered inside Farcaster. Three requirements:

1. `farcaster.json` manifest at `/.well-known/farcaster.json`
2. `fc:frame` meta embed tag in HTML head
3. SDK `ready()` call on app initialization

**Development workflow with Farcaster Studio:**

- Built-in mini app institutional knowledge (knows the spec)
- Per-route embeds: different images per page, dynamic share URLs with FID in path
- Notifications via Neynar managed service (webhook URL declared in manifest)
- Built-in Vercel deploy with auto-debugger agent that fixes build errors
- Code is exportable (download zip, not locked in)

**Auth patterns:**

| Pattern | Use Case |
|---------|----------|
| Quick Auth | In-app authentication within Farcaster client |
| Sign In With Farcaster (SIWF) | External websites, standalone apps |

**SDK actions available:** `addMiniApp`, `composeCast`, `ready()`, `openURL`, `openMiniApp`, `signIn`, `requestCamera`, `requestMicrophone`

**Domain migration:** Use the canonical domain field in manifest to redirect from old to new domain without breaking existing embeds.

### Session 3: Agents 101 (April 1)

**Speakers:** Jack Dishman + Grin (Clanker)

**Core loop:** trigger -> decide -> act -> repeat

**Two listener architectures:**

| Type | How It Works | When to Use |
|------|-------------|-------------|
| **Webhook** | Neynar pushes events to your endpoint | Real-time, recommended default |
| **Polling** | Cron job fetches recent mentions | Fallback, simpler to debug |

**Clanker's production stack:**
- Vercel serverless for compute
- Upstash QStash ($2/month) for message queuing
- Idempotency keys prevent duplicate token deployments and replies
- Dead letter queue for failed events + alerting
- Store all processes with status (completed, failed, pending) for backfill

**Nonce management:** Critical for blockchain-interacting agents. Privy handles this with embedded accounts. Without proper nonce management, concurrent transactions fail or get stuck.

**Memory taxonomy:**

| Type | Description | Example |
|------|-------------|---------|
| **Static** | Personality, rules, identity | soul.md file |
| **Runtime** | Data fetched during execution | API calls, web search results |
| **Stored** | Persistent across sessions | Database records, conversation history |

**Dishman's advice:** "Don't waste time on queuing at start - get MVP out, add when scaling." Also: cache external lookups to save money, use observability from day one, and "you can build Clanker in one prompt now."

### Session 4: Memory, Context & Reasoning (April 2)

**Speaker:** Saltorious (Lazer Technologies)

**The fundamental truth:** Everything is context engineering. Every LLM is stateless. The quality of output depends entirely on the quality of context injected into the prompt.

**45% context window rule:** Never exceed 45% of the model's context window. Beyond this threshold, quality degrades - the model starts hallucinating, losing coherence, and missing instructions. This is context rot.

**Orchestrator + sub-agents pattern (Among Traders example):**

| Role | Model | Cost Tier | Task |
|------|-------|-----------|------|
| Orchestrator | GPT-5.3 | $$$ | Route tasks, merge results |
| Deliberation | Claude Haiku | $ | Reasoning about trust |
| Voting | Gemini Flash | $ | Fast structured decisions |
| Card analysis | Grok | $ | Speed-critical I/O |

**Modified ETL pipeline for LLMs:**
1. **Aggregate** raw data (Farcaster casts, profiles, reactions)
2. **Curate** structure (filter noise, identify patterns)
3. **Transform** to Markdown (LLM-readable format)
4. **Inject** into prompt (respecting the 45% budget)

**Front matter pattern:** Add a description at the top of each MD file. The LLM reads the description first and decides if the full file is relevant before loading it. Saves context window space.

**Claude Code dreaming:** The agent reads all MD files, extracts the most meaningful information, and saves to a 200-300 line file injected on every run. This is automated compaction of long-term memory.

**Voice matching (HypeMan app):** Analyzes a user's top casts to extract writing style, then generates quote casts in that voice. Good prompt engineering with flagship models beats fine-tuning lesser models every time.

**Prompt structure (top to bottom, order matters):**
1. System instructions + identity
2. Long-term context (vector DB retrieval)
3. Session state (conversation summary)
4. Social context (user/community data)
5. User input

Models overindex on the most recent content in the prompt. Structure determines output quality.

### Session 5: Give Your Agent a Wallet (April 3)

**Speaker:** Madeleine (Privy)

Privy = authentication + key management infrastructure. Acquired by Stripe. Does NOT do LLM inference - strictly wallet infrastructure.

**Wallet types:**
- **EOA** (Externally Owned Account) - single key, server-side policy enforcement
- **Smart accounts** - programmable logic, on-chain policy enforcement, gas sponsorship from Privy

**Key security:** Private keys stored in shards (Shamir secret sharing), reconstituted only inside TEE (Trusted Execution Environment) during active requests. Never exposed in plaintext.

**Agent wallet pattern:**
1. Create wallet via Privy dashboard/API
2. Add signer (agent's authorization key) with spending policy ($20 limit example)
3. Agent transacts autonomously within policy bounds
4. Owner (human) monitors and can revoke at any time

**Policy engine capabilities:**
- Per-transaction spending limits
- Cumulative daily/weekly limits (stateful)
- Contract allow-lists and deny-lists
- Key quorums: n-of-m signatures for multi-party approval (agent + verification agent co-sign)

**Payment protocols:**

| Protocol | Mechanism | Best For |
|----------|-----------|----------|
| **x402** | Payment header on HTTP requests, 5 lines of code | High-volume single transactions, API calls |
| **MPP (Stripe/Tempo)** | Sessions = prepay, multiple txns without re-signing | Streaming payments, batched operations |

Both are expanding to fiat rails. x402 is an open HTML standard. MPP is more centralized (4 nodes).

**Framework integrations:** LangChain (open-source wallet tool), OpenClaw (plug-in), custom via REST API + TypeScript SDK.

**"Agent merchants"** = new category: storefronts that accept x402/MPP micropayments from agents paying for data, inference, research, and on-chain actions.

### Session 6: Build a Farcaster Agent (April 6)

**Speaker:** urbe eth (Builders Garden)

Hands-on session: fork the Neynar agent repo, integrate Privy, deploy to Vercel.

**Automated setup script (`npm run auto`):**
1. Bridge funds from Base to Optimism
2. Register a new FID on-chain
3. Add signer key to Key Registry
4. Publish first cast

**Agent account = human account.** No technical distinction on-chain. Identity and reputation build over time through cast history and social graph.

**Deployment architecture:**

| Component | Purpose | Cost |
|-----------|---------|------|
| Webhook endpoint | Neynar pushes events (cast.created, follow.created, reaction.created) | Free (Vercel) |
| Cron endpoint | Scheduled tasks (daily digests, periodic posts) | Free (Vercel) |
| OpenRouter | LLM gateway - one API key, multiple models | Pay-per-use |
| Neynar x402 | Pay-per-call for reading/writing Farcaster data | $0.001/call |
| Privy wallet | Holds funds, signs transactions | Free dashboard |

**Neynar webhook filters:** cast.created, user.created, reaction.created, follow.created, trade events. Filter by specific users, channels, keywords, or mentions.

**Cost comparison:** Vercel serverless = pay only when triggered. VPS = fixed cost 24/7. Start with Vercel for every new agent.

**Confirmed:** Cassie Heart (Quilibrium) presents Session 10 on multi-agent systems.

## Key Numbers

| Metric | Value | Source |
|--------|-------|--------|
| Bootcamp participants | 238 builders | Registration data |
| Max context window usage | 45% before quality degrades | Session 4 (Saltorious) |
| Upstash QStash cost | $2/month | Session 3 (Dishman) |
| x402 payment wrapping | 5 lines of code | Session 5 (Privy) |
| Claude Code dreaming file | 200-300 lines max | Session 4 (Saltorious) |
| Neynar x402 API cost | $0.001 per call | Session 6 (urbe eth) |
| Mini app requirements | 3 (manifest, embed tag, ready()) | Session 2 (Lucas) |
| Farcaster on-chain contracts | 3 (ID, Key, Store registries) | Session 1 (Naina) |

## ZAO OS Integration

### Immediate Actions (This Sprint)

**1. Add fc:frame embed tags to shareable routes**
- Files: `src/app/(auth)/social/page.tsx`, `src/app/(auth)/governance/page.tsx`, track detail pages
- Pattern: per-route meta tags with dynamic OG images and share URLs containing FID
- Reference: Session 2 mini app per-route embeds

**2. Build agent webhook handler**
- Create: `src/app/api/webhooks/farcaster/route.ts`
- Pattern: Neynar pushes events -> Zod validation -> idempotency check (Supabase) -> structured LLM output -> Neynar reply
- Existing pattern: `src/app/api/` route handlers with try/catch, session checks, NextResponse.json
- Reference: Session 3 webhook architecture, Session 6 deployment

**3. Enforce 45% context budget on ZOE**
- Files: VPS agent SOUL.md, AGENTS.md, HEARTBEAT.md
- Action: Add front matter descriptions to all MD files. Implement compaction step that summarizes to 200-300 lines max
- Reference: Session 4 context rot prevention

**4. Add x402 payment wrapping to Neynar client**
- File: `src/lib/farcaster/neynar.ts`
- Action: Wrap Neynar API calls with x402 payment from Privy wallet. 5 lines of code per call, $0.001/call
- Reference: Session 5 x402 integration, Session 6 Neynar x402

### Medium-Term Actions (Next 2 Sprints)

**5. Farcaster mini app manifest**
- Create: `public/.well-known/farcaster.json`
- Include: app name, icon, splash screen, webhook URL for notifications, canonical domain
- File: `community.config.ts` already has branding data to populate the manifest

**6. Orchestrator + sub-agents for ZOE**
- Pattern: ZOE (Claude Sonnet) orchestrates, Haiku handles discrete tasks (cast classification, reply generation, moderation)
- Existing: `src/lib/moderation/moderate.ts` already uses Perspective API - add LLM sub-agent alongside
- Reference: Session 4 Among Traders pattern

**7. Agent memory pipeline**
- Create: `src/lib/agents/memory.ts`
- Pattern: Aggregate member Farcaster data -> Curate (filter noise) -> Transform to MD -> Store in Supabase -> Inject into agent prompt
- Existing: `supabase/migrations/` has agent_events table for event tracking
- Reference: Session 4 modified ETL pipeline

**8. Privy agent wallet for ZOE**
- Action: Create Privy server wallet, add ZOE as signer with $20/day spending limit, Zaal as owner
- Policy: allow-list restricted to Neynar API (x402), ZOUNZ contracts (`src/lib/zounz/contracts.ts`), tipping contracts
- Reference: Session 5 policy engine, Session 6 setup script

### Architecture Mapping

| Bootcamp Pattern | ZAO OS File/Component | Status | Action |
|-----------------|----------------------|--------|--------|
| Neynar SDK client | `src/lib/farcaster/neynar.ts` | Exists | Add x402 wrapping |
| API route handlers | `src/app/api/` | Exists | Add webhook + cron endpoints |
| Community config | `community.config.ts` | Exists | Source mini app manifest data |
| Mini app components | `src/components/music/` | Exists | Add fc:frame embed tags |
| Auth session | `src/lib/auth/session.ts` | Exists | Add SIWA (Sign In With Agent) alongside iron-session |
| Agent event tracking | `supabase/migrations/` | Exists | agent_events table ready |
| Content moderation | `src/lib/moderation/moderate.ts` | Exists | Add LLM sub-agent alongside Perspective API |
| ZOUNZ contracts | `src/lib/zounz/contracts.ts` | Exists | Add to Privy wallet allow-list |

## Cross-Session Patterns

### The Agent Stack (Sessions 1-6 Combined)

```
Layer 5: DISTRIBUTION
  Mini apps (fc:frame embeds), notifications (Neynar managed),
  per-route sharing, viral loops

Layer 4: COMMERCE
  Privy wallet (Shamir + TEE), x402 micropayments,
  MPP streaming, policy engine, key quorums

Layer 3: INTELLIGENCE
  Orchestrator + sub-agents, structured output,
  45% context budget, front matter filtering,
  dreaming (200-300 line compaction)

Layer 2: EXECUTION
  Event-driven (webhook/polling), idempotency keys,
  dead letter queues, Upstash QStash ($2/mo),
  process status tracking, observability

Layer 1: IDENTITY
  FID (on-chain, permanent), signer keys (revocable),
  storage units, open social graph, agents = first-class citizens
```

### What Changed from Doc 240

Doc 240 captured live session notes. This document (317) adds:

- Extracted patterns across all 6 sessions into a unified agent stack model
- Specific file paths and implementation actions for ZAO OS
- Comparison table for hosting approaches with cost breakdowns
- Key numbers consolidated from transcript data
- Cross-session pattern analysis (the 5-layer agent stack)

## Sources

| Source | URL |
|--------|-----|
| Farcaster Agentic Bootcamp (Luma) | https://luma.com/f7ok6tbp |
| Neynar Autonomous Agents Docs | https://docs.neynar.com/docs/agent |
| Privy Agentic Wallets | https://docs.privy.io/recipes/agent-integrations/agentic-wallets |
| Farcaster Mini Apps Docs | https://miniapps.farcaster.xyz/ |
| Farcaster Studio (Neynar) | https://neynar.com/studio |
| OpenRouter LLM Gateway | https://openrouter.ai/ |
| Upstash QStash | https://upstash.com/docs/qstash |
| x402 Protocol | https://www.x402.org/ |

## Related Research

- [Doc 240](../240-farcaster-agentic-bootcamp-builders-garden/) - Live session notes from same bootcamp (overlapping content, less structured)
- [Doc 316](../316-farcaster-agentic-bootcamp-week2-deep-dive/) - Week 2 sessions (7-10): x402/MPP deep dive, viral distribution, ERC-8004, multi-agent coordination
- [Doc 085](../../agents/085-farcaster-agent-technical-setup/) - Farcaster agent technical setup with Neynar
- [Doc 161](../../agents/161-agent-harness-engineering-langchain/) - Agent harness engineering, context rot, sub-agent orchestration
- [Doc 173](../../farcaster/173-farcaster-miniapps-integration/) - Mini apps integration guide
- [Doc 234](../../agents/234-openclaw-comprehensive-guide/) - OpenClaw guide (SOUL.md, memory, MCP)
