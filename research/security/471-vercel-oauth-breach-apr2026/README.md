# 471 - Vercel OAuth Supply Chain Breach April 2026 - ZAO Action Checklist

> **Status:** URGENT ACTION REQUIRED
> **Date:** 2026-04-21
> **Severity:** P0 — ZAO OS runs on Vercel (see `CLAUDE.md` + `.vercel/`)
> **Source:** Brendan Falk X post 2026-04-19 + Vercel bulletin + TechCrunch + TrendMicro analysis
> **Goal:** Determine ZAO's exposure to the April 2026 Vercel/Context.ai supply chain breach and execute rotation checklist

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Check Google Workspace NOW** | RUN Falk's audit immediately: https://admin.google.com/ac/owl/list?tab=apps filter by `110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com`. If hit = revoke + treat all Workspace-adjacent tokens as burned |
| **Assume non-sensitive env vars leaked** | ROTATE all Vercel env vars not marked "sensitive". ZAO OS has 40+ env vars; only marked-sensitive ones are safe |
| **Rotate upstream BEFORE Vercel** | Per GitGuardian: rotate AWS/Supabase/Neynar/Stripe keys in their dashboards FIRST, then push new values to Vercel. Otherwise brief window of stolen-key validity |
| **Re-classify secrets** | Mark `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY`, all RPC keys, Coinflow/Stream.io keys, XMTP app key as "sensitive" in Vercel. This stops future read-back per Vercel docs |
| **MFA + deployment protection** | ENABLE MFA on Vercel account + set Deployment Protection to Standard minimum. Rotate Deployment Protection tokens if configured |
| **Context.ai is the real lesson** | AUDIT every OAuth app in Google Workspace. Attacker pivoted via a third-party AI tool an employee used. Your team's AI tools are your attack surface |
| **ZAO affected customer check** | CONFIRM whether ZAO received the "affected customer" email from Vercel (subset of customers). If yes, exposure certain |
| **Post-rotate: add secret scanning** | INSTALL GitGuardian ggshield + pre-commit hook to prevent silent re-exposure |

---

## What Happened (Timeline)

| Date/Time PST | Event |
|---------------|-------|
| Feb 2026 | Lumma infostealer grabs Context.ai employee credentials |
| ~Apr 17 2026 | Attacker pivots from Context.ai OAuth -> Vercel employee's Google Workspace |
| Apr 19 11:04 AM | Vercel publishes indicators of compromise |
| Apr 19 3:50 PM | Brendan Falk X post publishes audit instructions (OAuth ID) |
| Apr 19 6:01 PM | Vercel discloses attack origin |
| Apr 20 10:59 AM | Vercel clarifies compromised credential definitions |
| Apr 20 5:32 PM | Vercel confirms npm packages uncompromised; MFA guidance added |
| Apr 20 | ShinyHunters offers data for $2M on BreachForums |

**The chain:** infostealer malware -> Context.ai credentials -> OAuth into Vercel employee's Google Workspace -> read of environment variables NOT marked "sensitive" across limited-subset customer base.

---

## Compromised OAuth App ID (Verified)

```
110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com
```

## ZAO Exposure Assessment

### Vercel usage in ZAO OS (confirmed)

- `CLAUDE.md` stack: "Next.js 16, React 19" with Vercel deployment standard
- 301 API routes all run on Vercel
- `.vercel/` directory exists in repo (per gitignore + references in docs/)
- Project memory `project_infra_keys.md`: Vercel listed as infra
- Env vars: `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY` + all others per `.env.example`

### Likelihood of impact

| Factor | ZAO status | Impact |
|--------|-----------|--------|
| Is ZAO on Vercel? | YES | Exposure possible |
| Are env vars marked "sensitive"? | UNKNOWN — needs audit | Determines read-access |
| Did ZAO get the "affected customer" email? | CHECK INBOX | Determines certainty |
| Does anyone on team use Context.ai? | CHECK | Direct-vector risk |
| Other third-party AI tools with Google OAuth? | Many (Claude, ChatGPT, etc) | Indirect-vector risk |

**Default assumption until proven otherwise:** ZAO env vars not marked sensitive may be leaked. Act as if they are.

---

## Action Checklist (do in order)

### PHASE 1 - Triage (next 30 minutes)

- [ ] Open https://admin.google.com/ac/owl/list?tab=apps
- [ ] Filter by ID: `110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com`
- [ ] If hit: revoke app, document, escalate
- [ ] Check Vercel inbox + account emails for "affected customer" notice
- [ ] Check zaalp99@gmail.com + admin addresses for Vercel notification
- [ ] Pull Vercel env vars locally: `vercel env pull`

### PHASE 2 - Sensitive flag audit (next 60 minutes)

Go to Vercel Dashboard -> ZAO OS project -> Settings -> Environment Variables. For EACH of these, confirm "Sensitive" flag is ON. If not, flip it then rotate.

| Env Var | Source | Severity if leaked |
|---------|--------|-------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard | CRITICAL — full DB write |
| `NEYNAR_API_KEY` | Neynar dashboard | HIGH — Farcaster posting as ZAO |
| `SESSION_SECRET` | random 32b | HIGH — session forgery |
| `APP_SIGNER_PRIVATE_KEY` | generated wallet | CRITICAL — signs as ZAO app |
| `XMTP_APP_KEY` | XMTP | MEDIUM — message client identity |
| `STREAM_SECRET` | Stream.io | MEDIUM — chat signing |
| `COINFLOW_API_KEY` | Coinflow | HIGH — payment ops |
| `ALCHEMY_API_KEY` / `BASE_RPC_URL` | Alchemy/Base | MEDIUM — RPC rate limits |
| `OPENAI_API_KEY` | OpenAI | MEDIUM — spend limit |
| `ANTHROPIC_API_KEY` | Anthropic | MEDIUM — spend limit |
| `TELEGRAM_BOT_TOKEN` | BotFather | HIGH — bot impersonation |
| any DB connection string | Supabase | CRITICAL |

Any var not in the above that stores a secret: same treatment.

### PHASE 3 - Rotation (critical keys first)

Order matters. Always rotate UPSTREAM first, then push new value to Vercel.

- [ ] Supabase: generate new service role key in Supabase dashboard -> update in Vercel (mark sensitive) -> redeploy
- [ ] Neynar: regenerate API key -> update -> redeploy
- [ ] SESSION_SECRET: `openssl rand -hex 32` -> update -> redeploy (sessions will invalidate, users re-auth)
- [ ] APP_SIGNER_PRIVATE_KEY: `npx tsx scripts/generate-wallet.ts` -> update -> register new FID if applicable (per `project_signer_research.md`)
- [ ] Coinflow: rotate via Coinflow dashboard
- [ ] Stream.io: rotate both app key + secret
- [ ] Alchemy/Base RPC: rotate keys
- [ ] OpenAI + Anthropic: rotate + set spend limits
- [ ] Telegram bot token: regenerate via @BotFather

### PHASE 4 - Hardening

- [ ] MFA on Vercel account (if not already)
- [ ] MFA on Google Workspace admin (if not already)
- [ ] Deployment Protection: Vercel Dashboard -> Settings -> Deployment Protection -> set to Standard minimum
- [ ] Rotate Deployment Protection tokens
- [ ] Review Vercel deployment history last 30 days for anomalies
- [ ] Review Google Workspace audit log for suspicious logins
- [ ] Install ggshield: `brew install gitguardian/tap/ggshield && ggshield auth login`
- [ ] Add pre-commit hook: `ggshield install --mode local`
- [ ] Scan repo: `ggshield secret scan repo .`

### PHASE 5 - Third-party AI audit

This is the systemic lesson. Every OAuth app in Google Workspace is an attack vector.

- [ ] List all OAuth apps: https://admin.google.com/ac/owl/list?tab=apps
- [ ] For each: does ZAO still use it? If no, revoke
- [ ] For each: does it need the scope it has? If less would do, reduce
- [ ] Apply least-privilege. Prefer narrow API tokens over OAuth where possible

---

## Comparison of Remediation Paths

| Path | Effort | Risk after | Recommended |
|------|--------|-----------|-------------|
| Do nothing | 0 | HIGH if non-sensitive vars contained secrets | NO |
| Rotate only if email received from Vercel | 1-2 hrs | MEDIUM (reactive, assumes Vercel catches all) | NO |
| Full rotation + sensitivity-flag audit | 3-4 hrs | LOW | **YES** |
| Full rotation + OAuth app cleanup + ggshield | 5-6 hrs | VERY LOW + ongoing protection | **YES (priority)** |
| Move off Vercel | weeks | VERY LOW from this incident, new risks from migration | NOT NOW |

---

## ZAO Codebase Integration

### Files to verify and touch

- `.env.example` — reference for complete env var list
- `src/middleware.ts` — contains CORS + rate limit config, verify no leaked config
- `src/lib/auth/session.ts` — uses `SESSION_SECRET`; new secret invalidates all sessions
- `src/lib/db/supabase.ts` — uses `SUPABASE_SERVICE_ROLE_KEY`; refresh after rotation
- `scripts/generate-wallet.ts` — use if rotating `APP_SIGNER_PRIVATE_KEY`; re-run FID registration per doc 280
- `SECURITY.md` — update with incident response section (see below)

### Add to SECURITY.md

```markdown
## Third-party AI tool audit (quarterly)

Every OAuth app in Google Workspace is an attack surface. Post-Vercel-2026 incident:
1. Quarterly review at https://admin.google.com/ac/owl/list?tab=apps
2. Revoke unused apps
3. Reduce overscoped apps
4. Prefer narrow API tokens over OAuth where possible
5. All env vars in Vercel MUST be marked "Sensitive" (see research/security/471)
```

### Memory rules already in place (good)

- `feedback_never_accept_pasted_secrets.md` — keys go to env via SSH, never chat
- `CLAUDE.md` — "NEVER expose SUPABASE_SERVICE_ROLE_KEY, NEYNAR_API_KEY, SESSION_SECRET, APP_SIGNER_PRIVATE_KEY to browser"

These cover the developer-side. The Vercel breach covers the **deploy-side**. Both layers matter.

---

## Risks + Gotchas

- **Session invalidation.** Rotating `SESSION_SECRET` logs out every active user. Do during low-traffic window or communicate out (newsletter/cast).
- **FID signer swap.** Rotating `APP_SIGNER_PRIVATE_KEY` breaks Farcaster posting until new FID is registered + signed. Blocker for BANKER/DEALER/VAULT + ZOE posting. Plan 30-60 min downtime. Re-read `project_signer_research.md`.
- **Coinflow merchant keys.** Rotation may require Coinflow dashboard support ticket. Don't let it lapse into ZAO Stock Oct 3 window.
- **Supabase RLS check.** After service role rotation, verify RLS policies intact. Service role bypass is still the keys-to-kingdom.
- **Deployment Protection rotation.** If configured, these are separate tokens, easy to miss.
- **DNS + domains.** Not affected directly, but if attacker got deployment access they could have pushed malicious code. Review last-30-day deployment diffs as part of Phase 4.
- **npm packages safe.** Vercel confirmed npm package integrity. Don't panic-invalidate packages.
- **"Sensitive" flag retroactivity.** Flipping a var to sensitive AFTER the incident does not un-leak old values. Must rotate value AND flip flag.

---

## Sources

- [Brendan Falk X post (audit instructions, 2026-04-19)](https://x.com/brendanfalk/status/2045953132770025769)
- [Vercel Knowledge Base - April 2026 Security Incident](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident)
- [TechCrunch - Vercel confirms security incident (2026-04-20)](https://techcrunch.com/2026/04/20/app-host-vercel-confirms-security-incident-says-customer-data-was-stolen-via-breach-at-context-ai/)
- [The Hacker News - Vercel Breach Tied to Context AI Hack](https://thehackernews.com/2026/04/vercel-breach-tied-to-context-ai-hack.html)
- [BleepingComputer - Vercel confirms breach](https://www.bleepingcomputer.com/news/security/vercel-confirms-breach-as-hackers-claim-to-be-selling-stolen-data/)
- [SecurityWeek - Vercel Hacked](https://www.securityweek.com/next-js-creator-vercel-hacked/)
- [CoinDesk - Crypto developers scrambling](https://www.coindesk.com/tech/2026/04/20/hack-at-vercel-sends-crypto-developers-scrambling-to-lock-down-api-keys)
- [GitGuardian analysis - non-sensitive env vars](https://blog.gitguardian.com/vercel-april-2026-incident-non-sensitive-environment-variables-need-investigation-too/)
- [TrendMicro - OAuth Supply Chain Attack analysis](https://www.trendmicro.com/en_us/research/26/d/vercel-breach-oauth-supply-chain.html)
- [Ox.security - Supply Chain Attack detail](https://www.ox.security/blog/vercel-context-ai-supply-chain-attack-breachforums/)
- Related: `SECURITY.md`, `project_infra_keys.md` memory, Doc 280 (FID registration), Doc 137 (skills audit + security)
