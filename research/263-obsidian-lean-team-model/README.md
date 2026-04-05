# 263 — Obsidian's Lean Team Model: $350M Valuation, 9 Employees, 3 Engineers

> **Status:** Research complete
> **Date:** April 5, 2026
> **Goal:** Extract lessons from Obsidian's extreme capital efficiency for ZAO OS as a small-team, community-driven product
> **Source tweet:** [@Doomerzoomer](https://x.com/doomerzoomer/status/2040689132834636212) quoting Obsidian's hiring post (Apr 5, 2026, 6.5K likes)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Team model** | ADOPT Obsidian's approach: stay tiny (1-3 engineers), let community + AI handle the rest. ZAO OS is already one developer (Zaal) — this validates the path |
| **Revenue model** | ADOPT optional paid services on top of free core. ZAO OS equivalent: free community access, paid premium features (AI curation, advanced spaces, analytics) |
| **Architecture** | KEEP local-first where possible. Obsidian's "file over app" philosophy maps to ZAO's Farcaster-native approach — data lives on the protocol, not our servers |
| **Plugin ecosystem** | BUILD toward an extension model. Obsidian's 1,000+ community plugins drive retention without engineering cost. ZAO OS can open `community.config.ts` as a fork point (already designed for this) |
| **VC funding** | SKIP VC for as long as possible. Obsidian proves bootstrapped + community-supported works at $25M ARR. ZAO has community treasury (ZOUNZ) + Respect as native incentive layers |
| **Hiring** | HIRE only when absolutely necessary. Obsidian went 6 years before posting their 4th engineer role. Use AI coding tools (Claude Code) as a force multiplier instead |

## The Numbers That Matter

| Metric | Obsidian | ZAO OS (current) | ZAO OS (target) |
|--------|----------|-------------------|-----------------|
| **Engineers** | 3 (hiring 4th in Apr 2026) | 1 (Zaal + Claude Code) | 2-3 |
| **Total team** | 9 employees | 1 founder | 3-5 |
| **Users** | 1.5M monthly active | ~188 members (gated) | 1,000+ gated members |
| **Revenue** | ~$25M ARR (estimated) | $0 (pre-revenue) | Sustainable via community treasury + premium |
| **Valuation** | $300-350M (estimated) | N/A | N/A (community-owned) |
| **Funding** | $0 VC (100% bootstrapped) | $0 VC | Stay bootstrapped, use ZOUNZ treasury |
| **Downloads** | 5M+ total | N/A (web app) | N/A |
| **Churn** | <10% annual | N/A | Target <15% |
| **Revenue per employee** | ~$2.8M/employee | N/A | N/A |
| **Plugin ecosystem** | 1,000+ plugins, 100M+ downloads | 0 (not yet open) | Community config forks |

## Comparison: Lean Team Models in Software (2026)

| Company | Team Size | Revenue | Valuation | Funding | Revenue/Employee | Model |
|---------|-----------|---------|-----------|---------|------------------|-------|
| **Obsidian** | 9 | $25M ARR | $300-350M | $0 (bootstrapped) | $2.8M | Freemium + sync/publish subscriptions |
| **Notion** | ~400 | $400M ARR | $10B+ | $343M VC | $1.0M | Freemium + team subscriptions |
| **Linear** | ~60 | ~$30M ARR (est.) | $400M | $52M VC | ~$500K | Team subscriptions |
| **Mailchimp** (at exit) | 1,200 | $800M | $12B (Intuit acquisition) | $0 (bootstrapped) | $667K | Freemium email marketing |
| **ZAO OS** (target) | 3-5 | TBD | Community-owned | $0 (ZOUNZ treasury) | N/A | Gated community + premium features |

Obsidian's $2.8M revenue per employee is **2.8x Notion's** and **5.6x Linear's**. The tiny team model generates outsized returns when the product has strong network effects and community pull.

## Why This Works: The Obsidian Playbook

### 1. Local-First Architecture Eliminates Infrastructure Cost
Obsidian stores everything as local Markdown files. No database, no server-side processing for the core product. Only the optional Sync ($4-8/mo) and Publish ($16/mo) services require server infrastructure. This means 3 engineers maintain a product used by 1.5M people because **the product runs on the user's machine**.

**ZAO OS parallel:** Farcaster is ZAO's "local-first" layer. Casts, identity, and social graph live on Farcaster hubs — not our database. XMTP handles encrypted messaging. The more ZAO OS leans on protocol-native data, the less infrastructure we maintain. `src/lib/farcaster/neynar.ts` and `src/lib/db/supabase.ts` are the integration points — Supabase caches protocol data, not stores it.

### 2. Community Builds the Extensions
Obsidian's 1,000+ plugins were built by the community, not the 3 engineers. The plugin API is well-documented, and the community handles feature requests by building them.

**ZAO OS parallel:** `community.config.ts` is already the fork point — any community can clone ZAO OS and rebrand. The next step: expose a plugin/extension system so ZAO members can build custom modules (DJ mode extensions, curation algorithms, governance plugins) without touching core code.

### 3. Philosophy-Driven Product Decisions
Steph Ango's "File over app" principle: *"In the fullness of time, the files you create are more important than the tools you use to create them."* Every product decision at Obsidian flows from 5 principles: Yours, Durable, Private, Malleable, Independent.

**ZAO OS parallel:** ZAO's equivalent principles already exist:
- **Yours** = Farcaster identity (you own your social graph)
- **Durable** = On-chain governance (ZOUNZ proposals are permanent)
- **Private** = XMTP E2E encrypted messaging
- **Malleable** = `community.config.ts` forkability
- **Independent** = No VC, community-owned via ZOUNZ treasury

### 4. Subscription Revenue on Optional Services
80% of Obsidian's revenue comes from Sync — a convenience feature, not a core feature. The core product is free forever. Users pay because they want to, not because they have to.

**ZAO OS parallel:** Potential premium features that follow this model:
- AI-powered music curation (beyond basic respect-weighted algorithm in `src/lib/music/curationWeight.ts`)
- Advanced Spaces features (recording transcription, AI summaries)
- Analytics dashboard for artists (play counts, respect trends)
- Priority publishing to cross-platform channels (`src/lib/publish/`)

### 5. AI as the 4th Engineer
Obsidian operated with 3 engineers for 6 years. In 2026, with AI coding tools, a solo founder can match a 3-person team's output. Zaal is already doing this — ZAO OS has 40+ components in `src/components/spaces/`, 30+ in `src/components/music/`, a full governance system, and 262 research docs, all built by one person + Claude Code.

## Steph Ango's Key Quotes (Relevant to ZAO)

> *"It is now possible for tiny teams to make principled software that millions of people use, unburdened by investors — principled apps that put people in control of their data, their privacy, and their wellbeing, with these principles irrevocably built into the architecture."*

> *"If you want your writing still readable on a computer from the 2060s or 2160s, it's important that your notes can be read on a computer from the 1960s."*
— On choosing Markdown (parallels ZAO's choice of Farcaster protocol over proprietary social graphs)

> *"Apps are ephemeral, but your files have a chance to last."*
— On "File over app" (parallels ZAO's "protocol over platform" approach)

## ZAO OS Integration

### Files That Already Reflect This Philosophy
- `community.config.ts` — Single config file for full community rebranding (Obsidian's "malleable" principle)
- `src/lib/farcaster/neynar.ts` — Protocol-native identity, not proprietary auth
- `src/lib/db/supabase.ts` — Cache layer for protocol data, not the source of truth
- `src/lib/publish/` — Cross-platform publishing (not locked to one network)
- `src/lib/music/curationWeight.ts` — Respect-weighted curation (community-driven, not algorithmic black box)

### What to Build Next (Obsidian-Inspired)
1. **Extension API** — Document `community.config.ts` as the fork point and create a simple plugin interface for community-built modules
2. **Premium tier** — Optional paid features (AI curation, advanced analytics) that fund development without gating core community features
3. **Community contribution pipeline** — Make it easy for ZAO members to contribute code (Obsidian's plugin review process as a model)

## Anti-Lessons: Where ZAO OS Diverges

| Obsidian Approach | ZAO OS Should Differ | Why |
|-------------------|----------------------|-----|
| Desktop-first (Electron) | Web-first (Next.js, mobile-first) | ZAO members are mobile-native, Farcaster is mobile-first |
| Individual tool (single-player) | Community tool (multiplayer) | ZAO OS is inherently social — spaces, governance, messaging |
| Plugin marketplace (open) | Gated community (curated) | ZAO's value is in curation and exclusivity, not openness |
| No real-time features | Real-time is core (Spaces, chat) | Live audio, messaging, and collaborative governance require real-time infra |

## Sources

- [Obsidian in 2026: Usage, Revenue, Valuation & Growth Statistics](https://fueler.io/blog/obsidian-usage-revenue-valuation-growth-statistics)
- [About Obsidian — Team & Philosophy](https://obsidian.md/about)
- [Steph Ango — File over app](https://stephango.com/file-over-app)
- [Steph Ango — Obsidian page](https://stephango.com/obsidian)
- [@Doomerzoomer tweet — Obsidian metrics reaction](https://x.com/doomerzoomer/status/2040689132834636212)
- [@obsdmd tweet — Hiring 4th engineer](https://x.com/obsdmd) (Apr 4, 2026)
- [Obsidian Pricing](https://obsidian.md/pricing)
- [The Bootstrapped Revolution — Barry O'Reilly](https://barryoreilly.com/explore/blog/bootstrapped-revolution-in-entrepreneurship/)
- [Why Bootstrapping Beats Funding in 2025](https://www.sidetool.co/post/why-bootstrapping-beats-funding-in-2025-real-success-stories/)
- [Steph Ango on LinkedIn — Why 100% user-supported](https://www.linkedin.com/posts/stephango_why-obsidian-is-100-user-supported-and-not-activity-7162241164895539200-lQiD)
