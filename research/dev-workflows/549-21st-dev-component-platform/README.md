---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-20
related-docs: 173, 250, 349, 489, 508, 548, 549a, 549b, 549c, 549d, 549e
tier: DISPATCH
original-query: "How should ZAO use 21st.dev for component generation in UI projects? (reconstructed)"
---

# 549 - 21st.dev Hub: Component Platform + Magic MCP + 1code

> **Goal:** Decide how ZAO uses 21st.dev (components marketplace + Magic MCP + 1code agent orchestration) for ZAO OS UI, ZAO Stock site, BetterCallZaal, FISHBOWLZ-replacement, and the broader ZAO website surface. Spec a `/21st` skill the team can drop into Claude Code today.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Install Magic MCP today on Zaal's main Claude Code | **YES, NOW** | MIT, 4,888 stars (2026-05-20), 100 free credits/mo. Two free tools (`21st_magic_component_inspiration` semantic search, `logo_search` brand SVG via svgl) cost zero credits and replace 80% of "find me a hero / CTA / pricing card" prompts. One-line install: `npx @21st-dev/cli@latest install claude --api-key <key>`. YC-backed (Winter 2026 batch). |
| Pay $20/mo Pro (Magic Generate) for active design phases | **YES, BUT TURN ON/OFF MONTHLY** | Pro unlocks 400 credits/mo for `21st_magic_component_builder` (5 polished variants) + `21st_magic_component_refiner` (iterate). Worth it during ZAOstock site build, ZAO OS visual refresh, BCZ portfolio refresh. Pause months when no UI work. |
| Skip Max ($100/mo) for now | **YES, SKIP** | Max tier: 2000 credits/mo + site cloning + early access. Not worth 5x cost until we have a specific reference site to clone. Re-evaluate when ZAO Stock visual brief lands. |
| Build a `/21st` skill in `~/.claude/skills/21st/` so any session can search + lift components | **YES, SHIPPING TODAY (Doc 549e)** | The skill wraps the MCP tools with ZAO context: stack-aware (Next 16, React 19, Tailwind v4), brand-token-aware (#0a1628 navy, #f5a623 gold), repo-rule-aware (Biome, Vitest, no inline styles, mobile-first). See [549e](../549e-21st-dev-zao-skill-spec/). |
| Use 21st components on the ZAO website (zaoos.com / thezao.com) and ZAO Stock site | **YES, SELECTIVE** | Concrete first targets: `/stake` hero refresh, ZAO Stock landing hero + ticket-tier pricing card, FISHBOWLZ-replacement audio room CTA, ZOE chat shell upgrade. Categories that fit: Heroes, Pricing Sections, AI Chat Components, Calls to Action, Shaders, Testimonials. |
| Add 21st Inspiration Search to ZAO website itself (in-browser component picker for community contributors) | **DEFER** | Tempting but premature. Internal team can use the MCP for now. If ZAO ever runs a public "build a Frapp" workflow, revisit - the SDK + agent-elements would let us embed search in the contributor flow. See [549d](../549d-21st-dev-ai-features-magic/). |
| Track `1code` (5,532 stars - rising fast) - 21st-dev's "orchestration layer for Claude Code + Codex" | **YES, TRACK** | Stars jumped past `magic-mcp` (5,532 vs 4,888). Likely overlaps with QuadWork. Park for separate research once Lazer spike (Doc 548) closes. Monitor monthly. |
| Treat 21st as a primary, ahead of Aceternity / MagicUI / OriginUI / shadcn-ui-mcp-server / shadcn studio | **YES, FOR ZAO** | Magic MCP is the only one bundling: free semantic search across an aggregator-scale catalog + free brand-icon search via svgl + paid generation in the same install. Other registries are read-only catalogs. See [549b](../549b-21st-dev-access-patterns/). |
| Replace existing UI patterns in `src/components/` wholesale with 21st generations | **NO** | Mobile-first dark theme already locked. Use 21st for **new** surfaces and refreshes, not retrofits. Per project rule: "edit existing files; don't rewrite for the sake of fashion." |

## What 21st.dev Actually Is (Three-Layer Cake)

Not a single product - three overlapping things under one brand:

### Layer 1 - Component Marketplace (`21st.dev/community`, free read access)

Community-published UI components. Categories visible on landing: **Shaders, Heroes, Features, AI Chat Components, Calls to Action, Buttons, Testimonials, Pricing Sections, Text Components**. Engagement metrics shown on each component (likes/views: top items at 275, 265, 236).

### Layer 2 - Magic MCP (open-source MIT, paid API tier)

`github.com/21st-dev/magic-mcp` - 4,888 stars (2026-05-20), MIT, TS, last commit 2026-05-21. Exposes 4 tools to any MCP-aware IDE:

| Tool | What it does | Cost |
|---|---|---|
| `21st_magic_component_inspiration` | Semantic search across the marketplace | **Free, unlimited** |
| `logo_search` | Brand SVG search via svgl | **Free, unlimited** |
| `21st_magic_component_builder` | Generate 5 polished variants from a description | **Free 100 credits/mo OR Pro $20/mo 400 credits** |
| `21st_magic_component_refiner` | Iterate on a generated/existing component | **Free 100 credits/mo OR Pro $20/mo 400 credits** |

API responses are sub-100ms per published reviews. Install via `@21st-dev/cli` for Claude Code / Cursor / Windsurf / Cline. VS Code via README badge or manual MCP block.

### Layer 3 - Agent Infrastructure (`1code`, `21st-sdk`, `agent-elements`, `21st-extension`)

Separate product surface, same org:

- **`1code`** - 5,532 stars (2026-05-20) - "Orchestration layer for coding agents (Claude Code, Codex)." Stars rising fast; likely a competitor / alternative to ZAO's QuadWork pattern. Park for separate research.
- **`21st-sdk`** - 107 stars - SDK for embedding 21st features in apps. Has `21st-sdk-examples` cookbook (35 stars).
- **`agent-elements`** - 50 stars - drop-in agent-UX components. Possible fit for ZOE chat shell upgrade.
- **`21st-extension`** - 133 stars - browser extension.

Big picture: 21st-dev is becoming a full agent-tooling company, not just a component shop.

## Pricing (Official 21st.dev, confirmed 2026-05-20)

| Tier | $/mo | Credits/mo | Inspiration | Logo Search | Site Clone | Early Access |
|---|---|---|---|---|---|---|
| Free | $0 | 100 | Unlimited | Unlimited | No | No |
| Pro | $20 | 400 | Unlimited | Unlimited | **Yes** | No |
| Max | $100 | 2000 | Unlimited | Unlimited | Yes | **Yes** |

RESOLVED: Free tier is 100 credits/month (not 5 requests). Official `/magic` page confirms, cleared by May 20 fetch. Pro adds site cloning. Annual pricing not exposed. No team/enterprise tier documented.

## ZAO-Specific Recommendations (Concrete)

| Surface | Today's state | 21st action | Tier needed |
|---|---|---|---|
| `/stake` hero | Plain card, no chart | Search "staking dashboard hero with token chart" via free Inspiration; pair with Codex client lift from Doc 548 | Free |
| ZAO Stock landing | Doesn't exist yet | Generate hero + pricing-tier card for sponsor tiers via Magic Generate (100 free credits covers ~2-3 generates) | Free or Pro |
| ZAO Stock ticket page | Doesn't exist yet | Generate festival-style ticket card (tier + price + benefits) | Free or Pro |
| ZOE chat shell (zoe.zaoos.com) | Custom Telegram-style | Lift from "AI Chat Components" category for upgraded message bubbles + suggestions | Free (search) -> Free (100 credits refine if needed) |
| FISHBOWLZ-replacement audio CTA | Paused per `project_fishbowlz_deprecated`; if Juke partnership needs an embed | Search "audio room CTA card" | Free |
| BCZ portfolio (bettercallzaal.com) | Static HTML | Generate refreshed hero + testimonial section + service-tier pricing | Free (100 credits) or Pro |
| `community.config.ts` brand tokens | Locked at navy `#0a1628` + gold `#f5a623` | Pass to Magic Generate via skill prompt; check output respects them | n/a |
| ZOUNZ landing | TBD | Defer; not active | n/a |

## Sub-Documents

- **[549a - Catalog & Inventory](../549a-21st-dev-catalog-inventory/)** - what categories exist, contributor names captured, what fits ZAO's UI surface
- **[549b - Access Patterns](../549b-21st-dev-access-patterns/)** - MCP install, tools surface, alternatives (shadcn-ui-mcp-server, shadcn studio), why pick 21st
- **[549c - Pricing & Licensing](../549c-21st-dev-pricing-licensing/)** - quota reality check, license per generated component, redistribution rules
- **[549d - AI Features (Magic + 1code + SDK)](../549d-21st-dev-ai-features-magic/)** - what each Magic tool does, when to reach for each, how 1code overlaps with QuadWork
- **[549e - `/21st` Skill Spec](../549e-21st-dev-zao-skill-spec/)** - drop-in `SKILL.md` ready to copy to `~/.claude/skills/21st/`

## Hard Numbers (Verified 2026-05-20)

| Metric | Value | Source |
|---|---|---|
| `21st-dev/magic-mcp` stars | 4,888 | `gh api repos/21st-dev/magic-mcp` (2026-05-20) |
| `21st-dev/magic-mcp` forks | 340 | same |
| `21st-dev/magic-mcp` license | MIT | repo metadata |
| `21st-dev/magic-mcp` last update | 2026-05-21 01:17 UTC | same |
| `1code` stars | 5,532 | `gh api repos/21st-dev/1code` (2026-05-20) |
| `1code` growth | +38 stars vs April | 5,494 -> 5,532 in 3 weeks; trending up |
| `21st-sdk` stars | 107 | `gh api orgs/21st-dev/repos` |
| `agent-elements` stars | 50 | same |
| `21st-extension` stars | 133 | same |
| Tools per MCP install | 4 | `magic-mcp` README |
| Free credits/month | 100 | Official `/magic` page (2026-05-20) |
| Pro price | $20/mo for 400 credits | Official pricing (CONFIRMED, not $10) |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Install Magic MCP via `npx @21st-dev/cli@latest install claude --api-key <key>` on Zaal's machine | Zaal | One-shot | This week |
| Drop `/21st` skill from [549e](../549e-21st-dev-zao-skill-spec/) into `~/.claude/skills/21st/SKILL.md` | Zaal | One-shot | This week |
| Test on `/stake` hero refresh - free Inspiration Search only, no Pro yet | Zaal in ZAO OS V1 | Spike PR | This week |
| Decide Pro $20 toggle for ZAO Stock site sprint | Zaal | Subscription decision | When ZAO Stock visual brief lands |
| Open separate research doc on `1code` (5,494 stars) - compare to QuadWork | n/a | Research doc | After Lazer spike (Doc 548) closes |
| Re-validate pricing claims (free 5 vs free 100) at signup, update [549c](../549c-21st-dev-pricing-licensing/) | Zaal | Self-validate | At first install |
| Cross-link from `community.config.ts` rule "use 21st for new surfaces" once tested | Zaal | PR | After 1st spike |

## Also See

- [Doc 548 - Lazer Mini Apps CLI](../../farcaster/548-lazer-miniapps-cli-evaluation/) - sister scaffold-tier eval. 21st operates one layer up (components inside any scaffold).
- [Doc 250 - Farcaster miniapps llms.txt](../../farcaster/250-farcaster-miniapps-llms-txt-2026/) - related mini app context primer
- [Doc 432 - ZAO master positioning (Tricky Buddha)](../../community/432-tricky-buddha-zao-master-context/) - brand voice constraints any UI generation must respect
- [Doc 508 - Creator infra + mini apps + token burn brief](../508-creator-infra-mini-apps-token-burn-signals-apr25/) - confirms ECC + 21st-style tooling is on the right side of 2026 trend

## Sources

- [21st.dev Magic page](https://21st.dev/magic) [FULL] - Official pricing (Free 100 credits, Pro $20/400 credits, Max $100/2000 credits) confirmed 2026-05-20
- [21st-dev/magic-mcp on GitHub](https://github.com/21st-dev/magic-mcp) [FULL] - 4,888 stars, MIT, TS, updated 2026-05-21
- [21st.dev community catalog](https://21st.dev/community) [FULL] - Category listing, engagement metrics
- [ChatForest - Magic MCP review](https://chatforest.com/reviews/magic-mcp-server/) [FULL] - Independent review with feature comparison, beta notice ("all features free during this period")
- [21st-dev org on GitHub](https://github.com/21st-dev) [FULL] - 11 repos visible, star counts verified
- [@21st-dev/cli on npm](https://www.npmjs.com/package/@21st-dev/cli) [PARTIAL] - Install package, no recent changelog visible
- [StackMCP - Magic MCP](https://stackmcp.dev/servers/magic-mcp) [FULL] - MCP directory listing, 4.9K stars, 8K weekly uses
- [Glama - 21st-dev Magic](https://glama.ai/mcp/servers/@21st-dev/magic-mcp) [FULL] - MCP registry entry
- [GitHub - 21st-dev/1code](https://github.com/21st-dev/1code) [FULL] - 5,532 stars, rising fast

## Validation Notes

- All star counts, dates pulled live 2026-05-20 from GitHub API, not LLM recall [VERIFIED].
- Pricing conflict RESOLVED: Free tier is 100 credits/month (confirmed on official `/magic` page 2026-05-20). Earlier $10/month + 5-request figures are obsolete (Apidog blog was 2025, Skywork article pre-2026).
- Component categories list from landing page navigation, treat as "at least these," not "only these."
- Site cloning confirmed on Pro tier + Max tier per official pricing.
- Beta notice: ChatForest notes "all features free during this period" - clarify what "beta" means (might be time-limited free period).
- 1code stars rising fast (5,532 vs 5,494 in April = +38 in 3 weeks); re-validate monthly.
- Re-validate by 2026-05-27.
