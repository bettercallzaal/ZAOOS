# 357 - Caveman: Token Compression Skill for Claude Code

> **Status:** Installed and active
> **Date:** April 14, 2026
> **Goal:** Cut ~25% total session tokens (65-75% output tokens) via compressed response style

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install method** | USE `claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman` - auto-activates every session via SessionStart hook |
| **Default intensity** | USE `full` mode (default) - best balance of savings vs readability |
| **For architecture/brainstorming** | USE `/caveman lite` - need full sentences for complex reasoning |
| **For bulk file edits** | USE `/caveman ultra` - maximum compression, code speaks for itself |
| **Combine with thinking cap** | KEEP `MAX_THINKING_TOKENS=10000` alongside caveman - they stack (thinking = input, caveman = output) |
| **CLAUDE.md interaction** | NO CHANGES needed to CLAUDE.md - caveman injects via SessionStart hook, not CLAUDE.md |

---

## Comparison of Token Compression Approaches

| Approach | Output Savings | Input Savings | Auto-Activates | Effort |
|----------|---------------|---------------|----------------|--------|
| **Caveman plugin** | 65-75% | 0% | Yes (hook) | 1 command |
| **MAX_THINKING_TOKENS=10K** | 0% | 50-80% thinking | Yes (env) | 1 line |
| **.claudeignore** | 0% | 30-50% indexing | Yes (file) | 1 file |
| **Subagent model=haiku** | 0% | 60-80% per agent | Yes (env) | 1 line |
| **LLMLingua (Microsoft)** | 0% | 60-94% prompt | No (API) | Heavy |
| **Codebase wiki (Karpathy)** | 0% | 71.5x queries | No (manual) | Medium |
| **/compact every 15-20 msgs** | N/A | 60-70% context | Manual habit | Free |

## Intensity Levels

| Level | Command | Style | When to Use |
|-------|---------|-------|-------------|
| Lite | `/caveman lite` | Full sentences, no filler | Brainstorming, architecture |
| Full | `/caveman` | Fragments, no preamble | Default for coding |
| Ultra | `/caveman ultra` | Telegraphic | Bulk edits, simple tasks |

## ZAO OS Integration

Installed at user level via plugin system. Settings at `~/.claude/settings.json` under `enabledPlugins.caveman@caveman: true`.

Stacks with existing ZAO OS token optimization:
- `.claudeignore` at `/Users/zaalpanthaki/Documents/ZAO OS V1/.claudeignore`
- `MAX_THINKING_TOKENS=10000` in `~/.claude/settings.json`
- `CLAUDE_CODE_SUBAGENT_MODEL=haiku` in `.claude/settings.json`
- Context budget rules in CLAUDE.md (lines 142-160)
- `/compact` habit every 15-20 messages

**Combined estimated savings: 40-60% per session** (caveman output + thinking cap + .claudeignore + subagent routing).

## Token Optimization Stack (Complete as of April 14, 2026)

| Layer | Tool | Target | Status |
|-------|------|--------|--------|
| Output compression | Caveman plugin | Response tokens | Installed |
| Thinking cap | MAX_THINKING_TOKENS=10K | Reasoning tokens | Configured |
| File exclusion | .claudeignore | Index tokens | Created |
| Subagent routing | CLAUDE_CODE_SUBAGENT_MODEL=haiku | Agent tokens | Configured |
| Context budget | CLAUDE.md rules | File read tokens | Written |
| Session hygiene | /compact habit | Context tokens | Behavioral |
| Model routing | /model sonnet for simple tasks | All tokens | Behavioral |

## Sources

- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) - 28.9K stars, MIT license
- [DEV Community: Caveman Claude](https://dev.to/onsen/caveman-claude-the-token-cutting-skill-thats-changing-ai-workflows-4hmc)
- Doc 298 - Claude Token Optimization Strategies
- Doc 353 - Claude Code Token Optimization v2
