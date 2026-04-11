# 319 - X/Twitter Scraping Tools That Work in April 2026

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Find reliable, low-cost ways to look up X/Twitter profiles for ZAO members and research targets - without paying $200/month for X API access

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Profile lookups (free)** | USE rettiwt-api v6.2.2 guest mode. Zero auth, zero ban risk, free. Tested and confirmed working on 8 real profiles today. Node 22 required. |
| **Getting X handles** | USE Neynar verified_accounts field - already built into ZAO OS. Pulls X handles from Farcaster profiles automatically. |
| **Paid fallback** | USE TwitterAPI.io at $0.18 per 1,000 profiles. Free credits on signup. Most reliable paid option if guest mode ever gets rate-limited. |
| **MCP for Claude Code** | CONSIDER Xquik MCP at $0.00015/call with 122 endpoints. Native MCP integration for Claude Code sessions. |
| **Full scraping (tweets, search)** | USE @the-convocation/twitter-scraper v0.22.3. Requires login cookies. Ban risk to the account used - use a burner. |
| **Write access (posting)** | USE goat-x v1.4.4. Fork of twitter-scraper with write capabilities. Used by ElizaOS ecosystem. |
| **Nitter** | SKIP - public instances are dead. Self-hosting requires real X accounts and constant maintenance. Not worth it. |
| **X Official API** | SKIP - free tier cannot look up other users. Basic tier is $200/month. Way too expensive for profile lookups. |

---

## Comparison of Options

| Tool | Cost | Runtime | Ban Risk | Auth Required | Profile Lookup | Tweet Scraping | Write Access | Last Updated |
|------|------|---------|----------|---------------|----------------|----------------|--------------|--------------|
| **rettiwt-api** | Free | Node.js (22+) | None (guest mode) | No | YES | Guest: limited / User: full | No | Apr 4, 2026 |
| **TwitterAPI.io** | $0.18/1K profiles | REST API | None | API key | YES | YES | No | Active |
| **@the-convocation/twitter-scraper** | Free | Node.js | HIGH (account ban) | Login cookies | YES | YES | No | Apr 1, 2026 |
| **goat-x** | Free | Node.js | HIGH (account ban) | Login cookies | YES | YES | YES | Nov 2025 |
| **Xquik MCP** | $0.00015/call | MCP server | None | API key | YES | YES | Unknown | Active |
| **Scweet** | Free | Python | Medium | Browser cookies | YES | YES | No | Active |
| **X Official Free** | Free | REST API | None | OAuth | Own profile only | POST only | YES | - |
| **X Official Basic** | $200/month | REST API | None | OAuth | YES | YES | YES | - |

---

## Recommended Approach: Two-Step Pipeline

### Step 1: Get X Handles from Farcaster (Already Built)

ZAO OS already pulls X handles from Farcaster via Neynar's `verified_accounts` field. No new code needed.

**Existing code locations:**

- `src/app/(auth)/settings/page.tsx` (lines 54-64) - reads verified X handle from user profile
- `src/app/api/admin/member-fix/route.ts` (lines 229-243) - batch pulls X handles for member data

The Neynar user object includes `verified_accounts` which contains platform-specific handles including X/Twitter.

### Step 2: Look Up Profiles with rettiwt-api Guest Mode

```bash
npm install rettiwt-api
```

```typescript
// src/lib/social/x-lookup.ts
import { Rettiwt } from 'rettiwt-api';

const rettiwt = new Rettiwt(); // guest mode - no auth needed

export async function lookupXProfile(username: string) {
  const user = await rettiwt.user.details(username);
  return {
    name: user.fullName,
    handle: user.userName,
    followers: user.followersCount,
    following: user.followingCount,
    bio: user.description,
    profileImage: user.profileImage,
    verified: user.isVerified,
  };
}

export async function lookupXProfiles(usernames: string[]) {
  const results = await Promise.allSettled(
    usernames.map((u) => lookupXProfile(u))
  );
  return results.map((r, i) => ({
    username: usernames[i],
    ...(r.status === 'fulfilled' ? { data: r.value } : { error: r.reason?.message }),
  }));
}
```

**Requires Node 22.** The ZAO OS project should already be on Node 22 for Next.js 16.

---

## Tested and Confirmed Working

Ran rettiwt-api guest mode against 8 real X profiles on April 11, 2026. All returned successfully:

| Handle | Followers | Notes |
|--------|-----------|-------|
| @TheDFreshmaker | 16,208 | ZAO member |
| @Hurric4n3Ike | 5,816 | ZAO member |
| @bettercallzaal | 4,858 | ZAO founder |
| @thyrevolution | 4,606 | ZAO member |
| @ohnahji | 4,465 | ZAO member |
| @AttaBotty | 1,998 | ZAO member |
| @trickybuddha | 526 | ZAO member |
| @failoften_ | 101 | ZAO member |

All 8 lookups returned full profile data including follower counts, bios, and profile images. Zero errors, zero rate limiting.

---

## What Does NOT Work in 2026

| Tool / Approach | Why It Fails |
|-----------------|-------------|
| **Nitter public instances** | All dead. Self-hosting requires real X accounts and breaks constantly. |
| **X Official Free Tier** | Can only POST tweets and GET your own profile. Cannot look up other users at all. |
| **X Basic API** | $200/month for 10K tweets. Works but absurdly expensive for profile lookups. |
| **Syndication API / twittxr** | Archived project, endpoints dead. |
| **Firecrawl on X URLs** | Blocked by X's anti-bot protections. Returns empty or 403. |
| **Jina Reader on X profiles** | Also blocked. Works for individual tweets (see Doc 306) but not profile pages. |

---

## ZAO OS Integration Plan

### New Files to Create

1. **`src/lib/social/x-lookup.ts`** - Profile lookup utility using rettiwt-api (code above)

### Existing Files That Already Handle X Data

- `src/app/(auth)/settings/page.tsx` - Displays user's verified X handle
- `src/app/api/admin/member-fix/route.ts` - Batch member data including X handles
- `community.config.ts` - Could add X handles to member profiles

### Agent Use Cases

- **BCZ Agent** - Look up X profiles for job prospect research, client research, partner evaluation
- **ZOE** - Team research, member social reach analysis, community growth tracking
- **FISHBOWLZ** - Social verification for fishbowl participants

### Install

```bash
npm install rettiwt-api
```

Node 22+ is required. Add to `package.json` engines if not already specified.

---

## Key Numbers

- **rettiwt-api v6.2.2** - latest version, updated April 4, 2026
- **$0** - cost of rettiwt-api guest mode
- **$0.18/1,000 profiles** - TwitterAPI.io pricing
- **$0.00015/call** - Xquik MCP pricing
- **$200/month** - X Official Basic API (the thing we are avoiding)
- **8/8** - profiles successfully scraped in testing
- **Node 22** - minimum runtime requirement for rettiwt-api
- **122** - Xquik MCP endpoints available

---

## Sources

- rettiwt-api npm: https://www.npmjs.com/package/rettiwt-api
- rettiwt-api GitHub: https://github.com/Rishikant181/Rettiwt-API
- @the-convocation/twitter-scraper npm: https://www.npmjs.com/package/@the-convocation/twitter-scraper
- TwitterAPI.io: https://twitterapi.io/
- Xquik MCP GitHub: https://github.com/Xquik-dev/x-twitter-scraper
- Neynar user lookup docs: https://docs.neynar.com/reference/lookup-user-by-custody-address
- ZAO OS Doc 306 (web scraping): `research/dev-workflows/306-web-scraping-ai-agents/README.md`
