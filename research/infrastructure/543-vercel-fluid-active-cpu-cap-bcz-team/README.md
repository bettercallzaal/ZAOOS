---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-04-28
related-docs: 283, 459
tier: STANDARD
---

# 543 — Vercel Fluid Active CPU Cap on bettercallzaals-projects (40+ Projects, 1 Free Team)

> **Goal:** Decide what to do about the 75% Fluid Active CPU usage warning on the BCZ Vercel team. Hobby auto-pauses at 100%. Team hosts 40+ projects including zaoos.com, bettercallzaal.com, cocconcertz.com, fishbowlz.com, zlank.online.

## Key Decisions / Recommendations

| Decision | Recommendation | Why |
|----------|----------------|-----|
| **Pay for Pro on the BCZ team** | USE — upgrade `bettercallzaals-projects` to Pro ($20/mo) | $20 base + $20 included credit covers expected overage; no auto-pause; zaoos.com cron + 188-member traffic stays alive |
| **Set hard spend limit** | USE — cap at $40/mo in Vercel dashboard | Prevents Reddit horror story bills ($237 / $258 from bot crawlers) |
| **Move idle prototypes off Vercel** | USE — move 25+ stale projects (60+ day stale) to GitHub Pages, archive, or VPS 1 | Each idle project still counts toward team-wide meters via background webhooks/builds |
| **Migrate 5-10 small static sites to Cloudflare Pages** | USE — for `crownvics`, `duodo-snap`, `nouns-snap`, `zabalsnap1`, `aurdour`, etc. | 100K Workers req/day free, no Active CPU meter, unlimited bandwidth |
| **Keep on Vercel Pro** | zaoos.com, bettercallzaal.com, cocconcertz.com, fishbowlz.com, zlank.online | Heavy + production; need cron + ISR + functions |
| **Self-host on VPS 1 (Hostinger)** | SKIP for now — VPS already runs OpenClaw + ZOEY + WALLET + paperclip + 4 broadcast OAuth bots | VPS busy; only worth migrating if Pro overage exceeds $50/mo |
| **Downgrade Hobby tier strategy** | SKIP — Hobby's 4 CPU-hr cap on a team with 40+ projects + 5 production sites is mathematically too tight | Will hit 100% mid-month every month |

## What "Fluid Active CPU" Means

**Confirmed (vercel.com/blog/introducing-active-cpu-pricing-for-fluid-compute, June 2025; still current 2026-04):**

- Billed in **milliseconds**, aggregated to CPU-hours
- **Only active code execution** counts — NOT wall-clock
- I/O wait excluded: DB queries, API calls, LLM inference, streaming responses all pause CPU billing
- Designed to be 50-90% cheaper than legacy Lambda-style wall-clock duration billing

**Per-request example for typical Next.js + Supabase route:**
- 100ms compute + 400ms DB wait + 10ms response serialize
- Billed Active CPU: **~110ms** (~$0.0000039 at Pro overage rate)
- Plus provisioned memory: ~$0.00000147
- **Total: ~$0.0000041 per request**

**Implication:** I/O-heavy apps (zaoos.com is I/O-heavy: Supabase + Neynar + Stream + XMTP + Arweave) cost much less than they appear.

## Hobby Tier 2026 Limits (Verified vercel.com/docs/limits, 2026-02-18)

| Meter | Hobby Free | Pro |
|-------|-----------|-----|
| Fluid Active CPU | **4 CPU-hours/mo** | 16 CPU-hrs/mo + overage |
| Fast Data Transfer | 100 GB/mo | 1 TB |
| Function Invocations | 1M/mo | 10M/mo |
| Provisioned Memory | 360 GB-hrs | 1,440 GB-hrs |
| Build Execution | 6,000 min | 24,000 min |
| Edge Requests | 1M/mo | 10M/mo |
| Function maxDuration | 10s hard | up to 300s configurable |
| Behavior at 100% | **AUTO-PAUSE all deployments** | Pay-as-you-go overage |
| Auto-resume | 30 days OR manual support request | N/A |

**Hard pause confirmed by Vercel staff** (community.vercel.com/t/hobby-plan-approaching-your-limits-email/26568, Oct 2025): no grace period, no warning beyond the email at 75% / 100%.

## Pro Tier 2026 Pricing

- **$20/user/month base**
- **$20 included usage credit** per user per month (effectively pay-as-you-go after $40 of usage)
- **Active CPU overage:** $0.128/CPU-hr in cheapest US regions (Cleveland, Portland, DC); $0.200-0.221/CPU-hr in South Africa / São Paulo
- **No deployment pause** on overage
- **Configurable spend limit** — recommend set to $40/mo to match included credit

## bettercallzaals-projects Team Audit (2026-04-28)

**Production / actively used (5 — keep on Pro):**

| Project | URL | Last Deploy | Stack |
|---------|-----|-------------|-------|
| zaoos | zaoos.com | 11h | Next.js 16 + Supabase + Neynar + 3 daily crons |
| bettercallzaalwebsite | bettercallzaal.com | 3d | Next.js |
| co-c-concert-z | cocconcertz.com | 13d | Next.js + Firebase |
| fishbowlz | fishbowlz.com | 20d | Next.js + Privy (paused product per memory) |
| zlank | zlank.online | 11h | Next.js (Quad-built, just shipped) |

**Active prototypes (10-15 — move to Cloudflare Pages or keep cheap):**

riverside-group-demo, farmdrop, ltaesnap, crownvics, duodo-snap, nouns-snap, zabalsnap1, aurdour, b-zbuild-2, resumev-1, bettercallzaal-coding-hub, zao-stock, zabalbot, zabal.art, zaonexus, zao-leaderboard, zabalnewsletter, zabalsocials.

**Stale (60+ days, archive or delete — 25+ projects):**

ww, agencyweb3toolkit, v0-thirdweb-emebed, zaoprojects, zaaltimelinev1-1, v0-solana-governance-d-app, v0-zao-music-marketplace-v1, unifiedchatclient, unifiedchatclient-krr1, cedartide, fractalbotnov2025, wwinfo1, followingchurn3, followertest, nexusv-5-2/5-6/5-7/5-7-1/5-7-2/5-8-3/5-8-4, v0-bidding-war-z, v0-zoundz-mini-app-design, avaxpayments-v1, v0-mint-widget-for-zao, monorepo-turborepo, textsplitter, v-worker-63, zao-video-editor, zski, bettercallzaal-16statestreet, bettercallzaal-16statestreet-u69d, 16statestreet, zounz, ethboulderjournal.

## What Likely Caused the 75% Burn

Top suspects on zaoos.com (largest CPU consumer):

1. **3 daily cron agents** (`/api/cron/agents/vault`, `/banker`, `/dealer`) at maxDuration 60s each. If they run 30 days × 3 × ~30s actual compute = ~45 min Active CPU/mo from crons alone.
2. **`src/app/api/wavewarz/sync/route.ts`** at maxDuration 120s — heavy CPU work
3. **301 API routes** with `maxDuration: 10` default — sums up across 188 active members
4. **Bot/crawler traffic** — zaoos.com indexed publicly, AI scrapers can spike requests
5. **Auth verification** (`/api/auth/verify` at 1024MB memory) — every session check counts toward Provisioned Memory meter

`vercel.json` already has `"fluid": true` enabled, which is the cheaper billing model — without it the bill would be much worse.

## Comparison: Migration Targets for Idle / Static Projects

| Platform | Free Tier (2026-04) | Notes | Best For |
|----------|---------------------|-------|----------|
| Cloudflare Pages | Unlimited static, 100K Workers req/day, unlimited bandwidth | No Active CPU meter; Workers replace API routes | Static + small API |
| GitHub Pages | Unlimited static + free CI | Static only, no backend | Pure marketing pages |
| Netlify Free | 300 build min/mo, unlimited bandwidth | Build minutes are tight | Small sites |
| Hostinger VPS 1 | $2-3/mo, 12 vCPU (already owned) | Self-host via Coolify/Docker; full control | Custom backends, but VPS busy |
| Railway | $5/mo + usage | Simpler than Vercel, per-project billing | One-off APIs |
| Render | Limited free dyno, cold starts | Similar to Vercel pause behavior | SKIP — same trap |

## Real-World Reddit/HN Horror Reports (Verified June 2025-Apr 2026)

- **$258 charge / 5 days** — 360K req/day from AI crawlers (no spend limit set)
- **$237 charge / 6 days** — caching misconfig + 25K visitors during launch
- **5-15 day Hobby exhaustion** — high-traffic prototypes hitting 4-CPU-hr limit by mid-month
- **No grace period** — Vercel staff confirmed pause at 100%, no warning beyond email at 75%

(Sources: reddit.com/r/nextjs/comments/1lpjwo4, community.vercel.com posts 2025-Q4)

## Action Plan (in order)

| Step | Action | Owner | Type | By When |
|------|--------|-------|------|---------|
| 1 | Upgrade `bettercallzaals-projects` to Pro ($20/mo) before usage hits 100% | @Zaal | Vercel dashboard | This week |
| 2 | Set hard spend limit at $40/mo on the team | @Zaal | Vercel billing config | Same session as upgrade |
| 3 | Set per-project spend alerts at $10 each for the 5 production sites | @Zaal | Vercel observability | Same session |
| 4 | Audit + delete the 25+ stale projects (60+ day stale) | Claude/Zaal | `vercel project rm` loop | Within 2 weeks |
| 5 | Migrate 3-5 static prototypes to Cloudflare Pages (start with `crownvics`, `nouns-snap`, `duodo-snap`) | Claude | New deployments + CNAME swap | This sprint |
| 6 | Enable Vercel Firewall WAF on zaoos.com (block AI crawlers) | @Zaal | Vercel dashboard | After Pro upgrade |
| 7 | Add `Cache-Control: stale-while-revalidate` to read-only API routes per Doc 283 | Claude | PR | After Pro upgrade |
| 8 | Re-validate this doc 30 days post-upgrade with actual cost data | Claude | Update `last-validated` | 2026-05-28 |

## Also See

- [Doc 283 — Vercel + Next.js 16 Performance Optimization Guide](../283-vercel-nextjs16-performance-optimization/) (perf optimizations to reduce CPU burn before/after upgrade)
- [Doc 459 — Workspace + Worktrees discipline](../../dev-workflows/) (matches branch hygiene during migrations)

## Sources (Verified 2026-04-28)

1. [Vercel Functions Usage & Pricing](https://vercel.com/docs/functions/usage-and-pricing) — official, updated 2026-02-18
2. [Vercel Limits](https://vercel.com/docs/limits) — Hobby/Pro breakdown
3. [Vercel Blog: Introducing Active CPU Pricing for Fluid Compute](https://vercel.com/blog/introducing-active-cpu-pricing-for-fluid-compute) — June 2025
4. [Vercel Hobby Plan Docs](https://vercel.com/docs/accounts/plans/hobby) — pause behavior confirmed
5. [Vercel Community: Hobby Plan Approaching Your Limits](https://community.vercel.com/t/hobby-plan-approaching-your-limits-email/26568) — Oct 2025 staff response
6. [Cloudflare Pages Limits](https://developers.cloudflare.com/pages/platform/limits/) — verified 2026-04-21
7. [Reddit r/nextjs $237 bill walkthrough](https://reddit.com/r/nextjs/comments/1lpjwo4) — June 2025
8. [Vercel KB: Vercel vs Railway](https://vercel.com/kb/guide/vercel-vs-railway) — comparison
