# 318 - Multi-Agent Coordination: Cassie Heart's Agentic Bootcamp Session 10

> **Status:** Research complete
> **Date:** 2026-04-09
> **Goal:** Extract the full multi-agent coordination architecture from Cassie Heart's Farcaster Agentic Bootcamp Session 10 and map it to ZAO OS's BCZ Agent (Agent Zero) + ZOE two-agent system.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Agent selection system** | ADOPT Cassie's softmax scoring with random noise for BCZ + ZOE dispatch. Current dispatch is deterministic - add noise to prevent uncanny valley responses. Modify `src/app/api/` webhook handlers to score both agents before dispatching. |
| **Activity budgets** | IMPLEMENT per-agent budgets: BCZ gets 50 actions/day (public Farcaster), ZOE gets 200 actions/day (internal tasks). Agents "get tired" - track in `supabase/migrations/20260406_agent_events.sql` agent_events table. |
| **90-second cooldown** | ENFORCE minimum 90-second gap between agent replies on Farcaster. Hard constraint at the code level, not the LLM level. Add to webhook dispatch logic before any model call. |
| **5-dimension personas** | DEFINE BCZ and ZOE personas across all 5 dimensions (tone, domain, risk, social, engagement) in `community.config.ts`. BCZ = thread starter + orchestrator. ZOE = summarizer + reply guy. |
| **HyperSnap fallback** | EVALUATE HyperSnap as free Neynar fallback for agent webhooks. Same event model, $0 vs $99-500/month. Test at haatz.quilibrium.com before committing. |
| **Memory decay** | ADD memory decay to agent context windows. Recent interactions weighted higher, conversations older than 7 days fade. Prevents agents from referencing stale context unnaturally. |
| **Humanization constraints** | IMPLEMENT schedule flags (BCZ offline 12am-7am EST), per-thread reply limits (max 3 replies per thread per agent), and delayed response windows (15-90 second random delay). |
| **Skip Klearu for now** | SKIP Klearu (CPU-based free LLM) - ZAO's agent quality depends on Claude/GPT-level reasoning. Revisit when Klearu supports function calling. Use for content safety filtering only. |

## About Cassie Heart

Cassie Heart is the founder of Quilibrium, a decentralized infrastructure protocol. She previously worked on the Farcaster/Merkle dev team, giving her deep knowledge of both Farcaster protocol internals and distributed systems. She presented Session 10 of the Farcaster Agentic Bootcamp at 2 AM Australia time - the most architecturally deep session of the entire bootcamp. Her 2016 research on political bot detection directly informs the humanization techniques in this session.

## Comparison: Multi-Agent Coordination Approaches

| Approach | Architecture | Humanization | Cost | Complexity | ZAO Fit |
|----------|-------------|--------------|------|------------|---------|
| **Cassie's Softmax Dispatch** | Webhook -> embed -> score agents -> softmax select -> execute | Excellent - random noise, budgets, cooldowns, schedule flags | Low (scoring is local math) | Medium | **Best** - maps directly to BCZ + ZOE two-agent system |
| **LangChain Multi-Agent** | Supervisor LLM routes to sub-agents via function calls | Poor - deterministic routing, no humanization layer | High ($0.01-0.05 per routing decision) | High | Poor - over-engineered for 2 agents, expensive supervisor calls |
| **CrewAI Role-Based** | Predefined roles with sequential/parallel task execution | Poor - no social behavior modeling, task-oriented not conversational | Medium | Medium | Poor - designed for task pipelines, not social agents |
| **ElizaOS Plugin System** | Character files + plugin architecture, event-driven | Medium - character personality but no activity budgets or fatigue | Medium | High (plugin ecosystem overhead) | Medium - considered for OpenClaw, but plugin complexity adds maintenance burden |
| **Custom Orchestrator (current ZAO)** | Vercel serverless + Supabase event log + manual dispatch | None - no humanization, deterministic | Low | Low | **Upgrade target** - add Cassie's scoring + constraints on top |

## Core Architecture: Event-Driven Multi-Agent Dispatch

### The Pipeline (Cassie's canonical flow)

```
Farcaster Event (webhook)
    |
    v
[Embed Event] -- semantic vector
    |
    v
[Query Memory] -- per-user, per-topic, per-agent
    |
    v
[Score All Agents] -- topic match + relevance + recency + budget + noise
    |
    v
[Softmax Selection] -- probabilistic, not deterministic
    |
    v
[Context Assembly] -- event + thread + memory + system signals
    |
    v
[LLM Call] -- persona prompt + assembled context
    |
    v
[Constraint Check] -- cooldown, thread limit, safety filter
    |
    v
[Execute Action] -- cast, like, follow, or do nothing
```

### Agent Selection Scoring (5 factors)

Each agent receives a composite score when an event arrives:

1. **Topic match** - does this event match the agent's declared interests?
2. **Semantic relevance** - cosine similarity between event embedding and agent's domain
3. **Recency of last action** - agents who acted recently score lower (fatigue)
4. **Remaining budget** - agents near budget exhaustion score lower
5. **Random noise** - CRITICAL factor that prevents deterministic, robotic behavior

Apply softmax across all agent scores. The highest-scoring agent acts. Random noise means the "wrong" agent occasionally responds, which is exactly how real humans behave - sometimes you chime in on topics outside your expertise.

### Context JSON Structure (per-agent call)

```json
{
  "event": "// Neynar or HyperSnap webhook payload (identical format)",
  "thread_context": "// Full thread for conversation awareness",
  "recent_memory": {
    "user_interactions": "// Past interactions with this specific user",
    "topic_history": "// Recent conversations on this topic across all agents"
  },
  "agent_memory": "// THIS agent's specific memory and personality state",
  "system_signals": {
    "trending_topics": ["music", "governance", "onboarding"],
    "agent_active": true,
    "budget_remaining": 37,
    "last_action_seconds_ago": 245
  }
}
```

## Persona Engineering: 5 Dimensions

Cassie defines 5 orthogonal dimensions that fully characterize an agent's social personality:

| Dimension | Description | BCZ Agent (Agent Zero) | ZOE (Vercel Serverless) |
|-----------|-------------|----------------------|------------------------|
| **1. Tone** | Formal vs memetic | Semi-formal, music industry insider, occasional slang | Warm, helpful, slightly nerdy, never memetic |
| **2. Domain expertise** | What topics they own | ZAO community, music curation, Farcaster ecosystem, web3 music | Internal ops, research, scheduling, code, infrastructure |
| **3. Risk tolerance** | Censored vs uncensored | Moderate - filters hate speech, allows edgy music takes | Conservative - professional, never controversial |
| **4. Social behaviors** | Cooperative vs combative vs reactive | Cooperative + orchestrator - connects people, starts conversations | Cooperative + summarizer - distills information, answers questions |
| **5. Engagement style** | Thread starter / reply guy / observer / orchestrator | Thread starter + orchestrator (starts conversations, coordinates behind scenes) | Summarizer + reply guy (contributes information, builds on threads) |

### Interaction Models (mapped from real human behavior)

| Model | Real Human Analog | Agent Behavior | Which ZAO Agent |
|-------|-------------------|----------------|-----------------|
| Thread starter + reply guy | Person who posts ideas then defends them in replies | Starts topics, follows up with supporting context | BCZ (public Farcaster) |
| Just reply guy | Combative person who only reacts | Tears down bad takes, challenges assumptions | Neither - avoid this pattern |
| Summarizer/observer | Quote-tweeter, curator | Quote casts with synthesis, sometimes no comment | ZOE (internal + Farcaster summaries) |
| Orchestrator | "Secret group chat guy" who connects people | DMs people to bring them into conversations, rarely posts publicly | BCZ (behind-the-scenes coordination) |

## Making Agents Feel Human: System Constraints

Cassie's core insight: real humans are slow, have lives, get tired, give up, forget things, and get distracted. An agent that is always fast, always available, never tired, never gives up, never forgets, and never gets distracted is "honestly a very terrifying human to meet."

From her 2016 political bot detection research: "The biggest tell of bots was that they're ALWAYS ONLINE."

### Humanization Constraints (code-level, NOT prompt-level)

| Constraint | Implementation | Value | Why It Matters |
|------------|---------------|-------|----------------|
| **Delayed responses** | Random delay 15-90 seconds before replying | `Math.random() * 75 + 15` seconds | Instant replies are the #1 bot tell |
| **Activity budgets** | Max actions per 24-hour window | BCZ: 50/day, ZOE: 200/day | Agents "get tired" - stops spam |
| **Per-thread limits** | Max replies in a single thread | 3 replies per thread per agent | Agents "give up" on conversations |
| **Memory decay** | Older memories weighted lower | 7-day half-life | Agents "forget" naturally |
| **Schedule flags** | Offline hours, reduced activity periods | BCZ offline 12am-7am EST | Agents "have a life" |
| **Cooldown** | Minimum time between any two actions | 90 seconds (Cassie's recommendation) | Prevents machine-gun posting |

### Pre-LLM Context Constraints (checked BEFORE any model call)

These are code-level guards that prevent unnecessary LLM calls entirely:

1. If last post was < 90 seconds ago, skip (cooldown)
2. If thread already has a similar cast from this agent, skip (redundancy)
3. If activity budget is exhausted, skip (fatigue)
4. If agent is already in this thread at max depth, skip (per-thread limit)
5. If conversation has been semantically closed, skip (scored via embeddings)
6. If content safety filter has flagged too many recent posts, ban agent temporarily

## Prompt Structure (Cassie's template)

```
Your name is [persona]. Here are your behavioral rules:
- Maintain this tone: [tone dimension]
- Avoid redundancy with other agents or your own recent casts
- Prioritize these topics: [topic list]
- Respond only if your relevance score > [threshold]
- Keep casts under 320 characters
- You're part of a multi-agent system. Other agents may have responded.
- Don't assume exclusivity over any conversation
- Don't disclose you're part of a multi-agent system
```

Key insight: the prompt tells the agent it is part of a multi-agent system (so it defers to others) but instructs it to never reveal this to users. This prevents agents from stepping on each other while maintaining the illusion of independent actors.

## Cost Comparison: Expensive vs Quilibrium Stack

| Component | Expensive Path | Quilibrium Path | Monthly Savings | ZAO Recommendation |
|-----------|---------------|-----------------|-----------------|-------------------|
| **Farcaster API** | Neynar ($99-500/mo) | HyperSnap (free, identical event model) | $99-500 | Evaluate HyperSnap as fallback; keep Neynar as primary for reliability |
| **Key Management** | Privy (scales poorly at high volume) | QKMS (per-request, crypto micropayments) | Variable | SKIP - not relevant for 2-agent system |
| **Storage** | S3 ($20-100+/mo with egress) | Q Storage (5GB free, CDN, no egress fees) | $20-100+ | Evaluate for agent memory/embeddings storage |
| **Queuing** | SQS ($0.40/million messages) | QQQ (near-free, "rounding errors") | Marginal | SKIP - Vercel handles our queue needs |
| **Compute** | Lambda ($0.20/million requests) | FFX (private beta, ask Cassie) | Variable | SKIP - Vercel serverless is sufficient |
| **LLM Inference** | Claude/GPT ($50-500/mo) | Klearu (free, CPU-based, E2E encrypted) | $50-500 | Use Klearu for content safety scoring only; keep Claude for agent reasoning |

**Bottom line for ZAO OS:** The biggest potential saving is HyperSnap replacing Neynar for agent-specific webhooks ($99-500/month). Everything else is either marginal or not worth the migration cost for a 2-agent system.

## Anti-Patterns: What NOT To Do

Cassie explicitly called out these common agent mistakes:

| Anti-Pattern | Example | Why It Fails |
|-------------|---------|-------------|
| **Simple webhook -> respond** | Brackie, Clanker early versions | No context, no memory, deterministic "uncanny valley" text |
| **Big model supervising small models** | LangChain supervisor pattern | Expensive, slow, unnecessary - solve with architecture and code instead |
| **Always-online agents** | Any agent that responds 24/7 instantly | Biggest bot detection signal from Cassie's 2016 research |
| **Single persona dimension** | "Helpful assistant" | Flat, predictable, immediately identifiable as AI |
| **No random noise in selection** | Deterministic topic -> agent routing | Produces robotic, predictable behavior patterns |
| **Political interference** | Using humanized agents for astroturfing | "You will absolutely get an FBI trail on you. Speaking from experience." |

## ZAO OS Integration

### Existing Infrastructure (ready to extend)

| File | Current State | Cassie Pattern to Add |
|------|--------------|----------------------|
| `src/lib/farcaster/neynar.ts` | Neynar SDK client for webhooks and casts | Add HyperSnap as free fallback provider (identical event format) |
| `src/app/api/` | Route handlers for webhooks | Add agent dispatch orchestrator: embed -> score -> select -> execute |
| `supabase/migrations/20260406_agent_events.sql` | `agent_events` table tracks agent actions | Add columns: `budget_remaining`, `cooldown_until`, `thread_depth`, `relevance_score` |
| `src/components/admin/agents/` | SquadCircle, WarRoomFeed dashboard components | Visualize softmax scores, budget usage, cooldown timers, selection history |
| `community.config.ts` | Community branding, channels, admin FIDs, contracts | Add `agents` config block with persona dimensions, budgets, schedules, topic lists |
| `.claude/skills/vps/SKILL.md` | VPS agent infrastructure for ZOE | Add humanization constraints (schedule flags, cooldowns) to VPS agent config |

### New Files Needed

```
src/lib/agents/orchestrator.ts        -- Softmax agent selection + dispatch
src/lib/agents/scoring.ts             -- Topic match + relevance + recency + budget + noise
src/lib/agents/constraints.ts         -- Pre-LLM guards: cooldown, budget, thread depth, safety
src/lib/agents/personas.ts            -- 5-dimension persona configs for BCZ + ZOE
src/lib/agents/memory.ts              -- Scoped memory: per-user, per-topic, per-agent with decay
src/lib/agents/humanize.ts            -- Delayed response, schedule flags, fatigue simulation
```

### Agent Config Schema (for `community.config.ts`)

```typescript
agents: {
  bcz: {
    agent_id: 'bcz-agent-zero',
    persona_prompt: 'BCZ is the voice of The ZAO community...',
    topics: ['music', 'farcaster', 'web3-music', 'community', 'curation'],
    activity_budget: 50,        // actions per 24 hours
    cooldown_seconds: 90,       // minimum between actions
    thread_max_depth: 3,        // max replies per thread
    priority_weight: 0.7,       // base selection weight
    schedule: { offline_start: 0, offline_end: 7, timezone: 'America/New_York' },
    persona: {
      tone: 'semi-formal-insider',
      domain: 'music-community-web3',
      risk: 'moderate',
      social: 'cooperative-orchestrator',
      engagement: 'thread-starter'
    }
  },
  zoe: {
    agent_id: 'zoe-serverless',
    persona_prompt: 'ZOE is the operational backbone of ZAO OS...',
    topics: ['research', 'infrastructure', 'scheduling', 'summaries', 'onboarding'],
    activity_budget: 200,
    cooldown_seconds: 90,
    thread_max_depth: 2,
    priority_weight: 0.5,
    schedule: { offline_start: 2, offline_end: 6, timezone: 'America/New_York' },
    persona: {
      tone: 'warm-helpful',
      domain: 'ops-research-infrastructure',
      risk: 'conservative',
      social: 'cooperative-summarizer',
      engagement: 'reply-observer'
    }
  }
}
```

### Implementation Priority

| Phase | Work | Effort | Impact |
|-------|------|--------|--------|
| 1 | Add pre-LLM constraint checks to existing webhook handlers (cooldown, budget tracking) | 2-3 hours | High - immediately stops bot-like behavior |
| 2 | Define 5-dimension personas in `community.config.ts` for BCZ + ZOE | 1 hour | High - consistent personality across all interactions |
| 3 | Build softmax scoring with random noise in `src/lib/agents/scoring.ts` | 3-4 hours | High - probabilistic dispatch replaces deterministic routing |
| 4 | Add humanization layer (delayed responses, schedule flags, fatigue) | 2-3 hours | Medium - makes agents feel natural over time |
| 5 | Implement scoped memory with decay in `src/lib/agents/memory.ts` | 4-6 hours | Medium - context-aware responses, forgetting old conversations |
| 6 | Evaluate HyperSnap as Neynar fallback | 2 hours | Low urgency - cost optimization, not functionality |

## Key Quotes

> "Don't use a big model to tell small models what to do. You can solve these problems with decent architecture and decent prompting and decent code."

> "Deterministic output is the uncanny valley of text."

> "Something that looks kind of like a human that's super fast, doesn't have a life, never gets tired, never gives up, never forgets things, and never gets distracted would be honestly a very terrifying human to meet."

> "If you're going to build multi-agent systems to look human, do not ever pilot them towards political interference campaigns or you will absolutely get an FBI trail on you. Speaking from experience."

> "The biggest tell of bots was that they're ALWAYS ONLINE." (from Cassie's 2016 political bot detection research)

## Key Numbers

- **320 characters** - maximum Farcaster cast length (standard, excluding Pro/HyperSnap)
- **90 seconds** - Cassie's recommended minimum cooldown between agent replies
- **5 persona dimensions** - tone, domain expertise, risk tolerance, social behaviors, engagement style
- **$500/month** - Neynar API cost at scale vs $0 for HyperSnap (identical event model)
- **5 GB** - free Q Storage allocation (CDN-backed, no egress fees)
- **5 scoring factors** - topic match, semantic relevance, recency, budget, random noise
- **50 actions/day** - recommended BCZ public Farcaster budget
- **7-day half-life** - memory decay window for agent context

## Sources

- Farcaster Agentic Bootcamp (Session 10 - Cassie Heart): https://luma.com/f7ok6tbp
- Quilibrium Network GitHub: https://github.com/QuilibriumNetwork
- HyperSnap (Farcaster fork with identical API): https://haatz.quilibrium.com
- Klearu - E2E encrypted ML inference: https://github.com/QuilibriumNetwork/klearu
- Quilibrium Console (Q Storage, QQQ, QKMS): https://quilibrium.com/qconsole
- ZAO OS Agent Events Migration: `supabase/migrations/20260406_agent_events.sql`
- ZAO OS Neynar Client: `src/lib/farcaster/neynar.ts`
