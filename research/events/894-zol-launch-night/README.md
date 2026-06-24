---
topic: events
type: incident-postmortem
status: research-complete
last-validated: 2026-06-24
superseded-by:
related-docs: 891, 892, 893, 762
original-query: "Ship log: bring ZOL (@zolbot) live on Farcaster from the Pi - account, profile, first cast, signer rotation, Bonfire memory, overnight automation - plus the costs, gotchas, and security audit from launch night 2026-06-23/24."
tier: STANDARD
---

# 894 - ZOL Launch Night (Ship Log, 2026-06-23/24)

> **Goal:** Record how ZOL (@zolbot), the ZAO music-scout agent, went live on Farcaster from the Raspberry Pi - what shipped, what it cost, the gotchas, and the security audit. Companion to the ZOL design cluster: [891](../../agents/891-farcaster-agentic-bootcamp-zol/) (build plan), [892](../../farcaster/892-being-an-agent-on-farcaster-2026/) (landscape), [893](../../music/893-zol-music-native-farcaster-agent/) (niche + persona).

## What shipped

| Thing | Result |
|-------|--------|
| Farcaster account | **FID 3338501**, registered on Optimism |
| Username | **@zolbot** (ZABAL Opinion Leader), claimed free on the fname server |
| Profile | display "ZOL", bio, pfp = the ZABAL GAMEZ arcade logo |
| First cast | posted + verified (`0xd30f296c...`) |
| Signer | Ed25519, **rotated** after a leak (old key removed on-chain) |
| Wallet | burner `0x5A3F9a4f20e602eeaa03019F863fcA249f452D22`, ~2 USDC float |
| Memory | ZABAL Bonfire graph wired into cast drafting (PR #957) |
| Overnight automation | follow-from-Zaal's-network + trend research + 5 drafts (`~/zol/overnight_report.md`) |
| Watcher | ZOE pings Telegram on run completion + @zolbot mentions |
| Clicking stack | Playwright + system Chromium on the Pi (for mini-app/frame automation) |

Tooling: `rishavmukherji/farcaster-agent` (MIT) for register/profile/cast, at `~/zol/farcaster-agent` on the Pi. Keys in 600 files (`~/zol/.zol-wallet-key`, `~/.openclaw/farcaster-credentials.json`).

## Gotchas + findings (the useful part)

1. **FID registration is on Optimism, not Base.** Funds sent to Base have plenty of *value* but can't register - it's a chain-routing issue, not an amount issue. The toolkit's auto-bridge pads to ~0.005 ETH and times its register before the bridge lands, so it fails. The clean path: send a sliver of ETH directly on Optimism + run `register-fid` (reads the real on-chain price).
2. **Real FID price is tiny: ~0.00012 ETH (~$0.18).** The toolkit's "needs 0.002+ ETH" is padding. Verified via `idGateway.price()`.
3. **Neynar raised the x402 write price 0.001 -> 0.01 USDC.** Every hub write (profile, cast, follow) is x402-paid; the "exact" scheme rejects underpayment with "Failed to verify payment: Bad Request". The toolkit AND ZAO's `farcaster/x402.ts` both still defaulted to 0.001 - fixed in PR #958. This was the single blocker that made profile/cast writes fail until bumped.
4. **Bridging tiny amounts (~$2) Base->Optimism does not work** - the Across relayer fee falls below the relayer's gas cost, so no one fills it. Send direct on the target chain instead.
5. **The toolkit prints the signer private key to stdout** (`add-signer`) - that leaked the first signer. Fix: rotate via a wrapper that suppresses any "private key" line and writes the new key only to the creds file. Old key removed on-chain with `KeyRegistry.remove`.
6. **fname claim is free + off-chain** (a signature to `fnames.farcaster.xyz/transfers`); only the USER_DATA writes (display/bio/pfp/username-link) cost x402.
7. **haatz (free hub mirror) is flaky** - reads intermittently return empty; add retries.

## Costs

- FID registration: ~$0.18 + gas (~$0.30 total)
- Profile (4 writes) + first cast: ~0.05 USDC
- Each follow: 0.01 USDC (x402)
- Net cash spent on the whole launch: **~$0.35**; leftover ETH swept back to zaal.eth.

## Security audit (launch night)

- **RESOLVED:** leaked signer (rotated + old removed); x402 underpayment (fixed).
- **HIGH - no key backup:** the custody key + mnemonic exist only on the Pi's SD card. Lose it = lose @zolbot. **Action: back up `~/zol/.zol-wallet-mnemonic` off-Pi.**
- **MEDIUM:** single hot custody key controls account + funds (mitigated by tiny float; move spend to a Privy signer with a cap long-term).
- **MEDIUM:** single Pi = single point of failure (home NAT, no failover).
- **LOW/MED:** 30 follows/night from a fresh account is a mild bot-tell; mitigated by sourcing from Zaal's network, quality-gating, and 15-20 min spacing.
- **By design (safe):** nothing casts unsupervised - the approval gate is intact.

## Strategic note

The real limiter is **distribution**: @zolbot is brand new (0 followers) and verified research shows Farcaster declining (~40% DAU drop post-Neynar-acquisition). The tooling is solved; reach is the open problem. Decide ZOL's distribution strategy before heavy further investment.

## Also See

- [Doc 891](../../agents/891-farcaster-agentic-bootcamp-zol/) - ZOL build plan
- [Doc 892](../../farcaster/892-being-an-agent-on-farcaster-2026/) - agent-on-Farcaster landscape
- [Doc 893](../../music/893-zol-music-native-farcaster-agent/) - ZOL niche + persona
- [Doc 762](../../farcaster/762-quilibrium-stack-verification/) - x402 write hub + signer verdict

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Back up `~/zol/.zol-wallet-mnemonic` off the Pi | @Zaal | Action | ASAP (HIGH) |
| Merge the ZOL PR stack (#957 Bonfire memory, #958 x402 fix) | @Zaal | PR merge | When reviewed |
| Decide ZOL distribution strategy (Farcaster-only vs multi-channel) | @Zaal | Decision | Before scaling |
| Move ZOL spend to a Privy signer + cap (de-risk the hot key) | @Zaal | Build | Phase 2 |
| Build the approval-gated mention-reply pipeline once @zolbot gets inbound | @Zaal | Build | When it has mentions |

## Sources

- **[FULL - first-hand]** Launch operations on the Pi (ansuz) + on-chain txs, 2026-06-23/24: register `0x09dbc8...`, signer add `0x91812cc4`, signer rotate/remove `0xe81a6f9d`, first cast `0xd30f296c`, fname transfer id 1442988.
- **[FULL]** `idGateway.price()` live read (Optimism) = 0.00011982 ETH
- **[FULL]** Neynar x402 hub `accepts` response: maxAmountRequired 10000 (0.01 USDC), payTo Neynar, Base USDC
- **[FULL - codebase]** `bot/src/zoe/farcaster/{x402,signer,write}.ts`, `bot/src/zoe/caster/reason.ts` (PR #957), `~/zol/farcaster-agent/*` (Pi)
