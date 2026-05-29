# OPS-RUNBOOK - operator real-world steps

These are the steps that require your money, credentials, SSH, and accounts. They cannot be
done by the agent. Do them in order. After each, set the env values noted.

## Phase 0 - provision the Hypersnap read node

Box: 4 vCPU / 16 GB RAM (+32 GB swap) / >=1.5 TB NVMe / public IPv4 / Ubuntu 24.04
(Hetzner dedicated / AX-line is cost-effective).

```bash
# 1. install docker
curl -fsSL https://get.docker.com | sh

# 2. firewall
ufw allow 22/tcp && ufw allow 3381:3383/tcp && ufw allow 3381:3383/udp && ufw enable

# 3. INSPECT the bootstrap script BEFORE running (security)
curl -sSL https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh -o boot.sh
less boot.sh

# 4. run it
mkdir hypersnap && cd hypersnap && bash ../boot.sh
# prompts / .env:
#   AGREE_NO_REWARDS_FOR_ME=true
#   HUB_OPERATOR_FID=<operator FID, e.g. 19640>   # the NODE operator FID, NOT the bot FID
#   FC_NETWORK_ID=1
#   channel=stable

# 5. wait ~2h, then check sync
curl http://localhost:3381/v1/info
# synced when: maxHeight rising AND blockDelay < 100
```

Bootstrap gist (resolved reference): https://gist.github.com/CassOnMars/cbb2007b2bcb713b81da827180d4ffb7

Then set in ZAOOS env:
```
FARCASTER_READ_API_BASE=http://<ip>:3381
FARCASTER_NODE_HTTP=http://<ip>:3381
FARCASTER_NODE_GRPC=<ip>:3383
```

## Verify-before-build (do before Phase 1 code runs for real)

### QKMS Ed25519
1. Log into qconsole.quilibrium.com.
2. Create a key. Confirm key-spec is `ECC_NIST_EDWARDS25519` / Ed25519.
3. If present: set `QKMS_ENDPOINT`, `QKMS_KEY_ID`, `QKMS_CREDENTIALS` and use `SIGNER_BACKEND=qkms`.
4. If absent: use `SIGNER_BACKEND=noble` (default, fully working). Generate a key:
   `node --import tsx scripts/register-signer.ts --gen-key` and store
   `FARCASTER_SIGNER_PRIVATE_KEY` (hex, 32 bytes) somewhere safe.

### Write endpoint (verified - doc 762)
USE the Neynar hub: `FARCASTER_WRITE_API_BASE=https://hub-api.neynar.com`. It is paid per call
via x402 (NOT a bearer key): an `X-PAYMENT` header carrying an EIP-3009 USDC transfer, 0.001
USDC/call on Base to `0xA6a8736f18f383f1cc2d938576933E5eA7Df01A1`. The scripts build this header
automatically (default `FARCASTER_WRITE_MODE=x402`).
- Fund a Base wallet with a few USDC and set `X402_PAYMENT_PRIVATE_KEY` (or reuse
  `CUSTODY_PRIVATE_KEY` if it also holds USDC on Base).
- Alternative: a self-hosted / 3rd-party write-enabled hub with key auth - set
  `FARCASTER_WRITE_MODE=bearer` + `FARCASTER_WRITE_API_KEY`.
- Simpler-but-less-sovereign fallback: Neynar REST `POST /v2/farcaster/cast` with a managed
  `signer_uuid` + `x-api-key` (Neynar holds the signer).

## Phase 1 - bot FID + signer + registration -> first cast

Install deps first (added to package.json; run install at repo root AND in bot/):
```bash
npm install                 # picks up @farcaster/hub-nodejs, viem already present
( cd bot && npm install )   # signer.ts lives in bot/
```

# Verified costs (doc 762): FID registration ~$0.20 (Optimism), add signer ~$0.05 gas,
# each cast 0.001 USDC (Base x402). Fund ~$2-3 total on Optimism for gas + a few USDC on Base.
```bash
# env required:
#   OP_RPC_URL=<Optimism RPC>
#   CUSTODY_PRIVATE_KEY=<secp256k1 custody wallet, funded ~$2-3 on Optimism for gas>
#   SIGNER_BACKEND=noble | qkms                # noble is the day-one path (doc 762)
#   FARCASTER_SIGNER_PRIVATE_KEY=<hex>         # if noble
#   QKMS_* vars                                # if qkms
#   FARCASTER_WRITE_API_BASE=https://hub-api.neynar.com
#   X402_PAYMENT_PRIVATE_KEY=<Base wallet holding USDC>   # for write payment
#   FARCASTER_VERIFY_OK=1                       # after confirming contract addresses

# 1. (if noble + no key yet) generate signer key
node --import tsx scripts/register-signer.ts --gen-key

# 2. register a DEDICATED bot FID (separate from node operator FID) + add the signer key
node --import tsx scripts/register-signer.ts
# -> registers FID via IdGateway (~$0.20), builds EIP-712 SignedKeyRequest,
#    encodes metadata via SignedKeyRequestValidator.encodeMetadata (on-chain),
#    calls KeyGateway.add(1, pubkey, 1, metadata). Prints BOT_FID. Set it:
#   FARCASTER_BOT_FID=<printed fid>

# 3. wait for hub sync (script polls), then post the first cast
node --import tsx scripts/first-cast.ts --text "gm from ZOE - sovereign on Quilibrium"
# -> prints the cast hash. Confirm it appears on Farcaster.
```

## After Phase 1
- Report the first-cast hash.
- Send Cassie the FFX-BETA-REQUEST.md GitHub link (she prefers GitHub over DMs).
- Then the in-repo Phase 2-4 code (caster, registry, ranker, guards, decay) can be wired live.

## Contract addresses (Optimism)
Pull the current IdGateway / KeyGateway / KeyRegistry / SignedKeyRequestValidator addresses
from docs.farcaster.xyz before running - they are set in `scripts/farcaster-contracts.ts`
with a VERIFY note. Do not trust hardcoded addresses without checking the docs.
