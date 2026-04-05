# 228 — Meta Developer Platform: APIs, Models & Integration Opportunities for ZAO OS

> **Status:** Research complete
> **Date:** March 29, 2026
> **Goal:** Evaluate all relevant Meta/Facebook developer APIs and models for a 188-member gated music community that already cross-posts to Farcaster, Bluesky, X, and has Threads publishing implemented

## Key Decisions / Recommendations

| Area | Recommendation | Priority |
|------|---------------|----------|
| **Threads API** | ALREADY IMPLEMENTED in `src/lib/publish/threads.ts`. Working two-step container publish + token refresh. Keep as-is. | Done |
| **Instagram Content Publishing API** | WORTH ADDING — auto-post approved governance proposals as feed posts or Reels. 100 posts/24h limit is plenty. Requires Business/Creator account + Facebook Page link. | Medium |
| **Facebook Login / OAuth** | SKIP — ZAO uses wallet-first auth (SIWE) + Farcaster. Facebook Login adds complexity with no value for a web3 community. | Skip |
| **WhatsApp Business Cloud API** | CONSIDER for notifications — fractal reminders, governance deadlines, vote results. At $0.004/utility message, 188 members x 4 msgs/week = ~$160/year. Requires Meta Business verification + phone number. | Low |
| **Meta Llama 4 (Scout/Maverick)** | USEFUL as a secondary model — Llama 4 Scout at $0.11/M input tokens on Groq is 10-50x cheaper than Claude for bulk moderation. Llama Guard 3 is purpose-built for content safety. Keep Claude for nuanced tasks, use Llama for high-volume screening. | Medium |
| **Facebook Gaming / Music APIs** | NO USEFUL APIs — Meta has no public music API, audio fingerprinting API, or music recognition service for developers. Use AudD, ACRCloud, or AcoustID instead. | Skip |

---

## 1. Threads API

**Current state:** v1.0 on `graph.threads.net`. Actively developed -- 6 updates in Q1 2026 alone.

**ZAO status:** Already implemented at `src/lib/publish/threads.ts` with two-step container publish (create container, then publish) and 60-day token refresh via `refreshThreadsToken()`. Also has `src/lib/publish/threads-insights.ts` for analytics.

### Auth & Scopes

| Scope | Purpose | ZAO Needs |
|-------|---------|-----------|
| `threads_basic` | Read profile info, posted media | Yes (required) |
| `threads_content_publish` | Publish text, images, video, carousels | Yes (have it) |
| `threads_read_replies` | Retrieve reply data | Optional |
| `threads_manage_replies` | Manage/moderate replies | Optional |
| `threads_manage_insights` | Analytics data | Yes (have it) |

**OAuth flow:** Redirect to `https://threads.net/oauth/authorize` -> authorization code (1 hour, single use) -> exchange at `https://graph.threads.net/oauth/access_token` for short-lived token -> exchange for long-lived (60-day) token.

### Rate Limits

| Limit | Value |
|-------|-------|
| Posts per 24 hours | 250 (per profile) |
| Replies per 24 hours | 1,000 |
| API calls | Standard Graph API limits |

For ZAO's use case (a few governance proposals per week), this is 100x more than needed.

### Supported Media Types

- TEXT (with `auto_publish_text` shortcut)
- IMAGE (JPEG, PNG, WebP)
- VIDEO (MP4)
- CAROUSEL (up to 10 items)

### Recent Changes (2026)

- **March 25:** Cross-sharing to Instagram Stories
- **March 19:** Additional reply/quote post parameters
- **March 3:** oEmbed without access token
- **February 27:** GIF support via GIPHY (Tenor sunset March 31)
- **February 13:** Reply approval system
- Polls, spoiler tags, geo-gating all added in 2025

### What ZAO Could Add

ZAO's Threads integration is solid. Potential enhancements:
- Add CAROUSEL support for multi-image governance proposals
- Add poll creation for community votes (API supports polls since April 2025)
- Add geo-gating if the community wants region-specific content
- Use oEmbed (no token needed) for previewing Threads posts in-app

---

## 2. Instagram Content Publishing API

**API version:** v25.0 on `graph.instagram.com` / `graph.facebook.com`

### What It Supports

| Content Type | Supported | Notes |
|-------------|-----------|-------|
| Feed images | Yes | JPEG only |
| Feed videos | Yes | Standard video posts |
| Reels | Yes | `media_type=REELS` with `video_url` |
| Stories | Yes | IMAGE or VIDEO, ephemeral |
| Carousels | Yes | Up to 10 images/videos |
| Music stickers | No | Not available via API |
| Shopping tags | No | Not supported |
| Filters | No | Not supported |

### Rate Limits

| Limit | Value |
|-------|-------|
| Published posts per 24 hours | 100 (rolling window, all types combined) |
| API calls per hour | 200 per app per user |
| Carousel items | 10 max |

### Required Permissions

**Via Instagram Login (simpler):**
- `instagram_business_basic`
- `instagram_business_content_publish`
- Advanced or Standard Access level

**Via Facebook Login (more complex):**
- `instagram_basic`
- `instagram_content_publish`
- `pages_read_engagement`
- Plus `ads_management` / `ads_read` if user has Page role

### Publishing Flow

1. `POST /<IG_ID>/media` -- create media container (image URL must be publicly accessible)
2. For video: resumable upload to `rupload.facebook.com`
3. `POST /<IG_ID>/media_publish` with `creation_id`
4. `GET /<IG_CONTAINER_ID>?fields=status_code` to verify

### Requirements

- Instagram Business or Creator account (free to switch)
- Connected Facebook Page
- App Review approval from Meta for `instagram_content_publish`
- Media must be hosted on publicly accessible URLs at publish time

### ZAO Use Case

Moderate value. Could auto-post:
- Approved governance proposals as feed posts (image + text)
- Weekly community highlights as carousels
- Music discovery moments as Reels (if ZAO generates video content)

**Limitation:** No music stickers via API, so music-specific features are manual only.

---

## 3. Facebook Login / OAuth

### What It Offers

Facebook Login provides OAuth 2.0 authentication with access to user profile, email, friends list, and various Graph API permissions.

### Why ZAO Should Skip It

| Factor | Assessment |
|--------|-----------|
| Auth model conflict | ZAO uses wallet-first (SIWE) + Farcaster. Adding Facebook Login adds a third auth path with no overlap |
| Web3 community fit | ZAO members are crypto-native. Facebook Login signals Web2 and may reduce trust |
| Data exposure | Facebook Login pulls user data ZAO doesn't need and shouldn't store |
| Maintenance burden | Facebook Login requires ongoing App Review, compliance, and privacy policy updates |
| Alternative exists | Web3Auth/Privy can bridge social login to wallets if ever needed, without direct Facebook OAuth |

**Verdict:** Skip entirely. If ZAO ever needs social login fallback, use Privy or Dynamic which bridge to wallets natively.

---

## 4. WhatsApp Business Cloud API

### Pricing (US/North America, 2026)

| Message Type | Cost per Message | ZAO Use Case |
|-------------|-----------------|-------------|
| Marketing | $0.025 | Community announcements, new music drops |
| Utility | $0.004 | Fractal reminders, governance deadlines, vote confirmations |
| Authentication | $0.004 | OTP verification (not needed -- ZAO uses wallet auth) |
| Service (customer-initiated, within 24h) | Free | Member replies to notifications |

### Free Tier

- 1,000 service conversations per month (customer-initiated, within 24h window)
- Utility messages free within active 24h service window
- 72h free window from click-to-WhatsApp entry points

### Messaging Limits (Throughput)

| Tier | Messages per 24h | Requirement |
|------|------------------|-------------|
| Unverified | 250 | Default |
| Tier 1 | 1,000 | Business verification |
| Tier 2 | 10,000 | Quality rating + volume |
| Tier 3 | 100,000 | Sustained quality |
| Unlimited | Unlimited | Enterprise |

### Setup Requirements

- Meta Developer Account (free)
- WhatsApp Business Account (WABA)
- Verified phone number (cannot be active personal WhatsApp)
- Business verification in Meta Business Manager
- Credit card or PayPal on file
- Message templates approved by Meta (pre-approval required for outbound)

### ZAO Cost Estimate (188 members)

| Notification Type | Frequency | Messages/Month | Monthly Cost |
|------------------|-----------|----------------|-------------|
| Fractal meeting reminders | Weekly | 752 | $3.01 |
| Governance vote alerts | ~2/month | 376 | $1.50 |
| Vote deadline reminders | ~2/month | 376 | $1.50 |
| Vote results | ~2/month | 376 | $1.50 |
| **Total** | | **~1,880** | **~$7.52/month** |

All above as utility messages at $0.004 each. Annual cost: ~$90.

### Verdict

Technically feasible and cheap, but:
- Requires Meta Business verification (bureaucratic)
- Members must opt in (WhatsApp requires explicit consent)
- Template messages need pre-approval from Meta
- Adds a dependency on members having WhatsApp
- ZAO already has Farcaster cast-based notifications + in-app notification UI planned

**Recommendation:** Low priority. Consider only if member engagement data shows people miss governance deadlines. Farcaster + email (if added) covers this better for a web3 community.

---

## 5. Meta Llama Models

### Current Llama 4 Family (March 2026)

| Model | Active Params | Total Params | Architecture | Context |
|-------|--------------|-------------|-------------|---------|
| Llama 4 Scout | 17B | 109B | MoE, 16 experts | 128K (up to 10M claimed) |
| Llama 4 Maverick | 17B | 400B | MoE, 128 experts | 1M+ tokens |

Both are natively multimodal (text + vision) with early fusion architecture.

### Hosting & Pricing Comparison

| Provider | Model | Input $/M tokens | Output $/M tokens | Speed | Free Tier |
|----------|-------|-------------------|--------------------|----|-----------|
| **Groq** | Scout | $0.11 | $0.34 | 594 tok/s | Yes (limited) |
| **Groq** | Maverick | $0.50 | $0.77 | TBD | Yes (limited) |
| **Together AI** | Scout | ~$0.10 | ~$0.30 | Moderate | Free credits on signup |
| **Together AI** | Maverick | $0.27 | $0.85 | Moderate | Free credits on signup |
| **Fireworks** | Scout | ~$0.10 | ~$0.30 | Fast | Free tier available |
| **Fireworks** | Maverick | ~$0.50 | ~$0.80 | Fast | 1M context support |

For comparison, Claude Sonnet costs ~$3/$15 per M tokens (input/output) -- roughly 30-100x more expensive than Llama 4 Scout on Groq.

### Llama Guard 3 (Content Moderation)

Purpose-built moderation model, fine-tuned from Llama 3.1 8B:
- Classifies content as safe/unsafe across MLCommons hazard taxonomy
- 8 language support
- Available on Ollama (`ollama run llama-guard3`), HuggingFace, Groq, and ModerationAPI
- Quantized (int8) version available -- 40% smaller with minimal accuracy loss
- Outperforms GPT-4 on ToxicChat benchmark for moderation
- Customizable safety categories via prompt engineering

### Claude vs Llama for ZAO's Use Cases

| Task | Best Choice | Why |
|------|------------|-----|
| Content moderation (bulk) | Llama Guard 3 | Purpose-built, 50-100x cheaper, customizable categories |
| Community proposal summarization | Llama 4 Scout | Good enough quality, much cheaper at scale |
| Nuanced content generation | Claude | Better reasoning, safer defaults, better instruction following |
| Code generation / dev tasks | Claude | Significantly better at complex code |
| Music metadata / tagging | Llama 4 Maverick | Multimodal, can process album art + text, affordable |
| Moderation appeals / edge cases | Claude | Better at nuanced judgment calls |

### Recommended Architecture for ZAO

```
User content
    |
    v
[Llama Guard 3 - fast screen]  <-- $0.11/M tokens on Groq
    |
    +--> SAFE -> allow
    |
    +--> UNSAFE -> [Claude - nuanced review]  <-- $3/M tokens
                        |
                        +--> Confirmed unsafe -> block + notify
                        +--> False positive -> allow
```

This tiered approach would cost roughly:
- 1,000 posts/month screened by Llama Guard: ~$0.02/month
- 5% escalated to Claude (~50 posts): ~$0.30/month
- **Total: ~$0.32/month** vs ~$6/month for Claude-only moderation

---

## 6. Facebook Gaming / Music APIs

### What Exists

Meta has **no public developer API** for:
- Music licensing or clearance
- Audio fingerprinting
- Music recognition / identification
- Song metadata lookup
- Music sticker creation

The `User/music` Graph API endpoint only returns a user's music page likes -- not useful.

Meta does use audio fingerprinting internally (via Audible Magic partnership) for copyright enforcement on Facebook and Instagram, but this is not exposed as a developer API.

### Alternatives for Music Communities

| Service | Purpose | Pricing | API |
|---------|---------|---------|-----|
| **AudD** | Music recognition from audio | Free tier (300 req/day), paid from $5/mo | REST API |
| **ACRCloud** | Audio fingerprinting, broadcast monitoring | Free tier available | REST API |
| **AcoustID / Chromaprint** | Open-source audio fingerprinting | Free (crowdsourced DB) | REST + library |
| **Spotify Web API** | Track metadata, audio features | Free | REST API |
| **MusicBrainz** | Open music database | Free | REST API |

**Recommendation:** If ZAO needs music recognition (e.g., identifying tracks in listening rooms), use AcoustID (open source) or AudD (commercial with free tier). Meta offers nothing here.

---

## Summary: What ZAO Should Actually Do

### Already Done
1. **Threads publishing** -- working in production (`src/lib/publish/threads.ts`)

### Worth Adding (Medium Priority)
2. **Instagram Content Publishing** -- auto-post approved proposals as feed posts. Would expand community reach beyond Farcaster/Bluesky/X/Threads to Instagram's larger audience. Reels support available if ZAO generates video.
3. **Llama Guard 3 tiered moderation** -- add as fast pre-screen before Claude. 50-100x cheaper for bulk content screening. Deploy via Groq API ($0.11/M tokens).

### Low Priority
4. **WhatsApp notifications** -- technically feasible at ~$90/year, but requires Meta Business verification and member opt-in. Farcaster notifications are more native to ZAO's audience.

### Skip
5. **Facebook Login** -- wrong auth model for web3 community
6. **Facebook Music APIs** -- don't exist

---

## Sources

- [Threads API Publishing Reference](https://developers.facebook.com/docs/threads/reference/publishing/)
- [Threads API Get Access Tokens](https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions/)
- [Threads API Changelog](https://developers.facebook.com/docs/threads/changelog/)
- [Instagram Content Publishing API](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- [Instagram Graph API Developer Guide 2026](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [WhatsApp Business API Pricing 2026](https://www.flowcall.co/blog/whatsapp-business-api-pricing-2026)
- [WhatsApp Cloud API Setup Guide](https://chatarmin.com/en/blog/whatsapp-cloudapi)
- [Llama 4 on Groq](https://groq.com/blog/llama-4-now-live-on-groq-build-fast-at-the-lowest-cost-without-compromise)
- [Llama 4 Multimodal Announcement](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
- [Llama Guard 3 on HuggingFace](https://huggingface.co/meta-llama/Llama-Guard-3-8B)
- [Self-host Llama Guard 3](https://moderationapi.com/blog/how-to-self-host-use-llama-guard-3/)
- [Together AI Pricing](https://www.together.ai/pricing)
- [How to Post to Threads via API](https://postproxy.dev/blog/how-to-post-to-threads-via-api/)
- [Web3Auth Facebook Login](https://web3auth.io/docs/auth-provider-setup/social-providers/facebook)
