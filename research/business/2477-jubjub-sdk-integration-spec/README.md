---
topic: business
type: guide
status: research-complete
last-validated: 2026-09-08
superseded-by:
related-docs: 1274, 2206, 2234, 2242, 141, 148, 2197
original-query: "/zao-research https://jubjubapp.com/developers#code"
tier: STANDARD
---

# 2477 — JubJub SDK: Integration Spec and ZAO Fit

> **Goal:** Turn the JubJub developer surface into a decision. Doc 1274 opened five questions for the Tom McCarthy call; the shipped SDK answers four of them. This doc records the real API, the real numbers, and the one gap that blocks half of ZAO's catalogue.

---

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **PILOT JubJub on ZAO video assets** (COC Concertz archives, WaveWarZ battle clips, BCZ YapZ). Tier A from doc 1274 is technically unblocked. | SDK is live on Base mainnet, integration is two lines, JubJub never touches the media file. ZAO keeps Arweave as the CDN. |
| 2 | **DO NOT plan JubJub into Aurdour or any audio surface yet.** | The SDK binds to HTML5 `<video>` elements only. Every documented attribute, example, and code path is video. Audio is undocumented and unsupported. This is question 6 for Tom. |
| 3 | **SET `network: 'mainnet'` explicitly on every integration.** | `README.md` and `SDK_REFERENCE.md` contradict each other on the default. Shipping on the wrong default means payments settle on Base Sepolia and no real USDC moves. |
| 4 | **PIN the SDK to a self-hosted copy, do not hotlink the vendor CDN.** | The two documented script URLs disagree, and one of them is a GitHub Pages URL. A GitHub Pages outage would take down payments on every ZAO page at once. |
| 5 | **BUDGET the Creator plan (A$39/month) before uploading any archive.** | Free-plan workspaces delete all files after 7 days. The on-chain ownership record survives; the working files do not. |
| 6 | **REGISTER content server-side, never via `data-jubjub-creator` auto-registration.** | Auto-registration mints an ownership token on first play by any visitor. Server-side `register-content` keeps ZAO in control of which wallet owns what. |

---

## What the SDK Actually Is

JubJub SDK v2.1.0, TypeScript, published as `@jubjub/sdk`. One runtime dependency: `viem ^2.0.0`. Optional peer dependency on `@privy-io/js-sdk-core`.

The core claim is narrow and worth stating precisely: **JubJub handles the money stream, not the video stream.** The media serves from your own CDN. JubJub never hosts, never transcodes, never proxies the file. It attaches a payment session to a `<video>` element and settles on-chain.

That architecture is what makes ZAO's Arweave archive compatible in principle. The `media_url` field takes an ordinary HTTPS URL and is used for provenance hashing, not delivery.

### Two layers

| Layer | Runs | Does |
|---|---|---|
| Player SDK | Browser | Wallet connect, USDC approval, per-second accounting, cost overlay, settlement |
| Platform SDK | Server | Registers content, creates creator profiles, hashes media, deploys ERC-1155 ownership tokens |

### The integration, verbatim

Server side, once per video:

```javascript
const res = await fetch('https://api.jubjubapp.com/v2/platform/register-content', {
  method: 'POST',
  headers: {
    'X-JubJub-Platform-Key': 'pk_your_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    creator_email: 'jane@newsorg.com',
    title: 'Breaking News Coverage',
    media_url: 'https://cdn.newsorg.com/video.mp4',
  }),
});
const { content_id } = await res.json();
```

Client side:

```html
<video id="player" src="https://your-cdn.com/video.mp4" controls></video>
<script src="https://cdn.jubjub.app/sdk.js"></script>
<script>
  JubJub.play('cnt_abc123', document.getElementById('player'));
</script>
```

### API surface

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /v2/platform/register-content` | `X-JubJub-Platform-Key` | Register video, mint ownership tokens |
| `GET /v2/public/contents/{id}/playback-info` | None | Payment config for the player |
| `POST /v2/public/viewer-session` | None | Viewer session token |
| `POST /v2/platform/keys` | Firebase Bearer | Generate platform key |
| `POST /v2/mcp` | OAuth or `X-JubJub-Agent-Key` | MCP server for agents |

Base URL `https://api.jubjubapp.com`. Contract addresses are not compiled into the SDK; the backend returns them per content in `playback-info`, and the SDK throws if the returned `chain_id` does not match its configured network.

### Playback mechanics

1. SDK fetches payment config (public, unauthenticated)
2. Wallet prompt (MetaMask, Coinbase Wallet, Rainbow)
3. One-time USDC spend approval per wallet
4. Streaming session opens on Base
5. Overlay renders on the video: `$0.0042 · 0:42 · Powered by JubJub`
6. Heartbeat every 6 seconds of playback; `onCostUpdate` fires every 200ms
7. Pause stops the meter. Seek backwards is accumulative. Seek forward is not charged.
8. Tab close triggers on-chain settlement with exact playback seconds
9. USDC routes viewer to router to content contract to catalogue to creator

**Viewers with no wallet extension see no prompt and watch free.** Monetisation is opt-in by wallet presence, which for a Farcaster-native audience is a far higher hit rate than for the general public.

---

## The Numbers

| Metric | Value |
|---|---|
| SDK version | 2.1.0 |
| Default price | **$0.005 per minute** ($0.30/hour, $0.0000833/second) |
| Creator share, streaming | 97% |
| JubJub share, streaming | 3% |
| Secondary market | 96% seller, 2.5% creator royalty (EIP-2981), 1.5% JubJub |
| Metadata search | **0% creator, 100% JubJub** |
| Data feeds | 10% creator, 90% JubJub |
| Agent write (`contents_create`) | $0.25 USDC |
| Agent reads (`get_content_analytics` etc.) | $0.005 USDC |
| `get_publish_recommendations` | $0.002 USDC |
| Base mainnet chain ID | 8453 |
| Base Sepolia chain ID | 84532 |
| Payment router (Sepolia) | `0xf5207b827f90b15da403c45A339BDC4a87BC258E` |
| Upload limit | 500 MB, MP4 / MOV / WebM |
| Free plan | A$0, workspace deleted after **7 days** |
| Creator plan | A$39/month or A$390/year |
| Funding raised | A$225,000 from Antler |
| Token standards | ERC-1155 ownership, EIP-2981 royalties |

A 45-minute COC Concertz show watched end to end at the default rate earns **$0.225**. One hundred full replays earn $22.50. This is a long-tail archive play, not a revenue line that changes ZAO's finances in 2026. Price it up at publish time if the goal is real income.

Note the metadata search row. Creators earn **nothing** when JubJub sells search access over their catalogue. The agent-discovery story is a JubJub revenue stream, not a creator one, until a content purchase actually fires.

---

## Answers to Doc 1274's Open Questions

Doc 1274 went to the Tom McCarthy call with five unknowns. Four are now answerable from shipped code and docs.

| # | Question from 1274 | Answer | Confidence |
|---|---|---|---|
| 1 | Is 97% calculated per embed URL, or does the contract need a wallet at embed time? | Neither. Wallet binds at **registration**, not embed. `register-content` accepts `creator_email` or `creator_wallet`. Ownership mints as ERC-1155; revenue routes to token holders in proportion. Splits are set at publish and enforced by contract. | High, from SDK_REFERENCE |
| 2 | Can the player embed a raw Arweave `ar://` link? | Not `ar://`. But `media_url` is an ordinary HTTPS string used for hashing, and JubJub never fetches the media, so an `arweave.net` gateway URL should work. **Untested. Verify before Tier B.** | Medium, inference |
| 3 | Is there a public MCP endpoint today? | **Yes, live.** `https://api.jubjubapp.com/v2/mcp`. OAuth for Claude / ChatGPT / localhost, or `X-JubJub-Agent-Key` for custom agents. `media_search` queries the discoverable corpus with facets. | High, documented |
| 4 | What is the smallest payment that clears on Base? | Default $0.005/min. Settlement is **batched at session end**, not one transaction per second, so per-second granularity does not mean per-second gas. Sub-cent is viable for a 45-minute show. | High |
| 5 | Would Tom co-announce a COC #8 integration? | Still a call question. | Unanswered |

---

## The Gap: ZAO Media Is Half Audio

This is the finding that matters for the "improve ZAO media" thread.

Every documented code path is video:

- `JubJub.play(id, videoElement)` attaches to an HTML5 `<video>`
- Data attributes are read off `<video>` tags
- Uploads accept MP4, MOV, WebM
- The agent payload ships "reference frames" for "visual anchors"
- The one audio-adjacent signal is a `music_present` search facet, which detects music inside video

The Aurdour DJ player at `bettercallzaal/Aurdour` is entirely audio. Its deck stack (`web/dj/Deck.js`, `web/dj/AudioRouter.js`, `web/dj/Library.js`) is built on Web Audio and `<audio>` sources, and the new `web/dj/LocalFiles.js` stores audio blobs in IndexedDB. There is no `<video>` element for JubJub to attach to.

**What splits cleanly:**

| ZAO asset | Format | JubJub today |
|---|---|---|
| COC Concertz show recordings (7) | Video, Arweave | Works, pending Arweave URL test |
| WaveWarZ battle clips (~1,289) | Video | Works |
| BCZ YapZ episodes (~17) | Video | Works |
| ZAOville livestream archives | Video | Works |
| Aurdour / ZOUNZ audio catalogue | Audio | **Blocked** |
| FISHBOWLZ room recordings | Audio | **Blocked** |

Since the SDK is MIT-licensed in `package.json` and thin (one dependency, `viem`), an audio fork is plausible rather than fantastical. It attaches to a media element and meters `currentTime`; `HTMLAudioElement` exposes the same interface. Ask Tom whether an audio path is on the roadmap before building it, because a vendor-supported path beats a fork ZAO has to maintain.

---

## Discrepancies Found

Five contradictions between marketing, README, and SDK reference. Each is a trap for an integrator.

| # | Contradiction | Risk |
|---|---|---|
| 1 | Marketing demo shows **$0.04/second**; SDK default is **$0.005/minute**. That is a 480x difference. | Anyone pricing off the landing page will be out by two orders of magnitude. |
| 2 | `SDK_REFERENCE.md`: "Omitting `network` means mainnet." `README.md`: "The default stays `'testnet'`." **Direct contradiction.** | Ship on the wrong assumption and no real money moves, or worse, it does. |
| 3 | Three script URLs across docs: `https://cdn.jubjub.app/sdk.js` and `https://jubjub-app.github.io/jubjub-sdk/dist/jubjub-sdk.umd.js`. | GitHub Pages is not a payments CDN. Self-host. |
| 4 | `package.json` declares `"license": "MIT"`, but the repo has **no LICENSE file**, so the GitHub API reports `license: null`. | MIT is asserted, not conferred in the standard place. Confirm before forking. |
| 5 | Two integration patterns documented: `JubJub.play(contentId, el)` versus `JubJub.init({platformKey})` plus data attributes. | Unclear which is canonical for v2.1.0. |

The repo also carries `AUDIT-SDK.md` and `TODO-SDK.md` at root, and has **0 GitHub stars** with commits as recent as 2026-09-08. This is a live, pre-adoption codebase, not settled infrastructure.

---

## Community Signal: None Found

Required community-source check returns a **valuable negative**. No Reddit thread, Hacker News discussion, or Farcaster conversation about JubJub could be located. Searches for the name collide almost entirely with **Baby Jubjub**, the elliptic curve from ERC-2494, and with unrelated tokens.

The only third-party coverage is [Hyper Startup Studio's profile](https://hyperhq.com/startups/jubjub/), which is a studio writing about its own portfolio company, not independent analysis.

Read plainly: ZAO would be an early integrator with no peer reports to learn from. That is upside for partnership leverage and downside for risk. Doc 1274's claim that JubJub was "mentioned in Farcaster's own state-of-ecosystem recap, Jul 2026" could not be re-verified in this pass.

One genuine ecosystem tie does exist: the JubJub pricing page names **OpenClaw** and **Hermes** as agents transacting on the platform, and the org publishes [`jubjub-openclaw-skill`](https://github.com/jubjub-app/jubjub-openclaw-skill). ZAO already runs OpenClaw, so an agent-side integration is a shorter path than the player-side one.

---

## Also See

- [Doc 1274](../1274-jubjub-zao-partnership-brief/) — the partnership brief this doc answers
- [Doc 2206](../2206-cloudflare-wallets-agentic-payments/) — agentic payments context
- [Doc 2234](../2234-leftclaw-x402-poidh-bounty-funding/) — x402 in ZAO
- [Doc 2242](../2242-x402-poidh-funding-endpoint-spec/) — x402 endpoint spec
- [Doc 141](../../music/141-onchain-music-distribution-landscape/) — onchain music distribution
- [Doc 2197](../../music/2197-web3-music-monetization-post-mortem/) — what failed before

---

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Test `arweave.net` gateway URL as `media_url` on one COC show; record pass/fail in this doc | @Zaal | Spike | 2026-09-15 |
| Ask Tom McCarthy the six questions below on the call; append answers to this doc | @Zaal | Call | 2026-09-19 |
| Register one WaveWarZ clip server-side with `network: 'mainnet'`, publish, confirm a real USDC settlement lands on Basescan | @Zaal | PR merged to COC Concertz | 2026-09-26 |
| Add JubJub MCP (`https://api.jubjubapp.com/v2/mcp`) to ZOE and surface top-earning clip in the morning brief | @Zaal | Bot deployed | 2026-10-03 |
| Decide fork-versus-wait on audio support after Tom's answer; if fork, open `zao-jubjub-audio` repo | @Zaal | Decision recorded in this doc | 2026-10-10 |

### Six questions for Tom

1. Is `<audio>` support on the roadmap, and on what timeline?
2. Does an `arweave.net` gateway URL work as `media_url`?
3. Which is the canonical v2.1.0 default network, mainnet or testnet? The docs disagree.
4. Which script URL is production, `cdn.jubjub.app` or the GitHub Pages build?
5. Is the SDK MIT in fact? There is no LICENSE file in the repo.
6. Can ZAO route a single content's revenue to a treasury wallet first and split to artists downstream, or must splits be set as ERC-1155 holdings at publish?

---

## Sources

- [JubJub Developers](https://jubjubapp.com/developers) — `[FULL]` via exa web_fetch, 2026-09-08
- [JubJub home](https://jubjubapp.com) — `[FULL]` via exa web_fetch, 2026-09-08
- [JubJub Pricing](https://jubjubapp.com/pricing) — `[FULL]` via exa web_fetch, 2026-09-08
- [How AI Agents Pay for Content](https://jubjubapp.com/agents/x402) — `[FULL]` via exa web_fetch, 2026-09-08
- [JubJub Monetisation](https://jubjubapp.com/monetisation) — `[PARTIAL - extended highlights via exa search, full page not separately fetched; all figures cited here are corroborated by pricing or SDK_REFERENCE]`
- [JubJub Ownership](https://jubjubapp.com/ownership) — `[PARTIAL - extended highlights via exa search; ERC-1155 and EIP-2981 claims corroborated by SDK_REFERENCE]`
- [`JubJub-app/jubjub-sdk` SDK_REFERENCE.md](https://github.com/JubJub-app/jubjub-sdk/blob/main/SDK_REFERENCE.md) — `[FULL]` via `gh api` contents, 2026-09-08
- [`JubJub-app/jubjub-sdk` README.md](https://github.com/JubJub-app/jubjub-sdk/blob/main/README.md) — `[FULL]` via `gh api` contents, 2026-09-08
- [`JubJub-app/jubjub-sdk` package.json](https://github.com/JubJub-app/jubjub-sdk/blob/main/package.json) — `[FULL]` via `gh api` contents, 2026-09-08
- [`jubjub-app/jubjub-openclaw-skill`](https://github.com/jubjub-app/jubjub-openclaw-skill) — `[PARTIAL - org listing and description only, repo contents not read]`
- [Hyper Startup Studio: JubJub](https://hyperhq.com/startups/jubjub/) — `[PARTIAL - extended highlights via exa search; funding figure A$225,000 cited from this source alone]`
- Community sources (Reddit, Hacker News, Farcaster) — `[FAILED - two search passes returned no JubJub discussion; results collide with Baby Jubjub (ERC-2494) and unrelated tokens. Recorded as negative signal, not omitted.]`
- [ZAOOS doc 1274](../1274-jubjub-zao-partnership-brief/README.md) — `[FULL]` local read
- [`bettercallzaal/Aurdour`](https://github.com/bettercallzaal/Aurdour) `web/dj/Deck.js`, `web/dj/AudioRouter.js`, `web/dj/LocalFiles.js` — `[FULL]` local read, audio-only confirmation

### Staleness notes

- SDK repo last pushed **2026-09-08**, same day as this doc. Version 2.1.0. Re-verify the network default and script URL before any production deploy; both are actively changing.
- Pricing in A$ (Antler is Australian). USD equivalents will drift.
- Agent transaction history and analytics are documented as "coming soon", so earnings attribution per agent is not measurable yet.
- Contract addresses cited are **Base Sepolia testnet**. Mainnet addresses come from `playback-info` at runtime and are deliberately not hardcoded.
