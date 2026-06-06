---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-06-06
superseded-by:
related-docs: 567, 568, 802
original-query: "Local AI assistant stack to upgrade Siri on Mac: Raycast + Ollama (local DeepSeek/llama models) + Apple Intelligence/ChatGPT. Best setup, speed/model trade-offs on 24GB M4, free vs paid (Raycast Pro), and how the layers combine. Tier STANDARD."
tier: STANDARD
---

# 803 - Local AI Assistant Stack: Raycast + Ollama + Apple Intelligence (Mac "Siri upgrade")

> **Goal:** A no-fluff setup for a fast, mostly-free, partly-local AI assistant on a 24GB M4 Mac that replaces the Siri experience - keyboard-instant + voice + private offline reasoning.

## Key Decisions (do this)

| Decision | Why | Cost |
|----------|-----|------|
| **USE Raycast + the Ollama local-model integration** as the primary assistant | Raycast v1.99.0+ runs local Ollama models on the FREE tier - keyboard-summoned, near-instant, offline, private. This is the real "Siri upgrade." | $0 |
| **USE `llama3.2` (3B) as the default Raycast model**, switch to `deepseek-r1:14b` only for hard reasoning | r1:14b is a reasoning model - it thinks out loud, so it is slow + verbose. Wrong tool for quick lookups. 3B answers feel instant on M4. | $0 |
| **ENABLE Apple Intelligence + the ChatGPT extension** for the voice layer | macOS 26 Siri taps ChatGPT for deep answers by voice; works without a ChatGPT account. Covers hands-free. | $0 (Plus optional) |
| **SKIP Raycast Pro for now** ($8/mo) unless you want cloud frontier models (Claude/GPT) built into Raycast | The free Ollama path already gives instant local AI. Pro/Advanced AI is only worth it if you want one-keystroke Claude Opus / GPT-5 without leaving Raycast. | $8/mo if added |

## The three layers (how they combine)

| Layer | Tool | Trigger | Brain | Best for |
|-------|------|---------|-------|----------|
| Keyboard-instant | Raycast + Ollama | hotkey (Option+Space) | local llama3.2 / deepseek | quick lookups, private, offline, while typing |
| Voice / hands-free | Apple Intelligence Siri + ChatGPT | "Hey Siri" / side button | on-device + Private Cloud Compute + ChatGPT | hands-free, in-context (photos/docs) |
| Cloud frontier (optional) | Raycast Pro / Advanced AI | same hotkey | Claude Opus 4.8, GPT-5.x, Gemini | hardest questions, no local-RAM limit |

## Findings

**Raycast local models are free (the big one).**
- Raycast **v1.99.0** introduced Local Models via an Ollama integration - "more than 100 AI models... 135M to 671B parameters." Free-tier users can use Raycast AI with local Ollama models at no cost (confirmed on the official billing page: "Free users are also welcome to use Raycast AI with local models installed on their device via Ollama").
- Setup: install Ollama, then Raycast **Settings -> AI tab -> Local Models** (paste model names) - Raycast auto-detects the running Ollama server on `localhost:11434` and you select "Local Model (Ollama)" as the provider. A community writeup (Daniyal Master) confirms "near-instant responses, no internet connection required."

**Raycast Free vs Pro (current as of 2026-06-06):**
- **Free, forever:** all core features (Clipboard History, Snippets, Window Management, Calculator), unlimited Extensions Store, **local Ollama models**, BYOK (use your own OpenAI/Anthropic API key), plus a one-time 50 trial messages for Pro models. Mac v2 beta also gets free GPT-5.4 mini at 300 requests/hr.
- **Pro: starts $8/month** (14-day trial; 20% off yearly; 50% student discount). Adds Raycast AI cloud models, Cloud Sync, Translator, custom themes.
- **Advanced AI:** add-on on top of Pro for frontier models (Claude Opus 4.8, GPT-5.x Reasoning, Gemini 3.1 Pro, etc.) - the `*`-marked models require this tier.

**Apple Intelligence + ChatGPT (the voice layer, macOS 26 Tahoe):**
- Setup: **System Settings -> Apple Intelligence & Siri -> Extensions -> ChatGPT -> Set Up**. Works **without** a ChatGPT account; connect a free or paid account for more access + saved chats.
- Siri taps ChatGPT for in-depth answers and document/photo understanding; **asks before sending** (can disable via "Confirm ChatGPT Requests" off, or prefix with "Ask ChatGPT" to go direct).
- Privacy: on-device first, Private Cloud Compute for heavy requests, IP obscured from OpenAI, requests not used for training.
- Caveat: the deeper "personal-context" Siri overhaul is still rolling out ("features still in development"); today's win is the ChatGPT tap-through + type-to-Siri + more natural voice.

**Model speed/RAM on the 24GB M4 (from this machine's Ollama install):**
- `llama3.2` (3B, 2.0GB) - snappy, instant-feeling. Default for assistant use.
- `deepseek-r1:14b` (9.0GB) - strong reasoning, but slow + verbose (chain-of-thought). Reach for it deliberately.
- `qwen3:30b` (18GB) - usable but pushes RAM; noticeably slower; not for instant assistant use.
- Rule of thumb: 3B-8B = instant assistant; 14B = thinking model; 30B = batch/heavy only on 24GB.

## Also See

- [Doc 567](../567-hugging-face-local-models/) - local model runners (Open WebUI, LM Studio, Ollama, LiteLLM)
- [Doc 568](../568-aware-brain-memory-knowledge-graph/) - local KG chat + memory stack
- [Doc 802](../802-zao-skill-stack-starter-guide/) - ZAO skill stack starter guide

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Install the Ollama extension in Raycast + set Local Model (Ollama) as AI provider, default `llama3.2` | @Zaal | Setup | Now |
| Set Raycast hotkey to Option+Space (or replace Spotlight on Cmd+Space) | @Zaal | Setup | Now |
| Enable Apple Intelligence + ChatGPT extension in System Settings | @Zaal | Setup | Now |
| Decide Raycast Pro ($8/mo) after a week of free local use - only if cloud frontier models are missed | @Zaal | Decision | +1 week |
| Optional: delete `qwen3:30b` (18GB) if unused - DeepSeek + llama cover the range | @Zaal | Cleanup | When convenient |

## Sources

- [Raycast Billing / Manual](https://manual.raycast.com/billing) - [FULL] free tier includes local Ollama + BYOK; Pro tiers
- [Raycast v1.99.0 - Local Models changelog](https://www.raycast.com/changelog/1-99-0) - [FULL] Ollama integration, 100+ models, setup
- [Raycast AI Usage Limits](https://manual.raycast.com/ai/usage-limits) - [FULL] free 50 msgs, GPT-5.4 mini beta, 300 req/hr
- [Raycast Pro](https://www.raycast.com/pro) - [FULL] $8/mo start, model list, Advanced AI add-on
- [Running AI Locally with Raycast & Ollama - Daniyal Master](https://daniyalmaster.vercel.app/blog/running-ai-locally-with-raycast-and-ollama) - [FULL] community setup writeup (the 1 community source)
- [Use ChatGPT with Apple Intelligence on Mac - Apple Support](https://support.apple.com/guide/mac-help/use-chatgpt-with-apple-intelligence-mchlfc5cf131/mac) - [FULL] ChatGPT extension setup steps
- [What is Apple Intelligence - OpenAI Help](https://help.openai.com/en/articles/10263313-what-is-apple-intelligence) - [FULL] account vs no-account
- [How to get Apple Intelligence - Apple Support](https://support.apple.com/en-us/121115) - [FULL] macOS 26 Siri features, still-in-development note
