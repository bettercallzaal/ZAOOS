# Neynar FID Registration & Managed Signers

> How to onboard wallet-only users and post casts on their behalf

## Two Paths

| User Type | Flow |
|-----------|------|
| **Has Farcaster account** | Create signer → user approves via Farcaster deep link → done |
| **Wallet only, no Farcaster** | Register FID via Neynar API → signer auto-created → done |

---

## Path A: Existing Farcaster User (Managed Signer)

### Step 1: Create Signer
```
POST https://api.neynar.com/v2/farcaster/signer
Headers: x-api-key: YOUR_KEY
Body: (empty)

Response: { signer_uuid, public_key, status: "pending_approval" }
```

### Step 2: Register Signed Key (Get Approval URL)
```
POST https://api.neynar.com/v2/farcaster/signer/signed_key
Headers: x-api-key: YOUR_KEY
Body: {
  signer_uuid: "...",
  app_fid: YOUR_APP_FID,
  deadline: UNIX_TIMESTAMP,
  signature: "0x..."  // EIP-712 signature from your app's custody address
}

Response: { signer_uuid, status: "pending_approval", signer_approval_url: "https://..." }
```

### Step 3: User Approves
Present `signer_approval_url` to user:
- **Mobile:** Deep link → opens Farcaster app
- **Desktop:** QR code → user scans with Farcaster app

### Step 4: Poll Until Approved
```
GET https://api.neynar.com/v2/farcaster/signer?signer_uuid=...
Headers: x-api-key: YOUR_KEY

Response (when approved): { signer_uuid, status: "approved", fid: 654321 }
```

Poll every 2 seconds, timeout after 2 minutes.

---

## Path B: New User (No Farcaster Account)

### Direct FID Registration
```
POST https://api.neynar.com/v2/farcaster/user
Headers: x-api-key: YOUR_KEY
Body: {
  signature: "0x...",              // EIP-712 signed by user's wallet
  fid: 0,                          // 0 = create new
  requested_user_custody_address: "0xUserWallet",
  deadline: UNIX_TIMESTAMP,
  fname: "desiredusername"
}

Response: {
  success: true,
  signer: { signer_uuid, public_key, status: "approved", fid: 789012 }
}
```

This creates FID + signer in one call. User never needs to open Farcaster app.

---

## EIP-712 Signature Generation

For the signed key request (Step 2 of Path A):

```typescript
const SIGNED_KEY_REQUEST_VALIDATOR = "0x00000000FC700472606ED4fA22623Acf62c60553";

const signature = await walletClient.signTypedData({
  domain: {
    name: "Farcaster SignedKeyRequestValidator",
    version: "1",
    chainId: 10, // Optimism
    verifyingContract: SIGNED_KEY_REQUEST_VALIDATOR,
  },
  types: {
    SignedKeyRequest: [
      { name: "requestFid", type: "uint256" },
      { name: "key", type: "bytes" },
      { name: "deadline", type: "uint256" },
    ],
  },
  primaryType: "SignedKeyRequest",
  message: {
    requestFid: BigInt(APP_FID),
    key: signerPublicKey,
    deadline: BigInt(deadline),
  },
});
```

---

## Posting Casts with Managed Signer

Once you have an approved `signer_uuid`:

```typescript
// Post to /zao channel
const res = await fetch("https://api.neynar.com/v2/farcaster/cast", {
  method: "POST",
  headers: {
    "x-api-key": NEYNAR_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    signer_uuid: userSignerUuid,
    text: "Hello ZAO!",
    channel_id: "zao",
  }),
});
```

---

## Cost

| Item | Cost | Who Pays |
|------|------|----------|
| FID Registration | ~free (gas on OP, very cheap) | Neynar sponsors on paid plans |
| Storage (1 unit = 5,000 casts) | ~$7-12 USD | Neynar sponsors 1 unit on paid plans |
| Signer onchain tx | Small OP gas | Neynar sponsors for managed signers |
| Neynar API | Free: 100 signers/mo. Hacker: $59/mo | ZAO OS pays |
| fname | Free | No cost |

**On Neynar paid plans, users pay nothing.** Neynar sponsors all onchain costs.

---

## Key API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v2/farcaster/signer` | POST | Create managed signer |
| `/v2/farcaster/signer` | GET | Poll signer status |
| `/v2/farcaster/signer/signed_key` | POST | Register key, get approval URL |
| `/v2/farcaster/user` | POST | Register new FID (no Farcaster app needed) |
| `/v2/farcaster/cast` | POST | Post cast with signer_uuid |

All use `x-api-key` header.

---

## UX Flow for ZAO OS

### Existing Farcaster User
```
Login page → "Sign In With Farcaster" → SIWF auth → check allowlist
→ create signer → show approval QR/deep link → poll → approved → /chat
```

### New User (Wallet Only)
```
Login page → "New to Farcaster?" → connect wallet → check wallet on allowlist
→ pick username → sign EIP-712 message → Neynar registers FID + signer → /chat
```

Both paths end with a `signer_uuid` stored in the session, ready to post.

---

## App FID & Signer Wallet

**App FID:** 19640 (Zaal's Farcaster account)

**App Signer Wallet:** A dedicated wallet generated at project init. NOT a personal wallet.

### How it works:
1. At project setup, we auto-generate a fresh Ethereum keypair (viem)
2. Private key stored in `.env.local` (gitignored, never committed)
3. Encrypted backup saved to a local file (AES-256, password-protected)
4. This wallet signs EIP-712 requests for Neynar managed signers
5. It never holds significant funds — just for signing

### Setup script (runs once):
```typescript
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import crypto from "crypto";
import fs from "fs";

// Generate fresh keypair
const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("App Signer Address:", account.address);
console.log("Add to .env.local:");
console.log(`APP_SIGNER_PRIVATE_KEY=${privateKey}`);

// Create encrypted backup
const password = "USER_CHOSEN_PASSWORD"; // prompted at runtime
const cipher = crypto.createCipheriv("aes-256-cbc",
  crypto.scryptSync(password, "salt", 32),
  crypto.randomBytes(16));
// ... save encrypted backup to file
```

### Recovery:
- Primary: `.env.local` on your machine
- Backup: encrypted file (decrypt with password)
- Worst case: generate a new wallet and re-register signers

---

## Key Takeaways

- **Neynar handles all onchain complexity** — no direct contract interaction needed
- **Two paths:** SIWF for existing users, direct registration for new users
- **Managed signers** mean we never touch Ed25519 keys
- **Paid plan recommended** ($59/mo) for sponsored registration + 100+ signers
- **App needs its own FID** for signing key requests
- **Store signer_uuid per user** in Supabase sessions table
