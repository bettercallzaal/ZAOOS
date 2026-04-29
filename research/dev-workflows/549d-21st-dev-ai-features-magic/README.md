---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-04-29
related-docs: 549, 549a, 549b, 549c, 549e, 415, 506, 507, 508
tier: STANDARD
---

# 549d - 21st.dev AI Features: Magic, 1code, SDK

> **Goal:** Understand the rest of 21st-dev's product surface beyond Magic MCP - especially `1code` (5,494 stars), the `21st-sdk`, and `agent-elements` - so we know which to lift, track, or skip.

## The 21st-dev Product Family (verified 2026-04-29)

| Product | Stars | What it is | ZAO action |
|---|---|---|---|
| `magic-mcp` | 4,815 | UI component MCP (search + generate + refine + logos) | **Install now** (covered in 549, 549b) |
| `1code` | **5,494** | "Orchestration layer for coding agents (Claude Code, Codex)" | **Track**; possible QuadWork comparator. Separate research doc. |
| `21st-sdk` | 107 | SDK for embedding 21st features in apps | Track; ZAO website if we want public Inspiration Search |
| `21st-sdk-examples` | 35 | Cookbook for the SDK | Read once SDK is on the table |
| `21st-sdk-go` | 0 | Go SDK | Skip (ZAO is TS) |
| `agent-elements` | 50 | Drop-in agent-UX components | Possible fit for ZOE chat shell |
| `21st-extension` | 133 | Browser extension | Skip (out of repo scope) |
| `phion` | 7 | Unclear, low-signal | Skip |
| `vite-builder` | 5 | Vite scaffolding | Skip (ZAO uses Next, not Vite) |
| `cli` | 17 | The MCP installer | Already used via `npx` |

## Magic MCP - 4 Tools In Practice

### `21st_magic_component_inspiration` (Free, daily driver)

Semantic search across the marketplace. Pass natural-language. Returns code + preview.

**ZAO patterns to feed it:**
- "Festival lineup card with artist photo + set time + ticket price, dark theme"
- "Sponsor pricing tiers, Bronze / Silver / Gold / Founder, with crypto + fiat"
- "AI chat input bar with suggestion chips and tool indicators"
- "Audio room CTA card with live listener count"
- "Wallet connect button with multi-chain dropdown"

This is the bulk of the value. Use 50-100x more often than the paid generators.

### `logo_search` (Free)

Brand SVG via svgl. Pass a name, get SVG.

**ZAO patterns:**
- `logo_search "farcaster"` -> Farcaster mark for share-as buttons
- `logo_search "base"` -> Base logo for stake page chain indicator
- `logo_search "spotify"` -> Spotify icon on ZAO Music landing partner row

Replaces "find me a clean SVG" rabbit holes.

### `21st_magic_component_builder` (Pro)

Pass a description, get 5 polished variants. Browser tab opens to pick. Selected variant writes into your project.

**Use when:**
- No close inspiration match exists
- Need 5 angles fast (e.g. "5 takes on a ZAOstock RSVP card")
- Brand-consistent generation (pass tokens in the prompt)

**Skip when:**
- Inspiration already has a great match (lift + adapt is faster)
- Component is brand-critical (manual control beats AI guess)

### `21st_magic_component_refiner` (Pro)

Pass an existing component (yours OR a generated one). Iterate.

**Use when:**
- Lifted a community component but it needs theme adaptation
- Generated component is 80% there, want one specific tweak
- Need an accessibility pass (color contrast, focus rings, ARIA)
- Need to swap from desktop-first to mobile-first

## `1code` - The Sleeper

5,494 stars on a repo many haven't heard of. Description: "Orchestration layer for coding agents (Claude Code, Codex)."

**What it likely does:** competes with or complements:
- ZAO's QuadWork pattern (memory `feedback_prefer_claude_max_subscription`)
- DevFleet (memory `everything-claude-code:devfleet`)
- Anthropic Managed Agents
- Lazer's `/lazer` skill router (Doc 548)

**Why it matters to ZAO:**
- If `1code` is meaningfully better than QuadWork at multi-task orchestration, that's a candidate for adoption
- 21st-dev's mass distribution + 5.5K stars suggests they have real opinions on agent UX
- `agent-elements` (50 stars) likely ships UI for `1code` workflows

**Decision now:** **track, don't adopt.** Open a separate research doc once the Lazer spike (Doc 548) closes and we have bandwidth for an honest agent-orchestration comparison. Add to memory as a "to-research" item.

## `21st-sdk` + `agent-elements` - Possible Embeds

`21st-sdk` lets external apps embed 21st features. Concrete possibilities for ZAO:

| Where | What | Tier (free / paid 21st access) |
|---|---|---|
| ZAO Devz portal | Embed Inspiration Search so contributors can browse before committing UI work | Free if API key is server-side and rate-limited |
| FRAPP submission flow (fractal app submission, memory `project_fractal_process`) | Component picker for community devs proposing UIs | Free |
| ZAO OS public docs site | "Show me a button like this" interactive widget | Free |

**Decision now:** **defer.** Tempting but premature - the in-repo MCP install handles every internal need. Revisit when ZAO has a public contributor-facing UX surface and we want to monetise / brand around component discovery.

`agent-elements` for ZOE chat shell is more interesting because ZOE chat is already in build (memory `project_zoe_v2_redesign`, `project_zoe_dashboard`). Worth a 1-day audit during ZOE v2 sprint.

## How This Connects to ECC + Other Skill Stacks

Memory `project_trae_ai_skip` flagged ECC + obra/superpowers as the canonical agent-tooling stack for ZAO. 21st-dev does NOT compete with ECC's review/build/test skills - it competes with the **component-layer** part. They stack:

```
ECC (review, build, test, lint, devops)
+ obra/superpowers (planning, brainstorming, TDD discipline)
+ 21st Magic MCP (component search + generation)
+ Lazer (scaffold + multi-platform mini app, Doc 548 - spike only)
+ QuadWork (Claude Code on VPS, multi-agent dev squad)
+ ZAO native skills (zao-research, qa, ship, vps, worksession, etc.)
```

No overlap. 21st fills a gap nobody else fills.

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Open separate doc `1code-vs-quadwork` once Lazer spike closes | n/a | Research | After Doc 548 PR merged |
| Audit `agent-elements` during ZOE v2 sprint | Zaal | Spike | When ZOE v2 starts |
| Defer `21st-sdk` embed until public contributor flow exists | n/a | Tracked | Re-evaluate end of Q2 2026 |
| Skip `phion`, `vite-builder`, `21st-sdk-go`, `21st-extension` | n/a | Decision | n/a |

## Sources

- [21st-dev GitHub org](https://github.com/21st-dev) - 11 repos visible
- [21st-dev/1code](https://github.com/21st-dev/1code) - 5,494 stars
- [21st-dev/21st-sdk](https://github.com/21st-dev/21st-sdk) - 107 stars
- [21st-dev/agent-elements](https://github.com/21st-dev/agent-elements) - 50 stars
- [21st-dev/21st-sdk-examples](https://github.com/21st-dev/21st-sdk-examples) - 35 stars

## Staleness Notes

`1code` star count rising fast (jumped past `magic-mcp`). Re-validate monthly. If `1code` becomes the headline product, this doc gets a successor.
