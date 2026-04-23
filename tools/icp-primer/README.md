# ICP Primer (localhost)

A 10-minute primer on Internet Computer Protocol (ICP), built for Zaal
before prompting Caffeine.ai for the ZAO Stock 2026 NFT app.

## What's in it

5 lessons, top-to-bottom:

1. What ICP actually is (read-only)
2. Canisters 101 (live anonymous call to ICP Ledger)
3. Internet Identity live (real passkey login)
4. ICRC-7 NFTs live (real mainnet NFT read)
5. Pay-to-mint pattern (animated walkthrough)

## Run

```bash
cd tools/icp-primer
python3 -m http.server 8765
# open http://localhost:8765
```

That's it. No install. All ICP libraries load from esm.sh CDN.

## Tech

- Plain HTML + ES modules, no build step
- `@dfinity/agent@2`, `@dfinity/auth-client@2`, `@dfinity/candid@2`
- Theme: ZAO navy `#0a1628` + gold `#f5a623`

## Where this came from

- Spec: `docs/superpowers/specs/2026-04-23-icp-primer-localhost-design.md`
- Research context: `research/infrastructure/478-icp-caffeine-nft-purchase/`
