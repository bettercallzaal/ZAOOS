# 478 — ICP + Caffeine: Simple NFT Purchase App

> **Status:** Research complete
> **Date:** 2026-04-22
> **Goal:** Pick stack + ship a simple ICP-hosted NFT purchase flow for ZAO, leveraging Caffeine.ai where it saves time.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Platform** | USE Caffeine.ai for v1 UI + app scaffolding. Chat-to-build, Motoko backend auto-generated, deploys to ICP mainnet. Public beta as of Apr 2026, not waitlisted. |
| **NFT standard** | USE ICRC-7 (base) + ICRC-37 (approve) + ICRC-3 (tx log). Equivalent of ERC-721 + ERC-721 approve. Canonical Dfinity recommendation. |
| **Reference canister** | USE `PanIndustrial-Org/icrc_nft.mo` Motoko package. Single canister deploys full collection, already handles minting, transfers, approvals, tx log. |
| **Purchase flow v1** | USE ICP-native pay-to-mint: user sends ICP via NNS wallet / Plug / Internet Identity -> canister verifies transfer -> calls `icrcX_mint` to caller's principal. No EVM dependency. |
| **EVM/Base integration** | SKIP for v1. Caffeine multichain Web3 "coming in 2-3 months" from Jan 2026 per Dfinity forum — still not default. Ship ICP-only first, bridge later if ZAO members ask. |
| **Launchpad shortcut** | SKIP Yumi/Entrepot for this experiment. Worth it IF Zaal wants a drop-in mint page with zero code, but then Caffeine wins on customization + ZAO branding. |
| **Scope for v1** | Ship ONE collection: "ZAO Stock 2026" commemorative NFT (ties to Oct 3 Ellsworth event). 100 supply, fixed price (e.g., 1 ICP ≈ $5-8 as of 2026), no royalties v1. |
| **Integration back to ZAO OS** | Build standalone at e.g. `zaoicp.ic0.app` (ICP subdomain is free). Link from ZAO OS navigation. Don't couple to `community.config.ts` v1 — keep it a separate experiment. |

## Comparison of Options

| Option | Build effort (1-10) | Control | ZAO branding | Purchase UX | Cost to ship |
|--------|---------------------|---------|--------------|-------------|--------------|
| **Caffeine.ai chat-to-build** | 2 | Medium (AI-generated Motoko, editable but rewrite-on-change) | Full | ICP-native, needs prompting for pay-to-mint | Caffeine prompt credits + cycles for canister (~$5-20/mo idle) |
| **Manual Motoko canister (icrc_nft.mo)** | 6 | Full | Full | Full control — custom pay-to-mint in Motoko | ~20h dev + cycles |
| **Yumi launchpad (existing ICP NFT market)** | 1 | Low (their UI, their fees) | Limited (logo only) | Plug wallet, ICP payment | Yumi fees (typically 2-5%) |
| **Skip ICP — mint on Base via existing stack** | 4 | Full | Full (already branded) | Familiar to ZAO members already using Base | Gas + Coinflow (doc 407 already covers fiat-to-mint) |
| **Entrepot (legacy ICP NFT market)** | 1 | Low | Limited | Plug, ICP | Platform fees |

## Why Caffeine Now

Caffeine.ai launched publicly Jul 15 2025 at "Hello, Self-Writing Internet" in SF. By Apr 2026:

- **Public beta, open access.** No waitlist. Sign in, chat, deploy.
- **Backend auto-generated in Motoko** — same language as canonical NFT standard. No cross-language glue.
- **Draft + Live modes** mean Zaal can iterate without breaking the deployed mint page.
- **Data safety guarantees** — "prevents accidental loss during updates" — material for a public-facing purchase app.
- **Web3 guardrails are the current ceiling.** Forum confirms: arbitrary fund-withdrawal ops are blocked, but ledger reads + ICRC mint calls work via careful prompting. Multichain + EVM integration "coming 2-3 months" from Jan 2026 — may or may not land before ZAO Stock Oct 3.

Translation: Caffeine is good enough to ship an ICRC-7 pay-to-mint app in 2026. Not yet good enough to ship a cross-chain / Base-bridge app without manual canister work.

## What ICRC-7 Actually Gives You

Per Dfinity docs + `icrc_nft.mo`:

- `icrcX_mint(token_id, metadata)` — admin-only. Metadata is a map (title, image URI, traits).
- `icrc7_transfer` — owner-to-owner transfer.
- `icrc7_balance_of`, `icrc7_owner_of`, `icrc7_tokens_of` — standard queries.
- `icrc37_approve_tokens` + `icrc37_transfer_from` — approve workflow (optional).
- `icrc3_get_blocks` — full transaction history, on-chain.

**What it does NOT give you:** a purchase primitive. ICRC-7 is mint+transfer. Payment is a separate concern. For v1: the canister receives ICP via the ICP ledger canister, verifies the transfer block, then calls its own `icrcX_mint` to the payer's principal. Pattern is documented and used by Entrepot, Yumi, and most ICP collections.

## Minimum Viable ZAO-on-ICP Flow

```
User (browser, not logged in to ZAO OS)
 -> zaoicp.ic0.app (Caffeine-generated React frontend)
 -> "Connect Internet Identity / Plug"
 -> picks "Mint ZAO Stock 2026 NFT — 1 ICP"
 -> frontend triggers ICP ledger transfer from user principal to canister
 -> canister verifies tx block + calls icrcX_mint(next_id, metadata) to user principal
 -> user sees NFT in wallet + confirmation on page
 -> admin (Zaal) can burn, pause, or end-of-sale trigger from the same canister
```

For Caffeine, the prompt shape is roughly:

> "Build a single-page app that lets a visitor connect Internet Identity, see a hero image of ZAO Stock 2026, and click Mint. On mint, the app accepts 1 ICP from the user, verifies the ledger transfer, and mints them one ICRC-7 NFT from a collection of 100 with image <URL>, title 'ZAO Stock 2026', attribute 'edition = <mint_index>'. Show total minted / 100. Admin page at /admin gated to principal <zaal-principal> with pause + end-sale buttons."

Caffeine will scaffold frontend + Motoko canister. Zaal reviews Motoko output for the pay-to-mint logic (this is the piece the guardrails sometimes water down), and edits via chat if the flow isn't right.

## ZAO Ecosystem Integration

- **Positioning:** commemorative collectible for ZAO Stock 2026 (see [project_zao_stock_confirmed](../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_zao_stock_confirmed.md)): Oct 3 2026, Ellsworth, Franklin St Parklet. 100 supply matches the "official Art of Ellsworth" framing (scarce, local, gift-ready).
- **Why a NEW chain, not Base:** 1) ZAO already has Base merch + staking (`contracts/`). 2) ICP lets the whole stack (frontend, wallet, canister, NFT) live on one chain with free `*.ic0.app` hosting — no Vercel, no Supabase for this experiment. 3) Build-in-public angle: "first ZAO drop on the self-writing internet" plays well on Farcaster.
- **Existing NFT touchpoints in ZAO OS** that this does NOT replace:
  - `src/app/api/members/nfts/` — member NFT read API (Base-chain Alchemy lookups, stays as-is).
  - `community.config.ts` — no entries required for v1; keep it decoupled.
  - `research/music/407-music-nft-coinflow-fiat-mint/` — Base + Coinflow fiat mint flow, still the recommendation for music-release NFTs.
- **Content angle:** every step documented per `feedback_build_public.md` — Caffeine prompts, canister code, mint UX screenshots all go to Farcaster + LinkedIn via `/socials`.
- **Auth note:** Internet Identity is separate from the ZAO OS iron-session flow. First ICP drop lives outside ZAO OS auth entirely. Later integration = ICP principal on member profile (out of v1 scope).

## Risks + Open Questions

| Risk | Mitigation |
|------|------------|
| Caffeine guardrails block pay-to-mint logic | Fall back to editing the Motoko output directly (Caffeine exposes canister code) or deploy manually with `icrc_nft.mo` template |
| ICP price volatility — "1 ICP" doesn't equal USD | Set price in USD, quote ICP dynamically via ledger oracle, OR fix at 1 ICP and communicate USD range in marketing |
| ZAO members don't have ICP wallets | Include "how to buy ICP + use Internet Identity" onboarding. ZAO Stock event = live helper station |
| Caffeine apps rewrite on change, losing custom edits | Commit the generated Motoko to a GitHub repo after each stable build; redeploy from repo if Caffeine breaks it |
| No EVM bridge means non-ICP holders can't participate | Accept limitation for v1; offer secondary USD/Base path at the event via Coinflow (doc 407 stack) |

## Next Actions (if Zaal greenlights)

1. Spin up a free Caffeine account, prompt the app as scaffold above. Difficulty 2/10.
2. Review generated Motoko against `icrc_nft.mo` reference. Patch pay-to-mint if the AI watered it down. Difficulty 4/10.
3. Deploy to ICP mainnet. Buy ~$20 of cycles. Difficulty 2/10.
4. Create ZAO Stock 2026 art asset (1 hero image + 100 generative variants, or 1 static image with edition number overlay). Difficulty 3/10 for single static, 6/10 for generative.
5. Soft-launch to ZAO core 10-20 members for feedback. Difficulty 1/10.
6. Public launch pre-ZAO Stock (late Sep 2026) with Farcaster + LinkedIn drop. Difficulty 2/10.

Total difficulty: ~4/10 weekend build if Caffeine does most of the lifting.

## Warm-up: Local ICP Primer

Before prompting Caffeine, run the local primer at `tools/icp-primer/`:

```bash
cd tools/icp-primer && python3 -m http.server 8765
# open http://localhost:8765
```

5 lessons in ~10 minutes: what ICP is, canisters, live Internet Identity login, live ICRC-7 NFT read, pay-to-mint walkthrough. Spec at `docs/superpowers/specs/2026-04-23-icp-primer-localhost-design.md`. Plan at `docs/superpowers/plans/2026-04-23-icp-primer-localhost.md`.

## Sources

- [Caffeine.ai official](https://caffeine.ai/)
- [Caffeine ecosystem spotlight - internetcomputer.org](https://internetcomputer.org/ecosystem-spotlight/caffeine/)
- [Launch an NFT collection on ICP (Dfinity docs)](https://docs.internetcomputer.org/defi/nft-collections)
- [NFT tutorial 5.4 - Dfinity Developer Liftoff](https://docs.internetcomputer.org/tutorials/developer-liftoff/level-5/5.4-NFT-tutorial)
- [icrc_nft.mo reference package](https://github.com/PanIndustrial-Org/icrc_nft.mo)
- [Caffeine Multichain forum thread (Jan 2026)](https://forum.dfinity.org/t/caffeine-ai-multichain-with-smart-contract-functionality/63249)
- [ICRC-7 + ICRC-37 NNS proposal thread](https://forum.dfinity.org/t/nft-standards-icrc-7-and-icrc-37-ready-for-nns-vote/29618)
- [ICP Caffeine launch coverage - CoinDesk](https://www.coindesk.com/markets/2025/07/13/icp-jumps-4-as-launch-of-ai-powered-self-writing-web3-apps-platform-caffeine-nears)
- Related internal: `research/music/407-music-nft-coinflow-fiat-mint/`
- Related internal: `research/business/474-foundercheck-block-icp-resolution/` (note: different ICP — Ideal Customer Profile, not Internet Computer)
