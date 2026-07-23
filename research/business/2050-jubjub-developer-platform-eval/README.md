---
title: "JubJub Developer Platform Evaluation"
type: audit
topic: business
status: complete
last_validated: 2026-07-23
original_query: "https://jubjubapp.com/developers creator payment infrastructure eval for ZAO"
tier: STANDARD
---

# JubJub Developer Platform - ZAO Relevance Assessment

## Key Decisions

| Decision | Reasoning | Recommendation |
|----------|-----------|-----------------|
| **Integrate or Watch?** | JubJub has concrete Base/USDC infrastructure + MCP-readiness for ZOE agents, but core product (video monetization) is tangent to ZAO's focus (music prediction + creator coins). However, payment splits + real-time revenue tracking map directly to Sparkz co-creator flows. | **WATCH** - Strong technical fit for future integrations (especially if ZAO/Sparkz adds music video monetization), but not immediate integration path. Close monitoring recommended if JubJub adds music-specific features or Farcaster distribution. |
| **Best Integration Idea** | Embed JubJub SDK in Sparkz creator pages to monetize music videos of creator-coin launches. ZOE agent connects via MCP to auto-track revenue splits across ZABAL Games mentors + creators. | Medium-term value; gated by Sparkz video feature roadmap. |
| **Maturity** | Shipped and live (founded 2024, 10-person team Melbourne, PitchBook-listed, production commission model). Not vaporware. | Trustworthy to reference in product roadmap. |

---

## Findings

### What JubJub Actually Is

JubJub (jubjubapp.com, Melbourne Australia, founded 2024) is a **media ownership and payment infrastructure platform** built for creators, editorial publishers, and AI agents. Core product: multi-platform video distribution + blockchain-based ownership registration + real-time USDC settlement on Base blockchain.

**Tagline:** "You've built the audience. Now run the business that comes with it."

**Backing:** Antler (VC), Anthropic (partner badge on site), Base ecosystem.

### Developer Platform Specifics

JubJub's `/developers` offering is an **open-source SDK** for pay-per-second video monetization:

**Capabilities:**
- Embed monetized video players in two lines of code
- Real-time USDC/second payments on Base blockchain
- Automatic payment routing to creators (97% creator share, 3% JubJub platform fee)
- Player compatibility: Vanilla video, Video.js, Plyr, Mux, custom React players
- Real-time analytics + webhooks for viewer/revenue tracking
- On-chain settlement (transparent, auditable)
- MCP integration readiness (explicit mention: "MCP integration readiness for AI agents")
- Persistent, lightweight wallet authentication
- GitHub open-source repository

**Pricing Model:** "3% when money flows" - no setup fees, no minimums, commission-only.

**Integration Surface:** Developers can embed JubJub-registered video content on any site; revenue settles automatically to creator wallets, with co-creator splits baked in.

### Stack & Compatibility with ZAO

| Aspect | JubJub | ZAO | Fit |
|--------|--------|-----|-----|
| Blockchain | Base (USDC settlement) | Base (Sparkz lives here) | Strong |
| Agent Integration | MCP-ready | ZOE uses MCP/Anthropic SDK | Strong |
| Creator Payments | Real-time splits, webhooks | Sparkz needs co-creator splits | Good |
| Distribution | Multi-platform (YouTube, TikTok, etc.) | Farcaster-native focus | Weak |
| Content Type | Video (generic) | Music (specific niche) | Tangent |
| Stack | Open-source SDK + JavaScript | Next.js + Supabase + React | Compatible |

### Maturity Assessment

- **Status:** Shipped, production-live
- **Evidence:** Blog active, Twitter/X presence, 10-person team, PitchBook listing, commission revenue model in operation
- **Confidence:** High (not early-stage or vaporware)

---

## ZAO Relevance: Ranked Integration Ideas

### 1. Sparkz Creator Video Monetization (Medium-term, high-value)
**Idea:** Embed JubJub SDK on Sparkz creator-coin launch pages. When a creator launches a Sparkz coin, their music video (if provided) can be monetized via JubJub's pay-per-second model, with revenue splits auto-routing to ZABAL Games mentors + original creator.

**Value:** Adds revenue stream to Sparkz launches without building payment infra. Creators earn while promoting coin.

**Gating:** Requires Sparkz video feature (currently coin + narrative, not video). Roadmap decision needed from Zaal/WaveWarZ team.

**Effort:** Low (SDK embed + webhook wiring for splits tracking). ZOE could handle split-routing logic via MCP.

### 2. ZOE Agent Revenue Monitoring (Low-effort, supporting)
**Idea:** ZOE connects to JubJub webhooks (if ZAO sites use JubJub player) to auto-track creator revenue, pull analytics, and post summaries to Telegram. Enables real-time revenue dashboards in the cowork app.

**Value:** Observability + automation; ZOE becomes more useful for creator-facing bots.

**Gating:** Only valuable if ZAO adopts JubJub player somewhere. Standalone, it's tooling for a product we don't own yet.

**Effort:** Medium (MCP server + webhook handler + bot integration).

### 3. Multi-Platform Distribution Sink (Low relevance)
**Idea:** Use JubJub's post-to-all-socials feature to cross-post ZABAL Games workshop recordings or WaveWarZ market updates to YouTube, TikTok, Instagram simultaneously.

**Value:** Some. But ZAO already has Restream integration for streaming, and ZOL/ZOE handle Farcaster distribution. Not a critical gap.

**Gating:** Product team would need to decide if multi-platform reach for music content justifies another tool.

**Effort:** Low (off-the-shelf feature, but adds another SaaS to the stack).

### 4. Not a Strong Fit: Direct Music Streaming
JubJub is video-first (YouTube, TikTok integration). ZAO's music player components (src/components/music/) and SongJam catalog are audio-first. JubJub would require converting SongJam tracks to video (lyric videos, visualizers, etc.) to be useful. Possible but a level of indirection ZAO may not take.

---

## Technical Depth - MCP Integration Readiness

JubJub explicitly mentions "MCP integration readiness for AI agents" on the developer docs. This suggests:
- Likely OpenAI MCP schema published or planned
- Webhooks for event handling (revenue, viewer analytics)
- Possible agentic actions: draft metadata, schedule posts, track splits

If this is real (need to verify in JubJub's public MCP registry), ZOE could wire into JubJub's revenue/analytics layer without custom SDK work. This is a strong signal for feasibility of idea #1-2.

**Action:** Verify JubJub's MCP schema exists before committing to any integration.

---

## Sources

- **Main site:** https://jubjubapp.com
- **Developer docs:** https://jubjubapp.com/developers
- **Company info:** PitchBook (https://pitchbook.com/profiles/company/608988-61) - founded 2024, Melbourne, 10 employees
- **Twitter:** https://twitter.com/JubJubapp
- **Blog:** https://blog.jubjubapp.com

---

## Next Actions

| Owner | Task | Deadline | Success Criteria |
|-------|------|----------|------------------|
| Research lead (Zaal or delegated) | Verify JubJub's MCP schema exists and is documented; fetch OpenAI MCP registry or contact JubJub | 2026-07-30 | Public schema URL or email confirmation from JubJub dev team |
| Sparkz product owner | Roadmap decision: does Sparkz add music video feature in next 2 quarters? | 2026-08-06 | Decision recorded on Sparkz board; gating for idea #1 documented |
| ZOE team | If JubJub integration is approved, design webhook listener for revenue events. | Post-decision | Prototype in `bot/src/zoe/integrations/jubjub-webhooks.ts` |

---

## Confidence & Tier

- **Confidence:** High (grounded in public JubJub site + search + PitchBook) - not dependent on third-party claims
- **Tier:** STANDARD
- **Recommendation:** File for reference; do NOT block current sprints. Useful if Sparkz adds video or ZAO decides multi-platform distribution is strategic.

---

## Validation Checklist (for future audits)

- [ ] JubJub MCP schema still public and active
- [ ] JubJub commission rate still 3% (no price change)
- [ ] Base USDC settlement still the default (no chain changes)
- [ ] SDK still open-source (no licensing change)
- Last checked: 2026-07-23
