# 232 — MCP Server Development Guide

> **Status:** Research complete
> **Date:** March 31, 2026
> **Goal:** Document the MCP protocol, SDK, and best practices — with ZAO OS's existing MCP server as the baseline

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **SDK version** | UPGRADE `@modelcontextprotocol/sdk` from `^1.0.0` to `^1.29.0` in `src/mcp/zao-api/package.json` — fixes null TTL validation, adds extensions support |
| **Transport** | KEEP stdio for local dev (Claude Desktop/Claude Code). ADD Streamable HTTP endpoint for remote access (replaces deprecated SSE transport as of March 2026) |
| **Auth (remote)** | USE OAuth 2.1 — mandatory for HTTP-based transports per March 2026 spec. Not needed for stdio |
| **Resources** | ADD MCP Resources to expose community data read-only (member profiles, track catalog, governance proposals) — currently only tools are implemented |
| **Prompts** | ADD MCP Prompts for common ZAO workflows (summarize governance proposal, analyze member activity, draft cast) |
| **Error handling** | ZAO MCP server error handling is solid (`MCPError` class + `handleError` in `src/mcp/zao-api/src/lib/errors.ts`). ADD `isError: true` flag on error responses per SDK convention |
| **Registry** | PUBLISH `@zao/zao-api-mcp` to Smithery.ai once HTTP transport is added — 2,000+ MCP servers listed there, biggest discovery channel |
| **Existing Farcaster MCP** | EVALUATE `kaiblade/farcaster-mcp` (GitHub) for cast fetching patterns, but ZAO's server already has more tools (8 vs ~4). Don't adopt, keep building on ours |

## What MCP Is

Model Context Protocol (MCP) is an open protocol (by Anthropic) that standardizes how AI models connect to external tools and data. Three actors:

- **Host**: The application running the AI (Claude Desktop, IDE, chat UI)
- **Client**: Lives inside the host, manages connections to MCP servers
- **Server**: Lightweight process exposing capabilities over JSON-RPC

The AI never talks directly to your database. It talks to the MCP Client, which talks to your Server, which talks to the database.

### Three Primitives

| Primitive | Purpose | ZAO Status |
|-----------|---------|------------|
| **Tools** | Actions the AI can invoke (side effects, dynamic data) | 8 tools implemented |
| **Resources** | Read-only data identified by URI | Not yet implemented |
| **Prompts** | Reusable prompt templates with dynamic args | Not yet implemented |

## Comparison of MCP vs Alternatives

| Approach | Standardized | Discoverable | Sandboxed | Composable | ZAO Fit |
|----------|-------------|-------------|-----------|------------|---------|
| **MCP** | One spec, any client | Runtime tool advertisement | Separate process, controlled access | Multiple servers compose | Already using it (8 tools) |
| **Function Calling** | Per-provider (OpenAI vs Anthropic vs Google) | Manual registration | Same process as host | Per-app only | Locks into one AI provider |
| **Custom REST API** | HTTP standards | OpenAPI spec (manual) | Network boundary | Any HTTP client | Would work but no AI-native discovery |
| **LangChain Tools** | LangChain-specific | LangChain registry | Same process | LangChain agents only | Python-first, ZAO is TypeScript |

MCP wins for ZAO: already implemented, provider-agnostic (works with Claude, GPT, Gemini), and the 8 existing tools cover the core data model.

## ZAO OS Integration

### What's Already Built

ZAO OS has a working MCP server at `src/mcp/zao-api/`:

```
src/mcp/zao-api/
├── package.json              # @modelcontextprotocol/sdk ^1.0.0
├── src/
│   ├── index.ts              # Server setup, stdio transport
│   ├── lib/
│   │   ├── errors.ts         # MCPError class + handleError
│   │   └── supabase.ts       # Supabase client
│   ├── tools/
│   │   ├── index.ts          # 8 tools + handlers registry
│   │   ├── get_profile.ts    # User profile by FID
│   │   ├── get_casts.ts      # User casts by FID
│   │   ├── get_respect_score.ts
│   │   ├── get_community_members.ts
│   │   ├── get_recents.ts    # Community casts (last N hours)
│   │   ├── search_casts.ts
│   │   ├── get_room_history.ts
│   │   └── get_proposals.ts  # ZOUNZ governance proposals
│   └── types/
│       └── index.ts
└── tsconfig.json
```

The server uses stdio transport, defines 8 tools covering profiles, casts, respect, members, rooms, and governance. Each tool handler queries Supabase with a 10-second timeout via `Promise.race`.

### What to Add Next

1. **Resources** — Expose read-only data:
   - `zao://members` — community member list
   - `zao://tracks/popular` — top tracks by respect-weighted curation (`src/lib/music/curationWeight.ts`)
   - `zao://governance/active` — active proposals
   - `zao://config` — community config from `community.config.ts`

2. **Prompts** — Reusable templates:
   - `summarize_proposal` — Summarize a governance proposal for community discussion
   - `draft_cast` — Draft a Farcaster cast about ZAO activity
   - `analyze_member` — Generate a member activity summary

3. **Streamable HTTP transport** — For remote agent access (e.g., Paperclip agents at `paperclip.zaoos.com`)

## MCP Architecture Deep Dive

### Transport Layers

| Transport | Use Case | Auth Required | ZAO Status |
|-----------|----------|--------------|------------|
| **stdio** | Local tools, CLI, Claude Desktop | No | Implemented |
| **Streamable HTTP** (new, March 2026) | Remote servers, multi-user, web deploy | OAuth 2.1 mandatory | Not yet |
| **HTTP+SSE** (deprecated) | Legacy remote connections | Yes | Skip — deprecated |

**Streamable HTTP** replaced SSE in the March 2026 spec update (protocol version 2025-03-26). Key advantages:
- Stateless — no always-on connections required
- Single endpoint (e.g., `https://api.zaoos.com/mcp`)
- POST for client requests, GET for server-initiated SSE streams
- Optional session IDs via `Mcp-Session-Id` header
- Resumable via `Last-Event-ID` header

### SDK Setup (TypeScript)

```bash
npm install @modelcontextprotocol/sdk    # v1.29.0 (latest, March 2026)
```

Server skeleton (ZAO's existing pattern):

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'zao-api', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);

// List tools (the "menu")
server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));

// Execute tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const handler = toolHandlers[request.params.name];
  if (!handler) throw new Error(`Unknown tool: ${request.params.name}`);
  const result = await handler(request.params.arguments ?? {});
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Adding Resources (read-only data)

```typescript
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    { uri: 'zao://members', name: 'Community Members', mimeType: 'application/json' },
    { uri: 'zao://config', name: 'Community Config', mimeType: 'application/json' },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  switch (req.params.uri) {
    case 'zao://members': {
      const { data } = await supabase.from('profiles').select('fid, username, display_name');
      return { contents: [{ uri: req.params.uri, mimeType: 'application/json', text: JSON.stringify(data) }] };
    }
    // ... more resources
  }
});
```

### Adding Prompts (reusable templates)

```typescript
import { ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [{
    name: 'summarize_proposal',
    description: 'Summarize a ZOUNZ governance proposal',
    arguments: [{ name: 'proposal_id', required: true }],
  }],
}));

server.setRequestHandler(GetPromptRequestSchema, async (req) => {
  const { proposal_id } = req.params.arguments!;
  const proposal = await fetchProposal(proposal_id);
  return {
    messages: [{
      role: 'user',
      content: { type: 'text', text: `Summarize this governance proposal for the ZAO community:\n\n${proposal.body}` },
    }],
  };
});
```

### Streamable HTTP Transport (for remote deployment)

```typescript
import express from 'express';
// New: Streamable HTTP replaces SSEServerTransport
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamablehttp.js';

const app = express();
app.use(express.json());

// Single MCP endpoint handles both POST (client requests) and GET (server-initiated SSE)
app.all('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

app.listen(3001);
```

## MCP Spec Evolution (2026)

| Feature | Spec Version | Status | ZAO Relevance |
|---------|-------------|--------|---------------|
| Tools, Resources, Prompts | 2024-11-05 | Stable | Already using tools |
| Sampling (server-initiated LLM calls) | 2025-11-25 | Stable | Future: AI agent initiates follow-up reasoning |
| Roots (filesystem boundaries) | 2025-11-25 | Stable | Low priority |
| Elicitation (server asks user for info) | 2025-11-25 | Stable | Future: interactive governance flows |
| Streamable HTTP transport | 2025-03-26 | Stable | IMPLEMENT for remote agents |
| OAuth 2.1 authorization | 2025-03-26 | Mandatory for HTTP | IMPLEMENT with HTTP transport |
| Tasks (async long-running workflows) | 2025-11-25 | Experimental | Future: background music indexing, batch operations |
| Progress/Cancellation | 2025-11-25 | Stable | ADD to long-running tools |

## Production Best Practices

### Security

1. **Never use `console.log` with stdio** — stdout is the MCP message channel. Use `console.error` for logging (goes to stderr)
2. **Validate all tool inputs** — ZAO already does this with type checks in each handler
3. **Sandbox file access** — Use `path.resolve()` + prefix check for any file-reading tools
4. **OAuth 2.1 for HTTP** — Mandatory per spec. MCP servers are OAuth Resource Servers
5. **Validate `Origin` header** — Prevent DNS rebinding attacks on local servers
6. **Bind to 127.0.0.1** — Never 0.0.0.0 for local servers

### Error Handling

```typescript
// ZAO's existing pattern (good), add isError flag:
try {
  const result = await handler(args);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
} catch (err) {
  const { error, code } = handleError(err);
  return { content: [{ type: 'text', text: JSON.stringify({ error, code }) }], isError: true };
}
```

### Debugging

```bash
# MCP Inspector — test tools without Claude
npx @modelcontextprotocol/inspector node dist/index.js

# Claude Desktop config (macOS)
# ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "zao-api": {
      "command": "node",
      "args": ["/absolute/path/to/src/mcp/zao-api/dist/index.js"]
    }
  }
}
```

### Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| "Server not found" | Relative path in config | Use absolute path starting with `/` |
| stdout corruption | `console.log` in stdio server | Use `console.error` instead |
| Wrong args from AI | Vague input schema descriptions | Add examples in description strings |
| Connection drops | No timeout handling | ZAO already has 10s `Promise.race` timeout (good) |
| Schema mismatch | SDK version drift | Upgrade to `^1.29.0` |

## MCP Ecosystem & Registries

| Registry | Size | URL | Notes |
|----------|------|-----|-------|
| **Smithery.ai** | 2,000+ servers | smithery.ai | Largest community registry, search by tags |
| **Official Registry** | Growing | registry.modelcontextprotocol.io | By MCP contributors |
| **mcpservers.org** | 500+ | mcpservers.org | "Awesome MCP Servers" list |
| **glama.ai** | 300+ | glama.ai/mcp/servers | Curated collection |
| **PulseMCP** | 200+ | pulsemcp.com | Discovery platform |
| **mcp.so** | 400+ | mcp.so | MCP portal |

### Farcaster/Web3 MCP Servers

| Server | Focus | Repo/URL | ZAO Relevance |
|--------|-------|----------|---------------|
| **kaiblade/farcaster-mcp** | Farcaster casts, channels | github.com/kaiblade/farcaster-mcp | ZAO's server already more complete (8 tools vs ~4) |
| **Beyond Social MCP** | Full Farcaster integration | Beyond Network AI | Evaluate for patterns |
| **DeMCP** | Decentralized MCP network | github.com/demcp/awesome-web3-mcp-servers | SSE proxies with TEE, interesting for trust |
| **Related Identity MCP** | Cross-chain identity (ETH, FC, Lens, ENS) | Community | Future: ENS subname integration |

## Implementation Roadmap for ZAO

| Phase | What | Files | Priority |
|-------|------|-------|----------|
| 1 | Upgrade SDK to `^1.29.0` | `src/mcp/zao-api/package.json` | High |
| 2 | Add `isError: true` to error responses | `src/mcp/zao-api/src/index.ts` | High |
| 3 | Add Resources (members, tracks, config) | `src/mcp/zao-api/src/resources/` | Medium |
| 4 | Add Prompts (summarize, draft, analyze) | `src/mcp/zao-api/src/prompts/` | Medium |
| 5 | Add Streamable HTTP transport | `src/mcp/zao-api/src/transports/http.ts` | Medium |
| 6 | Publish to Smithery.ai | README + smithery config | Low |

## Sources

- [MCP Specification (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25) — Full protocol spec
- [MCP Transports (2025-03-26)](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports) — Streamable HTTP spec
- [@modelcontextprotocol/sdk v1.29.0 (npm)](https://www.npmjs.com/package/@modelcontextprotocol/sdk) — TypeScript SDK
- [TypeScript SDK Releases (GitHub)](https://github.com/modelcontextprotocol/typescript-sdk/releases) — Changelog
- [MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices) — Production security guide
- [2026 MCP Roadmap](https://thenewstack.io/model-context-protocol-roadmap-2026/) — Enterprise readiness priorities
- [Smithery.ai](https://smithery.ai/) — Largest MCP server registry (2,000+ servers)
- [kaiblade/farcaster-mcp](https://github.com/kaiblade/farcaster-mcp) — Farcaster MCP reference
- [@techwith_ram MCP Guide (X, March 24, 2026)](https://x.com/techwith_ram) — Source tutorial for this research
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) — Debug tool for testing MCP servers
