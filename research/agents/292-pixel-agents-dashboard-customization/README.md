# 292 — Pixel Agents Dashboard Customization for ZAO OS

> **Status:** Research complete
> **Date:** 2026-04-06
> **Goal:** Make pixels.zaoos.com interactive — click-to-dispatch, ZAO branding, Supabase integration

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Click-to-dispatch** | ALREADY BUILT in `server/spawner.ts` + `SpawnChat.tsx` — just add agents to `spawnable` config array |
| **Activity bubbles** | ALREADY BUILT in `ActivityBubble.tsx` — shows tool status, last chat message. Just works. |
| **Supabase bridge** | BUILD a `supabaseWatcher.ts` alongside `sessionWatcher.ts` — subscribe to `agent_events` Realtime for richer data |
| **ZAO branding** | MODIFY `src/App.tsx` title + `src/index.css` colors — navy #0a1628, gold #f5a623 |
| **Agent config** | UPDATE `dashboard.config.json` — add all 8 agents to `spawnable` array |
| **Competing tools** | SKIP Star-Office-UI (Python), SKIP Agent Town (Phaser, heavy). BORROW heartbeat API pattern from Miniverse (228 stars) |

## What's Already Built (Hidden Features)

The OpenClaw fork has more than we realized. These features are **already in the codebase** but weren't configured:

| Feature | File | Status |
|---------|------|--------|
| Task spawning via gateway | `server/spawner.ts` | Built — invokes `/tools/invoke` with `sessions_spawn` |
| Mini-chat per agent | `src/components/SpawnChat.tsx` | Built — message bubbles, thinking indicator |
| Activity bubbles | `src/components/ActivityBubble.tsx` | Built — hover/click to show current task |
| Session info panel | `src/components/SessionInfoPanel.tsx` | Built — click agent to inspect |
| Channel badges | `src/hooks/useOpenClawEvents.ts` | Built — telegram/discord/cron icons |
| Hardware monitoring | `server/hardware.ts` | Built — CPU/GPU/RAM/disk via `/api/hardware` |
| Service controls | REST API | Built — restart gateway via `/api/restart/:id` |
| Day/night cycle | Config flag | Built — `features.dayNightCycle: true` |
| Conversation heat glow | Config flag | Built — `features.conversationHeat: true` |
| Custom office layouts | `/api/layout` | Built — save/load JSON layouts |
| Door animation | Config flag | Built — agents enter/exit through door |

## Comparison of Agent Visualization Tools

| Tool | Stars | Tech | Click-to-Dispatch | Self-Host | ZAO Fit |
|------|-------|------|-------------------|-----------|---------|
| **OpenClaw Pixel Agents** (current) | 2 | Node+React+Canvas | YES (built-in) | YES (running) | Best — already deployed |
| **Original Pixel Agents** | 6,191 | VS Code+React | No | VS Code only | No — wrong platform |
| **Miniverse** | 228 | Node+Canvas | YES (heartbeat API) | YES | Good pattern to borrow |
| **Agent Town** | 109 | Next.js+Phaser+Tiled | YES (RPG-style) | YES | Over-engineered for 8 agents |
| **Star-Office-UI** | 6,539 | Python+Flask | No | YES | Wrong stack (Python) |
| **Agent Office** | 43 | Colyseus+Phaser+Ollama | YES | YES | Heavy — autonomous think loops |
| **Cursor Office** | 37 | Canvas | No | VS Code only | Great interactive objects, wrong platform |

## ZAO OS Integration

### Immediate Fix (5 minutes): Enable Click-to-Dispatch

Update `dashboard.config.json` on VPS at `/home/node/openclaw-workspace/pixel-dashboard/dashboard.config.json`:

```json
{
  "spawnable": ["zoey", "builder", "scout", "wallet", "caster", "rolo"]
}
```

This enables the existing `SpawnChat.tsx` component for 6 agents (ZOE stays non-spawnable as the orchestrator, FISHBOWLZ blocked on HMS).

The spawn flow:
1. Click agent character → SessionInfoPanel opens
2. Click "Send Task" → SpawnChat opens
3. Type message → `POST /api/spawn` → `spawner.ts` calls gateway → agent receives task
4. Response streams back via WebSocket → shows in SpawnChat bubbles

### Phase 2: Supabase Event Bridge

Create `server/supabaseWatcher.ts` that subscribes to the `agent_events` table via Supabase Realtime:

```typescript
// Subscribe to new events
const channel = supabase
  .channel('agent-events')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_events' },
    (payload) => {
      const event = payload.new;
      // Map to DashboardEvent format
      broadcast({ type: mapEventType(event.event_type), agent: event.agent_name, ... });
    }
  )
  .subscribe();
```

This would show events from ALL sources (Telegram, cron, manual dispatch) not just JSONL sessions.

Files to modify:
- `server/index.ts` — add Supabase client initialization
- `server/supabaseWatcher.ts` — new file, Realtime subscription
- `server/config.ts` — add `supabase.url` and `supabase.key` config

### Phase 3: ZAO Branding

Modify in `src/App.tsx`:
- Replace "THE STATION HOUSE" with "ZAO HQ"
- Replace "AGENT OPERATIONS CENTER" with "AGENT SQUAD"

Modify in `src/index.css`:
- `--color-primary: #f5a623` (ZAO gold)
- `--color-bg: #0a1628` (ZAO navy)

### Phase 4: Enhanced Features (from competing tools)

**From Cursor Office:** Interactive office objects — lamp toggle, arcade games, celebration animations when tasks complete. All drawn from code (27KB total, zero image files).

**From Miniverse:** Framework-agnostic heartbeat API — any system can POST agent status. Pattern:
```
POST /api/heartbeat  { "agent": "scout", "state": "working", "task": "ERC-8004 research" }
```

**From Agent Town:** RPG-style task assignment — walk up to agent, press E, type task. More immersive but heavier.

### Existing Dashboard Cross-Reference

The admin dashboard at `/admin` → Squad tab (`src/components/admin/agents/`) provides a complementary view:
- SquadCircle: orbital graph showing agent relationships
- WarRoomFeed: chronological event log with filters  
- PipelineFlow: task chain visualization
- Agent colors defined in `src/components/admin/agents/constants.ts`

Pixel Agents is the "fun" visual layer; the admin dashboard is the "data" layer. Both read from the same `agent_events` Supabase table.

## Sources

- [OpenClaw Pixel Agents Fork](https://github.com/jaffer1979/openclaw-pixel-agents-dashboard) — MIT, 2 stars
- [Original Pixel Agents](https://github.com/pablodelucca/pixel-agents) — MIT, 6,191 stars
- [Miniverse](https://github.com/ianscott313/miniverse) — MIT, 228 stars
- [Agent Town](https://github.com/geezerrrr/agent-town) — MIT, 109 stars
- [Star-Office-UI](https://github.com/ringhyacinth/Star-Office-UI) — MIT, 6,539 stars
- [Agent Office](https://github.com/harishkotra/agent-office) — MIT, 43 stars
- [Cursor Office](https://github.com/ofershap/cursor-office) — MIT, 37 stars
