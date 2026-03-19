# ZAO CEO Tools

## Paperclip API (Primary)

All coordination happens through the Paperclip REST API at `http://localhost:3100/api`.

| Endpoint | Purpose |
|----------|---------|
| `GET /api/agents/me` | Check identity, role, budget |
| `GET /api/companies/{id}/issues` | List tasks |
| `POST /api/issues/{id}/checkout` | Lock a task before working |
| `POST /api/companies/{id}/issues` | Create subtasks / delegate |
| `POST /api/cost-events` | Report spending |
| `POST /api/approvals` | Request board approval (hires, strategy) |

Always include `X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID` on mutating calls.

## Claude Code (Execution)

You run as a Claude Code agent. Available tools:
- **Read/Write/Edit** — file operations
- **Bash** — shell commands (with safety constraints)
- **Grep/Glob** — codebase search
- **WebSearch/WebFetch** — external research
- **Agent** — dispatch sub-agents for parallel work

## ZAO OS Codebase

| What | Where |
|------|-------|
| Project root | `/Users/zaalpanthaki/Documents/ZAO OS V1` |
| App code | `src/` (Next.js 16 App Router) |
| API routes | `src/app/api/` |
| Components | `src/components/` |
| Config | `community.config.ts` |
| Research | `research/` (67 docs) |
| Scripts | `scripts/` |
| Database | Supabase (PostgreSQL + RLS) |

## Development Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
```

## Skills Available

| Skill | Purpose |
|-------|---------|
| `/zao-research` | Search 67 research docs + codebase, conduct new research |
| `/autoresearch` | Autonomous improvement loop for any measurable target |
| `/autoresearch:fix` | Crush errors to zero |
| `/autoresearch:security` | OWASP/STRIDE security audit |
| `/next-best-practices` | Next.js 16 patterns and conventions |

## External APIs (via ZAO OS)

| Service | SDK | Purpose |
|---------|-----|---------|
| Neynar | `@neynar/nodejs-sdk` | Farcaster casts, users, channels |
| Supabase | `@supabase/supabase-js` | Database, auth, realtime |
| XMTP | `@xmtp/browser-sdk` | Encrypted DMs and groups |
| Wagmi + Viem | `wagmi`, `viem` | Blockchain reads (Optimism, Base) |

## Partner Platforms (External, link-only for now)

| Platform | URL | What |
|----------|-----|------|
| Incented | `incented.co/organizations/zabal` | Community campaigns |
| SongJam | `songjam.space/zabal` | Mention leaderboard |
| Empire Builder | `empirebuilder.world/profile/0x7234c...` | Token empire |
| MAGNETIQ | `app.magnetiq.xyz` | Proof of Meet hub |
| Clanker | `clanker.world` | $ZABAL token launcher |

## Memory

- Daily notes: `$AGENT_HOME/memory/YYYY-MM-DD.md`
- Knowledge: `$AGENT_HOME/life/` (PARA structure)
- Facts: extracted via `para-memory-files` skill
- Research: `research/` directory (67 docs, searchable via Grep)

(Add notes about new tools as you acquire and use them.)
