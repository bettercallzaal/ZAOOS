# ZABAL Token Snap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Farcaster Snap that shows $ZABAL token stats, burn/distribution tracking, and native swap/send actions in the Farcaster feed.

**Architecture:** Standalone Hono server using `@farcaster/snap-hono` for snap protocol handling. Viem reads on-chain data from Base RPC (token supply, burns, transfers). Two pages: dashboard (stats + wallet actions) and activity (charts + supply breakdown). Deployed to Vercel at `snap.zaoos.com`.

**Tech Stack:** TypeScript, Hono >=4.0.0, @farcaster/snap v1.15.1, @farcaster/snap-hono v1.4.8, Viem v2.21.0, Vercel

**Spec:** `docs/superpowers/specs/2026-04-08-zabal-snap-design.md`

**Snap Docs:** https://docs.farcaster.xyz/snap/llms.txt (2600-line full spec)

---

## File Structure

```
zabal-snap/
  package.json          # Dependencies + scripts (dev, build, typecheck)
  tsconfig.json         # TypeScript config targeting ES2022
  vercel.json           # Vercel config routing to Hono
  api/
    index.ts            # Vercel serverless entry: exports Hono app as default
  src/
    app.ts              # Hono app creation + registerSnapHandler
    server.ts           # Local dev server (@hono/node-server, port 3003)
    token.ts            # Viem client + on-chain data fetching functions
    pages/
      dashboard.ts      # Page 1: SnapResponse builder (stats, burns, buttons)
      activity.ts       # Page 2: SnapResponse builder (charts, supply)
    utils.ts            # formatNumber, shortenAddress, formatUsd helpers
```

---

### Task 1: Scaffold Project

**Files:**
- Create: `zabal-snap/package.json`
- Create: `zabal-snap/tsconfig.json`
- Create: `zabal-snap/vercel.json`
- Create: `zabal-snap/.gitignore`

- [ ] **Step 1: Create project directory**

Run: `mkdir -p "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap"`

- [ ] **Step 2: Create package.json**

Create `zabal-snap/package.json`:

```json
{
  "name": "zabal-snap",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "SKIP_JFS_VERIFICATION=true tsx watch src/server.ts",
    "build": "tsc --noEmit",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@farcaster/snap": "^1.15.1",
    "@farcaster/snap-hono": "^1.4.8",
    "@hono/node-server": "^1.0.0",
    "@noble/curves": "^2.0.0",
    "hono": "^4.0.0",
    "viem": "^2.21.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

Create `zabal-snap/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts", "api/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create vercel.json**

Create `zabal-snap/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/api" }
  ]
}
```

- [ ] **Step 5: Create .gitignore**

Create `zabal-snap/.gitignore`:

```
node_modules/
dist/
.vercel/
```

- [ ] **Step 6: Install dependencies**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && pnpm install
```

Expected: Lock file created, all deps installed.

- [ ] **Step 7: Commit scaffold**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && git add zabal-snap/
git commit -m "feat(zabal-snap): scaffold project with deps"
```

---

### Task 2: Utility Functions

**Files:**
- Create: `zabal-snap/src/utils.ts`

- [ ] **Step 1: Create utils.ts**

Create `zabal-snap/src/utils.ts`:

```typescript
/**
 * Format a bigint token amount to human-readable string.
 * e.g. 1_200_000_000n with decimals=18 -> "1.2B"
 */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const num = Number(amount) / 10 ** decimals;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(2);
}

/**
 * Format USD price. Handles very small numbers.
 * e.g. 0.000000141 -> "$0.000000141"
 */
export function formatUsd(price: number): string {
  if (price < 0.01) {
    // Find significant digits
    const str = price.toFixed(20);
    const match = str.match(/^0\.(0*[1-9]\d{0,2})/);
    if (match) return `$0.${match[1]}`;
    return `$${price.toExponential(2)}`;
  }
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `$${(price / 1_000).toFixed(1)}K`;
  return `$${price.toFixed(2)}`;
}

/**
 * Shorten an Ethereum address: 0x1234...abcd
 */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && git add zabal-snap/src/utils.ts
git commit -m "feat(zabal-snap): add formatting utilities"
```

---

### Task 3: On-Chain Data Fetching

**Files:**
- Create: `zabal-snap/src/token.ts`

- [ ] **Step 1: Create token.ts**

Create `zabal-snap/src/token.ts`:

```typescript
import { createPublicClient, http, parseAbi, type Address } from 'viem';
import { base } from 'viem/chains';

// ── Constants ──────────────────────────────────────────────

export const ZABAL = {
  address: '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07' as Address,
  chainId: 8453,
  decimals: 18,
  symbol: 'ZABAL',
  caip19: 'eip155:8453/erc20:0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
  zaalAddress: '0x7234c36A71ec237c2Ae7698e8916e0735001E9Af' as Address,
  burnAddress: '0x000000000000000000000000000000000000dEaD' as Address,
} as const;

const erc20Abi = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

const client = createPublicClient({
  chain: base,
  transport: http(),
});

// ── Types ──────────────────────────────────────────────────

export interface TokenDashboardData {
  totalSupply: bigint;
  burned: bigint;
  zaalBalance: bigint;
  distributed: bigint;
  holders: number;
  priceUsd: number;
  marketCapUsd: number;
}

export interface TopRecipient {
  address: Address;
  amount: bigint;
}

// ── Data Fetching ──────────────────────────────────────────

export async function getDashboardData(): Promise<TokenDashboardData> {
  const [totalSupply, burned, zaalBalance] = await client.multicall({
    contracts: [
      { address: ZABAL.address, abi: erc20Abi, functionName: 'totalSupply' },
      { address: ZABAL.address, abi: erc20Abi, functionName: 'balanceOf', args: [ZABAL.burnAddress] },
      { address: ZABAL.address, abi: erc20Abi, functionName: 'balanceOf', args: [ZABAL.zaalAddress] },
    ],
  });

  const supply = totalSupply.result ?? 0n;
  const burnedAmt = burned.result ?? 0n;
  const zaalBal = zaalBalance.result ?? 0n;

  // Distributed = everything that left ZAAL's wallet (supply - burned - zaalBalance - LP - vault)
  // For POC, approximate: distributed = supply - burned - zaalBalance
  const distributed = supply - burnedAmt - zaalBal;

  // Price: hardcoded for POC, can swap for DEX API later
  const priceUsd = 0.000000141;
  const circulatingFloat = Number(supply - burnedAmt) / 1e18;
  const marketCapUsd = circulatingFloat * priceUsd;

  return {
    totalSupply: supply,
    burned: burnedAmt,
    zaalBalance: zaalBal,
    distributed,
    holders: 340, // hardcoded for POC, swap for BaseScan API later
    priceUsd,
    marketCapUsd,
  };
}

export async function getTopRecipients(limit: number = 5): Promise<TopRecipient[]> {
  // Fetch Transfer events from ZAAL address
  const logs = await client.getLogs({
    address: ZABAL.address,
    event: {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { type: 'address', name: 'from', indexed: true },
        { type: 'address', name: 'to', indexed: true },
        { type: 'uint256', name: 'value' },
      ],
    },
    args: { from: ZABAL.zaalAddress },
    fromBlock: 0n,
    toBlock: 'latest',
  });

  // Aggregate by recipient
  const totals = new Map<string, bigint>();
  for (const log of logs) {
    const to = log.args.to as string;
    const value = log.args.value as bigint;
    if (to && value) {
      totals.set(to, (totals.get(to) ?? 0n) + value);
    }
  }

  // Sort descending by amount, take top N
  return [...totals.entries()]
    .filter(([addr]) => addr.toLowerCase() !== ZABAL.burnAddress.toLowerCase())
    .sort((a, b) => (b[1] > a[1] ? 1 : -1))
    .slice(0, limit)
    .map(([address, amount]) => ({ address: address as Address, amount }));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && git add zabal-snap/src/token.ts
git commit -m "feat(zabal-snap): add on-chain data fetching via Viem"
```

---

### Task 4: Dashboard Page (Page 1)

**Files:**
- Create: `zabal-snap/src/pages/dashboard.ts`

- [ ] **Step 1: Create dashboard.ts**

Create `zabal-snap/src/pages/dashboard.ts`:

```typescript
import type { TokenDashboardData } from '../token.js';
import { ZABAL } from '../token.js';
import { formatTokenAmount, formatUsd } from '../utils.js';

export function buildDashboardPage(data: TokenDashboardData, baseUrl: string) {
  const price = formatUsd(data.priceUsd);
  const mcap = formatUsd(data.marketCapUsd);
  const burned = formatTokenAmount(data.burned);
  const distributed = formatTokenAmount(data.distributed);

  return {
    version: '1.0' as const,
    theme: { accent: 'amber' as const },
    ui: {
      root: 'page',
      elements: {
        page: {
          type: 'stack' as const,
          props: { direction: 'vertical' as const, gap: 'md' as const },
          children: ['header', 'stats', 'divider', 'burns_section', 'btn_row'],
        },
        header: {
          type: 'item' as const,
          props: { title: '$ZABAL', description: 'The ZAO community token on Base' },
          children: ['chain_badge'],
        },
        chain_badge: {
          type: 'badge' as const,
          props: { label: 'Base', color: 'blue' as const },
        },
        stats: {
          type: 'item_group' as const,
          props: { separator: true },
          children: ['price_item', 'mcap_item', 'holders_item'],
        },
        price_item: {
          type: 'item' as const,
          props: { title: 'Price', description: price },
        },
        mcap_item: {
          type: 'item' as const,
          props: { title: 'Market Cap', description: mcap },
        },
        holders_item: {
          type: 'item' as const,
          props: { title: 'Holders', description: `${data.holders}` },
        },
        divider: {
          type: 'separator' as const,
          props: {},
        },
        burns_section: {
          type: 'stack' as const,
          props: { direction: 'vertical' as const, gap: 'sm' as const },
          children: ['burned_item', 'distributed_item'],
        },
        burned_item: {
          type: 'item' as const,
          props: { title: `Burned: ${burned} ZABAL`, description: 'Sent to dead address' },
          children: ['burn_badge'],
        },
        burn_badge: {
          type: 'badge' as const,
          props: { label: 'Deflationary', color: 'red' as const, icon: 'flame' as const },
        },
        distributed_item: {
          type: 'item' as const,
          props: { title: `Sent from ZAAL: ${distributed} ZABAL`, description: 'Community distributions' },
          children: ['dist_badge'],
        },
        dist_badge: {
          type: 'badge' as const,
          props: { label: 'Community', color: 'green' as const, icon: 'send' as const },
        },
        btn_row: {
          type: 'stack' as const,
          props: { direction: 'horizontal' as const, gap: 'sm' as const },
          children: ['swap_btn', 'send_btn', 'more_btn'],
        },
        swap_btn: {
          type: 'button' as const,
          props: { label: 'Swap', icon: 'refresh-cw' as const },
          on: {
            press: {
              action: 'swap_token' as const,
              params: { buyToken: ZABAL.caip19 },
            },
          },
        },
        send_btn: {
          type: 'button' as const,
          props: { label: 'Send', icon: 'coins' as const },
          on: {
            press: {
              action: 'send_token' as const,
              params: { token: ZABAL.caip19 },
            },
          },
        },
        more_btn: {
          type: 'button' as const,
          props: { label: 'Activity', variant: 'primary' as const },
          on: {
            press: {
              action: 'submit' as const,
              params: { target: `${baseUrl}/activity` },
            },
          },
        },
      },
    },
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && git add zabal-snap/src/pages/dashboard.ts
git commit -m "feat(zabal-snap): add dashboard page builder"
```

---

### Task 5: Activity Page (Page 2)

**Files:**
- Create: `zabal-snap/src/pages/activity.ts`

- [ ] **Step 1: Create activity.ts**

Create `zabal-snap/src/pages/activity.ts`:

```typescript
import type { TopRecipient } from '../token.js';
import { ZABAL } from '../token.js';
import { formatTokenAmount, shortenAddress } from '../utils.js';

export function buildActivityPage(recipients: TopRecipient[], baseUrl: string) {
  const bars = recipients.map((r) => ({
    label: `${shortenAddress(r.address)} ${formatTokenAmount(r.amount)}`,
    value: Number(r.amount / BigInt(1e18)),
  }));

  const maxVal = bars.length > 0 ? Math.max(...bars.map((b) => b.value)) : 1;

  return {
    version: '1.0' as const,
    theme: { accent: 'amber' as const },
    ui: {
      root: 'page',
      elements: {
        page: {
          type: 'stack' as const,
          props: { direction: 'vertical' as const, gap: 'md' as const },
          children: ['title', 'recipients_label', 'recipients_chart', 'supply_label', 'supply_chart', 'btn_row'],
        },
        title: {
          type: 'text' as const,
          props: { content: 'ZABAL Activity', weight: 'bold' as const },
        },
        recipients_label: {
          type: 'text' as const,
          props: { content: 'Top Recipients from ZAAL', size: 'sm' as const },
        },
        recipients_chart: {
          type: 'bar_chart' as const,
          props: {
            bars: bars.length > 0 ? bars : [{ label: 'No transfers yet', value: 0 }],
            color: 'amber' as const,
            max: maxVal || 1,
          },
        },
        supply_label: {
          type: 'text' as const,
          props: { content: 'Supply Breakdown', size: 'sm' as const },
        },
        supply_chart: {
          type: 'bar_chart' as const,
          props: {
            bars: [
              { label: 'LP Pool (65.2%)', value: 65.2 },
              { label: 'Vault Locked (30.0%)', value: 30.0 },
              { label: 'Airdrop (4.8%)', value: 4.8 },
            ],
            color: 'green' as const,
            max: 100,
          },
        },
        btn_row: {
          type: 'stack' as const,
          props: { direction: 'horizontal' as const, gap: 'sm' as const, justify: 'between' as const },
          children: ['back_btn', 'basescan_btn'],
        },
        back_btn: {
          type: 'button' as const,
          props: { label: 'Back', icon: 'arrow-left' as const },
          on: {
            press: {
              action: 'submit' as const,
              params: { target: `${baseUrl}/` },
            },
          },
        },
        basescan_btn: {
          type: 'button' as const,
          props: { label: 'BaseScan', variant: 'primary' as const, icon: 'external-link' as const },
          on: {
            press: {
              action: 'open_url' as const,
              params: {
                target: `https://basescan.org/token/${ZABAL.address}`,
              },
            },
          },
        },
      },
    },
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && git add zabal-snap/src/pages/activity.ts
git commit -m "feat(zabal-snap): add activity page builder"
```

---

### Task 6: Hono App + Snap Handler

**Files:**
- Create: `zabal-snap/src/app.ts`
- Create: `zabal-snap/src/server.ts`
- Create: `zabal-snap/api/index.ts`

- [ ] **Step 1: Create app.ts (main Hono app)**

Create `zabal-snap/src/app.ts`:

```typescript
import { Hono } from 'hono';
import { registerSnapHandler } from '@farcaster/snap-hono';
import { getDashboardData, getTopRecipients } from './token.js';
import { buildDashboardPage } from './pages/dashboard.js';
import { buildActivityPage } from './pages/activity.js';

const app = new Hono();

function getBaseUrl(req: Request): string {
  // Check env first (production)
  if (process.env.SNAP_PUBLIC_BASE_URL) {
    return process.env.SNAP_PUBLIC_BASE_URL;
  }
  // Check forwarded headers (reverse proxy)
  const forwarded = req.headers.get('x-forwarded-host');
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  if (forwarded) {
    return `${proto}://${forwarded}`;
  }
  // Fallback to localhost
  const host = req.headers.get('host') ?? 'localhost:3003';
  return `http://${host}`;
}

// ── Dashboard (landing page) ───────────────────────────────

registerSnapHandler(app, async (ctx) => {
  const baseUrl = getBaseUrl(ctx.req.raw);

  if (ctx.action.type === 'get') {
    const data = await getDashboardData();
    return buildDashboardPage(data, baseUrl);
  }

  // POST to root = "Back" from activity page
  const data = await getDashboardData();
  return buildDashboardPage(data, baseUrl);
});

// ── Activity page ──────────────────────────────────────────

registerSnapHandler(
  app,
  async (ctx) => {
    const baseUrl = getBaseUrl(ctx.req.raw);
    const recipients = await getTopRecipients(5);
    return buildActivityPage(recipients, baseUrl);
  },
  { path: '/activity' },
);

export default app;
```

- [ ] **Step 2: Create server.ts (local dev)**

Create `zabal-snap/src/server.ts`:

```typescript
import { serve } from '@hono/node-server';
import app from './app.js';

const port = 3003;
console.log(`ZABAL Snap running at http://localhost:${port}`);
serve({ fetch: app.fetch, port });
```

- [ ] **Step 3: Create api/index.ts (Vercel entry)**

Create `zabal-snap/api/index.ts`:

```typescript
import app from '../src/app.js';

export default app;
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && git add zabal-snap/src/app.ts zabal-snap/src/server.ts zabal-snap/api/index.ts
git commit -m "feat(zabal-snap): add Hono app with snap handlers"
```

---

### Task 7: Test Locally

- [ ] **Step 1: Start dev server**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && SKIP_JFS_VERIFICATION=true npx tsx src/server.ts &
sleep 3
```

Expected: `ZABAL Snap running at http://localhost:3003`

- [ ] **Step 2: Test GET (dashboard page)**

Run:
```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' 'http://localhost:3003/' | python3 -m json.tool | head -40
```

Expected: JSON response with `version: "1.0"`, `theme.accent: "amber"`, `ui.root: "page"`, elements containing `$ZABAL` title, price, holders, burn data, and three buttons.

- [ ] **Step 3: Test POST (activity page)**

Run:
```bash
curl -sS -X POST -H 'Content-Type: application/vnd.farcaster.snap+json' 'http://localhost:3003/activity' | python3 -m json.tool | head -40
```

Expected: JSON response with `ZABAL Activity` title, `bar_chart` elements for recipients and supply breakdown, back and BaseScan buttons.

- [ ] **Step 4: Test HTML fallback (browser hit)**

Run:
```bash
curl -sS 'http://localhost:3003/' | head -20
```

Expected: HTML page (the branded fallback generated by `@farcaster/snap-hono`).

- [ ] **Step 5: Stop dev server**

Run:
```bash
kill %1 2>/dev/null || true
```

- [ ] **Step 6: Commit (if any fixes were needed)**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && git add zabal-snap/
git commit -m "fix(zabal-snap): fixes from local testing"
```

---

### Task 8: Fix Type Issues and Polish

This task handles any TypeScript or runtime issues found during testing. The snap SDK types are in beta and may require `as any` casts or type adjustments.

- [ ] **Step 1: Run full typecheck**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && npx tsc --noEmit 2>&1
```

Fix any errors. Common issues:
- `as const` assertions needed on string literals for snap spec types
- `registerSnapHandler` path option may need different signature
- Viem multicall result types need `.result` access with nullish coalescing

- [ ] **Step 2: Run dev server and test both pages again**

Run the same curl tests from Task 7.

- [ ] **Step 3: Commit fixes**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && git add zabal-snap/
git commit -m "fix(zabal-snap): type fixes and polish"
```

---

### Task 9: Deploy to Vercel

- [ ] **Step 1: Initialize Vercel project**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && vercel
```

Follow prompts:
- Set up and deploy: Y
- Which scope: select your account
- Link to existing project: N
- Project name: zabal-snap
- Directory: ./
- Override settings: N

- [ ] **Step 2: Set environment variable**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && vercel env add SNAP_PUBLIC_BASE_URL
```

Enter value: `https://snap.zaoos.com` (or the Vercel URL initially)

- [ ] **Step 3: Deploy to production**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && vercel --prod
```

Expected: Deployment URL returned.

- [ ] **Step 4: Test production snap**

Run:
```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' 'https://<vercel-url>/' | python3 -m json.tool | head -20
```

Expected: Same JSON as local, with correct `baseUrl` in submit targets.

- [ ] **Step 5: Add custom domain (snap.zaoos.com)**

Run:
```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1/zabal-snap" && vercel domains add snap.zaoos.com
```

Then add the CNAME record in your DNS provider:
- Type: CNAME
- Name: snap
- Value: cname.vercel-dns.com

- [ ] **Step 6: Test with Farcaster emulator**

Open: `https://farcaster.xyz/~/developers/snaps`
Enter URL: `https://snap.zaoos.com`
Verify: Dashboard renders, buttons work, activity page loads.

- [ ] **Step 7: Cast it**

Cast the URL `https://snap.zaoos.com` on Farcaster. It should render as an interactive snap card in the feed.

- [ ] **Step 8: Commit any deploy config**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && git add zabal-snap/
git commit -m "feat(zabal-snap): vercel deployment config"
```
