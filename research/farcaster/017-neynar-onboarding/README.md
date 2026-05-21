---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-20
related-docs: [002-farcaster-hub-api, 173-farcaster-miniapps-integration]
original-query: "How do we register new Farcaster accounts and create managed signers so users can post without owning their own keys? (reconstructed)"
tier: STANDARD
---

# 017 - Neynar Onboarding & Managed Signers

> **Goal:** Onboard wallet-only users to Farcaster and enable them to post via Neynar-sponsored signers.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | Use **Neynar managed signers**, not raw Farcaster signer creation | Neynar sponsors all onchain costs (gas, storage). Users never pay. |
| 2 | For existing FC users: create signer + request approval via deep link | Reuses existing identity; QR code approvals are standard in Warpcast. |
| 3 | For wallet-only users: direct `/v2/farcaster/user` registration | One API call creates FID + signer. No app dependency. ~3 minutes total onboarding. |
| 4 | Store `signer_uuid` in Supabase auth session, not on client | Signer UUID is session-scoped; regenerate if rotated. |
| 5 | Sign EIP-712 requests with app's dedicated signer wallet, NOT user's wallet | App signer is a single burner keypair (generated once, stored in .env). User never signs key requests themselves. |

## Findings

### Two Onboarding Paths

| Path | User Starting State | Flow | Duration | Cost to User |
|------|------------------|------|----------|--------------|
| **A: Existing Farcaster User** | Has Farcaster account (username, FID) | POST `/signer` -> POST `/signer/signed_key` (EIP-712 signed) -> show QR/deep link -> user approves in Warpcast -> poll until `status: "approved"` -> signer_uuid ready | 2-5 minutes (user approval) | $0 (Neynar sponsors gas) |
| **B: Wallet Only, No Farcaster** | Only has wallet address, no FID | POST `/v2/farcaster/user` (EIP-712 signed) in one call -> FID + signer auto-created + auto-approved -> signer_uuid ready | 30 seconds (no approval needed) | $0 (Neynar sponsors) |

### Path A: Existing Farcaster User (Managed Signer)

**Step 1: Create Signer**
```
POST https://api.neynar.com/v2/farcaster/signer
Headers: x-api-key: YOUR_NEYNAR_API_KEY
Body: {} (empty)

Response: {
  signer_uuid: "550e8400-e29b-41d4-a716-446655440000",
  public_key: "0xabcdef...",
  status: "pending_approval"
}
```

**Step 2: Register Signed Key (Get Approval URL)**
```
POST https://api.neynar.com/v2/farcaster/signer/signed_key
Headers: x-api-key: YOUR_NEYNAR_API_KEY
Body: {
  signer_uuid: "550e8400-e29b-41d4-a716-446655440000",
  app_fid: 19640,                    # ZAO's app FID
  deadline: 1652222800,              # Unix timestamp, 24 hours from now
  signature: "0x<128-char hex>"      # EIP-712 signature from app's signer wallet
}

Response: {
  signer_uuid: "550e8400-e29b-41d4-a716-446655440000",
  status: "pending_approval",
  signer_approval_url: "https://client.warpcast.com/deeplinks/signed-key-request?token=0x..."
}
```

**Step 3: Present Approval URL to User**

**Desktop:** Convert URL to QR code. User scans with Farcaster app.

**Mobile:** Use as deep link. User taps and is redirected into Farcaster app to approve.

Warpcast shows: "App ZAO wants to post on your behalf - approve?"

**Step 4: Poll Until Approved**
```
GET https://api.neynar.com/v2/farcaster/signer?signer_uuid=550e8400-e29b-41d4-a716-446655440000
Headers: x-api-key: YOUR_NEYNAR_API_KEY

Response (when approved): {
  signer_uuid: "550e8400-e29b-41d4-a716-446655440000",
  status: "approved",
  fid: 654321
}
```

Poll every 2 seconds, timeout after 2 minutes.

### Path B: Direct FID Registration (New User)

**One API Call:**
```
POST https://api.neynar.com/v2/farcaster/user
Headers: x-api-key: YOUR_NEYNAR_API_KEY
Body: {
  signature: "0x<128-char hex>",                    # EIP-712 signed by app's signer wallet
  fid: 0,                                           # 0 = create new
  requested_user_custody_address: "0xUserWallet",  # user's wallet that will own the FID
  deadline: 1652222800,                            # Unix timestamp, 24 hours from now
  fname: "desiredusername"                         # lowercase alphanumeric, 1-16 chars
}

Response: {
  success: true,
  signer: {
    signer_uuid: "550e8400-e29b-41d4-a716-446655440000",
    public_key: "0xabcdef...",
    status: "approved",    # NOTE: already approved, no polling needed
    fid: 789012
  }
}
```

User's FID is instantly usable. Username and signer are auto-created and auto-approved.

### EIP-712 Signature Generation (Using Viem)

Both paths require signing an EIP-712 message with the app's dedicated signer wallet:

```typescript
import { createClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// App's signer wallet (generated once, stored in .env)
const APP_SIGNER_PRIVATE_KEY = process.env.APP_SIGNER_PRIVATE_KEY;
const account = privateKeyToAccount(APP_SIGNER_PRIVATE_KEY);

// For Path A (signed_key) - signature validation contract on Optimism
const SIGNED_KEY_REQUEST_VALIDATOR = '0x00000000FC700472606ED4fA22623Acf62c60553';

const signature = await account.signTypedData({
  domain: {
    name: 'Farcaster SignedKeyRequestValidator',
    version: '1',
    chainId: 10,  // Optimism
    verifyingContract: SIGNED_KEY_REQUEST_VALIDATOR,
  },
  types: {
    SignedKeyRequest: [
      { name: 'requestFid', type: 'uint256' },
      { name: 'key', type: 'bytes' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  primaryType: 'SignedKeyRequest',
  message: {
    requestFid: BigInt(19640),      // ZAO app FID
    key: signerPublicKey,            // from /signer response
    deadline: BigInt(deadline),      // 24 hours from now
  },
});
```

For Path B, use same pattern but with domain `'Farcaster IdRegistryV3'` and message fields `requestFid`, `to`, `recovery`.

### Posting Casts with Managed Signer

Once signer is approved:

```typescript
const res = await fetch('https://api.neynar.com/v2/farcaster/cast', {
  method: 'POST',
  headers: {
    'x-api-key': NEYNAR_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    signer_uuid: userSignerUuid,
    text: 'Hello ZAO!',
    channel_id: 'zao',  // optional
    embeds: [{ url: 'https://sound.xyz/track/...' }],  // optional
    reply_to: { hash: '0xcda4f957...' },  // optional
  }),
});

const castResult = await res.json();
// { success: true, cast: { hash: '0x...', author: {...}, text: '...', timestamp: 1652222800 } }
```

### Cost & Sponsorship (2026)

| Item | Base Cost | Neynar Plan Sponsorship |
|------|-----------|------------------------|
| FID registration | ~$1-5 in Optimism gas | Sponsored on paid plans |
| Storage (1 unit = 5,000 casts) | $7-12 USD | 1 unit free on Hacker+ plans ($59/mo) |
| Signer onchain tx | Small OP gas | Sponsored on paid plans |
| Neynar API | Free: up to 100 signers/month | Hacker: $59/mo, Pro: $249/mo |

**For ZAO:** On Neynar Hacker+ plan ($59/mo), users pay $0. ZAO covers the $59.

### App FID & App Signer Wallet

**App FID:** 19640 (Zaal's Farcaster account @zaal)

**App Signer Wallet:** A dedicated Ethereum account generated at project setup (never a personal wallet):

1. At `npm run dev` startup, `scripts/generate-wallet.ts` creates a fresh keypair if missing.
2. Private key stored in `.env.local` (gitignored).
3. Encrypted backup (AES-256) saved locally for disaster recovery.
4. Wallet signs all EIP-712 requests but never holds significant funds.
5. If leaked, rotate immediately: generate new wallet, re-register signers.

## ZAO Application

1. **Login Flow:** After wallet connection (SIWE), check if user has existing Farcaster. If yes, Path A (QR approval). If no, Path B (direct registration).

2. **Session Storage:** After signer approval, store `{ signer_uuid, fid, username }` in Supabase `auth_sessions` table (encrypted at rest).

3. **Cast Publishing:** Routes `POST /api/farcaster/cast` accept `{ text, channel_id, embeds }` and use `signer_uuid` from session to POST to Neynar.

4. **Auto-Rotate:** If signer expires or leaks, `POST /api/farcaster/signer/revoke` + regenerate.

## Sources

- [Neynar: Write Data with Managed Signers](https://docs.neynar.com/docs/integrate-managed-signers) [FULL] - Complete Next.js example, GitHub repo, EIP-712 signing, API endpoints, sponsorship details
- [Neynar API Readme](https://neynar.readme.io/) [PARTIAL - high-level overview, not detailed signer docs]
- [Medium: Neynar SDK Guide](https://medium.com/coinmonks/how-to-use-the-neynar-sdk-to-build-on-farcaster-webhooks-casts-user-info-a71ec4cbd00d) [PARTIAL - older post, basics covered]
- [standard-crypto/farcaster-js](https://github.com/standard-crypto/farcaster-js) [PARTIAL - alternative SDK, not Neynar-specific]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Integrate Neynar SDK into `src/lib/neynar/managedSigner.ts` | Dev | Code | 2026-05-27 |
| Test Path A (existing FC user) in staging with QR approvals | QA | Testing | 2026-06-01 |
| Test Path B (wallet-only registration) end-to-end | QA | Testing | 2026-06-01 |
| Add signer rotation + revocation helper endpoints | Dev | Code | 2026-06-10 |
