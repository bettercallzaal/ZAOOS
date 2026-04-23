# ICP Primer — Local Host Learning Page

> **Date:** 2026-04-23
> **Owner:** Zaal
> **Status:** Design approved, ready for implementation plan
> **Scope:** Single-file static HTML primer teaching ICP basics with live mainnet widgets, run locally via `python -m http.server`. Sits under `tools/icp-primer/` in the ZAO OS V1 repo.

---

## Why

Zaal has surface-level ICP understanding and wants a deeper working mental model before prompting Caffeine.ai to scaffold the ZAO Stock 2026 NFT purchase app (see research doc 478). The primer also becomes a build-in-public artifact ("Zaal learned ICP in an afternoon") and future-shareable workshop material.

## Goals

- 10-minute solo run-through that takes Zaal from surface-level to working mental model of ICP.
- Real-hands-on with Internet Identity login + at least one live mainnet canister read.
- Zero build step. Opens in any browser with `python3 -m http.server`.
- Graduation path to a public workshop (approach C — standalone Vite project) without rewrite.

## Non-Goals

- Teaching Motoko syntax (Caffeine abstracts it).
- Cycles math or top-up tutorial (not needed for 10-min primer).
- Real NFT mint on mainnet (avoid cycles spend; walk through via diagram instead).
- Mobile-optimized UX (primer is desktop-first; Zaal at laptop).
- i18n / multiple languages.
- Integration into the ZAO OS Next.js app (kept isolated under `tools/` to avoid wagmi/viem provider conflicts).

## File Layout

```
tools/icp-primer/
|-- index.html        # single page, 5 lessons inline
|-- styles.css        # ZAO navy/gold theme (#0a1628 / #f5a623)
|-- primer.js         # ES module entry, imports all widgets
|-- widgets/
|   |-- state.js      # shared { agent, authClient, identity }
|   |-- error.js      # wrap + render error UI
|   |-- ping.js       # Lesson 2 canister ping
|   |-- ii.js         # Lesson 3 Internet Identity login
|   |-- icrc7.js      # Lesson 4 live NFT read
|   `-- flow.js       # Lesson 5 pay-to-mint SVG animation
|-- README.md         # "how to run + what this is"
`-- .gitignore
```

## Tech Stack

- **Static HTML + ES modules**, no build step.
- **Libraries** (CDN via `esm.sh`):
  - `@dfinity/agent@2`
  - `@dfinity/auth-client@2`
  - `@dfinity/principal@2`
- **Theme**: inline CSS, ZAO navy `#0a1628` background + gold `#f5a623` accent, matches ZAO OS conventions in `.claude/rules/components.md`.
- **Run command**: `cd tools/icp-primer && python3 -m http.server 8765` -> open `http://localhost:8765`.

## Layout

**Linear scroll**: one page, top-to-bottom, 5 stacked sections. Sticky top bar with ZAO brand + "Login with Internet Identity" button. Each lesson = a card (navy with gold border) containing read content + one live widget (or a diagram for Lessons 1, 5).

## Lessons

Each lesson is ~90 seconds read + one live widget.

### Lesson 1 - What ICP actually is (read-only)

- 3-bullet hook: "Cloud that's also a blockchain", "Reverse gas - app pays cycles, user pays nothing", "Frontend + backend + db all in one canister on-chain".
- Visual: side-by-side table ICP vs EVM (principal = address, canister = contract-plus, cycles = prepaid gas, II = passkey auth).
- No widget.

### Lesson 2 - Canisters 101 (read + live call)

- 2-bullet hook: "Canister = WASM module with its own state", "Upgradeable, can hold TBs, serves HTTP".
- **Widget (ping.js)**: "Ping a canister" button. Anonymous `HttpAgent` pointed at `https://icp-api.io`. Target canister: **ICP Ledger** `ryjl3-tyaaa-aaaaa-aaaba-cai`, calls the public query methods `icrc1_name`, `icrc1_symbol`, `icrc1_total_supply`. Output: rendered as "Ledger name: <name>, symbol: <symbol>, total supply: <N>". No login required. If `get_metrics` is preferred for demo, fall back to NNS governance later (verify IDL during build).

### Lesson 3 - Internet Identity live (live login)

- 2-bullet hook: "Passkey/Face ID, no seed phrase", "Principal = your identity scoped per app".
- **Widget (ii.js)**: "Login with Internet Identity" button.
  - `AuthClient.create()`, then `authClient.login({ identityProvider: 'https://identity.ic0.app', maxTimeToLive: 7d })`.
  - On success: grab `authClient.getIdentity().getPrincipal()`, display first 8 + last 4 chars of its text form, show full principal on hover.
  - Persist via IndexedDB (auth-client default). "Logout" button clears state.
  - Re-used by Lessons 3 + 4 via shared `state.js`.

### Lesson 4 - ICRC-7 NFTs live (live read)

- 2-bullet hook: "ICRC-7 = the ICP ERC-721", "Every NFT lives inside one canister, queryable by anyone".
- **Widget (icrc7.js)**: dropdown of 2-3 hardcoded mainnet ICRC-7 canisters (live IDs confirmed during build; fallback: Yumi origins + any other verified ICRC-7 collection). Pick one:
  - Calls `icrc7_name`, `icrc7_total_supply`, `icrc7_tokens(opt 0, opt 3)`, `icrc7_token_metadata(tokens)`.
  - Renders name + supply + first 3 token IDs + metadata URIs + inline image if URI is `https://`.
  - Skips non-HTTP URIs (on-canister blobs) with a note.

### Lesson 5 - Pay-to-mint pattern (read + simulated walkthrough)

- 2-bullet hook: "ICRC-7 has NO purchase primitive - you add it", "Canister receives ICP via ledger, verifies tx block, calls its own mint".
- **Widget (flow.js)**: 4-node SVG + CSS animation.
  - Nodes: User / ICP Ledger / ZAO Canister / NFT.
  - "Play" button animates arrows in sequence, overlay text per step: "User sends 1 ICP" -> "Ledger writes block" -> "Canister verifies block index" -> "icrcX_mint to user principal".
  - Callout: "This is what Caffeine will scaffold for you."
- No real canister call.

## Shared Modules

### state.js

Singleton exporting `{ agent, authClient, identity }`. Initialized on first access. Widgets import and read; `ii.js` writes on login/logout and fires a custom event for re-renders.

### error.js

```
wrapCall(fn, { widgetId, label }) -> promise
```

Wraps every canister call in try/catch. On throw: renders `<div class="error">` inside the widget with the error message + a "Copy debug info" button (copies user-agent, principal, canister ID, method, timestamp). No silent failures. Uses `console.error` only in catch paths per `.claude/rules/typescript-hygiene.md`.

## Error Handling

| Failure | Detection | UX |
|---------|-----------|-----|
| ICP mainnet unreachable | `fetch('https://icp-api.io/api/v2/status')` fails on page load | Banner at top: "Can't reach ICP mainnet - widgets disabled. [Retry]" |
| II popup blocked | `authClient.login` rejects or times out (60s) | Inline error in Lesson 3 + link to browser popup-blocker docs |
| II user cancels | rejection with `UserInterrupt` | Silent - re-enable login button |
| Canister call throws | try/catch in widget | `<div class="error">` + "Copy debug info" |
| IDL mismatch (method not found) | `Actor` rejects with "method_not_found" | Fallback text: "This canister doesn't expose X" + suggest another |
| Rate limit / HTTP 429 | catch status | Auto-retry once after 2s, then show error with Retry button |
| Cached principal invalid | first call returns "unauthenticated" | Auto-logout + prompt re-login |

## Security

- No secrets anywhere. II + anonymous agent are public infra.
- No wallet private keys, no service keys, no env vars required.
- Static files only - no server code.
- Passes `grep -rE '[0-9a-fA-F]{64}' tools/icp-primer/` with zero hits.

## Manual Test Script

1. `cd tools/icp-primer && python3 -m http.server 8765` -> `http://localhost:8765`.
2. Hard refresh. Network tab shows `icp-api.io` + `identity.ic0.app` requests succeed.
3. Scroll top-to-bottom without login - Lessons 1, 2, 5 render; Lessons 3, 4 show "Login first" gate.
4. Click "Login with Internet Identity" -> popup completes -> principal appears truncated in Lesson 3.
5. Scroll to Lesson 4 -> pick a canister -> name/supply/3 tokens render with at least one image visible.
6. Click "Logout" -> auth state clears, Lessons 3 + 4 re-gate.
7. DevTools offline mode -> reload -> banner "Can't reach ICP mainnet" shows.
8. Sanity smoke in Safari + Firefox (60s: II login + 1 read call).

## Ship Checklist

- [ ] `tools/icp-primer/index.html` renders without JS errors
- [ ] All 5 lessons visible
- [ ] II login completes + persists across refresh
- [ ] At least 1 live ICRC-7 canister returns data
- [ ] Pay-to-mint SVG animates
- [ ] Error banner triggers on offline
- [ ] `README.md` has run instructions
- [ ] No secrets: `grep -rE '[0-9a-fA-F]{64}' tools/icp-primer/` returns 0
- [ ] Commit on `ws/stock-apr22-broadcast`, PR to `main`
- [ ] Cross-link doc 478 -> this tool

## Time Estimate

- Difficulty: 3/10.
- Build: ~2-3 hours. Most time in Lesson 4 IDL definitions + picking verified mainnet canisters.

## Graduation Path

If the primer turns into a workshop later, move to standalone Vite + TS project at `tools/icp-primer-workshop/` (approach C from brainstorming). Widgets carry over as-is; only wrapper + routing changes. ~30 minutes of refactor.

## Related

- `research/infrastructure/478-icp-caffeine-nft-purchase/README.md` - why ICP, why Caffeine
- `research/music/407-music-nft-coinflow-fiat-mint/README.md` - alternate Base+Coinflow path kept for music NFT drops
- Memory: `project_zao_stock_confirmed.md` - ZAO Stock Oct 3 2026 event driving this work
