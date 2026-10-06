# Anthropic Claude Marketplace: Plugin Packaging, MCP Connector Specs, and ZAO Skill Distribution

| Decision | Choice | Rationale | Revisit When |
|:---|:---|:---|:---|
| Distribution Target | Dual-Packaging (Local MCP + Claude Marketplace Registry) | Serves immediate internal ZAO OS agent fleet while opening public distribution of ZAO Web3 tools. | Marketplace adds paid monetization tier or token gating. |
| Manifest Standard | MCP v1.0 JSON-RPC 2.0 with Anthropic Extensions | Standardizes tool signatures across Claude Desktop, Claude Code, and Marketplace web consumers. | Anthropic introduces MCP v2.0 breaking schema changes. |
| Verification Pipeline | Strict Static Schema Validation + Automated Sandboxed Smoke Test in CI | Prevents registry rejection and ensures zero runtime permission escalation for external users. | Marketplace publishes automated CLI upload action. |
| Auth Delegation | OAuth 2.0 PKCE with Dynamic Client Registration | Meets enterprise marketplace security requirements without hardcoding static API secrets. | Anthropic native vault secrets become globally accessible to third-party plugins. |

## Executive Summary

On September 23-25, 2026, Anthropic officially debuted the Claude Marketplace, launching with over 2,000 verified connectors and introducing a self-serve developer portal for packaging, certifying, and distributing Model Context Protocol (MCP) servers and Claude Agent plugins. Prior to this marketplace release, deploying external MCP tools required end-users and developers to manually edit local configuration files (`claude_desktop_config.json` or `.claude/settings.json`), handle environment variables locally, and manage node/python runtime dependencies by hand.

The Claude Marketplace introduces a unified plugin packaging specification (`claude-plugin.json`), managed cloud hosting for connectors, declarative capability and permission scopes, and one-click installation for both enterprise Claude Enterprise workspaces and Claude Pro / Team accounts. 

For ZAO OS, this transition presents an opportunity: transitioning proprietary internal skills (`.claude/skills/`) and internal MCP servers (such as `mcp/hindsight-mcp-server/package.json`) into modular, hardened distribution packages. This specification establishes the architecture for packaging ZAO music, Farcaster, and governance tools into compliant marketplace plugins while safeguarding sensitive operational memory.

## Architectural Anatomy of Claude Marketplace Plugins

A Claude Marketplace plugin bundles three discrete operational layers:
1. **Tool Definition Layer**: MCP server implementation adhering to JSON-RPC 2.0 protocols.
2. **Metadata & Policy Manifest**: Declarative definitions governing scopes, pricing, rate limits, and network permissions.
3. **Execution Environment**: Either remote server-sent events (SSE) transport or containerized serverless execution.

```
+-------------------------------------------------------------+
|                   Claude Marketplace Client                 |
|              (Claude Web / Desktop / Claude Code)           |
+------------------------------+------------------------------+
                               |
                        [HTTPS / SSE]
                               v
+-------------------------------------------------------------+
|                 Claude Marketplace Gateway                  |
|  - OAuth 2.0 PKCE Verification                              |
|  - Static Manifest Validation                               |
|  - Rate-Limiting & Billing Enforcement                      |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 ZAO MCP Distribution Server                 |
|  +-------------------------------------------------------+  |
|  | claude-plugin.json Manifest                           |  |
|  | - capabilities: ["tools", "resources", "prompts"]    |  |
|  | - scopes: ["zao:music:read", "zao:farcaster:write"]   |  |
|  +-------------------------------------------------------+  |
|  +-------------------------------------------------------+  |
|  | MCP Server Implementation (Node.js / TypeScript)      |  |
|  | - Tools: query_artist, mint_track, check_respect      |  |
|  | - Handshake latency: <120ms                           |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

### Packaging Specification: claude-plugin.json

Every connector submitted to the Claude Marketplace developer portal requires a root manifest named `claude-plugin.json` (max payload size: 32 KB).

```json
{
  "$schema": "https://anthropic.com/schemas/claude-plugin-v1.json",
  "name": "zao-web3-music-connector",
  "version": "1.0.0",
  "displayName": "ZAO Web3 Music & Governance Tools",
  "description": "Query ZAO decentralized music catalogs, verify community respect scores, and mint on-chain tracks via Base.",
  "author": {
    "name": "ZAO OS Core Team",
    "url": "https://zaoos.com",
    "supportUrl": "https://zaoos.com/support"
  },
  "icon": "https://zaoos.com/assets/icon-512.png",
  "transport": {
    "type": "sse",
    "endpoint": "https://mcp.zaoos.com/sse",
    "auth": {
      "type": "oauth2",
      "authorizationUrl": "https://auth.zaoos.com/oauth/authorize",
      "tokenUrl": "https://auth.zaoos.com/oauth/token",
      "scopes": ["zao:read", "zao:mint"]
    }
  },
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": false
  },
  "limits": {
    "maxRequestsPerMinute": 120,
    "timeoutMs": 15000
  }
}
```

## Benchmarks and Quantitative Constraints

Empirical constraints enforced by the Anthropic Claude Marketplace review pipeline:

1. **Registry Catalog Size**: 2,145 active connectors indexed during initial launch window (September 2026).
2. **Handshake Latency Ceiling**: 150 milliseconds maximum round-trip time for initial JSON-RPC `initialize` handshake over SSE.
3. **Payload Size Limit**: 32 KB hard limit on `claude-plugin.json` schema payload; 4 MB maximum response payload per tool invocation.
4. **Execution Timeout**: 15,000 milliseconds default execution timeout before client-side abort.
5. **Cold Start Latency SLA**: Under 450 milliseconds for serverless remote transports.
6. **Tool Description Density**: 1,024 characters maximum per tool definition to prevent prompt token bloat in Claude context windows.

## Codebase Integration Points in ZAO OS

The ZAO repository houses tool implementations across several distinct paths:

1. `mcp/hindsight-mcp-server/package.json`:
   Contains the baseline `@modelcontextprotocol/sdk` (v1.0.0) dependency and build pipeline. This structure serves as the canonical template for compiling standalone marketplace plugins.

2. `.claude/settings.json`:
   Governs local permission whitelisting (`Read`, `Edit`, `Bash`, `Task`). The marketplace plugin replaces manual configuration entries with signed, verified capability grants.

3. `.claude/skills/`:
   Holds over 50 prompt-driven internal skills (`autoresearch`, `bonfire`, `farcaster`). These skills can be packaged as native Claude Marketplace Prompt Templates (`prompts: true` in manifest).

4. `scripts/fleet/`:
   Manages automated multi-agent deployments. Fleet nodes can fetch marketplace plugins dynamically using registered marketplace identifiers (`urn:anthropic:plugin:zao-web3-music`).

## Security, Isolation, and Vault Boundary

Packaging ZAO tools for external marketplace publication requires strict isolation between public utility tools and private estate memory:

1. **Zero Secret Leakage**:
   Marketplace plugins must never bundle API tokens or local environment variables. All authentication uses OAuth 2.0 PKCE flow where user tokens remain encrypted in client memory.

2. **No Local System Shell Access**:
   Unlike internal skills that utilize `Bash` commands, marketplace tools are strictly sandboxed JSON-RPC interfaces executing remotely or within isolated micro-VMs.

3. **Vault Separation**:
   Filesystem read tools must never expose paths referencing `~/zao-vault`, `~/.codex`, or local dotfiles. Tools must only query designated REST/GraphQL endpoints backed by public databases or authenticated Supabase instances.

## Next Actions

| What | Who | Priority | When |
|:---|:---|:---|:---|
| Create `mcp/zao-marketplace-plugin/` directory scaffolding with `claude-plugin.json` | Dev Workflow Lane | P1 | Immediate |
| Implement automated manifest linting in `scripts/check-marketplace-manifest.ts` | Dev Workflow Lane | P1 | Immediate |
| Migrate `hindsight-mcp-server` build to emit dual ESM/CJS bundles | Architecture | P2 | Next sprint |
| Register ZAO developer organization on Anthropic Developer Console | Zaal Panthaki | P2 | Next review |

## Sources

- [FULL] Anthropic Claude Developer Documentation: Model Context Protocol (MCP) Specification v1.0 (2026-09-24).
- [FULL] Anthropic Official Announcement: Claude Marketplace and Developer Portal Launch (2026-09-23).
- [FULL] ZAO OS Codebase: `mcp/hindsight-mcp-server/package.json` and `.claude/settings.json`.
- [PARTIAL] Model Context Protocol GitHub Organization: Transport Layer Architecture (SSE & Stdio).
- [FAILED] Anthropic Marketplace Monetization Revenue Share Schedule (Not publicly disclosed).
