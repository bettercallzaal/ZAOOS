# 100 — Reading Solana PDA Data from Next.js (WaveWarZ Battle Vaults)

> **Status:** Research complete
> **Date:** March 21, 2026
> **Goal:** Technical implementation guide for reading Solana Program Derived Address (PDA) data server-side in Next.js API routes, targeting WaveWarZ Battle Vault accounts

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **RPC provider** | Helius free tier (1M credits/mo, 10 RPS, 5 gPA/sec) — do NOT use public mainnet RPC for production |
| **Library** | Already have `@solana/web3.js@^1.98.4` installed — use v1 APIs |
| **Deserialization** | Use `@solana/buffer-layout` + `@solana/buffer-layout-utils` for raw accounts; use `@coral-xyz/anchor` if IDL available |
| **Server-side** | Yes — all reads work in Next.js API routes (no wallet needed for reads) |
| **WaveWarZ program ID** | Not publicly documented — must find via Solscan transaction inspection (see Section 6) |
| **Additional deps needed** | `@solana/buffer-layout`, `@solana/buffer-layout-utils`, optionally `@coral-xyz/anchor` |

---

## 1. Core @solana/web3.js v1 APIs for Reading PDAs

### Connection Setup

```typescript
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// Public endpoint (dev/testing only — 100 req/10s, no SLA)
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

// Helius free tier (recommended for production reads)
const connection = new Connection(
  "https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY",
  "confirmed"
);
```

### getAccountInfo — Read a Single Known PDA

```typescript
const accountInfo = await connection.getAccountInfo(
  new PublicKey("KnownPDAAddressHere")
);

if (accountInfo) {
  console.log("Owner program:", accountInfo.owner.toBase58());
  console.log("Data length:", accountInfo.data.length);
  console.log("Lamports:", accountInfo.lamports);
  // accountInfo.data is a Buffer — must deserialize
}
```

### getProgramAccounts — Find ALL Accounts Owned by a Program

```typescript
const PROGRAM_ID = new PublicKey("WaveWarZProgramIdHere");

// Basic: get all accounts (WARNING: can be huge and slow)
const allAccounts = await connection.getProgramAccounts(PROGRAM_ID);

// Better: filter by account data size (each account type has fixed size)
const battleVaults = await connection.getProgramAccounts(PROGRAM_ID, {
  filters: [
    { dataSize: 165 }, // match accounts exactly 165 bytes (example)
  ],
});

// Best: filter by data size + specific field value via memcmp
const activeBattles = await connection.getProgramAccounts(PROGRAM_ID, {
  filters: [
    { dataSize: 165 },
    {
      memcmp: {
        offset: 8,  // skip 8-byte Anchor discriminator
        bytes: "base58EncodedValueHere", // match specific field
      },
    },
  ],
});

// Response shape:
// Array<{ pubkey: PublicKey, account: { data: Buffer, owner: PublicKey, lamports: number } }>
```

### PublicKey.findProgramAddressSync — Derive a PDA from Seeds

```typescript
// If you know the seeds, derive the PDA address deterministically
const [battleVaultPda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("battle_vault"),           // string seed
    battleId.toArrayLike(Buffer, "le", 8), // u64 battle ID as little-endian bytes
  ],
  PROGRAM_ID
);

// Now read it
const accountInfo = await connection.getAccountInfo(battleVaultPda);
```

### dataSlice — Minimize Bandwidth

```typescript
// Only fetch first 32 bytes of each account (e.g., just the owner field)
const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
  dataSlice: { offset: 0, length: 32 },
  filters: [{ dataSize: 165 }],
});
```

---

## 2. Deserializing Account Data

### Option A: @solana/buffer-layout (No IDL Needed)

Best when you know the account struct layout but don't have an Anchor IDL.

```bash
npm install @solana/buffer-layout @solana/buffer-layout-utils
```

```typescript
import { struct, u8, u32, blob, seq } from "@solana/buffer-layout";
import { publicKey, u64, bool } from "@solana/buffer-layout-utils";
import { PublicKey } from "@solana/web3.js";

// Define layout matching the on-chain Rust struct
// Example: hypothetical BattleVault layout
interface BattleVault {
  discriminator: Uint8Array; // 8 bytes (Anchor discriminator)
  battleId: bigint;
  songA: PublicKey;
  songB: PublicKey;
  totalPoolA: bigint;
  totalPoolB: bigint;
  state: number;            // 0=Active, 1=Resolved, 2=Cancelled
  winner: number;           // 0=None, 1=A, 2=B
  createdAt: bigint;
  bump: number;
}

const BattleVaultLayout = struct<BattleVault>([
  blob(8, "discriminator"),    // Anchor discriminator (first 8 bytes)
  u64("battleId"),
  publicKey("songA"),
  publicKey("songB"),
  u64("totalPoolA"),
  u64("totalPoolB"),
  u8("state"),
  u8("winner"),
  u64("createdAt"),            // i64 as u64
  u8("bump"),
]);

// Deserialize
const accountInfo = await connection.getAccountInfo(battleVaultPda);
if (accountInfo) {
  const decoded = BattleVaultLayout.decode(accountInfo.data);
  console.log("Battle ID:", decoded.battleId.toString());
  console.log("Pool A:", Number(decoded.totalPoolA) / 1e9, "SOL");
  console.log("Pool B:", Number(decoded.totalPoolB) / 1e9, "SOL");
  console.log("State:", decoded.state); // 0=Active, 1=Resolved...
}
```

### Option B: @coral-xyz/anchor (If IDL Available)

Best when the program published its IDL on-chain or you have the JSON.

```bash
npm install @coral-xyz/anchor
```

```typescript
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./wavewarz_idl.json"; // or fetch from chain

const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=KEY");

// Read-only program instance (no wallet needed)
const program = new Program(idl, {
  connection,
});

// Fetch a single account by PDA
const vault = await program.account.battleVault.fetch(battleVaultPda);
console.log("Battle ID:", vault.battleId.toString());
console.log("Pool A:", vault.totalPoolA.toString());

// Fetch ALL battle vaults
const allVaults = await program.account.battleVault.all();
// Returns: Array<{ publicKey: PublicKey, account: { battleId, ... } }>

// Fetch with filters (memcmp on a field)
const activeVaults = await program.account.battleVault.all([
  {
    memcmp: {
      offset: 8 + 8, // after discriminator + battleId
      bytes: "base58EncodedFilter",
    },
  },
]);
```

### Option C: Fetch IDL from Chain (If Uploaded)

```typescript
import { Program } from "@coral-xyz/anchor";

// Anchor stores IDL at a deterministic address derived from program ID
const idl = await Program.fetchIdl(PROGRAM_ID, { connection });
if (idl) {
  const program = new Program(idl, { connection });
  // Now you can use program.account.* with full type info
} else {
  console.log("No IDL published on-chain — must use buffer-layout");
}
```

---

## 3. Next.js API Route Pattern (Server-Side)

All Solana reads work server-side. No wallet connection needed.

```typescript
// src/app/api/wavewarz/battles/route.ts
import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const SOLANA_RPC = process.env.SOLANA_RPC_URL!; // Helius endpoint in .env
const PROGRAM_ID = new PublicKey(process.env.WAVEWARZ_PROGRAM_ID!);

const connection = new Connection(SOLANA_RPC, "confirmed");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const battleId = searchParams.get("battleId");

    if (battleId) {
      // Derive PDA for specific battle
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("battle_vault"), Buffer.from(battleId)],
        PROGRAM_ID
      );

      const accountInfo = await connection.getAccountInfo(pda);
      if (!accountInfo) {
        return NextResponse.json({ error: "Battle not found" }, { status: 404 });
      }

      // Deserialize (use your layout here)
      const decoded = deserializeBattleVault(accountInfo.data);
      return NextResponse.json({ battle: decoded });
    }

    // Fetch all battle vaults
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        { dataSize: BATTLE_VAULT_SIZE }, // known account size
      ],
    });

    const battles = accounts.map(({ pubkey, account }) => ({
      address: pubkey.toBase58(),
      ...deserializeBattleVault(account.data),
    }));

    return NextResponse.json({ battles, count: battles.length });
  } catch (error) {
    console.error("Solana RPC error:", error);
    return NextResponse.json(
      { error: "Failed to fetch battle data" },
      { status: 500 }
    );
  }
}
```

### Environment Variables

```env
# .env.local
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your-helius-key
WAVEWARZ_PROGRAM_ID=<program-id-once-found>
```

---

## 4. Finding All Accounts for a Specific Program

### Method 1: getProgramAccounts with Filters (Most Common)

```typescript
// Filter by account data size (each struct type has known size)
const accounts = await connection.getProgramAccounts(programId, {
  filters: [{ dataSize: 200 }], // only accounts of this exact size
});
```

### Method 2: Anchor Discriminator Filter

Anchor prepends an 8-byte discriminator to every account. The discriminator = first 8 bytes of `SHA256("account:<AccountName>")`.

```typescript
import { sha256 } from "@noble/hashes/sha256";

// Calculate discriminator for "BattleVault"
const discriminator = Buffer.from(
  sha256("account:BattleVault").slice(0, 8)
);

const accounts = await connection.getProgramAccounts(programId, {
  filters: [
    {
      memcmp: {
        offset: 0,
        bytes: bs58.encode(discriminator),
      },
    },
  ],
});
```

### Method 3: getParsedProgramAccounts (For Known Programs)

```typescript
// Works for native programs (Token, System) — not custom programs
const parsed = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
  filters: [{ dataSize: 165 }, { memcmp: { offset: 32, bytes: walletAddress } }],
});
```

### Performance Notes

| Approach | Speed | Data |
|----------|-------|------|
| `getAccountInfo(knownPDA)` | Fast (~100ms) | Single account |
| `getProgramAccounts` + filters | Medium (1-5s) | All matching accounts |
| `getProgramAccounts` no filters | Slow (can timeout) | Everything — avoid |
| `dataSlice` + filters | Fast | Partial data, count-only |

---

## 5. Solana RPC Endpoints

### Free / Public Endpoints

| Provider | URL | Rate Limit | gPA Support | Notes |
|----------|-----|-----------|-------------|-------|
| **Solana Public** | `https://api.mainnet-beta.solana.com` | 100 req/10s per IP; 40 req/10s per single RPC | Yes (slow) | NOT for production. 403 = IP banned. 429 = rate limited |
| **Helius Free** | `https://mainnet.helius-rpc.com/?api-key=KEY` | 10 RPS total; 5 gPA/sec | Yes (optimized) | 1M credits/month. Best free option |
| **Solana Devnet** | `https://api.devnet.solana.com` | Same as mainnet | Yes | Fake SOL only |
| **Solana Testnet** | `https://api.testnet.solana.com` | Same as mainnet | Yes | Intermittent downtime |

### Paid Providers (When You Scale)

| Provider | gPA Speed | Starting Price |
|----------|-----------|---------------|
| **Helius** | 2-10x faster gPA | $49/mo (Business) |
| **Triton** | Optimized gPA | ~$100/mo |
| **QuickNode** | Standard | $49/mo |
| **Chainstack** | Standard | $25/mo |
| **Alchemy** | Standard | Free tier available |

### Rate Limit Details (Public Mainnet)

- 100 requests per 10 seconds per IP (all methods combined)
- 40 requests per 10 seconds per IP for a single RPC method
- 40 concurrent connections per IP
- 100 MB data per 30 seconds
- Error 429: rate limit exceeded (check `Retry-After` header)
- Error 403: IP blocked for abuse (need private RPC)

---

## 6. Finding the WaveWarZ Program ID

WaveWarZ does not publicly document their Solana program ID. No GitHub repository was found. Here is how to discover it:

### Method A: Inspect a Known Transaction on Solscan

1. Go to [Solscan.io](https://solscan.io) or [Solana Explorer](https://explorer.solana.com)
2. Find a WaveWarZ battle transaction (from your own wallet history, or from the WaveWarZ Intelligence dashboard at `wavewarz-intelligence.vercel.app`)
3. Open the transaction details
4. Expand "Instructions" and "Inner Instructions"
5. The program ID is shown as the "Program" field for each instruction
6. The custom WaveWarZ program will NOT be a known system program (Token Program, System Program, etc.)

### Method B: Inspect a Known Battle Vault Address

If you have a battle vault address (from WaveWarZ Intelligence claim tool):
1. Look it up on Solscan
2. The "Owner" field on the account page = the program ID

### Method C: Check WaveWarZ Analytics Source

The WaveWarZ Analytics app (`analytics-wave-warz.vercel.app`) uses Solana Web3.js + Supabase. Inspect the browser network tab while it loads to find RPC calls containing the program ID.

### Method D: Ask the WaveWarZ Team

Since ZAO has a relationship with WaveWarZ (embedded in ZAO OS), request the program ID and IDL directly. This is the fastest path to full integration.

---

## 7. Reference: Solana Prediction Market PDA Patterns

From open-source Anchor prediction markets, here are the common PDA seed patterns that WaveWarZ likely follows:

### Typical Account Types

| Account | PDA Seeds | Purpose |
|---------|-----------|---------|
| Config | `["config"]` | Global program settings |
| Market/Battle | `["battle", battle_id (u64 LE)]` | Per-battle escrow vault |
| UserPosition | `["position", battle_id (u64 LE), user_pubkey]` | User's bet on a battle |
| Vault (token) | `["vault", battle_id (u64 LE)]` | SPL token account holding SOL/tokens |

### Typical Battle Vault Struct (from Solora + prediction market repos)

```rust
#[account]
pub struct BattleVault {
    pub id: u64,                    // Battle identifier
    pub question: String,           // "Song A vs Song B" (or separate fields)
    pub resolution_time: i64,       // When battle ends
    pub state: BattleState,         // Active | Resolved | Cancelled
    pub winning_outcome: Outcome,   // None | SideA | SideB
    pub pool_a: u64,                // Total SOL wagered on side A
    pub pool_b: u64,                // Total SOL wagered on side B
    pub creator: Pubkey,            // Who created the battle
    pub created_at: i64,
    pub fee_bps: u16,               // Platform fee in basis points
    pub bump: u8,
    pub vault_bump: u8,
}
```

### Typical UserPosition Struct

```rust
#[account]
pub struct UserPosition {
    pub battle_id: u64,
    pub user: Pubkey,
    pub bet_a: u64,       // Amount wagered on side A
    pub bet_b: u64,       // Amount wagered on side B
    pub claimed: bool,    // Has user claimed winnings?
    pub bump: u8,
}
```

---

## 8. Implementation Roadmap for ZAO OS

### Step 1: Find the Program ID (1 hour)
- Inspect a WaveWarZ transaction on Solscan
- Or ask the WaveWarZ team directly

### Step 2: Probe the Program (2 hours)
```typescript
// Quick script to explore program accounts
import { Connection, PublicKey } from "@solana/web3.js";

const conn = new Connection("https://mainnet.helius-rpc.com/?api-key=KEY");
const programId = new PublicKey("WAVEWARZ_PROGRAM_ID");

// Try fetching IDL from chain
const idl = await Program.fetchIdl(programId, { connection: conn });
console.log("IDL available:", !!idl);

// Get all accounts and check sizes
const accounts = await conn.getProgramAccounts(programId);
const sizes = new Map<number, number>();
accounts.forEach(({ account }) => {
  const size = account.data.length;
  sizes.set(size, (sizes.get(size) || 0) + 1);
});
console.log("Account sizes:", Object.fromEntries(sizes));
// This reveals how many account types exist and their sizes
```

### Step 3: Reverse-Engineer Account Layouts (4 hours)
- Group accounts by size
- Compare known data (battle IDs, SOL amounts) against byte patterns
- If Anchor: first 8 bytes are discriminator, then fields follow Rust struct order
- If IDL available: skip this step entirely

### Step 4: Build the API Route (2 hours)
- Create `src/app/api/wavewarz/battles/route.ts`
- Add Helius RPC URL to `.env`
- Implement deserialization with discovered layout
- Cache results in Supabase (battles are immutable after settlement)

### Step 5: Surface in UI (2 hours)
- Show recent battle results on `/wavewarz` page
- Display ZAO member WaveWarZ stats in profile

---

## 9. Dependencies Already Installed vs Needed

| Package | Status | Purpose |
|---------|--------|---------|
| `@solana/web3.js` ^1.98.4 | Installed | Connection, PublicKey, getAccountInfo, getProgramAccounts |
| `@solana/wallet-adapter-*` | Installed | Wallet connection (not needed for reads) |
| `@solana/buffer-layout` | **Need to install** | Deserialize raw account data |
| `@solana/buffer-layout-utils` | **Need to install** | PublicKey, u64, bool layout types |
| `@coral-xyz/anchor` | **Optional install** | Only if IDL available; provides `Program.fetchIdl()` and typed `program.account.*` |

```bash
npm install @solana/buffer-layout @solana/buffer-layout-utils
# Optional:
npm install @coral-xyz/anchor
```

---

## Sources

- [Solana Cookbook: getProgramAccounts](https://solanacookbook.com/guides/get-program-accounts.html)
- [Solana RPC Docs: getProgramAccounts](https://solana.com/docs/rpc/http/getprogramaccounts)
- [Solana Clusters & Public RPC Endpoints](https://solana.com/docs/references/clusters)
- [Helius: What Are PDAs](https://www.helius.dev/blog/solana-pda)
- [Helius Pricing (Free Tier)](https://www.helius.dev/pricing)
- [Helius: Faster getProgramAccounts](https://www.helius.dev/blog/faster-getprogramaccounts)
- [QuickNode: Deserialize Account Data](https://www.quicknode.com/guides/solana-development/accounts-and-data/how-to-deserialize-account-data-on-solana)
- [RareSkills: Read Account Data with web3.js and Anchor](https://rareskills.io/post/solana-read-account-data)
- [Anchor TypeScript Client Docs](https://www.anchor-lang.com/docs/clients/typescript)
- [Anchor IDL Fetcher (GitHub)](https://github.com/bilix-software/solana-program-idl-fetcher)
- [Solora Prediction Market (GitHub)](https://github.com/meditatingsloth/solora-anchor)
- [Prediction Market Anchor Guide (DEV.to)](https://dev.to/sivarampg/building-a-prediction-market-on-solana-with-anchor-complete-rust-smart-contract-guide-3pbo)
- [WaveWarZ Main App](https://www.wavewarz.com/)
- [WaveWarZ Intelligence](https://wavewarz-intelligence.vercel.app/)
- [WaveWarZ Analytics](https://analytics-wave-warz.vercel.app/)
- Prior research: Doc 96 (WaveWarZ Deep Dive)
