# 429 - Paragraph Agents Launch (Apr 17 2026): Skills, Micropaywalls, Archive Listing

> **Status:** Research complete
> **Date:** 2026-04-17
> **Goal:** Capture what shipped in Paragraph's Apr 17 2026 agent-native launch and map it to ZOE, ROLO, VAULT/BANKER/DEALER, and the ZAO newsletter workflow. Extends docs 322 and 352.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Skill install for Claude Code + Cursor** | USE `npx skills add paragraph-xyz/skill` in each project that needs to publish. Installs two skills: `paragraph-cli` (uses CLI + MCP) and `paragraph-api` (uses REST + TypeScript SDK, no install required). Skills drop into `~/.claude/skills/<name>/SKILL.md`. See `paragraph.com/agents` |
| **Hosted MCP for personal work** | USE `https://mcp.paragraph.com/mcp` with zero local setup. No CLI install, no API key file, browser-based auth. Best path for Zaal's personal publication at `paragraph.com/@thezao` and for ZOE chat-driven publishing |
| **REST API for agent cron jobs** | USE `paragraph-api` skill + `PARAGRAPH_API_KEY` env var for VAULT/BANKER/DEALER automated publishing. MCP requires interactive auth - unsuitable for headless cron. This matches doc 352's recommendation |
| **Micropaywalls inside posts** | USE for selling show recaps, research packs, artist stems, prompt libraries directly inside the newsletter body. Agents buy via x402/MPP, humans via credit card or crypto. This is NEW vs docs 322 and 352 which sold via separate x402 endpoints or publish.new listings |
| **publish.new one-click archive** | USE to list the full ZAO newsletter archive as a single `.zip` of markdown for agent discovery. Title, description, price, payout wallet all pre-filled. Run once per quarter to refresh the archive listing |
| **x402 vs MPP pick** | KEEP x402 as primary (doc 352). ADD MPP support once Stripe/Tempo MPP v1 lands (launched 2026-03-18). MPP better for recurring newsletter subscriptions and session-based agent access, x402 better for one-shot file buys |
| **ZOE integration** | WIRE Paragraph skill + MCP into `/newsletter` skill so ZOE can draft in Claude, publish to Paragraph, generate socials, and attach a paid download from one Telegram command |
| **ROLO integration** | WIRE Paragraph REST to ROLO rolodex so "who wrote about Artist X" pulls from published posts on `paragraph.com/@thezao` plus subscriber reactions |
| **Post coins NOT micropaywalls for general newsletters** | KEEP newsletter posts free. USE micropaywalls only on premium content (show recap packs, artist stem drops, research bundles). Free-access funnel feeds paid content |

---

## What Shipped April 17, 2026 (The New Stuff)

| Feature | What It Does | Where It Lives |
|---------|-------------|----------------|
| **Agent skill bundle** | One `npx` command installs Paragraph skills into Claude Code, Cursor, or any skill-aware agent. Two skills inside: `paragraph-cli`, `paragraph-api` | `github.com/paragraph-xyz/skill` |
| **Hosted MCP without auth setup** | `https://mcp.paragraph.com/mcp` usable with zero CLI or API key install (browser auth) | `paragraph.com/agents` |
| **Micropaywall inside posts** | Upload any digital file, set price + payout wallet, embed inside a post. Humans pay card or crypto, agents pay x402 or MPP | Post editor |
| **Archive one-click listing** | Package entire published archive as markdown `.zip`, auto-upload, pre-fill `publish.new` listing (title, description, price, payout) | Publication settings |
| **`paragraph.com/agents` landing** | Canonical agent entry point with skill install, SDK links, MCP URL | Live |

Compare with what was already shipped (docs 322 and 352):
- REST API at `public.api.paragraph.com/api/v1/*` - LIVE in doc 322
- `paragraph-sdk-js` TypeScript SDK - LIVE in doc 322
- CLI `@paragraph-com/cli` - LIVE in doc 322
- MCP server with 18 tools - LIVE in doc 322
- Post coins + writer coins on Base/Doppler - LIVE in doc 322
- publish.new marketplace - LIVE in doc 322
- x402 + MPP payment rails - LIVE in doc 322 and doc 352

The April 17 launch is a distribution + packaging play, not new primitives. The primitives were already live; now they have a one-liner install and a landing page.

---

## Comparison: Paragraph Install Options for ZAO Agents (Apr 2026)

| Option | Auth | Best For | Install Command | ZAO Use Case |
|--------|------|----------|-----------------|--------------|
| **Skill bundle (both)** | Browser or API key | Any Claude Code project that writes content | `npx skills add paragraph-xyz/skill` | Install in ZAO OS, COC Concertz, BetterCallZaal repos so any Claude session can publish |
| **`paragraph-cli` skill only** | Browser (MCP) or CLI login | Interactive drafting in Claude Code | `npx skills add paragraph-xyz/skill --skill paragraph-cli` | Zaal writes newsletters in Claude, publishes without leaving terminal |
| **`paragraph-api` skill only** | API key env var | Agent cron jobs, headless CI | `npx skills add paragraph-xyz/skill --skill paragraph-api` | VAULT/BANKER/DEALER weekly reports, ZOE automated publishing |
| **Hosted MCP URL** | Browser | Claude Code users who do not want any local install | `claude mcp add paragraph --transport http https://mcp.paragraph.com/mcp` | Fastest path for Zaal personally |
| **Local MCP via CLI** | API key | Existing doc 322 workflow | `npx @paragraph-com/cli` plus local MCP config | Already working, no reason to change |
| **Direct REST** | `Authorization: Bearer <PARAGRAPH_API_KEY>` | Lowest dependency agent code | fetch `https://public.api.paragraph.com/api/v1/posts` | Already used in doc 352 VAULT/BANKER/DEALER impl |

---

## Micropaywalls: New Monetization Pattern Inside Posts

Before Apr 17, paid content required either:
- Custom x402 endpoint on our own infra (doc 352 pattern, full control, must build + host)
- Separate publish.new listing (doc 322 pattern, separate URL from the post)

After Apr 17, you can embed a paid file inline in the newsletter body:

| Field | Value |
|-------|-------|
| File | Any digital upload (dataset, PDF, zip, hi-res image, prompt library, stems) |
| Price | Creator sets, microtransactions supported |
| Payout wallet | Base EVM address |
| Human buyers | Credit card or crypto |
| Agent buyers | x402 or MPP programmatic, no UI |
| Location | Inside the post body, not a separate page |

### ZAO Use Cases

| Product | Price | Post Type | Buyer |
|---------|-------|-----------|-------|
| COC Concertz show recap pack (photos, setlist, clips) | 2 USDC | Monthly recap newsletter | Fans, press, agents indexing concerts |
| ZAO Stock 2026 pitch deck + contracts bundle | 10 USDC | Program launch post | Sponsors, other festivals |
| Artist stems and session files for community remix | 3 USDC per artist | Artist spotlight | Producers, remix contests |
| Weekly ZABAL + agent trading data CSV | 0.50 USDC | Weekly wrap | Analysts, other token ecosystems |
| Research library archive (this folder, 429 docs) | 25 USDC | Quarterly publication | Agents, researchers, competitors who want the map |
| Year of the ZABAL back-catalog | 15 USDC bundle | Year-end post | Readers, archivists, AI training sets |

### Code Pattern: Gated File Embed in a Programmatic Post

Until Paragraph documents the gated-file REST field, the workflow is:
1. Create the post via REST (doc 352 code path)
2. Upload the file via the Paragraph dashboard once, get the embed code
3. Save the embed HTML snippet as a template in `src/lib/publish/paragraph-gated.ts`
4. Agent injects the snippet at a marker in the markdown before POST

```typescript
// src/lib/publish/paragraph-gated.ts (stub until REST field is documented)
export function attachGatedFile(markdown: string, fileEmbedHtml: string): string {
  return markdown.replace('{{GATED_FILE}}', fileEmbedHtml);
}
```

TODO: watch `paragraph.com/docs/llms-full.txt` for the REST field name, then remove the stub.

---

## Archive Listing on publish.new: One-Click Workflow

The Apr 17 launch added a button in publication settings that:
1. Exports all published posts as markdown
2. Packages as `.zip` with metadata
3. Uploads to publish.new
4. Pre-fills a listing (title, description from publication metadata, suggested price, payout wallet from publication billing address)

### ZAO publications to list

| Publication | Post count | Suggested price | Buyer profile |
|-------------|-----------|-----------------|---------------|
| `paragraph.com/@thezao` (ZAO main) | varies (growing) | 15 USDC | Web3 music researchers, agents mapping the scene |
| Year of the ZABAL daily newsletter | one per day since start | 25 USDC annual bundle | Archivists, AI training |
| COC Concertz newsletter (when promoters adopt) | varies | 5 USDC per show season | Concert discovery agents, promoters |

Cadence: list once at program launch, re-list quarterly to refresh. Each re-list is a new `publish.new` slug.

---

## Integration Map: New Paragraph Tools Into ZAO Systems

### ZOE `/newsletter` skill

Current: `~/.claude/skills/newsletter/skill.md` drafts a newsletter in HTML preview for copy-paste into Paragraph.

Upgrade after Apr 17 install:
1. Run `npx skills add paragraph-xyz/skill` inside ZOE's repo
2. Replace clipboard output with direct `paragraph-cli` publish call
3. After publish, call `/socials` skill to generate distribution posts
4. Optionally attach a gated file (show recap pack, stems) via the new micropaywall field

Net result: Telegram command in ZOE -> drafted post -> published to `paragraph.com/@thezao` -> socials generated -> Zaal approves and ships, all without leaving chat.

Relevant files:
- `/Users/zaalpanthaki/.claude/skills/newsletter/skill.md` (existing)
- `/Users/zaalpanthaki/.claude/skills/socials/skill.md` (existing)
- ZOE VPS repo (external, doc 234-239 series)

### ROLO rolodex enrichment

ROLO already pulls contact data from Supabase and agent events (doc on agent squad dashboard). Add:
- `src/lib/rolo/paragraph-sync.ts` - fetch all published posts via REST every 4h
- Extract author mentions, Farcaster handles, artist names
- Join with ROLO contacts, annotate with "mentioned in post X on date Y"
- Powers queries like "who has Zaal written about in the last 30 days"

### VAULT/BANKER/DEALER auto-publishing (doc 352 extension)

Doc 352 already has `src/lib/agents/paragraph.ts` for REST publishing. After Apr 17:
- Add gated-file attach step in publish flow (code stub above)
- Price by content type (table in doc 352 still valid)
- Agent cron also checks `paragraph.com` for new posts from other agents and buys via x402 through the existing buyer code
- USDC earned flows to ZABAL buyback via existing `src/lib/agents/swap.ts`

No new files, just one new step in the existing publish flow.

### COC Concertz promoter flow (doc 322 extension)

Doc 322 planned a newsletter builder admin page. After Apr 17:
- Promoter uses admin page, clicks "Publish", ZOE drafts via skill
- Publish goes direct to Paragraph
- Show recap pack (photos zip from Cloudinary) attached as gated file at 2 USDC
- Promoter earns ZABAL reward for creating the post, plus revenue from recap pack sales
- Auto-list quarterly archive to publish.new

Files to add:
- `src/app/admin/newsletter/page.tsx` (new)
- `src/lib/publish/paragraph-gated.ts` (new, stub above)
- `src/lib/publish/concertz-recap-pack.ts` (new, zip Cloudinary assets)

### BetterCallZaal personal site

- Install skill in BetterCallZaal repo so Zaal can publish personal essays from terminal
- Archive listing of personal posts on publish.new for the "buy Zaal's thinking" angle
- Matches the agency narrative in memory project_bcz_agency.md

---

## Cross-Reference With Existing Research

| Doc | Title | Relevance |
|-----|-------|-----------|
| **322** | Paragraph + Publish.new platform research | Full platform map, coins, original MCP setup. This doc extends 322 |
| **352** | Paragraph + x402 agent implementation | Exact code for VAULT/BANKER/DEALER publishing + buying. This doc adds gated-file embed step |
| **252** | Publish.new agent marketplace | Foundational research on publish.new |
| **316** | Agentic Bootcamp Week 2 | x402 vs MPP deeper comparison |
| **345** | ZABAL agent swarm master blueprint | Full agent architecture, where Paragraph fits |
| **419** | Matteo Tambussi Italy bridge | Paragraph already mentioned as content channel |
| **422** | Claude Routines ZAO automation stack | Skill install patterns, fits the new `npx skills add` flow |

Memory refs:
- `project_zoe_v2_redesign.md` - ZOE v2 Telegram-native ops engine
- `project_agent_squad_dashboard.md` - 8-agent squad where ROLO + ZOE live
- `project_composio_ao_pilot.md` - AO / Composio agent pilot

---

## Open Questions

| Question | Where To Find Out |
|----------|-------------------|
| Exact REST field name for gated-file attach | `paragraph.com/docs/llms-full.txt` once it updates, or email support@paragraph.com |
| Paragraph fee on micropaywall sales | Undocumented in doc 322; ask Paragraph team (hello@paragraph.com) |
| Does hosted MCP support server-side service accounts or only browser auth | Paragraph agent docs |
| publish.new archive auto-refresh cadence (manual vs scheduled) | publish.new settings after running one listing |
| Whether `paragraph-api` skill exposes gated-file upload, or only post CRUD | Inspect skill after install |

---

## Hard Commands Reference

```bash
# Install both skills in current project
npx skills add paragraph-xyz/skill

# Install only the CLI + MCP skill
npx skills add paragraph-xyz/skill --skill paragraph-cli

# Install only the REST + SDK skill
npx skills add paragraph-xyz/skill --skill paragraph-api

# Add hosted MCP to Claude Code globally
claude mcp add paragraph --transport http https://mcp.paragraph.com/mcp

# Install the CLI globally (if using paragraph-cli skill)
npm install -g @paragraph-com/cli

# Direct REST publish (doc 352 pattern, still valid)
curl -X POST https://public.api.paragraph.com/api/v1/posts \
  -H "Authorization: Bearer $PARAGRAPH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "title": "...", "markdown": "...", "status": "published", "sendNewsletter": true }'
```

---

## Sources

- [Paragraph is now AI-native (Colin Armstrong, Apr 17 2026)](https://paragraph.com/@paragraph/paragraph-ai-native) - official launch post
- [paragraph.com/agents](https://paragraph.com/agents) - canonical agent entry point with skill install
- [github.com/paragraph-xyz/skill](https://github.com/paragraph-xyz/skill) - skill bundle repo
- [Paragraph API + SDK overview](https://paragraph.com/docs/development/api-sdk-overview) - REST auth, alpha status, rate limits via support@paragraph.com
- [Paragraph full docs index](https://paragraph.com/docs/llms-full.txt) - canonical docs dump
- [x402 vs Stripe MPP (WorkOS, 2026)](https://workos.com/blog/x402-vs-stripe-mpp-how-to-choose-payment-infrastructure-for-ai-agents-and-mcp-tools-in-2026) - pick-guide for agent payment rails
- [MPP launch post by Stripe + Tempo (Mar 18 2026)](https://www.robotdomainsearch.com/blog/2026/03/19/what-is-mpp-dual-payment-protocol/) - MPP session-based model
- [Doc 322 - Paragraph + Publish.new research](../322-paragraph-publishnew-newsletter-agent-commerce/)
- [Doc 352 - Paragraph + x402 agent implementation](../352-paragraph-x402-agent-implementation/)
