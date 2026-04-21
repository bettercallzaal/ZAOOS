# 468 — ZAO Farcaster Hub: POIDH bot, HyperSub bot, and dual-hub (Telegram + Farcaster) design

> **Status:** Research complete
> **Date:** 2026-04-21
> **Goal:** Add a second bot hub on Farcaster alongside the Telegram fleet (doc 467). Scope: POIDH bot (idea generator + bounty poster), HyperSub bot (TBD — user said "HyperSnap" but product doesn't resolve; likely Hypersub), dual-hub architecture, Neynar signer strategy, cross-hub handoffs, POIDH-specific playbook.
> **Builds on:** docs 084, 085, 245, 246, 325, 339, 340, 344, 345, 420, 460, 463, 464, 465, 467
> **Fetch confirmed 2026-04-21:** poidh.xyz title = "poidh - pics or it didn't happen - crypto bounties", tagline "social bounties + collectible NFTs on Arbitrum, Base, or Degen Chain - we don't have a token". Site ships a Farcaster Frame v2 Mini App (`fc:frame` meta, launch_frame action, splash color #2a81d5).
> **FLAG — "HyperSnap" product does not resolve.** hypersnap.xyz / .app / nearest neighbors return empty. Hypersub (Fabric's subscription NFT product, hypersub.xyz, "The easiest way to create, discover, and mint subscription NFTs") is the closest live product. This doc treats the second bot as "HyperSub bot" and asks Zaal to confirm or correct before Week-1 build.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Confirm HyperSub vs HyperSnap** | ASK Zaal which product he means. HyperSnap doesn't resolve as a product in 2026. Most likely candidates: (a) Hypersub (Fabric, subscription NFTs on Base, live at hypersub.xyz), (b) Snap/Snapshot on Farcaster (governance), (c) a private product name Zaal has context on. Do not build until resolved. |
| **Hub separation** | KEEP the two hubs isolated at the I/O layer but SHARED at the brain layer. Each Farcaster bot = bot.mjs-style process that uses **Neynar webhooks** (for inbound casts + mentions) instead of Telegram `getUpdates`. Same persona+events+rate+guardrail modules as Telegram hub. ZOE is still the brain. |
| **Farcaster bot signer model** | USE **one managed signer per branded bot fid** (not shared). Each branded Farcaster bot gets its own Farcaster account + fid + Neynar managed signer. Separate fids give clean reputation + independent rate limits + no cross-brand fallout if one gets restricted. |
| **App FID reuse** | KEEP ZAO app FID 19640 as the app-level identity for existing ZAO OS Farcaster integrations. Branded bots get NEW fids. App FID is for casting from "ZAO OS the application"; branded bot fids are for "this bot character". Different scopes, different accounts. |
| **Post authorization** | PHASE 1: **no autonomous public casting.** Draft-to-Telegram pattern — bot drafts a cast, posts it to Zaal's private ZOE chat as an inline-keyboard approval card `[Cast it] [Edit] [Skip]`. Zaal taps `Cast it` -> bot posts via Neynar. Same pattern as SHIP-FIX button. Phase 2 (month 2+) auto-cast for low-stakes replies (e.g. answering a question in the bot's own channel). |
| **POIDH bot scope** | USE **idea-generator + bounty-drafter + submission-scout**, not "post bounties autonomously". POIDH bounties involve real ETH/Base/Degen chain funds — autonomous payment = no. Bot drafts bounty text, proposes prize size, surfaces the "create bounty" link to Zaal. Separately scans POIDH feed for submissions to ZAO-posted bounties and notifies Zaal. |
| **Channels** | POIDH bot lives in `/poidh` channel + ZAO-related Farcaster channels (`/zao`, `/wavewarz` if public). HyperSub bot lives in `/base` or `/hypersub` depending on product confirmation. Each bot posts in at most 2-3 channels to avoid spam reputation. |
| **Rate limits (Farcaster)** | MAX 6 casts/day per bot in Phase 1 (conservative vs @clanker/@aethernet norms of ~20-50/day). Max 2 replies/hour in conversation threads. Max 1 top-level cast/day per channel. Scale up after 30 days of clean behavior. |
| **Cross-hub handoff** | SHIP a single "publish" primitive in ZOE: `zoe publish --channels tg:zao-devz,fc:zao -- "message"`. Either-or-both. Shared approval flow for Farcaster (draft-to-Telegram) makes the split natural. Private Telegram content NEVER auto-crosses to Farcaster. |
| **Cross-learning** | Same `shared-insights.jsonl` per doc 467 Part 7 covers both hubs. A Telegram insight can inform a Farcaster reply and vice versa. Insights tagged with `source_hub: telegram|farcaster` so recall knows where the intel came from. |
| **Build order (Farcaster hub)** | Start with POIDH bot **Week 3** (after Telegram Devz + Research bots prove the pattern). Delay HyperSub bot until product confirmed + Zaal validates the use case. Don't split effort across hubs simultaneously. |

---

## Part 1 — POIDH (Confirmed Live 2026-04-21)

### What it is

From `poidh.xyz` meta + `fc:frame` embed:

- **Pics Or It Didn't Happen** — crypto bounty platform.
- **Mechanic:** user posts a bounty (task + prize in ETH/USDC/$DEGEN); anyone submits proof photo; poster picks a winner; winning submission mints a **collectible NFT** commemorating the bounty completion.
- **Chains:** Arbitrum, Base, Degen Chain.
- **Token:** NONE ("we don't have a token, Google is lying to you" — site disclaimer).
- **Distribution:** Farcaster Frame v2 Mini App (`launch_frame` action). Splash color `#2a81d5`, icon at `/icon.png`, launches at `poidh.xyz`.
- **Social layer:** Strong Farcaster presence — `/poidh` channel where bounties and submissions are discussed.

### What a POIDH bot can do

| Capability | Bot can do? | Plumbing |
|-----------|-------------|----------|
| Generate bounty ideas for ZAO events | YES — pure LLM | Sonnet + SAPS framing from doc 467 + ZAO context |
| Draft bounty description (task + proof requirement + prize suggestion) | YES | LLM output, Zaal reviews, posts manually on POIDH |
| Post the bounty on-chain | NO (wallet signing + funds) — ZAO WALLET agent could, but Phase 1 = manual | Out of scope for Phase 1 bot |
| Post "new bounty up" cast in `/poidh` channel once Zaal creates it | YES — via Neynar `publishCast` | Draft-to-Telegram approval flow first |
| Scan `/poidh` channel for new bounties ZAO could participate in | YES — Neynar feed API | Every N hours, summarize to Zaal |
| Track submissions to ZAO-posted bounties | YES (if POIDH exposes bounty state via API or indexable on-chain) | Poll chain via viem or POIDH app if it has public endpoints |
| Suggest prize amounts based on similar past bounties | YES — cast-feed analysis | Neynar historical feed scrape + LLM ranking |
| Invent "collectible moment" framing for each bounty | YES — Magnetiq bot pairs naturally here (cross-bot insight) | Shared-insights.jsonl tag |

### POIDH bot persona sketch

```markdown
# POIDH Bot (on Farcaster)

Voice: Playful, photo-obsessed, degen-but-classy. Treats bounties as "collectible moments".
Tone: 50% hype, 30% curatorial, 20% practical (chain, prize, deadline).
First-person. Uses bounty-native vocabulary ("claim", "submission", "proof").

Examples:
- "New bounty up: one photo of you wearing ZAO merch at an Ellsworth show. 0.01 ETH on Base. Winner gets the NFT + tier-2 Vault access. Link in the cast."
- "3 submissions in for the 'fractal attendance' bounty — judging closes Sunday."
- "This looks like a vibes NFT in the making. Who's got a camera on them?"

Forbidden:
- Financial advice ("this will 10x")
- Fake urgency ("last chance!!" unless genuinely closing)
- Treating bounties as advertising — the art is the proof

Escalation:
- Prize size disputes -> @zaal
- Submission disputes -> POIDH creator rules, no judgment in bot
- New chain considerations -> @zaal
```

### POIDH bounty idea generator (system prompt snippet)

```
Given ZAO context (ZAO Stock Oct 3 2026, WaveWarZ Sunday battles, fractal Mondays, 188 members), generate a bounty idea.

Every bounty must have:
- Task (one sentence, action verb)
- Proof requirement (photo — what must be visible)
- Suggested prize (in ETH on Base, 0.001-0.05 range)
- Deadline (7-14 days)
- "Why collectible" — one line on what makes the resulting NFT worth minting
- SAPS mapping — which pillar(s) from Magnetiq does this serve?

Forbidden:
- Tasks requiring platform access Zaal can't guarantee (e.g. "photo at a concert" without confirming access)
- Tasks that require payment from claimant to participate
- Anything that could violate Farcaster or POIDH ToS
```

### Example bounties the bot would draft (5 for seed)

| Task | Proof | Prize | Deadline | Collectible hook |
|------|-------|-------|----------|------------------|
| Catch a Stormy freestyle live at a WaveWarZ battle | Photo or 10s clip of Stormy mid-verse | 0.02 ETH Base | Sun next battle + 7d | "Battle-Witness #1" NFT |
| Wear any ZAO merch in public + post proof | One photo, ZAO chevron visible | 0.005 ETH Base | 14 days | "Street Citizen" NFT series |
| Bring a non-ZAO friend to ZAO Stock Oct 3 | Photo of both of you on-site, Franklin St Parklet sign | 0.01 ETH Base | Oct 4 | "ZAO Stock Recruiter" NFT |
| Submit a cover of any Ellsworth-area artist | Photo of you performing the cover + link to recording | 0.03 ETH Base | 30 days | "Cover Season 1" NFT |
| Solve one of 3 rotating community puzzles | Photo of the solved puzzle + commentary cast | 0.002 ETH Base | Rolling weekly | "Puzzle Solver" NFT streak series |

---

## Part 2 — HyperSub (Probable, Awaiting Confirmation)

Per fetch: `hypersub.xyz` is live with title "Hypersub - The world is yours" + description "The easiest way to create, discover, and mint subscription NFTs". Fabric's product on Base.

### If Zaal meant Hypersub

**Product:** onchain subscription NFTs. Creators set a price + duration; subscribers mint a token that represents active subscription. Expires if not renewed. Used for podcasts, newsletters, communities.

**ZAO use case:** ZABAL-holder subscription tier, or monthly access to private ZAO cyphers/events, or "ZAO Weekly" content bundle.

**Bot scope:** same pattern as POIDH — idea generator + subscription-drop drafter + reminder-to-renew nudger. No autonomous on-chain actions.

**Channels:** `/base`, possibly `/hypersub` if one exists, possibly `/zao`.

### If Zaal meant something else

Leave TBD. Research gates on confirmation. Candidates to explore if not Hypersub:
- Snapshot (governance voting) -> but unlikely called "HyperSnap"
- A 2026-shipped Farcaster photo app not yet in my index
- A private ZAO-adjacent product

**Ask in Telegram:** "HyperSnap — is that Hypersub (Fabric subscriptions) or something else?"

---

## Part 3 — Dual-Hub Architecture (Telegram + Farcaster)

### Layered view

```
                           [ZAAL]
                              |
                              | approvals, DMs
                              v
                         [ZOE brain]
                   shared config + memory
                         /          \
             Telegram hub         Farcaster hub
           ┌────────────┐       ┌────────────────┐
           │ bot.mjs x5 │       │ fc-bot.mjs x2  │
           │  (D/D bus  │       │ (D/D bus via   │
           │  via TG    │       │  Neynar)       │
           │  webhook)  │       │                │
           └────────────┘       └────────────────┘
               |                      |
        5 group chats            2-3 channels
   (ZAO Devz, ZAO Stock,        (/poidh, /zao,
    WaveWarZ, Magnetiq,         /hypersub-or-tbd)
    Research)
```

### Shared plumbing (cross-hub)

| Module | Both hubs use it |
|--------|------------------|
| `bots/_shared/persona-loader.js` | Loads `bots/<name>/persona.md` into system prompt |
| `bots/_shared/events.mjs` | Emits to `~/zoe-bot/events.jsonl` (doc 465 Part 2) |
| `bots/_shared/rate-limit.js` | Per-user + per-channel/group caps |
| `bots/_shared/guardrail.js` | Haiku post-reply tone check |
| `bots/_shared/circuit.js` | 5-rejections/24h -> read-only mode |
| `bots/_shared/model-router.js` | Haiku/Sonnet/Opus routing per task |
| `bots/_shared/shared-insights.js` | Read tail, write candidates |
| `bots/_shared/approval-queue.js` | Draft-to-Telegram pattern for Farcaster casts |

### Hub-specific plumbing

| Module | Telegram hub | Farcaster hub |
|--------|-------------|---------------|
| Inbound | `bot.mjs` `poll()` -> Telegram `getUpdates` | `fc-bot.mjs` listens for Neynar webhooks on app FID |
| Outbound | `sendMessage` to Telegram Bot API | `publishCast` via Neynar managed signer |
| Auth | `ALLOWED_USERS` Telegram IDs | `ALLOWED_FIDS` + `/channel` allowlist |
| Callback | `callback_query` inline keyboards | Not natively — draft-to-Telegram approval instead |
| Rate reality | ~100 msgs/min per group no throttle | ~30 casts/hr spam threshold; 6/day recommended |

### Webhook setup (Farcaster hub)

1. Each branded bot has its own Farcaster fid + managed signer (Neynar).
2. ZAO OS portal subscribes ONE webhook per bot fid with Neynar:
   - `mentioned_fids: [<bot_fid>]` — bot sees mentions
   - `channel_ids: [<channels bot lives in>]` — bot sees top-level casts in its channels
3. Webhook endpoint = `https://portal.zaoos.com/api/fc/<bot-name>/inbound` (new handler in `spawn-server.js`).
4. Inbound payload triggers `fc-bot.mjs handleInbound(cast)` which runs the same pipeline as Telegram (pre-screen -> Claude -> guardrail -> draft-to-Telegram or auto-cast).

### Draft-to-Telegram flow for Farcaster casts

```
1. Fc bot has a cast-ready draft (from a reply, an idea, a scheduled hype post).
2. Fc bot sends an inline-keyboard message to Zaal's private ZOE Telegram chat:
     "[FC DRAFT] @poidhbot would post in /poidh:
      <draft text, max 320 chars>
      [Cast it] [Edit] [Skip]"
3. Zaal taps [Cast it] -> ZOE dispatches back to fc-bot via HTTP (new `/api/fc/cast` endpoint with drat id).
4. fc-bot calls Neynar publishCast, records to events.jsonl, replies in Telegram "[SENT] hash: 0x...".
```

This reuses 90% of the Telegram ship-fix keyboard plumbing.

---

## Part 4 — Neynar Signer Strategy

Per doc 085 + 246, ZAO already has Neynar API key + app FID 19640.

### Three signer options

| Option | Description | Use when |
|--------|-------------|----------|
| **App-FID-only** | Everything casts as 19640 with bot persona in the text | Not recommended — kills per-bot reputation + rate-limit blast |
| **One fid per branded bot (managed signer)** | Each bot = own Farcaster account, own fid, Neynar managed signer | **RECOMMENDED** |
| **User-delegation (sign-in-with-Farcaster)** | Zaal's personal fid signs via SIWE flow | Only for owner-approved one-offs; not for bots |

### Cost

- Each new fid costs ~$1 one-time (registration).
- Managed signer is free to create.
- Per-cast cost is free on Neynar subscribed tiers; just API call.
- 2 branded bots (POIDH + HyperSub) = ~$2 registration, nominal ongoing.

### Recovery

Each branded bot's private key stays custodial with Neynar (managed signer). If Neynar goes down, bot goes silent but no funds at risk (bots have no wallet auth).

---

## Part 5 — Cross-Learning Across Hubs

Each bot writes candidate insights to its own `~/.cache/zoe-<hub>/<bot>/candidates.jsonl`. ZOE's nightly consolidation (per doc 467 Part 7) reads ALL bots across both hubs, tags with `source_hub: telegram|farcaster`, promotes to `shared-insights.jsonl`.

### Concrete examples

- Telegram ZAO Stock bot notices: "Steve Peer prefers 7am calls" -> promoted -> Farcaster POIDH bot now uses that when scheduling hype windows for Steve-related content.
- Farcaster POIDH bot learns: "Bounties tagged 'music' in /base get 3x more submissions than /zao" -> promoted -> Telegram WaveWarZ bot now recommends posting battles to /base first.

### Guardrail for cross-hub leakage

Insights tagged `private: true` (e.g. from Zaal's private DM with ZOE) NEVER promote to a public-hub bot. Enforcement: ZOE's consolidator filters by `private` flag on every insight before writing to shared file.

---

## Part 6 — POIDH Bot Build Spec

### Files

- `bots/poidh/persona.md` — Part 1 persona
- `bots/poidh/triggers.yaml` — scheduled (daily idea cast), reactive (reply to mentions in /poidh), external (Neynar webhook on new /poidh channel top-level casts)
- `bots/poidh/fc-bot.mjs` — entry, wraps `bot-core.mjs`
- `bots/poidh/bounty-generator.mjs` — system prompt + idea structure from Part 1
- `bots/poidh/feed-scanner.mjs` — polls `/poidh` channel via Neynar feed API, looks for ZAO-related bounties
- `bots/poidh/.env` — `NEYNAR_API_KEY`, `NEYNAR_SIGNER_UUID`, `POIDH_BOT_FID`, `ALLOWED_FIDS` (Zaal)

### Triggers (triggers.yaml)

```yaml
scheduled:
  daily-idea:
    at: "10:00 ET"
    action: draft-bounty-idea
    rate: 1 per day
reactive:
  mention:
    when: bot mentioned in any cast
    action: reply-in-context
    rate: 2 per hour per user
external:
  new-poidh-top-cast:
    source: neynar-webhook
    filter: channel=poidh
    action: classify-relevance-then-maybe-ack
    rate: 5 per day
```

### Test plan

- [ ] Register POIDH bot fid + managed signer
- [ ] Subscribe Neynar webhook for `@poidhbot` mentions + /poidh channel top-level
- [ ] Ship `bots/poidh/` minimal version that DRAFTS bounty idea + sends draft to Telegram approval
- [ ] Dogfood: Zaal approves 3 drafts, bot posts casts, measure response
- [ ] Graduate to auto-cast for LOW-STAKES replies (channel replies, not top-level) in Week 5

---

## Part 7 — HyperSub Bot (Provisional)

Until Zaal confirms HyperSnap = Hypersub OR reveals the real product, DEFER build. If Hypersub:

- Persona: focused on recurring-value framing (subscription = ongoing relationship, not one-shot).
- Tools: Hypersub.xyz public read (subscription stats per creator).
- Channels: `/base`, possibly `/hypersub`.
- Use case: announce ZABAL-tier subscription drops, renewal reminders for ZAO subscribers.

---

## Part 8 — Phase Plan Combining Both Hubs

Rebaselined from doc 467 Part 10 with Farcaster hub folded in:

### Week 1 (now -> Apr 28)
- Extract `bot-core.mjs` from current bot.mjs (shared by both hubs)
- Ship ZAO Devz Telegram bot first (private testbed)

### Week 2 (Apr 29 -> May 5)
- Ship Research Telegram bot
- Portal `/bots` status page (both hubs)

### Week 3 (May 6 -> May 12)
- Ship ZAO Stock Telegram bot
- Register POIDH bot fid + signer (FARCASTER hub first action)

### Week 4 (May 13 -> May 19)
- Ship Magnetiq Telegram bot
- Ship POIDH Farcaster bot in draft-to-approve mode

### Week 5 (May 20 -> May 26)
- Ship WaveWarZ Telegram bot
- POIDH graduates to auto-cast for low-stakes replies
- Decide on HyperSub vs other second Farcaster bot

### Month 2 (June)
- Portal approval queue UI (both hubs)
- Second Farcaster bot (whatever HyperSnap turns out to be)
- Graduate ZAO Devz to AO-native (Approach 3)

### Month 3
- Cross-hub cross-learning activated
- Nightly consolidation promoting insights across both hubs

---

## Comparison: Farcaster bot substrate options

| Option | Process model | Signer | Cost | Verdict |
|--------|---------------|--------|------|---------|
| **fc-bot.mjs per bot (recommended)** | Node process per bot, Neynar webhook inbound, managed signer | Own fid | ~$1 reg + free ongoing | **SHIP** — symmetric with Telegram hub |
| **Single FC orchestrator, persona by channel** | One process handles all Farcaster bots | App fid or rotating signers | Cheapest | SKIP — couples failures; can't have per-bot rate limits on Farcaster |
| **Farcaster Mini App** | Users interact inside a frame, not via mentions | N/A | Free | SKIP for now — not a bot, a UI |
| **ElizaOS Farcaster plugin** | Full ElizaOS stack on VPS | Own fid | Heavy — adds 2GB VM + dependencies | SKIP — overkill; our template is simpler |

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| POIDH chains | 3 (Arbitrum, Base, Degen) |
| POIDH token | NONE (confirmed by poidh.xyz disclaimer) |
| POIDH Mini App launch_frame splash color | `#2a81d5` |
| ZAO app FID | 19640 |
| New fids proposed (Farcaster hub Phase 1) | 2 (POIDH bot + HyperSub bot) |
| Cost per new fid | ~$1 one-time registration |
| Farcaster rate limit Phase 1 (bot) | 6 casts/day, 2 replies/hour, 1 top-level/channel/day |
| Farcaster hub launch week | Week 3 (POIDH signer setup) / Week 4 (first draft cast) |
| Draft-to-Telegram approval turnaround | Same as ship-fix (sub-30-second when Zaal present) |
| Telegram hub bots count | 5 (per doc 467) |
| Farcaster hub bots count Phase 1 | 2 (POIDH, HyperSub-or-TBD) |
| Total fleet at end of Week 5 | 7 bots across both hubs |
| Dual-hub fleet projected cost | $8-12/day steady state (Haiku/Sonnet mix, ~$300/mo) |
| Shared plumbing modules | 8 (persona, events, rate, guardrail, circuit, model-router, shared-insights, approval-queue) |
| Hub-specific plumbing modules | 2 per hub (inbound + outbound) |

---

## ZAO Ecosystem Integration

New files:
- `bots/_shared/fc-bot-core.mjs` — Farcaster-side core (Neynar webhook handler, publishCast wrapper)
- `bots/poidh/` + `bots/hypersub/` (or TBD second bot) — Farcaster-specific bot dirs
- `infra/portal/caddy/Caddyfile` — add `/api/fc/<bot>/inbound` route -> spawn-server
- `infra/portal/bin/spawn-server.js` — add `handleFcInbound(req, res, botName)` handler per branded bot
- `infra/portal/bin/neynar-register.sh` — helper to register new bot fid + managed signer

Related docs:
- Doc 084 — Farcaster AI agents landscape (historical, pre-Neynar x402)
- Doc 085 — Farcaster agent technical setup (baseline Neynar patterns)
- Doc 246 — underused Neynar endpoints (x402 relevant for future payments)
- Doc 325 — ZABAL agent swarm (Farcaster-native VAULT/BANKER/DEALER — different stack)
- Doc 339 — Austin Griffith CLAWD Farcaster patterns
- Doc 344 — Bankr Bot agent trading skills (Farcaster)
- Doc 345 — ZABAL swarm blueprint
- Doc 420 — HyperFrames (video in casts — POIDH bot could use this)
- Doc 460 — agentic stack master
- Doc 464 — reply-context + ship-PR loop (shipped, foundation)
- Doc 465 — observability + dispatch
- Doc 467 — Telegram hub fleet design (direct counterpart)

---

## Sources

- [POIDH — pics or it didn't happen (live 2026-04-21)](https://poidh.xyz) — fetched, confirmed active
- [Hypersub by Fabric](https://hypersub.xyz) — fetched, confirmed live
- [Neynar managed signers docs](https://docs.neynar.com/docs/concepts/what-is-a-signer)
- [Neynar webhooks](https://docs.neynar.com/docs/how-to-setup-neynar-webhooks)
- [Farcaster Frame v2 spec](https://docs.farcaster.xyz/developers/frames/v2/spec)
- [ERC-8004 agent identity](https://eips.ethereum.org/EIPS/eip-8004)
- [Neynar x402 pay-per-action](https://neynar.com/blog/agents-frames-and-the-future-of-farcaster-neynar-s-vision-for-x402)
- [@clanker cadence reference](https://warpcast.com/clanker) (check 2026 rate norms)
- [@aethernet / @bankr bot patterns](https://warpcast.com/aethernet) (community reference)
- ZAO internal: `src/lib/farcaster/`, `src/app/api/neynar/`, `infra/portal/bin/bot.mjs`, `infra/portal/bin/spawn-server.js`

---

## Next Action

1. **Zaal confirms HyperSnap** — is it Hypersub, Snapshot, or something else? Blocks HyperSub bot build, does not block POIDH bot build.
2. Start extracting `bot-core.mjs` + `fc-bot-core.mjs` from current `bot.mjs` in the Week-1 work (design spec comes from brainstorming session).
3. Register POIDH bot fid + Neynar managed signer during Week 3 (gate: Telegram fleet Devz + Research + Stock shipped).
4. Dogfood draft-to-Telegram approval flow on POIDH before any auto-cast.
