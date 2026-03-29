# Phase 3: zao-api MCP Server

**Issue:** #14  
**Repo:** bettercallzaal/ZAOOS  
**Reference:** Research doc 197 (MCP integration), doc 042 (Supabase patterns)  
**Branch:** `feat/zao-api-mcp`

---

## 1. Overview

The zao-api MCP server exposes ZAO OS community data to OpenClaw agents via the Model Context Protocol (MCP). It uses `@modelcontextprotocol/sdk` and queries Supabase (and optionally Neynar) to serve structured data through 8 defined tools.

---

## 2. MCP Server Architecture

### 2.1 Directory Layout

```
zao-api/
├── src/
│   ├── index.ts              # Entry point — creates MCP server
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   ├── get_profile.ts
│   │   ├── get_casts.ts
│   │   ├── get_respect_score.ts
│   │   ├── get_community_members.ts
│   │   ├── get_recents.ts
│   │   ├── search_casts.ts
│   │   ├── get_room_history.ts
│   │   └── get_proposals.ts
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client (service role)
│   │   ├── neynar.ts         # Neynar API client
│   │   └── errors.ts         # Standard error helpers
│   └── types/
│       └── index.ts          # Shared TypeScript types
├── package.json
├── tsconfig.json
└── dist/                     # Build output
```

### 2.2 Entry Point (`src/index.ts`)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { tools, toolHandlers } from "./tools/index.js";

const server = new Server(
  { name: "zao-api", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = toolHandlers[name];
  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }
  try {
    return { content: [{ type: "text", text: JSON.stringify(await handler(args)) }] };
  } catch (err: any) {
    return { error: err.message };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2.3 Build Tool

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## 3. Tool Definitions

### Tool 1: `get_profile`

**Input:** `{ fid: string }`

**Output:**
```json
{
  "fid": "12345",
  "username": "zaal_music",
  "display_name": "Zaal",
  "bio": "Music producer & ZAO co-founder",
  "avatar_url": "https://avatars.farcaster.id/12345",
  "created_at": "2024-01-15T12:00:00Z"
}
```

---

### Tool 2: `get_casts`

**Input:** `{ fid: string, limit?: number }` — default limit: 20, max: 100

**Output:**
```json
{
  "casts": [
    {
      "hash": "0xabc123",
      "text": "New track dropping tonight 🎵",
      "timestamp": "2026-03-28T22:00:00Z",
      "reactions": { "likes": 42, "recasts": 7 },
      "reply_count": 5
    }
  ]
}
```

---

### Tool 3: `get_respect_score`

**Input:** `{ fid: string }`

**Output:**
```json
{
  "fid": "12345",
  "respect_score": 1847,
  "rank": 3,
  "weekly_delta": +120,
  "all_time_total": 12450
}
```

---

### Tool 4: `get_community_members`

**Input:** `{ limit?: number }` — default: 20, max: 100

**Output:**
```json
{
  "members": [
    {
      "fid": "12345",
      "username": "zaal_music",
      "display_name": "Zaal",
      "respect_score": 1847,
      "role": "artist",
      "joined_at": "2024-01-15T12:00:00Z",
      "is_active": true
    }
  ],
  "total": 38
}
```

---

### Tool 5: `get_recents`

**Input:** `{ hours?: number }` — default: 24, max: 168 (7 days)

**Output:**
```json
{
  "casts": [
    {
      "fid": "12345",
      "username": "zaal_music",
      "text": "New track dropping tonight 🎵",
      "timestamp": "2026-03-28T22:00:00Z",
      "reactions": { "likes": 42 }
    }
  ],
  "count": 156
}
```

---

### Tool 6: `search_casts`

**Input:** `{ query: string }`

**Output:**
```json
{
  "casts": [
    {
      "fid": "12345",
      "username": "zaal_music",
      "text": "Looking for collaborators on a new beat",
      "timestamp": "2026-03-27T18:00:00Z",
      "relevance_score": 0.95
    }
  ],
  "total": 12
}
```

---

### Tool 7: `get_room_history`

**Input:** `{ limit?: number }` — default: 10, max: 50

**Output:**
```json
{
  "rooms": [
    {
      "id": "room_001",
      "title": "Late Night Beat Session",
      "host_fid": "12345",
      "started_at": "2026-03-28T20:00:00Z",
      "ended_at": "2026-03-28T23:00:00Z",
      "participant_count": 14,
      "max_participants": 20
    }
  ]
}
```

---

### Tool 8: `get_proposals`

**Input:** `{ status?: "open" | "closed" | "all" }` — default: "all"

**Output:**
```json
{
  "proposals": [
    {
      "id": "prop_042",
      "title": "Add beat-battle governance layer",
      "status": "open",
      "votes_for": 24,
      "votes_against": 3,
      "created_at": "2026-03-20T00:00:00Z",
      "ends_at": "2026-04-03T00:00:00Z",
      "author_fid": "12345"
    }
  ]
}
```

---

## 4. Data Sources

### 4.1 Supabase Tables

| Tool | Table | Query |
|------|-------|-------|
| `get_profile` | `profiles` | `SELECT fid, username, display_name, bio, avatar_url, created_at FROM profiles WHERE fid = $1` |
| `get_casts` | `casts` | `SELECT hash, text, timestamp, reactions, reply_count FROM casts WHERE fid = $1 ORDER BY timestamp DESC LIMIT $2` |
| `get_respect_score` | `respect_scores` | `SELECT fid, respect_score, rank, weekly_delta, all_time_total FROM respect_scores WHERE fid = $1` |
| `get_community_members` | `profiles` + `respect_scores` | Join, filter `is_active = true`, order by respect_score DESC |
| `get_recents` | `casts` | `SELECT fid, username, text, timestamp, reactions FROM casts WHERE timestamp > now() - interval '$1 hours' ORDER BY timestamp DESC` |
| `search_casts` | `casts` | `SELECT fid, username, text, timestamp FROM casts WHERE text ILIKE '%' || $1 || '%' ORDER BY timestamp DESC LIMIT 50` |
| `get_room_history` | `audio_rooms` | `SELECT id, title, host_fid, started_at, ended_at, participant_count, max_participants FROM audio_rooms ORDER BY started_at DESC LIMIT $1` |
| `get_proposals` | `proposals` | `SELECT * FROM proposals WHERE status = $1 OR $1 = 'all' ORDER BY created_at DESC` |

### 4.2 Neynar API (Optional Fallback)

For profile data, if Supabase has no record:
```
GET https://api.neynar.com/v2/farcaster/user/by-fid?fid={fid}
Headers: { "x-api-key": $NEYNAR_API_KEY }
```

---

## 5. Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client — server-side ONLY. Never expose to clients.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});
```

### 5.1 Row-Level Security (RLS)

Since this server uses the **service role key**, RLS is bypassed. This is intentional — the MCP server is a trusted backend service.

**Requirement:** The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to MCP clients. It lives only in the server environment.

### 5.2 Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEYNAR_API_KEY=your-neynar-key  # optional
```

---

## 6. Error Handling

### 6.1 Standard Error Response

```typescript
// src/lib/errors.ts
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
    this.name = "MCPError";
  }
}

export function handleError(err: unknown): { error: string; code: string } {
  if (err instanceof MCPError) {
    return { error: err.message, code: err.code };
  }
  return { error: "Internal server error", code: "INTERNAL_ERROR" };
}
```

### 6.2 Rate Limiting

- **Per-IP:** 100 requests/minute (enforced at infrastructure level, e.g., nginx or API Gateway)
- **Per-tool:** No strict limit, but queries are paginated to prevent abuse
- **Timeout:** 10-second timeout per Supabase query

### 6.3 Timeout Handling

```typescript
const result = await Promise.race([
  supabase.from("casts").select("*").eq("fid", fid),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new MCPError("Query timeout", "TIMEOUT", 504)), 10000)
  )
]);
```

---

## 7. OpenClaw Integration

### 7.1 Config Addition

Add to OpenClaw config (`~/.openclaw/config.json` or equivalent):

```json
{
  "plugins": {
    "entries": {
      "mcp": {
        "servers": {
          "zao-api": {
            "command": "node",
            "args": ["/path/to/zao-api/dist/index.js"],
            "env": {
              "SUPABASE_URL": "https://your-project.supabase.co",
              "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
            }
          }
        }
      }
    }
  }
}
```

### 7.2 Verifying Integration

After adding the config, test with:

```bash
# Check OpenClaw recognizes the server
openclaw mcp list

# Test a tool directly
openclaw mcp call zao-api get_profile '{"fid":"12345"}'
```

---

## 8. Testing Plan

### 8.1 Unit Tests

```bash
npm test
```

Test each tool handler in isolation with mocked Supabase responses.

### 8.2 Integration Test

1. Start the MCP server locally:
   ```bash
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node dist/index.js
   ```

2. Use the MCP inspector or a test script to call each tool:
   ```typescript
   // test.ts
   import { Client } from "@modelcontextprotocol/sdk/client/index.js";
   
   const client = new Client({ name: "test", version: "1.0.0" });
   await client.connectToServer("node", ["dist/index.js"], {
     env: { SUPABASE_URL: "...", SUPABASE_SERVICE_ROLE_KEY: "..." }
   });
   
   const result = await client.callTool("get_profile", { fid: "12345" });
   console.log(result);
   ```

### 8.3 OpenClaw Integration Test

1. Add server to OpenClaw config
2. Ask Zaal to verify via Telegram: `@openclaw mcp call zao-api get_profile {"fid":"12345"}`
3. Check logs for errors: `openclaw logs --tail 50`

---

## 9. Deployment

### 9.1 Option A: Node Process (Recommended for MVP)

Build and run as a long-lived process:

```bash
npm run build
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node dist/index.js
```

**Pros:** Simple, low latency  
**Cons:** No auto-restart on crash

Use a supervisor (systemd, PM2) for production:
```bash
pm2 start dist/index.js --name zao-api
```

### 9.2 Option B: Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY dist ./dist
COPY package.json .
RUN npm ci --production
CMD ["node", "dist/index.js"]
```

```bash
docker build -t zao-api:latest .
docker run -d \
  --name zao-api \
  -e SUPABASE_URL=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  zao-api:latest
```

### 9.3 Option C: Vercel Serverless (Not Recommended)

MCP servers require persistent connections (stdio), which conflicts with Vercel's stateless request model. **Avoid for MCP workloads.**

---

## 10. Acceptance Criteria

- [ ] All 8 tools return correctly shaped JSON
- [ ] Supabase queries are parameterized (no SQL injection)
- [ ] Service role key is server-side only
- [ ] Errors return standard `{ error, code }` format
- [ ] MCP server starts without errors
- [ ] OpenClaw config example is valid JSON
- [ ] Unit tests cover all 8 tool handlers
- [ ] Build produces `dist/index.js`

---

## 11. Related Research Docs

- Research doc 197: MCP integration patterns
- Research doc 042: Supabase query patterns and RLS setup
