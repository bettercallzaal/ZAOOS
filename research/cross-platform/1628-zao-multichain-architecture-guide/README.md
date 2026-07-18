# 1628 — ZAO Multi-Chain Architecture Guide

**Type:** TECHNICAL-REFERENCE  
**Topic:** Cross-Platform  
**Status:** ACTIVE — Jul 2026. This doc answers the question "which blockchain is ZAO on?" and explains the three-chain architecture. Used in press pitches, grant applications, and onboarding when journalists or researchers ask about ZAO's tech stack. Update when a new chain is added or an existing contract is upgraded.

---

## The One-Line Answer

> ZAO uses three blockchains for three distinct purposes: **Solana** for WaveWarZ battles (high-throughput, low cost), **Optimism** for governance (OREC + ZOR), and **Base** for identity and music NFTs ($ZAO token + ZABAL + ZAO Music).

---

## Chain Map

| Chain | What ZAO Uses It For | Key Contracts / Programs |
|---|---|---|
| **Solana** | WaveWarZ battle settlements, prediction market PDAs, artist payouts | WaveWarZ game program (private); Audius track metadata |
| **Optimism Mainnet** | DAO governance (OREC), Respect tokens (OG ERC-20), ZOR token (ERC-1155) | OG: `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`, ZOR: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`, OREC: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` |
| **Base** | $ZAO ERC-20 identity token, ZABAL token (ERC-20), ZOUNZ (Nouns Builder fork), ZAO Music NFTs | ZABAL: [contract TBD — confirm with Zaal], $ZAO: [confirm address] |
| **Arweave** | Permanent data storage: ZAOOS docs, governance session archives | arweave.net — pinned via Irys (formerly Bundlr) |

---

## Solana: WaveWarZ Battle Layer

**Why Solana:**  
- Sub-$0.001 transaction costs for battle settlements
- High throughput for bonding curve trades (multiple fans trading simultaneously)
- Phantom wallet is the most common wallet among music NFT buyers and the Web3 music audience

**What lives on Solana:**  
- WaveWarZ game program (battle PDAs, prediction token bonding curve)
- Battle settlement transactions (artist payouts, trader claims, charity payouts)
- Audius track references (Audius is Solana-based)

**Key Solana facts for press:**
- "1,245 battles settled on Solana mainnet" (Jul 2026)
- "523.991 SOL ($39,126) in cumulative trading volume"
- "9.09 SOL in guaranteed artist payouts, including losing artists"
- Average per-battle settlement: ~0.42 SOL per battle

**Not on Solana:** ZAO governance — that's Optimism. ZAO identity token — that's Base.

---

## Optimism: Governance Layer

**Why Optimism:**  
- ZAO is an Optimism-native DAO — governance and Respect accumulation has been on Optimism since the beginning
- OP Stack L2: cheaper than L1 Ethereum, fully EVM compatible
- Optimism Retro Funding is a key grant target (doc 1525) — being on Optimism makes ZAO eligible

**What lives on Optimism:**  
- **OREC** (Optimistic Respect-based Executive Contract) — all governance proposals and execution
- **OG ERC-20** (Respect token) — soulbound, accumulates weekly per Fractal session
- **ZOR ERC-1155** — governance participation token for MAIN battle and charity vote eligibility

**Contract addresses:**
- OREC: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`
- OG Respect ERC-20: `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`
- ZOR ERC-1155: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`

**Key Optimism facts for press:**
- "100+ consecutive weekly governance sessions recorded on Optimism Mainnet"
- "157 ZOR token holders as of July 2026"
- ZAO is eligible for Optimism Retro Funding based on governance activity and public goods contributions

---

## Base: Identity and Music Layer

**Why Base:**  
- Coinbase's L2 — lower gas than Ethereum L1, strong DeFi ecosystem
- Sound.xyz and Zora both support Base for music NFT minting
- Base is where most new consumer crypto projects are landing in 2026

**What lives on Base:**  
- **$ZAO ERC-20** — identity/membership token (not governance — that's ZOR on Optimism)
- **ZABAL ERC-20** — ZABAL program token (micro-grants, staking — doc 349)
- **ZOUNZ** — ZAO's Nouns Builder fork on Base (governance for specific ZAO community decisions)
- **ZAO Music NFTs** — Sound.xyz or Zora editions of releases like Cipher (doc 1622)

**Not yet live on Base:** ZAO Music editions (Cipher planned — DECISION NEEDED on Sound.xyz vs Zora)

---

## Arweave: Permanent Data Layer

**Why Arweave:**  
- Permanent storage: a document published to Arweave is accessible forever with a single payment
- ZAO's 1,600+ research docs need permanent accessible storage as the DAO case study
- ZAOOS docs are CC-BY licensed — permanent Arweave storage ensures citation-ability

**What lives on Arweave:**
- ZAOOS research documents (priority: milestone docs, whitepaper, governance session archives)
- WaveWarZ governance session summaries (each session gets an Arweave archive link)
- ZAO whitepaper (doc 1424)

**Arweave access:**
- View: `https://arweave.net/<tx_id>`
- Upload: via Irys (irys.xyz) — ZOE uploads governance session summaries

---

## Cross-Chain Flow: How They Work Together

The full ZAO experience integrates all three chains:

```
Fan buys ZOR token (Optimism)
  → ZOR holder nominates artists for WaveWarZ MAIN (Optimism — OREC)
  → Governance decision recorded on Optimism
  → Zaal creates MAIN battle on WaveWarZ (Solana)
  → Fans trade prediction tokens (Solana — bonding curve)
  → Battle settles, artist payouts fire (Solana)
  → ZOE archives the session summary to Arweave
  → Battle result + tx hash posted to Farcaster /wavewarz
  → Artist uses ZAO Music to release a track linked to the battle (Base — Sound.xyz)
```

**Why this matters for "which blockchain?"**  
ZAO is not on *one* blockchain. Each chain is used for what it does best:  
- Solana = throughput + cheap settlements = battles  
- Optimism = EVM governance + Retro Funding eligibility = DAO decisions  
- Base = consumer NFTs + music distribution = IP and identity

---

## Common Press Confusion and Corrections

| Misconception | Correct statement |
|---|---|
| "WaveWarZ is on Ethereum" | WaveWarZ battles are on Solana. ZAO governance is on Optimism (an Ethereum L2). |
| "ZAO is an Ethereum DAO" | ZAO governs on Optimism Mainnet (an OP Stack L2). The game layer is on Solana. |
| "Base is ZAO's main chain" | Base holds the $ZAO token and music NFTs. Governance is Optimism; battles are Solana. |
| "ZAO switched from Ethereum to Solana" | ZAO never was exclusively on Ethereum. It was always multichain by design. |

---

## For Technical Journalists / Researchers

**Full tech stack:**
- Solana: Anchor framework (Rust) — WaveWarZ game program
- Optimism: Solidity (EVM) — ORDAO framework (OREC, Respect tokens, ZOR)
- Base: Solidity (EVM) — $ZAO ERC-20, ZABAL ERC-20, Nouns Builder fork (ZOUNZ)
- Frontend: Next.js 16 + React 19 + Tailwind (zaoos.com)
- Database: Supabase (Postgres)
- Agent layer: Claude AI (ZOE, ZOL, Hurricane)
- Farcaster: Neynar (signer + cast API)
- Permanent storage: Arweave via Irys

---

## Related Docs

- 1619 — Fractal Democracy Session Guide (Optimism governance in depth)
- 1622 — ZAO Music Cipher Release Plan (Base NFT distribution — Sound.xyz/Zora)
- 1525 — OP Retro Funding Evidence Package (Optimism-specific evidence for RF)
- 1615 — ZOE Architecture and Handoff Spec (agent layer + Neynar)
- 1625 — ZAO Supabase Schema Reference (off-chain data layer)
- 1414 — Helius RPC + Webhook Spec (Solana-side data feeds)
