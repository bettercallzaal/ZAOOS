# Research Knowledge Graph

Machine-readable index for AI agent retrieval. Use these files to find relevant research without scanning all 277 docs.

## Files

| File | Purpose |
|------|---------|
| `KNOWLEDGE.json` | Full metadata for every doc (id, title, tags, summary, related, code_paths) |
| `by-tag.json` | Inverted index: tag -> list of doc IDs |
| `by-category.json` | Category -> list of doc IDs |
| `by-code-path.json` | Source code path prefix -> list of doc IDs that reference that code |
| `supersession.json` | Which docs replace which, with canonical doc per topic chain |

## Quick Lookup

- **By topic/keyword**: Search `by-tag.json` for the most relevant tag
- **By code path**: Search `by-code-path.json` to find docs about code you're modifying
- **By category**: Browse `by-category.json` for themed exploration
- **Latest on a topic**: Check `supersession.json` to find the canonical/latest doc
- **Full metadata**: `KNOWLEDGE.json` has everything -- search by any field

## Categories

Docs are organized into topic folders under `research/`. Archived docs live in `research/_archive/`.

| Category | Folder | Description |
|----------|--------|-------------|
| `agents` | `research/agents/` | AI agents, Claude Code, ElizaOS, Paperclip, OpenClaw |
| `business` | `research/business/` | Revenue, payments, monetization, marketplace |
| `community` | `research/community/` | ZAO ecosystem, whitepaper, onboarding, members |
| `cross-platform` | `research/cross-platform/` | Cross-posting to Lens, Bluesky, Nostr, X, etc. |
| `dev-workflows` | `research/dev-workflows/` | Developer tools, skills, testing, git workflows |
| `events` | `research/events/` | Ship logs, session logs, bootcamps, ZAO Stock |
| `farcaster` | `research/farcaster/` | Farcaster protocol, hubs, clients, social graph |
| `governance` | `research/governance/` | DAOs, fractals, proposals, voting, respect, Hats |
| `identity` | `research/identity/` | ZIDs, ENS, reputation, profiles, knowledge graph |
| `infrastructure` | `research/infrastructure/` | Supabase, Next.js, APIs, notifications, UI, streaming |
| `music` | `research/music/` | Music player, audio rooms, NFTs, discovery, Fishbowlz |
| `security` | `research/security/` | Security audits, vulnerability assessments |
| `wavewarz` | `research/wavewarz/` | WaveWarz music battles and prediction markets |
| `_archive` | `research/_archive/` | Superseded docs kept for historical reference |

## For AI Agents

Load `KNOWLEDGE.json` at session start. To find relevant docs:

1. Extract keywords from the user's request
2. Match against `tags` and `summary` fields in KNOWLEDGE.json
3. For code-related tasks, check `by-code-path.json` with the file path being modified
4. Follow `related` links for additional context
5. Check `supersession.json` to ensure you're reading the latest version (not a superseded doc)

## Doc Status Values

- `current` -- Active, up-to-date research
- `canonical` -- The definitive doc for its topic (e.g., Doc 050 for ZAO overview, Doc 154 for skills reference)
- `superseded` -- A newer doc covers this topic better; check supersession.json for the replacement

## Stats

- **277 docs** across topic folders (194 indexed in KNOWLEDGE.json, 83 added after last generation)
- **59 tags** across all docs
- **14 categories** (13 topic folders + _archive)
- **84 code path** references
- **23 supersession chains** tracking topic evolution
- Generated: 2026-03-28, categories updated: 2026-04-05
