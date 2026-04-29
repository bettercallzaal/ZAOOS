---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-04-29
related-docs: 549, 549b, 549c, 549d, 549e
tier: STANDARD
---

# 549a - 21st.dev Catalog Inventory

> **Goal:** Map what's actually in the 21st.dev component marketplace so a ZAO contributor knows where to look first instead of guessing prompts.

## Categories Visible from Landing (2026-04-29)

| Category | Direct ZAO surface fit | Likely use |
|---|---|---|
| Shaders | High | ZAO landing animated background, ZAO Stock hero, ZOUNZ visualiser |
| Heroes | Highest | ZAO Stock landing, BCZ portfolio, `/stake` page refresh |
| Features | Medium | ZAO Stock "what you get as sponsor" sections |
| AI Chat Components | Highest | ZOE chat shell, ZAO OS in-app chat surfaces, FISHBOWLZ-replacement Juke embed |
| Calls to Action | High | ZAO Stock RSVP, ZABAL stake CTA, POIDH bounty submit |
| Buttons | Medium | Brand-token-aware refresh of `src/components/ui/button.tsx` |
| Testimonials | High | ZAO Stock sponsor logos, BCZ social proof |
| Pricing Sections | Highest | ZAO Stock sponsor tiers, BCZ service tiers, ZAO Music drop tiers |
| Text Components | Low | Animated copy on landing pages |

> Categories pulled from landing page navigation. Treat as "at least these," not "only these." More may exist behind login + scroll.

## Engagement Signal (Top Components Visible on Landing)

Top-listed items showed engagement scores 275, 265, 236 (likes/views, exact metric not labelled). Components attributed to community contributors visible by username: `easemize`, `kokonutd`, `jatin-yadav05`, `isaiahbjork`. Pattern matches a community marketplace, not a small in-house catalog.

## Total Catalog Size (Inferred)

Marketplace messaging across PulseMCP / Glama / official docs uses "thousands of components" verbatim. Free `21st_magic_component_inspiration` semantic search is the discovery primitive - a component count number was not posted on 2026-04-29.

For decision-making, treat catalog size as: **large enough that semantic search is the right primitive; do not try to build a manual index.**

## How to Browse Without Login

Public read at `https://21st.dev/community/components/`. Login required for: publishing, liking, saving collections. Code copy works without login on most components.

The MCP `21st_magic_component_inspiration` tool requires an API key, regardless of whether the component is free to view.

## ZAO-Targeted Browse Plan

When you sit down to design a ZAO surface, query in this order:

1. **Inspiration Search via MCP** (free) - `inspiration: "ZAOstock sponsor pricing tiers, festival aesthetic, dark navy + gold"`. Skim 10 returned components.
2. **Open top 3 in browser** at `21st.dev/community/components/<slug>` to read code + see live demo.
3. **Decide:** lift code directly (free, attribution per 549c), refine via `21st_magic_component_refiner` (Pro), or generate fresh variants via `21st_magic_component_builder` (Pro).
4. **Adapt** in ZAO repo: swap brand tokens (`#0a1628`, `#f5a623`), import `cn` from `@/lib/utils`, ensure `"use client"` if hooks/handlers, mobile-first responsive prefixes per `.claude/rules/components.md`.

The `/21st` skill in [549e](../549e-21st-dev-zao-skill-spec/) automates steps 1 + 4.

## Categories We Will NOT Use

- Generic SaaS dashboard chrome - ZAO design language is darker / more music-festival than admin-saas. Filter heroic results that look like Stripe / Vercel clones unless explicitly remixed.
- Light-theme-first components - ZAO is dark-default per `community.config.ts`.
- Desktop-first layouts - ZAO is mobile-first.

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| First Inspiration Search query for `/stake` hero | Zaal | Spike via Claude Code MCP | This week |
| Save 5 favourite contributor handles to `~/.claude/projects/.../memory/project_21st_signals.md` | Auto via skill | Memory | After 1st spike |
| Build internal "ZAO-fit / not-fit" tag during browse so we don't re-evaluate same components | Zaal | Memory or local notes | Ongoing |

## Sources

- [21st.dev community catalog](https://21st.dev/community)
- [21st.dev landing](https://21st.dev/home)
- [PulseMCP listing](https://www.pulsemcp.com/servers/21st-dev-magic) - "thousands of components" claim

## Staleness Notes

Categories list pulled from landing nav 2026-04-29. Engagement scores are point-in-time. Re-validate with skill in production use after 1st month.
