# 97 — Reddit Cross-Posting Integration for ZAO OS

> **Status:** Research complete
> **Date:** March 20, 2026
> **Goal:** Add Reddit as a cross-posting target from ZAO OS — API research, SDK options, OAuth flow, rate limits, costs, music subreddits, and implementation plan
> **Builds on:** Doc 28 (Cross-Platform Publishing), Doc 77 (Bluesky Integration), Doc 96 (Cross-Post API Deep Dive)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **SDK** | `snoowrap` v1.23.0 — still the most popular JS wrapper, but unmaintained. Consider `traw` (TypeScript successor) or raw `fetch` to Reddit's REST API. |
| **Phase 1 auth** | Script-type app (personal use) — community bot account posts to r/thezao. OAuth2 "script" type with username/password. |
| **Phase 2 auth** | OAuth2 Authorization Code flow — "Connect Your Reddit" for individual members. |
| **Cost** | **$0 for free tier** — 100 req/min (OAuth), 10 req/min (unauth). Sufficient for a 40-member community. |
| **Paid tier** | $12,000/yr minimum if commercial use required. ZAO is non-commercial — free tier is fine. |
| **Text limit** | 40,000 chars for self posts — no truncation needed (Farcaster is 1,024 chars). |
| **Subreddit creation** | Manual — create r/thezao by hand, then automate posting to it via API. |
| **Music subreddits** | r/listentothis, r/WeAreTheMusicMakers, r/indieheads, r/IndieMusicFeedback — each has strict self-promo rules. |
| **Risk** | Reddit API access now requires application approval (no more self-service). Plan for 1-2 week approval wait. |

---

## 1. Reddit API — Current State (March 2026)

### Timeline of API Changes

| Date | Event |
|------|-------|
| **2008-2023** | Free API, no rate limits beyond basic throttling |
| **April 2023** | Reddit announces paid API — $0.24 per 1K calls |
| **July 2023** | Pricing takes effect. Apollo ($20M/yr cost), RIF, Sync all shut down |
| **Late 2024** | Self-service API access removed — must apply and be approved |
| **2025-2026** | Three-tier system: Free, Premium ($12K/yr), Enterprise (custom) |

### Current Tier Structure

| Tier | Cost | Rate Limit | Commercial Use | Support |
|------|------|-----------|----------------|---------|
| **Free** | $0 | 100 req/min (OAuth), 10 req/min (unauth) | No | Community forums only |
| **Premium** | $12,000/yr | 100-500 req/min (scales with payment) | Yes | Email, business hours |
| **Enterprise** | Custom | Custom/unlimited | Yes | Dedicated account manager |

### Key Constraints

- **Free tier = non-commercial only.** Monetizing apps on free tier violates ToS.
- **Data access is identical across all tiers** — payment buys rate limits + commercial rights, not more data.
- **API access requires application approval** — submit at reddit.com/prefs/apps and wait for review.
- **All requests must use OAuth2** — cookie auth and unauthenticated access are deprecated.

### ZAO Fit Assessment

ZAO OS is a non-commercial community tool. Cross-posting member content to Reddit is personal/community use. The free tier's 100 req/min is vastly more than needed for a 40-member community (even posting 100 times/day = ~0.07 req/min average).

**Verdict: Free tier is sufficient. No cost.**

---

## 2. SDK Options

### Option A: snoowrap (Recommended for Quick Start)

| Detail | Value |
|--------|-------|
| **Package** | `snoowrap` v1.23.0 |
| **npm** | ~15K weekly downloads |
| **Language** | JavaScript (no TypeScript types built-in, `@types/snoowrap` available) |
| **Last publish** | 2020 — **unmaintained** |
| **Dependencies** | `bluebird` (Promises), `lodash`, `request-promise` |
| **Rate limiting** | Built-in — queues requests when hitting Reddit's limits |
| **Lazy objects** | Yes — never fetches more than needed |

**Pros:** Battle-tested, huge community, built-in rate limit handling, covers every Reddit endpoint.
**Cons:** Unmaintained since 2020, uses deprecated `request` library, no native TypeScript, relies on Bluebird instead of native Promises.

### Option B: traw (TypeScript Successor)

| Detail | Value |
|--------|-------|
| **Package** | `traw` v1.0.8 |
| **npm** | Very low downloads (~0 dependents) |
| **Language** | TypeScript-native |
| **Last publish** | ~mid-2025 |
| **Motivation** | Address snoowrap's lack of maintenance + security concerns |

**Pros:** TypeScript-native, modern, addresses snoowrap's security debt.
**Cons:** Very low adoption, single maintainer, limited community support, may have edge cases.

### Option C: Raw fetch (Recommended for Production)

| Detail | Value |
|--------|-------|
| **Package** | None — use built-in `fetch` |
| **Language** | TypeScript |
| **Dependencies** | Zero |
| **Maintenance** | You own it |

**Pros:** Zero dependencies, full TypeScript control, no abandoned library risk, matches ZAO OS pattern (direct API calls like Supabase, Neynar).
**Cons:** Must implement rate limit handling, OAuth token refresh, error mapping yourself.

### Recommendation

**Phase 1:** Use `snoowrap` for rapid prototyping — it handles OAuth, rate limits, and token refresh automatically. Wrap it in a thin `src/lib/reddit/client.ts` abstraction.

**Phase 2:** If snoowrap causes issues (deprecated `request` lib, security audit flags), migrate to raw `fetch` with a custom Reddit client class. The abstraction layer means the rest of the app is unaffected.

---

## 3. OAuth2 Flow

### Reddit App Types

| Type | Use Case | Auth Flow |
|------|----------|-----------|
| **Script** | Personal bots, single-account automation | Username + password + client ID + secret |
| **Web App** | Multi-user apps where users authorize their accounts | Authorization Code flow |
| **Installed App** | Mobile/desktop apps without a server | Implicit grant (no secret) |

### Phase 1: Script App (Community Bot)

For posting to r/thezao from a community bot account:

1. Create a Reddit account (e.g., `u/ZAOBot`)
2. Go to reddit.com/prefs/apps, create a "script" type app
3. Note the `client_id` (under app name) and `client_secret`
4. Authenticate with username/password + client credentials

```
POST https://www.reddit.com/api/v1/access_token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=ZAOBot&password=xxxxx
```

**Env vars needed:**
```
REDDIT_CLIENT_ID=xxxxxxxxxxxx
REDDIT_CLIENT_SECRET=xxxxxxxxxxxx
REDDIT_USERNAME=ZAOBot
REDDIT_PASSWORD=xxxxxxxxxxxx
```

**Security note:** Store these as server-only env vars. Never expose to browser. Same treatment as `NEYNAR_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.

### Phase 2: OAuth2 Authorization Code Flow (User Accounts)

For letting individual ZAO members connect their Reddit accounts:

**Step 1 — Redirect user to Reddit:**
```
https://www.reddit.com/api/v1/authorize?
  client_id=CLIENT_ID
  &response_type=code
  &state=RANDOM_CSRF_TOKEN
  &redirect_uri=https://zaoos.com/api/reddit/callback
  &duration=permanent
  &scope=identity,submit,read
```

**Step 2 — Exchange code for token (server-side):**
```
POST https://www.reddit.com/api/v1/access_token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=CODE&redirect_uri=https://zaoos.com/api/reddit/callback
```

**Step 3 — Store tokens:**
- `access_token` (1 hour TTL)
- `refresh_token` (permanent if `duration=permanent`)
- Store in Supabase `users` table: `reddit_username`, `reddit_refresh_token` (encrypted)

**Step 4 — Refresh when expired:**
```
POST https://www.reddit.com/api/v1/access_token
Authorization: Basic base64(client_id:client_secret)

grant_type=refresh_token&refresh_token=REFRESH_TOKEN
```

### Required Scopes

| Scope | Purpose |
|-------|---------|
| `identity` | Read username, verify connection |
| `submit` | Create posts (text + link) |
| `read` | Read subreddit info, verify post success |
| `mysubreddits` | List user's subscribed subreddits (for picker UI) |
| `flair` | Set post flair (some subreddits require it) |

Minimal for cross-posting: `identity,submit,read`

---

## 4. Posting to Reddit

### Submit Endpoint

```
POST https://oauth.reddit.com/api/submit
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/x-www-form-urlencoded
User-Agent: ZAO-OS/1.0 (by /u/ZAOBot)

kind=self&sr=thezao&title=New+track+from+ZAO&text=Check+out+this+new+release...
```

### Post Types

| Parameter | `kind` value | Required fields |
|-----------|-------------|-----------------|
| **Text post** | `self` | `sr`, `title`, `text` |
| **Link post** | `link` | `sr`, `title`, `url` |
| **Crosspost** | `crosspost` | `sr`, `title`, `crosspost_fullname` |
| **Image** | `image` | `sr`, `title`, `url` (after uploading via media endpoint) |

### snoowrap Code Pattern

```typescript
import Snoowrap from 'snoowrap';

const reddit = new Snoowrap({
  userAgent: 'ZAO-OS/1.0 (by /u/ZAOBot)',
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  username: process.env.REDDIT_USERNAME!,
  password: process.env.REDDIT_PASSWORD!,
});

// Text post
await reddit.getSubreddit('thezao').submitSelfpost({
  title: 'New track drop from ZAO member',
  text: 'Check out this new release from our community...\n\nhttps://zaoos.com/music/track-id',
});

// Link post
await reddit.getSubreddit('thezao').submitLink({
  title: 'New track drop from ZAO member',
  url: 'https://zaoos.com/music/track-id',
});
```

### Raw fetch Code Pattern

```typescript
async function submitRedditPost(params: {
  subreddit: string;
  title: string;
  text?: string;
  url?: string;
  accessToken: string;
}) {
  const body = new URLSearchParams({
    sr: params.subreddit,
    title: params.title,
    kind: params.url ? 'link' : 'self',
    ...(params.text && { text: params.text }),
    ...(params.url && { url: params.url }),
    resubmit: 'true',
    send_replies: 'false',
  });

  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.accessToken}`,
      'User-Agent': 'ZAO-OS/1.0 (by /u/ZAOBot)',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Reddit API error: ${res.status}`);
  return res.json();
}
```

### User-Agent Requirement

Reddit requires a unique, descriptive `User-Agent` string. Requests without one or with a generic agent get rate-limited aggressively or blocked.

Format: `platform:app_id:version (by /u/username)`
Example: `web:zao-os:1.0.0 (by /u/ZAOBot)`

---

## 5. Rate Limits

### Free Tier Limits

| Metric | Limit |
|--------|-------|
| **OAuth requests** | 100/minute |
| **Unauthenticated** | 10/minute |
| **Monthly total** | ~10,000 (reported, not officially documented) |
| **Post cooldown** | ~10 minutes between posts per account (anti-spam) |
| **New account restriction** | New accounts face stricter posting limits |

### Rate Limit Headers

Reddit returns rate limit info in response headers:
```
X-Ratelimit-Remaining: 97
X-Ratelimit-Used: 3
X-Ratelimit-Reset: 45
```

### ZAO Usage Estimate

| Action | Frequency | API Calls |
|--------|-----------|-----------|
| Cross-post to r/thezao | ~10/day | 10 |
| Cross-post to music subreddits | ~2/day | 2 |
| Token refresh | ~24/day | 24 |
| **Daily total** | | **~36** |
| **Monthly total** | | **~1,080** |

Free tier allows ~4,320,000 requests/month (100/min * 60 * 24 * 30). ZAO's usage is 0.025% of that. No concern whatsoever.

### Anti-Spam Considerations

- Reddit has aggressive anti-spam for new accounts and accounts that only post links
- **The 9:1 rule (unofficial but enforced):** For every self-promotional post, contribute 9 non-promotional interactions
- Bot accounts should be clearly labeled (in username or flair)
- Posting the same content to multiple subreddits simultaneously can trigger spam filters
- **Recommendation:** Stagger cross-posts to different subreddits by 5-10 minutes

---

## 6. Reddit API Pricing — Full History

### The 2023 Controversy

- April 2023: Reddit CEO Steve Huffman announces paid API at $0.24/1K calls
- This would cost Apollo ~$20M/year, Reddit is Fun ~$12M/year
- June 2023: Massive subreddit blackout (8,000+ subreddits went dark)
- July 1, 2023: Pricing takes effect. Apollo, RIF, Sync, BaconReader all shut down
- Reddit also killed the "old.reddit.com" API-based experience for third-party apps

### Current State (2026)

| Aspect | Detail |
|--------|--------|
| **Free tier** | 100 req/min, non-commercial only |
| **Commercial floor** | $12,000/year |
| **API key acquisition** | Application-based (no self-service) — submit request, wait for approval |
| **Data access** | Same across all tiers — payment buys throughput + commercial rights |
| **Community sentiment** | Still negative among developers. Many moved to Bluesky/Lemmy |

### Cost Comparison with Other Platforms

| Platform | Cost for ZAO's Usage | Notes |
|----------|---------------------|-------|
| **Farcaster** | Neynar plan (~$50/mo) | Already paying |
| **Bluesky** | $0 | Completely free |
| **Nostr** | $0 | Permissionless |
| **Reddit** | **$0** | Free tier, non-commercial |
| **X/Twitter** | $0-200/mo | Free = write-only, Basic = $200/mo |
| **Mastodon** | $0 | Free, federated |
| **Threads** | $0 | Free API |

---

## 7. Music Subreddits — Target Communities

### Tier 1: Best Fit for ZAO

| Subreddit | Members | Self-Promo Rules | Best Post Type |
|-----------|---------|-----------------|----------------|
| **r/listentothis** | 19M+ | Weekly "Melting Pot" thread only. Must be <250K Spotify listeners. | Link post to track |
| **r/WeAreTheMusicMakers** | 1.7M+ | Weekly promotion thread only. No direct self-promo posts. | Text post with context |
| **r/IndieMusicFeedback** | 100K+ | Must give feedback to others first before posting own music | Link post + feedback |
| **r/indieheads** | 2M+ | Daily music discussion threads. Fresh music Fridays. | Discussion + link |

### Tier 2: Genre-Specific

| Subreddit | Members | Focus |
|-----------|---------|-------|
| **r/hiphopheads** | 2.5M+ | Hip-hop, rap |
| **r/electronicmusic** | 500K+ | Electronic, EDM |
| **r/rnb** | 200K+ | R&B, soul |
| **r/experimentalmusic** | 100K+ | Experimental, avant-garde |
| **r/Songwriters** | 100K+ | Original songwriting |

### Tier 3: Industry & Business

| Subreddit | Members | Focus |
|-----------|---------|-------|
| **r/musicbusiness** | 50K+ | Industry news, deals |
| **r/MusicIndustry** | 30K+ | Business of music |
| **r/musicproduction** | 500K+ | Production techniques |

### Self-Promotion Strategy

Most music subreddits have strict anti-spam rules:

1. **Never auto-post to large subreddits.** r/listentothis and r/WeAreTheMusicMakers will ban bots.
2. **Auto-post only to r/thezao** (community-owned subreddit).
3. **For external subreddits:** Provide members a "share to Reddit" button that pre-fills title/text but requires manual submission through Reddit's UI.
4. **Respect the 9:1 rule:** Community bot should also engage (comment, upvote) — not just post links.

---

## 8. Creating r/thezao

### Can You Create a Subreddit via API?

The Reddit API has a `POST /api/site_admin` endpoint that can technically create subreddits, but:

- The account must be at least **30 days old**
- The account needs **sufficient karma** (10-500, varies by anti-spam heuristics)
- Reddit's automated checks consider account history, IP reputation, behavior patterns
- **Recommendation:** Create r/thezao manually through the Reddit web UI, then automate posting to it

### Subreddit Setup Checklist

1. Create Reddit account `u/TheZAO` or `u/ZAOBot` (or both — human account + bot account)
2. Age the account for 30+ days, build some karma
3. Create r/thezao subreddit manually via reddit.com/subreddits/create
4. Configure:
   - Description: "THE ZAO — a decentralized music community on Farcaster"
   - Sidebar: Links to ZAO OS, Farcaster channels, community resources
   - Rules: Community guidelines matching ZAO's existing moderation
   - Flair: Categories like "New Release", "Discussion", "Event", "Collaboration"
   - AutoModerator: Welcome messages, flair enforcement
5. Set `u/ZAOBot` as moderator with post permissions
6. Enable the bot to auto-post member content

### Auto-Post Content Types

| Content | Reddit Format | Target Subreddit |
|---------|--------------|-----------------|
| New song shared in ZAO chat | Link post to track URL | r/thezao |
| Community discussion | Text post (cross-post from Farcaster) | r/thezao |
| Weekly music roundup | Text post with curated links | r/thezao, r/listentothis (Melting Pot) |
| Artist spotlight | Text post with bio + links | r/thezao |
| Event announcement | Text post | r/thezao |

---

## 9. Implementation Plan

### Phase 1: Community Bot Cross-Post (1-2 days)

Post to r/thezao from a community bot account whenever content is shared in ZAO OS.

**Prerequisites:**
- Create Reddit account + app (script type)
- Wait for API access approval (1-2 weeks)
- Create r/thezao subreddit manually

**New env vars:**
```
REDDIT_CLIENT_ID=xxxxxxxxxxxx
REDDIT_CLIENT_SECRET=xxxxxxxxxxxx
REDDIT_USERNAME=ZAOBot
REDDIT_PASSWORD=xxxxxxxxxxxx
REDDIT_SUBREDDIT=thezao
```

**New file:** `src/lib/reddit/client.ts`
```typescript
import Snoowrap from 'snoowrap';

let client: Snoowrap | null = null;

export function getRedditClient(): Snoowrap {
  if (client) return client;
  client = new Snoowrap({
    userAgent: 'web:zao-os:1.0.0 (by /u/ZAOBot)',
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    username: process.env.REDDIT_USERNAME!,
    password: process.env.REDDIT_PASSWORD!,
  });
  return client;
}

export async function postToReddit(params: {
  title: string;
  text?: string;
  url?: string;
  subreddit?: string;
}) {
  const reddit = getRedditClient();
  const sr = params.subreddit || process.env.REDDIT_SUBREDDIT || 'thezao';

  if (params.url) {
    return reddit.getSubreddit(sr).submitLink({
      title: params.title,
      url: params.url,
    });
  }

  return reddit.getSubreddit(sr).submitSelfpost({
    title: params.title,
    text: params.text || '',
  });
}
```

**Modify:** `src/lib/validation/schemas.ts` — add `crossPostReddit: z.boolean().optional()` to `sendMessageSchema`

**Modify:** `src/app/api/chat/send/route.ts` — add Reddit to the cross-post fan-out:
```typescript
if (parsed.data.crossPostReddit) {
  postToReddit({
    title: `${authorName} shared in THE ZAO`,
    text: text,
    url: trackUrl || undefined,
  }).catch(err => console.error('[reddit]', err));
}
```

**Modify:** `src/components/chat/ComposeBar.tsx` — add "Reddit" toggle alongside existing cross-post checkboxes.

### Phase 2: Individual Account OAuth (3-5 days)

Let members connect their own Reddit accounts to cross-post under their name.

**New file:** `src/app/api/reddit/login/route.ts`
- Generate CSRF state token, store in session
- Redirect to `https://www.reddit.com/api/v1/authorize` with scopes `identity,submit,read`

**New file:** `src/app/api/reddit/callback/route.ts`
- Exchange authorization code for access + refresh tokens
- Store `reddit_username` and encrypted `reddit_refresh_token` in Supabase `users` table
- Redirect to settings page with success message

**New file:** `src/app/api/reddit/post/route.ts`
- Post on behalf of connected user
- Handle token refresh when access token expires (1hr TTL)
- Validate input with Zod

**Database migration:**
```sql
ALTER TABLE users ADD COLUMN reddit_username TEXT;
ALTER TABLE users ADD COLUMN reddit_refresh_token TEXT; -- encrypted
ALTER TABLE users ADD COLUMN reddit_connected_at TIMESTAMPTZ;
```

**Settings page:** Add Reddit connection status alongside Farcaster/Wallet/XMTP/Bluesky connections.

### Phase 3: Smart Subreddit Targeting (Future)

- Let members choose which external subreddits to cross-post to
- Pre-fill post titles per subreddit conventions (e.g., "[FRESH] Artist - Track" for r/indieheads)
- Check subreddit rules before posting (flair requirements, post type restrictions)
- Stagger posts to avoid Reddit spam detection
- Track karma and engagement per subreddit for analytics

---

## 10. Comparison: Reddit vs Other Cross-Post Targets

| Feature | Reddit | Bluesky | Nostr | Lens |
|---------|--------|---------|-------|------|
| **Users** | 1.7B accounts, ~73M DAU | 40.2M | ~16M keypairs | 650K |
| **Cost** | $0 (free tier) | $0 | $0 | $0 |
| **SDK** | snoowrap (unmaintained) | @atproto/api (official) | nostr-tools (active) | @lens-protocol/client |
| **Auth complexity** | Medium (OAuth2 + approval) | Low (app password / OAuth) | Low (keypair) | Medium (EIP-712) |
| **Music community** | Huge (19M+ on r/listentothis) | Growing (771+ starter packs) | Strong (Wavlake) | Limited |
| **Self-promo rules** | Strict (9:1 rule, per-sub rules) | None | None | None |
| **Text limit** | 40,000 chars | 300 chars | Unlimited | Unlimited |
| **Rate limits** | 100 req/min | 5,000 pts/hr | None (relay-dependent) | Generous |
| **API stability** | Controversial history | Stable, free | Protocol-level | Stable |
| **Best for ZAO** | Reach to mainstream music fans | Largest non-Farcaster audience | V4V micropayments | Web3-native social |

---

## 11. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API access approval delayed | Medium | Blocks Phase 1 | Apply early. Have Ayrshare as fallback ($49/mo, supports Reddit). |
| snoowrap breaks (deprecated deps) | Medium | Dev time to fix | Wrap in abstraction layer. Migration to raw fetch is straightforward. |
| Reddit bans bot for spam | Low | Loses cross-post channel | Follow 9:1 rule, stagger posts, engage authentically. |
| Reddit changes pricing/access | Medium | Could require paid tier | Keep usage low, Ayrshare as fallback. |
| Members' Reddit accounts flagged | Low | Individual impact | Educate about Reddit's self-promo rules. Use "share" button (manual) for external subs. |
| subreddit name r/thezao taken | Low | Need alternate name | Check availability now. Alternatives: r/TheZAOMusic, r/ZAOCommunity. |

---

## 12. Ayrshare Fallback

If Reddit API access is denied or too cumbersome, Ayrshare ($49/mo Starter plan) supports Reddit posting:

- Already mentioned in Doc 28 as a Tier 2 cross-posting tool
- Handles OAuth, rate limits, retries
- Single API call posts to Reddit + X + Threads + others
- Tradeoff: adds a dependency and monthly cost vs direct integration

---

## Sources

- [Reddit API Pricing 2026 — Easy Reader News](https://easyreadernews.com/reddit-api-pricing-explained-costs-limits-and-what-you-should-know-in-2026/)
- [Complete Guide to Reddit API Pricing 2026 — BBN Times](https://www.bbntimes.com/technology/complete-guide-to-reddit-api-pricing-and-usage-tiers-in-2026)
- [Reddit API Pricing — Data365](https://data365.co/blog/reddit-api-pricing)
- [Reddit API Cost 2025 — RankVise](https://rankvise.com/blog/reddit-api-cost-guide/)
- [Reddit API Controversy — Wikipedia](https://en.wikipedia.org/wiki/Reddit_API_controversy)
- [Reddit Data API Wiki — Reddit Help](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)
- [snoowrap — npm](https://www.npmjs.com/package/snoowrap)
- [snoowrap — GitHub](https://github.com/not-an-aardvark/snoowrap)
- [traw (TypeScript Reddit API Wrapper) — GitHub](https://github.com/jamesrswift/traw)
- [Reddit OAuth2 Wiki — GitHub](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [Reddit OAuth2 Quick Start — GitHub](https://github.com/reddit-archive/reddit/wiki/oauth2-quick-start-example)
- [Post to Reddit using its API — DEV Community](https://dev.to/codybontecou/post-to-reddit-using-its-api-15g7)
- [simple-oauth2-reddit — npm](https://www.npmjs.com/package/@jimmycode/simple-oauth2-reddit)
- [Reddit API Limits — Data365](https://data365.co/blog/reddit-api-limits)
- [How to Promote Music on Reddit 2026 — Ditto Music](https://dittomusic.com/en/blog/how-to-promote-music-on-reddit)
- [Promote Music on Reddit — Groover](https://blog.groover.co/en/tips/reddit-promote-music/)
- [Music Promotion Subreddits — Unlock Your Sound](https://unlockyoursound.com/promote-music-reddit)
- [15 Music Subreddits You Need to Know — Benjamin Groff](https://www.benjamingroff.com/how-to-promote-your-music-on-reddit/)
- [Reddit API Guide — Zuplo](https://zuplo.com/learning-center/reddit-api-guide)
- [Reddit API Tools for Developers 2026 — PainOnSocial](https://painonsocial.com/blog/reddit-api-tools-2)
- [Ayrshare Pricing](https://www.ayrshare.com/pricing/)
