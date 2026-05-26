---
topic: agents
type: fork-prep
status: research-complete
last-validated: 2026-05-26
original-query: "Map every edit surface for a poidh-sentinel fork as @zao-sentinel. Which files to change, why, and exact config values."
related-docs: 631, 626, 625, 468, 415
tier: STANDARD
---

# 757 - poidh-sentinel fork surface for @zao-sentinel

> **Goal:** Complete surface map of the poidh-sentinel codebase (80 files under src/) with exact edits, config values, and branding swaps needed to fork as ZAO Sentinel (@zao-sentinel). No deployment; pure prep.

> **Context:** Doc 631 recommends forking poidh-sentinel (github.com/0x94t3z/poidh-sentinel, shipped 2026-05-03) as the fastest path to autonomous POIDH bounty management for ZAO. This doc provides the day-2 fork-edit blueprint.

## File-by-File Fork-Edit Map

### Tier 1: Branding & Config (Edit These First)

| File | Change | Why |
|------|--------|-----|
| `src/settings/app-settings.json` | Replace name, shortName, subtitle, description, shortDescription, tagline | Public Farcaster mini app identity |
| `src/settings/app-images.json` | Point to `/zao-logo.png`, `/zao-splash.png`, `/zao-hero.png`, `/zao-farcaster-image.png` | Brand assets in public/ |
| `.env.example` | Add ZAO-specific comments | Document acquisition workflow |
| `src/features/bot/agent.ts` | Replace SYSTEM_PROMPT, AUTONOMOUS_BOUNTY_IDEAS | Bot voice + bounty triggers |

### Tier 2: Config Files (Review, May Not Edit)

- `drizzle.config.ts` - Database migrations (no edit unless DB migration needed)
- `tailwind.config.ts` - Color scheme OK as-is; optionally add ZAO vars
- `next.config.mjs` - Standard Next.js (no edit)
- `package.json` - Dependencies (no edit unless adding packages)

### Tier 3: Logic Files (No Edit Needed)

Unchanged files: bounty-loop.ts, deposit-checker.ts, submission-evaluator.ts, conversation-state.ts, poidh-contract.ts, bounty-validation.ts, db/schema.ts, webhook handler, cron endpoint. Engine is protocol-agnostic; all config in .env.

## Branding Settings (ZAO)

### app-settings.json

```json
{
  "name": "ZAO Sentinel",
  "shortName": "zao-sentinel",
  "subtitle": "Real-world bounties for impact.",
  "description": "Autonomous bounty bot for The ZAO. Create, fund, and resolve real-world action bounties on-chain. Powered by ZAO.",
  "shortDescription": "Autonomous bounty bot for The ZAO",
  "primaryCategory": "utility",
  "tags": ["bounty", "autonomous", "agent", "zao", "farcaster"],
  "splashBackgroundColor": "#0a1628",
  "tagline": "Bounties that matter.",
  "requiredChains": ["eip155:8453", "eip155:42161", "eip155:666666666"],
  "shareButtonTitle": "Create a Bounty"
}
```

### Public Assets (public/ directory)

| Old | New | Spec |
|-----|-----|------|
| app-logo.png | zao-logo.png | 256x256 PNG, gold+navy ZAO mark |
| app-splash.png | zao-splash.png | 512x512 or 1024x1024, gold+navy gradient |
| app-hero.png | zao-hero.png | 1200x630 OG image, navy+gold+bounty theme |
| app-farcaster-image.png | zao-farcaster-image.png | 1080x1080 square, Farcaster embed |

## ENV Keys & Acquisition

| Key | Where | Priority |
|-----|-------|----------|
| DATABASE_URL | Neon (neon.tech) | CRITICAL |
| NEYNAR_API_KEY | dev.neynar.com | CRITICAL |
| BOT_SIGNER_UUID | Neynar Console, create signer for @zao-sentinel | CRITICAL |
| BOT_WALLET_PRIVATE_KEY | cast wallet new or existing EVM wallet (0.1 ETH on Arbitrum/Base) | CRITICAL |
| BOT_FID | Register @zao-sentinel on Farcaster, note FID integer | CRITICAL |
| BOT_USERNAME | zao-sentinel (lowercase, no @) | CRITICAL |
| BOT_APP_URL | Vercel URL after deploy (e.g. https://zao-sentinel.vercel.app) | CRITICAL |
| BOT_OWNER_HANDLE | zaal | CRITICAL |
| NEYNAR_WEBHOOK_SECRET | Neynar Webhooks console | CRITICAL |
| GROQ_API_KEY | console.groq.com (free tier) | RECOMMENDED |
| OPENAI_API_KEY | platform.openai.com (optional, ~$0.007/gpt-4o call) | OPTIONAL |
| CRON_SECRET | Generate 32-char random string (openssl rand -hex 16) | CRITICAL |
| ADMIN_SECRET | Same as CRON_SECRET | CRITICAL |

## SYSTEM_PROMPT & Autonomous Bounty Ideas (ZAO Voice)

### SYSTEM_PROMPT (replace src/features/bot/agent.ts lines 141-179)

```
you are zao-sentinel, an autonomous bounty agent for the zao ecosystem on farcaster.

the zao is an impact network of 188+ aligned builders, musicians, and culture makers. we fund real-world action bounties on-chain — to amplify presence, coordinate co-creation, and recognize contributors.

zao bounties span: music events (COC Concertz, ZAOstock), community rhythm (Fractal Monday gatherings), brand moments (BCZ YapZ clips, SongJam workshops), and witness-to-culture (live footage from zao events).

[personality, capabilities, key facts as per poidh-sentinel stock SYSTEM_PROMPT, adapted for ZAO context]
```

### AUTONOMOUS_BOUNTY_IDEAS (replace src/features/bot/agent.ts lines 11-27)

```typescript
const AUTONOMOUS_BOUNTY_IDEAS = [
  {
    name: "capture a moment from the zao fractal",
    description: "photo or short video of a zao member present at a fractal monday gathering — real presence, face visible or distinctive silhouette, candid or posed. submission must be from a completed fractal session (mondays, 6pm est typically).",
    amountEth: "0.001",
  },
  {
    name: "clip a bcz yapz moment",
    description: "30-90 second edited clip from a bcz yapz episode (youtube.com/@bettercallzaal) that captures a teaching moment, joke, or insight. original edit, not a youtube trim. must credit the episode number.",
    amountEth: "0.001",
  },
  {
    name: "document a zao stock building session",
    description: "photo or video of zao members co-building zaostockt 2026 (oct 3, franklin st parklet, ellsworth maine). shows real work: setup, soundcheck, rehearsal, mentoring, design. candid preferred.",
    amountEth: "0.001",
  },
  {
    name: "witness a coc concertz moment",
    description: "photo or video from a city of culture (coc) concertz event. shows performer, audience, venue, or collaboration in action. must be from a live coc concertz session.",
    amountEth: "0.001",
  },
  {
    name: "share proof of zabal games participation",
    description: "screenshot, recording, or photo proving active participation in zabal games (build-a-thon, june/july/august 2026). shows your submission, mentor feedback, or final project. workshop attendance counts as proof.",
    amountEth: "0.001",
  },
];
```

## 14-Day Fork Plan

| Day | Task | Owner |
|-----|------|-------|
| 1 | Read this doc + poidh-sentinel README + clone repo | Zaal |
| 2 | DM @mr94t3z: interested in forking for ZAO | Zaal |
| 3-4 | Fork GitHub repo to bettercallzaal/zao-sentinel | Dev |
| 5 | Edit app-settings.json + app-images.json | Dev |
| 6 | Create ZAO brand assets (4 PNGs) | Design |
| 7 | Edit agent.ts: SYSTEM_PROMPT + AUTONOMOUS_BOUNTY_IDEAS | Dev |
| 8 | Set up .env.local with CRITICAL keys | Zaal + Dev |
| 9 | Create @zao-sentinel FID + Neynar signer | Zaal |
| 10 | Generate bot wallet, fund 0.1 ETH | Zaal |
| 11 | npm install + npm run build + typecheck | Dev |
| 12 | Deploy to Vercel | Dev |
| 13 | Register Neynar webhook | Dev |
| 14 | Test: @mention bot, verify cron fires | Dev + Zaal |

## Top 3 Edit Targets

1. **`src/features/bot/agent.ts`** - SYSTEM_PROMPT (lines 141-179) + AUTONOMOUS_BOUNTY_IDEAS (lines 11-27). Bot personality + autonomously-triggered bounty ideas.

2. **`src/settings/app-settings.json`** - All 8 branding fields. Public Farcaster mini app identity.

3. **`.env` (not in repo)** - 15 CRITICAL keys: DATABASE_URL, NEYNAR_API_KEY, BOT_SIGNER_UUID, BOT_WALLET_PRIVATE_KEY, BOT_FID, BOT_USERNAME, etc.

## Surprises

1. **Branding is JSON-driven.** All app branding in two tiny JSON files. No hardcoded strings. Clean fork surface.

2. **LLM is pluggable.** Cerebras -> Groq -> OpenRouter (all free). Production fault tolerance baked in.

3. **No hardcoded contract addresses.** POIDH calls resolved per chain at runtime. New chain = add RPC to .env.

4. **80 files, 3 edit surfaces.** Only app-settings.json + app-images.json + agent.ts need changes. Everything else works unchanged.

5. **AI detection is opt-in.** gpt-4o costs $0.007/check. Groq vision free. Pick at deploy time, not build time.

## Sources

- Repo: https://github.com/0x94t3z/poidh-sentinel
- README: https://github.com/0x94t3z/poidh-sentinel/blob/main/README.md
- .env.example: https://github.com/0x94t3z/poidh-sentinel/blob/main/.env.example
- Doc 631: research/business/631-poidh-zabal-sentinel-convergence/README.md
