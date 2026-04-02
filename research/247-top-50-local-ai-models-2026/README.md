# 247 — Top 50 Local AI Models for Privacy + Best Outputs (2026)

> **Status:** Research complete
> **Date:** April 2, 2026
> **Goal:** Evaluate the top local AI models from @meta_alchemist's comprehensive guide, filtered through ZAO OS's needs as a 188-member gated Farcaster music community on Next.js 16 + Supabase + Neynar
> **Source:** [@meta_alchemist on X](https://x.com/meta_alchemist) — April 1, 2026 thread

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Music generation** | UPGRADE to **ACE-Step 1.5 XL (4B DiT)** from current v1-3.5B — <2s/song on A100, <10s on RTX 3090, <4GB VRAM, LoRA training from a few songs, 50+ language lyrics, Apache 2.0. Already integrated at `src/app/api/music/generate/route.ts` via HuggingFace Inference API — update model ID from `ACE-Step/ACE-Step-v1-3.5B` to `ACE-Step/ACE-Step-v1.5-XL` |
| **TTS for accessibility** | USE **Kokoro-82M** — 82M params, CPU-only, Apache 2.0, 50 voices, 6 languages, 2.2M+ downloads. Deploy via Kokoro-FastAPI container. Solves: read-aloud for proposals, audio versions of governance posts, podcast narration |
| **TTS for artist voice cloning** | USE **Voxtral TTS 4B** (Mistral) — 3-second voice cloning, preferred over ElevenLabs by 62.8% in blind tests, 9 European languages, free self-hosted. For artist intros, personalized notifications |
| **Embeddings for future RAG** | USE **BGE-M3** (568M) as default — ~1.2GB VRAM, 1000+ languages, dense+sparse+multi-vector in one model, Apache 2.0. Scale to **Qwen3-Embedding-8B** (MTEB #1, 32K context, Matryoshka dimensions) when research library exceeds 500 docs. ZAO currently uses Supabase `textSearch` (full-text), not vector search |
| **Local coding model** | USE **OmniCoder-9B** for lightweight local dev — 5.5GB VRAM (Q4), 262K context, trained on Claude Opus 4.6 traces, strong agentic behavior, Apache 2.0. Or **Qwen3-Coder-Next 80B** for heavy multi-file editing |
| **Image generation** | USE **FLUX.1 Schnell** for community art — Apache 2.0 (commercial OK), 4-step generation, 12GB VRAM. For edits/brand consistency: **FLUX.1 Kontext Dev** (reference image + text prompt) |
| **Video generation** | USE **Wan 2.2 A14B** (Apache 2.0) for local video — supplements Doc 209's cloud recommendations (Seedance, Neural Frames). 6GB VRAM minimum with 1.3B variant. VBench 84.7%+ |
| **Speech-to-text** | USE **Whisper Large-v3** — 99 languages, Apache 2.0, massive tooling ecosystem. Already industry standard. For live transcription in Spaces, pair with existing Deepgram integration (Doc 216) |
| **Edge/mobile model** | SKIP for now — ZAO is a web app (PWA), not a native mobile app. Revisit Qwen3.5-2B/4B and Phi-4-mini if ZAO ships a Capacitor native app |
| **3D generation** | SKIP — not relevant to ZAO's music community use case |
| **Lip sync** | SKIP for now — Doc 209 covers video tooling. Revisit MuseTalk/Wav2Lip when artist video content pipeline is built |

## Comparison of Options — ZAO-Relevant Models

### Music Generation (Most Critical for ZAO)

| Model | Params | VRAM | License | Duration | Key Feature | ZAO Fit |
|-------|--------|------|---------|----------|-------------|---------|
| **ACE-Step 1.5 XL** | 4B DiT | <4GB | Apache 2.0 | 10s–10min | LoRA from few songs, 50+ lang lyrics, batch 8 songs | **BEST** — already using v1 via HF API |
| **HeartMuLa-oss-3B** | 3B | ~2GB | Open | Variable | Best lyrics controllability (HeartBeats Benchmark) | Good alt for lyrics-heavy generation |
| **YuE AI** | Variable | Multi-GPU | Open | Up to 5min | Full songs with synchronized vocals + instruments | Too heavy for cloud API usage |
| **Meta AudioCraft/MusicGen** | Variable | 12GB+ | MIT (research) | Short clips | PyTorch toolkit, sound effects + music | Research only, ACE-Step surpasses it |

### Text-to-Speech

| Model | Params | VRAM | License | Languages | Voice Clone | Best For |
|-------|--------|------|---------|-----------|-------------|---------|
| **Kokoro-82M** | 82M | CPU-only | Apache 2.0 | 6 | No | Accessibility, narration, ultra-lightweight |
| **Voxtral TTS 4B** | 4B | 8GB+ | Mistral Open | 9 EU | 3-second clone | Artist voice features, notifications |
| **Qwen3-TTS** | 0.6B/1.7B | ~0.5-1.1GB | Apache 2.0 | 10 | Describe voice in text | Creative voice design, CJK support |
| **Higgs Audio V2** | 3B (Llama) | ~2GB | Open | Multi | Yes | Emotional expressiveness |
| **Bark (Suno)** | Transformer | 4GB+ | MIT | Multi | No | Laughter, sighs, background sounds |

### Embeddings / RAG

| Model | Params | VRAM | License | Context | MTEB Score | Best For |
|-------|--------|------|---------|---------|------------|---------|
| **BGE-M3** | 568M | ~1.2GB | Apache 2.0 | 8,192 | 68.1 (EN) | Default RAG, 1000+ languages, triple retrieval |
| **Qwen3-Embedding-8B** | 8B | ~5GB | Apache 2.0 | 32,000 | 72.4 (#1 self-hosted) | Scale-up option, code embeddings, Matryoshka dims |
| **Jina Embeddings v4** | 3.8B | ~3GB | Apache 2.0 | 8,192 | High | Multimodal (text+images+PDFs in one space) |

### Coding / Agentic

| Model | Params | VRAM | License | Context | Key Feature | Best For |
|-------|--------|------|---------|---------|-------------|---------|
| **OmniCoder-9B** | 9B | ~5.5GB | Apache 2.0 | 262K (1M+) | Trained on Claude Opus 4.6 traces | Lightweight local coding agent |
| **Qwen3-Coder-Next 80B** | 80B MoE | 32GB+ | Apache 2.0 | 128K | Multi-file repo editing | Heavy local coding (Claude Code backend) |
| **GLM-4.7-Flash** | 355B MoE (30B@24GB) | 24GB | MIT | 200K | Best 24GB agentic coding model | Dedicated coding workstation |
| **Qwen 2.5 Coder 14B** | 14B | ~8.8GB | Apache 2.0 | 128K | FIM for IDE autocomplete, 85% HumanEval | Solo vibe coding on 16GB VRAM |

### General Purpose (Reference)

| Model | Params (Active) | VRAM | License | Context | Intelligence Index | Notable |
|-------|-----------------|------|---------|---------|-------------------|---------|
| **GLM-5** | 744B (40B active) | 80GB+ | MIT | 205K | 50 (#1 open) | Zero US hardware, SWE-bench 77.8% |
| **MiniMax M2.5** | 230B (10B active) | 128GB+ RAM | Modified MIT | 256K | 46 | Most-used on OpenRouter, interleaved thinking |
| **Qwen3.5-27B** | 27B dense | ~17GB | Apache 2.0 | 262K | — | Anti-slop, fits single 24GB GPU, 201 languages |
| **Llama 4 Scout** | 109B (17B active) | 48GB+ | Llama 4 | **10M tokens** | — | Feed entire codebases |
| **GPT-OSS 120B** | 117B MoE | 80GB | OpenAI Open | Long | Matches o4-mini | OpenAI's first open-weight since GPT-2 |

## ZAO OS Integration

### Already Built — Upgrade Path

ZAO OS already integrates ACE-Step v1-3.5B for AI music generation:

- **API route:** `src/app/api/music/generate/route.ts` — calls HuggingFace Inference API with `ACE-Step/ACE-Step-v1-3.5B`
- **Component:** `src/components/music/AiMusicGenerator.tsx` — genre pills, prompt input, duration slider, audio playback
- **Upgrade:** Change HF model ID to `ACE-Step/ACE-Step-v1.5-XL` for dramatically better output quality. ACE-Step 1.5 adds LoRA personalization, cover generation, vocal-to-BGM conversion, and 50+ language lyrics. No code changes needed beyond the model ID — same HuggingFace Inference API

### Not Yet Built — Future Integration Points

| Feature | Model | Integration Point | Priority |
|---------|-------|-------------------|----------|
| **Music recommendation RAG** | BGE-M3 | `src/lib/music/library.ts` — replace `textSearch` with pgvector similarity | P2 — needs Supabase pgvector extension enabled |
| **Research library search** | BGE-M3 or Qwen3-Embedding | 247+ research docs in `research/` — semantic search over the knowledge base | P3 — useful when library exceeds 300 docs |
| **Proposal read-aloud** | Kokoro-82M | `src/components/governance/` — add audio playback for governance proposals | P3 — accessibility feature |
| **Artist voice intros** | Voxtral TTS 4B | `src/components/members/` — personalized audio greetings on profile pages | P4 — nice-to-have |
| **Live room transcription** | Whisper Large-v3 | `src/components/spaces/` — real-time captions. Doc 216 recommends Deepgram for live, Whisper for archival | P2 — accessibility + searchability |
| **Album art generation** | FLUX.1 Schnell | New route `src/app/api/music/generate-art/route.ts` — pair with music gen | P3 — artist tool |

### Current Search Architecture vs Vector Search

ZAO OS currently uses **Supabase full-text search** (PostgreSQL `tsvector`):
- `src/lib/music/library.ts:112` — `query.textSearch('search_vector', search, { type: 'websearch' })`
- `src/app/api/search/route.ts` — unified search across members, tracks, proposals, casts

To add semantic/vector search, enable Supabase pgvector extension and embed content with BGE-M3 (568M, fits on any GPU with 4GB+). This would enable "find songs that sound like X" and "find research docs about Y concept" even when exact keywords don't match.

## Hardware Reference

For ZAO's VPS (Hostinger KVM 2 at 31.97.148.88) and Zaal's local dev:

| Tier | Budget | GPU | Models That Fit |
|------|--------|-----|-----------------|
| **Minimal (CPU-only)** | $0 | None | Kokoro-82M (TTS), LFM-2.5-350M, Qwen3.5-2B |
| **Consumer (8GB VRAM)** | $200-500 | RTX 3060/4060 | OmniCoder-9B, BGE-M3, Qwen 2.5 Coder 14B, Phi-4-mini |
| **Prosumer (16GB VRAM)** | $500-1K | RTX 4070Ti/4080 | FLUX.1 Schnell, Wan 2.2 (1.3B), ACE-Step 1.5 local |
| **Enthusiast (24GB VRAM)** | $1-2K | RTX 3090/4090 | Qwen3.5-27B, GLM-4.7-Flash, FLUX.2 Dev, Wan 2.2 14B |
| **Mac Studio (64-128GB)** | $2-4K | Apple Silicon | MiniMax M2.5 (60+ t/s on M5 Max 128GB), Llama 4 Scout |

**For ZAO's HuggingFace Inference API approach** (current): No local GPU needed. HF handles compute. Upgrade the model ID and you're done.

## Key Benchmarks & Resources

| Resource | URL | What It Tracks |
|----------|-----|----------------|
| Open LLM Leaderboard | huggingface.co/spaces/open-llm-leaderboard | General LLM rankings |
| Artificial Analysis | artificialanalysis.ai/leaderboards/models | Intelligence Index, speed, cost |
| MTEB Leaderboard | huggingface.co/spaces/mteb/leaderboard | Embedding model rankings |
| LiveCodeBench | livecodebench.github.io | Coding model benchmarks |
| SWE-bench | swebench.com | Real-world software engineering |
| VRAM Calculator | apxml.com/tools/vram-calculator | Check if a model fits your hardware |
| Ollama | ollama.com | One-command local model runner |
| LM Studio | lmstudio.ai | GUI for running local models |
| ComfyUI | github.com/comfyanonymous/ComfyUI | Image/video generation workflows |

## Cross-References to Existing Research

| Doc | Topic | Relationship |
|-----|-------|-------------|
| **Doc 209** | AI Video Generation Tools | Cloud-based video gen (Seedance, Neural Frames). This doc adds local alternatives (Wan 2.2, CogVideoX, Mochi 1) |
| **Doc 216** | AI Features for Live Rooms | Recommends Deepgram for live transcription. Whisper Large-v3 from this doc is the local/archival alternative |
| **Doc 42** | Supabase Advanced Patterns | Covers pgvector setup. BGE-M3/Qwen3-Embedding would plug into this |
| **Doc 130** | Next Music Integrations | AI recs via pgvector mentioned. BGE-M3 is the embedding model to use |
| **Doc 227** | Agentic Workflows 2026 | Local coding models (OmniCoder-9B, Qwen3-Coder) could serve as cheaper agent backends |
| **Doc 161** | Agent Harness Engineering | LangChain/agent patterns that could use local models as backends |

## Article Quality Assessment

The @meta_alchemist article is **high quality and mostly accurate** as of April 2026:

**Strengths:**
- Comprehensive coverage across 10 categories (50 models + extras)
- Hardware-specific VRAM requirements for every model
- License information included (critical for commercial use)
- Benchmark sources cited
- Practical "cheat code" workflow at the end

**Minor Inaccuracies/Notes:**
- ACE-Step 1.5 article says "12GB VRAM" for RTX 3090 — actual RTX 3090 has 24GB VRAM. ACE-Step 1.5 needs <4GB VRAM per official docs
- "Bark" link has a typo: `suno/barkt` instead of `suno/bark`
- Some benchmark numbers are hard to independently verify (e.g., exact Intelligence Index scores)
- MiniMax M2.5 "Modified MIT" license detail is important — requires displaying "MiniMax M2.5" in UI for commercial use
- HeartMuLa-oss-3B "internal 7B version" is not publicly available — only the 3B is open

**ZAO-Specific Gaps:**
- No coverage of Farcaster-specific AI models or agents
- No mention of Supabase pgvector for embeddings (the typical indie stack approach)
- Music gen section could have been deeper — ACE-Step 1.5 deserves more detail given its April 2, 2026 XL release

## Sources

- [ACE-Step 1.5 GitHub](https://github.com/ace-step/ACE-Step-1.5) — Apache 2.0, music foundation model
- [ACE-Step 1.5 Paper](https://arxiv.org/abs/2602.00744) — Architecture and benchmark details
- [ACE-Step 1.5 on AMD](https://www.amd.com/en/blogs/2026/commercial-grade-ai-music-generation-on-amd-ryzen-ai-and-radeon-ace-step-1-5.html) — Cross-platform support confirmation
- [Kokoro-82M on Hugging Face](https://huggingface.co/hexgrad/Kokoro-82M) — Apache 2.0, 2.2M+ downloads
- [Kokoro Local TTS Guide](https://ariya.io/2026/03/local-cpu-friendly-high-quality-tts-text-to-speech-with-kokoro) — CPU deployment walkthrough
- [OmniCoder-9B on Hugging Face](https://huggingface.co/Tesslate/OmniCoder-9B) — Apache 2.0, 262K context
- [BGE-M3 vs Qwen3-Embedding Comparison](https://agentset.ai/embeddings/compare/qwen3-embedding-8b-vs-baaibge-m3) — Head-to-head benchmark data
- [Best Embedding Models 2026](https://www.bentoml.com/blog/a-guide-to-open-source-embedding-models) — Comprehensive embedding landscape
- [Qwen3-Coder-Next Review](https://www.xda-developers.com/tested-qwen3-coder-next-four-local-ai-coding-models-gap-embarassing/) — Local coding model comparison
- [@meta_alchemist original thread](https://x.com/meta_alchemist) — Source article, April 1, 2026
