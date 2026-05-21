---
topic: security
type: incident-postmortem
status: research-complete
last-validated: 2026-05-21
original-query: "Vercel OAuth supply chain breach April 2026 impact assessment and remediation (reconstructed)"
tier: STANDARD
---

# 471 - Vercel OAuth Supply Chain Breach April 2026

> **Goal:** Document the April 2026 Vercel/Context.ai OAuth supply chain breach, verify ZAO exposure, and confirm remediation steps are current as of May 20 2026.

---

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | Assume all non-sensitive Vercel env vars ARE leaked until rotated | OAuth breach confirmed limited subset; "non-sensitive" = unencrypted plaintext at rest |
| 2 | Rotate upstream secrets FIRST, then push to Vercel | Prevents brief window where stolen keys still have validity |
| 3 | Mark all secrets as "sensitive" in Vercel dashboard after rotation | Default changed post-April 2026; new vars are safe, old ones must be flipped + rotated |
| 4 | Audit Google Workspace OAuth grants quarterly | Context.ai chain confirms OAuth sprawl is systemic risk; "Allow All" is critical vector |
| 5 | Enable Vercel Deployment Protection + MFA on team account | Prevents re-entry via same OAuth path; Vercel shipped this post-incident |

---

## Findings

| Finding | Evidence | Status |
|---------|----------|--------|
| **Incident confirmed, scoped to non-sensitive env vars** | Vercel KB bulletin April 23, Sola Fide + Trend Micro analysis; confirmed in April 20-23 updates | VERIFIED [FULL] |
| **Context.ai OAuth app ID published as IOC** | Client ID `110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com` confirmed across 5 sources | VERIFIED [FULL] |
| **Lumma Stealer malware origin confirmed, dwell ~2 months** | Hudson Rock + Trend Micro correction (initial Feb 2026, detected ~Apr 17-19) | VERIFIED [FULL] |
| **Vercel default changed: new env vars now "sensitive" by default post-breach** | Sola Fide + AkeyLess confirm April 2026 remediation includes default flip | VERIFIED [FULL] |
| **npm/open-source supply chain confirmed uncompromised** | GitHub + Microsoft + npm + Socket coordinated audit, no evidence of package tampering | VERIFIED [FULL] |
| **Affected customer notification ongoing; ShinyHunters claim unverified** | April 19 BreachForums post; ShinyHunters later denied involvement; claim later deleted | PARTIAL [FULL] |
| **No evidence Sensitive-flagged variables were accessed** | Vercel CEO confirmed in multiple sources; encrypted at rest | VERIFIED [FULL] |
| **Vercel team audit log review recommended** | Post-incident guidance: review last 30 days for anomalous env var reads | NOT YET DONE [ACTION] |


---

## ZAO Application

**ZAO OS runs on Vercel** (confirmed in `CLAUDE.md` stack + `.vercel/` directory). 301 API routes, 40+ env vars including critical secrets: `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY`.

**Exposure likelihood:** MEDIUM. If ZAO did not receive Vercel's April 19-23 "affected customer" notification, assume non-sensitive vars may be leaked and treat accordingly. Check inbox for notification; if absent, rotate all secrets as precaution per Phase 3 checklist below.

**Action owner:** Zaal (account + infra access). 

---

## Incident Timeline

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

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Check inbox for Vercel "affected customer" notification (April 19-23) at zaalp99@gmail.com + admin email | Zaal | Triage | ASAP |
| 2 | If notification found: Execute Phase 3 (Rotation) for all critical keys | Zaal | Security | This week |
| 3 | If no notification: Still rotate all secrets as precaution (assume non-sensitive vars exposed) | Zaal | Security | This week |
| 4 | Audit Vercel Dashboard -> Settings -> Environment Variables; flip all remaining non-sensitive to "Sensitive" | Zaal | Hardening | This week |
| 5 | Enable MFA on Vercel account + Deployment Protection (Standard minimum) | Zaal | Hardening | This week |
| 6 | Audit Google Workspace OAuth apps (quarterly): https://admin.google.com/ac/owl/list - revoke unused, reduce overschopes | Zaal | Governance | 2026-06-20 |
| 7 | Install ggshield + pre-commit hook for repo secret scanning | Claude | CI/CD | If Zaal approves |

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

- [Vercel Knowledge Base - April 2026 Security Incident](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident) [FULL] - primary source, final status April 23 2026, incident resolved, Deployment Protection now shipped
- [Securonix - Supply Chain Attack Analysis](https://connect.securonix.com/threat-research-intelligence-62/) [FULL] - timeline + attack chain, April 22 2026
- [TrendMicro - OAuth Supply Chain Attack](https://www.trendmicro.com/en/research/26/d/vercel-breach-oauth-supply-chain.html) [FULL] - attack analysis + corrections, updated April 21
- [Sola Fide - Anatomy of the Vercel Breach](https://solafide.ca/blog/2026-04-vercel-breach-oauth-supply-chain-attack) [FULL] - OAuth/identity risk deep dive, April 22
- [AkeyLess - Vercel Breach & Ephemeral Secrets](https://www.akeyless.io/blog/the-vercel-breach-and-the-case-for-ephemeral-secrets/) [FULL] - secrets management lens, April 21
- [DevOps Daily - April 2026 Incident Summary](https://devops-daily.com/posts/vercel-april-2026-security-incident) [FULL] - action checklist, April 20
- [Brendan Falk X post (audit instructions, 2026-04-19)](https://x.com/brendanfalk/status/2045953132770025769) [PARTIAL] - Google Workspace audit guide
- Related ZAO docs: `.env.example`, `SECURITY.md`, `project_infra_keys.md` memory, Doc 280 (FID registration)

**Material changes:** Vercel incident remains historical (April 2026). Remediation complete. Post-incident hardening: Vercel Deployment Protection now GA, "Sensitive" flag default flipped for new env vars. No ongoing exposure if ZAO rotated secrets per Phase 3 checklist.
