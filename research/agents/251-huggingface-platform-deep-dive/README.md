# 251 — HuggingFace Platform Deep Dive: What ZAO Can Do With a Write Token

> **Status:** Research complete
> **Date:** April 2, 2026
> **Goal:** Map everything ZAO OS can do on HuggingFace beyond calling ACE-Step — organizations, custom models, LoRA training, Spaces, datasets, and community features

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Token type** | USE a **Write token** with fine-grained permissions: Read repos + Make calls to Inference Providers + Write access to repos under your namespace. This unlocks uploading LoRAs, creating Spaces, and pushing datasets |
| **HuggingFace Org** | CREATE a `thezao` organization on HuggingFace — free, hosts shared models/datasets/Spaces under one brand. All 188 members can be invited as contributors |
| **ACE-Step LoRA** | TRAIN a custom LoRA for "The ZAO Sound" — ACE-Step 1.5 supports LoRA fine-tuning from just 20-50 reference tracks with <4GB VRAM. Upload the trained LoRA to `thezao/ace-step-zao-sound` on HuggingFace for the community to use |
| **ZAO Music Dataset** | CREATE a `thezao/zao-community-tracks` dataset on HuggingFace — curated tracks from community submissions (`src/app/api/music/submissions/route.ts`). Useful for fine-tuning and music research |
| **ZAO Space** | DEPLOY a public Gradio Space at `thezao/zao-music-generator` — branded version of the ACE-Step generator with ZAO's custom LoRA pre-loaded. Free hosting on CPU Basic, ZeroGPU for GPU inference |
| **PRO plan** | UPGRADE to PRO ($9/mo) — gives 8x ZeroGPU quota (H200 GPUs, 70GB VRAM), highest queue priority, 20x inference credits, Spaces Dev Mode. Worth it for the queue priority alone since the free tier can have long waits |
| **Inference Endpoints** | SKIP for now — $0.50-5.00/hr for dedicated GPU. Only needed if ZAO grows beyond 500 concurrent users. The Gradio Space + ZeroGPU handles 188 members fine |
| **AutoTrain** | SKIP — low-code fine-tuning is nice but ACE-Step's own LoRA training script is more flexible and free |

## Comparison: What Each Token Type Unlocks

| Capability | Read Token | Write Token | No Token |
|-----------|-----------|-------------|----------|
| Call Inference Providers (ACE-Step Space) | Yes | Yes | No |
| Download public models/datasets | Yes | Yes | Yes |
| Upload models/LoRAs | No | **Yes** | No |
| Create/push Spaces | No | **Yes** | No |
| Create/push datasets | No | **Yes** | No |
| Create repos under org | No | **Yes** | No |
| Fine-grained API access | Yes | Yes | No |
| Join ZeroGPU queue | Yes | Yes | Yes (lowest priority) |

## Comparison: HuggingFace Plans for ZAO

| Feature | Free | PRO ($9/mo) | Team ($20/user/mo) |
|---------|------|-------------|-------------------|
| Public model/dataset hosting | Unlimited | Unlimited | Unlimited |
| Private repos | Limited | 10x storage | SSO + audit logs |
| ZeroGPU quota | 1x (long waits) | **8x + highest priority** | 8x per member |
| Inference credits | 1x | **20x** | 20x per member |
| Spaces Dev Mode | No | **Yes** | Yes |
| Blog posts on profile | No | **Yes** | Yes |
| PRO badge | No | **Yes** | Yes |
| Storage | Base | 10x private, 2x public | Advanced |

**For ZAO:** PRO at $9/mo is the sweet spot. Team plan only makes sense if multiple ZAO admins need separate accounts.

## What ZAO Can Build on HuggingFace

### 1. "The ZAO Sound" Custom LoRA

Train an ACE-Step 1.5 LoRA that captures The ZAO's musical identity — the genres, vibes, and production styles the community gravitates toward.

**How it works:**
- Collect 20-50 representative tracks from ZAO community submissions
- Use ACE-Step's built-in LoRA training (needs <4GB VRAM, runs on any RTX 3060+)
- Train for 500-1000 steps (~30 minutes on RTX 3090)
- Upload to `thezao/ace-step-zao-sound` on HuggingFace
- Update `src/app/api/music/generate/route.ts` to load the LoRA alongside the base model

**Community examples already on HuggingFace:**
- `ACE-Step/ACE-Step-v1.5-chinese-new-year-LoRA` — genre-specific LoRA
- `DisturbingTheField/ACE-Step-v1.5-acoustic-guitar-and-a-merge-LoRA` — trained on 6 self-recorded WAV files
- `DisturbingTheField/ACE-Step-v1.5-raspy-vocal-and-instrumental-5-LoRAs` — merged multi-style LoRA

### 2. ZAO Community Music Dataset

A curated dataset of community-submitted tracks, tagged with genres, moods, and artist info.

**What to include:**
- Audio files from `src/app/api/music/submissions/route.ts` (with artist consent)
- Metadata: genre, BPM, key, artist FID, Respect score
- Text descriptions (for training text-to-music models)
- Could grow into the first Farcaster music dataset on HuggingFace

**Format:** HuggingFace Datasets format (Parquet + audio files), pushable via `huggingface_hub` Python library or the `datasets` CLI.

### 3. ZAO Gradio Space (Branded Music Generator)

A public-facing Gradio app at `huggingface.co/spaces/thezao/zao-music-generator`:
- Pre-loaded with ZAO's custom LoRA
- Branded with ZAO's navy/gold theme
- Direct link from `community.config.ts` ecosystem section
- Free discovery — anyone on HuggingFace can find and use it
- Embeddable in ZAO OS via iframe (already in CSP allowlist pattern)

**Hosting:** Free on CPU Basic. ZeroGPU (H200, 70GB VRAM) for GPU inference — free for all users, PRO gets 8x quota and priority.

### 4. ZAO Organization Hub

Create `huggingface.co/thezao` as the community's AI hub:
- Host custom LoRAs, datasets, and Spaces under one brand
- Invite community members as contributors
- Organization card (like a profile page) with description, links, branding
- All repos discoverable on HuggingFace search

### 5. Music Embeddings Dataset (Future)

If ZAO adopts BGE-M3 for semantic search (Doc 247), the embedding vectors for the music library could be stored as a HuggingFace dataset — enabling community members to build recommendation models on top of ZAO's music graph.

## HuggingFace GPU Pricing Reference

| GPU | VRAM | Spaces (per hour) | Inference Endpoints |
|-----|------|-------------------|-------------------|
| CPU Basic | — | **FREE** | $0.03/hr |
| NVIDIA T4 | 16GB | $0.40/hr | $0.50/hr |
| NVIDIA L4 | 24GB | $0.80/hr | $0.80/hr |
| NVIDIA A10G | 24GB | $1.00/hr | $1.00/hr |
| NVIDIA L40S | 48GB | $1.80/hr | $1.80/hr |
| NVIDIA A100 | 80GB | $2.50/hr | $2.50/hr |
| NVIDIA H200 | 70GB | **FREE (ZeroGPU)** | $5.00/hr |

**ZeroGPU is the move** — free H200 (70GB VRAM) with dynamic allocation. PRO ($9/mo) gets 8x quota and highest priority.

## ZAO OS Integration

### Currently Using HuggingFace

| File | What It Does | Token Needed |
|------|-------------|-------------|
| `src/app/api/music/generate/route.ts` | Calls ACE-Step v1.5 Gradio Space via `@gradio/client` | Read + Inference |
| `src/components/music/AiMusicGenerator.tsx` | Frontend for AI music generation | — |
| `.env.local` → `HF_TOKEN` | Authentication token | — |

### New Integration Points (with Write Token)

| Feature | File to Create/Update | What It Does |
|---------|----------------------|-------------|
| **Upload LoRA** | New: `scripts/upload-lora.ts` | Push trained LoRA to `thezao/ace-step-zao-sound` |
| **LoRA selector in generator** | Update: `src/components/music/AiMusicGenerator.tsx` | Dropdown to pick LoRA style (ZAO Sound, Lo-fi, Hip-hop, etc.) |
| **Dataset push** | New: `scripts/push-music-dataset.ts` | Export music submissions to HuggingFace dataset |
| **Ecosystem link** | Update: `community.config.ts` | Add HuggingFace org to ecosystem partners |
| **Space embed** | Update: `src/app/(auth)/ecosystem/page.tsx` | Embed the ZAO Gradio Space in ecosystem page |

### Token Permissions Needed

For the Write token, check these fine-grained permissions:
- **Read access to repos** — download models
- **Make calls to Inference Providers** — call ACE-Step Space
- **Write access to repos under your namespace** — upload LoRAs, datasets, Spaces
- **Read access to public gated repos** — access gated models if needed

Everything else can stay unchecked.

## Implementation Roadmap

| Phase | What | Cost | Time |
|-------|------|------|------|
| **Now** | Create Write token with correct permissions, add to `.env.local` | Free | 5 min |
| **Phase 1** | Create `thezao` org on HuggingFace, add description + branding | Free | 15 min |
| **Phase 2** | Train ZAO Sound LoRA (20-50 tracks, ACE-Step training script) | Free (local GPU) | 1-2 hours |
| **Phase 3** | Upload LoRA to `thezao/ace-step-zao-sound`, add to generator | Free | 30 min |
| **Phase 4** | Deploy branded Gradio Space at `thezao/zao-music-generator` | Free (CPU) or PRO ($9/mo for ZeroGPU priority) | 2 hours |
| **Phase 5** | Create community music dataset from submissions | Free | 1 day |
| **Phase 6** | Add LoRA selector to AI Music Generator component | Free | 2 hours |

## Sources

- [HuggingFace Pricing](https://huggingface.co/pricing) — Free, PRO ($9/mo), Team ($20/user/mo), Enterprise ($50/user/mo)
- [HuggingFace Organizations](https://huggingface.co/docs/hub/en/organizations) — Create and manage team accounts
- [HuggingFace Security Tokens](https://huggingface.co/docs/hub/security-tokens) — Token types, permissions, fine-grained access
- [ZeroGPU Documentation](https://huggingface.co/docs/hub/en/spaces-zerogpu) — Free H200 GPU, PRO gets 8x quota
- [ACE-Step 1.5 GitHub](https://github.com/ace-step/ACE-Step-1.5) — LoRA training, local deployment
- [ACE-Step LoRA Training Guide](https://fm9.ai/ace-step/lora-training) — Step-by-step LoRA fine-tuning
- [HuggingFace Hub Quick Start](https://huggingface.co/docs/huggingface_hub/quick-start) — Programmatic upload, create repos
- [HuggingFace Music Datasets](https://huggingface.co/datasets?other=music) — Existing music datasets on HF
- [ACE-Step LoRA Examples](https://huggingface.co/models?search=ace-step+lora) — Community LoRA uploads
- [Doc 247 — Top 50 Local AI Models](../../agents/247-top-50-local-ai-models-2026/) — ACE-Step 1.5 research
