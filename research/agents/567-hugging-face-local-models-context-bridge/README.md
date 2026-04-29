---
topic: agents
type: decision
status: research-complete
last-validated: 2026-04-29
related-docs: 235, 415, 428, 496, 546, 565
tier: STANDARD
---

# 567 - Hugging Face Local Models + Web UI + Claude Code Context Bridge

> **Goal:** Zaal said "I wanna try to have a couple local models that I can reach out to on a specific website or wherever that I can ask questions when needed and maybe it's hooked up to my context windows as well." This doc decides which HF surface, which local runtime, which web UI, and which context bridge to use - mirroring the existing `/ask-gpt` skill pattern (Doc 565).

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| **Where to chat (today, zero install)** | USE huggingface.co/chat. 115+ open models, free, conversation history, custom system prompts. Bookmark and use for casual Q&A. |
| **Web UI to self-host (the "specific website")** | USE Open WebUI on Mac via Docker. 124K+ stars, multi-model side-by-side, RAG, web search, MCP support. Single command. Expose to internet via existing Cloudflare tunnel pattern (paperclip.zaoos.com). |
| **Local runtime (the "couple models")** | USE LM Studio with MLX models on Mac M-series. 20-30% faster than Ollama, 50% less memory. Visual HF model browser. Port 1234 OpenAI-compat. Add Ollama as backup. |
| **DON'T host local models on VPS 1** | SKIP. Hostinger KVM 2 has no GPU, ~8GB RAM. Q3 7B on CPU = ~15 tok/s, painfully slow. Run UI on VPS, run models on Mac. Or keep model inference on HF Inference API. |
| **Context bridge to Claude Code** | USE LiteLLM proxy + `/ask-local` skill that mirrors `/ask-gpt` (Doc 565). LiteLLM has 35,700+ stars, converts OpenAI ↔ Anthropic ↔ Ollama. Same wrapper-script pattern as `~/bin/zao-ask-gpt.sh`. |
| **Models to pull first** | START with: Qwen 2.5 14B (general), DeepSeek-Coder 6.7B (code), Llama 3.1 8B (chat). All Q4_K_M quantization, all available on HF + Ollama + LM Studio. |
| **HF Pro subscription ($9/mo)** | WORTH IT IF Zaal uses HuggingChat or Inference API daily. 20x inference credits + 8x Spaces quota. Skip if just running local models via LM Studio/Ollama. |

---

## The Stack (Recommended Architecture)

```
+-----------------------------------------------+
|  Claude Code (Opus 4.7, Mac)                  |
|  /ask-local "<prompt>" --model qwen2.5:14b    |
+----------------------+------------------------+
                       |
                       v
+-----------------------------------------------+
|  ~/bin/zao-ask-local.sh                       |
|  (mirror of zao-ask-gpt.sh, logs to           |
|   ~/.zao/local-loop/<topic>.log)              |
+----------------------+------------------------+
                       |
                       v
+-----------------------------------------------+
|  LiteLLM proxy (localhost:8000)               |
|  Converts Anthropic <-> OpenAI shape          |
+----------------------+------------------------+
                       |
              +--------+----------+
              v                   v
+----------------------+ +-----------------------+
|  LM Studio           | |  Ollama (backup)      |
|  localhost:1234      | |  localhost:11434      |
|  MLX models on Mac   | |  GGUF fallback        |
+----------------------+ +-----------------------+
                       |
                       v (browser side)
+-----------------------------------------------+
|  Open WebUI (localhost:3000, Docker)          |
|  Multi-model chat, RAG, web search, MCP       |
|  Optionally exposed via Cloudflare tunnel     |
|  -> https://chat.zaoos.com (or similar)       |
+-----------------------------------------------+
```

---

## Layer 1: HF Inference Surfaces (Where to Reach Models)

| Surface | Price | Models | API | Verdict for Zaal |
|---|---|---|---|---|
| **HuggingChat** | Free / $9 Pro | 115+ open | Web only | USE for daily exploration |
| **Spaces (ZeroGPU)** | Free 3.5 min/day, $9 Pro 25 min/day | Any | No API | SKIP - quota throttled |
| **Inference Endpoints** | $0.50/hr T4, $5/hr H200 | Any | OpenAI-compat | WORTH IT IF >100 calls/day |
| **Inference API (Serverless)** | Free $0.10/mo + pay-as-you-go | Any | OpenAI-compat | USE for low-volume scripts |
| **HF Pro $9/mo** | $9/mo | n/a | Unlocks 20x credits | USE if daily user |

Free tier rate limit: 500 calls / 5 min window. Pro: 2,500 / 5 min.

## Layer 2: Local Hosting Runtimes

| Runtime | Platform | Install | RAM 7B Q4 | RAM 14B Q4 | OpenAI-compat | Best For |
|---|---|---|---|---|---|---|
| **Ollama** | Mac/Linux/Win | 1/10 | 5.2 GB | 9.5 GB | Yes :11434 | Backup runtime, scriptable |
| **LM Studio (MLX)** | Mac Apple Silicon | 2/10 | 4.9 GB | 8.1 GB | Yes :1234 | **PRIMARY** - fastest on Mac |
| **LM Studio (GGUF)** | Mac/Win | 2/10 | 5.8 GB | 10.2 GB | Yes :1234 | Fallback for non-MLX models |
| **llama.cpp** | Mac/Linux/Win | 7/10 | 5.2 GB | 10.1 GB | Yes :8000 | Power users only |
| **MLX / mlx-lm** | Mac Apple Silicon | 5/10 | 4.8 GB | 7.9 GB | CLI only | Research, not Zaal |
| **vLLM** | Linux + GPU | 8/10 | n/a | n/a | Yes :8000 | SKIP - no GPU on VPS |

**Throughput:** LM Studio MLX hits ~155 tok/s on Llama 3.1 8B (M3 Max), Ollama hits ~51 tok/s on same model. MLX wins by 3x.

**Quantization sweet spot:** Q4_K_M (4.5 bpw, +0.05 perplexity vs FP16). Q5_K_M if you have RAM headroom.

## Layer 3: Self-Hosted Web UIs

| UI | Stars | License | Backends | Multi-Model Side-by-Side | RAG | Web Search | MCP | Verdict |
|---|---|---|---|---|---|---|---|---|
| **Open WebUI** | 124K+ | Custom+MIT | Ollama, OpenAI-compat | Yes | Yes (9 DBs) | Yes (15+ providers) | Yes | **PICK 1** |
| **AnythingLLM** | 54K+ | MIT | Ollama, OpenAI, Anthropic | Yes | Native LanceDB | Plugins | Roadmap | PICK 2 - if RAG-first |
| **LibreChat** | 22K+ | AGPL | 40+ providers | Yes | Yes | Yes | Native | Skip - heavier (MongoDB) |
| **HF Chat-UI** | ~8K | Apache 2.0 | OpenAI-compat | Yes | No | Client-side | Roadmap | Skip - too lightweight |
| **Text Gen WebUI** | ~15K | AGPL | Ollama, llamacpp | No | Extensions | Extensions | No | Skip - power-user |

**Install Open WebUI in 1 command:**

```bash
docker run -d -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  --name open-webui --restart always \
  ghcr.io/open-webui/open-webui:main
```

Open `http://localhost:3000`, create admin account, point at `http://host.docker.internal:1234/v1` (LM Studio) or `http://host.docker.internal:11434` (Ollama).

## Layer 4: Claude Code Context Bridge

Claude Code talks Anthropic Messages API. Local runtimes talk OpenAI-compat. Need a translator.

| Bridge | Stars | Pattern | Verdict |
|---|---|---|---|
| **LiteLLM** | 35,700+ | Python proxy, OpenAI ↔ Anthropic ↔ Ollama, YAML config | **PICK** |
| **just-prompt** (MCP) | ~340 | MCP server, registers in Claude Code settings | Alternative if you prefer MCP-native |
| **claudo** | ~420 | Anthropic-API-shape proxy, env var redirect | Heavier, DigitalOcean-flavored |
| **dario** | ~290 | OAuth Claude Max + multi-model router | Interesting but small community |
| **llm CLI** (Simon Willison) | 8,200+ | `llm` shell tool with Ollama plugin | Use INSIDE the bridge wrapper |
| **ollama-mcp** | ~180 | Direct MCP wrapper for Ollama | Smaller community |

**Why LiteLLM:** Battle-tested, 100+ models, drop-in proxy, same env-var pattern Zaal already uses for `/ask-gpt`.

**Critical fact:** Ollama v0.14+ has native Anthropic Messages API support, so for Ollama-only setups you can skip LiteLLM and point Claude Code env vars directly at Ollama. LiteLLM still wins for routing across LM Studio + Ollama + HF Inference API.

---

## Recommended Zaal Install Path

### Phase 1 - Today (15 min, no commitment)

1. Open https://huggingface.co/chat in a browser. Pick Qwen 2.5 72B. Test 3 questions. Bookmark.
2. Done. That covers "couple models on a specific website" with zero install.

### Phase 2 - This Weekend (45 min, real local stack)

```bash
# Mac side
brew install --cask lm-studio          # 5 min
# Open LM Studio, search "Qwen 2.5 14B Instruct MLX 4bit", download (~8 GB)
# Click "Start Server" - exposes http://localhost:1234/v1

brew install ollama                    # backup runtime
ollama serve &                          # background
ollama pull qwen2.5:14b-instruct-q4_K_M
ollama pull deepseek-coder:6.7b
ollama pull llama3.1:8b

# Web UI
docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data --name open-webui --restart always \
  ghcr.io/open-webui/open-webui:main
# Browse http://localhost:3000, register admin, add both endpoints
```

Result: chat.localhost on the Mac, switch between Qwen / DeepSeek / Llama in the UI.

### Phase 3 - Hook to Claude Code Context (1 hour)

Mirror the `/ask-gpt` skill pattern from Doc 565 + `project_ask_gpt_loop_live` memory.

```bash
# Create wrapper script
cat > ~/bin/zao-ask-local.sh << 'EOF'
#!/bin/bash
# zao-ask-local.sh - mirror of zao-ask-gpt.sh for local Ollama
TOPIC="${1:-default}"
PROMPT="${2}"
MODEL="${3:-qwen2.5:14b}"
LOG_DIR="$HOME/.zao/local-loop"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/$TOPIC.log"
echo "## Q ($(date -Iseconds))" >> "$LOG"
echo "$PROMPT" >> "$LOG"
echo "" >> "$LOG"
ANSWER=$(curl -s http://localhost:11434/api/generate \
  -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false}" \
  | jq -r .response)
echo "## A" >> "$LOG"
echo "$ANSWER" >> "$LOG"
echo "" >> "$LOG"
echo "$ANSWER"
EOF
chmod +x ~/bin/zao-ask-local.sh

# Create skill folder
mkdir -p ~/.claude/skills/ask-local/
# (write SKILL.md mirroring ~/.claude/skills/ask-gpt/SKILL.md)
```

Then in any Claude Code session: `bash ~/bin/zao-ask-local.sh hugging-face-test "what's a good 7B model for code?"` and Claude reads the answer back from the log file.

### Phase 4 - Optional VPS Exposure (later)

Tunnel the Mac's Open WebUI through the existing Cloudflare named tunnel `zao-agents` (project memory `project_paperclip_infra`):

- Add a tunnel ingress rule: `chat.zaoos.com -> http://localhost:3000` with `Host: 127.0.0.1:3000` rewrite.
- Open WebUI runs on Mac, but the URL works from any device.
- DON'T expose Ollama/LM Studio directly - only Open WebUI behind auth.

---

## Pitfalls / Things to Watch

| Pitfall | Detail |
|---|---|
| **8GB Mac is tight** | Q4 14B = 9.5 GB just for weights, leaves nothing for OS. Use 7B Q4 (~5 GB) or jump to 16GB+ Mac. |
| **LM Studio license** | "Proprietary-free" - free for personal use, but check terms before recommending to ZAO members. Ollama is MIT, fully clean. |
| **VPS CPU inference** | 7B Q3 on no-GPU VPS = ~15 tok/s. Workable for batch, painful for chat. Keep models on Mac. |
| **MCP-vs-LiteLLM split** | Don't run BOTH at once. Pick one bridge. LiteLLM = simpler, MCP = more idiomatic for Claude Code. |
| **HF Pro auto-renewal** | $9/mo recurring. Cancel if not actively using HuggingChat/Inference API. |
| **Conversation history in HuggingChat** | Stored in HF account, NOT private. Don't paste sensitive ZAO context. |
| **Open WebUI auth** | First account is admin. Subsequent users blocked unless approved. Fine for solo, configure RBAC for team. |

---

## Also See

- [Doc 235](../235-free-web-search-mcp-alternatives/) — MCP server pattern
- [Doc 415](../415-composio-ao-pilot/) — composio-style external skill bridge
- [Doc 496](../496-elizaos-2026-assessment/) — alternative agent harness comparison
- [Doc 546](../546-hefty-bot-local-first-harness/) — closed-source local-first harness comparison
- [Doc 565](../../dev-workflows/565-ask-gpt-claude-chatgpt-learning-loop/) — `/ask-gpt` skill that this mirrors
- Memory: `project_ask_gpt_loop_live`, `project_paperclip_infra`, `project_no_vps2`

---

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Install LM Studio + pull Qwen 2.5 14B MLX | @Zaal | Manual | This weekend |
| Install Ollama + pull qwen/deepseek/llama | @Zaal | Manual | This weekend |
| `docker run` Open WebUI on Mac | @Zaal or Claude | Bash | Phase 2 |
| Write `~/bin/zao-ask-local.sh` + `~/.claude/skills/ask-local/SKILL.md` | Claude | Code | Phase 3 |
| Add `/ask-local` to memory once shipped | Claude | Memory | After test |
| Decide on HF Pro $9/mo subscription | @Zaal | Decision | After Phase 1 (1 week trial of HuggingChat free) |
| Optional: tunnel Open WebUI to chat.zaoos.com | @Zaal + Claude | Cloudflare config | Phase 4 (later) |

---

## Sources

### HF Inference
- https://huggingface.co/chat - HuggingChat
- https://huggingface.co/pro - HF Pro pricing
- https://huggingface.co/docs/hub/en/spaces-zerogpu - ZeroGPU docs
- https://huggingface.co/docs/inference-endpoints/pricing - Inference Endpoints pricing
- https://huggingface.co/docs/inference-providers/main/en/index - Inference Providers overview

### Local Runtimes
- https://docs.ollama.com/api/openai-compatibility - Ollama OpenAI-compat docs
- https://lmstudio.ai/ - LM Studio
- https://github.com/ggerganov/llama.cpp - llama.cpp
- https://github.com/ml-explore/mlx - MLX
- https://news.ycombinator.com/item?id=47624731 - HN: Ollama + Gemma 4 (Apr 2026)

### Web UIs
- https://github.com/open-webui/open-webui - Open WebUI (124K+ stars)
- https://github.com/Mintplex-Labs/anything-llm - AnythingLLM (54K+)
- https://github.com/danny-avila/LibreChat - LibreChat (22K+)
- https://github.com/huggingface/chat-ui - HF Chat-UI (~8K)
- https://github.com/oobabooga/text-generation-webui - Text Gen WebUI (~15K)

### Context Bridge
- https://github.com/BerriAI/litellm - LiteLLM (35,700+ stars)
- https://github.com/disler/just-prompt - just-prompt MCP
- https://github.com/digitalocean/claudo - claudo Anthropic proxy
- https://github.com/askalf/dario - dario multi-model router
- https://github.com/simonw/llm - Simon Willison's `llm` CLI (8,200+)
- https://github.com/rawveg/ollama-mcp - ollama-mcp
- https://docs.ollama.com/integrations/claude-code - Ollama + Claude Code official integration

### Validation Notes
- All star counts and prices verified via fork research 2026-04-29.
- Ollama v0.14+ Anthropic Messages API support confirmed in Ollama integration docs.
- Cloudflare tunnel pattern proven via existing `paperclip.zaoos.com` deployment (project memory `project_paperclip_infra`).
