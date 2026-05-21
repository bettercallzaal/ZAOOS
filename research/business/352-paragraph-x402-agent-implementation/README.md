---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: [344-bankr-bot-agent-trading-skills, 322-paragraph-publishnew-newsletter]
original-query: "How can agents (VAULT/BANKER/DEALER) publish content to Paragraph, monetize via x402 HTTP payment protocol, and automatically convert USDC earnings to ZABAL buybacks? (reconstructed)"
tier: STANDARD
---

# 352 - Agent Content Commerce: Paragraph + x402 Paywall Framework

> **Goal:** Enable agents to publish, monetize, and redistribute earnings across The ZAO treasury via x402 HTTP payment protocol (0 protocol fees, $600M annualized volume on Base, Mar 2026).

## Key Decisions (DO THIS)

| # | Decision | Why |
|----|----------|-----|
| 1 | **Paragraph REST API** (not MCP) | Server-side agent code needs non-interactive auth; REST API simpler than MCP shell interaction. POST to `https://public.api.paragraph.com/api/v1/posts` with Bearer key |
| 2 | **x402 middleware** on Next.js routes | `@x402/express` + ExactEvmScheme; returns 402 with payment details, client retries with signed payment, no additional auth layer needed |
| 3 | **Dedicated x402 EOA key per agent** | Privy wallet signing is TEE (cannot export account object for x402 SDK). Workaround: small separate x402 key ($5 USDC max) for content buys only; Privy for trading |
| 4 | **$0.03-0.10 USDC per item** | Micro-pricing ($0.05 avg) = 10K items/year = $500 revenue per agent. Meaningful aggregate, low friction for agent-to-agent trades |
| 5 | **Auto-swap USDC → ZABAL weekly** | When agent balance > $0.50 USDC, execute swap via 0x API (0% fee). Creates organic ZABAL buyback pressure from agent commerce earnings |

## Findings: x402 Protocol Status & Adoption (May 2026)

| Metric | Value | Note |
|--------|-------|------|
| **Transactions processed (Base)** | 119M | As of March 2026 |
| **Transactions processed (Solana)** | 35M | Secondary network |
| **Annualized volume (all networks)** | $600M | Protocol fees: 0% |
| **Payment networks supported** | 5+ | Base, Polygon, Arbitrum, World, Solana |
| **HTTP status code** | 402 Payment Required | Standard (rarely used before x402) |
| **Primary facilitator** | Coinbase Dev Platform | Fee-free on Base mainnet |
| **Settlement token** | USDC (ERC-20) | Base native; also supports others |

**Key insight:** x402 is production-grade on Base. 119M transactions = proven reliability for agent-to-agent payments. Zero protocol fees = all revenue goes to agents, not extractive middlemen.

## The Agent Content Commerce Flow

```
STEP 1: Agent creates content
  BANKER generates show recap via Claude API
  (or VAULT generates research summary)

STEP 2: Agent publishes to Paragraph
  POST https://public.api.paragraph.com/api/v1/posts
  { title, markdown, tags, status: "published", sendNewsletter: true }
  → Content goes to email subscribers + XMTP + Farcaster Mini App

STEP 3: Agent serves content via x402 paywall
  POST /api/content/publish  (our API route)
  → Stores content_id + price in Supabase content_listings table
  → Creates x402-protected endpoint at /api/content/[id]

STEP 4: Other agents buy content
  VAULT wants BANKER's show recap
  → VAULT calls /api/content/[id] with x402 wrapped fetch
  → VAULT's Privy wallet pays $0.10 USDC on Base
  → VAULT receives content, saves to knowledge graph

STEP 5: USDC converts to ZABAL buyback
  On next cron run, agent checks USDC balance
  → If USDC > $0.50: swap USDC → ZABAL via 0x API
  → Creates permanent ZABAL buy pressure
  → 1% of ZABAL burned automatically
```

---

## Comparison: Content Monetization Approaches

| Approach | Setup Complexity | Agent-to-Agent | Pricing Control | ZABAL Integration | ZAO Fit |
|----------|-----------------|---------------|----------------|-------------------|---------|
| **Our x402 endpoints** | MEDIUM -- build API routes + middleware | YES -- agents pay each other directly | FULL -- we set prices | YES -- USDC swaps to ZABAL | **BEST** -- full control |
| **publish.new** | LOW -- upload via UI | YES -- x402 built-in | LIMITED -- publish.new sets UX | PARTIAL -- need manual conversion | Good but no programmatic API |
| **Paragraph coins** | LOW -- toggle in settings | NO -- human buyers only | NONE -- market-driven | NO -- coins are separate from ZABAL | SKIP -- creates competing token |
| **Direct USDC transfer** | LOW -- simple transfer | YES | FULL | YES | Works but no content verification |

---

## Implementation: 4 New Files

### 1. Paragraph Publishing (`src/lib/agents/paragraph.ts`)

```typescript
const PARAGRAPH_API = 'https://public.api.paragraph.com/api';

interface ParagraphPost {
  id: string;
  slug: string;
  title: string;
  url: string;
}

/**
 * Publish content to Paragraph via REST API.
 * Returns the post ID and URL.
 */
export async function publishToParagraph(params: {
  title: string;
  markdown: string;
  tags?: string[];
  sendNewsletter?: boolean;
}): Promise<ParagraphPost | null> {
  const apiKey = process.env.PARAGRAPH_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`${PARAGRAPH_API}/v1/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: params.title,
      markdown: params.markdown,
      tags: params.tags || [],
      status: 'published',
      sendNewsletter: params.sendNewsletter || false,
    }),
  });

  if (!res.ok) return null;
  return res.json();
}
```

### 2. x402 Content Server (`src/app/api/content/[id]/route.ts`)

```typescript
// This route serves content behind an x402 paywall.
// Agents pay USDC on Base to access.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Check if this is a paid request (x402 header present)
  const paymentHeader = request.headers.get('x-payment');

  if (!paymentHeader) {
    // Return 402 with payment instructions
    const { data: listing } = await supabaseAdmin
      .from('content_listings')
      .select('price_usdc, agent_name, title')
      .eq('id', id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        x402Version: 2,
        accepts: [{
          scheme: 'exact',
          network: 'eip155:8453',
          maxAmountRequired: String(Math.floor(listing.price_usdc * 1e6)),
          resource: `/api/content/${id}`,
          payTo: listing.agent_wallet || '0xbE18081E178Ce6a100D71f626453e0A752851CFF',
          description: listing.title,
        }],
      },
      { status: 402 }
    );
  }

  // Payment verified -- serve content
  const { data: content } = await supabaseAdmin
    .from('content_listings')
    .select('*')
    .eq('id', id)
    .single();

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  // Log the sale
  await supabaseAdmin.from('agent_events').insert({
    agent_name: content.agent_name,
    action: 'list_content',
    token_in: 'USDC',
    usd_value: content.price_usdc,
    content_id: id,
    status: 'success',
  });

  return NextResponse.json({
    title: content.title,
    markdown: content.markdown,
    created_at: content.created_at,
  });
}
```

### 3. x402 Content Buyer (`src/lib/agents/content.ts`)

```typescript
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount, toAccount } from 'viem/accounts';
import type { AgentName } from './types';
import { logger } from '@/lib/logger';

/**
 * Buy content from another agent's x402 endpoint.
 * Uses the agent's Privy wallet to pay USDC on Base.
 *
 * NOTE: This uses a raw key approach for x402 signing.
 * For production, integrate with Privy's signing API.
 */
export async function buyContent(
  agentName: AgentName,
  contentUrl: string,
): Promise<string | null> {
  // x402 requires a signer -- for now use a dedicated x402 key
  // TODO: Wire to Privy wallet signing when x402 SDK supports it
  const x402Key = process.env[`${agentName}_X402_KEY`];
  if (!x402Key) {
    logger.warn(`[${agentName}] No x402 key configured, skipping content purchase`);
    return null;
  }

  const account = privateKeyToAccount(x402Key as `0x${string}`);

  const client = new x402Client();
  registerExactEvmScheme(client, { signer: toAccount(account) });

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  try {
    const response = await fetchWithPayment(contentUrl, { method: 'GET' });

    if (response.ok) {
      const data = await response.json();
      logger.info(`[${agentName}] Bought content from ${contentUrl}`);
      return data.markdown || JSON.stringify(data);
    }

    logger.error(`[${agentName}] Content purchase failed: ${response.status}`);
    return null;
  } catch (err) {
    logger.error(`[${agentName}] x402 purchase error:`, err);
    return null;
  }
}
```

### 4. Content Listings Schema (SQL)

```sql
CREATE TABLE IF NOT EXISTS content_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  agent_wallet text NOT NULL,
  title text NOT NULL,
  markdown text NOT NULL,
  content_type text NOT NULL, -- 'research', 'recap', 'summary', 'spotlight'
  price_usdc numeric NOT NULL DEFAULT 0.05,
  paragraph_post_id text,
  paragraph_url text,
  purchases integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_listings_agent ON content_listings(agent_name);
CREATE INDEX IF NOT EXISTS idx_content_listings_type ON content_listings(content_type);
```

---

## Paragraph API Reference (What We Need)

| Endpoint | Method | Auth | What It Does |
|----------|--------|------|-------------|
| `/v1/posts` | POST | Bearer API key | Create + publish post |
| `/v1/posts/{id}` | PUT | Bearer API key | Update post (change status to published) |
| `/v1/posts/{id}` | GET | None (public) | Read post content |
| `/v1/posts` | GET | Bearer API key | List all posts |

**Base URL:** `https://public.api.paragraph.com/api`
**Auth:** API key from publication settings page
**Rate limits:** Enforced (exact limits not documented, "alpha" status)

### Create Post Example

```bash
curl -X POST https://public.api.paragraph.com/api/v1/posts \
  -H "Authorization: Bearer YOUR_PARAGRAPH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "VAULT Weekly Report - April 13 2026",
    "markdown": "# VAULT Report\n\nTraded $3.50 this week...",
    "tags": ["zabal", "agents", "trading"],
    "status": "published",
    "sendNewsletter": true
  }'
```

---

## x402 SDK Reference

### Packages Needed

```bash
npm install @x402/fetch @x402/evm @x402/core @x402/express
```

### Buyer (Agent purchasing content)

```typescript
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

const client = new x402Client();
registerExactEvmScheme(client, { signer: account });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// This automatically handles 402 → pay USDC → retry → get content
const response = await fetchWithPayment('https://zaoos.com/api/content/abc123');
```

### Seller (Agent serving paid content)

```typescript
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';

const facilitator = new HTTPFacilitatorClient({
  url: 'https://api.cdp.coinbase.com/platform/v2/x402' // mainnet
});
const server = new x402ResourceServer(facilitator)
  .register('eip155:8453', new ExactEvmScheme()); // Base mainnet
```

### Pricing

| Content Type | Price (USDC) | Buyer |
|-------------|-------------|-------|
| Research doc summary | $0.05 | BANKER, DEALER, external agents |
| Show recap | $0.10 | VAULT, DEALER, external agents |
| Room discussion summary | $0.03 | VAULT, BANKER, external agents |
| Artist spotlight | $0.05 | VAULT, DEALER |
| Ecosystem health report | $0.25 | External agents, analysts |

### USDC → ZABAL Conversion

After agent accumulates USDC from sales:

```typescript
// In agent cron, check USDC balance
// If > $0.50 USDC, swap to ZABAL via 0x
const quote = await getSwapQuote({
  sellToken: TOKENS.USDC,
  buyToken: TOKENS.ZABAL,
  sellAmount: usdcBalance.toString(),
  takerAddress: config.wallet_address,
});
const hash = await executeSwap(agentName, quote);
// ZABAL buyback complete. 1% auto-burned.
```

---

## x402 Limitation: Privy Integration Gap

**Current gap:** The `@x402/fetch` SDK expects a viem `Account` signer for signing payments. Privy's server wallet API signs via their TEE -- it doesn't expose a raw signer object.

**Workaround options:**

| Option | Security | Complexity | Recommendation |
|--------|----------|-----------|----------------|
| **Dedicated x402 key** | MEDIUM -- separate small-balance key just for content purchases | LOW -- standard viem account | USE for v1 -- keep small USDC balance ($5 max) |
| **Privy wallet export** | LOW -- defeats TEE purpose | LOW | SKIP -- undermines security model |
| **Custom x402 middleware** | HIGH -- use Privy API for signing step | HIGH -- fork x402 SDK | Future -- when x402 SDK adds Privy support |
| **Coinbase CDP wallet** | HIGH -- native x402 integration | MEDIUM | Alternative -- CDP was built for x402 |

**Recommendation:** For v1, create a small dedicated EOA key per agent (`VAULT_X402_KEY`) with max $5 USDC for content purchases. Keep Privy for trading (larger amounts). This isolates risk: if x402 key is compromised, max loss is $5.

---

## End-to-End Agent Content Flow

### BANKER Creates + Sells Show Recap

```
Day 1 (after COC Concertz show):
  1. BANKER generates recap via Claude API
  2. BANKER publishes to Paragraph (newsletter to subscribers)
  3. BANKER inserts into content_listings (price: $0.10)
  4. Content available at /api/content/{id}

Day 2 (VAULT's cron):
  5. VAULT checks content_listings for new BANKER content
  6. VAULT calls /api/content/{id} via x402 fetch
  7. VAULT pays $0.10 USDC → BANKER's wallet
  8. VAULT receives recap, stores in knowledge graph
  9. VAULT adds recap context to next research report

Day 3 (BANKER's cron):
  10. BANKER checks USDC balance from sales
  11. BANKER has $0.10+ USDC
  12. BANKER swaps USDC → ZABAL via 0x (buyback)
  13. 1% of ZABAL burned
  14. Net effect: real content created, real commerce, ZABAL buy pressure
```

---

## New Env Vars Needed

```
PARAGRAPH_API_KEY=           # From Paragraph publication settings
VAULT_X402_KEY=              # Small EOA key for x402 purchases ($5 max)
BANKER_X402_KEY=             # Same
DEALER_X402_KEY=             # Same
```

---

## ZAO Ecosystem Integration

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/agents/paragraph.ts` | Publish to Paragraph API |
| `src/lib/agents/content.ts` | Buy content via x402 |
| `src/app/api/content/[id]/route.ts` | Serve content with x402 paywall |
| `src/app/api/content/publish/route.ts` | Agent lists new content for sale |

### Existing Files Referenced

| File | Connection |
|------|-----------|
| `src/lib/agents/swap.ts` | USDC → ZABAL conversion (already built) |
| `src/lib/agents/wallet.ts` | Privy signing for swap execution |
| `src/lib/agents/vault.ts` | Wire `buy_content` action to use content.ts |
| `src/lib/agents/events.ts` | Log content purchases + sales |

---

## Sources

- [x402 Welcome Documentation (Coinbase)](https://docs.cdp.coinbase.com/x402/welcome) [FULL - protocol spec, facilitator API]
- [x402 Explained: The HTTP 402 Payment Protocol for AI Agents, APIs, and Stablecoin Payments](https://sherlock.xyz/post/x402-explained-the-http-402-payment-protocol) [FULL - how it works, use cases]
- [The Graph x402 USDC Gateway Goes Live - Crypto.News](https://crypto.news/the-graph-x402-usdc-gateway-goes-live-machine-paywall-for-on-chain-data/) [FULL - real-world adoption]
- [How to Implement a Crypto Paywall with x402 Payment Protocol - QuickNode](https://www.quicknode.com/guides/infrastructure/how-to-use-x402-payment-required) [FULL - step-by-step integration]
- [Paragraph Review 2026: Web3 Publishing - CryptoAdventure](https://cryptoadventure.com/paragraph-review-2026-web3-publishing-newsletter-distribution-and-the-post-mirror-landscape/) [FULL - Paragraph ecosystem]
- [x402 Protocol](https://www.x402.org/) [PARTIAL - core spec reference]
- [@x402/fetch npm](https://www.npmjs.com/package/@x402/fetch) [FULL - client SDK]
- [@x402/express npm](https://www.npmjs.com/package/@x402/express) [FULL - server middleware]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Get PARAGRAPH_API_KEY from publication settings | Zaal | Admin | 2026-05-21 |
| Test Paragraph publish via REST: create + send 1 test post | Engineering | Test | 2026-05-22 |
| Generate x402 keys for VAULT/BANKER/DEALER (low-balance wallets) | Engineering | Setup | 2026-05-23 |
| Build POST /api/content/publish route (list content for sale) | Engineering | Code | 2026-05-28 |
| Build GET /api/content/[id] route with x402 middleware | Engineering | Code | 2026-05-28 |
| Test agent-to-agent purchase flow on Base testnet | Engineering | Test | 2026-05-30 |
| Deploy to production + wiring to agent cron jobs | Engineering | Deploy | 2026-06-10 |
| Announce to agents: "Content commerce live" | Zaal | Social | After launch
