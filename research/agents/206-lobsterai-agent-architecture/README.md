# 206 — LobsterAI Agent Architecture Analysis

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Evaluate LobsterAI (NetEase Youdao) for patterns transferable to ZAO OS agent/skill architecture

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Adopt LobsterAI as reference?** | USE as reference for agent architecture patterns only — not for core features. MIT-licensed, 4,706 stars, actively maintained. |
| **Skill system pattern** | ADOPT the `SKILL.md` manifest + `skills.config.json` ordering/enabling pattern for ZAO OS's planned ElizaOS agent skill system |
| **Memory extraction** | ADOPT the auto-extraction of user preferences from conversations — useful for ZAO OS's planned AI agent onboarding assistant |
| **Permission gating** | ADOPT the explicit tool-approval model for any ZAO OS agent that takes actions on behalf of users |
| **IM bridge pattern** | INVESTIGATE for Farcaster/XMTP bot — LobsterAI's Telegram/Discord gateway lets users control desktop agents from mobile |
| **Music search skill** | SKIP — scrapes Chinese cloud drives for downloads, not relevant to ZAO OS's legitimate multi-provider streaming player |
| **Desktop app (Electron)** | SKIP — ZAO OS is a Next.js web app, desktop client architecture is not transferable |

## What LobsterAI Is

LobsterAI is an **all-in-one personal AI agent desktop app** built by NetEase Youdao. It runs as an Electron app with 28 built-in skills, executing tasks locally with user permission gating. Tagline: "Your 24/7 all-scenario AI agent that gets work done for you."

- **Stars:** 4,706 | **Forks:** 674 | **Open Issues:** 579
- **License:** MIT
- **Created:** February 12, 2026 | **Last commit:** March 28, 2026 (daily activity)
- **Core engine:** Claude Agent SDK (Anthropic) — same AI provider as ZAO OS

## Comparison of Options: Agent Architecture Patterns

| Pattern | LobsterAI | ElizaOS (ZAO planned) | Custom ZAO Agent |
|---------|-----------|----------------------|------------------|
| **Runtime** | Electron desktop (local) | Node.js server | Next.js API routes |
| **AI Engine** | Claude Agent SDK | ElizaOS framework | Claude API direct |
| **Skill System** | `SKILL.md` manifests, hot-loadable, `skill-creator` meta-skill | Plugin system with character files | `.claude/skills/` directory |
| **Memory** | Auto-extracted from conversations, SQLite local | Character memory + RAG | Supabase + pgvector (planned) |
| **Permission Model** | Explicit approval per tool invocation | Role-based | Session-based (iron-session) |
| **IM Integration** | Telegram, Discord, DingTalk, Lark, NetEase IM | Discord, Telegram, Twitter | Farcaster casts, XMTP DMs |
| **Storage** | SQLite (local-only) | PostgreSQL or SQLite | Supabase PostgreSQL |
| **License** | MIT | MIT | N/A |

## Tech Stack Breakdown

| Layer | LobsterAI | ZAO OS Equivalent |
|-------|-----------|-------------------|
| Framework | Electron 40 | Next.js 16 |
| Frontend | React 18 + Redux Toolkit | React 19 + React Query |
| Styling | Tailwind CSS 3 | Tailwind CSS 4 |
| Build | Vite 5 | Turbopack |
| Storage | SQLite (sql.js) | Supabase PostgreSQL |
| AI | Claude Agent SDK | Claude API (planned) |
| Testing | Vitest | Vitest |

## Transferable Patterns for ZAO OS

### 1. Skill Manifest System

LobsterAI's `SKILLs/` directory uses `SKILL.md` files as declarative manifests — each skill defines its name, description, tools needed, and execution instructions. A `skills.config.json` controls ordering and enable/disable state. The `skill-creator` meta-skill lets users author new skills at runtime.

**ZAO OS application:** The planned ElizaOS agent (see `research/205-openclaw-paperclip-elizaos-deployment-plan/`) could adopt this manifest pattern for its skill/plugin system. Currently ZAO OS has `.claude/skills/` for Claude Code skills — a similar pattern for runtime agent skills would be natural.

### 2. Persistent Memory Extraction

LobsterAI auto-extracts user preferences and personal facts from conversations, stores them in SQLite, and injects them into future prompts with configurable limits. This runs passively during all conversations.

**ZAO OS application:** For the planned AI onboarding assistant (`research/200-community-os-ai-agents-platform-vision/`), auto-learning member music preferences, governance participation patterns, and communication style would personalize the experience. Store in Supabase with `src/lib/db/supabase.ts`.

### 3. Cowork Session Architecture

LobsterAI's "Cowork mode" creates autonomous working sessions where the agent executes a sequence of tool calls with user approval gates between each step. This is different from chat — it's task execution with checkpoints.

**ZAO OS application:** A "cowork" pattern for governance proposal drafting — the agent researches, drafts, formats, and submits proposals with member approval at each step. Integrate with `src/components/governance/` workflow.

### 4. IM Remote Control Gateway

LobsterAI's IM bridges (Telegram, Discord, DingTalk, Lark) let users send commands from their phone to the desktop agent. The agent executes locally and reports back via the same IM channel.

**ZAO OS application:** A Farcaster cast-triggered bot or XMTP DM bot could let ZAO members trigger agent actions (e.g., "play [song]", "check my respect score", "draft a proposal about [topic]") from any Farcaster client. Wire through `src/lib/farcaster/neynar.ts` webhook handler.

## ZAO OS Integration

**Relevant files:**
- `src/lib/farcaster/neynar.ts` — webhook handler for potential Farcaster bot commands
- `src/components/governance/` — governance proposal workflow that could use cowork-style agent assistance
- `research/200-community-os-ai-agents-platform-vision/` — AI agents platform vision
- `research/205-openclaw-paperclip-elizaos-deployment-plan/` — ElizaOS deployment plan
- `scripts/openclaw-setup-github.sh` — OpenClaw setup (LobsterAI also integrates OpenClaw)
- `community.config.ts` — admin FIDs that would control bot permissions

**Integration priority:** Low-medium. LobsterAI is a reference architecture, not a direct integration. Extract patterns for the post-MVP AI agent layer.

## 28 Built-in Skills (for reference)

Web search, document generation (docx/xlsx/pptx/pdf), video generation (Remotion), web automation (Playwright), canvas design, frontend prototyping, game development, scheduled tasks (cron), email (IMAP/SMTP), stock analysis, music search, film search, content planning, article writing, weather, and more.

The **scheduled tasks** skill (cron expressions for daily digests, periodic reports) is directly relevant to ZAO OS's planned automated governance summaries and weekly Respect reports.

## What's NOT Useful for ZAO OS

- **Desktop-only architecture** — ZAO OS is a web app, Electron patterns don't transfer
- **Single-user model** — LobsterAI is personal assistant, ZAO OS is community platform for 100+ members
- **Chinese cloud drive music search** — scrapes Quark/Baidu/Aliyun for downloads, irrelevant to legitimate streaming
- **Redux state management** — ZAO OS uses React Query, different paradigm
- **SQLite local storage** — ZAO OS uses Supabase PostgreSQL with RLS

## Sources

- [LobsterAI GitHub Repository](https://github.com/netease-youdao/LobsterAI) — MIT license, 4,706 stars
- [LobsterAI Homepage](https://lobsterai.youdao.com) — NetEase Youdao product page
- [Claude Agent SDK](https://docs.anthropic.com/en/docs/agents) — underlying AI engine documentation
- [ZAO OS Doc 200 — AI Agents Platform Vision](../../community/200-community-os-ai-agents-platform-vision/) — existing ZAO OS agent plans
- [ZAO OS Doc 205 — ElizaOS Deployment Plan](../../agents/205-openclaw-paperclip-elizaos-deployment-plan/) — OpenClaw/ElizaOS integration plan
