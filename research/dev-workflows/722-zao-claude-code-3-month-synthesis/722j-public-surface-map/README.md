---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-23
tier: STANDARD
original-query: Map every public surface in the ZAO ecosystem as of 2026-05-23 - domains, social handles, Telegram bots + groups, on-chain surfaces, member allowlists - with status (live/staging/dead/paused) and front-door recommendation.
---

# 722j - ZAO Ecosystem Public Surface Map (2026-05-23)

Complete audit of all live/staging/paused/dead domains, social handles, Telegram bots, on-chain surfaces, and member entry points across the ZAO ecosystem + ZABAL umbrella.

---

## 1. Primary Brand Domains + Sites

| Name | URL | Owner | Status | Last Updated | Notes |
|------|-----|-------|--------|--------------|-------|
| The ZAO (canonical landing) | https://www.thezao.com | The ZAO | DEAD | N/A | Not maintained; no deployed version found. Referred to in memory but no live site |
| ZAOOS (Next.js app) | https://zaoos.com | ZAO OS monorepo | LIVE | 2026-05-22 | Farcaster chat client + experimental hub; internal routes, gated auth |
| ZABAL Hub (canonical ecosystem) | https://zaoos.com/zabal | ZAO OS monorepo | LIVE | 2026-05-22 | Canonical landing per doc 708; tier-1 ecosystem directory |
| ZAO Brand Nexus | https://bettercallzaal.com/nexus.html | BetterCallZaal site | LIVE | 2026-05-07 | 14-brand ecosystem directory; single-page reference artifact |
| BetterCallZaal (agency site) | https://bettercallzaal.com | BCZ Strategies LLC | LIVE | 2026-05-10 | Consulting + services landing |
| BCZ YapZ (podcast archive) | https://bczyapz.com | BCZ YapZ repo | LIVE | 2026-05-06 | Graduated out of ZAOOS; 18 episodes + transcripts |
| FISHBOWLZ | https://fishbowlz.xyz | Previous ZAO project | PAUSED | 2026-05-04 | Killed 2026-05-04 per doc 601. Juke partnership active instead |
| ZAO Stock | (internal Telegram bot link) | ZAOstock team | STAGING | 2026-05-20 | Spinning out to own repo/domain post-graduation |
| COC Concertz | https://cocconcertz.com | ZABAL brand | LIVE | 2026-04-22 | Music collective; live site present |
| WaveWarZ | https://wavewarz.com | ZABAL brand / Samantha + Hurric4n3ike | LIVE | 2026-05 | Music + metaverse; primary domain |

---

## 2. Sub-Pages + Applications

### ZAOOS Subdomains (zaoos.com/...)

| Route | Purpose | Status | Notes |
|-------|---------|--------|-------|
| `/zabal` | Canonical ZABAL landing (doc 708) | LIVE | Tier-1 entry point |
| `/api/` | 301 API route handlers | LIVE | 54 domains covered |
| `/zao-101` | Onboarding flow | STAGING | Internal documentation |
| `/zaostock` | Festival dashboard (pre-spinout) | LIVE | Features held until graduation |
| `/nexus` | Internal ecosystem map | LIVE | Alias to bettercallzaal.com/nexus.html |

### ZAO OS Subdomains (zaoos.com/*)

| Subdomain | Purpose | Status | Auth | Notes |
|-----------|---------|--------|------|-------|
| https://chat.zaoos.com | ZOE chat dashboard | LIVE | Session required | Pixel office + agent state |
| https://claude.zaoos.com | Claude research interface | LIVE | Session required | Internal tool |
| https://portal.zaoos.com | AO portal / governance | LIVE | Wallet required | Arweave integration |
| https://agents.zaoos.com | Agent squad dashboard | LIVE | Session required | Supabase event logging |
| https://ao.zaoos.com | Arweave process interface | LIVE | Session required | Paperclip infrastructure |
| https://paperclip.zaoos.com | VPS 1 tunnel + gateway | LIVE | Internal | Host header rewrite |
| https://api.zaoos.com | MCP / API endpoint | LIVE | API key | Bonfire KG query |
| https://pixels.zaoos.com | Pixel art editor (TBD) | STAGING | TBD | Not yet live |
| https://zoe.zaoos.com | ZOE agent interface | LIVE | Session required | Chat + memory blocks |

### BetterCallZaal Subdomains (bettercallzaal.com/*)

| Path | Purpose | Status | Notes |
|------|---------|--------|-------|
| `/nexus.html` | 14-brand ecosystem directory | LIVE | Canonical reference; see nexus doc |
| `/hours-log/` | Work transparency log | LIVE | Public daily standup |
| `/legal/` | Legal pages (Coinflow onboarding) | LIVE | BCZ Strategies LLC governance |
| `/consulting/` | Service offerings | LIVE | Video + photo + digital marketing |

---

## 3. Social Handles (Personal + Brand)

### Zaal (Founder)

| Platform | Handle | Link | Type |
|----------|--------|------|------|
| Farcaster | `@zaal` | https://farcaster.xyz/@zaal | LIVE |
| X | `@bettercallzaal` | https://x.com/bettercallzaal | LIVE |
| YouTube | @bettercallzaal | https://youtube.com/@bettercallzaal | LIVE |
| LinkedIn | (zaalp) | (Verify with Zaal) | LIVE |
| Email | zaalp99@gmail.com | - | LIVE |

### The ZAO Brand

| Platform | Handle/Channel | Link | Type | Status |
|----------|----------------|------|------|--------|
| Farcaster (channel) | `/zao` | https://farcaster.xyz/~/channel/zao | LIVE | 188 members |
| X (if exists) | `@thezao` or `@thezaohq` | (Verify with Zaal) | STAGING | Canonicity TBD |
| Telegram | `@thezao` (group) | https://t.me/thezao | LIVE | Main community TG |
| Paragraph | `@thezao` | https://paragraph.com/@thezao | LIVE | Newsletter (verify active) |

### Brand Handles (ZABAL Portfolio)

| Brand | Platform | Handle | Link | Status |
|-------|----------|--------|------|--------|
| WaveWarZ | X | `@WaveWarZ` | https://x.com/WaveWarZ | LIVE |
| WaveWarZ | Farcaster | `@wavewarz` | (Verify) | STAGING |
| COC Concertz | X | (Verify) | - | STAGING |
| ZAO Festivals | X | `@zaofestivals` | https://x.com/zaofestivals | LIVE |
| ZAO Festivals | IG | `@zaofestivals` | (Verify) | STAGING |
| ZABAL | (ecosystem brand) | (No direct social; use nexus.html) | - | REFERENCE |

---

## 4. Telegram Bots (Operational)

### Operating Surfaces (Hermes Pattern)

Per doc 644, all bots use Hermes pattern (Claude CLI subprocess) + Telegraf + per-bot persona files.

| Bot | Handle | Purpose | Status | Owner | Model | Notes |
|-----|--------|---------|--------|-------|-------|-------|
| ZOE | @zaoclaw_bot | Concierge: tasks, captures, brief/reflect, recall, research | LIVE | Zaal + team | Sonnet/Opus | Main entrypoint; 4-block Letta memory |
| Hermes | @zoe_hermes_bot | Autonomous fix-PR pipeline: coder + critic + auto-PR | LIVE | DevOps | Opus | Triggered on PRs; Claude CLI subprocess |
| ZAO Devz | @zaodevz_bot | Group dispatch + hourly learning tip | LIVE | Engineers | Sonnet/Haiku | Phase 3: fold into Hermes pending |
| ZAOstock | @ZAOstockTeamBot | Festival team coordination | LIVE | ZAOstock team | Sonnet | systemd user unit on VPS 1 |
| ZAO Coworking | @ZAOcoworkingBot | Tracker: action items + standup | LIVE | Iman (imanagent VPS) | Sonnet | Hermes-pattern concierge; v2/v3 spec doc 679 |

### Bonfire (External, Not Telegram)

| Surface | Purpose | Status | Owner | Notes |
|---------|---------|--------|-------|-------|
| Bonfire | @zabal_bonfire (Genesis tier) | Knowledge graph recall + multi-corpus ingest | LIVE | Ryan Kagy / bonfires.ai | Wallet-gated; not Telegram-native |

### Decommissioned (Do NOT Restart)

- openclaw container + 7-agent squad (ZOEY/BUILDER/SCOUT/WALLET/FISHBOWLZ/CASTER) - killed 2026-05-04
- Composio AO orchestrator - archived
- ZOE v2 / Agent Zero migration - cancelled
- 10-bot branded fleet (Magnetiq/Research/WaveWarZ/POIDH as separate bots) - features folded into ZOE memory blocks
- FISHBOWLZ (paused 2026-04-16, killed 2026-05-04)

---

## 5. Telegram + Discord Groups

| Group | Type | Purpose | Status | Owner | Notes |
|-------|------|---------|--------|-------|-------|
| @thezao | Telegram public | Main ZAO community | LIVE | Zaal | 188 members on Base |
| ZAO Devz GC | Telegram private | Engineering team standup | LIVE | Iman | Zaal + Iman + ThyRev + Samantha |
| ZAOstock team GC | Telegram private | Festival production team | LIVE | Cassie | Production coordination |
| Fractal Circle Discord | Discord private | ZAO Fractal (Mondays 6pm EST) | LIVE | Zaal | 90+ weeks; OG vs ZOR Respect tracking |

---

## 6. On-Chain Surfaces

### Tokens

| Token | Chain | Address | Purpose | Status | Notes |
|-------|-------|---------|---------|--------|-------|
| $ZABAL | Base | 0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07 | ZABAL brand utility | LIVE | Empire V3 integration live |
| $SANG | Solana / Base | (TBD) | SongJam token | LIVE | Governance + rewards |
| ZOE (Soulbound) | Base | (TBD) | ZAO Respect / contribution | STAGING | Member attestation |
| ZAOstock token | Base | (TBD) | Festival governance (post-August 2026) | PLANNING | Not yet issued |

### Smart Contracts

| Contract | Chain | Address | Purpose | Status | Notes |
|----------|-------|---------|---------|--------|-------|
| Empire Builder V3 | Base | 0xe0faa499d6711870211505bd9ae2105206af1462 | Creator leaderboard | LIVE | Integrated with ZABAL |
| Staking / Bounty Board | Solidity | (See /contracts/) | TBD | PLANNING | Research ongoing |

### App FID + Onboarding

| Surface | Chain | ID | Status | Notes |
|---------|-------|-----|--------|-------|
| ZAOOS App FID | Farcaster | 19640 | LIVE | Neynar registered; signer registration active |
| Farcaster Signer | Burner wallet | (Generated) | LIVE | Never personal; app-specific burner keys |

### On-Chain Funding

| Fund | Platform | Purpose | Status | Notes |
|------|----------|---------|--------|-------|
| ZAO Fund for Emerging Culture | Artizen (S6) | Music artist match fund | LIVE | Zaal-owned; $X committed (TBD) |

---

## 7. Member Allowlist + Entry Points

| Surface | Format | Size | Status | Notes |
|---------|--------|------|--------|-------|
| ZAO Cell allowlist | CSV (wallet-only) | 40 members | LIVE | Location: ~/Downloads/ZAOOS.csv; no FIDs |
| Farcaster /zao channel | Direct membership | 188 members | LIVE | https://farcaster.xyz/~/channel/zao |
| $ZOE Soulbound attestation | Token balance | TBD | STAGING | Respect ledger + ZOR reconciliation |
| Fractal Circle Respect | Off-chain ledger | 90+ weeks | LIVE | Discord bot + OREC tracking; Dan/Tadas maintain |

---

## 8. Status by Surface Type

### Fully Live (LIVE)

- zaoos.com (main app + all subdomains except pixels.zaoos.com)
- bettercallzaal.com + nexus.html
- All 5 Telegram bots (ZOE, Hermes, ZAO Devz, ZAOstock, ZAO Coworking)
- Farcaster channel /zao (188 members)
- Zaal personal handles (Farcaster @zaal, X @bettercallzaal, YouTube)
- $ZABAL token + Empire V3
- BCZ YapZ domain + archive
- COC Concertz
- WaveWarZ (wavewarz.com)
- All private TG/Discord groups
- Bonfire (@zabal_bonfire, bonfires.ai)

### Staging / In Development (STAGING)

- ZAO Stock (spinning out post-Oct-3-2026)
- ZAO brand X handle (canonicity TBD with Zaal)
- pixels.zaoos.com (not yet shipped)
- $ZOE Soulbound token (Respect attestation)
- ZAOstock token (post-August 2026)

### Paused / Deprecated (PAUSED)

- FISHBOWLZ (killed 2026-05-04; Juke partnership active instead)

### Dead (DEAD)

- thezao.com (canonical ZAO landing; no deployed version; replaced by zaoos.com/zabal)

---

## 9. Front-Door Problem + Recommendation

**Current State:** The ZAO has 3 competing entry points:

1. **https://zaoos.com** (gated Next.js app + ZAOOS OS ecosystem) - requires session/wallet auth
2. **https://zaoos.com/zabal** (public ZABAL landing, doc 708) - tier-1 by design
3. **https://bettercallzaal.com/nexus.html** (14-brand ecosystem directory) - reference artifact, not optimized for onboarding

**Recommendation:**

Route all new stranger traffic to **https://zaoos.com/zabal** (ZABAL Hub). It is:
- Public + immediate (no auth required)
- Optimized for ecosystem overview (doc 708 design)
- Reachable from Zaal's social bios
- Canonical per memory project_nexus_hub_live

**Secondary:** bettercallzaal.com/nexus.html for ecosystem audits + reference links (powered by live link inventory at BetterCallZaal repo).

**Tertiary:** zaoos.com for authenticated members + experimentation.

**Not Front-Door:** thezao.com (dead), fishbowlz.xyz (paused), any internal subdomains.

---

## 10. Unmaintained + Link Rot Risk

High risk (> 30 days since last deploy/update):

- thezao.com (DEAD; no version at all)
- fishbowlz.xyz (PAUSED; kill confirmed 2026-05-04)
- ZAO brand X handle (canonicity unclear; may drift)
- Paragraph.com/@thezao (newsletter; active status unverified)

Medium risk (staging/pending):

- pixels.zaoos.com (not yet shipped; routes undefined)
- ZAO Stock public landing (spinning out; routes TBD)

---

## 11. Consolidation Opportunities

| Issue | Current State | Recommended Action |
|-------|---------------|-------------------|
| Multiple WaveWarZ homepages | wavewarz.com, wavewarz.info, intelligence.vercel.app, wavewarzapp.vercel.app | Reference doc 722d (repos-created); pick one canonical URL + 301s |
| ZABAL vs ZAO brand confusion | /zabal route, $ZABAL token, ZABAL umbrella brand (separate from The ZAO) | Clarify in CLAUDE.md: ZABAL = Zaal's umbrella; The ZAO = impact network. Document in doc 722 |
| Bonfire presence | @zabal_bonfire (external); no TG mirror | Document as non-TG surface; leave bonfires.ai as source of truth |
| ZAO brand social handles | @thezao (unverified); @thezaohq (unverified) | Confirm one canonical X handle with Zaal; update all links |

---

## 12. Promised Surfaces (Not Yet Built)

Per research roadmap + PRs:

| Surface | Status | Deadline | Docs |
|---------|--------|----------|------|
| ZAO Stock landing | Not deployed | Oct 3 2026 (event date) | 720 |
| ZABAL Games portal | Not deployed | June 1 2026 (dev kickoff) | 719 |
| 12-week Road to ZAOstock landing | Not started | TBD | 720 |
| ZAO Jukebox (Farcaster miniapp) | Spec complete | May 2026 | 721 |
| The ZAO homepage (thezao.com) | Not deployed | TBD | N/A |
| ZAO brand press kit | Not deployed | TBD | N/A |

---

## 13. Infrastructure + Support

### VPS

| Name | Provider | IP | Purpose | Status |
|------|----------|-----|---------|--------|
| VPS 1 (Hostinger KVM 2) | Hostinger | 31.97.148.88 | Bots + agents + portal | LIVE |

**Note:** No VPS 2. Per memory project_no_vps2, only one box. Do not propose second infrastructure.

### Email

- Contact: zaal@thezao.com (preferred for outreach per project_zao_contact_email)
- Founder: zaalp99@gmail.com (personal)

### Calendly

- https://calendly.com/zaalp99/30minmeeting (booking link)

---

## 14. Monitoring + Verification

### Need Uptime Monitoring

- zaoos.com (Vercel auto)
- bettercallzaal.com (Vercel auto)
- bczyapz.com (Vercel auto)
- All zaoos.com/* subdomains

### Manual Verification Needed (per nexus doc)

~30 URLs in nexus.html + full link inventory at BetterCallZaal repo require 200 status checks:

- Likely failures: bczyapz.com paths, ZAO OS subdomains (auth required), Manifold long URL, all X/Farcaster handles (drift risk)
- Action: Run status check quarterly; update nexus.html + MEMORY.md as needed

---

## References

- Doc 708 (ZABAL hub landing)
- Doc 621 (BCZ brand + legal architecture)
- Doc 644 (ZAO agent stack canon)
- Doc 601 (Agent stack cleanup decision - FISHBOWLZ kill confirmed)
- Memory: project_nexus_hub_live, project_bcz_yapz_graduated, project_infra_keys
- Memory: user_social_handles
- Source: bettercallzaal.com/nexus.html (canonical ecosystem directory)
