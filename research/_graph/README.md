# Research Knowledge Graph

Machine-readable index for AI agent retrieval. Use these files to find relevant research without scanning all 191 docs.

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

| Category | Description |
|----------|-------------|
| `farcaster` | Farcaster protocol, hubs, clients, social graph |
| `music` | Music player, audio rooms, streaming, discovery |
| `onchain` | NFTs, tokens, smart contracts, wallets, ENS |
| `community` | ZAO ecosystem, whitepaper, onboarding, members |
| `governance` | DAOs, fractals, proposals, voting, respect |
| `ai-agent` | AI agents, Claude Code, ElizaOS, Paperclip |
| `cross-platform` | Cross-posting to Lens, Bluesky, Nostr, etc. |
| `infrastructure` | Supabase, Next.js, APIs, notifications, UI |
| `wavewarz` | WaveWarz music battles and prediction markets |
| `security` | Security audits, vulnerability assessments |
| `dev-workflows` | Developer tools, skills, testing, git workflows |
| `other` | Miscellaneous research |

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

- **191 docs** indexed
- **59 tags** across all docs
- **12 categories**
- **84 code path** references
- **23 supersession chains** tracking topic evolution
- Generated: 2026-03-28
