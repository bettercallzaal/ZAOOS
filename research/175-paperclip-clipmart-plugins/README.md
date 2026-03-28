# Research Doc 82 — Paperclip AI: ClipMart Marketplace & Plugin System

**Date:** 2026-03-19
**Status:** Research Only
**Relevance:** ZAO OS agent orchestration layer (builds on Doc 81)

---

## 1. ClipMart Marketplace

### What It Is

ClipMart is Paperclip's public registry/marketplace for AI-agent company configurations. It enables users to share, discover, download, and fork complete organizational templates — including agents, org charts, adapters, and seed tasks.

**Current status:** Early-stage. The GitHub repo (`paperclipai/clipmart`) has 11 commits, 30 stars, 11 forks. Built with Next.js + TypeScript + Drizzle ORM. The marketplace UI is still being developed; the underlying spec (ClipHub) is fully defined.

### What Gets Published as a Template

Templates are **structure, not state**. They include:

- Company metadata (name, description, use case, category)
- Organizational hierarchy and reporting relationships
- Agent definitions with roles, titles, and capabilities
- Adapter configurations (SOUL, HEARTBEAT, CLAUDE, process commands, webhooks)
- Optional seed tasks for initial operations
- Suggested token and cost budgets per agent

Templates **exclude** runtime data, historical costs, or in-progress work.

### Sub-packages

Beyond full companies, ClipHub supports:
- Individual agent templates (e.g., "Senior TypeScript Engineer")
- Team templates (subtrees of org charts)
- Standalone adapter configurations

### Template Schema

```
Template
  id, publisher_id, slug, name, description, category,
  tags[], readme, license, created_at, updated_at,
  star_count, download_count, fork_count,
  forked_from_id (nullable)

Version
  id, template_id, version (semver), changelog,
  artifact_url (zip), agent_count, adapter_types[]
```

**Required fields:** slug, name, description, category, version (semver)
**Optional fields:** tags, changelog, readme (markdown), license

### Categories

Nine use-case categories:
1. Software Development
2. Marketing & Growth
3. Content & Media
4. Research & Analysis
5. Operations
6. Sales
7. Finance & Legal
8. Creative
9. General Purpose

### Discovery Features

- **Featured:** Editorially curated
- **Popular:** Ranked by downloads and stars
- **Recent:** Latest published/updated
- **Semantic Search:** Vector embeddings for intent-based queries (e.g., "marketing agency that runs facebook ads")
- **Filters:** Category, agent count range, adapter types, star count, recency

### Pricing

Everything is free and public, at least initially. No premium or paid templates in current roadmap.

---

## 2. Exporting a ZAO Company Template for ClipMart

### CLI Export

```bash
# Export company as template
paperclip export --template my-company

# Publish to ClipHub registry
paperclip publish cliphub my-company
```

Templates can also be uploaded via web interface.

### Installation / Import

```bash
# Install from ClipHub
paperclip install cliphub:<publisher>/<company-slug>
```

This downloads the template and creates a new company locally. Users then configure API keys, budgets, and customizations.

### Forking

Users can fork existing templates, modify them, and republish as variants. Fork lineage is tracked.

### Bulk Sync

```bash
# Scan local templates and publish new/updated versions
paperclip cliphub sync
```

### ZAO-Specific Export Strategy

To export a ZAO company template:
1. Configure the ZAO company in Paperclip with agents, org chart, adapters
2. Run `paperclip export --template zao-music-org`
3. Add readme, tags (music, dao, farcaster, web3), category (Content & Media or Creative)
4. Publish: `paperclip publish cliphub zao-music-org`
5. Community members install: `paperclip install cliphub:zao/zao-music-org`

### Trust & Moderation

- **Verified Publishers:** Accounts meeting thresholds earn verified badges
- **Security Review:** Automated scanning of adapter configs, community flagging, manual moderator review
- **Account Gating:** New publishers face waiting periods

### Versioning

Semantic versioning with immutable snapshots. Users install specific versions or default to latest.

---

## 3. Full Plugin Architecture

### Plugin Categories

Plugins declare one or more of four categories:

| Category | Purpose | Examples |
|----------|---------|---------|
| `connector` | External system integrations | Linear, GitHub, Stripe, Supabase |
| `workspace` | Local file and process tooling | Terminal, git, file browser |
| `automation` | Background jobs and event reactions | Cron jobs, webhooks, sync |
| `ui` | Dashboard widgets, detail tabs, sidebar | Custom dashboards, charts |

### Plugin Manifest Format (Full Schema)

```typescript
interface PaperclipPluginManifestV1 {
  id: string;                          // globally unique (npm package name)
  apiVersion: 1;
  version: string;                     // semver
  displayName: string;
  description: string;
  categories: Array<"connector" | "workspace" | "automation" | "ui">;
  minimumPaperclipVersion?: string;
  capabilities: string[];              // static, install-time visible
  entrypoints: {
    worker: string;                    // path to worker entry
    ui?: string;                       // path to UI bundle directory
  };
  instanceConfigSchema?: JsonSchema;   // JSON Schema for settings
  jobs?: PluginJobDeclaration[];
  webhooks?: PluginWebhookDeclaration[];
  tools?: Array<{
    name: string;
    displayName: string;
    description: string;
    parametersSchema: JsonSchema;
  }>;
  ui?: {
    slots: Array<{
      type: "page" | "detailTab" | "dashboardWidget" | "sidebar" | "settingsPage";
      id: string;
      displayName: string;
      exportName: string;
      entityTypes?: Array<"project" | "issue" | "agent" | "goal" | "run">;
    }>;
  };
}
```

### Full Capability Model

**Data Read:** `companies.read`, `projects.read`, `project.workspaces.read`, `issues.read`, `issue.comments.read`, `agents.read`, `goals.read`, `activity.read`, `costs.read`

**Data Write:** `issues.create`, `issues.update`, `issue.comments.create`, `assets.write`, `assets.read`, `activity.log.write`, `metrics.write`

**Plugin State:** `plugin.state.read`, `plugin.state.write`

**Runtime:** `events.subscribe`, `events.emit`, `jobs.schedule`, `webhooks.receive`, `http.outbound`, `secrets.read-ref`

**UI Extension:** `instance.settings.register`, `ui.sidebar.register`, `ui.page.register`, `ui.detailTab.register`, `ui.dashboardWidget.register`, `ui.action.register`

**Agent Tools:** `agent.tools.register`

**Forbidden:** Approval decisions, budget override, auth bypass, issue checkout locks, direct database access.

### Lifecycle Hooks

**Required RPC Methods:**
- `initialize(input)` — called once on worker startup
- `health()` — returns status + diagnostics
- `shutdown()` — graceful shutdown (10s drain, then SIGTERM, then SIGKILL)

**Optional RPC Methods:**
- `validateConfig(input)` — runs on config changes
- `configChanged(input)` — receives new config at runtime
- `onEvent(input)` — receives typed domain events (at-least-once delivery)
- `runJob(input)` — executes scheduled jobs
- `handleWebhook(input)` — receives routed webhook payloads
- `getData(input)` — returns data for plugin UI components
- `performAction(input)` — executes UI-triggered actions
- `executeTool(input)` — runs agent tools during runs

### Worker SDK Context API

```typescript
interface PluginContext {
  manifest: PaperclipPluginManifestV1;
  config: { get(): Promise<Record<string, unknown>> };
  events: {
    on(name: string, fn: (event: unknown) => Promise<void>): void;
    on(name: string, filter: EventFilter, fn: (event: unknown) => Promise<void>): void;
    emit(name: string, payload: unknown): Promise<void>;
  };
  jobs: {
    register(key: string, input: { cron: string }, fn: (job: PluginJobContext) => Promise<void>): void;
  };
  state: {
    get(input: ScopeKey): Promise<unknown | null>;
    set(input: ScopeKey, value: unknown): Promise<void>;
    delete(input: ScopeKey): Promise<void>;
  };
  entities: {
    upsert(input: PluginEntityUpsert): Promise<void>;
    list(input: PluginEntityQuery): Promise<PluginEntityRecord[]>;
  };
  data: {
    register(key: string, handler: (params: Record<string, unknown>) => Promise<unknown>): void;
  };
  actions: {
    register(key: string, handler: (params: Record<string, unknown>) => Promise<unknown>): void;
  };
  tools: {
    register(name: string, input: PluginToolDeclaration, fn: (params: unknown, runCtx: ToolRunContext) => Promise<ToolResult>): void;
  };
  logger: { info, warn, error, debug };
}
```

### Event System

**Core domain events:** `company.created`, `company.updated`, `project.created`, `project.updated`, `project.workspace_created/updated/deleted`, `issue.created`, `issue.updated`, `issue.comment.created`, `agent.created`, `agent.updated`, `agent.status_changed`, `agent.run.started/finished/failed/cancelled`, `approval.created`, `approval.decided`, `cost_event.created`, `activity.logged`

**Plugin-to-plugin events:** Custom events via `ctx.events.emit()` namespaced as `plugin.<pluginId>.<eventName>`. Other plugins subscribe with standard `ctx.events.on()`.

**Event filtering:** Server-side filters by `projectId`, `companyId`, `agentId`.

### UI Extension Slots

- `page` — full plugin page at `/:companyPrefix/plugins/:pluginId`
- `detailTab` — tabs on project/issue/agent/goal/run detail views
- `dashboardWidget` — cards/sections on dashboard
- `sidebar` — global or company-context sidebar links
- `settingsPage` — custom settings UI
- `sidebarPanel`, `taskDetailView`, `projectSidebarItem`
- `globalToolbarButton`, `toolbarButton`
- `contextMenuItem`, `commentAnnotation`, `commentContextMenuItem`

### Frontend Bridge Hooks

```typescript
usePluginData(key, params)    // { data, loading, error }
usePluginAction(key)          // (params) => Promise<unknown>
usePluginStream(key, params)  // streaming data
usePluginToast()              // toast notifications
useHostContext()              // { companyId, projectId, entityId }
```

Shared components library: `MetricCard`, `StatusBadge`, `DataTable`, `TimeseriesChart`, `MarkdownBlock`, `KeyValueList`, `ActionBar`, `LogView`, `JsonTree`, `Spinner`, `ErrorBoundary`

### Process Model

- Plugins run **out-of-process** as Node worker processes
- Host and worker communicate over **JSON-RPC on stdio**
- Worker crash marks plugin `error`, keeps rest of instance running
- Retries with bounded backoff
- **Hot lifecycle:** install, uninstall, upgrade, config change — all without server restart

### Data Persistence

Core tables: `plugins`, `plugin_config`, `plugin_state`, `plugin_jobs`, `plugin_job_runs`, `plugin_webhook_deliveries`, `plugin_entities`

State scoped by: `(plugin_id, scope_kind, scope_id, namespace, state_key)`

### Security Model

- Single-tenant, self-hosted
- Capabilities are static, install-time visible, enforced in SDK layer
- Secrets stored as references only, resolved at execution time
- Plugins cannot override core routes, mutate approval/auth/budget logic, run arbitrary DB migrations

### Installation Commands

```bash
pnpm paperclipai plugin list
pnpm paperclipai plugin install <package[@version]>
pnpm paperclipai plugin uninstall <plugin-id>
pnpm paperclipai plugin upgrade <plugin-id> [version]
pnpm paperclipai plugin doctor <plugin-id>
```

### Uninstall / Data Lifecycle

- Soft delete with configurable grace period (default: 30 days)
- Reinstall within grace period recovers state
- Force purge: `pnpm paperclipai plugin purge <plugin-id>`

---

## 4. Building a ZAO-Specific Plugin

### Scaffolding

```bash
# Using the official generator
pnpm --filter @paperclipai/create-paperclip-plugin build
node packages/plugins/create-paperclip-plugin/dist/index.js @zao/plugin-supabase-sync --output ./plugins
```

### Generated Project Structure

```
@zao/plugin-supabase-sync/
├── src/
│   ├── manifest.ts      # Plugin metadata and config
│   ├── worker.ts        # Backend logic
│   └── ui/
│       └── index.tsx    # React UI components
├── tests/
│   └── plugin.spec.ts   # Test suite
├── esbuild.config.mjs   # Build config
├── rollup.config.mjs    # Bundle config
└── package.json
```

### Example: ZAO Supabase Sync Plugin

**manifest.ts:**
```typescript
export const manifest: PaperclipPluginManifestV1 = {
  id: "@zao/plugin-supabase-sync",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "ZAO Supabase Sync",
  description: "Syncs Paperclip issues/tasks with ZAO OS Supabase tables",
  categories: ["connector", "automation"],
  capabilities: [
    "issues.read",
    "issues.create",
    "issues.update",
    "events.subscribe",
    "jobs.schedule",
    "http.outbound",
    "secrets.read-ref",
    "plugin.state.read",
    "plugin.state.write",
    "ui.dashboardWidget.register"
  ],
  entrypoints: {
    worker: "dist/worker.js",
    ui: "dist/ui"
  },
  instanceConfigSchema: {
    type: "object",
    properties: {
      supabaseUrl: { type: "string", description: "Supabase project URL" },
      supabaseKeyRef: { type: "string", description: "Secret ref for service role key" },
      syncInterval: { type: "string", default: "*/5 * * * *", description: "Cron for sync" }
    },
    required: ["supabaseUrl", "supabaseKeyRef"]
  },
  jobs: [
    { jobKey: "sync-tasks", displayName: "Sync Tasks to Supabase", defaultCron: "*/5 * * * *" }
  ],
  webhooks: [
    { endpointKey: "supabase-webhook", displayName: "Supabase Change Webhook" }
  ],
  tools: [
    {
      name: "query-zao-members",
      displayName: "Query ZAO Members",
      description: "Look up ZAO member data from Supabase",
      parametersSchema: {
        type: "object",
        properties: { fid: { type: "number" }, wallet: { type: "string" } }
      }
    }
  ],
  ui: {
    slots: [
      {
        type: "dashboardWidget",
        id: "supabase-sync-status",
        displayName: "Supabase Sync Status",
        exportName: "SyncStatusWidget"
      }
    ]
  }
};
```

**worker.ts (conceptual):**
```typescript
import { createPlugin } from "@paperclipai/plugin-sdk";

export default createPlugin(async (ctx) => {
  // Subscribe to issue events
  ctx.events.on("issue.created", async (event) => {
    const config = await ctx.config.get();
    // Sync new issue to Supabase tasks table
    await fetch(`${config.supabaseUrl}/rest/v1/agent_tasks`, {
      method: "POST",
      headers: {
        "apikey": await ctx.secrets.resolve(config.supabaseKeyRef),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        paperclip_issue_id: event.payload.issue.id,
        title: event.payload.issue.title,
        status: event.payload.issue.status,
        assigned_agent: event.payload.issue.assigneeId
      })
    });
  });

  // Register scheduled sync job
  ctx.jobs.register("sync-tasks", { cron: "*/5 * * * *" }, async (job) => {
    // Bi-directional sync logic
    ctx.logger.info("Running Supabase sync job");
  });

  // Register agent tool
  ctx.tools.register("query-zao-members", {
    name: "query-zao-members",
    displayName: "Query ZAO Members",
    description: "Look up ZAO member data",
    parametersSchema: { type: "object", properties: { fid: { type: "number" } } }
  }, async (params) => {
    const config = await ctx.config.get();
    const res = await fetch(
      `${config.supabaseUrl}/rest/v1/users?fid=eq.${params.fid}`,
      { headers: { "apikey": await ctx.secrets.resolve(config.supabaseKeyRef) } }
    );
    return { success: true, data: await res.json() };
  });
});
```

### Example: ZAO Farcaster Notifications Plugin

```typescript
export const manifest: PaperclipPluginManifestV1 = {
  id: "@zao/plugin-farcaster-notifications",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "ZAO Farcaster Notifications",
  description: "Posts agent activity updates to Farcaster channels via Neynar",
  categories: ["connector", "automation"],
  capabilities: [
    "events.subscribe",
    "agents.read",
    "activity.read",
    "http.outbound",
    "secrets.read-ref",
    "plugin.state.read",
    "plugin.state.write"
  ],
  entrypoints: { worker: "dist/worker.js" },
  instanceConfigSchema: {
    type: "object",
    properties: {
      neynarApiKeyRef: { type: "string", description: "Secret ref for Neynar API key" },
      signerUuidRef: { type: "string", description: "Secret ref for Farcaster signer UUID" },
      channelId: { type: "string", default: "zao", description: "Farcaster channel to post to" },
      notifyOnEvents: {
        type: "array",
        items: { type: "string", enum: ["agent.run.finished", "agent.run.failed", "issue.created", "approval.created"] },
        default: ["agent.run.finished", "agent.run.failed"]
      }
    },
    required: ["neynarApiKeyRef", "signerUuidRef"]
  }
};
```

### Development Workflow

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build

# Local install for testing
pnpm paperclipai plugin install ./path-to-plugin
```

Host watches directory for changes in local development; `devUiUrl` config points to Vite dev server for UI hot-reload.

### Testing

Use `@paperclipai/plugin-test-harness`:
- Mock host with full SDK interface
- Synthetic event dispatch
- Job/webhook/data/action call simulation
- In-memory state/entity stores
- Configurable capability sets for testing denial paths

### Publishing

Deploy as npm packages. Keep UI self-contained. Avoid relying on undocumented host internals.

---

## 5. Deployment Modes

### local_trusted

| Property | Value |
|----------|-------|
| **Purpose** | Single-operator local machine development |
| **Network** | Loopback-only binding |
| **Auth** | None required |
| **Security** | Minimal — designed for isolated machines only |
| **Use cases** | Individual dev workflows, local testing, single-user |

### authenticated + private

| Property | Value |
|----------|-------|
| **Purpose** | Team access over trusted networks |
| **Network** | Tailscale, VPN, LAN |
| **Auth** | Login mandatory |
| **Security** | Moderate — assumes network boundary protection |
| **URL mode** | Auto base URL |

### authenticated + public

| Property | Value |
|----------|-------|
| **Purpose** | Internet-facing deployments |
| **Network** | Public internet |
| **Auth** | Login mandatory |
| **Security** | Strict — designed for untrusted network access |
| **URL mode** | Explicit public URL required |
| **Validation** | Doctor tool performs enhanced verification |

### Configuration

```bash
# Interactive onboarding (defaults to local_trusted)
pnpm paperclipai onboard

# Update configuration
pnpm paperclipai configure --section server

# Validate deployment
pnpm paperclipai doctor
```

### Migration: Local to Authenticated

When transitioning, if only the system Board identity holds admin access, Paperclip issues a one-time claim URL. The claiming signed-in user becomes instance administrator.

### ZAO Recommendation

- **Development:** `local_trusted` for building and testing
- **Team staging:** `authenticated + private` over Tailscale/VPN for ZAO core team
- **Production:** `authenticated + public` for community-wide agent dashboard access

---

## 6. Existing Templates & Plugins in the Community

### Example Plugins (in repo)

Four example plugins exist at `packages/plugins/examples/`:

1. **plugin-hello-world-example** — Basic introductory plugin
2. **plugin-kitchen-sink-example** — Comprehensive example showcasing multiple features
3. **plugin-file-browser-example** — File browser functionality
4. **plugin-authoring-smoke-example** — Smoke test for plugin authoring

### Community Status

- ClipMart marketplace is still early-stage (11 commits on repo)
- No public third-party templates or plugins found yet
- The ecosystem is pre-launch — first-mover opportunity for ZAO

### Packages in Monorepo

```
packages/
├── adapter-utils/     # Utility library for adapters
├── adapters/          # Adapter implementations (SOUL, HEARTBEAT, CLAUDE, etc.)
├── db/                # Database packages
├── plugins/           # Plugin system
│   ├── sdk/           # @paperclipai/plugin-sdk
│   ├── create-paperclip-plugin/  # Scaffolding tool
│   └── examples/      # 4 example plugins
└── shared/            # Shared utilities
```

---

## 7. ZAO Integration Opportunities

### Priority Plugins to Build

1. **@zao/plugin-supabase-sync** — Bi-directional sync between Paperclip issues and ZAO OS Supabase tables
2. **@zao/plugin-farcaster-notifications** — Post agent activity to Farcaster channels via Neynar
3. **@zao/plugin-respect-governance** — Surface Respect token balances and governance proposals in Paperclip dashboard
4. **@zao/plugin-xmtp-messaging** — Send agent notifications via XMTP encrypted DMs
5. **@zao/plugin-music-pipeline** — Track music submissions and curation tasks

### ZAO Company Template for ClipMart

A ZAO company template could include:
- **Agents:** Community Manager, Music Curator, Governance Facilitator, Content Creator, Dev Lead
- **Adapters:** Claude for reasoning, process commands for Neynar/XMTP APIs
- **Org chart:** Flat DAO structure with Respect-weighted reporting
- **Seed tasks:** Onboard new members, curate weekly playlist, process governance proposals
- **Category:** Content & Media or Creative
- **Tags:** music, dao, farcaster, web3, community, decentralized

---

## Sources

- [ClipHub Spec](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/CLIPHUB.md)
- [Plugin Spec](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/plugins/PLUGIN_SPEC.md)
- [Plugin Authoring Guide](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/plugins/PLUGIN_AUTHORING_GUIDE.md)
- [Deployment Modes](https://raw.githubusercontent.com/paperclipai/paperclip/master/doc/DEPLOYMENT-MODES.md)
- [ClipMart Repo](https://github.com/paperclipai/clipmart)
- [Paperclip Main Repo](https://github.com/paperclipai/paperclip)
- [Paperclip Official Site](https://paperclip.ing/)
- [eWeek: Meet Paperclip](https://www.eweek.com/news/meet-paperclip-openclaw-ai-company-tool/)
- [Flowtivity: Zero-Human Companies](https://flowtivity.ai/blog/zero-human-company-paperclip-ai-agent-orchestration/)
- [Vibe Sparking: Paperclip Overview](https://www.vibesparking.com/en/blog/ai/agent-orchestration/2026-03-05-paperclip-open-source-orchestration-zero-human-companies/)
- [Plugin Examples](https://github.com/paperclipai/paperclip/tree/master/packages/plugins/examples)
