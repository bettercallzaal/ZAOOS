# 472 - AI Tooling + Ecosystem Roundup 2026-04-21

> **Status:** Research complete
> **Date:** 2026-04-21
> **Goal:** Single roundup covering 10+ items Zaal batched: voice input, TTS, iOS vibe-coding, Farcaster tooling, Recoupable, Coinflow refresh, Otoco onchain LLCs, Intori SCIS, openclaw community posts
> **Companion:** Doc 471 (Vercel breach — urgent security action)

---

## Key Decisions / Recommendations (by priority)

| # | Item | Decision | Priority |
|---|------|----------|----------|
| 1 | **Vercel breach action** | DO FIRST — see Doc 471. Blocks everything else | P0 |
| 2 | **Recoupable developer platform** | PLUG INTO Recoup API for ZAO music workflows — 6 API categories (research/content/chat/social/releases/accounts), x-api-key auth, MCP server. Wire into ZOE + artist pipeline. Matches existing Recoupable-adjacent work (Doc 365) | P1 |
| 3 | **Coinflow checkout refresh** | USE Checkout Link path for ZAO Stock sponsors + artist payouts. Hosted URL = zero infra. Instant USDC settlement regardless of method. Existing research at Doc 125 + 406. Update integration before Oct 3 | P1 |
| 4 | **OpenWhisp (voice input)** | INSTALL for Zaal's macOS. MIT, fully local, ~10GB disk. Replaces Wispr Flow subscription. Works with Vibe Coding mode | P2 |
| 5 | **VoxCPM2 (TTS)** | INSTALL on VPS 1 for ZOE voice output. Apache-2.0, 2B params, 30 languages, 48kHz, commercial-use OK. Gives ZOE voice for Telegram voice replies + newsletter audio | P2 |
| 6 | **Otoco onchain LLC** | WRITE ARTICLE. Not a tool install. $299/yr Standalone LLC on Delaware/Wyoming, minted as NFT after 24-48h. Legit for ZAO sub-entities (ZAO Stock LLC, FISHBOWLZ LLC). Per request #17, Zaal wants to write about this | P2 |
| 7 | **Intori SCIS** | WATCH — Farcaster mini-app for structured Q&A. Launched Apr 17 2026. Possible wedge for ZAO onboarding questionnaire. Don't integrate yet — let it mature | P3 |
| 8 | **Lazer Farcaster miniapp tools** | INVESTIGATE manually — search didn't surface docs; check Garrett cast directly. If it's Base Minikit starter-style, useful for ZAO mini-app work. Status: unclear | P3 |
| 9 | **iOS app via vibe coding** | PARK — 2-month solo vibe-code to App Store is demonstrated pattern. Apply when ZAO needs native iOS (not now). Revisit post-Stock | P4 |
| 10 | **Google engineer 80% automation** | PARK — inspiration only. Zaal already runs heavy automation; no specific tool to pull | P4 |
| 11 | **OpenClaw Reddit: before you quit** | SKIM + save to captures. Community post, not research | P4 |
| 12 | **Vibecoding Reddit: design within [X]** | SKIM + save to captures. Low-signal link | P4 |

---

## Full Item Breakdown

### 1. OpenWhisp (Wispr Flow clone)

| Field | Value |
|-------|-------|
| Repo | https://github.com/giusmarci/openwhisp |
| License | MIT |
| Stack | TypeScript 73% + Swift 6% + CSS 19% |
| Platform | macOS Apple Silicon (exclusive) |
| Models | Whisper Base Multilingual (~150MB) + Gemma 4 (~9.6GB) |
| Setup | `ollama pull gemma4:e4b`, clone, `npm install`, `npm run build:native`, `npm run dev` |
| Disk | ~10GB |
| Modes | Conversation / Vibe Coding. Hold Fn, speak, release |
| Offline | 100% |

**ZAO fit:** Zaal's voice-to-text during dev sessions. Replaces paid Wispr Flow. Fit for /inbox voice captures + newsletter drafts.

**Action:** Install on Zaal's Mac. 30 min setup. No ZAO codebase changes.

### 2. VoxCPM2 2B Tsinghua TTS

| Field | Value |
|-------|-------|
| Org | OpenBMB / Tsinghua University |
| HF | https://huggingface.co/openbmb/VoxCPM2 |
| License | Apache-2.0 (commercial OK) |
| Params | 2B |
| Languages | 30 (no language tags needed) |
| Output | 48kHz |
| Training | 2M+ hours multilingual speech |
| Features | Tokenizer-free diffusion autoregressive TTS + voice cloning + voice design from natural language |

**ZAO fit:**
- ZOE voice replies on Telegram (voice notes back to Zaal)
- Daily newsletter audio version (accessibility + podcast feed)
- ZAO Stock promo audio
- FISHBOWLZ bot voices
- Agent-generated cast audio for Farcaster

**Action:** Deploy on VPS 1 next to ZOE. Wire as MCP tool. Pilot: generate audio newsletter daily from `docs/daily/*.md`.

### 3. Recoupable Developer Platform (Sweetman)

| Field | Value |
|-------|-------|
| Docs | https://developers.recoupable.com/ |
| Base URL | `https://recoup-api.vercel.app/api` |
| Auth | `x-api-key` header |
| API Categories | 6: Research (30 endpoints), Content Creation, Chat, Social Media, Releases, Accounts |
| Integration | CLI tools, MCP Server, OpenAPI spec |
| Pricing | Not published (dashboard signup) |

**Direct relevance:** Sweetman is already a ZAO-ecosystem relationship (Recoupable monorepo = Doc 365 canonical). The developer platform = way to wire Recoup intelligence into ZAO without re-building.

**ZAO fit:**
- Research API: artist discovery for ZAO Stock talent booking + Magnetiq connections
- Content Creation API: captions/video for ZAO cast scheduler + newsletter
- Chat API with artist context: possible ZOE -> artist convo handoff
- Social Media API: Spotify + IG + X scraping for member onboarding
- Releases API: song analysis for WaveWarZ pipeline

**Action:**
1. Zaal signs up at dashboard.recoupable.com, gets API key
2. Add MCP server to VPS 1 ZOE config
3. Test: "ZOE, who are 10 Ellsworth-adjacent indie artists matching ZAO Stock vibe?" via Research API

### 4. Coinflow Checkout (refresh)

| Field | Value |
|-------|-------|
| Docs | https://docs.coinflow.cash/guides/getting-started/getting-started-with-checkout |
| Paths | 3: Checkout Link (hosted URL) / React SDK / API |
| Methods | Cards, Apple/Google Pay, ACH/SEPA/FPS/PIX, USDC+Crypto |
| Settlement | All routes -> instant USDC to configured wallet |
| Existing ZAO research | Doc 125 (Coinflow Fiat Checkout), Doc 406 (ISV deep dive) |
| Relationship | Michael Hatch (contact per Zaal's list item #16) |

**ZAO fit:**
- ZAO Stock sponsor payments (currently manual)
- ZAO Stock ticket sales (if gated)
- Artist payout USDC rail
- FISHBOWLZ premium tier
- BCZ consulting invoices

**Action:** For Oct 3 timeline, USE Checkout Link path (fastest). Generate URL per sponsor tier from `src/app/stock/sponsor/page.tsx`. Zero infra work.

**Next:** Email Michael Hatch re: merchant ID for ZAO Stock + artist payout rail. Reference prior Wavestation setup (Doc 406).

### 5. Otoco Onchain Standalone LLCs

| Field | Value |
|-------|-------|
| Article | https://blog.otoco.io/introducing-onchain-standalone-llcs/ |
| Price | $299/yr |
| Jurisdictions | Delaware + Wyoming |
| Formation time | 24-48h (vs Instant LLC ~6 sec) |
| Onchain | Certificate of Formation minted as NFT |
| Payment | Stablecoin or card |
| Use case | US customers, US employees/contractors, bank access |

**Zaal's note:** "Write article about" — user flagged this for an article, not a tool install.

**ZAO fit:**
- ZAO Stock LLC (Ellsworth ME activity, needs US state recognition for vendor contracts, sponsor agreements, alcohol permits if applicable, insurance)
- FISHBOWLZ LLC (possible separate entity for audio rooms)
- BetterCallZaal LLC (consulting entity)
- Artist label sub-LLCs for AI music IP (per Doc 333 ZAO AI Label blueprint)

**Article angle for Zaal:** "Why I formed ZAO Stock as an onchain LLC" — build-in-public post combining Otoco + ZAO Stock ops decisions. Could tie to Doc 029 (artist revenue + IP) + Doc 333.

**Action:**
1. Decide: does ZAO Stock 2026 need an LLC entity separate from personal? (Risk + vendor contracts + insurance all argue yes)
2. If yes, Otoco Standalone $299/yr = lower friction than attorney-filed
3. Write article after formation (not before — speaks with authority post-action)

### 6. Intori / SCIS

| Field | Value |
|-------|-------|
| Launch | 2026-04-17 |
| URL | https://www.intori.co/news/introducing-scis |
| Founder | Donald Bullers (Tuum Tech) |
| Tagline | Structured Conversational Inventory System |
| Chain | question -> answer -> topic -> signal -> progress |
| Platforms | Farcaster mini-app, World, Base |
| Mechanic | Packs (question sets), Stamps (progress), Connections |

**ZAO fit:**
- Member onboarding questionnaire (what genre, what role, what artist goals)
- Fractal meeting pre-sync (structured prompt instead of Discord freeform)
- Artist application (ZAO Stock, WaveWarZ) as structured Pack
- Magnetiq warm-up questions for IRL meets

**Risk:** Early launch (4 days old). Don't wire into critical flow yet. Possible replacement for homegrown onboarding if it matures.

**Action:** Add to watchlist. Re-evaluate in 90 days (~2026-07-21). Ping Donald Bullers if Farcaster connection warm.

### 7. Lazer Farcaster Miniapp Tools (Garrett)

Cast URL: https://farcaster.xyz/garrett/0x33f897a6

**Status:** Search did not surface docs. Farcaster cast URLs don't webfetch well. Need direct view on mobile/web Farcaster client.

**Action:** Zaal (or next session with Farcaster MCP) opens the cast + extracts specifics. If it's Minikit-style tooling, worth comparing vs `builders-garden/base-minikit-starter`. If it's a deployment/testing framework, evaluate vs homegrown ZAO mini-app setup.

**Skip until:** we have the actual content of Garrett's cast.

### 8. Vibe-coded iOS app in 2 months (Reddit)

Post: https://reddit.com/r/VibeCodeDevs/comments/1sgrcyq

**Pattern:** Non-coder + Cursor/Claude Code + React Native or Swift -> App Store in 2 months.

**ZAO fit:**
- ZAO OS native iOS app (currently PWA-ish via Farcaster mini-app)
- FISHBOWLZ native iOS (currently web)
- Standalone ZOE chat app (currently Telegram)

**Honest read:** Not a priority. Farcaster mini-app covers most of ZAO OS on iOS already. Post-Stock, if member feedback demands native, revisit.

**Action:** PARK. Bookmark pattern. Re-evaluate Q4 2026.

### 9. Google engineer automated 80% (X)

Post: https://x.com/noisyb0y1/status/2043609541477044439

**Pattern:** Inspiration post, likely about Claude Code / agent workflows for day job. Zaal already runs far ahead of this.

**Action:** SKIM + cast it as build-in-public content if angle is fresh ("ZAO runs on agent fleet, here's how it compares"). Otherwise skip.

### 10-12. Reddit posts (community signal)

| Post | Value | Action |
|------|-------|--------|
| r/openclaw "before you quit, read this" | Community meta-post re: OpenClaw adoption | Save to captures. Share pattern if useful for ZAO devz bot |
| r/vibecoding "insane new way to design within X" | Usually a new tool/plugin | Save + re-evaluate tool if cited |
| Falk X post on Vercel OAuth | **SECURITY — see Doc 471** | DO FIRST |

---

## Comparison of Options (cross-category priority)

| Priority | Item | Time to value | Cost | Confidence |
|----------|------|---------------|------|------------|
| P0 | Vercel breach action (Doc 471) | 3-4 hrs | $0 | HIGH — external security event |
| P1 | Recoupable API integration | 2-3 hrs | unknown, dashboard | HIGH — existing relationship |
| P1 | Coinflow Checkout Link for Stock | 1 hr | Coinflow fees | HIGH — existing research |
| P2 | OpenWhisp install | 30 min | $0 (disk) | HIGH — solo productivity |
| P2 | VoxCPM2 on VPS for ZOE | 2-3 hrs | VPS RAM | MEDIUM — needs GPU check |
| P2 | Otoco LLC decision + article | 1 hr decision + write after | $299/yr | MEDIUM — legal context needed |
| P3 | Intori watchlist | 0 now | $0 | LOW — too early |
| P3 | Lazer investigation | 15 min | $0 | LOW — unclear content |
| P4 | iOS vibe-code | 2 months if chosen | $99 dev acc | LOW — not priority |
| P4 | Inspiration posts | skim | $0 | LOW |

---

## ZAO Codebase Integration Points

### Files that would change with top adoptions

| Item | Files Affected |
|------|---------------|
| Vercel security | `.env.example`, `SECURITY.md`, all env var references, `src/lib/auth/session.ts`, `src/lib/db/supabase.ts` |
| Recoupable API | new `src/lib/recoupable/` client, ZOE MCP config on VPS 1, possible `src/app/api/recoup/*` proxy |
| Coinflow Stock | `src/app/stock/sponsor/page.tsx`, `src/app/api/stock/sponsor/*` (new), env vars |
| OpenWhisp | none (local tool) |
| VoxCPM | VPS `/vps` skill additions, ZOE prompts, optional `src/app/api/tts/*` proxy |
| Otoco LLC | legal + business structure, not codebase |
| Intori | watchlist only |

---

## Week-Forward Plan (ordered, discipline matters)

1. **Today:** Doc 471 Phase 1 audit (30 min) + Phase 2 sensitive-flag audit (60 min)
2. **Tomorrow:** Doc 471 Phase 3 rotation (2 hr) + Phase 4 hardening (1 hr)
3. **This week:** Recoupable API key + first ZOE test query (2 hr)
4. **This week:** Coinflow Checkout Link for Stock sponsor tiers (1 hr)
5. **Next week:** OpenWhisp install + pilot (30 min)
6. **Next week:** Otoco LLC decision for ZAO Stock (discussion with advisor)
7. **Later:** VoxCPM2 VPS deploy after ZOE stack stable
8. **Quarterly:** Intori re-evaluation, OAuth app cleanup

---

## Sources

- [OpenWhisp repo](https://github.com/giusmarci/openwhisp)
- [VoxCPM2 Hugging Face](https://huggingface.co/openbmb/VoxCPM2)
- [VoxCPM2 GitHub](https://github.com/OpenBMB/VoxCPM)
- [Intori SCIS announcement](https://www.intori.co/news/introducing-scis)
- [Recoupable developer docs](https://developers.recoupable.com/)
- [Recoupable Notion guide](https://zany-hourglass-531.notion.site/Getting-Started-New-Developer-Guide-32826a7d835c81948e91cc266b8ea2d5)
- [Coinflow checkout docs](https://docs.coinflow.cash/guides/getting-started/getting-started-with-checkout)
- [Otoco onchain standalone LLCs](https://blog.otoco.io/introducing-onchain-standalone-llcs/)
- [Sweetman Recoupable cast](https://farcaster.xyz/sweetman.eth/0x19ebb915)
- Companion: [Doc 471 — Vercel breach action](../../security/471-vercel-oauth-breach-apr2026/)
- Related: [Doc 125 — Coinflow Fiat Checkout](../../business/125-coinflow-fiat-checkout/)
- Related: [Doc 365 — Recoupable Monorepo & Best Practices](../365-recoupable-monorepo-best-practices/)
- Related: [Doc 406 — Coinflow ISV Deep Dive](../../business/406-coinflow-isv-deep-dive-wavewarz-zao/)
- Related: [Doc 333 — AI Music Licensing + ZAO AI Label](../../business/333-ai-music-licensing-sync-label-deep-dive/)
- Related: [Doc 280 — FID Registration x402 Deep Dive](../../280-fid-registration-x402-deep-dive/)
