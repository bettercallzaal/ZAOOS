# 85 — Building and Deploying a Farcaster AI Agent with Neynar

---
topic: agents
type: research
status: research-complete
last-validated: 2026-09-25
original-query: Step-by-step guide to creating, configuring, and deploying an AI agent on Farcaster using Neynar API (reconstructed)
re-researched: "2026-09-25. Trigger: @zolbot (FID 3338501) was built from this guide on 2026-06-24 and the estate can no longer control it. This doc told three ways to create an agent account and zero ways to keep one."
tier: reference
---

> **Status:** Research complete
> **Date:** March 19, 2026

---

## Table of Contents

1. [Creating a Farcaster Account for the Bot (New FID)](#1-creating-a-farcaster-account-for-the-bot-new-fid)
2. [Creating a Managed Signer via Neynar](#2-creating-a-managed-signer-via-neynar)
3. [Rate Limits](#3-rate-limits)
4. [Neynar Pricing and Cost Estimation](#4-neynar-pricing-and-cost-estimation)
5. [Webhook Setup for Real-Time Cast Monitoring](#5-webhook-setup-for-real-time-cast-monitoring)
6. [Channel Monitoring Configuration](#6-channel-monitoring-configuration)
7. [Conversation Threading (Reply Chains)](#7-conversation-threading-reply-chains)
8. [Reacting to Casts (Like, Recast, Reply)](#8-reacting-to-casts-like-recast-reply)
9. [ElizaOS Farcaster Plugin Configuration](#9-elizaos-farcaster-plugin-configuration)
10. [Complete Bot Code Example](#10-complete-bot-code-example)
11. [Architecture Recommendations for ZAO](#11-architecture-recommendations-for-zao)

---

## 0. READ THIS FIRST: the custody key IS the account

> **This section was added 2026-09-25, after an account built from this guide
> became permanently unrecoverable. Everything below it was written 2026-05-21
> and is unchanged except where marked.**

### What happened

`@zolbot`, FID 3338501, was registered on 2026-06-24 following this document.
On 2026-09-24 the estate could not sign in as it, could not approve a partner's
request from it, and could not cast from it.

Measured directly against the IdRegistry on Optimism
(`0x00000000Fc6c5F01Fc30151999387Bb99A9f489b`):

    custodyOf(3338501)   0x5a3f9a4f20e602eeaa03019f863fca249f452d22
    recoveryOf(3338501)  0x5a3f9a4f20e602eeaa03019f863fca249f452d22
                         ^^ the SAME address

Red control: `custodyOf(3)` returns a different address, so the call resolves
per-FID rather than echoing its input.

**Farcaster has exactly one way to recover an account without the custody key**,
and `@zolbot` does not have it.

### The one mechanism, and why it did not apply

From the IdRegistry contract reference:

> `recover(address from, address to, uint256 deadline, bytes sig)` - Transfer an
> fid to a new address if caller is the recovery address.

**That call needs no involvement from the custody key at all.** The recovery
address transfers the FID to a new owner; the new owner signs an EIP-712 message
accepting it. It is a complete, protocol-level second door.

`changeRecoveryAddress(address recovery)` is callable **only by the current
custody address**. So the recovery address is *only settable while you still hold
the thing it insures you against losing.* Set it at creation or you cannot set it
at all.

`@zolbot`'s recovery address points at its own custody address. The second door
opens into the same locked room.

### What this doc did not say, and should have

Measured across this document (878 lines) and
`agents/925-zol-free-cast-posting-build-guide` (705 lines), 1,583 lines of
Farcaster agent documentation written by this estate:

    "back up"          0 occurrences
    "backup"           0
    "irrecoverable"    0
    "cannot recover"   0
    "recovery" (925)   0

Red control: `signer` appears 41 times in this doc and 34 in 925, so the grep
works. **The zeros are real.**

The word "custody" appears six times in this doc and never once alongside a
warning. The closest thing to guidance is one table cell: *"Secure Storage:
Neynar handles / Neynar handles / You handle."*

**So this was not carelessness by whoever ran it.** Someone followed an 878-line
internal playbook, written a month earlier, that documented three ways to create
an agent account and zero ways to keep one. That is a documentation failure and
this section is the fix.

### The rule

**Every agent account this estate creates sets a recovery address, at creation,
to a wallet the estate controls and which is NOT the custody address.**

- Custody and recovery must be two different keys. One key with two jobs is one
  key.
- Both go into the password manager before the account casts once.
- The FID, the custody address and the recovery address go into the estate's
  wallet record - **addresses only, never key material**, per the vault rule.
- A signer is not a backup. Signers can cast and react and nothing else; they
  cannot add signers, change recovery, or transfer the FID. Only custody can.

### What the forensics say, for the next person

The registration is public and worth reading, because it rules things out:

    2026-06-24 02:01  IN   0.001000 ETH  from 0x7234c36a71...  (Zaal's own wallet, fid 19640)
    2026-06-24 02:03  OUT  0.000170 ETH  -> IdGateway          (FID registered)
    2026-06-24 02:03  OUT       0 ETH    -> KeyRegistry        (signer added)
    2026-06-24 02:04  OUT  0.000850 ETH  -> 0x7234c36a71...    (change swept back)

**The custody address paid its own gas.** That means it was NOT created by
Warpcast's one-click flow and NOT by Neynar's one-click "Create Agent" button -
both would show a different sender. A private key existed locally on 2026-06-24
and signed these transactions. Nonce is 5; the address still holds 0.001 ETH.

So the key was generated on a machine that night, used, and never recorded. The
searchable space is small and time-bounded: a `.env` written around 02:00 that
night, shell history from that window, or a scratch generator script. **This
guide is why nobody knew to save it.**

## 1. Creating a Farcaster Account for the Bot (New FID)

There are two paths: manual (Warpcast app) or programmatic (Neynar API).

### Option A: Manual — Create via Warpcast

> **SUPERSEDED 2026-09-25 as the default recommendation.** Farcaster's own docs
> say the official client "uses a separate Ethereum account to sign transactions"
> - a custody key generated inside the app. **Whether that client ever exports
> the custody key to the operator is UNKNOWN**; neither docs.farcaster.xyz nor
> docs.neynar.com describes its key-export UX. Do not use this path for an agent
> account unless you have confirmed you can export both the custody key and set a
> separate recovery address. See section 0.

1. Download Warpcast on a phone
2. Create a new account with a dedicated email/phone for the bot
3. This gives you an FID automatically
4. Note the FID (visible in profile settings)
5. Fund the custody wallet with a small amount of ETH on Optimism for storage

### Option B: Programmatic — Neynar API

> **This is the path to use, and 2026-09-25 verification adds one thing it was
> missing.** In this flow the operator generates the mnemonic locally, derives
> `requested_user_custody_address` from it, and signs the EIP-712 acceptance
> before Neynar is called - Neynar's `x-wallet-id` only pays gas. **The operator
> holds the custody key by construction.** Add one step after registration:
> `changeRecoveryAddress()` to a second wallet you control. Section 0 explains
> why it cannot be added later.

**Prerequisites:**
- Neynar API key (from dev.neynar.com)
- App Wallet configured in the Neynar developer portal
- **$5+ ETH on Optimism** in the app wallet (covers initial FID pre-registration)

**Step 1: Claim an FID**

```bash
curl -X GET "https://api.neynar.com/v2/farcaster/user/fid" \
  -H "api_key: YOUR_NEYNAR_API_KEY" \
  -H "x-wallet-id: YOUR_WALLET_ID"
```

Returns a unique FID number. First call with a new `wallet_id` takes ~1 minute (pre-registers a batch of FIDs). Subsequent calls are < 1 second.

**Step 2: User Signs Message**

Generate a signature using the bot's private key containing:
- FID from Step 1
- Custody address (the bot's wallet)
- Deadline (expiration timestamp)

```typescript
import { ID_GATEWAY_ADDRESS, idGatewayABI } from "@farcaster/hub-nodejs";
import { walletClient, account } from "./wallet"; // viem wallet client

const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

const signature = await walletClient.signTypedData({
  account,
  domain: {
    name: "Farcaster IdGateway",
    version: "1",
    chainId: 10, // Optimism
    verifyingContract: ID_GATEWAY_ADDRESS,
  },
  types: {
    Register: [
      { name: "to", type: "address" },
      { name: "recovery", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  },
  primaryType: "Register",
  message: {
    to: account.address,
    recovery: account.address,
    nonce: 0n,
    deadline,
  },
});
```

**Step 3: Validate Username**

Username must match: `/^[a-z0-9][a-z0-9-]{0,15}$/`

**Step 4: Register the Account**

```bash
curl -X POST "https://api.neynar.com/v2/farcaster/user" \
  -H "api_key: YOUR_NEYNAR_API_KEY" \
  -H "x-wallet-id: YOUR_WALLET_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "deadline": 1234567890,
    "requested_user_custody_address": "0x...",
    "fid": 12345,
    "signature": "0x...",
    "fname": "zao-agent",
    "metadata": {
      "bio": "AI assistant for The ZAO community",
      "display_name": "ZAO Agent",
      "pfp_url": "https://example.com/avatar.png"
    }
  }'
```

**Important:** The same `wallet_id` used in the FID claim must be used here.

**Step 5: Optional Profile Setup**

Use the returned `signer_uuid` to update profile photo, display name, and bio.

### Alternative: FID Forge

FID Forge (https://fidforge.11211.me/) offers a streamlined API. Point your agent at `/llms.txt` and it can register a Farcaster account without an SDK. No details on cost, but it abstracts the multi-step process.

---

## 2. Creating a Managed Signer via Neynar

Neynar offers three signer types. For a bot/agent, **Neynar Sponsored Signers (Backend-Only)** is recommended.

### Signer Types Comparison

| Aspect | SIWN (Plug & Play) | Backend-Only Sponsored | Developer-Managed |
|--------|--------------------|-----------------------|-------------------|
| Setup Complexity | Minimal | Moderate | Maximum |
| User Gas Cost | None | Optional sponsorship | User/dev pays |
| UI Customization | Limited | Full | Full |
| Best For | User-facing apps | Bots & agents | Full custody needs |
| Secure Storage | Neynar handles | Neynar handles | You handle |

### For a Bot: Backend-Only Sponsored Signer

**Step 1: Create a Signer via API**

```bash
curl -X POST "https://api.neynar.com/v2/farcaster/signer" \
  -H "x-api-key: YOUR_NEYNAR_API_KEY" \
  -H "Content-Type: application/json"
```

Returns:
```json
{
  "signer_uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "public_key": "0x...",
  "status": "generated",
  "signer_approval_url": "https://...",
  "fid": null
}
```

**Step 2: Register the Signed Key**

```bash
curl -X POST "https://api.neynar.com/v2/farcaster/signer/signed_key" \
  -H "x-api-key: YOUR_NEYNAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "signer_uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "app_fid": 19640,
    "deadline": 1234567890,
    "signature": "0x..."
  }'
```

The `signature` is an EIP-712 signed key request generated with your app's private key (`APP_SIGNER_PRIVATE_KEY`).

**Step 3: Approve the Signer**

Navigate to the `signer_approval_url` returned — this opens Warpcast Connect where the bot account approves the signer. For a bot, you log into Warpcast with the bot account and approve.

**Step 4: Verify Signer Status**

```bash
curl -X GET "https://api.neynar.com/v2/farcaster/signer?signer_uuid=SIGNER_UUID" \
  -H "x-api-key: YOUR_NEYNAR_API_KEY"
```

Status should be `"approved"` with `permissions: ["WRITE_ALL"]`.

### Alternative: Neynar Dev Portal (Simplest)

1. Go to dev.neynar.com
2. Navigate to "App -> Agents and bots -> use existing account"
3. Click "Sign in with Neynar"
4. Connect the bot's wallet (must be logged into Warpcast)
5. Receive `signer_uuid` — done

### Dedicated Signer (Manual On-Chain)

For full control, requires ~$2 of OP ETH:

```bash
yarn get-approved-signer
```

Then go to Farcaster KeyGateway on Optimism Etherscan, call `addFor` with the terminal output values (`fidOwner`, `keyType`, `key`, `metadataType`, `metadata`, `deadline`, `sig`).

---

## 3. Rate Limits

### API Rate Limits by Plan

| Metric | Starter | Growth | Scale |
|--------|---------|--------|-------|
| Per-endpoint RPM | 300 | 600 | 1,200 |
| Per-endpoint RPS | 5 | 10 | 20 |
| Global RPM (all endpoints) | 500 | 1,000 | 2,000 |

### Endpoint-Specific Limits (RPM)

| Endpoint | Starter | Growth | Scale |
|----------|---------|--------|-------|
| POST v2/farcaster/frame/validate | 5,000 | 10,000 | 20,000 |
| GET v2/farcaster/signer | 3,000 | 6,000 | 12,000 |
| GET v2/farcaster/cast/search | 60 | 120 | 240 |
| All other endpoints | 300 | 600 | 1,200 |

### Cast Creation Limits

- Accounts creating **1,000+ casts in 24 hours** must have 20% of their past 24-hour cast volume available as storage.
- For a bot doing ~100 casts/day, this limit will not apply.

### Practical Assessment for ~100 Casts/Day

- 100 casts/day = ~4.2 casts/hour = negligible rate limit pressure
- Even the Starter plan (300 RPM) can handle this easily
- The bot will also need reads (fetching conversations, mentions) — budget ~500-1000 API calls/day total
- Starter plan is sufficient for this volume

---

## 4. Neynar Pricing and Cost Estimation

### Credit-Based Pricing System

Neynar uses a **credits (compute units)** model:

| Plan | Monthly Cost | Credits Included |
|------|-------------|-----------------|
| Free | $0 | 200K |
| Starter | $9/month | 1M |
| Growth | $49/month | 10M |
| Scale | $249/month | 60M |
| Enterprise | Custom | Custom |

### Credit Costs Per Operation

| Operation | Credits |
|-----------|---------|
| Post a cast (publishCast) | 150 |
| Like / Recast (publishReaction) | ~10-50 |
| Fetch cast by hash | 2 |
| Signer lookup | 0-2 |
| Cast search | 2-50 |
| Conversation lookup | 2-50 |
| Webhook event delivery | 5-15 per event |
| **Monthly active signer** | **20,000** |

### Cost Estimate for ZAO Agent (~100 Casts/Day)

```
Monthly signer cost:         20,000 credits
Daily casts (100 x 150):     15,000 credits/day x 30 = 450,000
Daily reads (~500 x 5):       2,500 credits/day x 30 =  75,000
Webhook events (~200/day x 10): 2,000/day x 30 =       60,000
                                              Total: ~605,000 credits/month
```

**Verdict: The $9/month Starter plan (1M credits) is sufficient for ~100 casts/day.** If the agent grows more active or handles heavy read traffic, the $49/month Growth plan provides comfortable headroom.

---

## 5. Webhook Setup for Real-Time Cast Monitoring

### Dashboard Configuration

1. Go to dev.neynar.com/webhook
2. Set **Target URL** to your server's POST endpoint
3. Select event type: `cast.created`
4. Configure filters:
   - **`mentioned_fids`**: Add your bot's FID to receive mentions
   - **`parent_author_fids`**: Add your bot's FID to receive replies to your bot's casts
   - Multiple FIDs can be comma-separated
   - Filters are logical OR (any match triggers the event)

### Webhook Payload Structure

```json
{
  "created_at": 1234567890,
  "type": "cast.created",
  "data": {
    "hash": "0xabc123...",
    "thread_hash": "0xdef456...",
    "parent_hash": "0x789ghi...",
    "author": {
      "fid": 12345,
      "username": "someuser",
      "display_name": "Some User"
    },
    "text": "@zao-agent what music should I listen to?",
    "mentioned_profiles": [
      { "fid": 99999, "username": "zao-agent" }
    ],
    "timestamp": "2026-03-19T12:00:00Z",
    "embeds": [],
    "reactions": { "likes_count": 0, "recasts_count": 0 },
    "replies": { "count": 0 }
  }
}
```

### Programmatic Webhook Management

You can also create/update/delete webhooks via the API, adding filters dynamically.

### Backend Handler (Express/Next.js)

```typescript
// /api/webhook/farcaster/route.ts
import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY! });
const client = new NeynarAPIClient(config);

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.type === "cast.created") {
    const cast = body.data;
    const mentionsBot = cast.mentioned_profiles?.some(
      (p: any) => p.fid === Number(process.env.BOT_FID)
    );
    const isReplyToBot = cast.parent_hash && /* check parent author */;

    if (mentionsBot || isReplyToBot) {
      // Generate AI response
      const aiResponse = await generateResponse(cast.text, cast.hash);

      // Reply to the cast
      await client.publishCast({
        signerUuid: process.env.SIGNER_UUID!,
        text: aiResponse,
        parent: cast.hash,  // This makes it a reply
      });
    }
  }

  return NextResponse.json({ success: true });
}
```

### Important Notes

- ngrok has reported issues with webhook deliveries; use your own domain or Cloudflare Tunnels instead
- Webhook verification: Neynar signs webhook payloads; verify signatures to prevent spoofing (see docs.neynar.com/docs/how-to-verify-the-incoming-webhooks-using-signatures)

---

## 6. Channel Monitoring Configuration

### Channel Basics

Channels are identified by a `channel_id` string (e.g., `"music"`, `"zao"`, `"ai"`). A cast belongs to a channel by including the `channel_id` when published.

### Monitoring Specific Channels via Webhooks

Webhook filters support channel filtering. When configuring your webhook at dev.neynar.com/webhook, you can filter by channel to only receive casts from specific channels.

### Posting to a Channel

```typescript
await client.publishCast({
  signerUuid: process.env.SIGNER_UUID!,
  text: "gm ZAO fam",
  channelId: "zao",  // Posts to the /zao channel
});
```

### Fetching Channel Feed

```typescript
const feed = await client.fetchFeed({
  feedType: "filter",
  filterType: "channel_id",
  channelId: "music",
  limit: 25,
});
```

### Channel Directory

Neynar maintains a public channel directory at github.com/neynarxyz/farcaster-channels mapping channel IDs across clients.

---

## 7. Conversation Threading (Reply Chains)

### How Threading Works on Farcaster

Every cast has:
- `hash` — unique identifier for this cast
- `parent_hash` — hash of the cast being replied to (null for root casts)
- `thread_hash` — hash of the root cast in the conversation

### Publishing a Reply

```typescript
const reply = await client.publishCast({
  signerUuid: process.env.SIGNER_UUID!,
  text: "Here's what I think...",
  parent: "0xPARENT_CAST_HASH",  // Makes this a reply
});
```

### Fetching Full Conversation Thread

**Conversation Lookup API:**

```
GET https://api.neynar.com/v2/farcaster/cast/conversation/
  ?identifier=0xCAST_HASH
  &type=hash
  &reply_depth=5
  &include_chronological_parent_casts=true
  &sort_type=chron
  &limit=50
```

Parameters:
- `reply_depth` (0-5): How many levels of nested replies to return. Default 2, max 5.
- `include_chronological_parent_casts`: Returns all ancestors up to root in chronological order.
- `sort_type`: `chron` (oldest first), `desc_chron` (newest first), or `algorithmic`.

**SDK Method:**

```typescript
const conversation = await client.lookupCastConversation({
  identifier: "0xCAST_HASH",
  type: "hash",
  replyDepth: 3,
  includeChronologicalParentCasts: true,
});
// conversation.cast.direct_replies contains nested replies
// conversation.chronological_parent_casts contains ancestors
```

### Fetching Replies to a Specific Cast

```
GET https://snapchain-api.neynar.com/v1/castsByParent
  ?fid=12345
  &hash=0xCAST_HASH
  &pageSize=25
  &reverse=false
```

### Building Context for AI Responses

To give the AI agent conversational context:

1. When a mention/reply webhook fires, extract `thread_hash` or `parent_hash`
2. Call the Conversation Lookup API with `reply_depth=5` and `include_chronological_parent_casts=true`
3. Reconstruct the conversation history from the response
4. Pass the conversation as context to the LLM

```typescript
async function getConversationContext(castHash: string): Promise<string> {
  const convo = await client.lookupCastConversation({
    identifier: castHash,
    type: "hash",
    replyDepth: 5,
    includeChronologicalParentCasts: true,
  });

  // Build chronological message history
  const messages: string[] = [];

  // Add parent chain (ancestors)
  if (convo.chronological_parent_casts) {
    for (const cast of convo.chronological_parent_casts) {
      messages.push(`${cast.author.username}: ${cast.text}`);
    }
  }

  // Add the current cast
  messages.push(`${convo.cast.author.username}: ${convo.cast.text}`);

  return messages.join("\n");
}
```

---

## 8. Reacting to Casts (Like, Recast, Reply)

### Initialize Client

```typescript
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY!,
});
const client = new NeynarAPIClient(config);
const signerUuid = process.env.SIGNER_UUID!;
```

### Like a Cast

```typescript
await client.publishReaction({
  signerUuid,
  reactionType: "like",
  target: "0xCAST_HASH",
});
```

### Recast

```typescript
await client.publishReaction({
  signerUuid,
  reactionType: "recast",
  target: "0xCAST_HASH",
});
```

### Reply to a Cast

```typescript
await client.publishCast({
  signerUuid,
  text: "Great question! Here's my take...",
  parent: "0xPARENT_CAST_HASH",
});
```

### Reply with Embeds (Links, Images)

```typescript
await client.publishCast({
  signerUuid,
  text: "Check out this track",
  parent: "0xPARENT_CAST_HASH",
  embeds: [{ url: "https://open.spotify.com/track/..." }],
});
```

### Fetch Reactions on a Cast

```typescript
import { ReactionsType } from "@neynar/nodejs-sdk";

const reactions = await client.fetchCastReactions({
  hash: "0xCAST_HASH",
  types: [ReactionsType.All],
});
```

---

## 9. ElizaOS Farcaster Plugin Configuration

The ElizaOS plugin (`@elizaos/plugin-farcaster`) provides a turnkey agent framework for Farcaster. Package was renamed from `client-farcaster` to `plugin-farcaster`.

### Installation

```bash
npm install @elizaos/plugin-farcaster
```

### Required Environment Variables

```env
FARCASTER_NEYNAR_API_KEY=your-neynar-api-key
FARCASTER_SIGNER_UUID=your-signer-uuid
FARCASTER_FID=12345
```

### Optional Environment Variables

```env
# Feature toggles
ENABLE_CAST=true
ENABLE_ACTION_PROCESSING=false
FARCASTER_DRY_RUN=false

# Timing (in minutes)
CAST_INTERVAL_MIN=90       # Min minutes between autonomous casts
CAST_INTERVAL_MAX=180      # Max minutes between autonomous casts
FARCASTER_POLL_INTERVAL=2  # Poll for mentions every N minutes
ACTION_INTERVAL=5          # Process actions every N minutes

# Behavioral options
CAST_IMMEDIATELY=false     # Cast on startup
ACTION_TIMELINE_TYPE=ForYou
MAX_ACTIONS_PROCESSING=1   # Process 1 interaction per cycle
MAX_CAST_LENGTH=320        # Farcaster's character limit
```

### Character Configuration

```typescript
import { Character } from "@elizaos/core";
import { farcasterPlugin } from "@elizaos/plugin-farcaster";

export const character: Character = {
  name: "ZAO Agent",
  plugins: [farcasterPlugin],
  settings: {
    farcaster: {
      channels: ["/zao", "/music"],       // Channels to monitor/post in
      replyProbability: 0.7,              // 70% chance to reply to mentions
      castStyle: "conversational",        // Tone
      maxCastLength: 320,
    },
  },
  // Character persona, instructions, etc.
};
```

### Architecture (4 Modules)

1. **FarcasterClient** — Base Neynar API interface
2. **FarcasterPostManager** — Autonomous cast scheduling and publishing
3. **FarcasterInteractionManager** — Mention/reply detection and response
4. **Memory Management** — Conversation history persistence via ElizaOS memory system

### How It Works

- The plugin polls Farcaster every `FARCASTER_POLL_INTERVAL` minutes for new mentions
- When a mention is detected, it evaluates whether to respond (based on `replyProbability`)
- Uses ElizaOS's built-in memory system to maintain conversation context
- Publishes autonomous casts on a randomized interval between `CAST_INTERVAL_MIN` and `CAST_INTERVAL_MAX`
- Supports dry-run mode (`FARCASTER_DRY_RUN=true`) for testing without live posting

### Known Issues

- Issue #5943 on the ElizaOS repo tracks updating to the latest Neynar SDK version
- The plugin uses polling, not webhooks — there may be a delay of up to `FARCASTER_POLL_INTERVAL` minutes

---

## 10. Complete Bot Code Example

### Minimal Webhook-Based Farcaster Bot

```typescript
// bot.ts — Minimal Farcaster AI Agent
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { serve } from "bun"; // or Express/Next.js

// --- Config ---
const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY! });
const client = new NeynarAPIClient(config);
const SIGNER_UUID = process.env.SIGNER_UUID!;
const BOT_FID = Number(process.env.BOT_FID!);

// --- AI Response Generator (plug in your LLM) ---
async function generateAIResponse(
  userMessage: string,
  conversationContext: string
): Promise<string> {
  // Call OpenAI, Anthropic, or local LLM here
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 280,
      system: `You are the ZAO Agent, an AI assistant for The ZAO music community on Farcaster. Keep replies under 300 characters. Be helpful, warm, and knowledgeable about music and web3.`,
      messages: [
        {
          role: "user",
          content: `Conversation context:\n${conversationContext}\n\nLatest message: ${userMessage}`,
        },
      ],
    }),
  });
  const data = await response.json();
  return data.content[0].text.slice(0, 320);
}

// --- Conversation Context Builder ---
async function getConversationContext(castHash: string): Promise<string> {
  try {
    const convo = await client.lookupCastConversation({
      identifier: castHash,
      type: "hash",
      replyDepth: 3,
      includeChronologicalParentCasts: true,
    });

    const messages: string[] = [];
    if (convo.conversation?.chronological_parent_casts) {
      for (const cast of convo.conversation.chronological_parent_casts) {
        messages.push(`${cast.author.username}: ${cast.text}`);
      }
    }
    return messages.join("\n") || "(no prior context)";
  } catch {
    return "(unable to fetch context)";
  }
}

// --- Webhook Handler ---
const server = serve({
  port: 3000,
  async fetch(req) {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = await req.json();

      if (body.type === "cast.created") {
        const cast = body.data;

        // Check if bot is mentioned or replied to
        const mentionsBot = cast.mentioned_profiles?.some(
          (p: any) => p.fid === BOT_FID
        );

        if (mentionsBot) {
          // Get conversation context
          const context = await getConversationContext(cast.hash);

          // Generate AI response
          const responseText = await generateAIResponse(cast.text, context);

          // Reply
          await client.publishCast({
            signerUuid: SIGNER_UUID,
            text: responseText,
            parent: cast.hash,
          });

          console.log(`Replied to ${cast.author.username}: ${responseText}`);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response("Internal error", { status: 500 });
    }
  },
});

console.log(`Bot listening on port ${server.port}`);
```

### Environment Variables Needed

```env
NEYNAR_API_KEY=your-neynar-api-key
SIGNER_UUID=your-signer-uuid
BOT_FID=99999
ANTHROPIC_API_KEY=your-anthropic-key
```

### Running

```bash
bun run bot.ts
# or with PM2 for production:
pm2 start bot.ts --interpreter bun --name zao-agent
pm2 status
pm2 logs zao-agent
```

---

## 11. Architecture Recommendations for ZAO

### Recommended Approach: Hybrid (Custom Bot + ElizaOS Optional)

**Phase 1: Custom Webhook Bot**
- Build a lightweight webhook handler as a Next.js API route within ZAO OS
- Use Neynar managed signer (Backend-Only type)
- Monitor the `/zao` channel and mentions of the bot's FID
- Use the Conversation Lookup API for threading context
- Connect to Claude API for responses
- Start on the $9/month Starter plan

**Phase 2: ElizaOS Integration (Optional)**
- If you want autonomous posting (not just responding), ElizaOS adds:
  - Scheduled autonomous casts
  - Built-in memory/conversation management
  - Character-driven personality
  - Action processing (likes, recasts)
- But it adds framework complexity and uses polling instead of webhooks

### Bot Account Setup Checklist

1. [ ] Create Farcaster account for bot (manual via Warpcast is easiest)
2. [ ] Note the bot's FID
3. [ ] Create managed signer at dev.neynar.com (simplest path)
4. [ ] Store `SIGNER_UUID` and `BOT_FID` in environment
5. [ ] Set up Neynar webhook targeting your API endpoint
6. [ ] Configure webhook filters: `mentioned_fids` = bot FID, `parent_author_fids` = bot FID
7. [ ] Implement webhook handler with conversation context + LLM
8. [ ] Deploy and test with `FARCASTER_DRY_RUN` mode
9. [ ] Go live

### Cost Summary

| Item | Monthly Cost |
|------|-------------|
| Neynar Starter plan | $9 |
| Claude API (~100 responses/day, ~500 tokens each) | ~$5-15 |
| Hosting (Vercel/Render) | $0-20 |
| **Total** | **~$14-44/month** |

---

## What 2026-09-25 verification changed

Re-read against official sources today. Figures below are quoted with their source.

| Claim | Status |
|---|---|
| SIWF authenticates against the **custody address** | CONFIRMED. FIP-11, Finalized: *"A user must produce an EIP-4361 Sign in With Ethereum message signed by the custody address."* So a bot can sign into a miniapp only if you hold its custody key. |
| SIWF grants write access | **FALSE.** FIP-11's author, asked directly: *"To cast on a user's behalf you need a signer, which already exists. This is just to verify ownership."* |
| Signers can recover an account | **FALSE.** Signers authorize casts, reactions and verifications. They cannot add signers, change recovery, or transfer the FID. |
| **Sign In With Neynar (SIWN)** | **DEPRECATED.** Neynar's docs: new SIWN connections stopped being issued after 2026-08-14. Today is after that. Use Neynar-managed signers. |
| Neynar plan tiers | **CHANGED since this doc.** Per Neynar's rate-limit page (June 2026 update, read 2026-09-25): Starter $9/mo and Growth $49/mo **no longer offered to new customers**. New: Free (10M credits/mo, 600 RPM) or Scale $249/mo (60M credits/mo, 1200 RPM). |
| FID registration cost | Neynar's own table: ~$0.20 registration, ~$0.05 add signer, **~$0.50 all-in**, budget $1. The protocol price is a live `IdGateway.price()` read, set in USD by admins and converted via Chainlink - **no static figure is published**, so treat any fixed number as approximate. |
| Storage unit | *"A storage unit lets you store 5000 casts, 2500 reactions and 2500 links"* for one year. |

**Not established, and it matters for the next account:** whether Neynar's
one-click "Create Agent" button in the dev portal ever surfaces the custody key
to the developer, or generates and retains it server-side. No page on
docs.farcaster.xyz or docs.neynar.com states it either way. Their app-wallets are
documented as *"managed by Neynar for security"* with no withdrawal path, which
is suggestive and is not proof. **Resolve this before using that button.**

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Timebox one hour to search for `@zolbot`'s custody key - shell history and any `.env` around 2026-06-24 02:00, plus the password manager. Shipped when the key is found OR the search is recorded as exhausted in this doc | @Zaal | Measurement | 2026-09-26 |
| Reply to cashlessman.eth that `@zolbot` cannot approve from that account because custody and recovery are the same wallet and it is not held. Shipped when the message is sent | @Zaal | Outbound | 2026-09-25 |
| Create the replacement agent account via Option B, then call `changeRecoveryAddress()` to a second wallet. Shipped when `recoveryOf(newFid) != custodyOf(newFid)` reads true on-chain | @Zaal | Build | 2026-10-10 |
| Record FID, custody address and recovery address (addresses only, never key material) in the estate wallet record | @Zaal | Record | 2026-10-10 |

## Sources

- [Create Farcaster Bots via Script Using Neynar SDK](https://docs.neynar.com/docs/how-to-create-a-farcaster-bot)
- [Building AI Agents on Farcaster - Neynar Blog](https://neynar.com/blog/building-ai-agents-on-farcaster)
- [How to Create a New Farcaster Account with Neynar](https://docs.neynar.com/docs/how-to-create-a-new-farcaster-account-with-neynar)
- [Choose the Right Farcaster Signer](https://docs.neynar.com/docs/which-signer-should-you-use-and-why)
- [Neynar Rate Limits](https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis)
- [Neynar Compute Units Pricing](https://docs.neynar.com/reference/compute-units)
- [Listen for Bot Mentions Using Webhooks](https://docs.neynar.com/docs/listen-for-bot-mentions)
- [Create a Bot to Reply with Frames](https://docs.neynar.com/docs/create-a-farcaster-bot-to-reply-with-frames-using-neynar)
- [Farcaster Bot with Dedicated Signers](https://docs.neynar.com/docs/farcaster-bot-with-dedicated-signers)
- [Like & Recast with Neynar SDK](https://docs.neynar.com/docs/liking-and-recasting-with-neynar-sdk)
- [Conversation Lookup API](https://docs.neynar.com/reference/lookup-cast-conversation)
- [Fetch Casts by Parent](https://docs.neynar.com/reference/fetch-casts-by-parent)
- [Post a Cast API](https://neynar.readme.io/reference/publish-cast)
- [Make Agents Prompt Transactions](https://docs.neynar.com/docs/make-agents-prompt-transactions)
- [ElizaOS Farcaster Plugin Developer Guide](https://docs.elizaos.ai/plugin-registry/platform/farcaster/developer-guide)
- [ElizaOS plugin-farcaster on npm](https://www.npmjs.com/package/@elizaos/plugin-farcaster)
- [ElizaOS client-farcaster GitHub](https://github.com/elizaos-plugins/client-farcaster)
- [Neynar Node.js SDK GitHub](https://github.com/neynarxyz/nodejs-sdk)
- [Neynar Farcaster Examples GitHub](https://github.com/neynarxyz/farcaster-examples)
- [Farcaster Bot Template (davidfurlong)](https://github.com/davidfurlong/farcaster-bot-template)
- [Building a Farcaster AI Agent (Part 2)](https://someofthethings.substack.com/p/building-a-farcaster-ai-agent-part)
- [Farcaster Channels Directory](https://github.com/neynarxyz/farcaster-channels)
- [Farcaster Docs: Accounts](https://docs.farcaster.xyz/learn/what-is-farcaster/accounts)
- [Farcaster Docs: Channels](https://docs.farcaster.xyz/learn/what-is-farcaster/channels)
- [Farcaster Docs: Create Account](https://docs.farcaster.xyz/developers/guides/accounts/create-account)
- [Verify Incoming Webhooks](https://docs.neynar.com/docs/how-to-verify-the-incoming-webhooks-using-signatures)
- [FID Forge — Account Registration API](https://fidforge.11211.me/)
- [Neynar SDK Medium Tutorial](https://medium.com/coinmonks/how-to-use-the-neynar-sdk-to-build-on-farcaster-webhooks-casts-user-info-a71ec4cbd00d)
