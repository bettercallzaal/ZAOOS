# 478 — Obsidian + Claude Code as Personal AI Brain (JARVIS / Cowork Pattern)

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Evaluate the CyrilXBT JARVIS + Fraser Cottrell "Claude + Obsidian as AI employee" pattern for Zaal's personal ops layer and ZOE v2.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Should Zaal run the JARVIS vault pattern personally? | USE — Obsidian vault + `CLAUDE.md` + 4 named skills (process-inbox, weekly-connections, generate-brief, write-content). Afternoon build. Replaces the "every chat starts from zero" problem already described in `project_zoe_v2_redesign.md`. |
| Which vault layout to use? | USE CyrilXBT's type-based layout (`observations/reactions/patterns/questions/numbers`) not topic-based. This is the one load-bearing decision in the whole spec and matches how our `/inbox` skill already labels messages. |
| Where should the vault live? | USE Google Drive-backed vault (Fraser's tip) so it syncs across Zaal's 2 machines + VPS + phone. Obsidian opens the Drive folder natively. |
| Call-transcript ingestion? | USE Fraser's loop: Fathom/Otter → Drive folder → MCP-Obsidian → Claude writes decisions + actions back to vault. Already have the Fathom step from BCZ consulting; just add the MCP piece. |
| Skills layer? | USE the 4 skills CyrilXBT names verbatim. They map 1:1 to our existing `/morning`, `/reflect`, `/socials`, `/newsletter` skills — meaning we can port JARVIS skill bodies into our skill library instead of building a second system. |
| Should ZOE v2 adopt this? | USE as ZOE v2's "brain" filesystem layer — replaces the Agent Zero migration's "where does ZOE remember things" gap noted in `project_zoe_v2_pivot_agent_zero.md`. |
| Obsidian MCP server? | USE `mcp-obsidian` (smithery-ai/mcp-obsidian). 5-minute setup. Node package in `~/.claude/mcp.json`. |

## Comparison of Options

| Option | Setup time | Monthly cost | Cross-device | Call ingestion | Skill reuse |
|---|---|---|---|---|---|
| **CyrilXBT JARVIS** (Obsidian + Claude Code CLI) | 1 afternoon | $0 + Claude API | Drive-backed vault | Manual paste | 4 named `.md` skills |
| **Fraser Cowork** (Claude Desktop + MCP connectors) | 1 afternoon | $20/mo Claude | Drive-backed vault | Fathom + Zapier auto | User preferences / project instructions |
| Notion AI + Notion Q&A | <1 hr | $20/mo Notion | Native | None | No file-level skills |
| Reflect.app + built-in AI | <1 hr | $15/mo | Native | None | Fixed, not extensible |
| Mem.ai | <1 hr | $15/mo | Native | None | Fixed |
| ZOE-only (current) | N/A | VPS | SSH from phone only | None | Slash commands via skill library |

Pick **both** the JARVIS layout (for Zaal's daily capture discipline) and the Cowork plumbing (for auto-ingest). They are not competing — JARVIS is the filesystem convention, Cowork is the transport.

## Why This Fits the ZAO Stack

1. We already operate a skill library pattern at `~/.claude/skills/` + project `.claude/skills/`. CyrilXBT's `05-CLAUDE/skills/*.md` is the same shape — port in ~30 min.
2. ZOE v2 brief (`project_zoe_v2_redesign.md`) already says "single agent, two brains, Telegram-native, business ops engine". JARVIS vault IS the business-ops-engine filesystem. Folder mapping:
   - `00-INBOX/` = today's `/inbox` skill output (email forwards to `zoe-zao@agentmail.to`).
   - `01-CAPTURES/` = reflections from `/reflect` + `/morning` + `/retro`.
   - `02-CONNECTIONS/` = output of `/graphify`.
   - `03-BRIEFS/` = input to `/newsletter` + `/socials`.
   - `04-PUBLISHED/` = output of `/socials` + `/newsletter` (we already keep drafts in `content/` — reshape to this).
   - `05-CLAUDE/` = `~/.claude/skills/` symlinked into the vault.

## Concrete Integration Points in This Repo

- `content/youtube-descriptions/` and `content/templates/` already follow a type-based layout; port into `JARVIS/04-PUBLISHED/`.
- `src/lib/agents/runner.ts` has the shared agent memory pattern — we can give ZOE read/write to the JARVIS vault via the same pattern.
- `.claude/skills/` (project-scoped) and `~/.claude/skills/` (global, see CLAUDE.md Skills section) are where JARVIS skills live.
- `community.config.ts` brand/voice block is what CyrilXBT's "Identity / Voice" blocks in `CLAUDE.md` map to — DRY by templating JARVIS `CLAUDE.md` from `community.config.ts` Zaal brand profile.

## Specific Numbers to Hit

- **4 skills** to port (process-inbox, weekly-connections, generate-brief, write-content).
- **20 minutes/day** daily loop (5 capture + 5 process + 5 connect + 5 brief).
- **1 Sunday session** (~60 min) = 2 fully briefed posts ready for the week.
- **$0.50/day** Claude budget on Matricula-style energy cap (doc 484) is a sane bound for JARVIS too.
- **30-day / 90-day / 180-day** compounding milestones per CyrilXBT — use these as explicit checkpoints.

## Risks / What to Skip

- SKIP CyrilXBT's "everything must be plain markdown" dogma where it collides with our existing DB-backed artifacts (Supabase `interactions`, `memories`). Use Obsidian for human-readable state; keep operational state in Supabase.
- SKIP writing a bespoke "JARVIS app" — this is a convention + a few MCP servers, not a product.
- SKIP Fraser's transparency-as-distribution framing here; that's covered separately in doc 485 (Distribution Is Hard V3).

## Sources

- [CyrilXBT — How to Build a JARVIS Inside Obsidian With Claude Code](https://x.com/cyrilxbt/status/2047246104421388461)
- [Fraser Cottrell — Claude + Obsidian = A true AI employee](https://x.com/sourfraser/status/2035454870204100810)
- [Obsidian MCP server (mcp-obsidian)](https://github.com/smithery-ai/mcp-obsidian)
- [Anthropic — Claude Code docs](https://docs.claude.com/en/docs/claude-code/overview)
