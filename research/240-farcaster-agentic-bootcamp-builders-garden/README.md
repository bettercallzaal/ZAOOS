# 240 — Farcaster Agentic Bootcamp (Builders Garden)

> **Status:** In Progress — Live Session Coverage
> **Date:** 2026-03-30 through 2026-04-10
> **Source:** Builders Garden / urbe eth bootcamp series

**Purpose:** 10-session bootcamp covering Farcaster building blocks, miniapps, agents, wallets, identity, and multi-agent systems. Directly applicable to ZAO OS agent infrastructure, miniapp integration, and ZOUNZ governance automation.

**Bootcamp Links:**
- [Neynar Docs](https://docs.neynar.com)
- [Farcaster Docs](https://docs.farcaster.xyz)
- [Farcaster Studio](https://neynar.com/studio)
- [Clanker Docs](https://clanker.gitbook.io)
- [Clanker Repos](https://github.com/orgs/clanker-devco/repositories)

---

## Table of Contents

1. [Session 1 — Farcaster Building Blocks](#session-1-farcaster-building-blocks)
2. [Session 2 — Miniapps 101](#session-2-miniapps-101)
3. [Session 3 — Agents 101](#session-3-agents-101)
4. [Sessions 4–10 Schedule](#sessions-410-schedule)
5. [SIWA: Sign In With Agent](#siwa-sign-in-with-agent)
6. [ZAO OS Integration Notes](#zao-os-integration-notes)

---

## Session 1: Farcaster Building Blocks

**Date:** March 30, 2026
**Speaker:** Naina Sachdev ([Dev3Pack](https://dev3pack.xyz))
**Host:** Lemon (urbe eth)
- [Recording](https://youtu.be/o2ckF8nPrB8)
- [Transcript](https://docs.google.com/document/d/1Fu2aoZow-ysiB5CS4nabh4f_zu-wijnfecYaGsysPnQ/edit)
- [Slides](https://drive.google.com/file/d/1ujmvMlyqs_9gI-Q03oQTun4YhczKI2bV/view)

### Architecture: Hybrid On-Chain + Off-Chain

Farcaster uses a hybrid architecture that deliberately separates identity (on-chain, permanent) from social data (off-chain, scalable):

```
On-Chain (Optimism Mainnet)          Off-Chain (Hubs / P2P Network)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────┐          ┌────────────────────────────┐
│  ID Registry            │          │  Hub (Peer-to-Peer Node)   │
│  → Owns your FID        │          │  → Complete copy of all    │
│  → FID = permanent      │          │    messages                │
├─────────────────────────┤          │  → Real-time event stream  │
│  Key Registry           │          │  → Validates signatures    │
│  → App keys per FID     │◄────────►│  → Syncs with all peers    │
│  → Instantly revocable  │          └────────────────────────────┘
├─────────────────────────┤
│  Store Registry         │
│  → Storage units per FID│
└─────────────────────────┘
```

### The Three Smart Contracts

**1. ID Registry** (`op-mainnet: 0x00000000Fc25870C6eD6b6c7E41Fb078b7656f69`)
- Owns your Farcaster ID (FID)
- FID is permanent and non-transferable in practice (tied to recovery address)
- Every agent needs its own FID — agents are first-class citizens

**2. Key Registry** (`op-mainnet: 0x00000000Fc1237824fb747aBDE0FF18990E59b7e`)
- Manages app-specific signing keys per FID
- App keys = delegated permission scopes
- **Instantly revocable** — user can revoke any app key without losing their FID
- This is how Neynar managed signers work

**3. Store Registry** (`op-mainnet: 0x00000000Fc6c5F01Fc30151999387Bb99A9f489b`)
- Manages storage units per FID
- Storage units needed to write messages to the hub
- Agents need storage units to post casts

### Hubs: The Off-Chain P2P Network

Hubs are the backbone of Farcaster's social data layer:

- Every hub has a **complete copy** of all messages (decentralized replication)
- Messages are cryptographically signed by the FID's key — tamper-evident
- **Real-time event stream** — subscribe to new casts, reactions, follows as they happen
- Peer-to-peer sync — no single point of failure
- Reading from hubs requires no permission
- Writing to hubs requires a valid signed message from a registered key

**Reading is permissionless.** Anyone can run a hub, read all casts, follow the social graph. This is what makes Farcaster composable.

### App Keys: Permission Without Trust

The app key model is central to how agents interact safely:

```
User (FID owner)
    │
    └── grants key → App Key (Ed25519 keypair)
                         │
                         └── signs messages → Hub accepts them as valid
                                              (attributed to user's FID)
```

- App keys are **scoped delegations** — the app can post on behalf of the user
- User can **instantly revoke** any app key from Key Registry
- The agent/app never has access to the user's root recovery key
- For agent FIDs: the agent IS the FID owner, so it controls its own keys directly

### The Four Pillars of Farcaster for Agent Builders

1. **Open Social Graph** — All follows, casts, reactions are public and queryable. Agents can read the full graph without auth.

2. **Composable Identities** — FIDs are portable across clients. An agent built on Neynar works on Warpcast, Supercast, Herocast simultaneously.

3. **Event-Driven Architecture** — Hubs emit real-time events. Agents can subscribe to cast events, mention events, reaction events — perfect for webhook-driven agent loops.

4. **On-Chain/Off-Chain Composability** — Identity and keys on Optimism. Social data on hubs. The separation makes it cheap to scale (off-chain) while keeping identity trustless (on-chain).

### Neynar API: Practical Demo

Neynar abstracts the hub complexity. Key steps shown in demo:

```bash
# 1. Get API key from neynar.com
NEYNAR_API_KEY=your_key

# 2. Create a signer (managed key for an agent FID)
curl -X POST https://api.neynar.com/v2/farcaster/signer \
  -H "api_key: $NEYNAR_API_KEY" \
  -H "Content-Type: application/json"
# Returns: signer_uuid, public_key, fid

# 3. Read casts from a channel
curl "https://api.neynar.com/v2/farcaster/feed/channel?channel_id=zao&limit=25" \
  -H "api_key: $NEYNAR_API_KEY"

# 4. Write a cast (agent posts)
curl -X POST https://api.neynar.com/v2/farcaster/cast \
  -H "api_key: $NEYNAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "signer_uuid": "your_signer_uuid",
    "text": "Hello from the agent!",
    "channel_id": "zao"
  }'
```

Neynar handles:
- Hub connectivity and message broadcasting
- Signer key management (no need to manage Ed25519 keys yourself)
- Storage unit provisioning
- Rate limiting and retry logic

### Key Takeaways for ZAO OS

- **ZAO agent FID:** The ZAO OS agent should have its own FID registered through Neynar. It is a first-class Farcaster citizen, not a bot tacked onto an existing account.
- **App key model maps to our auth:** Our existing iron-session + managed signer pattern is architecturally correct. Users grant ZAO OS an app key; we never touch their root key.
- **Hub event stream:** We can subscribe to the `/zao` channel event stream to power real-time feed updates without polling — lower latency, lower cost.
- **Permissionless reading:** Our social feed already benefits from this — no auth needed for read operations, which is why the Neynar read endpoints are simpler/cheaper.
- **Storage units:** When provisioning agent FIDs, ensure storage units are allocated or casts will fail silently.

---

## Session 2: Miniapps 101

**Date:** March 31, 2026
**Speaker:** Lucas Myers (Staff Engineer, [Neynar](https://neynar.com))
- [Recording](https://www.youtube.com/playlist?list=PLtRePrZ9E4IisvFEJOYcYTD4P_FR2PbNQ)
- [Transcript](https://docs.google.com/document/d/1v6XZzHsOiqZ8FKI3wDtcpbK5TA-T4TsLVhMKAmNiMR0/edit)

### The SDK `ready()` Function: Non-Negotiable

The single most important rule for miniapps:

```typescript
import { sdk } from "@farcaster/frame-sdk";

// This MUST be called when your app has finished loading.
// If you don't call ready(), the miniapp will show a loading
// spinner forever and users will bounce.
useEffect(() => {
  sdk.actions.ready();
}, []);
```

**Why it matters:** Farcaster's miniapp container shows a splash screen until `ready()` is called. If your async data fetch hangs, `ready()` never fires, and the app appears broken. Call `ready()` as soon as the UI is interactive — even if background data is still loading.

### The Farcaster JSON Manifest

Every miniapp requires a manifest at `.well-known/farcaster.json`. This is the single source of truth for app identity and discovery:

```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...",
    "signature": "..."
  },
  "frame": {
    "version": "1",
    "name": "ZAO OS",
    "iconUrl": "https://zaoos.com/icon.png",
    "homeUrl": "https://zaoos.com",
    "imageUrl": "https://zaoos.com/og.png",
    "buttonTitle": "Open ZAO OS",
    "splashImageUrl": "https://zaoos.com/splash.png",
    "splashBackgroundColor": "#0a1628",
    "webhookUrl": "https://zaoos.com/api/webhooks/farcaster"
  }
}
```

Rules:
- **One manifest per miniapp** (one per canonical domain)
- **Primary category** drives discovery in the Farcaster miniapp store
- **accountAssociation** proves you own the domain — generated via Farcaster Studio or signing tools
- **webhookUrl** is where Farcaster sends notification events

### Canonical Domain and Migration

- The `homeUrl` domain is the canonical identity of your miniapp
- If you migrate from `zaoos.vercel.app` to `zaoos.com`, you must re-sign the manifest with the new domain
- Get the domain right before you acquire users — migration is technically possible but requires re-signing

### Developer Tools (All in Farcaster Studio)

| Tool | Purpose |
|------|---------|
| **Preview** | Test your miniapp in a real Farcaster frame context |
| **Embed** | Generate the `<meta>` tags for your route |
| **Manifest** | Sign and generate your `.well-known/farcaster.json` |
| **Debugger** | AI agent that auto-fixes errors in your miniapp code |

### FC Embed Tag: Per-Route Dynamic OG

The FC embed tag is a special `<meta>` tag that Farcaster reads when your miniapp URL is shared:

```html
<!-- In your Next.js generateMetadata() -->
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="https://zaoos.com/api/og/track/123" />
<meta property="fc:frame:button:1" content="Listen Now" />
<meta property="fc:frame:post_url" content="https://zaoos.com/api/frame/track/123" />
```

In Next.js App Router:

```typescript
// app/track/[id]/page.tsx
export async function generateMetadata({ params }) {
  const track = await getTrack(params.id);
  return {
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `https://zaoos.com/api/og/track/${params.id}`,
      "fc:frame:button:1": `Listen: ${track.title}`,
    },
  };
}
```

This enables **per-route dynamic embeds** — each track, proposal, or artist page gets its own rich preview when shared in Farcaster.

### Quick Auth

For authenticating users inside a miniapp, Quick Auth is the recommended approach:

```typescript
import { sdk } from "@farcaster/frame-sdk";

// Get the user's FID and verified address without a full SIWF flow
const context = await sdk.context;
const { fid, username, displayName, pfpUrl } = context.user;

// For server-side verification:
const token = await sdk.actions.signIn({ nonce: serverNonce });
// Send token to your API, verify on server with Neynar
```

Quick Auth gives you the user's FID immediately — no wallet signature needed unless you need on-chain verification.

### Notifications: Use Neynar

Miniapp notifications are architecturally complex. The short answer: **use Neynar as a managed notification host**.

Why it's complex:
- Farcaster notification tokens are per-user per-app
- You need to store tokens, manage opt-outs, handle delivery failures
- Farcaster may rotate tokens
- Rate limits per user per day

Neynar's managed notification service handles all of this. Their webhook → notification pipeline:

```
User enables notifications in miniapp
        ↓
Farcaster sends notification token to your webhookUrl
        ↓
You forward to Neynar Notification API
        ↓
Neynar stores token, manages delivery, handles retries
        ↓
You trigger notifications via Neynar API when events happen
```

### Farcaster Studio: Full App Generator

Neynar's Farcaster Studio (`neynar.com/studio`) is more than a tool — it's an app generator:

1. Describe your miniapp concept
2. Studio generates a full Next.js project with:
   - Manifest pre-configured
   - SDK `ready()` correctly placed
   - Built-in database (Neynar-hosted)
   - Auth flow set up
3. **Debugger agent** auto-fixes errors as you build — you can paste errors and it patches the code
4. Export as zip → deploy to Vercel

### Publishing a Miniapp

```
1. Build your miniapp (Next.js recommended)
2. Sign your manifest at neynar.com/studio → Manifest tool
   → This generates the accountAssociation in farcaster.json
3. Deploy to Vercel (or any host with your canonical domain)
4. Verify manifest is accessible at /.well-known/farcaster.json
5. Submit to Farcaster miniapp directory via Farcaster Studio
```

### Key Takeaways for ZAO OS

- **ZAO OS is already a miniapp candidate.** Our `/social`, `/music`, and `/governance` routes can each have dynamic FC embed tags for sharing tracks, proposals, and governance votes on Farcaster.
- **Add `sdk.ready()` immediately** to any miniapp entry point. This is the #1 cause of broken miniapp experiences.
- **Manifest at `zaoos.com/.well-known/farcaster.json`** must be signed with our production domain before public miniapp launch.
- **Per-route OG tags for music:** Each track page should have a dynamic `fc:frame:image` pointing to our OG image generator — a listener sees a track embed, clicks, it opens directly in the music player.
- **Notifications via Neynar:** When a user's proposal passes governance or a new track drops, fire a Farcaster notification through Neynar's managed service rather than building our own token storage.
- **Farcaster Studio debugger:** Use for rapid prototyping of new miniapp routes — paste errors, get fixes, export to Vercel.

---

## Session 3: Agents 101

**Date:** April 1, 2026
**Speakers:** Jack Dishman & Grin ([Clanker](https://clanker.fun) / [Neynar](https://neynar.com))
- [Recording](https://youtu.be/oycg_5_tAcA)
- [Transcript](https://docs.google.com/document/d/1H17RLp_-j2L_K-For1TihTAp-uXaNFDPXX8B9uhpwK0/edit)
- [Article](https://x.com/JackDishman/status/2039452216730222969)

### The Core Mental Model: Loops With Personalities

> "Agents are just loops with personalities."
> — Jack Dishman

Strip away the hype: an agent is an event loop that reads inputs, decides what to do (LLM call), and executes actions. The "personality" is the system prompt. Everything else is plumbing.

### Agent Architecture: Event Sources to Action Execution

```
┌─────────────────────────────────────────────────────────────────┐
│                     AGENT ARCHITECTURE                          │
│                                                                 │
│  Event Sources          Ingestion         Message Queue         │
│  ┌────────────┐        ┌─────────┐       ┌──────────────────┐  │
│  │ Farcaster  │        │         │       │                  │  │
│  │ Webhooks   ├───────►│ Webhook │──────►│  Upstash Redis   │  │
│  │            │        │ Handler │       │  Queue           │  │
│  ├────────────┤        │         │       │                  │  │
│  │ Cron Jobs  ├───────►│ Polling │──────►│  (deduplication  │  │
│  │            │        │ Service │       │   + retry)       │  │
│  ├────────────┤        └─────────┘       └────────┬─────────┘  │
│  │ Direct     │                                    │            │
│  │ Mentions   │                                    ▼            │
│  └────────────┘                          ┌──────────────────┐  │
│                                          │   Agent Core     │  │
│  State Store                             │   (LLM Call)     │  │
│  ┌──────────────────┐                   │                  │  │
│  │  Supabase        │◄──────────────────│  System prompt   │  │
│  │  - Memory        │                   │  + context       │  │
│  │  - Conversation  │──────────────────►│  + tools         │  │
│  │    history       │                   └────────┬─────────┘  │
│  │  - Agent state   │                            │             │
│  └──────────────────┘                            ▼             │
│                                          ┌──────────────────┐  │
│                                          │ Action Execution  │  │
│                                          │ - Post cast      │  │
│                                          │ - React          │  │
│                                          │ - Call API       │  │
│                                          │ - Update state   │  │
│                                          └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### The Agentic Loop

```
         ┌──────────┐
         │  Trigger  │ ← Webhook event, cron, direct mention
         └────┬─────┘
              ▼
         ┌──────────┐
         │  Decide   │ ← LLM decides what action to take
         └────┬─────┘       (structured output → action enum)
              ▼
         ┌──────────┐
         │  Execute  │ ← Call Neynar API, update DB, etc.
         └────┬─────┘
              ▼
         ┌──────────┐
         │  Output   │ ← Cast reply, reaction, state update
         └────┬─────┘
              ▼
         ┌──────────┐
         │  Repeat   │ ← Loop back, or wait for next trigger
         └──────────┘
```

### Conditionals BEFORE the LLM

This is the most important performance optimization:

```typescript
// WRONG: Ask LLM to decide if we should respond at all
const llmResponse = await llm.complete(`
  Someone mentioned the agent. Should we respond? Cast: ${cast.text}
`);
// Wastes tokens and latency on cases you don't need LLM for

// RIGHT: Filter with conditionals first
async function handleMention(cast: Cast) {
  // Pre-filter: is this worth the LLM call?
  if (cast.text.length < 3) return; // ignore one-word casts
  if (isSpam(cast.author.fid)) return; // ignore known spam FIDs
  if (recentlyRepliedTo(cast.hash)) return; // idempotency check
  if (!passesContentFilter(cast.text)) return; // basic filters

  // NOW call the LLM — only for cases that need intelligence
  const response = await llm.complete(buildPrompt(cast));
  await postReply(cast.hash, response);
}
```

Conditionals are cheap (microseconds). LLM calls are expensive ($0.001–0.01 each + latency). Filter hard before the LLM.

### Structured Output Over Regex

```typescript
// WRONG: Parse LLM free text with regex
const response = await llm.complete("Should I like this cast? Yes or No");
const shouldLike = /yes/i.test(response); // fragile, breaks often

// RIGHT: Use tool calling / structured output
const response = await llm.complete({
  messages: [...],
  tools: [{
    name: "decide_action",
    description: "Decide what action to take on this cast",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["like", "reply", "recast", "ignore"]
        },
        reply_text: {
          type: "string",
          description: "Reply text if action is reply"
        },
        reasoning: {
          type: "string"
        }
      },
      required: ["action", "reasoning"]
    }
  }]
});

// Structured, typed, predictable
const { action, reply_text } = response.tool_calls[0].input;
```

Structured output (tool calling) gives you typed responses that map directly to action dispatch logic. No regex fragility.

### Memory Architecture: Three Layers

```
┌──────────────────────────────────────────────────────────┐
│                   AGENT MEMORY                            │
│                                                           │
│  Static (Compiled into system prompt)                     │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ - Personality, tone, values                         │ │
│  │ - Domain knowledge (music, ZAO lore)                │ │
│  │ - Hard rules ("never say X", "always credit Y")     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Long-Term (Supabase / persistent DB)                     │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ - Conversation history per user                     │ │
│  │ - User preferences and past interactions            │ │
│  │ - Learned facts ("user Z likes jazz", "FID 12345   │ │
│  │   is a spammer")                                    │ │
│  │ - Agent's own state and goals                       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Short-Term (Runtime / in-memory)                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ - Current conversation context window               │ │
│  │ - Pending actions queue                             │ │
│  │ - Temporary flags ("currently processing FID X")   │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Idempotency Key: Essential, Not Optional

Every agent operation that writes data must use an idempotency key:

```typescript
// Without idempotency: a webhook delivered twice = two replies
// That's embarrassing and potentially spammy.

async function processWebhookEvent(event: FarcasterWebhookEvent) {
  const idempotencyKey = `event:${event.hash}:${event.type}`;

  // Check if already processed
  const alreadyProcessed = await redis.get(idempotencyKey);
  if (alreadyProcessed) {
    console.log("Duplicate event, skipping:", idempotencyKey);
    return;
  }

  // Process the event
  await agentCore.handle(event);

  // Mark as processed (TTL of 24h is sufficient)
  await redis.setex(idempotencyKey, 86400, "processed");
}
```

Webhooks are delivered "at least once." Without idempotency keys, you will double-post. Upstash Redis makes this trivially cheap.

### Dead Letter Queue for Failed Operations

```typescript
// Failed operations go to DLQ for manual review or retry
async function executeAction(action: AgentAction) {
  try {
    await performAction(action);
  } catch (error) {
    if (isRetryable(error)) {
      await queue.retry(action, { delay: backoffDelay(action.attempts) });
    } else {
      // Move to dead letter queue for inspection
      await dlq.push({
        action,
        error: error.message,
        timestamp: Date.now(),
        context: action.context,
      });
      // Alert if DLQ depth exceeds threshold
      if ((await dlq.length()) > 10) {
        await notifyOperator("DLQ depth exceeded threshold");
      }
    }
  }
}
```

### Recommended Tech Stack (from Clanker team)

| Layer | Tool | Why |
|-------|------|-----|
| **Message Queue** | [Upstash Redis](https://upstash.com) | Serverless, per-request pricing, saves thousands vs always-on Redis |
| **State Store** | [Supabase](https://supabase.com) | Postgres + RLS, already in ZAO OS stack |
| **Analytics** | [PostHog](https://posthog.com) | Agent action tracking, funnel analysis |
| **Hosting** | [Vercel](https://vercel.com) or [Railway](https://railway.app) | Vercel for Next.js agents, Railway for long-running processes |
| **Nonce Management** | [Privy](https://privy.io) | Wallet nonces for on-chain agent actions |
| **Farcaster API** | [Neynar](https://neynar.com) | Managed signers, webhooks, feed access |

### Don't Add Queuing Until You Need It

> "Don't add queuing until demand requires it."
> — Jack Dishman

Start with a simple webhook handler → LLM → action pipeline. Add Upstash queue when:
- You're hitting rate limits and need to throttle
- You need to handle bursts (viral moments where your agent gets 1000 mentions)
- You need retry logic for failed operations

Premature queuing adds complexity without benefit at low traffic.

### Start With Product, Plan Infrastructure With AI

The Clanker team's process:

1. **Define the product goal first** — "The agent should respond to mentions in /zao with music recommendations"
2. **Plan infrastructure with AI** — describe the goal to Claude/GPT, ask it to design the architecture before touching code
3. **Build the simplest thing** — single webhook handler, no queue, no retry
4. **Add complexity only when the simple thing breaks** — queue when rate limited, retry when flaky, DLQ when ops overwhelmed

### Key Takeaways for ZAO OS

- **ZAO Agent architecture:** Farcaster webhook → simple handler (with idempotency key) → conditional filters → LLM (structured output) → Neynar cast reply. Start here, no queue needed yet.
- **Use our existing Supabase** for long-term memory. Store conversation history per FID, learned preferences, and agent state in Supabase tables.
- **Structured output is mandatory** for any agent that dispatches actions. Use Claude's tool calling with an action enum: `"like" | "reply" | "recast" | "ignore" | "governance_vote" | "music_recommend"`.
- **Idempotency on every webhook.** We already have Upstash in our research — use it as the idempotency store, not Supabase (too slow for this check).
- **Filter aggressively before LLM:** Is the mention in `/zao` channel? Is the FID allowlisted? Is it too short? Is it a duplicate? All free. LLM call costs money.
- **ZAO agent personality (static memory):** Music curation expertise, ZAO lore, artist community values, governance process knowledge — compile into system prompt.
- **Clanker repos** on GitHub (`github.com/orgs/clanker-devco/repositories`) are reference implementations for Farcaster agent patterns.

---

## Sessions 4–10 Schedule

### Session 4 — Memory, Context & Reasoning

**Date:** April 2, 2026
**Speaker:** saltorious.eth
**Topics:** Memory systems for agents, context window management, reasoning patterns
**Resources:** Slides available

### Session 5 — Give Your Agent a Wallet

**Date:** April 3, 2026
**Speaker:** Privy team
**Topics:** Wallet primitives for agents, signing transactions, managing agent wallets safely
**Resources:** Privy docs at [docs.privy.io](https://docs.privy.io)

---

*Easter Break: April 4–5, 2026 — No sessions*

---

### Session 6 — Agent Identity & Auth (ERC-8004)

**Date:** April 6, 2026
**Speaker:** Vitto (@EthereumFoundation)
**Topics:** ERC-8004 standard for agent identity, how agents authenticate on-chain, Sign In With Agent (SIWA)

### Session 7 — Embedded Capital & Agentic Commerce

**Date:** April 7, 2026
**Speaker:** Rafi
**Topics:** x402 pay-per-action protocol, agents that charge for services, micro-payments for agent interactions

### Session 8 — Going Viral on Farcaster

**Date:** April 8, 2026
**Speaker:** ATown (@Emerge)
**Topics:** Growth mechanics on Farcaster, what makes content spread, agent strategies for distribution

### Session 9 — Miniapp Notifications & Sharable Moments

**Date:** April 9, 2026
**Speaker:** Limone (@Builders Garden)
**Topics:** Deep dive on Farcaster notification system, creating sharable moments from miniapp events

### Session 10 — Multi-Agent Systems & Open Coordination

**Date:** April 10, 2026
**Speaker:** Cassie (@Quilibrium)
**Topics:** Multi-agent coordination, Quilibrium's decentralized compute for agent networks, open agent coordination protocols

---

## SIWA: Sign In With Agent

Sign In With Agent (SIWA) is an emerging standard (related to ERC-8004) that allows agents to authenticate with applications the same way users do with SIWE (Sign In With Ethereum). Key properties:

- Agent has an on-chain identity (FID + wallet address)
- Agent can sign authentication messages proving its identity
- Applications can verify the agent's identity and grant scoped permissions
- Enables agent-to-agent authentication (agent A calling agent B's API)
- ZAO OS relevance: our governance API could accept SIWA tokens from authorized AI agents, enabling automated proposal submission or vote delegation

More detail expected from Session 6 (Vitto / EthereumFoundation, April 6).

---

## ZAO OS Integration Notes

### Priority Actions From This Bootcamp

1. **Agent FID:** Register a dedicated FID for the ZAO agent via Neynar. Provision storage units.
2. **Farcaster manifest:** Add `.well-known/farcaster.json` to ZAO OS for miniapp discovery. Sign with production domain.
3. **SDK `ready()` call:** Add to any miniapp entry points (currently: not applicable, but needed before miniapp launch).
4. **Per-route FC embed tags:** Add `fc:frame` meta tags to `/track/[id]`, `/governance/[id]`, and `/social` routes for rich Farcaster sharing.
5. **Agent webhook handler:** Build `/api/webhooks/farcaster` route with idempotency (Upstash) + conditional filters + Claude structured output + Neynar reply.
6. **Supabase agent tables:** Add `agent_conversations`, `agent_memory`, `agent_actions_log` tables for long-term agent memory.
7. **Neynar notification integration:** Wire up Farcaster miniapp notification tokens to Neynar managed service.

### Architecture Fit With Existing ZAO OS Stack

| Bootcamp Concept | ZAO OS Equivalent | Status |
|-----------------|-------------------|--------|
| Managed signers | `APP_SIGNER_PRIVATE_KEY` + Neynar signer | Exists |
| Supabase state store | Supabase PostgreSQL | Exists |
| Webhook handler | `/api/webhooks/` directory | Partial |
| Idempotency store | Need Upstash Redis | TODO |
| Structured LLM output | Can add Claude tool calling | TODO |
| Miniapp manifest | `.well-known/farcaster.json` | TODO |
| Agent FID | Separate from app FID (19640) | TODO |
| Notification tokens | Neynar managed | TODO |

### Related Research Docs

- [Doc 001](../001-farcaster-protocol/) — Farcaster protocol fundamentals
- [Doc 002](../002-farcaster-hub-api/) — Hub API reference
- [Doc 085](../085-farcaster-agent-technical-setup/) — Farcaster agent technical setup with Neynar
- [Doc 173](../173-farcaster-miniapps-integration/) — Miniapps integration guide
- [Doc 246](../246-neynar-api-creative-agent-uses/) — Creative Neynar API uses for agents
