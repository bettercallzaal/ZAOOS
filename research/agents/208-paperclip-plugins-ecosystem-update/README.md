# 208 — Paperclip Plugins: Ecosystem Update & ZAO Integration Plan

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Map the current Paperclip plugin ecosystem (11 community plugins, 4 examples, 2 new releases), identify which plugins ZAO should install vs build, and update the integration plan from Doc 175

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install paperclip-plugin-discord** | YES — MIT, 7 stars, 238 tests, bidirectional sync. ZAO's Discord community (fractal meetings Mondays 6pm EST) gets real-time agent updates + slash commands. Install via `pnpm paperclipai plugin install paperclip-plugin-discord` |
| **Install paperclip-plugin-github-issues** | YES — MIT, bidirectional issue sync. ZAO already forwards community issues to Paperclip (`src/app/api/community-issues/route.ts:81`). This replaces the custom sync script (`scripts/sync-issues-to-paperclip.ts`) with a proper bidirectional plugin |
| **Skip paperclip-plugin-slack** | SKIP — ZAO doesn't use Slack. Community is on Discord + Farcaster |
| **Skip paperclip-plugin-telegram** | SKIP — no Telegram community |
| **Evaluate paperclip-plugin-chat** | INVESTIGATE — interactive AI copilot for managing tasks/agents. Could be useful for ZAO admin. Check if it works with the `authenticated + public` deployment mode |
| **Skip paperclip-aperture** | SKIP for now — alternative Focus view is nice-to-have, not needed with 3 agents |
| **Skip oh-my-paperclip** | SKIP — only 2 stars, 2 commits, no actual plugins bundled yet. Vaporware |
| **Build @zao/plugin-farcaster-notifications** | BUILD — no existing Farcaster plugin in the ecosystem. ZAO would be the first. Post agent activity to /zao channel via Neynar. Use the manifest from Doc 175 section 4 |
| **Build @zao/plugin-supabase-sync** | BUILD — no existing Supabase connector. Replaces `scripts/sync-issues-to-paperclip.ts` with proper event-driven bi-directional sync. Use the manifest from Doc 175 section 4 |
| **Upgrade Paperclip to v2026.325.0** | YES — adds Company Import/Export (ClipMart predecessor), Company Skills Library, and Routines engine. Released March 25, 2026 |
| **Use Company Skills Library** | YES — new in v2026.325.0. Pin ZAO's Claude Code skills (zao-research, investigate, etc.) to the Paperclip company so agents get them automatically |
| **Use Routines for recurring tasks** | YES — new in v2026.325.0. Replace manual cron/heartbeats with native Routines for weekly playlist curation, governance checks, etc. |
| **Publish ZAO template to ClipMart** | DEFER — ClipMart still has only 11 commits. Company Import/Export just shipped in v2026.325.0. Wait for ClipMart to launch properly. Export the template now for backup via `paperclip export --template zao-music-org` |

## Comparison of Community Plugins

| Plugin | Author | Stars | License | Commits | ZAO Relevance | Action |
|--------|--------|-------|---------|---------|---------------|--------|
| paperclip-plugin-discord | mvanhorn | 7 | MIT | 40 | **High** — Discord fractal meetings | INSTALL |
| paperclip-plugin-github-issues | mvanhorn | 3 | MIT | — | **High** — replaces custom sync script | INSTALL |
| paperclip-plugin-slack | mvanhorn | — | MIT | — | None — no Slack | SKIP |
| paperclip-plugin-telegram | mvanhorn | — | MIT | — | None — no Telegram | SKIP |
| paperclip-plugin-chat | webprismdevin | — | — | — | Medium — admin copilot | EVALUATE |
| paperclip-plugin-company-wizard | yesterday-ai | — | — | — | Low — ZAO already configured | SKIP |
| paperclip-plugin-acp | mvanhorn | — | — | — | Low — ZAO uses Claude Code directly | SKIP |
| paperclip-plugin-avp | creatorrmode-lead | — | — | — | Medium — agent trust/reputation. Interesting for governance but premature | DEFER |
| paperclip-aperture | tomismeta | — | — | — | Low — only 3 agents, default Focus view is fine | SKIP |
| oh-my-paperclip | gsxdsm | 2 | — | 2 | None — empty bundle | SKIP |
| paperclip-discord-bot | rekon307 | — | — | — | Low — community Discord bot, not a plugin | SKIP |

## Comparison of v2026.318.0 vs v2026.325.0 (Plugin-Relevant Changes)

| Feature | v2026.318.0 (Mar 18) | v2026.325.0 (Mar 25) |
|---------|----------------------|----------------------|
| Plugin SDK | Shipped: runtime, CLI, settings UI, slots | Same + bug fixes |
| Company Import/Export | Not available | **NEW** — full portability, file browser UX, GH shorthand refs |
| Company Skills Library | Not available | **NEW** — company-scoped skills, agent sync, pinned GH skills |
| Routines Engine | Not available | **NEW** — triggers, recurring tasks, coalescing |
| CLI Auth | Not available | **NEW** — browser-based auth flow |
| DB Migrations | 0028–0037 (10 migrations) | 0038–0044 (7 more) |
| Docker | Basic | **Improved** — CI workflow, initdb fixes |

## ZAO OS Integration

### Already Built

ZAO already has Paperclip integration at these touchpoints:

- **`src/app/api/community-issues/route.ts:81-131`** — forwards community issues to Paperclip CEO agent (non-blocking). Uses `PAPERCLIP_API_URL`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_CEO_AGENT_ID`, `PAPERCLIP_API_KEY` env vars
- **`scripts/sync-issues-to-paperclip.ts`** — batch sync script for community issues → Paperclip (manual, one-directional)
- **`agents/ceo/TOOLS.md`** + **`agents/researcher/TOOLS.md`** — agent tool definitions for Paperclip agents
- **`.env.example:30-33`** — Paperclip env vars documented
- **`community.config.ts`** — community branding consumed by Paperclip agents

### Plugin Installation Plan (Priority Order)

**Phase 1: Install community plugins (Day 1)**

```bash
# Upgrade Paperclip first
cd /path/to/paperclip && git pull && pnpm install && pnpm build

# Install Discord plugin
pnpm paperclipai plugin install paperclip-plugin-discord

# Install GitHub Issues plugin
pnpm paperclipai plugin install paperclip-plugin-github-issues
```

Configure Discord plugin:
- `webhookUrl` → ZAO Discord server webhook
- `channelRouting` → approvals to #agent-ops, errors to #agent-ops, general to #agent-updates
- `notifyOnEvents` → `agent.run.finished`, `agent.run.failed`, `approval.created`, `issue.created`
- `neynarApiKeyRef` → not needed (Discord-only)

Configure GitHub Issues plugin:
- `githubToken` → PAT with repo access to `bettercallzaal/zao-os`
- `syncDirection` → bidirectional
- `repositories` → `["bettercallzaal/zao-os"]`

**Phase 2: Pin company skills (Day 1)**

Use v2026.325.0's Company Skills Library to pin ZAO skills:
- `zao-research` — research workflow
- `investigate` — debugging
- `review` — PR review
- `ship` — shipping workflow

This replaces manual `--add-dir` skill injection.

**Phase 3: Build @zao/plugin-farcaster-notifications (Week 1)**

Scaffold:
```bash
pnpm --filter @paperclipai/create-paperclip-plugin build
node packages/plugins/create-paperclip-plugin/dist/index.js @zao/plugin-farcaster-notifications --output ./plugins
```

Key capabilities: `events.subscribe`, `agents.read`, `activity.read`, `http.outbound`, `secrets.read-ref`. Posts to Farcaster /zao channel via Neynar `POST /v2/farcaster/cast`. Full manifest in Doc 175 section 4.

**Phase 4: Build @zao/plugin-supabase-sync (Week 2)**

Replaces `scripts/sync-issues-to-paperclip.ts` with event-driven bidirectional sync:
- Paperclip `issue.created` → Supabase `community_issues` insert
- Supabase webhook → Paperclip issue update
- Scheduled job: full reconciliation every 5 minutes

Full manifest and worker code in Doc 175 section 4.

**Phase 5: Set up Routines (Week 2)**

Use v2026.325.0 Routines engine for:
- Weekly playlist curation task (Monday)
- Governance proposal review (daily check)
- Community health report (Friday)

### What This Replaces

| Current Approach | Replaced By |
|-----------------|-------------|
| `scripts/sync-issues-to-paperclip.ts` manual batch script | @zao/plugin-supabase-sync (event-driven, bidirectional) |
| Custom issue forwarding in `src/app/api/community-issues/route.ts:81-131` | paperclip-plugin-github-issues (bidirectional) |
| No Discord notifications | paperclip-plugin-discord (real-time, interactive) |
| No Farcaster agent notifications | @zao/plugin-farcaster-notifications (posts to /zao channel) |
| Manual heartbeat cron | v2026.325.0 Routines engine |
| Manual skill injection via `--add-dir` | v2026.325.0 Company Skills Library |

## Plugin SDK Quick Reference

```typescript
// Worker entry: definePlugin + runWorker
import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";

export default definePlugin({
  async setup(ctx) {
    // Subscribe to events
    ctx.events.on("issue.created", async (event) => { /* ... */ });

    // Register scheduled jobs
    ctx.jobs.register("sync", { cron: "*/5 * * * *" }, async (job) => { /* ... */ });

    // Register agent tools
    ctx.tools.register("query-members", toolDecl, async (params, runCtx) => { /* ... */ });

    // Use scoped state
    await ctx.state.set({ scopeKind: "company", scopeId: "...", namespace: "sync", stateKey: "last" }, value);
  }
});

// UI entry: usePluginData + usePluginAction
import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
```

Four plugin categories: `connector`, `workspace`, `automation`, `ui`.

30+ capabilities declared at install time. Forbidden: approval decisions, budget override, auth bypass, direct DB access.

## Plugin Ecosystem Health Assessment

| Metric | Value | Assessment |
|--------|-------|------------|
| Paperclip GitHub stars | 26,000 | Strong adoption |
| Community plugins | 11 | Early but growing |
| Official example plugins | 4 | Good documentation |
| Plugin SDK npm package | Published | Stable for local dev |
| ClipMart marketplace | 11 commits | Pre-launch, not usable yet |
| awesome-paperclip | 94 stars | Active curation |
| Most active plugin author | mvanhorn (4 plugins) | Concentrated contributor |
| Time since plugin SDK shipped | 10 days (v2026.318.0) | Very early |
| Latest release | v2026.325.0 (Mar 25) | Active development |

**Bottom line:** The plugin ecosystem is 10 days old. 11 community plugins exist, 2 are directly useful for ZAO (Discord + GitHub Issues). Building Farcaster and Supabase plugins would make ZAO one of the first plugin publishers — first-mover opportunity in the "Content & Media" category on ClipMart when it launches.

## Sources

- [awesome-paperclip](https://github.com/gsxdsm/awesome-paperclip) — curated plugin list (94 stars)
- [paperclip-plugin-discord](https://github.com/mvanhorn/paperclip-plugin-discord) — MIT, 7 stars, 238 tests
- [paperclip-plugin-github-issues](https://github.com/mvanhorn/paperclip-plugin-github-issues) — MIT, 3 stars
- [Paperclip Plugin Spec](https://github.com/paperclipai/paperclip/blob/master/doc/plugins/PLUGIN_SPEC.md)
- [Paperclip Plugin Authoring Guide](https://github.com/paperclipai/paperclip/blob/master/doc/plugins/PLUGIN_AUTHORING_GUIDE.md)
- [Paperclip v2026.325.0 release](https://github.com/paperclipai/paperclip/releases/tag/v2026.325.0) — Mar 25, 2026
- [Paperclip v2026.318.0 release](https://github.com/paperclipai/paperclip/releases/tag/v2026.318.0) — Mar 18, 2026
- [Plugin SDK on npm](https://www.npmjs.com/package/@paperclipai/plugin-sdk)
- [Plugin Discussion #258](https://github.com/paperclipai/paperclip/discussions/258)
- [Doc 175 — Paperclip ClipMart Plugins](../../_archive/175-paperclip-clipmart-plugins/) — original research (Mar 19)
- [Doc 72 — Paperclip Functionality Deep Dive](../../_archive/072-paperclip-functionality-deep-dive/)
- [Doc 67 — Paperclip AI Agent Company](../../_archive/067-paperclip-ai-agent-company/)
