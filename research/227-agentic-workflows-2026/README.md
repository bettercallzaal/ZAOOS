# 227 — Agentic Workflows in 2026: Frameworks, Patterns & Music/Web3 Applications

> **Status:** Research complete
> **Date:** March 29, 2026
> **Goal:** Map the agentic workflow landscape for 2026 — frameworks, SDKs, real-world DAO/community patterns, music-specific agent use cases, and cost/pricing models. Evaluate what fits ZAO OS (Next.js + TypeScript + Supabase + web3).

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Primary agent framework** | **Vercel AI SDK 6** — TypeScript-native, zero friction with Next.js App Router, ToolLoopAgent handles multi-step agent loops, provider-agnostic, MCP support. Already in the ZAO stack ecosystem |
| **Complex orchestration** | **Mastra** — TypeScript-native LangGraph alternative from the Gatsby team. 22k+ GitHub stars, 300k weekly npm downloads. Graph-based workflows, checkpointing, persistent memory. Use for multi-agent pipelines (governance + curation + onboarding) |
| **Claude-powered agents** | **Claude Agent SDK** — `@anthropic-ai/claude-agent-sdk` v0.2.71. Same tools as Claude Code (Read, Edit, Bash, Grep, WebSearch). Subagents, hooks, MCP, sessions. Use for code-touching agents (PR review, research, CI/CD) |
| **Skip LangGraph** | LangGraph is excellent but Python-first. LangGraph.js exists but Mastra is a better TypeScript-native option with the same graph primitives |
| **Skip AutoGen** | AutoGen is in maintenance mode. Microsoft replaced it with Agent Framework (Python + .NET only). No TypeScript support. Skip |
| **Skip CrewAI for production** | CrewAI is Python-first. TypeScript port (crewai-ts) is community-maintained, not official. Good for prototyping role-based agents but not production TypeScript |
| **Music agent: AI DJ curation** | Build with Vercel AI SDK 6 ToolLoopAgent + Cyanite audio analysis + Spotify/platform APIs. Respect-weighted curation already exists in `src/lib/music/curationWeight.ts` — agent wraps this with LLM reasoning |
| **Governance agent** | Use Claude Agent SDK subagents: one for proposal summarization, one for voting analysis, one for cross-platform publishing. Hooks for human-in-the-loop approval |
| **Budget per agent task** | Target $0.10-0.50 per agent task using Sonnet 4.6 ($3/$15 per MTok). Avoid Opus for agent loops. Use prompt caching (40-90% savings) and budget guardrails |

---

## 1. Framework Comparison (March 2026)

### Overview Table

| Framework | Version | Language | License | GitHub Stars | Key Strength | ZAO Fit |
|-----------|---------|----------|---------|-------------|--------------|---------|
| **Vercel AI SDK 6** | 6.x (Dec 2025) | TypeScript | Apache-2.0 | 75k+ | Next.js native, ToolLoopAgent, streaming, MCP | **Best fit** |
| **Mastra** | 0.x (active) | TypeScript | MIT | 22.3k | Graph workflows, checkpointing, 40+ providers | **Strong fit** |
| **Claude Agent SDK** | TS v0.2.71 / Py v0.1.48 | TypeScript + Python | Commercial ToS | N/A (Anthropic) | Claude Code tools, subagents, hooks, MCP | **Strong fit** |
| **LangGraph** | 1.1.0 (Mar 2026) | Python-first, JS available | MIT | 24k | Stateful graphs, durable execution, memory | Good but Python-first |
| **CrewAI** | 1.1.0+ (Mar 2026) | Python (TS community port) | MIT | 44k | Role-based agents, fast prototyping | Prototype only |
| **AutoGen** | 0.4 (maintenance) | Python + .NET | MIT | 54k | Conversational multi-agent | **Skip** — maintenance mode |
| **MS Agent Framework** | RC (Q1 2026) | Python + .NET | MIT | New | AutoGen + Semantic Kernel merged | **Skip** — no TypeScript |

### Vercel AI SDK 6 (Deep Dive)

**What it is:** The leading TypeScript AI toolkit (20M+ monthly npm downloads). AI SDK 6 shipped December 2025 with the `Agent` abstraction and v3 Language Model Specification.

**Key features:**
- **ToolLoopAgent**: Production-ready agent loop. Calls LLM, executes tool calls, feeds results back, repeats up to 20 steps (configurable). Provider-agnostic with Zod schemas
- **Human-in-the-loop**: `needsApproval` flag on any tool for review before execution
- **MCP support**: Stable, with OAuth auth, resources, prompts, elicitation for remote MCP servers
- **Streaming**: Native token-by-token streaming across Next.js, React, Svelte, Vue
- **DevTools**: Full visibility into LLM calls — input/output, token usage, timing
- **Provider-agnostic**: OpenAI, Anthropic, Google, xAI, and 20+ more via one interface

**Next.js serverless:** Yes, natively. Zero config with App Router. Vercel recommends enabling "Fluid Compute" for agent workloads — eliminates traditional serverless timeouts for multi-step agent tasks.

**vs LangGraph:** Vercel AI SDK is best for web-facing apps with streaming UI. LangGraph excels at complex stateful orchestration with cycles, conditional branching, and durable execution. For ZAO (Next.js web app), Vercel AI SDK wins on integration; for background pipelines, Mastra provides LangGraph-style graphs in TypeScript.

**Links:**
- [AI SDK 6 announcement](https://vercel.com/blog/ai-sdk-6)
- [ToolLoopAgent reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent)
- [GitHub](https://github.com/vercel/ai)

### Mastra (Deep Dive)

**What it is:** TypeScript-native AI agent framework from the team behind Gatsby. YC W25 batch, $13M funding, launched January 2026.

**Key features:**
- **Graph-based workflows**: LangGraph-style directed graphs in TypeScript — nodes, edges, conditional routing, cycles
- **40+ model providers**: OpenAI, Anthropic, Gemini through one interface
- **Checkpointing & memory**: Persistent state, resume from failure, long-running operations
- **Built-in evals**: Observe, measure, refine agent behavior continuously
- **Auth system**: Pluggable provider interfaces, cookie-based sessions, in-memory for dev
- **AI Gateway tools**: Provider-executed tools merged back into agent context
- **Token-aware truncation**: tiktoken-style counting, default 2000 token limits per tool result
- **Web framework integration**: Next.js, Nuxt, Astro first-class support

**Links:**
- [Mastra docs](https://mastra.ai/docs)
- [GitHub (22.3k stars)](https://github.com/mastra-ai/mastra)

### Claude Agent SDK (Deep Dive)

**What it is:** Anthropic's SDK that gives you the same tools, agent loop, and context management that power Claude Code, programmable in Python and TypeScript. Renamed from "Claude Code SDK" in early 2026.

**Core concepts:**
1. **Tools** — Built-in: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, AskUserQuestion. No need to implement tool execution yourself
2. **Hooks** — Run custom code at lifecycle points: PreToolUse, PostToolUse, Stop, SessionStart, SessionEnd, UserPromptSubmit. Use for audit logging, validation, blocking
3. **Subagents** — Spawn specialized agents for subtasks. Define with custom instructions and tool sets. Messages include `parent_tool_use_id` for tracking
4. **MCP servers** — Connect to external systems (databases, browsers, APIs). Example: Playwright MCP for browser automation
5. **Sessions** — Maintain context across exchanges. Resume or fork sessions
6. **Permissions** — Fine-grained tool access. Read-only agents, write-capable agents, approval-required tools

**TypeScript API:**
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.py",
  options: {
    allowedTools: ["Read", "Edit", "Bash"],
    permissionMode: "acceptEdits",
    hooks: {
      PostToolUse: [{ matcher: "Edit|Write", hooks: [auditLogger] }]
    },
    agents: {
      "code-reviewer": {
        description: "Expert code reviewer",
        prompt: "Analyze code quality and suggest improvements.",
        tools: ["Read", "Glob", "Grep"]
      }
    },
    mcpServers: {
      playwright: { command: "npx", args: ["@playwright/mcp@latest"] }
    }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

**Auth:** Reads `ANTHROPIC_API_KEY` env var. Also supports Amazon Bedrock, Google Vertex AI, and Microsoft Azure AI Foundry.

**License:** Anthropic Commercial Terms of Service (not open-source MIT — commercial use permitted under ToS).

**Links:**
- [Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [TypeScript reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [npm: @anthropic-ai/claude-agent-sdk](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
- [GitHub (TS)](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Demo agents](https://github.com/anthropics/claude-agent-sdk-demos)

---

## 2. Real-World Agentic Patterns for Communities

### Example 1: MakerDAO — Governance AI Tools (GAITs)

MakerDAO's "Endgame" plan introduced Governance AI Tools that:
- **Summarize proposals** — AI digests complex governance proposals into human-readable summaries
- **Verify proposals** — Automated checks for consistency and compliance
- **Simulate outcomes** — Run scenario models before votes execute
- Used to co-pilot governance of the DAI stablecoin system

### Example 2: Governatooorr — Autonomous DAO Voting

Built via a Ceramic partnership, Governatooorr is an autonomous DAO governor:
- Delegate tokens to the agent
- Set policy preferences (risk tolerance, spending limits, priorities)
- Agent votes on proposals matching your preferences automatically
- Represents "personal policy automation" — not direct democracy, but delegated AI governance

### Example 3: NEAR Protocol — AI Governance Delegates

NEAR's community is piloting AI governance delegates:
- Members set preferences (e.g., "always vote for developer grants," "oppose treasury draws over X")
- AI delegates vote according to preset rules when humans are offline
- Addresses the participation problem (most DAOs see <10% voter turnout)

### Example 4: Fetch.ai / ASI Alliance — Autonomous Agent Economy

Part of the Artificial Superintelligence Alliance (merged Fetch.ai + SingularityNET + Ocean Protocol):
- Autonomous agents monitor and execute votes on-chain
- Agents interact, learn, and collaborate within a blockchain ecosystem
- Focus on agent-to-agent coordination, not just human-to-agent

### ZAO OS Application

ZAO already has the building blocks:
- **Community proposals** with Respect-weighted voting (`src/components/governance/`)
- **Cross-platform publishing** (Farcaster/Bluesky/X) for approved proposals
- **Fractal process** running 90+ weeks with OG + ZOR Respect ledgers
- **Paperclip** agent infrastructure at paperclip.zaoos.com

**Agent opportunities for ZAO:**
1. **Proposal summarizer** — Summarize new proposals, post summaries to /zao Farcaster channel
2. **Voting delegate** — Members set preferences, agent votes on their behalf when absent
3. **Onboarding bot** — Guide new ZAO holders through setup, explain Respect, point to resources
4. **Treasury analyzer** — Model scenarios for treasury allocation, flag suspicious proposals

---

## 3. Music-Specific Agent Use Cases

### AI DJ / Playlist Curation Agents

**Current landscape (March 2026):**

- **Spotify AI DJ** — Expanded to Premium listeners in new markets (March 2026). Uses generative AI voice + personalization. Introduces tracks, explains why they fit, transitions between moods
- **Apple Playlist Playground** — iOS 26.4 (March 2026). Text-prompt playlist generation with auto titles and descriptions
- **Spotify Prompted Playlists** — Users describe what they want ("driving through the desert at sunset"), LLM translates mood into audio features
- **Meta AI DJ** — Facebook's music recommendation based on behavior + content creation patterns across Meta platforms

**LangGraph + Spotify API pattern:**
A demonstrated pipeline using LangGraph Studio:
1. Retrieve user's recently played songs (up to 50 tracks via Spotify API)
2. Analyze musical characteristics (tempo, key, energy, valence)
3. LLM reasons about patterns, mood trajectory, missing genres
4. Generate playlist with explanations for each pick
5. Loop: adjust based on user feedback

### Music Recommendation Loops

**2026 state of the art:**
- Context-aware: wearable data (heart rate, activity) matches to song tempo/energy
- Natural language: "something for a rainy Monday morning coding session"
- LLMs bridge human language to audio frequency features
- Mood-adaptive: real-time adjustments based on listening behavior

### Artist Discovery Pipelines

**Challenge:** Streaming algorithms in 2026 favor familiarity and repetition, making organic discovery harder for independent artists.

**Agent opportunity:**
- Scan new releases across platforms (Spotify, SoundCloud, Bandcamp, on-chain music)
- Score against community taste profile (ZAO already has respect-weighted curation)
- Cross-reference with Farcaster social signals (who's sharing what)
- Auto-submit high-scoring discoveries to community queue
- Agent explains *why* each track was chosen (transparency)

### ZAO OS Music Agent Architecture

```
[User prompt / mood / context]
        |
   ToolLoopAgent (Vercel AI SDK 6)
        |
   +----+----+
   |         |
[Cyanite]  [Spotify/SoundCloud API]
   |         |
   +----+----+
        |
  [curationWeight.ts] — respect-weighted scoring
        |
  [Community queue] — submit to /music
        |
  [Feedback loop] — reactions adjust future picks
```

---

## 4. Cost / Pricing Analysis

### LLM API Pricing (March 2026)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Best For |
|-------|----------------------|----------------------|----------|
| Claude Opus 4.6 | $5.00 | $25.00 | Complex reasoning, skip for loops |
| Claude Sonnet 4.6 | $3.00 | $15.00 | **Agent sweet spot** — capable + affordable |
| Claude Haiku 4.5 | $1.00 | $5.00 | Fast classification, routing, simple tasks |
| GPT-5 | $10.00 | $30.00 | Expensive, skip for agent loops |
| GPT-4.1 mini | $0.40 | $1.60 | Cheap alternative for simple steps |
| DeepSeek V3.2 | $0.14 | $0.28 | Ultra-cheap for high-volume, lower quality |
| Mistral Nemo | $0.02 | $0.04 | Cheapest commercial option |

### Cost Trends
- Input token costs dropped **85%** since GPT-4 launch (mid-2023 to Q1 2026)
- Frontier model input: ~$30/MTok (2023) to <$3/MTok (2026)

### Agent Cost Multipliers

| Factor | Impact |
|--------|--------|
| **Tool loop iterations** | 3-10x more LLM calls than single-shot chat |
| **Tool schema overhead** | Anthropic adds 313-346 tokens per request when tools enabled |
| **Conversation history** | Each loop re-sends full history — grows linearly |
| **Unconstrained coding agent** | $5-8 per task in API fees |
| **Prompt caching** | Saves 40-90% on repeated system prompts/tool definitions |
| **Batch API routing** | 50% savings for non-interactive tasks |
| **Combined optimization** | 70-90% reduction vs naive implementation |

### ZAO OS Budget Estimates

| Agent Task | Model | Est. Tokens | Est. Cost | Frequency |
|------------|-------|------------|-----------|-----------|
| Proposal summary | Sonnet 4.6 | ~5K in + 2K out | ~$0.045 | Per proposal (~5/week) |
| Music curation pick | Haiku 4.5 | ~3K in + 1K out | ~$0.008 | Per track (~50/day) |
| Onboarding guide | Sonnet 4.6 | ~8K in + 3K out | ~$0.069 | Per new member (~3/week) |
| Governance vote analysis | Sonnet 4.6 | ~10K in + 5K out | ~$0.105 | Per vote (~10/week) |
| Full DJ set (20 tracks) | Haiku 4.5 | ~60K in + 20K out | ~$0.16 | Per session |
| **Monthly estimate** | Mixed | — | **~$25-50/month** | At current scale |

### Cost Optimization Strategy for ZAO

1. **Model routing**: Haiku for classification/routing, Sonnet for reasoning, never Opus in loops
2. **Prompt caching**: Cache system prompts + tool definitions (same across all calls)
3. **Budget guardrails**: Max $0.50 per agent task, kill switch at $5/day
4. **Batch non-urgent**: Nightly batch for proposal summaries, artist discovery scans
5. **Token-aware truncation**: Mastra's default 2000-token limit per tool result — adopt this

---

## 5. Recommended Architecture for ZAO OS

### Layer 1: Vercel AI SDK 6 (User-Facing)
- ToolLoopAgent for interactive features (music search, chat, onboarding)
- Streaming responses in Next.js App Router
- Human-in-the-loop via `needsApproval` for governance actions

### Layer 2: Claude Agent SDK (Backend Automation)
- Subagents for code review, research, CI/CD
- Hooks for audit logging all agent actions
- MCP integration with Supabase, Farcaster (Neynar), Paperclip

### Layer 3: Mastra (Multi-Agent Pipelines)
- Graph-based orchestration for complex workflows
- Governance pipeline: detect proposal -> summarize -> analyze -> publish
- Music pipeline: scan sources -> score -> curate -> submit -> feedback loop
- Checkpointing for long-running discovery pipelines

### Integration Points with Existing ZAO OS Code

| Existing Code | Agent Enhancement |
|--------------|-------------------|
| `src/lib/music/curationWeight.ts` | Agent wraps with LLM reasoning for "why this track" |
| `src/lib/publish/` | Agent triggers cross-platform publishing after governance threshold |
| `src/lib/moderation/moderate.ts` | Agent pre-screens proposals before community vote |
| `src/components/governance/` | Agent summarizes, analyzes, delegates votes |
| `community.config.ts` | Agent reads community config for branding, channels, contracts |
| Paperclip (paperclip.zaoos.com) | Agent infrastructure for background tasks via Routines |

---

## Sources

- [LangGraph vs CrewAI vs AutoGen: Top 10 Frameworks (o-mega)](https://o-mega.ai/articles/langgraph-vs-crewai-vs-autogen-top-10-agent-frameworks-2026)
- [Top 11 AI Agent Frameworks 2026 (Lindy)](https://www.lindy.ai/blog/best-ai-agent-frameworks)
- [AI SDK 6 announcement (Vercel)](https://vercel.com/blog/ai-sdk-6)
- [ToolLoopAgent reference (ai-sdk.dev)](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent)
- [Claude Agent SDK overview (Anthropic)](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Agent SDK TypeScript (npm)](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
- [Mastra docs](https://mastra.ai/docs)
- [Mastra GitHub (22.3k stars)](https://github.com/mastra-ai/mastra)
- [LangGraph GitHub (24k stars)](https://github.com/langchain-ai/langgraph)
- [CrewAI GitHub (44k stars)](https://github.com/crewAIInc/crewAI)
- [AutoGen to MS Agent Framework migration](https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen/)
- [AI-Powered DAO Governance (Coincub)](https://coincub.com/blog/ai-powered-dao/)
- [DAO Governance and AI (StableLab)](https://stablelab.xyz/blog/dao-governance-and-ai)
- [Top 10 AI Agents in Web3 2026 (QuickNode)](https://www.quicknode.com/builders-guide/best/top-10-ai-agents-in-web3)
- [AI Music Curation with LangGraph + Spotify (Medium)](https://medium.com/@astropomeai/ai-music-curation-creating-an-ai-dj-assistant-with-langgraph-studio-and-spotify-api-560a492b7c2b)
- [AI Playlist Curation 2026 (Artistrack)](https://artistrack.com/ai-playlist-algorithms-changing-2026/)
- [Spotify AI DJ expansion (Digital Music News)](https://www.digitalmusicnews.com/2026/03/18/spotify-ai-dj-expands-to-more-countries/)
- [Apple Playlist Playground iOS 26.4 (AIToolly)](https://aitoolly.com/ai-news/article/2026-03-25-apple-releases-ios-264-featuring-ai-powered-playlist-playground-and-enhanced-purchase-sharing-featur)
- [LLM Cost Per Token Guide 2026 (Silicon Data)](https://www.silicondata.com/blog/llm-cost-per-token)
- [Agent Cost Optimization (AgentWiki)](https://agentwiki.org/agent_cost_optimization)
- [LLM API Pricing Comparison Mar 2026 (CostGoat)](https://costgoat.com/compare/llm-api)
- [Claude API Pricing 2026 (Metacto)](https://www.metacto.com/blogs/anthropic-api-pricing-a-full-breakdown-of-costs-and-integration)
- [120+ Agentic AI Tools 2026 (StackOne)](https://www.stackone.com/blog/ai-agent-tools-landscape-2026/)
