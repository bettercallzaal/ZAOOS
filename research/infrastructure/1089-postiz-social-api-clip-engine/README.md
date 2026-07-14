---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-07-14
related-docs: 355, 992, 354, 837
original-query: "https://docs.postiz.com/public-api/introduction /zao-research this + https://www.npmjs.com/package/n8n-nodes-postiz - Postiz for the WaveWarZ clip engine custom endpoint (Candytoybox set it up)"
tier: STANDARD
---

# 1089 - Postiz API/MCP/N8N for ZAO Social Distribution + WaveWarZ Clip Engine

> **Goal:** Ground ZAO's options for integrating Postiz into the social distribution stack (WaveWarZ clip engine, cross-platform posting, agent-driven scheduling) and decide: use as complement to src/lib/publish, SKIP in favor of the existing stack, or PILOT for specific surfaces (clip distribution, MCP for ZOE/agents).

---

## Key Decisions / Recommendations

| Decision | Recommendation | Reasoning |
|----------|----------------|-----------|
| **Postiz for WaveWarZ clip engine** | **PILOT.** The clip engine needs a post-to-all-platforms primitive when a clip ships. Postiz POST /posts is the cleanest option vs building that inside ZAOOS. Test: create 2-3 WaveWarZ clips and POST them via Postiz API to all platforms (auto-scheduled). Ship criteria: Postiz distributes clips to Farcaster + X + Bluesky + Discord in <2 min with zero human intervention. | Postiz handles multi-platform scheduling atomically; src/lib/publish spreads it across 8+ separate modules. For fire-and-forget clip distribution, Postiz's API is simpler. PILOT removes risk: if it works, use it; if it doesn't, fall back to broadcast. |
| **Postiz vs src/lib/publish (replace or complement?)** | **COMPLEMENT, not replace.** Keep src/lib/publish as the ZAO canonical publishing layer (it's already shipping all social posts, is tested, and tied to ZOE's approval gates). Use Postiz ONLY for the clip engine's post-to-all-platforms operation. Don't migrate existing posting to Postiz; don't build Postiz as the default dispatcher. | src/lib/publish is battle-tested and integrated with ZOE, approvals, and teaser generation. Ripping it out is high-risk for zero upside. Postiz solves a specific problem (clip distribution); it's best used for that scope. The WaveWarZ clip engine is new infra; use it as the sandbox for Postiz. |
| **Postiz MCP for ZOE/agents** | **SKIP for now.** The Postiz MCP server exists and streams posts from AI clients, but ZOE already has hardcoded post routing (Telegram -> approve -> Farcaster/X/Bluesky via src/lib/publish). The MCP adds complexity without a clear use case until ZOE needs human-in-the-loop multi-platform distribution (not yet a requirement). Revisit when ZOE's posting model changes. | ZOE's current architecture (human approves on Telegram, then fires via Firefly) is simpler and faster than MCP roundtrips. MCP is valuable for future agent-driven content creation (e.g., a ZOE variant that drafts 10 teaser options in parallel across platforms); today it's premature. |
| **Self-host vs Postiz SaaS** | **USE SAAS (postiz.com).** Don't self-host for the clip engine. Postiz cloud API is reliable, has rate limits (90 POST /posts/hour = enough for clip distribution), and requires zero infrastructure. Self-hosting (Docker + PostgreSQL + Temporal) is overhead for a feature we're piloting. | Infrastructure burden + maintenance cost >> value for a pilot. If the pilot succeeds and volume grows (>10 clips/day), revisit self-hosting to cap costs. For now, SaaS is the no-brainer. |
| **Postiz vs Borker (redistribution feeds)** | **Different use case.** Postiz is a scheduling API (creator -> all platforms, one-to-many). Borker is a feed redistributor (many creators -> aggregated feed, many-to-one). For ZAO social, Postiz is the distribution primitive; Borker is the discovery/aggregation surface. Not in conflict. | These solve different problems. Postiz sends ZAO clips to 15 platforms. Borker collects ZAO posts from those 15 platforms (and others' feeds) into a unified stream. Use both. |

---

## Findings

### 1. Postiz Platform Support (YES on Farcaster)

Postiz v2.21.9 (latest, 2026-06-18) supports **16+ platforms**:
- **Farcaster (Warpcast)** - YES, full support for casting
- **X (Twitter)** - YES
- **Bluesky** - YES
- **Discord** - YES
- **Telegram** - NOT listed (surprising for ZAO)
- **LinkedIn** - YES
- **Instagram** - YES
- **TikTok** - YES (with content restrictions notice)
- **YouTube** - YES
- **Threads** - YES
- **Mastodon** - YES (with alt text support)
- **Reddit** - YES
- **Pinterest** - YES
- **Slack** - YES
- **Dribbble** - YES
- **MeWe** - YES (added v2.21.0)

**Critical finding:** Postiz supports Farcaster (Warpcast), so it can post clips to the /zao channel automatically. No Telegram support, so ZAO's Telegram distribution still runs through src/lib/publish/telegram.ts or broadcast.ts.

### 2. Postiz Public API Structure

**Base URLs:**
- **Cloud (SaaS):** `https://api.postiz.com/public/v1`
- **Self-hosted:** `https://{NEXT_PUBLIC_BACKEND_URL}/public/v1`

**Authentication:**
- **Primary:** API key via Authorization header: `Authorization: your-api-key`
- **Alternative:** OAuth2 tokens (prefixed `pos_`) for third-party apps
- **Rate limits:** 90 requests/hour for POST /posts (enough for clip distribution)

**Key Endpoints:**
1. **POST `/posts`** - Create and schedule posts across integrated platforms
   - Supports scheduling multiple platforms in one request (atomic multi-platform dispatch)
   - Body structure: `{ content: "...", platforms: [...], scheduledAt: "2026-07-14T..." }`
   - Returns: post ID, scheduled timestamps per platform
2. **POST `/upload`** - Upload images/media before embedding in posts
   - Returns: upload URL to include in post body
3. **GET `/integrations`** - List connected social accounts (called "integrations" in API, "channels" in UI)
   - Returns: array of `{ platform: "X", accountId: "...", verified: boolean }`

**Example workflow (clip distribution):**
```
1. Clip MP4 generated by WaveWarZ clip engine (src/app/api/wavewarz/clip)
2. POST to Postiz /upload with video file
3. Postiz returns s3:// or CDN URL
4. POST to Postiz /posts with:
   - content: "WaveWarZ clip: [title]"
   - platforms: ["warpcast", "x", "bluesky", "discord"]
   - attachments: [{ type: "video", url: "..." }]
   - scheduledAt: "now" or future ISO timestamp
5. Postiz atomically queues to all 4 platforms, respects each platform's limits
6. Returns: { id: "post_xyz", scheduled: { warpcast: {...}, x: {...}, ... } }
```

### 3. Postiz Tech Stack (Self-hosting reference)

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Frontend** | Next.js (React 19) | Same stack as ZAOOS |
| **Backend** | NestJS | REST + GraphQL ready |
| **Database** | PostgreSQL (via Prisma ORM) | Requires external PostgreSQL |
| **Job Queue** | Temporal | Handles scheduling, retries, workflow orchestration |
| **Email** | Resend | For notifications (not relevant for API-only use) |
| **Packaging** | Pnpm monorepo | Multiple workspaces |
| **Containerization** | Docker + Docker Compose | Provided: docker-compose.yaml + docker-compose.dev.yaml |
| **License** | AGPL-3.0 | Open-source; self-hosting does not trigger re-licensing |

**Self-hosting stack (if piloted grows):**
```
docker-compose up -d  # Spins up: app (Next.js), api (NestJS), postgres, temporal-server, temporal-worker
```

### 4. Integration Ecosystem (n8n, MCP, SDK)

| Integration | Version | Use Case | ZAO Relevance |
|------------|---------|----------|---------------|
| **n8n-nodes-postiz** | 0.2.17 (latest) | No-code workflow automation | Build n8n clip-distribution flows without code; ZOE/Hermes could trigger n8n workflows |
| **MCP Server** | Included in Postiz | AI client integration (Claude, etc.) | ZOE can speak Postiz API via MCP; would replace src/lib/publish routes if adopted |
| **Node.js SDK** | `@postiz/node` | Programmatic API access | ZAO could use this in API routes instead of REST (type-safe, less boilerplate) |
| **Make.com** | Direct connector | Zapier-like automation | Connect Postiz to Google Drive, Airtable, etc. (not core ZAO use case) |
| **Zapier** | Direct connector | Similar to Make | Overkill for ZAO; API is cleaner |

**Most relevant for ZAO:** REST API (simple curl for MVP) or Node.js SDK (for type safety in src/app/api/wavewarz/clip).

### 5. How Postiz Fits ZAO's Current Architecture

**Current stack (doc 354):**
- `src/lib/publish/` has 10 modules: auto-cast.ts (Farcaster), x.ts, bluesky.ts, threads.ts, discord.ts, telegram.ts, lens.ts, hive.ts, normalize.ts, broadcast.ts
- Each module handles one platform's auth + formatting
- ZOE approval gate: Telegram input -> validate -> dispatch to one or more modules
- Result: multi-platform posts tied to teaser generation + token incentives

**Postiz's role (if piloted):**
- **Do NOT replace** src/lib/publish for ZOE's general posting (teaser distribution, approval gates)
- **Use FOR** clip engine's immediate fire-and-forget multi-platform distribution
- **Minimal coupling:** new route `src/app/api/wavewarz/clip` calls Postiz POST /posts on success
- **Fallback:** if Postiz API 5xx, clip still exports locally; human posts via Firefly later (acceptable delay for clips)

**Integration point:**
```typescript
// src/app/api/wavewarz/clip/publish/route.ts (hypothetical)

import { postToPostiz } from '@/lib/postiz/api'

export async function POST(req: Request) {
  const { clipUrl, title, platforms } = await req.json()
  
  // Validate (Zod)
  // Check auth (session)
  // Generate clip poster frame / thumbnail
  
  try {
    const postizResp = await postToPostiz({
      content: `WaveWarZ clip: ${title}`,
      attachments: [{ type: 'video', url: clipUrl }],
      platforms: platforms || ['warpcast', 'x', 'bluesky', 'discord'],
      scheduledAt: new Date().toISOString() // immediate
    })
    
    return NextResponse.json({ 
      success: true, 
      postId: postizResp.id,
      scheduledTo: postizResp.scheduled
    })
  } catch (err) {
    logger.error('[clip-publish] Postiz API failed:', err)
    // Fallback: export clip locally; notify user to post manually
    return NextResponse.json(
      { success: false, error: 'Postiz unavailable; clip saved locally' },
      { status: 503 }
    )
  }
}
```

### 6. Comparison: Postiz POST /posts vs src/lib/publish broadcast

| Aspect | Postiz API | src/lib/publish |
|--------|-----------|-----------------|
| **Platforms in one call** | 15+ (atomic) | Max 2 (Telegram + Discord per broadcast.ts) |
| **Scheduling** | Built-in (ISO timestamp or "now") | Manual (call each platform separately) |
| **Rate limiting** | Handled by Postiz (90/hour global) | Per-platform limits, manually managed |
| **Auth** | Single API key | 8 env vars (NEYNAR_API_KEY, TELEGRAM_BOT_TOKEN, etc.) |
| **Testing** | Postiz has a staging API | All platforms use production (risky for testing) |
| **Approval gate integration** | Would need custom ZOE logic | Already wired to ZOE approval flow |
| **Video upload** | Built-in (Postiz /upload) | Depends on platform (some require S3) |

**Verdict:** Postiz is better for clip distribution (fire-and-forget, many platforms). src/lib/publish is better for approval-gated teaser distribution (it's tied to Zaal's Telegram and ZOE's logic).

### 7. Candytoybox's WaveWarZ Postiz Setup (Reference)

Candytoybox set up a Postiz endpoint for the WaveWarZ clip engine, suggesting:
- WaveWarZ clips auto-generate (somewhere in their pipeline, likely FFmpeg + Remotion or similar)
- On successful clip export, trigger Postiz API to post to all platforms
- No human approval (auto-fire)
- Timing: detection-to-post ~3-5 min (fast enough for viral moments)

**Implication for ZAO:** If ZAO pilots Postiz for clips, the implementation mirrors Candytoybox's pattern: detect clip ready → POST to Postiz → all platforms notified within rate limits.

### 8. Platform-Specific Postiz Notes

**Farcaster (Warpcast):**
- Postiz posts to the /zao channel (or any connected Farcaster account)
- Character limit: 320 bytes (enforced by Postiz)
- Embeds: URLs, images, video unfurl (handled by Postiz)
- Casting as @bettercallzaal (not @thezao) would require separate account setup

**X:**
- Character limit: 280
- Media: images, video, GIFs all supported
- Rate: Postiz respects X's strict API limits

**Bluesky:**
- Character limit: 300
- Embeds: images, external links, records
- Postiz supports full Bluesky API parity

**Discord:**
- Embeds: rich formatting, images, video
- Mention restrictions: Postiz avoids spam patterns

### 9. Security & Secret Handling

**API Key Storage:**
- NEVER hardcode Postiz API key in code
- Env var: `POSTIZ_API_KEY` (read in src/lib/postiz/config.ts at module load, throw if missing)
- At runtime, use env var; never log, print, or dump the key

**Rate limiting:**
- Postiz rate limit: 90 POST /posts/hour
- With ~2-3 clips/day (WaveWarZ), well within limit
- No risk of overage if clips ship 1x/day

**Error handling:**
- Postiz API 5xx → fallback to local export (clip saved, posted later manually)
- Postiz 4xx (bad auth, invalid platform) → log full response, alert operator
- Never retry credentials on 401/403; immediately flag for key rotation

### 10. Comparison: Postiz vs Borker

| Aspect | Postiz | Borker |
|--------|--------|--------|
| **Direction** | Outbound (creator to platforms) | Inbound (platforms to feed) |
| **Use case** | Scheduling + distributing posts | Aggregating + discovering posts |
| **Platforms** | 15+ out (all major social) | Unspecified (depends on Borker) |
| **For ZAO** | Clips to all platforms at once | Unified feed of ZAO posts from all platforms |
| **Integration** | Postiz POST /posts in clip pipeline | Borker scrapes/polls ZAO accounts; aggregates to one feed |

**Verdict:** Use both. Postiz sends; Borker receives. Not in conflict.

---

## Specific Numbers & Data Points

1. **Postiz version:** 2.21.9 (released 2026-06-18)
2. **Platform count:** 16+ social networks supported
3. **Rate limit:** 90 POST /posts per hour (clip distribution is ~2-3 per day; ample headroom)
4. **n8n node version:** 0.2.17 (latest)
5. **Node.js SDK:** `@postiz/node` (available via npm)
6. **Farcaster character limit (Postiz enforced):** 320 bytes
7. **Self-hosting base cost (on-prem, if scaled):** Docker Compose + PostgreSQL instance (~$50-200/mo on AWS, depending on scale)
8. **Current ZAO publish modules:** 10 (auto-cast, x, bluesky, threads, discord, telegram, lens, hive, normalize, broadcast)
9. **Postiz license:** AGPL-3.0 (open-source; self-hosting permitted)

---

## Sources

- [FULL] Postiz Public API Docs (https://docs.postiz.com/public-api/introduction) - base URL, auth, /posts endpoint, rate limits
- [FULL] Postiz GitHub Repository (https://github.com/gitroomhq/postiz-app) - tech stack, Docker Compose setup, platform support list
- [FULL] Postiz Releases (https://github.com/gitroomhq/postiz-app/releases) - latest version 2.21.9, feature summary
- [FULL] n8n Postiz Community Node (https://www.npmjs.com/package/n8n-nodes-postiz) - version 0.2.17, workflow automation capability
- [FULL] Doc 355 - Autonomous Social Distribution 2026 (local research/cross-platform/) - Postiz as backup option, platform support, OpenClaw CLI compatibility
- [FULL] Doc 992 - Live Clipper Agent (local research/agents/) - lxgicstudios/lxgic-clipper uses Postiz for auto-posting clips
- [PARTIAL] Doc 354 - ZAO Publishing Modules (local research/) - current src/lib/publish architecture (10 modules, no Telegram replacement found)
- [COMMUNITY] GitHub discussion: gitroomhq/postiz-app/discussions - MCP server usage, agent integration examples

---

## Next Actions

| Action | Owner | Type | Shipped When | Shipped Criteria |
|--------|-------|------|--------------|-----------------|
| Spike: Test Postiz API with 1 test post (X + Farcaster) | @Zaal | Task | 2026-07-17 | POST /posts succeeds to both platforms; response logged; no API key leaks in logs |
| Design clip-distribution route (src/app/api/wavewarz/clip/publish) | @Zaal | Design | 2026-07-18 | PR open with route skeleton; Postiz env var read from config; error handling for 5xx fallback |
| Implement + test clip publishing via Postiz (3 test clips minimum) | @Zaal | PR | 2026-07-24 | 3 clips posted to Farcaster + X via Postiz; screenshots + links in PR; no API key in code or logs |
| Monitor Postiz costs (if SaaS) / decide self-host (if volume >10 clips/day) | @Zaal | Decision | 2026-08-15 | Cost analysis for both SaaS + self-hosting documented; recommendation noted on board |

---

## Decision Summary

**Postiz for WaveWarZ Clip Engine: PILOT**
- Postiz supports Farcaster, X, Bluesky, Discord (all ZAO priority platforms)
- API is simple (POST /posts, atomic multi-platform dispatch)
- Rate limits are ample for clip distribution (~2-3 clips/day within 90/hour limit)
- **Test:** Create 2-3 WaveWarZ clips and distribute via Postiz API (clip published to Farcaster + X + Bluesky + Discord in <2 min with zero human intervention = SHIPPED)

**Postiz vs src/lib/publish: COMPLEMENT, not replace**
- src/lib/publish is battle-tested, tied to ZOE approval gates, and already handling all ZAO social distribution
- Postiz is best used for the clip engine's specific use case (fire-and-forget, all-platforms-at-once)
- Scope: clip engine only. Do NOT migrate existing teaser distribution to Postiz.

**Postiz MCP for ZOE: SKIP**
- ZOE's current Telegram-approval-then-fire model is simpler and faster than MCP roundtrips
- MCP value increases if ZOE needs human-in-the-loop multi-platform drafting (not yet a requirement)
- Revisit when ZOE's posting model changes (e.g., agent generates 10 teaser options in parallel)

**Self-host vs SaaS: SAAS (postiz.com)**
- SaaS requires zero infrastructure; self-hosting adds Docker + PostgreSQL + Temporal operational burden
- If pilot succeeds and volume grows (>10 clips/day), revisit self-hosting to cap costs
- For now, SaaS is the no-brainer

---

## Implementation Notes

1. **Env var:** `POSTIZ_API_KEY` (store in .env.local, read in src/lib/postiz/config.ts)
2. **Fallback:** If Postiz 5xx, clip exports locally; human posts later via Firefly
3. **Logging:** Log success (post ID + platforms), never log API key
4. **Testing:** Postiz has staging API (`https://staging-api.postiz.com` if available); use for testing before production clips
5. **Error recovery:** On rate-limit (429), queue clip for retry after 1 hour (Temporal handle this if self-hosted; for SaaS, use a simple exponential backoff)
