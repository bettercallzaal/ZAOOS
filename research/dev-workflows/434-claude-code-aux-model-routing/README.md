# 434 - Claude Code Aux Model Routing: What Actually Exists vs the Hermes 8-Slot Myth

> **Status:** Research complete
> **Date:** 2026-04-18
> **Tags:** `#claude-code` `#token-optimization` `#openrouter` `#ollama` `#haiku` `#subagents` `#cost`
> **Related:** Doc 353 (Claude Code Token Optimization v2), Doc 354 (Local LLM Coding Alternatives), Doc 357 (Caveman Token Compression)
> **Trigger:** Onchain AI Garage YouTube video (Apr 17, 2026) on Hermes Agent 8-slot aux model config. Clarify what maps vs does not map to Claude Code

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Do NOT chase "8 aux slots" in Claude Code | SKIP. Claude Code exposes 2 levers, not 8. `ANTHROPIC_DEFAULT_HAIKU_MODEL` controls all background functionality (compaction, summarization, auto-compact, file reads). `CLAUDE_CODE_SUBAGENT_MODEL` controls subagent dispatch. That is the full surface per official docs |
| Pin Haiku to Haiku 4.5 explicitly | SET `ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-haiku-4-5-20251001` in `.claude/settings.json` env block. Prevents silent upgrades to more expensive Haiku versions. Haiku 4.5 is $1/$5 per M tokens - floor pricing for Anthropic aux |
| Pin subagent to Haiku (already partially done) | CONFIRM `CLAUDE_CODE_SUBAGENT_MODEL=haiku` is set (Doc 353 claimed done). Subagents handle grep + file reads; Opus wastes tokens on them |
| Route via OpenRouter only if paying by token | SKIP for Max subscribers. Max $200/mo already includes Opus + Sonnet + Haiku within weekly limits. OpenRouter + Kimi K2 only pays off for pay-as-you-go API users |
| claude-code-router for per-task routing | INVESTIGATE for pay-as-you-go API workflow, SKIP on Max subscription. Tool lets you route compaction -> Kimi K2, coding -> Opus, summarization -> Flash. Savings real but only past the subscription floor |
| Disable 1M context when not needed | SET `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` per-session when working narrow tasks. 1M variants cost same per-token but encourage sloppy context hygiene |
| Effort level for simple tasks | USE `/effort low` for greps + file reads + small edits. Defaults to `xhigh` on Opus 4.7 which burns thinking tokens |
| Kill MAX_THINKING_TOKENS myth on Opus 4.7 | Opus 4.7 uses adaptive reasoning only. `MAX_THINKING_TOKENS` and `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` are no-ops on 4.7. Doc 353 recommendation still applies to Opus 4.6 + Sonnet 4.6 |

---

## The Hermes 8-Slot Claim vs Claude Code Reality

### What Hermes Agent exposes (per YouTube video Apr 17 2026)

Hermes `config.yaml` auxiliary section splits background work into 8 independently-routable tasks:

1. Compression (conversation summarization on context threshold)
2. Web extract (post-fetch page summary)
3. Vision (image/screenshot analysis)
4. Flush memories (end-of-session durable writes)
5. Session search
6. Skills hub
7. MCP dispatches
8. Smart approvals

Video claim: pointing compression at Kimi K2 vs Claude Opus drops a 50K-token compaction from ~$0.13 to ~$0.02, roughly 85 percent savings across 10-20 compactions per day (~$51/mo delta).

### What Claude Code actually exposes (per code.claude.com/docs/en/model-config, verified Apr 18 2026)

| Surface | Env var | What it covers |
|---------|---------|----------------|
| Background tasks | `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Auto-compact, file summarization, background functionality bundle |
| Subagents | `CLAUDE_CODE_SUBAGENT_MODEL` | Every Agent() dispatch |
| Main chat | `ANTHROPIC_DEFAULT_OPUS_MODEL` / `_SONNET_MODEL` | Primary conversation model |
| Custom extra | `ANTHROPIC_CUSTOM_MODEL_OPTION` | Single additional entry in /model picker |
| Per-version routing | `modelOverrides` in settings | Map Anthropic model IDs to provider IDs (Bedrock ARNs etc) |

Note: `ANTHROPIC_SMALL_FAST_MODEL` is deprecated in favor of `ANTHROPIC_DEFAULT_HAIKU_MODEL`.

There is no official separate slot for compression, vision, web extract, or memory flush. All of those funnel through the Haiku slot when they fire at all. Claude Code is architecturally tighter than Hermes for aux routing.

---

## Comparison of Options

### Routing tools

| Tool | Free | Per-task routing | Supports Ollama | Supports OpenRouter | Difficulty (1-10) |
|------|------|------------------|-----------------|---------------------|-------------------|
| Native env vars | Yes | No (2 slots only) | Via `ANTHROPIC_BASE_URL` | Via `ANTHROPIC_BASE_URL` | 2 |
| claude-code-router | Yes | Yes | Yes | Yes | 5 |
| LiteLLM proxy | Yes | Yes | Yes | Yes | 6 |
| Ollama direct (v0.14+) | Yes | No | Native | N/A | 3 |

### Cost per million tokens (Apr 2026 snapshot)

| Model | Input | Output | Best fit |
|-------|-------|--------|----------|
| Claude Opus 4.7 | $15 | $75 | Main work, planning |
| Claude Sonnet 4.6 | $3 | $15 | Execution |
| Claude Haiku 4.5 | $1 | $5 | Subagents, background |
| Kimi K2 (OpenRouter) | $0.14 | $2.49 | Compaction, summarization |
| DeepSeek V3 | $0.27 | $1.10 | Cheap coding help |
| Gemini 2.5 Flash | $0.075 | $0.30 | Vision + web extract if Claude routed through proxy |
| Qwen2.5-Coder-32B (Ollama, local) | $0 | $0 | Coding help on local GPU |

### Settings snippet for ZAO OS `.claude/settings.json`

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5-20251001",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku",
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_CODE_DISABLE_1M_CONTEXT": "1"
  }
}
```

---

## ZAO Ecosystem Integration

### Current state (April 18 2026)

- Active workflow on Max subscription ($200/mo), 3rd consecutive week at 85% weekly cap per Doc 353
- `.claude/settings.json` has partial Doc 353 recommendations applied (subagent routing, hook filters)
- Research library at 432 docs, 319+ active, heavy use of Explore agent and subagent dispatch

### What to change in this repo

1. Edit `.claude/settings.json` env block with snippet above (idempotent, safe)
2. Add `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` to shell profile for default-off, override per-session via `/model opus[1m]`
3. Add `/effort` note to `CLAUDE.md` "Token Budget" section pointing devs to use `/effort low` for file reads
4. Parallel work: evaluate `claude-code-router` on VPS 1 where ZOE runs pay-as-you-go API calls (Doc 428 AO move). There the 85 percent savings story actually compounds

### What NOT to do

- Do NOT swap Opus to local models for main work. Doc 354 is explicit: multi-file refactors score 60% lower on local
- Do NOT point Haiku slot at Kimi K2 on Max subscription - Haiku is already covered by the subscription floor
- Do NOT delete `MAX_THINKING_TOKENS=10000` even though it is a no-op on Opus 4.7, Sonnet 4.6 + Opus 4.6 still read it

---

## Code paths touched

- `.claude/settings.json` - env block extension
- `CLAUDE.md` - Token Budget section add `/effort low` guidance
- `docs/` - none; this doc is the record
- VPS 1 ZOE config - only if we adopt claude-code-router (separate branch)

---

## Sources

- [Claude Code Model Configuration (official)](https://code.claude.com/docs/en/model-config)
- [Claude Code model config Help Center](https://support.claude.com/en/articles/11940350-claude-code-model-configuration)
- [Claude Code with Any Model (OpenRouter, Ollama, LiteLLM)](https://techsy.io/en/blog/claude-code-use-different-models)
- [Claude Code Advisor Strategy (Opus plans, Sonnet or Haiku executes)](https://www.mindstudio.ai/blog/claude-code-advisor-strategy-opus-sonnet-haiku)
- [Onchain AI Garage: How Hermes Agent Can Save You 85% in BG Task Token Cost (video source of trigger)](https://www.youtube.com/watch?v=)
- [Reddit r/hermesagent thread](https://www.reddit.com/r/hermesagent/)
