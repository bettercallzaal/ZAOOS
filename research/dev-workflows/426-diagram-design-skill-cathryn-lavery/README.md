# 426 — diagram-design Skill (Cathryn Lavery)

> **Status:** Research complete
> **Date:** 2026-04-17
> **Goal:** Evaluate Cathryn Lavery's `diagram-design` Claude skill (13 editorial diagram types, HTML+SVG, self-contained) for ZAO OS research visuals, whitepaper, newsletter, and ZAO Stock docs.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Install | **INSTALL today** — `git clone git@github.com:cathrynlavery/diagram-design.git ~/.claude/skills/diagram-design`, restart Claude Code. 19 stars, HTML/SVG only, no build step. |
| Onboard to ZAO brand | **RUN "onboard diagram-design to https://zao.energy"** (or our canonical site) on first use — it fetches homepage, extracts palette + fonts, writes `references/style-guide.md`. Fallback manual tokens: paper `#0a1628` (navy), ink `#f5f4ed`, accent `#f5a623` (gold), muted `#94a3b8`. |
| Primary use | **USE for research doc headers, whitepaper (doc 051), ZAO OS architecture docs, ZAO Stock ops diagrams, WaveWarZ flow, ZABAL agent swarm visuals** — replaces Mermaid and napkin screenshots. |
| Pair with HyperFrames | **CHAIN: diagram-design (static HTML) → HyperFrames (doc 420) for animated MP4** — same design tokens, both agent-native. Diagrams for docs, animated versions for socials. |
| Skip | **DO NOT replace `/graphify`** (knowledge-graph skill) — different use case. `/graphify` = data-driven clusters, `diagram-design` = hand-crafted editorial. |
| Density rule | **HOLD the 4/10 target density** — 9 nodes max, 12 arrows max, 2 coral/gold accents max per diagram. Split if exceeded. |
| Grid rule | **ENFORCE 4px grid on all ZAO diagrams** — non-negotiable per spec. No coord ending in 1/2/3/5/6/7/9. |
| Font policy | **STICK with author's stack (Instrument Serif + Geist sans + Geist Mono) for v1** — match ZAO brand font later via onboarding. Don't use JetBrains Mono anywhere. |
| Cathryn's example | **NOTE** she shipped a diagram of Garry Tan's stack that maps EXACTLY to the gstack skills (`/office-hours`, `/plan-ceo`, `/autoplan`, `/review`, `/qa`, `/ship`, `/retro`) — ZAO already runs these. Perfect diagram template for ZAO's own workflow. |
| Outreach | **REPLY on X** — Cathryn (@cathrynlavery, BestSelf.co, littlemight.com). Share ZAO first diagram back. Low-friction intro. |
| First 5 ZAO diagrams to ship | 1) ZAO OS architecture (current state), 2) ZAO Stock ops swimlane, 3) WaveWarZ battle flow, 4) ZABAL agent swarm tree (VAULT/BANKER/DEALER/ZOE/HERALD/FLIPPER), 5) ZAO whitepaper 4-pillars Venn. |

---

## What the Skill Is

| Dimension | Detail |
|-----------|--------|
| Author | Cathryn Lavery (@cathrynlavery) — founder BestSelf.co, writes littlemight.com |
| Repo | https://github.com/cathrynlavery/diagram-design |
| Stars / Forks | 19 / 1 (new) |
| License | (repo-default; check before commercial redistribution) |
| Tech | HTML + SVG, embedded CSS, zero JS, Google Fonts external only |
| Variants | Minimal light (warm paper) · Minimal dark · Full editorial · Sketchy (hand-drawn filter overlay) |
| Architecture | Progressive disclosure — `SKILL.md` is a lean index, per-type references loaded only when matched |
| Install | `git clone git@github.com:cathrynlavery/diagram-design.git ~/.claude/skills/diagram-design` |
| Onboarding | `onboard diagram-design to https://yoursite.com` → extracts palette + fonts → writes `references/style-guide.md` |
| First-run gate | Pauses on first use in a project if style-guide is still default |

### 13 Diagram Types

| Type | Content | Max items |
|------|---------|-----------|
| Architecture | Components + connections | 9 nodes |
| Flowchart | Decision logic | 9 nodes |
| Sequence | Time-ordered messages | 5 lifelines |
| State machine | States + transitions | 12 transitions |
| ER / data model | Entities + fields | 8 entities |
| Timeline | Events on an axis | — |
| Swimlane | Cross-functional flow | 5 lanes |
| Quadrant | Two-axis positioning | 12 items |
| Nested | Hierarchy by containment | 6 levels |
| Tree | Parent → children | 4 deep |
| Layer stack | Stacked abstractions | 6 layers |
| Venn | Set overlap | 3 circles |
| Pyramid / funnel | Ranked / drop-off | 6 layers |

### Primitives

- **Annotation** — italic Instrument Serif + dashed Bézier leader, for editorial asides
- **Sketchy filter** — SVG turbulence + displacement, hand-drawn variant

---

## Design System (enforce on all ZAO diagrams)

### Typography
- Title: Instrument Serif, 1.75rem, 400, H1 only
- Node names: Geist sans, 12px, 600
- Sublabels: Geist Mono, 9px (ports, URLs, field types only)
- Arrow labels: Geist Mono, 8px, uppercase
- Callouts: *italic* Instrument Serif 14px

### Color roles (mapped to ZAO brand)
| Semantic | ZAO value |
|----------|-----------|
| paper | `#0a1628` (navy) or `#faf7f2` (light variant) |
| ink | `#f5f4ed` (on navy) or `#1c1917` (on light) |
| muted | `#94a3b8` |
| accent | `#f5a623` (ZAO gold) |
| link | `#60a5fa` |

### Hard rules
- ≤ 2 accent-highlighted nodes per diagram
- Every arrow label masked by opaque rect (no bleed-through)
- Arrows drawn before boxes (z-order)
- No dark mode + cyan/purple glow
- No identical boxes for every node
- Max border-radius 10px
- No box-shadows, use 1px borders
- All sizes + coords divisible by 4

### Complexity budget (per diagram)
- Nodes ≤ 9, Arrows ≤ 12, Accent nodes ≤ 2, Callouts ≤ 2.
- Exceed = split into overview + detail.

---

## Comparison — Diagramming Tools for ZAO

| Tool | Output | Brand-aware? | Agent-native? | ZAO fit |
|------|--------|--------------|---------------|---------|
| **diagram-design (this doc)** | Self-contained HTML+SVG | Yes (reads site) | Yes (Claude skill) | **Primary** — docs, whitepaper, research headers |
| **HyperFrames** (doc 420) | MP4/MOV/WebM animated | Yes (via ZAO templates) | Yes | **Pair** — animate the same tokens |
| **Mermaid** | SVG (markdown) | No | Partial | Keep for quick GitHub/wiki auto-diagrams only |
| **`/graphify` skill** | Knowledge graph HTML+JSON | No | Yes | Keep for data-driven cluster views (different job) |
| **`/omm-scan`** (oh-my-mermaid) | Mermaid library | No | Yes | Keep for architecture scan automation |
| **Excalidraw** | PNG/SVG | No | No | Skip for ZAO docs (too loose) |
| **Figma** | Any | Yes | No | Keep for UI/marketing, not docs |

**Slot diagram-design into `/docs` pipeline first. Layer HyperFrames for motion.**

---

## ZAO Ecosystem Integration

### Files / surfaces

- `~/.claude/skills/diagram-design/` — install location
- `~/.claude/skills/diagram-design/references/style-guide.md` — ZAO brand tokens live here after onboarding
- `research/CLAUDE.md` (doc 424 plan) — note diagram-design conventions for research headers
- `research/_diagrams/` — optional shared output folder (or co-locate each diagram with its doc)
- Per-doc: `research/<topic>/<num>-<slug>/diagram.html` — self-contained, committed with the doc
- Whitepaper (doc 051): swap Mermaid/static images for `diagram-design` outputs
- ZAO OS `public/diagrams/` — ship HTML diagrams as embeddable assets for the site

### First 5 ZAO diagrams (priority order)

| # | Diagram | Type | Source doc |
|---|---------|------|-----------|
| 1 | ZAO OS current architecture | Architecture | `CLAUDE.md`, `src/` map |
| 2 | ZAO Stock Oct-3 ops | Swimlane | doc 274 + 363 |
| 3 | WaveWarZ battle flow | Sequence | doc 101 + 423 |
| 4 | ZABAL agent swarm | Tree | doc 345 (canonical master) |
| 5 | ZAO 4 pillars (Artist Org / Autonomous Org / Operating System / Open Source) | Venn | project_four_pillars memory |

### Cross-doc alignment

- [doc 420 HyperFrames](../../agents/420-hyperframes-html-video-agents/) — use same tokens, animate diagrams
- [doc 422 Claude Routines](../422-claude-routines-zao-automation-stack/) — build `weekly-diagram-refresh` routine that regenerates all 5 diagrams from latest research every Monday
- [doc 424 Nested CLAUDE.md](../424-nested-claudemd-claudesidian-wrap-pattern/) — document diagram-design conventions per subtree CLAUDE.md
- [doc 297 `/graphify`](../297-graphify-knowledge-graph-codebase/) — complementary, not competing
- [doc 414 AI-Native Documentation Patterns](../414-ai-native-documentation-patterns/) — diagrams are the visual layer of llms.txt / AGENTS.md docs

### Newsletter + socials hook

- Each "Year of the ZABAL" newsletter post can ship with 1 diagram generated from the day's theme.
- `/socials` skill cross-post includes the diagram as a hero image — replace stock screenshots.
- HyperFrames animates the same diagram for 9:16 short.

---

## Garry Tan / gstack Validation

Cathryn shipped a diagram mapping Garry Tan's workflow: `Think → Plan → Build → Review → Test → Ship → Reflect`, with commands `/office-hours → /plan-ceo → /autoplan → /review → /qa → /ship → /retro`.

**ZAO already runs every one of those skills** (see `~/.claude/skills/`). That diagram IS the ZAO workflow. Regenerate with ZAO brand as the first onboarded output — instant brand-congruent doc asset.

---

## Outreach Plan

| Step | Action |
|------|--------|
| 1 | Install + onboard to ZAO brand |
| 2 | Ship the Garry-Tan-style diagram re-skinned for ZAO workflow |
| 3 | Reply to Cathryn on X with the ZAO version |
| 4 | Ask: interest in building a music/creator-community variant pack? |
| 5 | Cross-mention in newsletter (Year of the ZABAL) — credit Cathryn + link |

---

## Sources

- [@cathrynlavery diagram-design repo](https://github.com/cathrynlavery/diagram-design)
- [Cathryn Lavery — littlemight.com (blog + newsletter)](https://littlemight.com)
- [BestSelf.co — Cathryn's company](https://bestself.co)
- [diagram-design SKILL.md (full spec)](https://github.com/cathrynlavery/diagram-design/blob/main/SKILL.md)
- [Companion — doc 420 HyperFrames (agent video)](../../agents/420-hyperframes-html-video-agents/README.md)
- [Companion — doc 422 Claude Routines](../422-claude-routines-zao-automation-stack/README.md)
- [Companion — doc 424 Nested CLAUDE.md + `/wrap`](../424-nested-claudemd-claudesidian-wrap-pattern/README.md)
- [Companion — doc 297 `/graphify` knowledge graph](../297-graphify-knowledge-graph-codebase/README.md)
- [Companion — doc 414 AI-native documentation patterns](../414-ai-native-documentation-patterns/README.md)
- [Companion — doc 154 Skills + commands master reference](../154-skills-commands-master-reference/README.md)
- [Companion — doc 051 ZAO whitepaper 2026](../../community/051-zao-whitepaper-2026/README.md)
- [Companion — doc 345 ZABAL agent swarm master blueprint](../../agents/345-zabal-agent-swarm-master-blueprint/README.md)
