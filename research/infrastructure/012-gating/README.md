---
topic: infrastructure
type: technical-guide
status: research-complete
last-validated: 2026-05-21
original-query: How to restrict access to ZAO OS with allowlist, NFT, Hats, attestations (reconstructed)
tier: 1-must-have
---

# Gating Access to ZAO OS

> How to restrict who can use the client
> **Original Date:** 2026-01-22
> **Re-validated:** 2026-05-21

## Gating Methods

| Method | Data Source | Latency | Cost | Best For |
|--------|-----------|---------|------|----------|
| **NFT ownership** | On-chain RPC | ~200ms | Free | Token-gated community |
| **ERC-20 balance** | On-chain RPC | ~200ms | Free | Minimum stake requirement |
| **Hats Protocol** | On-chain RPC | ~200ms | Gas to mint | Role-based access |
| **Channel membership** | Neynar API | ~100ms | Free tier | Farcaster-native gating |
| **Allowlist / Invite** | Your database | ~10ms | Free | Early access, invite-only |
| **EAS Attestation** | EAS GraphQL | ~300ms | Free to query | Verified credentials |
| **FID range** | SIWF response | ~0ms | Free | OG Farcaster users |

---

## Recommended MVP Gate: Allowlist + Invite Codes

Simplest to ship. No on-chain dependencies. Add NFT/Hats later.

### Database Schema

```sql
CREATE TABLE allowlist (
  id TEXT PRIMARY KEY,
  fid BIGINT UNIQUE,
  eth_address TEXT,
  added_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invite_codes (
  code TEXT PRIMARY KEY,
  max_uses INT DEFAULT 1,
  current_uses INT DEFAULT 0,
  created_by_fid BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invite_redemptions (
  id TEXT PRIMARY KEY,
  code TEXT REFERENCES invite_codes(code),
  fid BIGINT NOT NULL,
  redeemed_at TIMESTAMP DEFAULT NOW()
);
```

### Invite Code Flow
```
1. Admin creates invite code (or existing member generates one)
2. New user gets code from a ZAO member
3. User signs in with Farcaster (SIWF)
4. App prompts for invite code
5. Code validated → FID added to allowlist → session created
6. On subsequent visits, FID is already allowlisted → straight in
```

---

## Full Auth + Gate Flow (Next.js)

### 1. SIWF Login Button

```typescript
// components/LoginButton.tsx
"use client";
import { SignInButton } from "@farcaster/auth-kit";

export function LoginButton() {
  const handleSuccess = async (res: any) => {
    const { fid, message, signature, nonce } = res;
    const result = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fid, message, signature, nonce }),
    });
    const { allowed, reason } = await result.json();
    if (allowed) window.location.href = "/chat";
    else alert(`Access denied: ${reason}`);
  };

  return <SignInButton onSuccess={handleSuccess} />;
}
```

### 2. Verify + Gate Check (API Route)

```typescript
// app/api/auth/verify/route.ts
import { createAppClient, viemConnector } from "@farcaster/auth-client";

export async function POST(req: Request) {
  const { fid, message, signature, nonce } = await req.json();

  // Verify SIWF signature
  const appClient = createAppClient({ ethereum: viemConnector() });
  const { success } = await appClient.verifySignInMessage({
    message, signature, domain: "yourdomain.com", nonce,
  });
  if (!success) return Response.json({ allowed: false, reason: "Invalid signature" });

  // Resolve addresses (for future on-chain gates)
  const neynarRes = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
    { headers: { api_key: process.env.NEYNAR_API_KEY! } }
  );
  const { users } = await neynarRes.json();
  const addresses = [
    users[0].custody_address,
    ...(users[0].verified_addresses?.eth_addresses ?? []),
  ];

  // Run gate checks
  const result = await evaluateGates(fid, addresses);
  if (result.allowed) {
    // Create session, return token
    return Response.json({ allowed: true });
  }
  return Response.json({ allowed: false, reason: "Not on allowlist" });
}
```

### 3. Composable Gate System

```typescript
// lib/gates.ts
type GateConfig = {
  mode: "any" | "all";   // any = OR, all = AND
  checks: GateCheck[];
};

type GateCheck =
  | { type: "allowlist" }
  | { type: "nft"; chainId: number; contract: string }
  | { type: "hat"; chainId: number; hatId: string }
  | { type: "channel"; channelId: string }
  | { type: "attestation"; schemaId: string };

async function evaluateGates(fid: number, addresses: string[]) {
  // Check each gate in parallel, return { allowed, passed, failed }
}
```

---

## On-Chain Gates (Phase 2+)

### NFT Gate
```typescript
import { createPublicClient, http, erc721Abi } from "viem";
import { base } from "viem/chains";

const client = createPublicClient({ chain: base, transport: http() });

async function holdsNFT(address: string, contract: string): Promise<boolean> {
  const balance = await client.readContract({
    address: contract as `0x${string}`,
    abi: erc721Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });
  return balance > 0n;
}
```

### Hats Protocol Gate
```typescript
const HATS_CONTRACT = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137"; // same on all chains

async function wearsHat(address: string, hatId: bigint): Promise<boolean> {
  return await client.readContract({
    address: HATS_CONTRACT as `0x${string}`,
    abi: [{ name: "isWearerOfHat", type: "function", stateMutability: "view",
      inputs: [{ name: "_user", type: "address" }, { name: "_hatId", type: "uint256" }],
      outputs: [{ name: "", type: "bool" }] }],
    functionName: "isWearerOfHat",
    args: [address as `0x${string}`, hatId],
  });
}
```

### EAS Attestation Gate
```typescript
async function hasAttestation(address: string, schemaId: string): Promise<boolean> {
  const res = await fetch("https://base.easscan.org/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query { attestations(where: { recipient: { equals: "${address}" }, schemaId: { equals: "${schemaId}" }, revoked: { equals: false } }) { id } }`,
    }),
  });
  const data = await res.json();
  return data.data.attestations.length > 0;
}
```

---

## Key Packages

```bash
npm install @farcaster/auth-kit @farcaster/auth-client viem @hatsprotocol/sdk-v1-core
```

---

## Key Takeaways

- **MVP:** Allowlist + invite codes. Zero on-chain deps. Ship fast.
- **Phase 2:** Add NFT gate (mint a ZAO membership NFT on Base)
- **Phase 3:** Add Hats Protocol (role-based access tiers)
- **Composable:** Gate system is modular — add new checks without rewriting auth
- **All gates resolve FID → addresses via Neynar, then check on-chain**

---

## Findings (2026-05-21 Re-validation)

### Material Changes
1. **Farcaster AuthKit:** v0.8.2 released Feb 2026 (was undated). Latest version still uses SIWF pattern, relay server polling at 1500ms intervals, domain + siweUri required. Constructor config schema unchanged. [FULL]
2. **Hats Protocol:** Contract address 0x3bc1A0Ad72417f2d411118085256fC53CBdDd137 confirmed deployed on Base + 10 other chains (including Ethereum, Arbitrum, Optimism, Polygon, Scroll, Celo). isWearerOfHat() view function stable. [FULL]
3. **Viem:** Latest 2.47.6 released Mar 2026. ERC-721 ABI exported at src/constants/abis.js. balanceOf() pattern via readContract() still the standard path. No breaking changes to contract interaction APIs. [FULL]

### Still Current
- Allowlist + invite codes MVP pattern valid for 2026. No database schema changes needed.
- Neynar /v2/farcaster/user/bulk endpoint stable for FID → address resolution.
- On-chain gate latency estimates (200ms RPC, 300ms EAS GraphQL) accurate.
- EAS GraphQL endpoint at base.easscan.org confirmed live for Base chain attestations. [PARTIAL]

### Source Status
- Farcaster AuthKit docs: https://docs.farcaster.xyz/auth-kit [FULL]
- Hats Protocol contract + chain list: https://docs.hatsprotocol.xyz [FULL]
- Viem GitHub + docs: https://viem.sh, https://github.com/wevm/viem [FULL]
- EAS Base chain: https://base.easscan.org/graphql [PARTIAL - did not re-fetch GraphQL schema]
