---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-06-09
related-docs: "601, 650, 712, 800, 816, 825"
original-query: "lets research and see if we are missing things - map the whole ZAO infra estate (VPSes, DBs, deployments, domains, costs) to document, consolidate, and cut costs"
tier: DEEP
---

# 826 - ZAO Infrastructure Estate Map

> **Goal:** One canonical map of the entire ZAO technical estate - every VPS, database, deployment, domain, bot, cron, and paid service - so the team can see how it connects, find duplication to consolidate, and cut dead/abandoned cost. Built from boxes + GitHub + live probes; the dollar figures await account dashboards (see the gap section).

## Key findings (the headline)

| # | Finding | Number |
|---|---------|--------|
| 1 | **GitHub repos across 3 orgs** (bettercallzaal, ZAODEVZ, songchaindao-dot), 0 formally archived | **105** |
| 2 | **Vercel deployments**, but only ~10 are real live products | **~40** |
| 3 | **Repos created in 3 months (Mar-May 2026)** - an experiment explosion; only 8 active this month | **64** |
| 4 | **Dead repos last touched in 2025** (fractalbot x5, ZAI/WARZAI x4, newsletter x2...) | **21** |
| 5 | **Database platforms**: Supabase (5+ projects) AND Firebase (~2) | **2 platforms** |
| 6 | **The cowork tracker exists as 4 repos** (ontask/imanprojects -> cowork-zaodevz -> ZAOcowork) | **4 -> 1** |
| 7 | **Billable accounts feeding ~10 live apps** (Vercel, Supabase, Firebase, Neynar, Alchemy, Minimax, Anthropic, Privy, LiveKit, Cloudinary, Deepgram, 2 VPSes, Cloudflare, domains) | **~15** |

**Bottom line:** the estate is ~10 live products buried under ~30 zombie/dead deployments and ~50 stale repos. Big consolidation + cost-cut surface; the live core itself is healthy and consistent.

## The estate at a glance

```
                              THE ZAO TECHNICAL ESTATE
  ----------------------------------------------------------------------------------
  WEB (Vercel)                 |  DATA                    |  COMPUTE (2 Hostinger VPS)
  ~40 deployments, ~10 live:   |  Supabase (5+ projects): |  COWORK box 187.77.3.104:
   thezao.xyz (cowork board)   |   etwvz… cowork tracker  |    @ZAOcoworkingBot (active)
   zaoos.vercel.app (ZAOOS lab)|   yjrla… ZAOstock        |    zaoscribe (Discord scribe, off)
   zaostock (festival)         |   efsx… zoe-dashboard    |    farscout (FC scout, off)
   zabalgamez.com (ZABAL Games)|   + per-app projects     |  BOTS box 31.97.148.88:
   zaonexus.vercel.app (links) |  Firebase (~2 projects): |    zoe-bot, zao-devz-stack,
   bettercallzaal.com          |   CoCConcertZ            |    zaostock-bot (active)
   songchainn (Lovable)        |   wavewarzapp            |    zoe-dashboard (live)
   zlank.online (snap builder) |                          |    cloudflared->caddy->7 *.zaoos.com
   Zuke (Juke audio)           |  Knowledge graph:        |    ollama, crons (digest, wavewarz-
   ZAOfractal (Respect Game)   |   ZABAL Bonfire          |     sync, follower-snap, nightly-research)
  ----------------------------------------------------------------------------------
  Shared paid APIs: Neynar (5+ apps), Alchemy, Minimax, Anthropic, Privy, LiveKit, Cloudinary, Deepgram
```

## Layer 1 - Compute: two Hostinger VPSes

**COWORK box (`root@187.77.3.104`) - the agent box**
- **@ZAOcoworkingBot** (`cowork-zaodevz/agent`) - ACTIVE -> cowork DB `etwvz…`. The Telegram side of the board.
- **zaoscribe** - Discord audio scribe (Whisper.cpp -> action items -> cowork tracker) - *not running*.
- **farscout** - Farcaster research Discord scout (HAATZ + OpenRouter + Ollama + Bonfire, FID 19640) - *inactive*.

**BOTS box (`zaal@31.97.148.88`) - the fleet box**
- **zoe-bot** (@zaoclaw_bot), **zao-devz-stack** (devz+hermes), **zaostock-bot** (@ZAOstockTeamBot -> `yjrla…`) - all ACTIVE.
- **zoe-dashboard** (zoe.zaoos.com, -> `efsx…`) - LIVE (200).
- **cloudflared tunnel -> Caddy** fronting 7 `*.zaoos.com`: only `zoe` healthy; `ao`/`portal`/`claude`(ttyd terminal) = 502; `agents`/`pixels`/`paperclip` = down (doc-601 decommissioned).
- **ollama** (:11434), hermes-agent / agent-orchestrator (idle).
- **Cron jobs** (`zaoos-crons.sh`): health-snapshot (weekly), daily-digest (2am), **wavewarz-sync** (11pm), follower-snapshot (6am); `nightly-research.sh` (8am, hermes); `auto-sync.sh` (every minute, git); pixel-startup @reboot. One stale one-off (`send-coc4.sh`, dated Apr 11).

## Layer 2 - Data: two platforms

- **Supabase** - 3 confirmed on the boxes (`etwvzrmlxeobinrlytza` cowork, `yjrlaxpjusmrfylumban` ZAOstock, `efsxtoxvigqowjhgcbiz` zoe-dashboard) + each Vercel app likely its own (ZAOOS, SongChainn, Fishbowlz declare Supabase). True count needs the Supabase dashboard - likely 5-10.
- **Firebase** - a separate platform: **CoC Concertz** and **wavewarzapp** use Firebase + Cloudinary, not Supabase. Two consoles, not one.
- **ZABAL Bonfire** - the knowledge graph (zabal.bonfires.ai), fed by /meeting, captures, scribe.

## Layer 3 - Web: 105 repos, ~40 deployments

Liveness census (HTTP probe of every deployed homepage):
- **Live products (307 gated / core 200):** ZAOOS, cowork tracker, ZAOstock, ZABAL Games, ZAONEXUS, Zuke, BCZ site, bcz-yapz.
- **Live-but-abandoned zombies (200, old):** ~18 - zaaltimelinev1/.1, zao-leaderboard, zabalsocials, zabalnewsletter, songjam-site, ltaesnap, fishbowlz, farmdrop, recoup-api, RESUMEV1, ethboulderjournal, textsplitter, zski, sideby-sidev2, fractalbotnov2025...
- **Dead (404):** ZAOVideoEditor, gungakabayo, zul, africa-battle-live-ui, ZAIV2, eliza1, bettercallzaal-coding-hub (songchainnxyz 404s on vercel.app but is live on a custom domain).
- **Billing-disabled (402):** FISHB-IMANUPDATE, emimos, diyama-growth-hub, diyama-your-onchain-gateway.
- **Stale 2025 archive pile (21 repos):** 5 fractal-bot versions, ZAIV1/V2/WARZAI/Viz1, 2 newsletter bots, 2 timelines, etc.

## Layer 4 - The live core, app by app

| App | What it is | Domain | DB / key services |
|-----|-----------|--------|-------------------|
| **ZAOOS** | The lab monorepo (Farcaster client, agents, music, research) | zaoos.vercel.app | Supabase + Alchemy + Minimax + Neynar |
| **Cowork tracker** | Team action board (Kanban + Six Sigma) | thezao.xyz | Supabase `etwvz…` + Minimax + Telegram |
| **ZAOstock** | Oct 3 2026 festival dashboard + public site (Ellsworth ME) | zaostock.vercel.app | Supabase `yjrla…` (+ Deepgram bot) |
| **ZABAL Gamez** | 3-month Build-A-Thon (Jun workshops -> Aug finals), /zabal channel | zabalgamez.com | (static-ish) |
| **ZAONEXUS** | Canonical link hub - 485 links, 44 brands, Next 14 | zaonexus.vercel.app | Alchemy + Neynar (no own DB) |
| **BCZ site** | Zaal's consulting site | bettercallzaal.com | static |
| **SongChainn** | SongChainn site (built on Lovable) | songchainn (custom) | Supabase + LiveKit |
| **Zlank** | No-code Farcaster Snap builder | zlank.online | Anthropic + Minimax + Neynar |
| **Zuke** | White-label live audio for Farcaster, powered by Juke | (Vercel) | Farcaster |
| **ZAOfractal** | Weekly Respect Game (Mon 6pm EST since Aug 2024) | zaofractal.vercel.app (fractal.thezao.com pending) | onchain |
| **CoC Concertz** | Concert promo platform | co-c-concert-z.vercel.app | **Firebase** + Cloudinary |

## Layer 5 - Duplication clusters (consolidation targets)

- **Cowork tracker x4:** `ontask`/`imanprojects` (old GitHub-Contents-API version) -> `cowork-zaodevz` -> `ZAOcowork` (live Supabase, thezao.xyz). Three dead deployments behind one product.
- **Snap builders x4:** zlank / zabalsnap1 / ltaesnap / zlank-snap-template.
- **Battle apps:** africa-battle-live / -ui / wwbase / wavewarzapp.
- **Fractal bots x5:** fractalbot{dec,nov}2025 / fractalbotv1old / fractalbotV3June2025 / ZAO-FRACTAL-BOTV2 (all dead 2025).
- **Fishbowlz x3:** fishbowlz / FISHB-IMANUPDATE / (paused, Juke partnership).
- **Timelines/newsletters x2 each.**
- **Forks (someone else's code):** eliza1 (elizaOS), api+chat (Recoup), songjam-site, tasks, Zaal-s-Birthday.

## Layer 6 - Cost surface (the recurring bills)

~15 billable accounts feed ~10 live apps: **Vercel** (~40 projects), **Supabase** (5-10), **Firebase** (~2), **Neynar** (most-shared - 5+ apps), **Alchemy**, **Minimax**, **Anthropic** (+ all agent/Claude Code), **OpenAI/OpenRouter**, **Privy**, **LiveKit**, **Cloudinary**, **Deepgram**, **2 Hostinger VPSes**, **Cloudflare**, **domains** (thezao.xyz, zabalgamez.com, zlank.online, bettercallzaal.com, zaoos.com, + custom).

## The gap (needs account access - can't see from boxes/GitHub)

1. **Supabase dashboard / PAT** - the full project list + sizes + which are abandoned.
2. **Vercel dashboard / token** - the authoritative live/dead list, custom domains, and **build-minute/bandwidth spend per project**.
3. **Firebase console** - the ~2 Firebase projects (CoC, wavewarz) usage.
4. **Cloudflare + registrar** - all DNS + domains.

With read-only Vercel + Supabase tokens this becomes a fully costed kill-list.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Archive the 21 dead-2025 repos + the obvious zombies (GitHub bulk archive) | Zaal | Cleanup | This week |
| Collapse the cowork-tracker lineage: archive ontask/imanprojects/cowork-zaodevz, keep ZAOcowork | Zaal | Consolidate | This week |
| Provide read-only Vercel + Supabase tokens -> costed kill-list + per-project spend | Zaal | Access | Next |
| Prune the 5-6 dead `*.zaoos.com` tunnel routes from the cloudflared config | Zaal | Infra | Low |
| Decide CoC/wavewarz on Firebase: keep the second platform or migrate to Supabase | Zaal | Consolidate | Later |
| Confirm Neynar is one account/bill (5+ apps share it) | Zaal | Cost | Next |

## Also See

- [Doc 825](../../agents/825-zaocowork-architecture-audit/) - the cowork system in depth (subset of this)
- [Doc 816](../../agents/816-cowork-control-plane-and-project-audit/) - control plane + todo/github audit
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - the decommissioned surfaces (explains the dead tunnel routes)
- [Doc 650](../../agents/650-cowork-zaodevz-imanagent/), [Doc 712](../../business/712-zao-crm-coworking-app/)

## Sources

- [FULL] Both VPSes (`187.77.3.104`, `31.97.148.88`) - systemd units, listening ports, crons, env Supabase refs, Caddy/Cloudflared config (2026-06-09).
- [FULL] GitHub REST - 105 repos across 3 orgs (name/pushed/fork/archived/language/size), per-app `.env.example` dependency census, READMEs (2026-06-09).
- [FULL] Liveness probe - HTTP status of ~40 deployed homepages (2026-06-09).
- [FULL] Supabase MCP - cowork DB `etwvzrmlxeobinrlytza` table census (doc 825).
- [PARTIAL - needs dashboards] Account-level Vercel/Supabase/Firebase/Cloudflare project lists + costs - not reachable from boxes/GitHub; flagged in The Gap.
