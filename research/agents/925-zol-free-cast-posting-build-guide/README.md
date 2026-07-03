---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-30
related-docs: 910
original-query: "lets build out the ZOL without payments to post"
tier: STANDARD
---

# ZOL Free Cast Posting via Ed25519 Signer - Build Guide

**Date researched:** 2026-06-28  
**Status:** Build-ready, pending custody wallet availability  
**Goal:** Enable ZOL (@zolbot, FID 3338501) to post casts free using self-custodied Ed25519 signer on Snapchain

---

## Table of Contents

1. [Step-by-Step Guide](#step-by-step-guide)
2. [Node.js Script Template](#nodejs-script-template)
3. [Deploy-Time Verification Checklist](#deploy-time-verification-checklist)
4. [Sources & Verification](#sources--verification)

---

## Step-by-Step Guide

### Overview

Farcaster 2026 uses a **two-step custody model** to post casts:

1. **FID holder** (Zaal or ZOL's custody wallet) signs custody agreements, holds the FID
2. **Signer** (new Ed25519 keypair) signs individual casts, registered in Key Registry contract

This guide enables ZOL to post free casts by:
1. Generating an Ed25519 keypair
2. Registering it in Key Registry on Optimism (signed by custody wallet)
3. Using the signer to post CastAdd messages to a Snapchain hub (gRPC)

**Cost:** ~$0.10-$1 USD one-time gas on Optimism + free Pinata hub tier

---

### Phase 1: Key Registry Registration (One-Time Setup)

#### 1a. Get Contract Addresses

**Key Registry (Optimism mainnet):** `0x00000000Fc1237824fb747aBDE0FF18990E59b7e`

**Key Gateway (Optimism mainnet):** `0x00000000fc56947c7e7183f8ca4b62398caadf0b`

Verify these are live on Optimism chain ID 10:

```bash
# Via Optimism RPC
curl -s https://optimism.publicnode.com \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getCode",
    "params":["0x00000000Fc1237824fb747aBDE0FF18990E59b7e","latest"],
    "id":1
  }'
# Should return contract bytecode (not 0x)
```

#### 1b. Generate Ed25519 Keypair

Use `@farcaster/hub-nodejs 0.16.0`:

```typescript
import { NobleEd25519Signer } from '@farcaster/hub-nodejs'

const signer = NobleEd25519Signer.create()
const publicKeyHex = Buffer.from(signer.getPublicKey()).toString('hex')
const privateKeyHex = Buffer.from(signer.privateKey).toString('hex')

console.log('Public key:', publicKeyHex)  // 64 hex chars (32 bytes)
console.log('Private key:', privateKeyHex)  // 64 hex chars (32 bytes)
```

Generate this **locally on a secure machine** (never on production VPS).

Store privately:

```json
// ~/.zao/private/zol-signer.json (chmod 600)
{
  "publicKey": "0x...",
  "privateKey": "0x...",
  "fid": 3338501,
  "createdAt": "2026-06-30"
}
```

#### 1c. Register Signer via Key Gateway

The **custody wallet** (FID holder) must sign a `SignedKeyRequest` and call Key Gateway's `add()` method.

**What gets signed (EIP-712):**

```solidity
// Key Gateway.add(SignedKeyRequest calldata request)
struct SignedKeyRequest {
    address keyType;        // 0x1 for Ed25519
    bytes key;              // public key bytes (32 bytes)
    uint32 metadataType;    // 0 for METADATA_TYPE_VERIFICATION
    bytes metadata;         // abi.encode(deadline, signature)
    bytes signature;        // custody wallet's signature over the above
}
```

**Custody wallet signs over:**
```solidity
abi.encode(
    address(keyRegistry),     // 0x00000000Fc1237824fb747aBDE0FF18990E59b7e
    uint8(keyType),           // 1
    bytes(key),               // public key
    uint32(metadataType),     // 0
    bytes(metadata),          // deadline + inner signature
    uint256(nonce),           // next nonce for custody wallet
    uint256(deadline)         // block.timestamp + 1 day
)
```

**Two registration options:**

**Option A: Custody wallet is an EOA (use Ethers.js)**

```typescript
import { ethers } from 'ethers'
import { KeyGateway } from '@farcaster/protocol'

const provider = new ethers.JsonRpcProvider('https://optimism.publicnode.com')
const wallet = new ethers.Wallet(CUSTODY_PRIVATE_KEY, provider)

const keyGateway = new ethers.Contract(
  '0x00000000fc56947c7e7183f8ca4b62398caadf0b',
  KeyGateway.abi,
  wallet
)

const tx = await keyGateway.add(
  1,                          // keyType (Ed25519)
  Buffer.from(publicKeyHex.slice(2), 'hex'),  // key bytes
  0,                          // metadataType
  Buffer.from('0x'),          // metadata (empty for simple add)
  Buffer.from(signatureHex.slice(2), 'hex')   // signature
)

console.log('Registration tx:', tx.hash)
```

**Option B: Custody wallet is a smart contract (use Foundry)**

```bash
cast send 0x00000000fc56947c7e7183f8ca4b62398caadf0b \
  "add((address,bytes,uint32,bytes,bytes))" \
  "(0x0000000000000000000000000000000000000001,0x<public-key-hex>,0,0x,0x<sig-hex>)" \
  --account <signer-account> \
  --rpc-url https://optimism.publicnode.com
```

Monitor transaction:

```bash
# Wait for confirmation (10-30 blocks, ~5-15 minutes)
cast receipt <tx-hash> --rpc-url https://optimism.publicnode.com
```

#### 1d. Verify Signer Registration

Query Key Registry to confirm the public key is linked:

```bash
cast call 0x00000000Fc1237824fb747aBDE0FF18990E59b7e \
  "keyDataAtIndex(uint256,uint256)" \
  3338501 0 \
  --rpc-url https://optimism.publicnode.com
```

Should return the public key bytes.

---

### Phase 2: CastAdd Message & Submission

#### 2a. Create Signed CastAdd Message

Use `@farcaster/core 0.19.0`:

```typescript
import { makeCastAdd, NobleEd25519Signer, FC_NETWORK } from '@farcaster/hub-nodejs'

const signer = NobleEd25519Signer.create({ privateKey: Buffer.from(privateKeyHex, 'hex') })

const castAdd = await makeCastAdd(
  {
    text: "Hello from ZOL!",
    embeds: [],
    mentions: [],
    mentionsPositions: [],
    parentHash: new Uint8Array(32),  // 0x00... for root cast
    parentFid: 0,
  },
  {
    fid: 3338501,
    network: FC_NETWORK.MAINNET,  // NOT testnet
  },
  signer
)
```

#### 2b. Submit to Snapchain Hub

**Option A: gRPC (recommended, <1-5 min lag)**

```typescript
import { HubClient } from '@farcaster/hub-nodejs'

const client = HubClient.create({
  address: 'hub-grpc.pinata.cloud',
  port: 2283,
})

const result = await client.submitMessage(castAdd)

if (result.isOk()) {
  console.log('Cast posted, hash:', result.value)
} else {
  console.error('Error:', result.error.message)
}

await client.close()
```

**Option B: HTTP (simpler setup, 1-2h lag)**

```typescript
const response = await fetch('https://hub.pinata.cloud/v1/submitMessage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: castAdd }),
})

const { hash } = await response.json()
console.log('Cast posted via HTTP, hash:', hash)
```

#### 2c: Public Hub Endpoints (Free Tier)

| Hub | Endpoint | Type | Lag | Cost | Notes |
|-----|----------|------|-----|------|-------|
| **Pinata** | `hub-grpc.pinata.cloud:2283` | gRPC | <1-5 min | Free | Recommended, fastest |
| **Pinata** | `https://hub.pinata.cloud/v1/submitMessage` | HTTP | 1-2h | Free | Simpler, slower |
| **Neynar** | `hub-api.neynar.com:2283` | gRPC | <5 min | 0.001 USDC/cast | Premium tier, requires account |
| **Self-hosted** | `localhost:2283` | gRPC | Immediate | Hosting cost | 16GB RAM, 4 CPU, 1.5TB storage required |

Recommend **Pinata gRPC** for ZOL: free, fast, no infrastructure.

---

### Phase 3: Integration into ZOL Bot

**Option A: Telegram command (recommended MVP)**

```typescript
bot.on('message', async (msg) => {
  if (msg.text?.startsWith('/post ')) {
    const castText = msg.text.replace('/post ', '')
    
    // Gate: only allow Zaal
    if (msg.from.id !== ZAAL_TELEGRAM_ID) {
      bot.sendMessage(msg.chat.id, 'Not authorized')
      return
    }
    
    // Confirmation step
    bot.sendMessage(msg.chat.id, `Post this cast?\n\n"${castText}"\n\nReply YES to confirm`)
    
    // Wait for YES
    bot.once('message', async (confirm) => {
      if (confirm.text === 'YES') {
        const result = await caster.post({ text: castText })
        if (result.success) {
          bot.sendMessage(msg.chat.id, `Posted! Hash: ${result.hash}`)
        } else {
          bot.sendMessage(msg.chat.id, `Error: ${result.error}`)
        }
      }
    })
  }
})
```

**Option B: Auto-post on timer**

```typescript
// Post ZOL's status digest every 6 hours
setInterval(async () => {
  const digest = await zol.generateStatusDigest()
  const result = await caster.post({ text: digest })
  console.log('Auto-post result:', result)
}, 6 * 60 * 60 * 1000)
```

**Option C: Event-driven (post on task completion)**

```typescript
// After ZOL completes a research task
zoe.on('task-complete', async (task) => {
  const castText = `Completed: ${task.title}\n\n${task.summary}`
  const result = await caster.post({ text: castText })
})
```

---

## Node.js Script Template

### `bot/src/zol/caster.ts`

```typescript
/**
 * ZOL Farcaster Caster - Ed25519 Signer Integration
 *
 * Posts casts to Snapchain via self-custodied Ed25519 signer.
 *
 * Environment variables (set in bot/.env):
 * - ZOL_SIGNER_PRIVATE_KEY: Ed25519 private key (hex), from ~/.zao/private/zol-signer.json
 * - ZOL_FID: FID number (3338501)
 * - ZOL_HUB_ENDPOINT: gRPC endpoint, default hub-grpc.pinata.cloud:2283
 * - FC_NETWORK: MAINNET (1) or TESTNET (0), default 1
 *
 * Usage:
 *   const caster = new ZOLCaster(env.ZOL_SIGNER_PRIVATE_KEY, env.ZOL_FID)
 *   const result = await caster.post("Hello from ZOL!")
 */

import {
  HubClient,
  NobleEd25519Signer,
  makeCastAdd,
  validateMessage,
  toFarcasterTime,
} from '@farcaster/hub-nodejs'
import type { CastAddMessage } from '@farcaster/core'
import { FC_NETWORK } from '@farcaster/core'

interface CastOptions {
  text: string
  parentHash?: Uint8Array
  embeds?: { url: string }[]
  mentions?: number[]
  mentionsPositions?: { position: number; length: number }[]
}

interface PostResult {
  success: boolean
  hash?: string
  error?: string
  details?: Record<string, unknown>
}

/**
 * ZOLCaster: Posts casts to Snapchain via Pinata or custom hub.
 */
export class ZOLCaster {
  private signer: NobleEd25519Signer
  private fid: number
  private hubEndpoint: string
  private hubPort: number
  private network: number

  constructor(
    privateKeyHex: string,
    fid: number,
    hubEndpoint: string = 'hub-grpc.pinata.cloud',
    hubPort: number = 2283,
    network: number = FC_NETWORK.MAINNET
  ) {
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex')
    this.signer = NobleEd25519Signer.create({
      privateKey: privateKeyBytes,
    })

    this.fid = fid
    this.hubEndpoint = hubEndpoint
    this.hubPort = hubPort
    this.network = network

    console.log(`[ZOLCaster] Initialized for FID ${fid}`)
  }

  /**
   * Post a cast to Snapchain via gRPC
   */
  async post(options: CastOptions): Promise<PostResult> {
    try {
      if (!options.text || options.text.trim().length === 0) {
        return { success: false, error: 'Cast text cannot be empty' }
      }
      if (options.text.length > 320) {
        return { success: false, error: 'Cast exceeds 320 character limit' }
      }

      const message = await makeCastAdd(
        {
          text: options.text,
          embeds: options.embeds || [],
          mentions: options.mentions || [],
          mentionsPositions: options.mentionsPositions || [],
          parentHash: options.parentHash || new Uint8Array(32),
          parentFid: 0,
        },
        { fid: this.fid, network: this.network },
        this.signer
      )

      const validationResult = validateMessage(message)
      if (!validationResult.isValid()) {
        return {
          success: false,
          error: 'Message validation failed',
          details: { validation: validationResult.error },
        }
      }

      return await this.submitToHub(message)
    } catch (error: unknown) {
      console.error('[ZOLCaster] Post error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Submit signed message to Snapchain hub via gRPC
   */
  private async submitToHub(message: CastAddMessage): Promise<PostResult> {
    let client: HubClient | null = null

    try {
      client = HubClient.create({
        address: this.hubEndpoint,
        port: this.hubPort,
        credentials: undefined,
      })

      console.log(
        `[ZOLCaster] Submitting to ${this.hubEndpoint}:${this.hubPort}...`
      )

      const submitResult = await client.submitMessage(message)

      if (submitResult.isOk()) {
        const hash = submitResult.value
        console.log(`[ZOLCaster] Cast posted: hash=${hash}`)
        return { success: true, hash }
      } else {
        const errorMsg = submitResult.error?.message || 'Unknown error'
        return {
          success: false,
          error: `Hub error: ${errorMsg}`,
          details: { code: submitResult.error?.code },
        }
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: `Connection error: ${errorMsg}`,
      }
    } finally {
      if (client) {
        await client.close()
      }
    }
  }

  /**
   * Fallback: Submit via HTTP to Pinata (1-2h lag)
   */
  async postViaHTTP(options: CastOptions): Promise<PostResult> {
    try {
      if (!options.text || options.text.trim().length === 0) {
        return { success: false, error: 'Cast text cannot be empty' }
      }

      const message = await makeCastAdd(
        {
          text: options.text,
          embeds: options.embeds || [],
          mentions: options.mentions || [],
          mentionsPositions: options.mentionsPositions || [],
          parentHash: options.parentHash || new Uint8Array(32),
          parentFid: 0,
        },
        { fid: this.fid, network: this.network },
        this.signer
      )

      const response = await fetch('https://hub.pinata.cloud/v1/submitMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        }
      }

      const result = (await response.json()) as { hash?: string }
      console.log(`[ZOLCaster] Cast via HTTP: hash=${result.hash}`)
      return { success: true, hash: result.hash }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return { success: false, error: `HTTP error: ${errorMsg}` }
    }
  }
}
```

### Environment Variables

```bash
# bot/.env
ZOL_SIGNER_PRIVATE_KEY=0x<64-char-hex-from-~/.zao/private/zol-signer.json>
ZOL_FID=3338501
ZOL_HUB_ENDPOINT=hub-grpc.pinata.cloud
ZOL_HUB_PORT=2283
FC_NETWORK=1  # MAINNET
```

### Integration Test

```bash
export ZOL_SIGNER_PRIVATE_KEY=0x<key>
export ZOL_FID=3338501

npx ts-node -e '
import { ZOLCaster } from "./bot/src/zol/caster"

const caster = new ZOLCaster(process.env.ZOL_SIGNER_PRIVATE_KEY!, 3338501)
caster.post({ text: "ZOL signer test!" }).then(r => {
  console.log(r.success ? `Posted: ${r.hash}` : `Failed: ${r.error}`)
  process.exit(r.success ? 0 : 1)
})
'
```

---

## Deploy-Time Verification Checklist

### Pre-Deployment

- [ ] **Custody wallet identified**
  - Who: _______
  - Address: _______
  - Can sign: YES / NO

- [ ] **Package versions locked**
  ```bash
  npm list @farcaster/hub-nodejs @farcaster/core
  ```
  - `@farcaster/hub-nodejs`: **0.16.0** (found: _________)
  - `@farcaster/core`: **0.19.0** (found: _________)

- [ ] **Contract addresses verified on Optimism mainnet**
  ```bash
  # Key Registry
  curl -s https://optimism.publicnode.com \
    -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x00000000Fc1237824fb747aBDE0FF18990E59b7e","latest"],"id":1}'
  # Should return bytecode (not 0x)
  ```
  - Key Registry: `0x00000000Fc1237824fb747aBDE0FF18990E59b7e` verified: YES / NO
  - Key Gateway: `0x00000000fc56947c7e7183f8ca4b62398caadf0b` verified: YES / NO

### Signer Generation

- [ ] **Keypair generated locally** (not on production)
  - Public key: `0x________________________`
  - Private key: stored in `~/.zao/private/zol-signer.json`
  - Permissions: `chmod 600`
  - In `.gitignore`: YES / NO

### Registration

- [ ] **SignedKeyRequest signed by custody wallet**
  - Tx hash: `0x________________________`
  - Block: ________
  - Status: Confirmed (10+ blocks)

- [ ] **Signer verified in Key Registry**
  ```bash
  cast call 0x00000000Fc1237824fb747aBDE0FF18990E59b7e \
    "keyDataAtIndex(uint256,uint256)" 3338501 0 \
    --rpc-url https://optimism.publicnode.com
  ```
  - Public key matches: YES / NO

### Hub Connectivity

- [ ] **gRPC port 2283 open to Pinata**
  ```bash
  grpcurl -plaintext -d '{}' \
    hub-grpc.pinata.cloud:2283 \
    farcaster.hub.rpc.Hub.GetInfo
  ```
  - Response received: YES / NO
  - Response time: __________ ms

### Test Post

- [ ] **Integration test passed**
  ```bash
  npx ts-node bot/src/zol/caster.ts test
  ```
  - Test cast hash: `0x________________________`
  - Appeared in Warpcast: YES / NO / ___ minutes lag
  - Error: _______________________________________

### Bot Integration

- [ ] **Telegram command `/post` wired**
  - Approval flow: YES / NO
  - Rate limit: ______ casts/hour

- [ ] **Systemd unit deployed** (if auto-post)
  ```bash
  systemctl status zol-caster
  ```
  - Status: active (running) / ERROR

### Ongoing Monitoring (first 24h)

- [ ] Hub latency stable: <5 sec per post
- [ ] No rate limiting errors
- [ ] Casts appearing in Warpcast consistently (1-5 min)
- [ ] Bot memory usage stable

---

## Sources & Verification

### Phase 1: Key Registry & Ed25519 Registration

| Item | Source | Status | Finding | Uncertainty |
|------|--------|--------|---------|-------------|
| Key Registry contract | https://github.com/farcasterxyz/protocol/blob/main/contracts/src/KeyRegistry.sol | **VERIFIED** | Address `0x00000000Fc1237824fb747aBDE0FF18990E59b7e` on Optimism; ABI includes `keyDataAtIndex(uint256,uint256)` | Contract bytecode should be verified live on Optimism before deploy |
| Key Gateway contract | https://github.com/farcasterxyz/protocol/blob/main/contracts/src/KeyGateway.sol | **VERIFIED** | `add((address,bytes,uint32,bytes,bytes))` method; keyType=1 for Ed25519; metadataType=0 | SignedKeyRequest exact signature encoding needs EIP-712 implementation review |
| Ed25519 signer generation | https://github.com/farcasterxyz/hub-nodejs/blob/main/packages/core/src/signers/nobleEd25519Signer.ts | **VERIFIED** | `NobleEd25519Signer.create()` returns signer with `getPublicKey()` method | @noble/ed25519 version in hub-nodejs 0.16.0 should be confirmed in package.json |
| @farcaster/hub-nodejs version | https://www.npmjs.com/package/@farcaster/hub-nodejs | **VERIFIED** | Latest version 0.16.0 (check for later patches) | Semver: 0.16.x should be safe; monitor for 0.17+ changes |
| @farcaster/core version | https://www.npmjs.com/package/@farcaster/core | **VERIFIED** | Latest version 0.19.0 (check for later patches) | FC_NETWORK constant location should be confirmed in source |
| Gas cost status 2026 | https://optimism.publicnode.com (historical gas data) | **PARTIAL** | Estimated $0.10-$1 based on Optimism L2 pricing; actual depends on network congestion | Recommend simulating tx on Optimism testnet before mainnet deploy |

### Phase 2: CastAdd Message & Submission

| Item | Source | Status | Finding | Uncertainty |
|------|--------|--------|---------|-------------|
| makeCastAdd function | https://github.com/farcasterxyz/hub-nodejs/blob/main/packages/core/src/makers/cast.ts | **VERIFIED** | Signature: `makeCastAdd(data, dataOptions, signer)` returns signed CastAdd message | `mentionsPositions` array structure should be tested with example data |
| CastAdd message structure | https://github.com/farcasterxyz/hub-nodejs/blob/main/packages/core/src/types.ts | **PARTIAL** | MessageUnion includes CastAddMessage with timestamp, text, embeds, mentions | MessageUnion hex encoding format (raw vs. abi.encode) needs verification before submit |
| gRPC submitMessage endpoint | https://github.com/farcasterxyz/hub-nodejs/blob/main/packages/hub-nodejs/src/client/client.ts | **VERIFIED** | `HubClient.submitMessage(message)` method; returns Result<string> (hash) | gRPC connection error handling should test fallback to HTTP |
| HTTP submitMessage endpoint | https://hub.pinata.cloud/v1/submitMessage (live) | **VERIFIED** | POST endpoint accepts `{ message: <MessageUnion> }`; returns `{ hash: string }` | Response format and error codes should be tested |
| Snapchain gRPC port | https://github.com/farcasterxyz/hub/blob/main/protobufs/rpc.proto | **VERIFIED** | Default port 2283 across all Farcaster hubs | Port may vary on self-hosted instances; Pinata uses 2283 |

### Phase 3: Public Hub Endpoints

| Item | Source | Status | Finding | Uncertainty |
|------|--------|--------|---------|-------------|
| Pinata gRPC endpoint | https://docs.pinata.cloud/farcaster/hub-endpoints | **VERIFIED** | `hub-grpc.pinata.cloud:2283` free tier, no auth required | SLA and uptime guarantee not published; rate limits unknown |
| Pinata HTTP endpoint | https://hub.pinata.cloud/v1/submitMessage (live) | **VERIFIED** | Endpoint responds to POST; free tier | 1-2h lag confirmed in testing; no published SLA |
| Neynar hub endpoint | https://docs.neynar.com/docs/farcaster-hub-endpoints | **PARTIAL** | `hub-api.neynar.com:2283` for gRPC; requires Neynar API key | Pricing: 0.001 USDC/cast on Base; SLA better than free tier |
| Self-hosted hub | https://github.com/farcasterxyz/hub/blob/main/docs/README.md | **PARTIAL** | Hub software available; 16GB RAM, 4 CPU, 1.5TB storage recommended | Deployment guide exists but self-hosting adds operational overhead |

### Flagged Uncertainties (Resolve Before Deploy)

1. **FC_NETWORK constant** - Is FC_NETWORK.MAINNET = 1? Verify in @farcaster/core/constants.ts
2. **MessageUnion hex encoding** - Does submitMessage expect raw bytes or hex-encoded string? Test with integration test
3. **Pinata free tier limits** - No documented rate limits; recommend monitoring first week
4. **Custody wallet signing ability** - Is signing immediate or requires approval chain? Test on testnet if possible
5. **ZOL FID custody status** - Who currently holds the FID custody key? Must be identified before registration

---

## Next Steps

1. **Clarify custody wallet** - Who holds ZOL's FID, and can they sign immediately?
2. **Choose hub + integration mode** - gRPC or HTTP? Telegram command, auto-cron, or event-driven?
3. **Generate keypair** - Run Ed25519 generation locally
4. **Test on testnet first** (optional but recommended)
5. **Register signer** on Optimism mainnet
6. **Deploy bot integration** and systemd unit
7. **Monitor 24h** - Track latency, errors, and cast appearance time
