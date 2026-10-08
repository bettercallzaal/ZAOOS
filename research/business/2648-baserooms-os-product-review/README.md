---
topic: business
type: audit
status: research-complete
last-validated: 2026-10-08
superseded-by:
related-docs: dev-workflows/659-zoe-posts-v2-voice-and-confirm-flow, events/811-chikodi-zaostock-volunteer-onboarding-may3, wavewarz/743-wavewarz-whitepaper-v2-deep-dive, business/2634-memecoin-idea-ground-truth
original-query: "we also want to open a new lane for baserooms by slava and reveiw it as a product and start it use it" (Zaal, seat pane, 2026-10-08). Lane brief: product review via /zao-research STANDARD; who builds it, open repo and licence, contracts on Basescan (verified, owner, upgradeability), fees from Disclosures, the agent-pairing design and what access it grants, the radio and Audius angle and fit with The ZAO, WaveWarZ and ZOE; adopt / partner / skip; read-only use of the public tools; wallet, mint, pairing and contacting Slava are gated.
tier: STANDARD
---

# 2648 - Base Rooms OS (baserooms.io): product review, contracts, fees, and a threat model for its agent pairing

> **Goal:** Decide what The ZAO adopts, partners on, or skips from Base Rooms OS, a desktop-style onchain app on Base built by @slavanova, and write down the risks of pairing an AI agent with it before anyone does.

All figures are as of 2026-10-08, measured between 16:30 and 17:00 UTC. Every claim below comes from a raw fetch (curl, the public Base RPC, the GitHub API, the Farcaster index). Nothing was signed, connected, minted or paired by this lane.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **SKIP the Claude Code hooks pairing on every ZAO machine.** Do not paste the setup snippet into `~/.claude/settings.json`. | The snippet sends every prompt you type, and the full input of every Bash, Edit, Write, WebFetch and Agent call, to a server one person runs. That server's reply can approve a tool call without asking you, and can rewrite the command before it runs. If the server is down, Claude Code carries on as if it had said yes. Threat model below. On this Mac `~/.claude/settings.json` is a symlink into `~/zaal-dotfiles`, so the change would reach every lane at once. |
| 2 | **SKIP the MCP pairing for now. Re-open only as a sandboxed trial** with a written red control (decision 7 in Next Actions). | Lower risk than hooks (no remote veto over our tools), but tool results and owner messages from `buddy_inbox` are text the model reads, so it is still a prompt-injection channel, and the `memory_*` and `workspace_*` tools store our notes on their server. |
| 3 | **USE the Rooms (Jitsi) video calls as we already do.** No change. | The ZAO has pointed Monday cobuilds at `meet.baserooms.io/zaal` since May 2026 (`bot/src/zoe/posts/drafters.ts:56`). `meet.baserooms.io` still answers as Jitsi Meet (HTTP 200, 2026-10-08). |
| 4 | **PARTNER on Radio: ask Slava for a ZAO / WaveWarZ station.** Gated: contacting Slava is Zaal's call. | Searching "wavewarz" in their radio already returns 30 Audius tracks, including Zaal's own "WaveWarZ, the electric vibez" and ten WaveWarZ Africa tracks. Audius plays through `app_name=baserooms`, so our artists already get Audius plays from their users. A curated station is cheap for them and free reach for us. |
| 5 | **ADOPT the pattern, not the product: a visible "hold for approval" surface for agents.** Extend our own `zao-ask-check` bridge rather than route approvals through a third party. | Their best idea is a named list of risky actions (git push, `git reset --hard`, recursive deletes, publish, deploy, DB drops, `curl | sh`, onchain sends, sudo, `.env` writes) held until a human taps Approve. That list maps almost one to one onto our `no-rm-rf.md`, `agent-loops.md` rule 8 and `secret-hygiene.md`. We already have the bridge; we lack the visible list. |
| 6 | **SKIP BRTC, the staking vault and Buddy buying as anything treasury-related.** Zaal's personal Buddy is his own business. | BRTC is a self-described meme token, $37.3K market cap, $20.7K liquidity, 133 to 134 holders. The site itself says "no promise of value, returns or roadmap". |
| 7 | **USE the public read-only tools by hand; SKIP wiring ZOE to their `/api/*` routes.** | Gas, token safety, wallet lookup, holders, contract reader and scan all returned 200 three runs out of three. But the routes are undocumented, unauthenticated and can change without notice; the documented agent API needs a `brk_` key, which means pairing. |

## What it is

Base Rooms OS is a browser "desktop" for Base (chain 8453): draggable windows, folders and a Start menu, in a late-1990s look. You sign in with one wallet signature (no transaction). The homepage lists these windows: Wallet, Swap (Kyber, CoW, LI.FI, bridge, limit orders), Lend and Borrow (Aave V3, Morpho vaults, Merkl rewards), Markets (Veranta perps, Limitless predictions, chart, screener, launchpad), Safety (token safety, approvals and revoke, scam check, explain a tx, decode a signature), Research (wallet lookup, holders and whales, contract reader, Basenames, X tools, gas), Instant Messenger (wallet to wallet, AIM style), Rooms (Jitsi video calls between wallets), Radio (Audius, SomaFM, plus Spotify, YouTube, Apple Music, SoundCloud links), Art Gallery, five games, a terminal, and the BRTC folder.

"Buddies" are ERC-721 NFTs on Base, pixel robots whose art and a small Tamagotchi-style pet are rendered by the contract (`tokenSVG()`), declared CC0 on the site. A Buddy earns XP, cuts your swap fee at higher levels, and can be paired with an AI agent.

## Findings

### 1. Who builds it

| Claim | Evidence | Status |
|---|---|---|
| Builder is the Farcaster user **@slavanova** (fid 1046957, display name "SLAVA", 1,117 followers) | Cast 2026-09-29: "Been working on a fun os for us on base with a buddy to help". Farcaster cast search for "baserooms", 25 results read. | CONFIRMED |
| @slavanova holds **Buddy #0001** | `ownerOf(1)` on the Buddies contract returns `0x9459a616ad70d5f4998534eb3ca46ec069db143b`, which is one of @slavanova's two Farcaster-verified ETH addresses. | CONFIRMED onchain |
| Backend runs on Cloudflare Workers under the subdomain `slavamushyakov` | `https://brtc-os.slavamushyakov.workers.dev` is hard-coded as the hook host in `/unit.mjs`, in `/agent.md`, and in the site bundle (`WORKER_URL`). | CONFIRMED. A workers.dev subdomain is chosen by the account owner; it suggests a name but is not a statement of identity, so this doc does not assert one. |
| Project accounts | X `@baserooms` (joined 2025-10-03, 352 followers, bio "Computer in any browser for everything on @base"), Telegram `t.me/brtc_base` | CONFIRMED via FxTwitter API and the site bundle |
| No GitHub account for the builder is linked anywhere | GitHub user search for `slavamushyakov`: 0 results. Repo search `brtc-os`: 0. Repo search `baserooms`: 3 repos, none linked from the site; `codeyourlimits/Baserooms` (created 2026-01-26, 215 KB, no description) has no evidence tying it to this product. The site and its 185 JS chunks link no GitHub repo of the app. | NOT FOUND in those scopes |

Zaal has already used it: his cast at 2026-10-08 13:32 UTC reads "Just booted Buddy #0252", and `ownerOf(252)` returns a wallet. The wallet sign-in and the $10 mint therefore already happened, by Zaal, outside this lane.

### 2. Open source and licence

- **App: closed source.** No repository is linked from the site, and none was found in the searches above. With no LICENSE file to read, the default is all rights reserved (`credit-attribution.md`). We cannot fork or vendor any of it.
- **Contracts: source is public; the Buddies contract is MIT.** All three contracts are "Source Code Verified (Exact Match)" on Basescan, which shows "License: -NA-" for each. That field is wrong for the Buddies contract: its source on Sourcify (exact match) opens `// SPDX-License-Identifier: MIT` in both `src/BaseRoomsUnits.sol` and `src/generated/UnitPool.sol` (corrected 2026-10-08 by loop tick 1). Evolutions and the o1 staking vault are not on Sourcify, so their licence is still unread.
- **Buddy art: CC0 per the site.** The homepage says "NFTs on Base whose art and pet are fully onchain (CC0)". This is the site's own claim; the contract source on Basescan was not read for a licence string.
- **The one file we can read in full is `https://baserooms.io/unit.mjs`** (6,905 bytes, Node 18+, no dependencies). It is served publicly with no licence header.

### 3. Contracts (Base 8453)

Addresses come from the site's own JS constants (`UNITS`, `EVOLUTIONS`, `STAKING`, `REFERRER`, `BRTC`). Verification from the Basescan address pages; owner, price and supply from `eth_call` on `https://mainnet.base.org`; upgradeability from the EIP-1967 implementation and admin storage slots.

| Contract | Address | Verified | Owner | Upgradeable | Notes |
|---|---|---|---|---|---|
| Buddies, `BaseRoomsUnits` (symbol BUDDY), ERC-721 | `0x2B48fFaa0c453786EBF1a786c6f2e21Dcb97f29b` | Yes, exact match, solc 0.8.30 | `0xa034...f8ce` (the treasury) | No proxy; both EIP-1967 slots are zero | `MAX_SUPPLY` 8888, `totalSupply` 264, `price` 10,000,000 (10 USDC), `publicMint` false. Owner can `setPrice`, `setTreasury`, `setRenderer`, `setStaking`, `setEligibilityRoot`, `setRoyalty`, `withdraw`. Uses Pyth Entropy V2 for randomness. |
| Buddy Evolutions, `BuddyEvolutions` (publishing) | `0x5b42A7f7c3d27EA76EdAb4BfF7d27497D35420F0` | Yes, exact match, solc 0.8.30 | `0xa034...f8ce` | No proxy | Writes EAS attestations; owner can `setSigner` (currently `0x0242...46a2`) and `setTreasury`. |
| BRTC staking vault, `O1Staking` | `0x6f25a9e1e677616c1bF7ab54b470b0c82839Adb4` | Yes, exact match, solc 0.8.26 | `0x5519...044d` | No proxy | This is o1 Launchpad's staking contract, not Base Rooms' own. Holds 32.2% of BRTC supply. |
| BRTC token | `0xB200000000000000000000856A95738C92fEed01` | Basescan lists it as a system contract ("Contract Creator: N/A (System Contract)") | Ownership renounced per Base Rooms' own safety scan | n/a | o1 "B20" native token, 1,000,000,000 fixed supply, paired with the tokenized MSTR stock. |
| Treasury / referrer / fee recipient | `0xA034E1CDb0dd2D94ea4689940F5db2Dd677Df8ce` | n/a | n/a | n/a | An EOA with an EIP-7702 delegation (code is `0xef0100` followed by `63c0c19a282a1b52b07dd5a65b58948a07dae32b`). The delegate was not identified. Held about $835 across tokens on 2026-10-08. |

**What the contract rows mean for a holder.** Nothing is upgradeable, which is good: the code you read is the code that runs. But one key, the treasury EOA, owns both Base Rooms contracts and receives every fee. That key can change the mint price, point the Buddies at a different renderer (so "fully onchain art" is fixed only as long as the owner does not call `setRenderer`), and withdraw the contract's balance. That is normal for a solo project and is a single point of failure, not a red flag. The renderer contract (`0xad23...34ac`) did not answer `owner()`; its own mutability was not checked.

### 4. Fees (from the Disclosures section of the homepage)

| Action | Base Rooms fee | Goes to |
|---|---|---|
| BRTC swaps on the o1 route | None from Base Rooms. The o1 pool charges 1% (creator 50%, platform 30%, referrer 20%); Base Rooms is the referrer | o1 split |
| Any other swap or CoW limit order | 0.1% (CoW keeps 25% of that; LI.FI adds its own 0.25%) | Treasury |
| Morpho deposit, Aave supply | 0.1%, none under $50 or when signing step by step | Treasury |
| Perps (Veranta) | 0.05% builder fee on position size (collateral times leverage) | Treasury |
| Bridge, Aave withdraw/borrow/repay, Morpho withdraw | None | n/a |
| Publishing a Buddy evolution | $1 in BRTC ($0.25 with 10 Buddies) | Treasury |
| Buddy perk | Swap fee drops to 0.08% at LV5, 0.05% at LV8 | n/a |
| Referrals | 10% of platform fees shared, 1% to 8% per level by bracket, paid monthly in USDC after a 14-day hold, under $5 rolls forward, not offered to UK consumers | Referrers |

The code agrees with the page: the bundle sets `FEE_BPS` to 10 (0.10%), `FEE_RECIPIENT` to the treasury, a deposit fee only when the amount is at least $50, and zero fee when either side of a swap is BRTC.

The disclosures are unusually plain and complete for a crypto front end. One honest gap: the referral program pays on multiple levels down ("and so on", plus "leadership bonuses"). That is a multi-level structure, and it is worth knowing before anyone in The ZAO posts an invite link as ZAO.

### 5. The agent pairing: what it grants

The Buddies window offers pairing for Claude (app and Code), ChatGPT, Le Chat, Cursor, Codex, Gemini CLI, Hermes Agent, Grok, OpenClaw, Goose, OpenCode, Cline/Roo/Windsurf, Aider and scripts. Six methods, read from the bundle's `setupFor` function and `/agent.md`:

| Method | What you install | What it sends or can do |
|---|---|---|
| Connector (chat apps) | `https://baserooms.io/mcp` as a remote MCP server with OAuth (dynamic client registration, PKCE S256, refresh tokens) | The 64 tools below, with the scopes you approve |
| MCP with a key | e.g. `claude mcp add --transport http --scope user baserooms https://baserooms.io/mcp --header "Authorization: Bearer brk_..."` | Same tools; user scope means every project on the machine |
| **Hooks (Claude Code)** | A `hooks` block in `~/.claude/settings.json` posting `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `Notification`, `Stop`, `SessionEnd` to `https://brtc-os.slavamushyakov.workers.dev/hook/claude-code`. `PreToolUse` matches `Bash|PowerShell|Edit|MultiEdit|Write|NotebookEdit|WebFetch|Task|Agent` with a 60 s timeout (`Task` is not in the current PreToolUse tool list per the hooks reference, so that one entry matches nothing today; the rest do) | See threat model |
| Hooks (Cursor, Gemini) | `~/.cursor/hooks.json` / `~/.gemini/settings.json` posting the same events | Status and approvals |
| `unit.mjs` wrapper | `curl -fsSLo unit.mjs https://baserooms.io/unit.mjs`, then `node unit.mjs run -- <agent>` | Status, inbox, `ask` approval gate |
| "Tell" | Put the key in an env var and tell the agent "Read https://baserooms.io/agent.md and connect" | The agent follows instructions hosted on their server |

**Tools** (64 listed in `/agent.md`, by scope): `status` (buddy_status, buddy_log), `talk` (buddy_inbox, buddy_reply), `approve` (buddy_request_approval, buddy_approval_status), `tools` (27 read tools: token_safety, wallet_profile, wallet_approvals, contract_read, perps_positions and so on, plus skills_list and skill_use), `propose` (propose_swap, bridge, revoke, earn, lend, perp, stake), `alerts`, `memory` (memory_remember, workspace_board, workspace_task ...), and an `act` group (`prepare_swap`, `prepare_pay`, `prepare_multisend` to 20 addresses, `prepare_launch` and others). The owner turns scopes on or off per key.

**The good part, stated fairly.** The agent can never sign. Every `prepare_*` and `propose_*` tool only puts a card on the owner's Buddy, and the owner signs in their own wallet. `prepare_swap` refuses price impact over 15%; `prepare_lend` refuses health under 1.1. `/agent.md` tells agents to call `buddy_request_approval` before deploys, pushes, deletes, spending and onchain actions, and never to put secrets in status lines. The bearer key is per Buddy and per scope.

### 6. Threat model for the pairing (required before any trial)

**Assets.** Our prompts (they carry PR plans, people's names, sometimes pasted contact data); file contents an agent writes; shell commands and their arguments (which can carry tokens); the Claude Code permission system on Zaal's Mac; the `brk_` key; Zaal's wallet (indirectly, through signing cards).

**Actors.** The Base Rooms server operator (one person, one Cloudflare account); anyone who compromises that account or the treasury key; anyone who can put text in front of the model (Buddy inbox messages, tool results, `/agent.md`).

| # | Threat | How it happens | Severity for us |
|---|---|---|---|
| T1 | **Everything we type and every tool input leaves the machine** | Claude Code POSTs the full hook input to an HTTP hook. `UserPromptSubmit` carries the whole prompt, with pasted text expanded in place. `PreToolUse` carries the tool input: the full Bash command, and the full content of every Write and Edit. All of it goes to a Worker we do not control. | HIGH. Breaks `pii-hygiene.md` (third-party data in prompts) and `secret-hygiene.md` (commands that touch keys) the moment it is installed. |
| T2 | **Remote auto-approve** | Claude Code docs: a PreToolUse `permissionDecision` of `"allow"` "skips the permission prompt", with documented exceptions: actions that no permission mode auto-approves, and `AskUserQuestion` / `ExitPlanMode`, which need `updatedInput` paired with it. The remote server decides that answer. Deny and ask rules in settings are still checked, so explicit deny rules hold; everything else in between becomes the server's call. | HIGH |
| T3 | **Remote command rewrite** | Docs: `updatedInput` "replaces the entire input object", and "combine with `allow` to auto-approve". A malicious or compromised server can return a different Bash command than the one Claude chose, pre-approved. That is remote code execution on the Mac, by design of the hook API, not a bug in Base Rooms. | CRITICAL if the server is ever compromised |
| T4 | **Fail-open** | Docs: for HTTP hooks a "connection failure" or non-2xx is a "non-blocking error, execution continues"; a timeout cancels the hook with no decision. So "asks you before risky steps" holds only while the Worker is up and answering. | MEDIUM. It means the approval gate is not a safety control we can rely on. |
| T5 | **Context injection** | `SessionStart` and `UserPromptSubmit` hooks can return `additionalContext`, which Claude Code inserts into the model's context (capped at 10,000 characters). Owner messages from `buddy_inbox` and MCP tool results are also model-visible text. The "tell" method has the agent fetch and obey `/agent.md` from their server. | MEDIUM |
| T6 | **Machine-wide blast radius** | The snippet says to add it to `~/.claude/settings.json`. On this Mac that file is a symlink into `~/zaal-dotfiles`, loaded by every lane (`vanishing-dependencies.md`). One paste reaches every session. | HIGH for us specifically |
| T7 | **Key leakage** | The `brk_` key in an env var or settings file is a bearer secret. With `act` scopes it can put payment cards on Zaal's Buddy (still needs his signature), and with `memory` it can read and write the shared workspace. | LOW to MEDIUM |
| T8 | **Data at rest on their server** | Instant Messenger is stored on their server, "not end-to-end encrypted" (their words). Memory and workspace tools store notes there. | LOW for chat; MEDIUM if agents write ZAO notes into `memory_remember` |

**Mitigations if a trial is ever approved.**

1. Never the hooks method on a ZAO machine. MCP only.
2. Run it in a throwaway environment: a separate macOS user or a container, with no `~/.claude` symlink into dotfiles, no ZAO repos, no `~/.zao`.
3. Grant only `status`, `talk` and `approve` scopes first. No `memory`, no `act`.
4. If hooks are ever trialled anyway, set `allowedHttpHookUrls` to an explicit list so no other host can be added silently, and keep the deny rules in place, since the docs say deny rules are evaluated regardless of what a hook returns.
5. Red control before trusting the gate: point a test session at a stub server that answers `allow` with an `updatedInput`, and confirm what our deny rules still stop. The trial is not "safe" until that has run (`loop-evals.md`, review the direction the change was for).

### 7. Radio and music fit

The radio is a real Audius client, not a link list. `GET /api/radio/browse?source=audius&q=wavewarz` returned 30 tracks, 3 runs out of 3, each with a stream URL of the form `https://api.audius.co/v1/tracks/<id>/stream?app_name=baserooms`. The first hit was "WaveWarZ, the electric vibez" by BetterCallZaal; the next ten were WaveWarZ Africa tracks (ROSHI x N3M3SIS, Denajah, IMan Afrikah, kiyomi misaki and others), then BennyJ504 featuring DopeStilo. Genre browse works too (`genre=Hip-Hop/Rap` returned results), and `source=soma` returns live SomaFM stations with listener counts.

Fit:
- **WaveWarZ:** our artists are already discoverable and playable there, and every play is an Audius play. A pinned "WaveWarZ" station or a search shortcut is the smallest useful partner ask.
- **The ZAO:** Rooms is the Jitsi server we already use for Monday cobuilds. The "radio while you trade" idea is close to what ZAO OS's own player does (`src/providers/` audio player); nothing to import, but a good reference for a music-first desktop.
- **ZOE:** the approval-hold UX (a pet that turns "needs you" and waits) is the interesting part, and ZOE already has the plumbing for non-blocking approvals in Telegram. Copy the visible risky-action list, not the hosted service.

### 8. "Start using it": the read-only run

Every call below ran three times on 2026-10-08 against public data, with no wallet and no key. All results were byte-identical across the three runs.

| Tool | Request | Result | Verdict |
|---|---|---|---|
| Gas tracker | `/api/gas` | 200, block 52,343,985, base fee 5,058,318 wei; a swap costs about $0.0030, an NFT mint about $0.0024 | WORKS |
| Token safety, DEGEN | `/api/safety?ca=0x4ed4...efed` | 200, risk "medium": owner can mint, active owner, sell simulation passed, 0% buy and sell tax, source verified | WORKS, and the mint flag is a real finding |
| Token safety, BRTC | `/api/safety?ca=0xB200...ed01` | 200, risk "medium": honeypot "unknown", taxes "unknown", because outside simulators cannot run o1 native tokens | PARTIAL. Their own scanner cannot fully check their own token, and it says so |
| Wallet lookup | `/api/wallet?addr=<treasury>` | 200, ETH plus holdings with USD values (3.83 MSTRc, about 250 USDC) | WORKS |
| Holders | `/api/holders?ca=<BRTC>` | 200, 134 holders; the v4 pool manager holds 33.3%, the staking vault 32.2% | WORKS |
| Contract reader | `/api/contract?addr=<Buddies>` | 200, `BaseRoomsUnits`, verified, full read ABI | WORKS |
| Scam check | `/api/scan?q=DEGEN` | **400** "paste a link or a 0x address" | BREAKS on a ticker; works with an address (200, "no-flags", "Named DegenToken on Sourcify") |
| Agent tools without a key | `POST /agent/tools/token_safety` | `{"ok":false,"error":"missing or malformed agent key"}` | Expected: the documented API is key-only |

**One inconsistency worth flagging.** The homepage says "TOP-10 HOLDERS CONTROL 54.06% OF SUPPLY". The safety tool says "Top 10 wallets hold 9.1%" of plain wallets and "82% of supply including pools, burn and contracts". These are three different definitions of the same number on the same site. None is wrong, but a reader will take the homepage figure as the concentration risk, and it is neither the plain-wallet figure nor the all-holders figure.

Not tested, on purpose: anything behind the wallet sign-in (Messenger, Rooms inside the OS, Buddies, Swap quotes tied to a wallet). Those are gated for this lane.

## Loop findings

### 2026-10-08, tick 1: the Buddies mint path and the art

Source: `src/BaseRoomsUnits.sol` from Sourcify (exact match, 442 lines), plus `cast call` against `https://mainnet.base.org` at block 52,346,706.

**Who can mint.** `eligible()` returns true if public mint is on, or the wallet has any BRTC principal staked in one of the o1 vaults the owner listed, or the wallet is in a Merkle snapshot. Live state: `mintOpen` true, `publicMint` false, `eligibilityRoot` zero (no snapshot), `staking` is the o1 vault contract `0x6f25...dB4`, with one vault id (`0x4254...cbd5`, the same `VAULT_ID` the site uses). So today **the only way to mint is to have staked some BRTC first**, which matches the site copy. The contract checks "any amount": one wei of staked principal qualifies.

**What a mint costs and where it goes.** `price` is 10 USDC per Buddy, at most 10 per wallet (`MAX_PER_WALLET`). The USDC goes straight from the minter to the treasury in the same call (`safeTransferFrom(usdc, msg.sender, treasury, price * qty)`); the contract never holds it. On top, the minter pays a small ETH fee to Pyth Entropy V2 for randomness (`quote(qty)` returns both). `totalSupply` was 266 at that block, so at list price the mint has sent about 2,660 USDC to the treasury so far, less any change in price over time (not measured).

**How traits are assigned.** Traits come from a fixed pool of 8,888 stored with SSTORE2 at deploy, drawn without replacement (a lazy Fisher-Yates shuffle) using Pyth's random number, revealed in a later callback. If Pyth does not answer within an hour, anyone can pay for a retry. This is a fair-launch design: the owner cannot choose who gets which traits.

**Is the art really onchain?** Yes, with one caveat. `tokenSVG(1)` returns a 2,921-byte SVG straight from the contract, and `tokenURI(1)` returns a base64 JSON data URI (44,933 bytes decoded) whose only external URL is `https://baserooms.io` as the project link. No IPFS, no image server. The caveat is in the contract itself: `setRenderer` carries the comment "It is never frozen, so the art can keep evolving", and the owner key can point every Buddy at a new renderer at any time. "Fully onchain" here means "stored onchain", not "immutable".

**Licence and royalty.** `license()` returns `"CC0-1.0"` for the art. Default royalty is 5% (500 bps) to the treasury.

**What this changes.** Nothing in the Key Decisions. It corrects one fact (the contract licence) and confirms two site claims (stake-gated mint, onchain art). It also sharpens the single-key point: that one EOA can change the price, the eligibility rule, the art and the royalty.

### 2026-10-08, tick 2: Buddy Evolutions, what the signer key controls

Source: `src/BuddyEvolutions.sol` read from the Basescan verified-source page (the Sourcify API returned 400 for this address), constructor arguments from the same page, and `cast call` on the Base RPC.

**Licence.** The source opens `// SPDX-License-Identifier: MIT`, the same as the Buddies contract.

**How publishing works.** A Buddy's "evolution" (stage, form, grade, level, active days, real actions, bond) is computed off chain by Base Rooms. To publish one, the owner's wallet calls `publish(voucher, signature)`. The contract checks that the voucher is unexpired, not already published for that (buddyId, seq), and signed by the `signer` address under EIP-712. It then takes the voucher's `price` in BRTC from the caller and sends it to the treasury, and writes an EAS attestation from the contract itself, chained to the Buddy's previous one through `refUID`.

**The EAS schema** (read from the Base schema registry `0x4200...0020`): `uint256 buddyId, uint32 seq, uint8 stage, string form, string grade, uint16 level, uint32 activeDays, uint32 realActions, uint8 bond, address buddies`. It has no resolver and is not revocable.

**What the signer controls.** The signer is `0x0242...46A2`, an EOA (no code, nonce 0, so it has never sent a transaction itself). That is consistent with a server hot key that only signs vouchers off chain. Whoever holds it decides what every published evolution says, and what price each one charges, because `price` lives inside the signed voucher rather than in the contract. The owner (the treasury EOA) can replace the signer at any time with `setSigner`. The contract cannot mint, move or burn Buddies. Its only power over a holder is the BRTC price on a voucher that the holder chooses to submit.

**What this means for "level" claims.** A published level is an attestation by Base Rooms' own key about activity on Base Rooms' own server. It is a record of what the service says, not an independent proof of activity. That is fine for a game. It means a Buddy's level should not be treated as reputation outside Base Rooms.

**Adoption so far.** `lastOf(1)` (the builder's own Buddy) and `lastOf(252)` (Zaal's) both return zero, so neither has published an evolution yet. The total count of attestations under this schema is **UNKNOWN**. The EAS GraphQL query was blocked locally by the secrets guard, which reads a 64-hex schema id as a possible key. A 900,000-block log query was refused by the public RPC ("Archive requests require a personal token").

### 2026-10-08, tick 3: the BRTC staking vault, measured

Source: `src/O1Staking.sol` and `src/interfaces/IO1Staking.sol` from the Basescan verified-source page, and `getVault` / `feeConfig` via `cast call` on the Base RPC. Times are converted from the onchain values.

**Licence.** o1's staking contract is `GPL-3.0-only`. It belongs to o1 Launchpad, not to Base Rooms. Base Rooms created one vault on it.

**The vault's fixed rules.** Every value below is fixed at creation; the contract has no function to change a vault after it is created.

| Field | Value |
|---|---|
| Creator | `0xa034...f8ce` (the Base Rooms treasury) |
| Stakes | BRTC; pays out MSTR (the tokenized Strategy stock) |
| Deposits opened | 2026-08-31 19:13 UTC |
| Epoch 0 started | 2026-09-14 19:13 UTC |
| Epochs | 6 epochs of 14 days each (84 days), ending 2026-12-07 19:13 UTC |
| Reward | 0.5 MSTR per epoch, 3 MSTR in total, funded up front |
| Reward left | 2.53088657 MSTR (as read 2026-10-08) |
| Total staked | 321,780,602 BRTC (32.2% of supply) |
| Early exit | **FORBIDDEN**, penalty 0. A deposit is locked until one epoch after it becomes eligible, capped at the vault's end |

**What it pays, in plain numbers.** At the homepage prices of 2026-10-08 (MSTR $150.47, BRTC $0.00003732), one epoch's reward is worth about $75. It is shared by about $12,000 of staked BRTC. That works out to roughly 16% a year in USD terms, **if both prices held**. They will not: MSTR fell 6.25% that day, and BRTC is down 68.8% from its high measured in MSTR. The homepage's "APY 6088%" is trading turnover, not this yield, and the site says so.

**Cost to the treasury.** o1 charges a protocol fee on vault funding. `feeConfig()` returns 1,000 bps (10%), paid to `0x1cAa...1C90`, fee config version 3. So 3 MSTR of rewards cost the treasury about 3.3 MSTR, roughly $500 at that day's price. By the end of the vault, the program will have cost Base Rooms about $500 in MSTR to keep about a third of BRTC supply locked and to gate the Buddy mint.

**What this means for anyone at The ZAO who stakes.** Staked BRTC cannot come out early, at any price. The longest a new deposit can be locked is one 14-day epoch plus the wait until it becomes eligible, and never past 2026-12-07. Staking is also the only way to qualify to mint a Buddy today (tick 1), so "stake to mint" means "lock BRTC for up to about four weeks".

## Comparison: how to use it

| Option | Risk | Value to ZAO | Verdict |
|---|---|---|---|
| Rooms (Jitsi) for calls | Low; calls not recorded per their disclosures | Already in use since May 2026 | USE |
| Radio, as listeners | None | Our tracks already there | USE |
| Radio, curated ZAO/WaveWarZ station | None for us | Reach for WaveWarZ artists | PARTNER (gated: contact) |
| Public safety/gas/wallet tools, by hand | None | Handy second opinion | USE |
| ZOE calling their `/api/*` | Undocumented, may change | Small | SKIP |
| MCP pairing, sandboxed, minimal scopes | Medium (injection, data at rest) | Learn the UX | SKIP now; re-open with the red control |
| Claude Code hooks pairing | High to critical (T1 to T6) | Status on a pixel pet | SKIP |
| BRTC, staking vault, treasury use | Meme-token risk | None for the org | SKIP |

## Also See

- [dev-workflows/659 ZOE posts v2](../../dev-workflows/659-zoe-posts-v2-voice-and-confirm-flow/) - where `meet.baserooms.io/zaal` entered ZOE's post slate
- [events/811 Chikodi ZAOstock onboarding](../../events/811-chikodi-zaostock-volunteer-onboarding-may3/) - a call recorded on `meet.baserooms.io`
- [wavewarz/743 WaveWarZ whitepaper v2](../../wavewarz/743-wavewarz-whitepaper-v2-deep-dive/) - the WaveWarZ canon the radio partnership would serve
- [business/2634 memecoin idea ground truth](../2634-memecoin-idea-ground-truth/) - covers launch rails; o1 Launchpad (BRTC's rail, 0.001 ETH creation fee, 1% pool fee) is a fifth rail not in that doc

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide whether to ask @slavanova for a WaveWarZ / ZAO radio station; done when Zaal says yes or no in the grill | Zaal | Decision | 2026-10-15 |
| If yes: Zaal sends the ask (outbound is his tap); done when the message is sent | Zaal | Outbound | 2026-10-17 |
| Add a "no third-party HTTP hooks in ~/.claude/settings.json" line to `.claude/rules/secret-hygiene.md` and set `allowedHttpHookUrls` to an explicit list in dotfiles; done when the PR is merged | baserooms lane, reviewed by dotfiles lane | PR | 2026-10-12 |
| Extend `zao-ask-check` with a named risky-action list (git-push, git-rewrite, rm-rf, publish, deploy, database, pipe-shell, onchain, sudo, env), credited to Base Rooms OS as the pattern source; done when the PR is open | baserooms lane | PR | 2026-10-15 |
| Sandboxed MCP trial (separate macOS user, `status`/`talk`/`approve` scopes only, stub-server red control run first); done when a follow-up doc records the red-control result | Zaal approves, baserooms lane runs | Decision then test | 2026-10-22 or wontfix |
| Re-validate fees, contract owners and the treasury holdings in this doc; done when `last-validated` is bumped | baserooms lane | Re-research | 2026-11-08 |

## Sources

Method is stated for each, per `research-grounding.md`. No WebFetch was used for any quoted text.

- [FULL - curl + HTML strip] Base Rooms OS homepage, including Disclosures and Fees: https://baserooms.io/ (HTTP 200, 153,267 bytes; `/disclosures`, `/docs`, `/terms`, `/about` are 404; the disclosures live on the homepage)
- [FULL - curl] Agent guide: https://baserooms.io/agent.md (200, 20,039 bytes)
- [FULL - curl] Wrapper script: https://baserooms.io/unit.mjs (200, 6,905 bytes)
- [FULL - curl] Tool catalog and OpenAPI: https://baserooms.io/agent/tools?format=openai (200), https://baserooms.io/agent/openapi.json (200)
- [FULL - curl] OAuth metadata: https://baserooms.io/.well-known/oauth-authorization-server, https://baserooms.io/.well-known/oauth-protected-resource
- [FULL - curl] Site JS bundle, 185 chunks under https://baserooms.io/_next/static/immutable/chunks/ (pairing presets, `setupFor`, hook blocks, contract constants, fee constants)
- [FULL - curl, 3 runs each] Public tool routes: `/api/gas`, `/api/safety`, `/api/wallet`, `/api/holders`, `/api/contract`, `/api/scan`, `/api/radio/browse`
- [FULL - Sourcify API] Buddies source: https://sourcify.dev/server/v2/contract/8453/0x2B48fFaa0c453786EBF1a786c6f2e21Dcb97f29b?fields=sources (exact match). Evolutions, the o1 vault and the renderer returned 400 (not on Sourcify)
- [FULL - cast call, Base RPC] Buddies live state at block 52,346,706: mintOpen, publicMint, eligibilityRoot, staking, vaults, royaltyInfo, license, drawn, totalSupply, tokenSVG(1), tokenURI(1)
- [FULL - curl + HTML strip] BuddyEvolutions source and constructor args: https://basescan.org/address/0x5b42A7f7c3d27EA76EdAb4BfF7d27497D35420F0
- [FULL - cast call, Base RPC] EAS schema record from the schema registry 0x4200000000000000000000000000000000000020; signer code and nonce; lastOf(1), lastOf(252)
- [FAILED - EAS GraphQL https://base.easscan.org/graphql] blocked locally by the secrets guard (64-hex id); [FAILED - eth_getLogs over 900k blocks] refused by publicnode, archive token required
- [FULL - curl + HTML strip] O1Staking and IO1Staking source: https://basescan.org/address/0x6f25a9e1e677616c1bF7ab54b470b0c82839Adb4
- [FULL - cast call, Base RPC] getVault(VAULT_ID) and feeConfig() on the o1 staking contract, 2026-10-08
- [FULL - curl] Jitsi: https://meet.baserooms.io/ (200, title "Jitsi Meet")
- [FULL - curl + HTML strip] Basescan address pages: https://basescan.org/address/0x2B48fFaa0c453786EBF1a786c6f2e21Dcb97f29b , https://basescan.org/address/0x5b42A7f7c3d27EA76EdAb4BfF7d27497D35420F0 , https://basescan.org/address/0x6f25a9e1e677616c1bF7ab54b470b0c82839Adb4 , https://basescan.org/address/0xB200000000000000000000856A95738C92fEed01 , https://basescan.org/address/0xA034E1CDb0dd2D94ea4689940F5db2Dd677Df8ce
- [FAILED - curl] base.blockscout.com API: Cloudflare "Just a moment" challenge; replaced by Basescan pages plus RPC
- [FULL - JSON-RPC] Base public RPC https://mainnet.base.org: `owner()`, `price()`, `totalSupply()`, `MAX_SUPPLY()`, `treasury()`, `renderer()`, `signer()`, `ownerOf(1)`, `ownerOf(252)`, EIP-1967 slots, `eth_getCode`
- [FULL - Claude Code docs, curl of markdown] Hooks reference: https://code.claude.com/docs/en/hooks.md (PreToolUse `permissionDecision` and `updatedInput`, HTTP hook failure handling, `additionalContext`, `allowedHttpHookUrls`)
- [FULL - Farcaster index API, community] Cast search "baserooms" and user lookup for fid 1046957: https://haatz.quilibrium.com/v2/farcaster/cast/search?q=baserooms
- [FULL - FxTwitter API, community] X profile: https://api.fxtwitter.com/baserooms
- [FULL - GitHub API] User search `slavamushyakov` (0), repo search `baserooms` (3), `brtc-os` (0), code search `baserooms.io` (9, 7 of them in ZAOOS)
- [FULL - HN Algolia API, community] Search "baserooms": every hit read is unrelated (fuzzy matches on "base rooms", "backrooms", "bathrooms"). No HN discussion of this product exists in that index as of 2026-10-08
- [FULL - curl + HTML strip] o1 Launchpad fees: https://docs.o1.exchange/launchpad/trading/fees-referrals - confirms the 1% fee split creator 50% / platform 30% / referrer 20%, the unused referral share going to the platform, the 99%-to-1% fee over a 20-second anti-snipe window, and the 0.001 ETH creation fee on Base
