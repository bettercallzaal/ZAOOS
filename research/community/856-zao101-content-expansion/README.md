---
topic: community
type: guide
status: research-complete
last-validated: 2026-06-16
superseded-by:
related-docs: 839, 842, 854
original-query: "zao 101 is very behind on info. /zao-research more about what we can add and include. Plus: fix the org-chart UI on the page + add an on-page copy button; reposition ZABAL as an incubated project; capture the accountability/contribution model (self-defined commitment, two-per-task main+understudy, check-ins) and the ZAOstock-bot DM-only fix."
tier: STANDARD
---

# 856 — ZAO 101: Content Expansion + Org/Accountability Model

> **Goal:** zao-101 is thin (lots of placeholders). Decide what to add so a stranger lands, understands The ZAO, and knows exactly how to plug in - and capture the brand-model + accountability decisions Zaal made on 2026-06-16 so they become page content, not lost chat.

## Key Decisions (do this)

| # | Decision | Surface |
|---|----------|---------|
| 1 | **Reposition ZABAL as an INCUBATED PROJECT** that grows The ZAO (alongside WaveWarZ, ZAO Festivals) - NOT a separate "internal toolstack" tier. The ZAO is always the lead brand; ZABAL is a project that brings builders in to grow The ZAO. | org page + ecosystem + zabal-games page |
| 2 | **Add an on-page copy button** to the plain-text org chart (so a visitor copies the chart in one click, like the clipboard does) + a real UI pass on the org chart (the current render is a weak copy-paste block) | zao-101 `/org` |
| 3 | **Add the accountability + contribution model** as real content (below) - this is Fellenz challenge 8, made concrete | zao-101 `/join` |
| 4 | **Strengthen the entry point** - what's behind "Start here" so a newcomer hits a real next step, not a wall | zao-101 `/join` |
| 5 | **Fill the thin placeholders** + add a getting-started/resource layer (best practice) | zao-101 `/pillars`, `/faq`, `/join` |
| 6 | **ZAOstock bot: DM-only.** Turn OFF its sharing messages in the group; it posts only in DM. No daily digest for now (Zaal: leave it out). | ZAOstock bot (infra, not zao-101) |

## The accountability + contribution model (Zaal, 2026-06-16) - challenge 8

This is the volunteer/commitment model Fellenz said was the hardest and Zaal had skipped. Now defined:

1. **Self-defined commitment.** A volunteer tells Zaal what they want to commit to - whether that's 1 hour a week, 10, or undefined - by **taking on a specific task or role** and taking responsibility for it. They check in with Zaal, and use Zaal for resources/help/unblocking. The commitment is theirs to set, but they must actually hit it.
2. **Two people per task (main + understudy).** Every task has a main owner AND an understudy. The understudy is someone the main person can rely on - they can bother the main, report back if the main needs help, or step in and complete it if the main isn't delivering. This is the resilience + accountability mechanism (no single point of silence).
3. **A place to log contributions.** A surface where team members add their contributions - lightweight, likely a Telegram space where people talk and share. (No heavyweight tracker mandated; the point is visibility of who-did-what.)

This model belongs on the `/join` page as "How committing works" - it answers "what am I signing up for" honestly.

## Findings - what a strong onboarding hub includes (best practice + ZAO gaps)

Best-practice for a 2026 community/DAO onboarding hub (sources below):
- A dedicated **"getting started" space** as the central hub - profile setup, rules, etiquette, a resource library.
- Categorize by need: **social safety** (a human welcome), **platform literacy** (quick-start guides), **immediate value** (point newcomers at high-value resources + people like them).
- "Members who find it **very easy to get involved** report significantly higher engagement." Ease of entry is the metric.
- DAO-specific: good docs build context fast and kill newcomer uncertainty. IndexCoop's Community Handbook is the cited gold standard - it walks a new contributor through org structure first.

zao-101 today (7 pages: home, pillars, org, ecosystem, zabal-games, join, faq) has the skeleton but is thin: placeholders remain for fractal mechanics, OREC, music embeds, a fork example, and the join page lacks the commitment model + a real first-task path.

### Content to add, page by page

- **`/join` (highest priority - the entry point):**
  - Keep "Start here," but make what's behind it real: a clear **first action** (a specific starter task or "tell me what you want to own"), then the **commitment model** above (self-defined commitment, two-per-task, check-ins), then how to log contributions.
  - A human welcome line (social safety), not just links.
- **`/org`:** UI pass on the chart + on-page copy button; reposition ZABAL as an incubated project.
- **`/pillars`:** fill the operating-system tools placeholder (frame ZABAL as the incubated builder project, not the umbrella); keep the 4-pillars structure.
- **`/faq`:** add the IndexCoop-style basics - "how does committing work," "what's the Respect/fractal thing" (fill the fractal placeholder), "is this a label," "how do I contribute," "what's ZABAL vs The ZAO."
- **Resource layer:** a small "resources / links" pointer (or lean on `/ecosystem` + ZAO NEXUS) so a newcomer can self-serve.

### Pull from the NEXUS + ZAO OS (content sources zao-101 should surface)

zao-101 doesn't need to invent content - two live ZAO surfaces already hold it:

- **ZAO NEXUS** (`zaonexus.vercel.app`, repo `bettercallzaal/zaonexus`, v1.4.0) - the **canonical link hub: 474 curated links across 9 categories + 44 ecosystem brands**, split into two routes: `/community` (member-facing: holder resources, internal tools, governance) and `/ecosystem` (external: brand pages, projects, partners). This IS the "resource library" the best practices call for. zao-101 should **point newcomers to NEXUS** as "where to find everything" rather than duplicate links. The two-audience split (community vs ecosystem) also mirrors zao-101's own org model.
- **ZAO OS** (`zaoos.com`, repo `bettercallzaal/zaoos`) - "The ZAO ecosystem **lab**. Where new things get prototyped before earning their own home." Next.js 16 + Supabase + Farcaster + XMTP, **MIT / forkable** (has a FORK.md), with the research library. This is the content for zao-101's **"what is The ZAO" + the Open Source pillar**: the **monorepo-as-lab + graduation model** (a project graduates to its own repo/domain when public-ready) is core ZAO identity and currently missing from the explainer. Discord at `discord.thezao.com`.

Concrete adds for zao-101 from these:
- A "Find everything" link to ZAO NEXUS on `/join` and `/ecosystem`.
- Explain the **lab + graduation model** on `/pillars` (Open Source pillar) - prototyped here, graduates out, research stays forever.
- Reference the live app (`zaoos.com`) + Discord (`discord.thezao.com`) as real destinations behind the entry point.

## Also See

- [Doc 839](../../events/839-fellenz-brand-org-strategy/) - the Fellenz critique driving this (challenges 6, 7, 8)
- [Doc 842](../../business/842-zao-org-chart-brand-hierarchy/) - org chart (update: ZABAL is an incubated project, not a toolstack tier)
- [Doc 854](../../wavewarz/854-wavewarz-24h-protocol-engagement-engine/) - WaveWarZ as the fan door (paired with ZABAL Games builder door)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| zao-101: org `/org` UI pass + on-page copy button + reposition ZABAL as incubated project | Zaal (CC terminal) | PR | Next |
| zao-101: rebuild `/join` - real first action + commitment model + two-per-task + contribution logging | Zaal (CC terminal) | PR | Next |
| zao-101: fill `/faq` + `/pillars` placeholders (commit model, fractal, ZABAL-vs-ZAO) | Zaal (CC terminal) | PR | After |
| Update doc 842 org chart: ZABAL = incubated project (not toolstack tier) | Zaal | Doc edit | Next |
| ZAOstock bot: turn OFF group sharing messages, DM-only (no digest) | Zaal / Iman | Infra | Next |
| Reflect the commitment model + two-per-task back to Fellenz as the challenge-8 answer | Zaal | Comms | When replying |

## Sources

- [How to Effectively Onboard New Contributors - A Guide for DAOs (StableNode, Medium)](https://medium.com/stablenode-blog/how-to-effectively-onboard-new-contributors-a-guide-for-daos-c125370e72d3) `[PARTIAL - search synthesis; IndexCoop Community Handbook cited as the model]`
- [Onboarding Community Members: Best practices + Step-by-step (Bettermode)](https://bettermode.com/hub/articles/post/onboarding-community-members-best-practices-step-by-step-guide-HgsPFbgD9uCgJws) `[PARTIAL - search synthesis; getting-started hub + resource library]`
- [9 User Onboarding Best Practices for 2026 (Formbricks)](https://formbricks.com/blog/user-onboarding-best-practices) `[PARTIAL - search synthesis; ease-of-entry = engagement metric]`
- Zaal decisions, 2026-06-16 (this session) `[FULL]` - org-model reposition + accountability model + ZAOstock-bot DM-only
- [ZAO NEXUS repo (bettercallzaal/zaonexus)](https://github.com/bettercallzaal/zaonexus) `[FULL]` - canonical link hub, 474 links / 9 categories / 44 brands, /community + /ecosystem routes; live `zaonexus.vercel.app`
- [ZAO OS repo (bettercallzaal/zaoos)](https://github.com/bettercallzaal/zaoos) `[FULL]` - the lab framing, MIT/forkable, graduation model, research library; live `zaoos.com`
