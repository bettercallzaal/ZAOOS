# 212 — Vercel Integrations, Airtable & Custom Integration Console for ZAO OS

> **Status:** Research complete
> **Date:** March 29, 2026
> **Goal:** Identify Vercel marketplace integrations, built-in features, and Airtable data pipelines that benefit ZAO OS — plus evaluate building a custom Vercel integration

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Bot Protection** | ENABLE NOW — free on all plans, one-click in dashboard, no CAPTCHAs. Protects governance voting endpoints from bot manipulation |
| **Vercel Firewall rules** | ENABLE NOW — add custom WAF rules for `/api/proposals/vote`, `/api/admin/*`. Free on all plans, 300ms global propagation |
| **Edge Config** | USE for feature flags + maintenance mode + admin allowlist. Free: 100K reads/mo. Sub-1ms P99 latency. Replace any hardcoded toggles |
| **AI Gateway** | USE to replace direct Anthropic calls in `src/lib/moderation/moderate.ts`. $5/mo free credit, zero token markup, auto-failover across 100+ models |
| **Resend** | USE for transactional email (governance notifications, welcome, weekly digests). Free: 100 emails/day (3K/mo). React Email templates. Native Vercel marketplace integration |
| **Vercel Blob** | USE for user-uploaded content (album art, avatars, proposal attachments). $0.023/GB-month. Client uploads supported |
| **Flags SDK** | USE with Edge Config for zero-deploy feature toggles. $30 per 1M flag requests. Good for binaural beats experiments, new UI rollouts |
| **Airtable deeper import** | EXPAND existing `src/app/api/admin/respect-import/route.ts` — already imports Respect data. Add fractal session history import from Airtable |
| **Supabase Airtable Wrapper** | SKIP — read-only FDW, adds complexity vs the one-time import script already built |
| **Vercel KV** | SKIP — product sunset. Already using Upstash Redis directly in `src/lib/rate-limit.ts` |
| **Vercel Postgres** | SKIP — product sunset. Already using Supabase PostgreSQL |
| **Custom Vercel Integration** | DEFER — only relevant when ZAO OS becomes a forkable platform. 2-4 weeks to build marketplace-ready integration |

---

## Comparison of Options: Vercel Built-in Features

| Feature | Status in ZAO OS | Free Tier | Action |
|---------|-----------------|-----------|--------|
| **Speed Insights** | Already enabled | Included | Keep |
| **Web Analytics** | Already enabled | Included | Keep |
| **Bot Protection** | NOT enabled | Free, all plans | Enable today |
| **Firewall WAF** | NOT configured | Free custom rules | Add rules for governance endpoints |
| **Edge Config** | NOT used | 100K reads/mo | Add for feature flags |
| **AI Gateway** | NOT used | $5/mo credit | Replace direct Anthropic calls |
| **Vercel Blob** | NOT used | 100MB free | Add for media uploads |
| **Flags SDK** | NOT used | $30/1M requests | Pair with Edge Config |
| **Vercel Agent** | NOT used | $0.30/action | Monitor — early product |
| **AI Sandboxes** | NOT used | Beta | Monitor — code execution sandbox |
| **KV (Redis)** | Sunset | N/A | Already using Upstash directly |
| **Postgres** | Sunset | N/A | Already using Supabase |

---

## Comparison of Options: Marketplace Integrations

| Integration | Category | Free Tier | ZAO OS Relevance | Action |
|-------------|----------|-----------|-------------------|--------|
| **Resend** | Email | 100 emails/day (3K/mo) | Governance notifications, welcome emails, weekly digest | INSTALL |
| **Sentry** | Error tracking | 5K errors/mo | Error monitoring for 30+ music components | Already configured |
| **Upstash Redis** | Rate limiting | 10K commands/day | Rate limiting in `src/lib/rate-limit.ts` | Already configured |
| **Checkly** | Monitoring | 5 checks | Synthetic monitoring for login, playback, voting flows | INSTALL when scaling |
| **Axiom** | Logging | 500MB/mo ingest | Structured logging + log drains from Vercel | EVALUATE |
| **Clerk** | Auth | 10K MAU | ZAO uses iron-session + SIWF — switching would be disruptive | SKIP |
| **Sanity** | CMS | Free tier | ZAO content is in Supabase + Farcaster casts — no CMS needed | SKIP |
| **Neon** | Database | 500MB | Already using Supabase PostgreSQL | SKIP |
| **PlanetScale** | Database | Deprecated | N/A | SKIP |

---

## Vercel AI Gateway — Deep Dive

The AI Gateway is the most impactful new integration for ZAO OS. Currently, `src/lib/moderation/moderate.ts` calls the Perspective API directly, and any future AI features (taste profiles, curation AI per Doc 8) would need their own provider setup.

### What AI Gateway Provides
- **Unified API** for 100+ models (Anthropic Claude, OpenAI GPT, Google Gemini, Mistral, xAI Grok)
- **Zero token markup** — pay provider list prices through Vercel
- **BYOK mode** — bring your own API key with no additional fees
- **Auto-failover** — if one provider is down, route to another
- **Usage monitoring** — built-in dashboards, budgets, alerts
- **No rate limits** from Vercel's side (provider limits still apply)
- **$5/mo free credit** on all plans

### Integration Pattern
```typescript
// Before: direct Anthropic call
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// After: via Vercel AI Gateway (AI SDK)
import { generateText } from 'ai';
const result = await generateText({
  model: 'anthropic/claude-sonnet-4-5',
  prompt: 'Moderate this content...',
});
```

### ZAO OS Files to Update
- `src/lib/moderation/moderate.ts` — content safety scoring
- Future: `src/lib/ai/taste.ts` — AI taste profiles (Doc 8)
- Future: `src/lib/ai/curation.ts` — respect-weighted curation AI

---

## Airtable Integration — What's Built vs What's Possible

### Already Built
ZAO OS already has a working Airtable import at `src/app/api/admin/respect-import/route.ts`:
- Connects to Airtable base `appTUNG04rjZ9kSF4`, table "Respect"
- Fetches all records with pagination (handles `offset` cursor)
- Auto-detects field names (Name, Wallet, Total Respect, Fractal Respect, etc.)
- Counts fractal attendance from numeric session columns
- Upserts into `respect_members` table by name
- Admin-only, requires `AIRTABLE_TOKEN` env var
- UI trigger at `src/components/admin/ImportRespectButton.tsx`

### What to Add Next
The existing import only covers the Respect summary table. The Airtable base likely contains more data worth importing:

| Airtable Table | Data | Supabase Target | Priority |
|----------------|------|-----------------|----------|
| Respect (summary) | Member totals, wallets | `respect_members` | DONE |
| Session history | Per-session scores, dates, participants | `fractal_sessions` | HIGH — 90+ weeks of history |
| Contributions | Individual frapps/submissions per session | `fractal_contributions` | MEDIUM — useful for analytics |
| Members directory | Contact info, roles, join dates | `community_profiles` (Doc 110) | MEDIUM — feeds CRM |

### Airtable API Details
- **Rate limit:** 5 requests/second per base
- **Auth:** Personal access token (already configured as `AIRTABLE_TOKEN`)
- **Pagination:** 100 records/page, `offset` parameter for next page
- **API base:** `https://api.airtable.com/v0/{baseId}/{tableName}`
- **Supabase FDW alternative:** `airtable_fdw` extension exists but is read-only — SKIP, the import script approach is simpler and already working

### Expanding the Import Script
```typescript
// Pattern from existing route — extend for session history
const AIRTABLE_SESSIONS_TABLE = 'Sessions'; // or whatever the table is named

async function importSessions(token: string) {
  const records = await fetchAllRecords(token, AIRTABLE_SESSIONS_TABLE);
  for (const record of records) {
    await supabaseAdmin.from('fractal_sessions').upsert({
      session_number: record.fields['Session #'],
      date: record.fields['Date'],
      participants: record.fields['Participants'],
      notes: `Airtable import — OG era`,
    }, { onConflict: 'session_number' });
  }
}
```

---

## Vercel Bot Protection & Firewall

### Bot Protection (Enable Now)
- **Zero config** — one toggle in Vercel dashboard
- **Free on all plans** including Hobby
- **How it works:** Heuristics-based detection distinguishes browser traffic (human) from non-browser traffic (bot). Serves JS challenge to bots, no CAPTCHAs for humans
- **Excludes verified bots** (Googlebot, webhooks) automatically
- **Two modes:** Log Only (monitor) or Challenge (block)

### Custom WAF Rules (Add These)
ZAO OS should add custom firewall rules for sensitive endpoints:

| Rule | Path | Action | Reason |
|------|------|--------|--------|
| Rate limit voting | `/api/proposals/vote` | Rate limit 10/min per IP | Prevent vote stuffing |
| Admin protection | `/api/admin/*` | Challenge non-allowlisted IPs | Extra layer on admin routes |
| Cron auth | `/api/cron/*` | Block non-Vercel IPs | Cron routes should only run from Vercel |
| Bot challenge | `/api/auth/*` | Challenge suspicious UAs | Protect auth flow |

Rules propagate globally in 300ms. Dashboard includes IP enrichment (ASN, location) for investigation.

---

## Building a Custom Vercel Integration

The Integrations Console (which Zaal screenshotted) is for building integrations that OTHER Vercel users install. This is relevant when ZAO OS becomes a forkable platform.

### Integration Types
| Type | Effort | Use Case |
|------|--------|----------|
| **Connectable Account** | 1-2 days | OAuth connection, inject env vars, simple webhook |
| **Native Marketplace** | 2-4 weeks | Full server, billing, SSO, rich UI |
| **External** | Link only | Just a link to external docs/setup |

### What a "ZAO OS" Integration Would Do
If ZAO OS became a platform that other communities fork:
1. **One-click setup:** Install from Vercel Marketplace → auto-configure Supabase, Neynar, XMTP env vars
2. **Community provisioning:** Create new Supabase project, seed tables, generate app wallet
3. **Webhook sync:** Listen for `deployment.succeeded` to run post-deploy migrations
4. **Config UI:** Custom configuration page for `community.config.ts` values

### Requirements for Public Listing
- Logo, extended description, EULA, privacy policy, support URL
- OAuth redirect URL + API scopes
- 500+ active installs for featured listing
- Integration Agreement acceptance

**Verdict:** DEFER until ZAO OS has 5+ community forks. The Integrations Console is the right tool then, not now.

---

## Resend Email — Implementation Plan

ZAO OS currently has NO email capability. Resend fills this gap with minimal effort.

### What to Send
| Email Type | Trigger | Template |
|------------|---------|----------|
| Welcome | New member joins | "Welcome to THE ZAO" with next steps |
| Governance alert | New proposal created | Proposal title + vote link |
| Vote reminder | 24h before deadline | "Voting closes tomorrow" |
| Weekly digest | Cron (Sunday) | Top tracks, proposals, member activity |
| Fractal reminder | Cron (Monday noon) | "Fractal call tonight at 6pm EST" |

### Setup Steps
1. Install Resend from Vercel Marketplace → auto-creates `RESEND_API_KEY` env var
2. `npm install resend @react-email/components`
3. Create email templates in `src/lib/email/templates/`
4. Add send functions in `src/lib/email/send.ts`
5. Wire to existing API routes (proposal creation, member onboarding)

---

## Edge Config — Quick Wins

### Use Cases for ZAO OS
| Config Key | Value | Purpose |
|------------|-------|---------|
| `maintenance_mode` | `boolean` | Show maintenance page without redeploy |
| `feature_flags` | `{ binaural_v2: true, new_player: false }` | Toggle experimental features |
| `admin_fids` | `[19640, ...]` | Update admin list without code change |
| `blocked_fids` | `[...]` | Block bad actors instantly |
| `announcement` | `string` | Site-wide banner message |

### Integration
```typescript
import { get } from '@vercel/edge-config';

// In middleware.ts — sub-1ms read
const maintenance = await get('maintenance_mode');
if (maintenance) return NextResponse.rewrite('/maintenance');
```

Update `src/middleware.ts` and `community.config.ts` to read from Edge Config for dynamic values.

---

## Priority Implementation Order

| # | Integration | Effort | Impact | Cost |
|---|-------------|--------|--------|------|
| 1 | Bot Protection | 5 min (dashboard toggle) | High — protects all endpoints | Free |
| 2 | Firewall WAF rules | 30 min (dashboard config) | High — protects governance | Free |
| 3 | Edge Config | 2 hours (code) | Medium — dynamic config | Free (100K reads/mo) |
| 4 | Resend email | 1 day (code) | High — governance notifications | Free (100/day) |
| 5 | AI Gateway | 2 hours (code) | Medium — unified AI, auto-failover | $5/mo free credit |
| 6 | Vercel Blob | 2 hours (code) | Medium — media uploads | $0.023/GB-mo |
| 7 | Airtable session import | 3 hours (code) | Medium — historical fractal data | Free (existing token) |
| 8 | Flags SDK | 1 day (code) | Low-medium — feature rollouts | $30/1M requests |
| 9 | Checkly monitoring | 2 hours (setup) | Low — synthetic monitoring | Free (5 checks) |
| 10 | Custom integration | 2-4 weeks | Low (premature) | Free to build |

---

## Sources

- [Vercel AI Gateway](https://vercel.com/ai-gateway) — unified API, pricing, model catalog
- [Vercel AI Gateway Pricing](https://vercel.com/docs/ai-gateway/pricing) — $5/mo free, zero markup, BYOK
- [Vercel Bot Protection GA](https://vercel.com/changelog/bot-protection-is-now-generally-available) — free on all plans
- [Vercel Firewall Docs](https://vercel.com/docs/vercel-firewall) — WAF rules, DDoS, challenge mode
- [Vercel Edge Config](https://vercel.com/docs/edge-config) — sub-1ms reads, 100K/mo free
- [Vercel Edge Config Pricing](https://vercel.com/docs/edge-config/edge-config-limits) — $3/1M reads (Pro)
- [Vercel Flags Pricing](https://vercel.com/docs/flags/vercel-flags/limits-and-pricing) — $30/1M flag requests
- [Vercel Storage (Blob)](https://vercel.com/docs/storage) — KV sunset, Blob pricing
- [Resend for Vercel](https://vercel.com/marketplace/resend) — native marketplace integration
- [Resend + Vercel Functions](https://resend.com/docs/send-with-vercel-functions) — Next.js setup guide
- [Supabase Airtable Wrapper](https://supabase.com/docs/guides/database/extensions/wrappers/airtable) — FDW extension (read-only)
- [Vercel Integrations Docs](https://vercel.com/docs/integrations) — building custom integrations
- [Vercel Pricing](https://vercel.com/pricing) — plan comparison, storage, compute
- [Airtable API](https://airtable.com/developers/web/api/introduction) — REST API, 5 req/sec rate limit
