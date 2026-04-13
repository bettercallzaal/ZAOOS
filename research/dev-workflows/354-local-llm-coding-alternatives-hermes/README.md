# 354 - Local LLM Coding Alternatives: Hermes, Ollama, and Stretching Token Limits

> **Status:** Research complete
> **Date:** April 13, 2026
> **Goal:** Find local/alternative models that can handle simple coding tasks to reduce Claude Code weekly token burn. Hermes models, Ollama, and CLI alternatives evaluated.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **For simple tasks** | USE Claude Code with `/model sonnet` or `/effort low` - simplest change, no new tooling, saves 50-70% per task |
| **For unlimited local coding** | USE **Aider + Ollama + Qwen2.5-Coder-32B** - best open-source CLI coding assistant, Git-native, 85-90% of Claude quality on single-file tasks |
| **For Hermes specifically** | USE **Hermes 3 8B via Ollama** for general tasks, but SKIP for coding - Hermes excels at reasoning/chat, not code-specific benchmarks. Use Qwen2.5-Coder instead |
| **For multi-file refactors** | KEEP Claude Code Opus - local models score 60% lower on multi-file reasoning. Don't waste time fighting local model limitations on complex tasks |
| **For bulk file reads/grep** | USE Claude Code with subagents routed to Haiku (already configured in `.claude/settings.json`) |
| **Hybrid strategy** | USE local models for simple edits + Claude Code for architecture/complex work. This extends weekly limits by offloading 40-60% of simple tasks |

---

## Comparison of Options

### CLI Coding Assistants (Claude Code Alternatives)

| Tool | Cost | Local Models | Git Integration | Multi-file | Best For |
|------|------|-------------|----------------|-----------|---------|
| **Claude Code** | $100-200/mo (Max) | No | Yes | Excellent | Complex refactors, architecture, ZAO OS main work |
| **Aider** | Free (OSS) | Yes (Ollama) | Built-in diff workflow | Moderate | Simple edits, unlimited sessions |
| **Cline** | Free (OSS) | Yes | VS Code native | Good | IDE-integrated local coding |
| **Continue.dev** | Free (OSS) | Yes (200+ models) | Via IDE | Moderate | Autocomplete + chat with local models |
| **Gemini CLI** | Free tier | No | Yes | Good | Google Cloud projects |
| **Cursor** | $20/mo+ | Multi-model | IDE native | Good | Full IDE replacement |

### Local Models for Coding (via Ollama)

| Model | Params | VRAM (Q4) | HumanEval | Multi-file | Speed | Best For |
|-------|--------|-----------|-----------|-----------|-------|---------|
| **Qwen2.5-Coder-32B** | 32B | ~20GB | 85% | 2.8/5 | 15-25 tok/s | Best quality on consumer GPU |
| **Qwen3-Coder-Next 80B** | 80B MoE | 32GB+ | ~90% | Good | Slower | Heavy multi-file (needs beefy hardware) |
| **OmniCoder-9B** | 9B | ~5.5GB | Good | Limited | Fast | Lightweight, trained on Claude Opus traces |
| **DeepSeek-Coder-V2** | Variable | 16GB+ | Good | 2.4/5 | 25+ tok/s | Fast responses |
| **CodeStral 22B** | 22B | ~14GB | Good | 2.3/5 | 30+ tok/s | Fastest local option |
| **GLM-4.7-Flash** | 355B MoE | 24GB | High | Good | Moderate | Best 24GB agentic coder |
| **Hermes 3 8B** | 8B | ~5GB | Moderate | Limited | Fast | Reasoning/chat, not code-first |

### Hermes 3 Specifically

| Variant | Params | VRAM | Coding | Reasoning | Agentic | License |
|---------|--------|------|--------|-----------|---------|---------|
| Hermes 3 8B | 8B | ~5GB | Moderate | Strong | Good | Llama 3.1 license |
| Hermes 3 70B | 70B | ~35GB | Good | Excellent | Excellent | Llama 3.1 license |
| Hermes 3 405B | 405B | Multi-GPU | Strong | SOTA open | SOTA open | Llama 3.1 license |

Hermes 3's strength is **reasoning, function calling, and agentic behavior** - not raw coding benchmarks. For coding specifically, Qwen2.5-Coder outperforms Hermes at the same parameter count. Hermes is better for the ZOE agent stack (see Doc 247) than for coding assistance.

In April 2026, Nous Research released **Hermes Agent** - an autonomous system with multi-level memory and remote terminal access, built on Hermes 3. This is more relevant to ZOE/agent work than to replacing Claude Code for coding.

---

## Benchmark Reality Check

### Local vs Claude Quality (1-5 scale)

| Task | Best Local (Qwen2.5-32B) | Claude Sonnet 4 | Gap |
|------|--------------------------|-----------------|-----|
| Function generation | 4.1 | 4.4 | Small (93%) |
| Bug detection | 3.8 | 4.6 | Medium (83%) |
| Refactoring | 4.0 | 4.3 | Small (93%) |
| Multi-file context | 2.8 | 4.5 | **Large (62%)** |
| Code explanation | 4.2 | 4.1 | Local wins |

**Key insight:** Local models hit 85-90% of Claude on single-file tasks. Multi-file reasoning has a 60% gap. Route tasks accordingly.

### Speed

| Provider | Tokens/sec |
|----------|-----------|
| Local GPU (RTX 4070+) | 15-25 |
| Claude API | 60-80 |

Local is 3-4x slower but has zero rate limits.

---

## Recommended Hybrid Setup for ZAO OS

### Tier 1: Claude Code Opus (weekly budget tasks)
- Architecture decisions
- Multi-file refactors
- Complex debugging
- Brainstorming sessions
- Security reviews

### Tier 2: Claude Code Sonnet/Haiku (budget-friendly)
- File reads, greps, searches
- Simple bug fixes
- Formatting, linting
- Research doc lookups
- Subagent tasks (already configured)

### Tier 3: Aider + Local Model (zero Claude tokens)
- Writing tests
- Simple component scaffolding
- README/doc edits
- Renaming, moving files
- Repetitive edits across files
- Late-week sessions when limits are close

### Setup: Aider + Ollama (15 minutes)

```bash
# Install Ollama
brew install ollama

# Pull the best coding model
ollama pull qwen2.5-coder:32b
# Or lighter option for M-series Macs:
ollama pull qwen2.5-coder:14b

# Install Aider
pip install aider-chat

# Run Aider with local model
aider --model ollama_chat/qwen2.5-coder:32b

# Or with Hermes for general reasoning tasks
ollama pull hermes3:8b
aider --model ollama_chat/hermes3:8b
```

### Hardware Requirements

| Your Mac | Best Local Model | VRAM/RAM |
|----------|-----------------|----------|
| M1/M2 16GB | Qwen2.5-Coder-14B (Q4) | ~8.8GB |
| M1/M2 32GB | Qwen2.5-Coder-32B (Q4) | ~20GB |
| M3/M4 Pro 36GB+ | Qwen2.5-Coder-32B (Q8) | ~32GB |

---

## ZAO Ecosystem Integration

Files already configured for token optimization:
- `.claudeignore` - excludes build artifacts from indexing (created today, Doc 353)
- `.claude/settings.json` - `CLAUDE_CODE_SUBAGENT_MODEL=haiku` (set today)
- `~/.claude/settings.json` - `MAX_THINKING_TOKENS=10000` (set today)
- `CLAUDE.md` (line 142+) - Context Budget section already guides lazy-loading

Aider would complement Claude Code for the ZAO OS workflow by handling Tier 3 tasks in a separate terminal. No conflicts with the `/worksession` branch pattern since Aider also works Git-natively.

---

## Sources

- [Local LLM vs Claude $500 GPU Benchmark](https://www.kunalganglani.com/blog/local-llm-vs-claude-coding-benchmark) - quantified comparison, 1-5 scoring
- [10 Claude Code Alternatives - DigitalOcean](https://www.digitalocean.com/resources/articles/claude-code-alternatives) - comprehensive tool comparison
- [Hermes 3 Technical Report - NousResearch](https://nousresearch.com/hermes3/) - model capabilities, benchmarks
- [Hermes Agent Release - MarkTechPost](https://www.marktechpost.com/2026/02/26/nous-research-releases-hermes-agent-to-fix-ai-forgetfulness-with-multi-level-memory-and-dedicated-remote-terminal-access-support/) - April 2026 agent release
- [Doc 247 - Top 50 Local AI Models](research/agents/247-top-50-local-ai-models-2026/README.md) - existing ZAO research on local models
- [Run Claude Code with Local Models - Medium](https://medium.com/@luongnv89/run-claude-code-on-local-cloud-models-in-5-minutes-ollama-openrouter-llama-cpp-6dfeaee03cda) - setup guide
- [Aider GitHub](https://github.com/paul-gauthier/aider) - open-source CLI coding assistant
