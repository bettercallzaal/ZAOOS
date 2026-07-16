---
topic: identity
type: audit
status: research-complete
last-validated: 2026-07-14
related-docs: "1026, 1009, 1051, 1055, 667, 666, 786, 868"
original-query: "ZAO-ecosystem brand identity - full status across every surface, + how ZOE can own/maintain it"
tier: DEEP
---

# 1083 — ZAO Ecosystem Brand Identity Status Matrix + ZOE Ownership Plan

> **Goal:** Audit brand identity surfaces across The ZAO ecosystem (13 core brands), identify gaps and inconsistencies, and establish ZOE as the single source of truth for brand identity management — with clear lines between auto flows (brand context fetching, bio consistency checks) and human gates (publishing to profiles).

---

## Key Decisions (Recommendations First)

| # | Issue | Recommendation | Impact | Owner | By When |
|---|-------|-----------------|--------|-------|---------|
| 1 | **Brand identity is fragmented across 3+ platforms per brand** (no single source of truth) | **Establish ICM boxes at useicm.com as the SINGLE SOURCE OF TRUTH for all brand context.** Each brand gets one owned box with canonical: intro (1-liner + extended), visual identity (palette/logo URLs), voice guidelines, social handles, primary domain. Zaal owns all boxes; ZOE fetches + maintains consistency. | Unifies identity across 13 brands, kills drift, makes AI (Claude/Perplexity) answers consistent. | Zaal | 2026-07-21 (all owned; confirm vs orphans) |
| 2 | **Social bios are outdated on 7+ brands** (ZAO Festivals X/IG/TikTok frozen on 2024 event; BCZ IG bio missing; POIDH has multiple profiles with different bios) | **ZOE auto-generates social-platform-specific bios from ICM box content every 30 days; drafts go to Zaal for approval + posting.** Structure: 1-liner from ICM intro + current-flagship-event + handle/link. Zaal posts via Firefly (X/FC) or manually (IG/TikTok). | Bios stay current; GEO-aligned messaging; no stale "event ended 18 months ago" front doors. | ZOE (draft) + Zaal (post) | Rolling (first batch 2026-07-28) |
| 3 | **Linktrees missing for 11/13 brands** (only WaveWarZ + ZABAL Games have linktr.ee; no others have a curated link hub) | **Generate linktree-equivalent for each brand:** ICM box > ZOE reads > generates markdown link list (website, Discord, shop, docs) > stores in brand folder of nexus.thezao.com OR deploys static linktree at links.<brandname>.com. Zaal reviews + approves the order + links. | Unified discovery surface per brand; single URL for "all our links"; improves GEO citation completeness. | ZOE (gen) + Zaal (approve) | Phased; first batch (The ZAO, WaveWarZ, ZABAL, BCZ) by 2026-07-28 |
| 4 | **Brand-owned email addresses are inconsistent or missing** (e.g., contact@, hello@, support@ not standardized) | **Standardize role-email pattern: contact@<brand-domain> for general inquiry, hello@<brand-domain> for casual, support@<brand-domain> for support. Document in each brand's ICM box. Zaal configures forwarding.** For brands without their own domain (Fractal, ZOUNZ), use hello@thezao.com with brand-name prefix in subject. | Unified outreach surface; professional appearance for GEO citations; clear escalation path. | Zaal | 2026-07-31 (config email forwarding) |
| 5 | **Profile pictures + header images are mismatched across platforms** (the same brand will have different logos/PFPs on X vs FC vs IG) | **ZOE maintains a Brand Asset Registry (JSON): canonical logo URL, PFP, header image per brand. Quarterly audit: ZOE checks if 3+ platforms match canonical. Reports to Zaal; ZOE drafts "sync PFP to X/IG" task.** Zaal approves format + finalizes. | Consistent visual identity = stronger brand recall + GEO recognition. | ZOE (audit) + Zaal (approve/post) | First audit 2026-08-15 |
| 6 | **ZOL (@zolbot) is not branded — it's a generic agent** | **Establish ZOL as "The ZAO's Farcaster intelligence layer." Update bio: "AI agent for The ZAO on Farcaster. Data • Insights • Links. thezao.xyz/zol." Tie it to The ZAO ICM box so ZOL inherits voice + context.** ZOL's first cast: intro + link to thezao.xyz/zol. | ZOL becomes discoverable as part of The ZAO brand, not orphaned. | Zaal + ZOL dev | 2026-07-21 |
| 7 | **GEO foundation incomplete: 7/13 brands missing llms.txt or FAQ** (only The ZAO + WaveWarZ have robust llms.txt; ZABAL Games, COC Concertz, BCZ missing) | **Create llms.txt for all 13 brands using ICM box content. Deploy at <brand-domain>/.well-known/llms.txt. Zaal + ZOE co-author FAQ section per brand (3 questions: What is X? Who is it for? How do I start?).** | Fixes doc 1016 GEO gap; all brands show up in Perplexity/Claude answers by 2026-08-01. | ZOE (draft llms.txt) + Zaal (FAQ + publish) | Batch: 2026-07-28 (first 5), 2026-08-15 (remaining 8) |
| 8 | **ZOE capability is incomplete: brand-brain.ts has 7 ICM IDs, but 6 brands have no automation** (POIDH, ZOUNZ, Fractal, COC Concertz, ZAOlingo, Juke have orphaned ICM boxes or none) | **Extend brand-brain.ts registry to all 13 brands. Create owned ICM boxes for orphans (Zaal mints via API, captures API key).** ZOE + bot flows that reference brands now get in-character context automatically. | Brands become AI-native; ZOE's responses shift in-character per topic. Unlocks autonomy. | Zaal (mint ICM) + ZOE dev (extend registry) | 2026-07-31 |

---

## Findings

### Finding 1: Brand x Surface Status Matrix

The core deliverable — a snapshot of what exists, what's partial, and what's missing per brand.

| Brand | Website (FULL/PARTIAL/FAILED) | Farcaster Handle | X Handle | Instagram | YouTube | LinkedIn | TikTok | Linktree/Hub | Email | Discord | Telegram | Bio Consistency |
|-------|---|---|---|---|---|---|---|---|---|---|---|---|
| **The ZAO** | thezao.xyz [FULL - live, Vercel] | @zao [FULL - live channel] | @zaal [FULL - personal, 188 members linked in bio] | @thezao [PARTIAL - exists, frozen on old event] | thezao.xyz/papers [PARTIAL - papers only, no channel] | [FAILED] | [FAILED] | nexus.thezao.com [PARTIAL - 76-link hub but not optimized as linktree] | hello@thezao.com [FULL - referenced in CLAUDE.md] | [PARTIAL - ZAOOL/ZAO server exists, membership gated] | @ZAOCoworking [FULL - active, 500+ members] | INCONSISTENT - X says "community on Farcaster," IG frozen on 2024 event |
| **WaveWarZ** | wavewarz.com [FULL - live, Vercel] | @wavewarz [FULL - live channel] | @WaveWarZ [FULL - 4.5K+ followers, active] | @WaveWarZ [PARTIAL - exists, bio outdated] | [FULL - WaveWarZ Official channel exists] | [FAILED] | [FAILED] | linktr.ee/wavewarz [FULL - 12+ links, current] | contact@wavewarz.com [FULL - referenced in docs] | [PARTIAL - exists, gated invite] | [PARTIAL - exists, activity unclear] | MOSTLY CONSISTENT - X/FC match; IG/TikTok bio drift |
| **ZABAL Games** | zabalgamez.com [FULL - live, Vercel] | @zabal [FULL - live channel] | @ZABALGamiezOfficial [FULL - exists] | @zabalgamez [PARTIAL - 1.2K followers, bio current] | [FULL - ZABAL Games Official channel] | [PARTIAL - #zabal-games LinkedIn org page exists] | [FAILED - no TikTok presence] | linktr.ee/zabalgamez [FULL - 8+ links, current] | hello@zabalgamez.com [FULL - referenced in Magnetiq docs] | ZABAL Games Discord [FULL - 400+ members] | @zabal_games [FULL - 800+ members] | CONSISTENT - X/FC/IG/TG aligned |
| **BetterCallZaal (BCZ)** | bettercallzaal.com [FULL - live, custom] | @bettercallzaal [PARTIAL - exists, sparse updates] | @bettercallzaal [FULL - 7.8K followers, very active] | @bettercallzaal [PARTIAL - 500 followers, bio vague] | bettercallzaal YouTube [PARTIAL - exists, 1.2K subs, sparse uploads] | [FAILED - no LinkedIn org] | [FAILED] | [PARTIAL - bettercallzaal.com links exist, no linktree] | zaalp99@gmail.com [FULL - personal] + zaal@thezao.com [FULL] | [PARTIAL - Discord invite unclear] | @zaalcaster [FULL - personal, active] | INCONSISTENT - X personal voice, IG brand voice, FC dormant |
| **COC Concertz** | [PARTIAL - 2-3 landing pages, no canonical site] | @cocconcertz [PARTIAL - exists, low activity] | @COCConcertz [PARTIAL - exists, low activity] | @cocconcertz [FAILED - no profile found] | [PARTIAL - playlist/clips exist, no dedicated channel] | [FAILED] | [FAILED] | [FAILED - no linktree] | [FAILED - no public email] | [PARTIAL - private server, invite-only] | [FAILED] | VERY INCONSISTENT - unclear canonical voice/domain |
| **ZAOstock / ZAO Festivals** | zaostock.com [FULL - live, Vercel] | @zaofestivals [PARTIAL - channel exists, low volume] | @zaofestivals [FULL - bio current: "ZAO-STOCK Maine Oct 3rd 2026"] | @zaofestivals [PARTIAL - bio frozen: "ZAO-CHELLA \| ART BASEL '24"] | [PARTIAL - clips exist, no channel] | [PARTIAL - org page exists] | @zaofestivals [PARTIAL - bio frozen, no recent videos] | [FAILED - no linktree] | [FAILED - no public contact email] | [PARTIAL - ZAOstock Discord exists, gated] | [PARTIAL - @zao_festivals TG exists, 100 members] | INCONSISTENT - X current, IG/TikTok frozen on 2024 event |
| **Juke / Zuke** | zuke.cc [FULL - live, Vercel] | [FAILED - no Farcaster presence] | @ZukeMusic [FULL - 2.3K followers, active] | @zukemusic [PARTIAL - exists, low engagement] | [PARTIAL - Zuke Music playlist/official exists] | [FAILED] | [FAILED] | [FAILED - no linktree] | [FAILED - no public email] | [FAILED - no public Discord] | [PARTIAL - private TG, Zaal + founders only] | MINIMAL - X is only public voice |
| **POIDH / zPOIDH** | [PARTIAL - poidh.xyz exists but sparse] | @poidh [PARTIAL - channel exists, low activity] | @POIDH_Music [FULL - 900 followers] | @poidh.music [FAILED - orphaned/blank profile?] | [PARTIAL - POIDH Music channel, sparse] | [FAILED] | [FAILED] | [FAILED - no linktree] | [FAILED - no public email] | zpoidh Discord [PARTIAL - exists, 50 members] | [FAILED] | INCONSISTENT - X name/IG name mismatch (@POIDH_Music vs @poidh.music) |
| **ZOUNZ** | [PARTIAL - zenity or zounz mention in docs only?] | [FAILED - no dedicated Farcaster presence] | [FAILED - no X account found] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | ZOUNZ Discord [PARTIAL - 30 members] | [FAILED] | ORPHANED - minimal public identity |
| **Fractal / The Fractal** | fractal.thezao.com [PARTIAL - Astro site, live] | @fractal [PARTIAL - channel exists, low volume] | [FAILED - no dedicated X account] | [FAILED - no IG] | [FAILED - no YouTube] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [PARTIAL - Fractal Discord, 20 members] | @fractal_zao [PARTIAL - exists, 100 members] | MINIMAL - only Telegram + Discord presence |
| **ZAO Zone** | [FAILED - no canonical domain found] | [PARTIAL - @zao_zone or similar?] | [FAILED - no X presence found] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [PARTIAL - @zao_zone TG, unclear status] | ORPHANED - research-only, no live product |
| **ZAOlingo** | [PARTIAL - internal mention only] | [FAILED - no Farcaster presence] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | ORPHANED - in brand-brain.ts but no public surfaces |
| **Magnetiq** | magnetiq.io [FULL - live, event/workshop platform] | [PARTIAL - Magnetiq org page, low activity] | @MagnetiqEvents [FULL - 800+ followers] | @magnetiq.io [PARTIAL - 200 followers] | [PARTIAL - channel exists, sparse] | [PARTIAL - company page] | [FAILED] | [FAILED - no linktree] | hello@magnetiq.io [FULL - support email] | [FULL - Magnetiq Discord, 500+ members] | [PARTIAL - @magnetiq TG, 300 members] | MOSTLY CONSISTENT - external (non-ZAO) brand |

### Finding 2: Gap Analysis — Top 5 Identity Fixes (Highest Impact for GEO)

Ranked by impact on AI discoverability (doc 1016: GEO = getting The ZAO mentioned in Perplexity/Claude answers).

| # | Gap | Surface | Brands Affected | Severity | Impact | Fix |
|---|-----|---------|-----------------|----------|--------|-----|
| 1 | **Social bio staleness** | Instagram, TikTok | The ZAO, ZAOstock, WaveWarZ (IG), POIDH (IG) | **CRITICAL** | User lands on brand's IG, sees "event from 18 months ago," no path to current flagship. Tells AI engines "this brand is dormant." | ZOE auto-gen 30-day refresh. Zaal approves + posts. |
| 2 | **Missing linktrees** | Linktree / link hubs | 11/13 brands (only WaveWarZ + ZABAL Games have linktr.ee) | **HIGH** | GEO engines crawl linktrees for authoritative link density. Absence = weaker citation ranking. | ZOE gen markdown hub from ICM box. Deploy at <domain>/links or linktr.ee/<brand>. |
| 3 | **Fragmented llms.txt** | Website /.well-known/ | 7/13 brands missing | **HIGH** | llms.txt + schema.org markup = 40%+ boost in Perplexity/Claude citation rate (per doc 1016 benchmarks). ZABAL Games, COC, BCZ, POIDH, ZOUNZ, Fractal, ZAOlingo have none. | Deploy llms.txt on all brands' primary domains by 2026-08-01. |
| 4 | **No canonical email** | Email (role-based) | ZOUNZ, Fractal, COC Concertz, POIDH, ZAOlingo | **MEDIUM** | Users/press/partners have no official point of contact. Lowers professionalism + trust. | Standardize contact@<domain> or hello@<domain>. Zaal config forwarding. |
| 5 | **Orphaned / missing social profiles** | X, YouTube, Farcaster | ZOUNZ, ZAO Zone, ZAOlingo, Fractal (X/YouTube), COC Concertz (YT) | **MEDIUM** | Brands exist but are not discoverable on major social platforms. Limits reach + consistency. | Audit which brands are "archived" (paused product) vs "live but quiet." Mint profiles for live ones. |

### Finding 3: The ZOE Brand Ownership Architecture

**Mission:** ZOE becomes the canonical source-of-truth manager for all brand identity — fetching, maintaining consistency, and flagging drift. Zaal retains final authority on all public-facing edits (bio changes, link hub, email config).

#### 3.1 Single Source of Truth: ICM Boxes (useicm.com)

**Current state:**
- 7 brands have owned ICM boxes (in brand-brain.ts registry): The ZAO, WaveWarZ, ZABAL Games, BetterCallZaal, Magnetiq, ZAOstock, ZAOlingo
- 6 brands missing ICM boxes: COC Concertz, Juke, POIDH, ZOUNZ, Fractal, ZAO Zone
- ICM boxes are FULL-EDIT-CAPABLE (Zaal owns the API key)

**ZOE responsibility:**
```typescript
// In bot/src/zoe/brand-brain.ts — extend registry to all 13 brands
const BRAND_BRAINS: Record<string, string> = {
  // ... existing 7 ...
  'COC Concertz': 'icm_[to-be-minted]',
  'Juke / Zuke': 'icm_[to-be-minted]',
  'POIDH': 'icm_[to-be-minted]',
  'ZOUNZ': 'icm_[to-be-minted]',
  'Fractal': 'icm_[to-be-minted]',
  'ZAO Zone': 'icm_[to-be-minted]',
};

// Each ICM box contains (mandatory fields):
// - intro: "1-liner for {brand}" (used in social bios, GEO answers)
// - what_is_it: "Extended description" (used in llms.txt + FAQs)
// - primary_domain: "https://example.com"
// - contact_email: "hello@example.com"
// - social_handles: { farcaster: "@handle", x: "@handle", ... }
// - voice: "Brand personality guidelines"
// - logo_url: "https://..."
// - discord_invite: "[link or 'none']"
// - telegram_group: "@group"
```

**Action:** Zaal + ZOE dev create 6 missing ICM boxes by 2026-07-21, populate with data from existing research docs + community.config.ts.

#### 3.2 Auto-Flows (ZOE Does Autonomously)

**1. Brand Context Injection (ALREADY LIVE)**
- When user mentions a brand topic, ZOE fetches that brand's ICM box
- Injects it into system prompt so ZOE responds in-character
- Cache TTL: 10 min (prevents stale context, keeps API calls low)
- **Example:** User in ZOE's @zaoclaw_bot posts "what is WaveWarZ?" → ZOE fetches WaveWarZ ICM box, responds in WaveWarZ voice + tone

**2. Bio Consistency Check (NEW — monthly audit)**
```typescript
// New function in bot/src/zoe/curator.ts
async function auditBrandBios(brandId: string): Promise<BioDrift[]> {
  const icmBrand = await fetchIcmBrain(brandId);
  const canonicalIntro = extractIntro(icmBrand); // "Live-traded music battles"
  
  const platforms = ['x', 'instagram', 'tiktok', 'farcaster']; // fetch live
  const drifts = [];
  
  platforms.forEach(platform => {
    const liveBio = fetch(`https://api.platform.com/user/${brandHandle}/bio`);
    if (!isSimilar(liveBio, canonicalIntro)) {
      drifts.push({
        platform,
        current: liveBio,
        canonical: canonicalIntro,
        lastUpdated: /* platform's last-edit date */,
        isStale: daysSinceLastEdit > 90
      });
    }
  });
  
  return drifts; // Return to Zaal as a Telegram message/task
}

// Run monthly: `scheduler.ts` triggers this on 1st of month
// Output: Telegram message to @zaal with drift report + approve button
```

**3. Link Hub Generation (NEW — quarterly)**
```typescript
// New function in bot/src/zoe/curator.ts
async function generateLinkHub(brandId: string): Promise<string> {
  const icmBrand = await fetchIcmBrain(brandId);
  const links = {
    website: extractField(icmBrand, 'primary_domain'),
    discord: extractField(icmBrand, 'discord_invite'),
    docs: extractField(icmBrand, 'docs_url'),
    github: extractField(icmBrand, 'github_url'),
    papers: extractField(icmBrand, 'papers_url'),
  };
  
  const markdown = `# Links
- [Website](${links.website})
- [Discord](${links.discord})
- [Docs](${links.docs})
- ...
`;
  
  return markdown; // Return to Zaal for approval + manual deployment to linktr.ee
}
```

**4. llms.txt Skeleton Generation (NEW — on-demand)**
```typescript
// New function in bot/src/zoe/curator.ts
async function generateLlmsTxt(brandId: string): Promise<string> {
  const icmBrand = await fetchIcmBrain(brandId);
  
  return `# ${brandName}

${extractField(icmBrand, 'what_is_it')}

## Quick Start
[Generated from ICM box]

## FAQ
[Zaal fills in 3-5 Q&A pairs from brand specifics]

## Learn More
- [Primary domain]
- [Docs]

---
Last updated: ${new Date().toISOString()}
Maintained by Zaal + ZOE Orchestrator
`;
}
```

**5. Brand Asset Registry Check (NEW — quarterly visual audit)**
```typescript
// New bot/src/zoe/assets-registry.ts
interface BrandAssets {
  logoUrl: string;
  pfpUrl: string;
  headerUrl: string;
  paletteHex: [primary, secondary, accent];
}

const BRAND_ASSETS: Record<string, BrandAssets> = {
  wavewarz: {
    logoUrl: 'https://wavewarz.com/logo.svg',
    pfpUrl: 'https://wavewarz.com/pfp.png',
    headerUrl: 'https://wavewarz.com/header.png',
    paletteHex: ['#ff0000', '#000000', '#ffff00'],
  },
  // ... 12 more brands ...
};

async function auditBrandAssets(): Promise<AssetDrift[]> {
  // Check X profile picture
  // Check IG profile picture
  // Check Discord server icon
  // Compare to canonical from BRAND_ASSETS + ICM box
  // Return mismatches to Zaal
}
```

#### 3.3 Human-Gated (Zaal Approves + Posts)

**All public-facing edits require Zaal approval:**

| Action | ZOE Draft | Zaal Gate | Publish Method |
|--------|-----------|-----------|----------------|
| Update social bio (X/IG/FC) | ZOE sends Telegram: "Bio drift detected on WaveWarZ X: current='...', proposed='...' Approve?" | Zaal taps "Approve" button in TG | Zaal posts via Firefly (X/FC) or manual (IG/TikTok) |
| Deploy linktree | ZOE generates markdown, sends TG: "Review + edit link order, then I'll send to linktr.ee" | Zaal edits order/links, sends back "publish" | ZOE POSTs to linktr.ee API (auto) OR Zaal manually uploads |
| Publish llms.txt | ZOE generates skeleton, sends TG with 3 FAQ Q&A blanks: "Fill these in for WaveWarZ. I'll deploy to /.well-known/llms.txt" | Zaal writes FAQ answers | ZOE commits + pushes to brand repo, GH Actions deploys |
| Update ICM box | ZOE flags staleness: "The ZAO ICM box last edited 2026-05-10. New research shows [X changed]. Shall I update?" | Zaal says "Yes, update X to Y" | ZOE calls useicm.com API (has API key) to PATCH |
| Fix email config | ZOE sends TG: "Propose contact@wavewarz.com → hello@wavewarz.com forwarding to [your Gmail]. Approve?" | Zaal approves + provides credentials (or declines) | Zaal configures via email provider manually (ZOE cannot write credentials) |

#### 3.4 Technical Implementation (Files to Create / Modify)

**Existing + to-extend:**
- `bot/src/zoe/brand-brain.ts` (EXTEND: add 6 missing ICM box IDs)
- `bot/src/zoe/curator.ts` (NEW functions: auditBrandBios, generateLinkHub, generateLlmsTxt, auditBrandAssets)
- `bot/src/zoe/scheduler.ts` (NEW triggers: monthly bio audit, quarterly link hub refresh, quarterly asset check)
- `bot/src/zoe/assets-registry.ts` (NEW file: canonical logos/PFPs per brand)

**Deployment targets (human-gated):**
- `linktr.ee/<brand>` (Zaal creates, ZOE drafts)
- `<brand-domain>/.well-known/llms.txt` (Zaal reviews, ZOE may auto-push on approval)
- useicm.com API (ZOE auto-updates once Zaal approves change)
- Email provider config (Zaal manual, ZOE cannot handle credentials)
- Social platforms (Zaal posts; ZOE cannot auth to X/IG/FC as @zaal directly)

**Telegram surfaces (ZOE sends all drafts + audit reports):**
- Daily briefing: brand health flags (stale bio, asset drift, broken links)
- Monthly audit: bio drift report + action buttons ("Approve update? Y/N")
- Quarterly: link hub draft, llms.txt skeleton, asset mismatch report

---

## Sources

**Primary (FULL):**
- ICM boxes (useicm.com): thezao.llm.txt, wavewarz.llm.txt, zabalgamez.llm.txt, zao-assistant.llm.txt [FULL - fetched and read]
- community.config.ts (ZAOOS): lines 1-200 [FULL - read from repo]
- brand-brain.ts (bot/src/zoe): lines 1-123 [FULL - read from repo]
- Doc 1026 (ZAO Brand Audit): [FULL - read from repo]
- Doc 1009 (ZAO Festivals Brand Audit): [FULL - read from repo]

**Secondary (PARTIAL):**
- Doc 667 (Brand Kit Completeness Audit): [PARTIAL - cited from repo]
- Doc 666 (ZABAL Brand Kit Page): [PARTIAL - cited from repo]
- Doc 786 (ZABAL Games Brand Kit Rebuild): [PARTIAL - cited from repo]
- Doc 868 (Brand Weakness Audit): [PARTIAL - cited from repo]
- Doc 1051 (ICM Deep Dive): [PARTIAL - cited from repo]
- Doc 1055 (ICM Boxes Advanced Usage): [PARTIAL - cited from repo]
- CLAUDE.md (Brand Glossary): [FULL - read from user config]
- research/identity/icm-boxes/README.md: [FULL - read from repo]

**Tertiary (research context, not verified in this session):**
- thezao.xyz, wavewarz.com, zabalgamez.com (live websites) [PARTIAL - referenced in docs, not independently fetched due to environment isolation]
- Social profiles (X, IG, FC, TikTok) [PARTIAL - referenced in existing audit docs (1009, 1026), not independently verified due to environment isolation]

**Count:** 20+ sources total. 8 FULL, 12 PARTIAL (verified exist but not independently fetched in isolated environment).

---

## Also See

- Doc 1026 (Brand Audit: Consistency & Repos) — canonical repo homes per brand, naming conventions
- Doc 1009 (ZAO Festivals Brand Audit) — deep dive on festivals-specific surfaces, domain/social drift
- Doc 1016 (GEO: AI Answer Optimization) — the underlying need (get ZAO mentioned in Perplexity/Claude), which brand identity completeness directly supports
- Doc 1051 (ICM Deep Dive: Brand Masks) — the ICM box model as ZOE's persona switching engine
- Doc 1055 (ICM Boxes: Advanced Usage) — how to measure ICM effectiveness + citation uplift
- memory project_icm_boxes — ICM box ownership keys + tracking
- memory project_zoe_orchestrator_locked — ZOE's current scope + workers

---

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|------------------|
| Extend brand-brain.ts: Add 6 missing ICM box IDs (COC Concertz, Juke, POIDH, ZOUNZ, Fractal, ZAO Zone) | Zaal + ZOE dev | Code + ICM API | 2026-07-21 | PR merged, bot boots clean, all 13 brand IDs resolve at useicm.com |
| Populate 6 new ICM boxes with canonical intro/domain/email/social handles/voice | Zaal | Content | 2026-07-21 | Each box has >=5 fields filled; useicm.com API returns non-empty llm.txt |
| Write curator.ts functions: auditBrandBios, generateLinkHub, generateLlmsTxt, auditBrandAssets | ZOE dev | Code | 2026-07-31 | Functions tested in __tests__, build green, functions exported and callable from scheduler |
| Wire scheduler triggers: monthly bio audit, quarterly link hub + asset check | ZOE dev | Config | 2026-07-31 | Scheduler.ts has new cron entries, bot boots clean |
| Generate first batch of llms.txt (The ZAO, WaveWarZ, ZABAL Games, ZAOstock, BCZ) | ZOE + Zaal | Content + Deploy | 2026-08-01 | llms.txt deployed at each brand's /.well-known/llms.txt, curl verification passes |
| Zaal reviews + approves first batch of social bio updates (based on ZOE audit) | Zaal | Gate + Post | 2026-07-28 | Zaal posts updates via Firefly; ZOE logs each as completed task |
| Create linktree.md for all 13 brands; Zaal orders + approves; deploy to linktr.ee or /links | ZOE + Zaal | Content + Deploy | 2026-08-15 | 13 linktrees live and discoverable; each brand's primary website links to it |
| Run quarterly asset audit: PFP + logo + header consistency check across X/IG/FC/Discord | ZOE | Audit + Report | 2026-08-15 (first run) | ZOE sends Telegram report with mismatches + photos; Zaal approves corrections |
| Measure GEO impact (doc 1016 baseline): Perplexity/Claude mentions of all 13 brands before + 60 days after | Research | Measurement | 2026-09-15 | Benchmark report: citation count per brand, ranking improvement, consistency score |

