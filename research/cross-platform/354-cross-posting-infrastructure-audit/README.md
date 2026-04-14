# 354 -- Cross-Posting Infrastructure Audit: What Exists for Agent Teaser Distribution

> **Status:** Research complete
> **Date:** April 13, 2026
> **Goal:** Map every cross-posting module in ZAO OS, understand how agents can use them for teaser distribution with Telegram approval

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use existing publish modules** | USE the 10 platform-specific modules in `src/lib/publish/` directly. They handle auth, formatting, character limits, image uploads, and error handling. Don't rebuild |
| **Use normalize.ts for formatting** | USE the existing normalizers (normalizeForX, normalizeForBluesky, etc.) but ADAPT them -- current normalizers are for cross-posting Farcaster casts. For newsletter teasers, we need a new `normalizeTeaser()` function that takes a quote + newsletter URL instead of a cast hash |
| **Use broadcast.ts as orchestrator pattern** | FOLLOW the `broadcastToChannels()` pattern (Promise.allSettled, graceful failures) but EXTEND to cover all 6 platforms (current broadcast only does Telegram + Discord) |
| **Agent teaser flow** | Agent generates 3 teaser options via Claude API → sends to Zaal via `publishToTelegram()` → Zaal replies with choice → ZOE dispatches → agent calls publish modules for all 6 platforms |
| **Auto-detect newsletters** | USE Paragraph API (`GET /v1/posts`) polled each cron run to detect new posts. When new post found, trigger teaser generation flow |
| **Farcaster posting** | USE `autoCastToZao()` (already built) for the /zao channel post. Creates a Farcaster cast with embed URL to the Paragraph newsletter |

---

## Complete Publishing Infrastructure Inventory

### Libraries (`src/lib/publish/`)

| File | Platform | Auth Method | Char Limit | Status |
|------|----------|------------|-----------|--------|
| `auto-cast.ts` | Farcaster /zao channel | `ZAO_OFFICIAL_SIGNER_UUID` + Neynar API | 320 chars | WORKING -- used by agent `cast.ts` |
| `x.ts` | X/Twitter | OAuth 1.0a (4 env vars) | 280 chars | WORKING -- `twitter-api-v2` SDK |
| `bluesky.ts` | Bluesky | Handle + App Password | 300 chars | WORKING -- `@atproto/api`, auto-facet detection |
| `telegram.ts` | Telegram | Bot Token + Chat ID | 4096 chars | WORKING -- raw Bot API fetch |
| `discord.ts` | Discord | Webhook URL | 2000 chars | WORKING -- webhook with rich embeds |
| `threads.ts` | Threads (Meta) | Graph API access token | 500 chars | WORKING -- OAuth token |
| `hive.ts` | Hive/InLeo | Hive key pair | No limit | SCAFFOLDED -- deferred |
| `lens.ts` | Lens Protocol | Lens app address | No limit | SCAFFOLDED -- deferred |
| `normalize.ts` | All platforms | N/A | Per-platform | WORKING -- 7 normalizers |
| `broadcast.ts` | Telegram + Discord | N/A | N/A | WORKING -- parallel broadcast |
| `x-insights.ts` | X engagement metrics | X API | N/A | WORKING -- reads post metrics |
| `threads-insights.ts` | Threads metrics | Graph API | N/A | WORKING -- reads post metrics |

### API Routes (`src/app/api/publish/`)

| Route | What It Does |
|-------|-------------|
| `/api/publish/farcaster` | Cross-post approved proposals to Farcaster |
| `/api/publish/x` | Cross-post to X/Twitter |
| `/api/publish/bluesky` | Cross-post to Bluesky |
| `/api/publish/telegram` | Publish to Telegram channel |
| `/api/publish/discord` | Publish to Discord via webhook |
| `/api/publish/threads` | Publish to Threads |
| `/api/publish/hive` | Publish to Hive (scaffolded) |
| `/api/publish/lens` | Publish to Lens (scaffolded) |
| `/api/publish/status` | Check which platforms are configured |
| `/api/publish/engagement` | Collect engagement metrics |

### Normalizers in `normalize.ts`

| Function | Platform | Limit | Special Handling |
|----------|----------|-------|-----------------|
| `normalizeForX()` | X/Twitter | 280 chars | Reserves 23 chars for t.co URL |
| `normalizeForBluesky()` | Bluesky | 300 chars | Appends "via ZAO OS" footer |
| `normalizeForTelegram()` | Telegram | 4096 chars | Plain text, escaping handled by publisher |
| `normalizeForDiscord()` | Discord | 2000 chars | "Posted via ZAO OS" footer |
| `normalizeForThreads()` | Threads | 500 chars | Strips hashtags, conversational tone |
| `normalizeForHive()` | Hive | No limit | Full markdown, images converted to `![]()` |
| `normalizeForLens()` | Lens | No limit | Full text + attribution |

### Env Vars Required Per Platform

| Platform | Env Vars | Currently Set? |
|----------|----------|---------------|
| Farcaster | `ZAO_OFFICIAL_SIGNER_UUID`, `ZAO_OFFICIAL_NEYNAR_API_KEY` | Likely yes (agent posting works) |
| X/Twitter | `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` | Check Vercel |
| Bluesky | `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD` | Check Vercel |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | YES (ZOE's bot) |
| Discord | `DISCORD_WEBHOOK_URL` | Check Vercel |
| Threads | `THREADS_APP_ID`, `THREADS_APP_SECRET`, `THREADS_ACCESS_TOKEN`, `THREADS_USER_ID` | Check Vercel |

---

## How Agent Teaser Distribution Works

### The Flow

```
1. VAULT cron detects new Paragraph post
   (poll GET https://public.api.paragraph.com/api/v1/posts every cron run)

2. VAULT generates 3 teaser options via Claude API:
   - Reads newsletter markdown
   - Picks 3 different quotes
   - Formats each as: quote + "\n\nRead more: {paragraph_url}"

3. VAULT sends to Zaal via @zaoclaw_bot (Telegram):
   publishToTelegram({
     text: "New newsletter detected. Pick a teaser:\n\n1️⃣ ...\n2️⃣ ...\n3️⃣ ...\n\nReply 1, 2, 3 or 'rewrite: feedback'",
     chatId: ZAAL_TELEGRAM_CHAT_ID
   })

4. Zaal replies "2" on Telegram

5. ZOE catches reply, calls ZAO OS API:
   POST /api/agents/distribute-teaser
   { teaserIndex: 2, postId: "abc123", newsletterUrl: "https://..." }

6. API route distributes to all 6 platforms:
   
   // Farcaster
   autoCastToZao(teaser + "\n\nRead more:", newsletterUrl)
   
   // X/Twitter
   const xContent = normalizeForX({ text: teaser, castHash: farcasterHash })
   publishToX(xContent)
   
   // Bluesky  
   const bskyContent = normalizeForBluesky({ text: teaser, castHash: farcasterHash })
   publishToBluesky(bskyContent)
   
   // Telegram channel
   publishToTelegram({ text: teaser + "\n\nRead: " + newsletterUrl })
   
   // Discord
   publishToDiscord({ text: teaser, embeds: [buildZaoEmbed({ url: newsletterUrl })] })
   
   // Threads
   publishToThreads(normalizeForThreads({ text: teaser }))

7. Log all results to agent_events
```

### What We Need to Build (New)

| File | Purpose |
|------|---------|
| `src/lib/agents/teaser.ts` | Generate 3 teaser options from newsletter markdown via Claude API |
| `src/lib/agents/detect-newsletter.ts` | Poll Paragraph API for new posts, track what's already been amplified |
| `src/app/api/agents/distribute-teaser/route.ts` | Receive approved teaser from ZOE, distribute to all 6 platforms |
| `src/lib/publish/normalize-teaser.ts` | New normalizer for teasers (quote + URL, not cast cross-post) |
| Modify `src/lib/agents/vault.ts` | Add newsletter detection + teaser flow to cron |

### What We DON'T Need to Build (Already Exists)

| Component | File | Status |
|-----------|------|--------|
| X publishing | `src/lib/publish/x.ts` | DONE -- just call `publishToX()` |
| Bluesky publishing | `src/lib/publish/bluesky.ts` | DONE -- just call `publishToBluesky()` |
| Telegram publishing | `src/lib/publish/telegram.ts` | DONE -- just call `publishToTelegram()` |
| Discord publishing | `src/lib/publish/discord.ts` | DONE -- just call `publishToDiscord()` |
| Threads publishing | `src/lib/publish/threads.ts` | DONE -- just call `publishToThreads()` |
| Farcaster posting | `src/lib/publish/auto-cast.ts` | DONE -- `autoCastToZao()` |
| Character limits | `src/lib/publish/normalize.ts` | DONE -- all limits enforced |
| Parallel broadcast | `src/lib/publish/broadcast.ts` | DONE -- Promise.allSettled pattern |
| Engagement tracking | `x-insights.ts`, `threads-insights.ts` | DONE -- metrics collection |

---

## Comparison: Teaser vs Current Cross-Posting

| Aspect | Current Cross-Posting | Agent Teaser Distribution |
|--------|----------------------|--------------------------|
| **Content source** | Farcaster cast (copy full text) | Paragraph newsletter (extract quote) |
| **Formatting** | Same text, truncated per platform | Unique teaser per newsletter, same teaser formatted per platform |
| **Trigger** | Manual (admin clicks "cross-post") | Auto-detect new Paragraph post |
| **Approval** | Admin in ZAO OS dashboard | Zaal on Telegram via ZOE |
| **Platforms** | 6 (FC, X, BS, TG, Discord, Threads) | Same 6 |
| **Link** | Points to Farcaster cast | Points to Paragraph newsletter |
| **Purpose** | Mirror cast everywhere | Drive traffic to newsletter |

---

## ZAO Ecosystem Integration

### Existing Files Used Directly

| File | How Agent Uses It |
|------|------------------|
| `src/lib/publish/auto-cast.ts:22` | `autoCastToZao(teaser, newsletterUrl)` for Farcaster |
| `src/lib/publish/x.ts:21` | `getXClient()` → `publishToX()` for Twitter |
| `src/lib/publish/bluesky.ts:30` | `publishToBluesky(content)` for Bluesky |
| `src/lib/publish/telegram.ts:89` | `publishToTelegram({ text, chatId })` for Telegram approval + channel post |
| `src/lib/publish/discord.ts` | `publishToDiscord()` for Discord |
| `src/lib/publish/threads.ts` | `publishToThreads()` for Threads |
| `src/lib/publish/broadcast.ts:48` | `broadcastToChannels()` pattern for parallel execution |
| `src/lib/publish/normalize.ts` | All 7 normalizers for character limits |

---

## Sources

- `src/lib/publish/` -- 12 files, complete cross-posting infrastructure
- `src/app/api/publish/` -- 10 API routes for each platform
- [Paragraph API](https://paragraph.com/docs/development/api-sdk-overview)
- [Doc 352 - Paragraph + x402 Implementation](../../business/352-paragraph-x402-agent-implementation/)
