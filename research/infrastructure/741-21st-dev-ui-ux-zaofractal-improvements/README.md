---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-05-25
related-docs: 740, 728, 722
original-query: "21st.dev - investigate this website and the UI UX options and make a bunch of suggestions on where we want this to improve this for informative use but also visual use"
tier: STANDARD
---

# 741 - 21st.dev + Docs-Site UI/UX Improvements for ZAOfractal

> **Goal:** Investigate 21st.dev (community UI component marketplace + Magic MCP) and survey best-in-class docs-site UI patterns. Compare against the current `zaofractal.vercel.app` (Astro + custom theme, shipped May 24, 2026). Generate a prioritized list of improvements - informative AND visual - and decide between three paths: keep custom Astro and patch, migrate to Starlight, or use 21st.dev Magic MCP to generate components on the current setup.

---

## Key Decisions (Recommendations First)

| # | Recommendation | Why | Priority |
|---|---|---|---|
| 1 | **KEEP the custom Astro setup; ADD missing docs-UX features incrementally** | Migrating to Starlight is a 2-day rewrite that costs the BCZ brand customization. Custom Astro + targeted feature additions is 1-2 sprint days and keeps the aesthetic. | HIGH |
| 2 | **ADD Pagefind for full-text search** | MIT-licensed, zero-config, runs at build time and indexes all rendered HTML. Adds a `/search` page and a cmd+K modal. Drop-in for Astro. | HIGH |
| 3 | **ADD per-doc table of contents (right rail) + breadcrumbs + prev/next nav** | Our research docs are 600-1000 lines each. A reader cannot navigate them without a TOC. Breadcrumbs + prev/next make multi-doc sequences (whitepaper Ch.1 -> Ch.2 -> Ch.3) readable. | HIGH |
| 4 | **ADD a left-rail sidebar with the file tree on doc pages** | Right now you click "Research" -> see a grid -> click a doc -> lose the grid. A persistent left sidebar with collapsible folders mirrors VSCode / GitHub UX and lets readers jump between docs without backtracking. | HIGH |
| 5 | **ADD code-block copy buttons + clickable contract addresses** | Already render code via Shiki - just need a Shiki transformer for copy buttons. Contract addresses (the four 0x... in this repo) should be `<a href="optimistic.etherscan.io/...">` with copy-on-click. | HIGH |
| 6 | **USE 21st.dev Magic MCP for the visual upgrades (hero shader, timeline component, people cards)** | $20/mo Pro tier. Type `/ui` in Claude Code, get production-ready React/Tailwind components. Best path for the visual additions where designing from scratch is overkill. | MEDIUM |
| 7 | **GENERATE OG social cards for every doc page** | Astro `@vercel/og` or `astro-og-canvas`. Every Farcaster cast / X post that links a ZAOfractal page should unfurl with a branded card. Build-time generation, zero ongoing cost. | MEDIUM |
| 8 | **ADD a Farcaster cast share button on every doc** | One-click "share this doc to Farcaster" using the Warpcast composeCast URL pattern. ZAO is Farcaster-native; the site should be too. | MEDIUM |
| 9 | **ADD a lineage timeline component on the home page** | We have ~30 dated milestones in the timeline (Larimer 2014 -> EOS 2018 -> More Equal Animals 2021 -> Fractally 2022 -> ZAO Fractal Aug 2024 -> May 2026). A scroll-driven vertical timeline is the single most informative AND visual addition the home page could get. | MEDIUM |
| 10 | **SKIP Starlight migration** | Starlight is excellent but is a different aesthetic. We already invested in BCZ-style theming and the custom layouts work. Starlight wins for vanilla docs; we want branded docs. | LOW (decision) |

---

## Part 1 - What 21st.dev Is

**21st.dev** (also called "21st") is a Y Combinator-backed community UI component marketplace + AI component generator. Two main products:

### 21st.dev Components (the marketplace)
Browse community-contributed React + Tailwind + shadcn/ui components by category. Free to browse.

Visible categories at [21st.dev](https://21st.dev/):
- **Shaders** - WebGL/CSS visual effects (particle systems, gradient noise)
- **Heros** - hero section components
- **Features** - feature showcase blocks
- **AI Chat Components** - chat UI elements
- **Calls to Action**, **Buttons**
- **Testimonials**, **Pricing Sections**
- **Text Components**

### 21st.dev Magic MCP (the AI generator)
An MCP server that integrates with Cursor, Claude Code, VS Code + Cline, Windsurf. Usage:

```
/ui a hero section with a particle shader background and a CTA button
```

The MCP returns multiple style variations to compare. Output is production-ready TypeScript + Tailwind.

**Pricing** (verified May 25 2026):

| Plan | Cost | Credits | Highlights |
|------|------|---------|------------|
| Free | $0 | 100/mo | Unlimited browsing + logo search via SVGL |
| Pro | $20/mo | 400 | Clone-a-site feature, priority support |
| Max | $100/mo | 2,000 | Early features, team support |

100 credits/mo is enough to generate 5-10 small components, which covers most one-off needs. For a serious docs-site build-out (hero + 4-5 custom components + iteration), Pro at $20/mo is correct.

### Installation in Claude Code

The Magic MCP is configured per-project via the MCP server registration. The 21st team publishes the setup instructions at [21st.dev/magic](https://21st.dev/magic). Once installed, typing `/ui <description>` invokes the generator and returns variations as inline component code that Claude Code can save into the repo.

### Where 21st.dev fits for ZAOfractal
- **Hero shader on the home page**: 1 generation, fits in free tier.
- **Vertical lineage timeline**: 1-2 generations.
- **People cards for the key-people page**: 1 generation, looped over data.
- **Contract address widget (copy + Etherscan link)**: 1 generation.

Total: ~5 generations on the free tier. No reason to upgrade until we hit a deeper redesign.

---

## Part 2 - Comparison: Docs-Site Frameworks Surveyed

| Framework | Stack | Built-in features | When it wins | When it loses |
|-----------|-------|-------------------|--------------|---------------|
| **Custom Astro (current)** | Astro 5 + custom CSS | Whatever you build | Total brand + layout control; LLM-friendly source; ZAO already has it deployed | Reimplements features other frameworks ship by default |
| **Astro Starlight** | Astro + Starlight | Sidebar nav, full-text search, i18n, dark mode, syntax highlighting, optimized typography | Standard docs site, ship in hours, MIT, free | Constrains layout; theming requires fighting Starlight's CSS; not BCZ-aesthetic out of box |
| **Mintlify** | Hosted SaaS | Sidebar nav, search, API playground, AI assistant, MCP integration, dark/light, smooth motion | Product docs with API examples + AI Q&A; team editing via web UI | Hosted (lock-in); paid tiers for custom domains + branding; less control over theme |
| **Docusaurus** | React + MDX | Versioned docs, search, plugin ecosystem | Versioned product docs, React-heavy customization | Slower builds than Astro; React lock-in |
| **VitePress** | Vue + Vite | Sidebar, search, dark mode | Vue ecosystem, very fast | Vue lock-in |
| **Nextra** | Next.js + MDX | Docs theme on top of Next | Next.js shops | Next.js lock-in |
| **GitBook** | Hosted SaaS | WYSIWYG editing, version control, search | Non-technical team editing | Vendor lock-in, paid tiers |

**Verdict for ZAOfractal:**

- **Skip Mintlify.** It is excellent but it is a hosted product with monthly fees and less aesthetic control. ZAO is Farcaster-native and Web3-aesthetic; Mintlify's polished-but-corporate vibe is wrong.
- **Skip Starlight.** It would shorten the development of new features (search, TOC, sidebar built-in), but the BCZ brand requires custom CSS that fights Starlight's defaults. Net cost is likely higher than just building what we need on the current custom Astro.
- **Use 21st.dev Magic** to accelerate visual component development on top of current Astro. Best of both worlds.

---

## Part 3 - Current State Audit (zaofractal.vercel.app)

Deployed May 24 2026 to Vercel via custom Astro setup. As-built:

| Has | Missing |
|-----|---------|
| Sticky top nav (Home / Reference / Research / Whitepaper / Resources) | Per-doc table of contents |
| Dark BCZ-style theme (#0a0a1a + orange/cyan/gold) | Left-rail file-tree sidebar |
| Syne 800 headings + Outfit body | Breadcrumbs |
| Doc grid cards on index pages | Prev/next navigation between docs |
| Frontmatter pills on doc pages (topic/type/tier/status/last-validated) | Full-text search |
| Back-link + "view source on GitHub" link per doc | Code copy buttons |
| Mobile responsive at 600px | Clickable contract addresses (now plain text) |
| Sitemap.xml auto-generated | OG social cards |
| 61 pages, ~10s production build | "Last updated" surfaced |
|  | "Related docs" surfaced from frontmatter |
|  | Command palette (cmd+K) |
|  | Farcaster cast share button |
|  | Hero visual on home page |
|  | Lineage timeline component |
|  | People cards (for key-people page) |
|  | Print stylesheet for whitepaper |
|  | PDF export for whitepaper |

The site is functional but plain. The missing items are what separate a Stage-1 docs site from a Stage-2 product surface.

---

## Part 4 - Prioritized Improvements (HIGH / MEDIUM / LOW)

### HIGH (ship this week, 1-2 sprint days total)

| Improvement | Effort | Approach |
|-------------|--------|----------|
| **Full-text search** | 30 min | Add Pagefind via `astro-pagefind`. Indexes all rendered HTML at build time. Mounts a `<Search />` component in the nav with cmd+K binding. MIT, free. |
| **Per-doc TOC (right rail)** | 1 hr | Astro `@astrojs/markdoc` already extracts headings. Build a `<TOC />` component that reads `Astro.props.headings` and renders a sticky right-rail list. Highlight active section on scroll. |
| **Breadcrumbs** | 30 min | Derive from `Astro.url.pathname` -> render `Home > Research > Fractal Deep > 04-Optimystics tools` on every doc page. |
| **Prev/Next nav** | 1 hr | In `[...slug].astro`, sort the collection by `id`, find current doc index, link to neighbors. Footer block with `<- Prev` / `Next ->`. |
| **Code copy buttons** | 30 min | Astro Shiki transformer `@shikijs/transformers` with `transformerCopyButton`. One config line. |
| **Clickable contract addresses** | 1 hr | A tiny remark plugin that detects `0x[a-fA-F0-9]{40}` patterns and wraps them in `<a href="https://optimistic.etherscan.io/address/...">` + copy-on-click. |

**Sub-total: ~5 hours.** Ships this week. Doubles the readability of every doc.

### MEDIUM (next sprint, 2-3 sprint days total)

| Improvement | Effort | Approach |
|-------------|--------|----------|
| **Left-rail file-tree sidebar** | 4 hr | Build a `<Sidebar />` Astro component that walks all 3 content collections and renders a collapsible tree. Persist open/closed state in localStorage. Hide on mobile, show on >= 1024px. |
| **OG social cards** | 2 hr | `astro-og-canvas` or `@vercel/og`. Generate a PNG per page at build time with doc title + ZAO branding. |
| **Last-updated + Related-docs footer** | 1 hr | Read `frontmatter.last-validated` and `frontmatter.related-docs` (comma-separated doc numbers). Render a footer block on every doc page. |
| **Farcaster cast share button** | 1 hr | A `<ShareToFarcaster />` Astro component. Click opens warpcast.com compose URL with pre-filled text + the page URL as an embed. |
| **Command palette (cmd+K)** | 4 hr | `cmdk-vercel` or generate via 21st.dev Magic MCP. Cross-doc search + quick nav. Mounted in BaseLayout. |
| **Mobile hamburger menu** | 1 hr | Replace the current wrap-on-narrow nav with a hamburger icon + slide-in drawer. |

**Sub-total: ~13 hours.** Brings the site to feature-parity with Mintlify-class docs.

### VISUAL upgrades (when ready, generated via 21st.dev Magic)

| Improvement | 21st.dev prompt | Use |
|-------------|-----------------|-----|
| **Home hero with shader** | `/ui hero section with subtle WebGL particle shader background, dark navy bg, orange + cyan accent colors, big Syne 800 headline, two CTA buttons (Read the Whitepaper / Browse Research)` | Home page top fold |
| **Vertical lineage timeline** | `/ui vertical timeline component with ~12 milestones, alternating left/right cards, color-coded by era (EOS / Fractally / Eden / Optimism Fractal / ZAO), responsive collapse on mobile` | Home page mid-section, also linkable as /lineage |
| **People cards grid** | `/ui responsive grid of people cards with photo (or initial fallback), name, role, social link icons, optional Respect score badge` | New /people page sourced from reference/11-key-people.md |
| **Contract address widget** | `/ui inline pill widget showing an Ethereum address with copy button and an Etherscan/BaseScan launch link, dark theme, monospace font` | Reused everywhere addresses appear |
| **Live Fractal counter** | `/ui small numeric counter card showing "Week 100+" with a subtle pulse animation, plus next session day/time` | Home + nav drop-down |
| **Whitepaper TOC + read-progress bar** | `/ui sticky top progress bar that fills based on scroll position, plus a sidebar TOC that auto-highlights current section` | Whitepaper draft pages specifically |
| **Citation pill** | `/ui inline citation pill that shows source name + tier (FULL / PARTIAL / FAILED) on hover with the source URL` | Every Sources section in research docs |
| **Section divider with gradient** | `/ui horizontal section divider with thin gradient line from orange to cyan, very subtle` | Between major page sections |

Most are 1-2 Magic generations each. Total 8-10 components, well within Pro tier monthly credits.

### NICE-TO-HAVE (someday)

- **Light mode toggle** - probably skip; ZAO's brand is dark.
- **i18n** - Spanish + French + Korean would mirror the Roy / Hispano / Eden Korea fractals; defer until ZAO Fractal itself goes multi-lingual.
- **Versioning** - useful when the whitepaper hits v1.0; defer until then.
- **Comments** - Giscus (GitHub Discussions backend) on whitepaper drafts so reviewers can comment in-page. Pilot when Ch.4+ drafts land.
- **PDF export** - Pandoc-based, useful for whitepaper distribution. Add once whitepaper is past v0.5.

---

## Part 5 - Path Decision

Three explicit paths:

**Path A: incremental upgrades on current Astro (RECOMMENDED).**
- Effort: 1-2 sprint days for HIGH-tier items, 2-3 for MEDIUM, then visual generates on demand.
- Risk: low. Each change is isolated.
- Outcome: branded docs site that hits 80% of Mintlify feature parity at zero monthly cost (modulo $20/mo 21st.dev Pro if used heavily).

**Path B: migrate to Starlight + apply BCZ theme.**
- Effort: 2 days to rebuild the site + 1 day to theme (Starlight's CSS variable surface is small).
- Risk: medium. Some custom things (frontmatter pills, the doc-grid home, the resources-as-inline-render) need re-architecting.
- Outcome: faster feature additions in the future (search, TOC, sidebar all built-in), but constrained design.

**Path C: stay on Mintlify (paid hosted).**
- Effort: 1-2 days to set up + content migration.
- Risk: low operationally; high on lock-in.
- Cost: $150/mo team plan minimum for branded docs.
- Outcome: polished default look, AI assistant included, but loses the ZAO brand identity.

**Recommendation: Path A.** The current custom Astro is good. Add the HIGH-tier improvements this week. Use 21st.dev Magic for visual additions when needed. Revisit Path B only if maintenance becomes painful, which it should not for a docs site.

---

## Sources

1. **[21st.dev](https://21st.dev/)** - homepage, component categories, navigation - [FULL]
2. **[21st.dev Magic MCP](https://21st.dev/magic)** - AI component generator, pricing, IDE integrations - [FULL]
3. **[Starlight](https://starlight.astro.build/)** - Astro's docs framework, built-in features, theming - [FULL]
4. **[Mintlify homepage](https://mintlify.com/)** - hosted SaaS docs platform - [PARTIAL: homepage describes positioning but not concrete UI; cross-referenced against Anthropic docs which uses Mintlify]
5. **[Vercel docs](https://vercel.com/docs)** - reference for hierarchy + quick-references block pattern - [FULL]
6. **[docsio Starlight review 2026](https://docsio.co/blog/starlight-docs)** - independent Starlight review, MIT licensing, build performance, hosting options - [FULL]
7. **[PkgPulse - Best Documentation Frameworks 2026](https://www.pkgpulse.com/guides/best-documentation-frameworks-2026)** - cross-framework comparison (Docusaurus, VitePress, Starlight, Nextra) - [FULL]
8. **[Pagefind](https://pagefind.app)** - the static-search library recommended in this doc - [PARTIAL: referenced from prior research]
9. **[Astro Shiki transformers](https://shiki.style/packages/transformers)** - the code-block copy button package - [PARTIAL]
10. **[Doc 740 - HTML vs Markdown for publishing ZAO documentation](../740-html-vs-markdown-publishing/README.md)** - sister decision (already shipped May 24) - [FULL]

---

## Also See

- [Doc 740](../../dev-workflows/740-html-vs-markdown-publishing/) - the prior decision that landed us on Astro for ZAOfractal
- [Doc 728](../728-serena-mcp-zao-integration/) - MCP-server integration pattern (relevant to 21st.dev Magic MCP install)
- [Doc 722](../../dev-workflows/722-zao-claude-code-3-month-synthesis/) - the broader ZAO documentation methodology

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve Path A (incremental on current Astro) and the HIGH-tier improvement list | @Zaal | Decision | Before any code change |
| Ship HIGH-tier batch (search + TOC + breadcrumbs + prev/next + code copy + contract address links) | @Claude | Build | This week |
| Install 21st.dev Magic MCP into Claude Code MCP config (free tier OK to start) | @Zaal or @Claude | Infra | Before visual work begins |
| Generate hero shader + lineage timeline + people cards + contract widget via Magic | @Claude | Build | Sprint after HIGH ships |
| Ship MEDIUM-tier batch (sidebar + OG cards + last-updated + share + cmd+K + hamburger) | @Claude | Build | Following sprint |
| Add fractal.thezao.com DNS to Vercel project + redirect zaofractal.vercel.app | @Zaal | Infra | Whenever the brand subdomain is ready |
| Re-validate this doc | @Zaal or @Claude | Doc update | Every 4-6 weeks (UI patterns churn fast) |

---

## Research Metadata

| Attribute | Value |
|-----------|-------|
| **Last validated** | 2026-05-25 |
| **Sources consulted** | 10 (6 FULL, 4 PARTIAL) |
| **Tier** | STANDARD |
| **Decision posture** | Recommendation: keep custom Astro, add HIGH-tier features this week, use 21st.dev Magic for visual additions. Recommendation strength: HIGH. |
| **Honest UNKNOWNs** | (1) Mintlify's homepage marketing copy did not let us infer specific UI details; cross-referenced against Anthropic docs site which uses Mintlify. (2) 21st.dev component license / commercial-use details not fully verified for the marketplace (only Magic-generated code is explicitly license-free). Confirm before integrating any marketplace component into a public production site. |
