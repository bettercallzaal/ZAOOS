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
4. [Session 4 — Memory, Context & Reasoning](#session-4-memory-context--reasoning)
5. [Session 5 — Give Your Agent a Wallet](#session-5-give-your-agent-a-wallet)
6. [Sessions 6–10 Schedule](#sessions-610-schedule)
7. [SIWA: Sign In With Agent](#siwa-sign-in-with-agent)
8. [ZAO OS Integration Notes](#zao-os-integration-notes)

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

## Session 4: Memory, Context & Reasoning

**Date:** April 2, 2026
**Speaker:** Saltorious (Senior Software Engineer, Laser Technologies)
**Host:** urbe eth (Builders Garden)

### LLMs Are Stateless: You Must Build the State

Every LLM is a stateless machine. There is no persistent memory between calls. The agent developer must:

1. **Construct** internal state using system prompts and user prompts
2. **Inject** that state deliberately into every LLM call
3. **Update** the state based on responses

The entire discipline of "agent memory" is really about efficient prompting — building the right context for each call.

### Short-Term vs Long-Term Memory

**Short-Term Memory:** An array of messages passed as context to the LLM. Updated by appending each new question-and-answer exchange. This is the conversation history.

**Long-Term Memory:** Specialized data flows that persist across conversations:
- **Fine-tuning** — bake knowledge into model weights (expensive, slow, inflexible)
- **Vector database RAG** — encode documents as vectors, semantic search at runtime
- **MD file trees** — transform data into condensed Markdown files, orchestrator selects which to inject

### Context Rot: The 45% Rule

**Context rot** occurs when the data passed to an agent exceeds ~45% of its total context window. Beyond this threshold:
- Diminishing returns on output quality
- Model struggles to index on important information
- Responses become generic, missing key details

**Mitigation:** Use compacting tools that condense the conversation into key points, then start a fresh context window with the condensed summary. Claude Code does this automatically.

### Three-Phase Context Pipeline: Aggregate → Curate → Transform

Saltorious described a framework for building agent context, specifically for Farcaster profiles:

```
Phase 1: AGGREGATE
  Raw data collection:
  → User profile (bio, FID, pfp, connected addresses)
  → Top posts (sorted by engagement)
  → Reply patterns and tone
  → Social graph (who they interact with most)

Phase 2: CURATE
  Structure data for LLM parsing:
  → Extract key themes from posts
  → Categorize tone (sarcastic, earnest, technical, etc.)
  → Identify recurring topics and interests
  → Remove noise (low-engagement posts, spam interactions)

Phase 3: TRANSFORM
  Condense into injectable format:
  → Single MD file per user/profile
  → Structured sections (identity, voice, interests, style)
  → Compact enough to fit in context window alongside task prompt
```

Agents can **recursively update their own context** — when the agent learns something new from an interaction, it writes that back to its MD file, creating emergent behaviors over time.

### Prompt Orchestration: Flagship + Sub-Agents

The cost-effective architecture for quality agent output:

```
User Request
    ↓
┌──────────────────────────────┐
│  ORCHESTRATOR (Flagship)     │  ← Claude Opus / GPT-5o
│  - Ingests user prompt       │
│  - Fetches data via tools    │
│  - Creates baseline plan     │
│  - Delegates to sub-agents   │
└────────────┬─────────────────┘
             ↓
    ┌────────┼────────┐
    ↓        ↓        ↓
┌────────┐ ┌────────┐ ┌────────┐
│ Sub-A  │ │ Sub-B  │ │ Sub-C  │  ← Cheaper models (Haiku, Gemini Flash, Grok)
│ Task 1 │ │ Task 2 │ │ Task 3 │
└────┬───┘ └────┬───┘ └────┬───┘
     ↓          ↓          ↓
┌──────────────────────────────┐
│  ORCHESTRATOR (Synthesis)    │
│  - Merges sub-agent results  │
│  - Final quality check       │
│  - Delivers to user          │
└──────────────────────────────┘
```

**Why this works:**
- Sub-agents get **narrow context windows** — only what they need for their specific task
- Lower-cost models (Haiku at $0.25/MTok vs Opus at $15/MTok) handle discrete tasks
- Orchestrator sees the full picture, sub-agents don't need to
- Token spend drops dramatically while output quality stays high

### Tiered Prompt Structure

Saltorious recommended structuring the system prompt in this order:

```
SYSTEM PROMPT (chunked and structured):
  1. System instructions + identity/persona
  2. Long-term context (from vector DB or MD files)
  3. Session state (current conversation summary)
  4. Social context (relevant user/community data)

USER PROMPT:
  - Simple and focused
  - Only the current input/question
  - No context mixing — keep it clean
```

**Key insight:** Structure maximizes signal and minimizes noise. The model indexes better on well-organized prompts than on long, flat text dumps.

### Case Study: Among Traders (AI Social Deduction Game)

Saltorious built "Among Traders" — an AI social deduction game where:

- Agents are **digital twins** created from users' public Farcaster data
- Analysis pipeline: bio + location + top casts + replies → MD profile
- Game runs in XMTP chat (E2E encrypted)
- Different sub-agents handle different game phases:
  - **Claude Haiku** → deliberation (reasoning about who to trust)
  - **Gemini Flash** → voting decisions (fast, structured output)
  - **Different model per phase** → optimized for cost and task fit

### Case Study: Hype Man (Paid Quote Casts)

"Hype Man" generates promotional quote casts that match a user's writing voice:

1. Analyze user's Farcaster profile and top casts
2. Create MD profile describing their writing style (tone, sentence length, vocabulary, emoji use)
3. Generate a quote cast promoting a target cast, written in the user's voice
4. User approves or edits before posting

**Critical learning:** Achieving accurate voice matching required meticulous context engineering to avoid generic AI language. Good context engineering **outperformed fine-tuned models** — a well-prompted Haiku beat a fine-tuned Llama 4 at voice matching, with zero training investment.

### Claude Code's Memory Techniques (Referenced by Saltorious)

Two techniques from Claude Code's own architecture:

1. **"Dreaming"** — Agent recursively reads all MD files, extracts the most meaningful information, and injects a summarized version into the prompt for subsequent runs. This is compaction applied to long-term memory.

2. **Front matter** — A concise description at the start of each MD file (like YAML front matter) that lets the LLM quickly assess relevance without parsing the full content. Saves context window space.

```markdown
---
name: user_music_preferences
description: Jazz and lo-fi hip hop lover, skips country, plays chill at night
type: user
---

[Full content below — only loaded if description matches the query]
```

### Vector Databases and RAG

For large document collections, vector databases enable semantic search:

```
Document Ingestion:
  Large document → split into pages/chunks
  Each chunk → encoded as a vector (embedding)
  Vectors stored in vector database (pgvector, Pinecone, etc.)

Runtime Query:
  User question → encoded as vector
  Semantic search → find most relevant chunks
  Top-K chunks → injected as context to LLM
  LLM generates answer grounded in the retrieved chunks
```

**Graph RAG** (more advanced): Pages have semantic links representing relationships between data. Useful for complex knowledge bases but overkill for most agent systems.

**RAG for ZAO OS:** Effective for our 240+ research docs — encode them in pgvector (already in our Supabase), semantic search at query time instead of loading everything into context.

### Key Takeaways for ZAO OS

- **Context rot applies to ZOE.** Our VPS agent (ZOE) with SOUL.md + AGENTS.md + research context must stay under 45% of context window. Use front matter to let ZOE assess relevance before loading full docs.
- **Aggregate→Curate→Transform for member profiles.** Build MD profiles from each ZAO member's Farcaster activity (top casts, music shares, governance votes). Store in Supabase, inject into agent context when interacting with that member.
- **Sub-agent architecture maps to our stack.** Orchestrator (Claude Opus/Sonnet) delegates to cheaper models (Haiku) for discrete tasks like: classify cast → generate reply → format for platform. Already doing this with OpenClaw's multi-agent setup.
- **RAG over research library.** 240+ research docs in `research/` are prime candidates for pgvector RAG. Instead of loading docs into context, embed them and semantic-search at runtime. Doc 42 covers Supabase pgvector setup. Doc 197 covers agent memory architecture.
- **Front matter pattern already in use.** Claude Code's own memory system (which we use) has front matter on memory files. ZOE should adopt the same pattern for its MD knowledge files.
- **Voice matching via context > fine-tuning.** For any ZAO agent that posts on behalf of members (governance proposals, music recommendations), invest in context pipeline (profile MD files) rather than fine-tuning.

---

## Session 5: Give Your Agent a Wallet

**Date:** April 3, 2026
**Speaker:** Privy team
**Host:** urbe eth (Builders Garden)

### Why Agents Need Wallets

Agents without spending power are "geniuses in a box" — they can reason but can't interact economically with the world. For agents to become autonomous economic actors, they need:

- Ability to send transactions (pay for services, mint NFTs, tip creators)
- Secure key management (can't just hold a private key in plaintext)
- Configurable spending limits (prevent runaway spending)
- User oversight (owner can revoke or restrict at any time)

### Privy: Authentication + Key Management

Privy is an authentication and key management system that abstracts blockchain complexity:

- **Embedded wallets** provisioned automatically on user login (Google, Twitter, Farcaster, etc.)
- **Server-side wallets** spun up via API for agents not associated with a user
- Acquired by Stripe in 2026 — positioned for agentic payments
- Approaching 4 nines (99.99%) uptime

### Wallet Ownership Model

Privy wallets have two role types:

```
OWNER (Total Control)
  → Full wallet access
  → Can add/remove signers
  → Can change policies
  → Typically: the user or the app developer

SIGNER (Scoped Permissions)
  → Limited actions defined by policies
  → Can be the agent's key
  → Policies restrict what the signer can do
  → Revocable by owner at any time
```

**Important distinction:** The "keys" being discussed are **authorization keys** created and distributed by Privy that gate access to the wallet — not the wallet's actual private key. The private key is secured using **Shamir Secret Sharing** and is only reconstituted inside the Trusted Execution Environment (TEE) when an active request is being made.

### Policy Engine: Controlling Agent Spending

Privy's policy engine allows granular control:

| Policy Type | Example | Use Case |
|-------------|---------|----------|
| **Per-transaction limit** | Max $20 per tx | Prevent large unauthorized spends |
| **Cumulative limit** | Max $100/day (stateful) | Budget management over time |
| **Allow list** | Only send to specific contracts | Restrict to known-safe addresses |
| **Deny list** | Block specific addresses | Prevent interaction with blacklisted contracts |
| **Key quorum** | Require 2-of-3 signatures | Multi-sig for high-value operations |

**Key quorum** enables verification agents: an agent can request a transaction, but a separate verification agent must co-sign before it executes. This is n-of-m multisig at the authorization level.

### Configurability Spectrum

The user always controls the level of agent autonomy:

```
Full User Control                                    Full Agent Autonomy
←───────────────────────────────────────────────────────→
│                                                       │
│  User must sign         Agent auto-transacts          │
│  every transaction      within policy limits          │
│                                                       │
│  "Agent proposes,       "Agent acts, user             │
│   user approves"         monitors dashboard"           │
```

Builders decide where on this spectrum their UX sits. Privy supports the full range.

### Setup: Agent + Wallet in Minutes

```typescript
// 1. Create a server wallet for the agent (via API)
const wallet = await privy.wallets.create({
  walletType: 'server',
});

// 2. Fund the wallet from a treasury
await fundWallet(wallet.address, { amount: '0.1', token: 'ETH' });

// 3. Add a signer (the agent's key) with a spending policy
await privy.wallets.addSigner(wallet.id, {
  signerKey: agentKey,
  policy: {
    maxTransactionAmount: '20', // $20 max per transaction
    allowedContracts: ['0x...'], // only interact with these
  },
});

// 4. Agent can now transact within policy bounds
```

### Payment Protocols: X42 and MPP

Privy shipped integrations for two micro-payment protocols:

**X42 (Pay-per-HTTP-request):**
```typescript
// Wrap any fetch call with payment
const response = await privy.x42.fetch('https://api.example.com/data', {
  payment: { amount: '0.001', token: 'USDC' }
});
// Payment is included as an HTTP header — the receiving service
// verifies payment and returns the data
```

**Machine Payment Protocol (MPP) by Stripe/Tempo:**
- Slightly more functionality than X42
- Can open a payment channel and prepay with a merchant
- Enables streaming payments (pay per API request over time)
- Both X42 and MPP are expanding to support fiat rails alongside crypto

### Account Types and Gas Sponsorship

| Feature | EOA (Externally Owned Account) | Smart Account |
|---------|-------------------------------|---------------|
| Key model | Single private key | Programmable logic |
| Policy enforcement | Server-side (Privy) | On-chain (contract) |
| Gas sponsorship | Via Privy (native) | Via Privy (native) |
| Recovery | Key export available | Social recovery possible |

Privy offers **native gas sponsorship** — cover transaction fees for Privy wallets so agents don't need ETH for gas. Useful for onboarding new agent wallets.

### Integrations With Agent Frameworks

| Framework | Integration | Status |
|-----------|-------------|--------|
| **OpenClaw** | Plug Privy wallet into OpenClaw agent | Available (requires Privy account) |
| **LangChain** | Open-source Privy wallet tool | Public, available on GitHub |
| **Custom agents** | REST API + TypeScript SDK | Full programmatic access |

The LangChain integration provides tools for agents to: create wallets, check balance, send transactions, and configure policies — all through the standard LangChain tool interface.

### Hackathon Focus: Agent Merchants

Privy is specifically interested in **agent merchants** — services where agents spend funds autonomously:

- Agent pays for on-chain data lookups
- Agent purchases research reports behind paywalls
- Agent pays for LLM inference via X42/MPP
- Agent tips creators or funds music NFT mints
- Agent pays for market data for trading strategies

The vision: autonomous micro-payment services where agents interact economically without human intervention per-transaction.

### Key Takeaways for ZAO OS

- **ZOE agent wallet via Privy.** ZOE (our VPS agent) could have a Privy server wallet with a $20/day spending limit for: tipping ZAO artists on Farcaster, minting music NFTs, paying for Neynar API calls via X42. Policy-controlled, user (Zaal) as owner, ZOE as signer.
- **Governance execution wallet.** When a ZAO governance proposal passes (1000+ Respect threshold), an agent could auto-execute on-chain actions using a Privy wallet with an allow-list restricted to ZOUNZ Governor contracts (`src/lib/zounz/contracts.ts`).
- **Key quorum for treasury actions.** High-value operations (treasury withdrawals) should require a key quorum: agent proposes + human co-signs. Maps to our existing governance model.
- **X42/MPP for agent-to-agent payments.** If ZAO agents (ZOE, ZOEY, WALLET) need to call external agent APIs, X42 wraps payment into the HTTP request — no separate payment flow needed.
- **Privy + OpenClaw integration.** ZOE runs on OpenClaw — the Privy/OpenClaw integration means we can add wallet capabilities without rebuilding the agent framework. Check `src/app/api/admin/` for where agent management routes live.
- **Smart accounts > EOA for governance.** For the ZOUNZ treasury agent, a Privy smart account allows on-chain policy enforcement — spending limits enforced by the contract itself, not just Privy's server.

---

## Farak Online Hackathon

Announced in Session 4. Runs **April 6–19, 2026** (overlaps with sessions 6–10).

**Three Tracks:**

| Track | Focus | Description |
|-------|-------|-------------|
| **Primary: Autonomous Agents** | Agents on the Farcaster feed | Coordination, content curation, commerce agents that operate natively |
| **Secondary: Mini Apps + Agents** | Agent-integrated mini apps | Games where agents and humans interact, agent-powered tools |
| **Secondary: Agent-Native Clients** | Reimagined Farcaster clients | Clients designed for an agent-native environment |

**Prizes:** Partners (Privy, Neynar/Farcaster) offer bounties. Winner gets tickets to **Farcon Rome (May 2026)** + stage showcase.

---

## Sessions 6–10 Schedule

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
8. **Context compaction for ZOE.** Implement front matter on ZOE's MD files and add a compaction step to stay under 45% context window utilization.
9. **Member profile pipeline.** Build Aggregate→Curate→Transform pipeline for ZAO member Farcaster profiles. Store as MD files in Supabase for agent context injection.
10. **RAG over research library.** Embed 240+ research docs in Supabase pgvector for semantic search instead of loading into context.
11. **Privy agent wallet for ZOE.** Set up a Privy server wallet with $20/day spending limit for tipping artists and minting NFTs. ZOE as signer, Zaal as owner.
12. **X42/MPP exploration.** Evaluate X42 pay-per-request for agent-to-agent API calls (ZOE calling external services).

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
| Context rot mitigation | ZOE SOUL.md front matter | Partial (needs compaction) |
| Sub-agent orchestration | OpenClaw multi-agent (`src/app/api/admin/`) | Partial |
| RAG over research docs | Supabase pgvector (Doc 42) | TODO |
| Agent wallet (Privy) | No wallet infra yet | TODO |
| X42/MPP micro-payments | No payment protocol yet | TODO |
| Agent spending policies | No policy engine yet | TODO |
| Key quorum for treasury | ZOUNZ Governor (`src/lib/zounz/contracts.ts`) | TODO |

### Related Research Docs

- [Doc 001](../../_archive/001-farcaster-protocol/) — Farcaster protocol fundamentals
- [Doc 002](../../farcaster/002-farcaster-hub-api/) — Hub API reference
- [Doc 008](../../_archive/008-ai-memory/) — AI memory patterns (implicit + explicit)
- [Doc 026](../../agents/026-hindsight-agent-memory/) — Hindsight agent memory (retain/recall/reflect)
- [Doc 042](../../_archive/042-supabase-advanced-patterns/) — Supabase pgvector for RAG
- [Doc 085](../../agents/085-farcaster-agent-technical-setup/) — Farcaster agent technical setup with Neynar
- [Doc 161](../../agents/161-agent-harness-engineering-langchain/) — Agent harness engineering, context rot, sub-agent orchestration
- [Doc 173](../../farcaster/173-farcaster-miniapps-integration/) — Miniapps integration guide
- [Doc 197](../../_archive/197-openclaw-agent-memory-knowledge-system/) — OpenClaw agent memory & knowledge system
- [Doc 234](../../agents/234-openclaw-comprehensive-guide/) — OpenClaw comprehensive guide (SOUL.md, memory, MCP)
- [Doc 246](../../agents/246-neynar-api-creative-agent-uses/) — Creative Neynar API uses for agents
- [Doc 253](../../agents/253-autoagent-self-optimizing-agents/) — Self-optimizing agents, meta-agent loop
