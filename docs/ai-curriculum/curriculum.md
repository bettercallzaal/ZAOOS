# ZAO OS Daily Learning - Dynamic Curriculum

ZOE delivers one learning task daily at 7 AM ET. NOT a fixed 30-day sequence.
Instead, ZOE looks at what Zaal worked on recently and surfaces something
relevant from the codebase or research library he hasn't explored yet.

## How It Works

ZOE follows this process every morning:

1. **Check recent work** - `git log --since='24 hours ago' --oneline` to see what changed
2. **Find the theme** - what area was the work in? (music, governance, agents, infra, etc.)
3. **Search research library** - grep `research/*/README.md` for related docs Zaal might not have read
4. **Search codebase** - find related features, routes, or components that connect to yesterday's work
5. **Pick ONE thing** that's either:
   - A research doc related to yesterday's work that Zaal hasn't read recently
   - A feature in the codebase connected to yesterday's work that's untested or underused
   - A config in `community.config.ts` related to yesterday's area that might need attention
   - A discrepancy between what research says and what the code does
   - An integration (Twitch, Bluesky, Arweave, Hats, etc.) related to the area that hasn't been verified
6. **Check the journal** - don't repeat something already delivered in the last 14 days

## Output Format

```
ZOE DAILY LEARNING

Based on yesterday's work: [1-sentence summary of recent commits]

TODAY: [Title]

Explore: [specific file path or research doc]

Context: [2-3 sentences on why this connects to yesterday's work
and why it's worth exploring today]

Try this:
1. [Specific action - read this file, check this config, test this route]
2. [Follow-up action]
3. [What to look for or verify]

What I found: [ZOE's own finding from reading the actual file/doc]
```

## Categories ZOE Can Pull From

### Codebase Deep Dives (274 API routes, 270 components, 19 hooks)
- Untested routes connected to yesterday's feature area
- Components that exist but aren't wired into the UI
- Hooks that might be dormant (`useLensAuth`, `useAutoStreamMarker`, etc.)
- Config features in `community.config.ts` that are set but unused

### Research Library (348+ docs across 14 topics)
- Docs in the same topic folder as yesterday's work
- Cross-topic connections (e.g., worked on music -> doc about Arweave music storage)
- Aspirational features described in research but not yet built
- Discrepancies between research and actual code

### Integration Health Checks
- Twitch (6 routes, 0 tests), Bluesky (4 routes), ZOUNZ DAO, Snapshot
- Hats Protocol roles, 100ms vs Stream.io, RTMP broadcast
- Farcaster Mini App SDK (11 implementation gaps per Doc 250)
- Cross-platform publish pipeline (3 active, 2 deferred)

### Agent Squad Awareness
- What did ZOE/SCOUT/CASTER/ROLO/STOCK produce yesterday?
- Agent event logs in Supabase `agent_events` table
- VPS health, Cloudflare tunnel status

### Skills & Workflow
- Skills that exist but Zaal hasn't used in 2+ weeks
- Workflow patterns from research (Doc 296: agentic workflow optimization)
- Tools installed but not yet tried (Graphify, wiki-skills, last30days, etc.)

## Rules for ZOE

- NEVER repeat a topic from the last 14 journal entries
- ALWAYS read the actual file/doc before delivering - add a real finding
- Keep the whole thing under 200 words
- One task per day, not three
- If yesterday had no commits (rest day), pick something from research library instead
- Bias toward things that are BUILT but UNTESTED or UNKNOWN to Zaal
