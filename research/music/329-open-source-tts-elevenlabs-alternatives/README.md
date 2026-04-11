# Doc 329 - Open Source Text-to-Speech: ElevenLabs Alternatives (April 2026)

> Deep dive on open source TTS models that can clone voices and generate natural-sounding speech. Covers 18+ models, quality benchmarks, voice cloning requirements, Mac M-series compatibility, and deployment options.

---

## Part 1: The Big Picture (April 2026)

The open source TTS landscape has shifted dramatically. The MOS quality gap between open source and ElevenLabs shrank from ~1.0 in 2023 to 0.1-0.2 MOS in 2026. Two models - Chatterbox (Resemble AI) and Voxtral (Mistral) - have beaten ElevenLabs in blind listening tests. The era of "open source sounds robotic" is over.

**Key milestones:**
- Chatterbox beat ElevenLabs 63.75% in blind A/B tests
- Voxtral TTS beat ElevenLabs Flash v2.5 in 68.4% of blind tests
- Sesame CSM hit 4.7 MOS, Orpheus 4.6 MOS (ElevenLabs Turbo v2.5: 4.8 MOS)
- Fish Speech S2 passed the Audio Turing Test - listeners could only identify it as AI 48.5% of the time
- Kokoro (82M params) reached #1 on TTS Arena, beating models 15x its size

---

## Part 2: Model-by-Model Breakdown

### 1. Coqui TTS / XTTS v2

**Status:** Coqui AI shut down December 2025 after failing to monetize. Code remains on GitHub, community maintains it, but no major model improvements expected.

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/coqui-ai/TTS |
| HuggingFace | https://huggingface.co/coqui/XTTS-v2 |
| Parameters | 467M |
| MOS | 4.0 |
| Voice Cloning | Yes - 6 second reference clip |
| Languages | 17 (en, es, fr, de, it, pt, pl, tr, ru, nl, cs, ar, zh, ja, hu, ko) |
| Streaming Latency | <150ms on consumer GPU |
| VRAM | ~4 GB |
| License | Coqui Public Model License (restrictive for commercial) |
| RTF | 0.18 |

**Strengths:** Mature ecosystem, emotion/style transfer via cloning, cross-lingual voice cloning, good documentation. Battle-tested in production by thousands of users.

**Weaknesses:** Company dead, license is not truly open, community updates are infrequent. Being surpassed by newer models on quality benchmarks.

**Verdict:** Still usable but declining. Migrate to Chatterbox or Fish Speech for new projects.

---

### 2. Bark (Suno)

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/suno-ai/bark |
| HuggingFace | https://huggingface.co/suno/bark |
| Parameters | 900M |
| MOS | 3.7 |
| Voice Cloning | Limited - 100+ speaker presets, no true zero-shot cloning |
| Languages | 13 |
| VRAM | ~6 GB |
| License | MIT |
| RTF | 0.85 (slow) |

**Can it sing?** Yes - Bark can generate music, singing, laughter, sighing, crying, and sound effects. It is a text-to-audio model, not just text-to-speech.

**Voice cloning reality:** The original library restricts audio prompts to synthetic presets from Suno. Community forks like `serp-ai/bark-with-voice-clone` (https://github.com/serp-ai/bark-with-voice-clone) add real voice cloning but quality is inconsistent.

**Strengths:** MIT license, unique audio generation capabilities (music + speech + effects), GPT-style architecture.

**Weaknesses:** Slow (RTF 0.85), output limited to ~14 second segments, no real voice cloning in official release, lower MOS than newer models.

**Verdict:** Interesting for creative audio/music generation. Not competitive for pure TTS quality in 2026.

---

### 3. Tortoise TTS

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/neonbjb/tortoise-tts |
| Parameters | ~1B+ (multi-stage) |
| MOS | ~4.0 |
| Voice Cloning | Yes - needs 20+ minutes of reference audio for best results |
| Languages | English only |
| License | Apache 2.0 |
| RTF | Very slow (minutes per clip) |

**Quality:** Superior prosody and emotional range in blind listening tests. Version 2.4.2 (2025) narrowed the speed gap to 3.5x slower than ElevenLabs while maintaining quality.

**Strengths:** Exceptional quality for English, good for audiobook production where speed does not matter.

**Weaknesses:** Painfully slow, English only, needs extensive reference audio, cannot support real-time use cases.

**Verdict:** Legacy model. Quality king dethroned by Chatterbox, Orpheus, and Sesame CSM which match or exceed quality at 100x the speed.

---

### 4. Piper TTS

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/rhasspy/piper |
| Parameters | 6-60M |
| MOS | 3.5 |
| Voice Cloning | No - pre-trained voice models only |
| Languages | 30+ |
| VRAM | <100 MB |
| License | MIT |
| RTF | 0.008 (extremely fast) |
| Latest | v1.4.2 (April 2, 2026) |

**Strengths:** Blazing fast (RTF 0.008), runs on Raspberry Pi 4/5, tiny footprint (<100 MB), 30+ languages, MIT license, actively maintained, perfect for offline/embedded/IoT.

**Weaknesses:** No voice cloning, lower quality than neural models (VITS-based), voices sound decent but not human-indistinguishable.

**Verdict:** Best choice for embedded systems, voice assistants, home automation, IoT. Not for high-quality voice cloning or expressive speech.

---

### 5. Fish Speech / Fish Audio S2 Pro

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/fishaudio/fish-speech |
| Parameters | V1.5: 500M / S2 Pro: 4B |
| MOS | 4.1 |
| Voice Cloning | Yes - 10-30 second reference, 80+ languages |
| Languages | 80+ |
| Streaming | Yes |
| License | CC-BY-NC-SA 4.0 (non-commercial without separate license) |
| TTS Arena ELO | 1339 (V1.5) |

**Audio Turing Test:** S2 scored 0.515 - listeners correctly identified AI only 48.5% of the time. Essentially indistinguishable from human.

**Emotional control:** The standout feature. Over 15,000 free-form emotion tags - not fixed presets. Write `[whisper in a small, frightened voice]` or `[laughing warmly]` and the model understands natural language descriptions.

**Strengths:** Near-human quality, strongest emotional control of any open source model, massive language support, excellent voice cloning. Fish Speech V1.5 ranked #1 in 2026 open source recommendations.

**Weaknesses:** CC-BY-NC-SA license requires commercial license from Fish Audio. S2 Pro (4B) needs serious GPU.

**Verdict:** Top-tier quality. The emotional control system is unmatched. Commercial users need to negotiate licensing.

---

### 6. Parler TTS

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/huggingface/parler-tts |
| HuggingFace | parler-tts/parler-tts-large-v1 |
| Parameters | 880M (Large), smaller variants available |
| MOS | 3.8 |
| Voice Cloning | No - uses text descriptions to define voices |
| Languages | 1 (English), Multilingual variant available |
| VRAM | ~4 GB |
| License | Apache 2.0 |
| RTF | 0.22 |

**Unique approach:** Describe the voice you want in natural language: "A female speaker with a warm, slightly husky voice delivers an animated speech at moderate speed." The model generates a matching voice.

**Variants:**
- Mini v1 (fast, smaller)
- Large v1 (higher quality)
- Tiny v1 (lightest)
- Mini Expresso (emotion control: happy, confused, laughing, sad + consistent named voices)

**Strengths:** No reference audio needed, Apache 2.0 license, HuggingFace backing, creative voice design via text.

**Weaknesses:** Cannot clone a specific real voice, lower MOS than cloning-capable models, English-primary.

**Verdict:** Great for generating diverse synthetic voices without reference audio. Not for voice cloning.

---

### 7. MARS5 TTS (Camb AI)

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/Camb-ai/MARS5-TTS |
| HuggingFace | CAMB-AI/MARS5-TTS |
| Parameters | 1.2B (750M AR + 450M NAR) |
| Voice Cloning | Yes - 5 second clip, "deep clone" with transcript improves quality |
| Languages | English (open source), 140 via API |
| License | GNU AGPL 3.0 |

**Quality:** VentureBeat testing showed MARS5 outperformed MetaVoice and ElevenLabs in some scenarios. Trended to #3 on HuggingFace at launch.

**Deep clone feature:** Providing the transcript of the reference audio enables higher quality cloning at the cost of slower generation.

**Note:** Camb AI has released MARS8 as of 2026, the commercial successor.

**Strengths:** Good voice cloning from 5 seconds, deep clone option, strong prosody for hard scenarios (sports commentary, anime).

**Weaknesses:** AGPL license is restrictive for commercial, English only in open source, larger model.

**Verdict:** Solid for English voice cloning with AGPL-compatible projects. MARS8 is where the team's focus has shifted.

---

### 8. OpenVoice v2 (MyShell / MIT)

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/myshell-ai/OpenVoice |
| HuggingFace | myshell-ai/OpenVoiceV2 |
| Voice Cloning | Yes - 30 second reference |
| Languages | 6 native (en, es, fr, zh, ja, ko) + zero-shot cross-lingual |
| License | MIT |

**Architecture:** Two-step process: (1) base speaker model generates speech with language and style, (2) tone color converter matches the reference speaker's vocal characteristics. This separation allows independent control of tone, emotion, and language.

**Cross-lingual:** Can clone a voice in one language and generate speech in another language not in the training set - zero-shot cross-lingual transfer.

**Strengths:** MIT license, instant cloning, cross-lingual transfer, granular tone control, used by millions on MyShell.ai.

**Weaknesses:** Quality slightly behind newer models (Fish Speech, Chatterbox), requires 30 seconds of reference audio (more than most competitors).

**Verdict:** Excellent for cross-lingual applications. MIT license makes it very deployment-friendly.

---

### 9. F5-TTS / E2-TTS

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/SWivid/F5-TTS |
| HuggingFace | SWivid/F5-TTS |
| Parameters | 336M |
| MOS | 4.1 |
| Voice Cloning | Yes - 5-15 seconds reference |
| Languages | 2 (English, Chinese) |
| VRAM | ~4 GB |
| License | CC-BY-NC 4.0 |
| RTF | 0.14 |

**Technical innovation:** Uses flow matching with Diffusion Transformer (DiT) backbone. Produces more consistent output than autoregressive approaches - fewer artifacts.

**E2-TTS:** A sibling model using Flat-UNet Transformer architecture. Both available from the same repo.

**Strengths:** Small model (336M) with MOS 4.1, consistent quality, avoids GPT-style artifacts, good voice cloning from short samples.

**Weaknesses:** Only English + Chinese, CC-BY-NC license (non-commercial), surpassed by newer models in 2026 rankings.

**Verdict:** Good research model, strong quality-to-size ratio. Limited by language support and license.

---

### 10. Chatterbox (Resemble AI) -- TOP RECOMMENDATION

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/resemble-ai/chatterbox |
| Parameters | Original: ~600M / Turbo: 350M / Multilingual: larger |
| Voice Cloning | Yes - few seconds of reference audio |
| Languages | 23 (Multilingual variant) |
| License | MIT |
| Blind Test | Beat ElevenLabs 63.75% of the time |

**Three variants:**
1. **Chatterbox (Original):** High quality, emotion control, zero-shot voice cloning
2. **Chatterbox Turbo:** 350M params, speech-token-to-mel decoder distilled from 10 steps to 1, <200ms latency
3. **Chatterbox Multilingual:** 23 languages, voice cloning, emotion control, PerTh watermarking

**Emotion control:** Emotion exaggeration parameter - first open source model with this capability.

**Watermarking:** PerTh (Perceptual Threshold) watermarks baked into every generated audio file. Survives MP3 compression and editing. Nearly 100% detection accuracy.

**Strengths:** Beat ElevenLabs in blind tests, MIT license, emotion control, watermarking for responsible AI, fast Turbo variant, 23 languages, OpenAI-compatible API server available.

**Weaknesses:** Apple Silicon runs CPU-only (MPS compatibility issues as of early 2026).

**Verdict:** The strongest all-around open source TTS. MIT license, ElevenLabs-beating quality, voice cloning, emotion control. Start here.

---

### 11. Kokoro -- BEST LIGHTWEIGHT OPTION

| Attribute | Value |
|-----------|-------|
| HuggingFace | hexgrad/Kokoro-82M |
| Parameters | 82M |
| MOS | 4.2 (highest among open source!) |
| Voice Cloning | No (54 voice presets, style selection) |
| Languages | 9 (en, fr, ko, ja, zh + more) |
| VRAM | <1 GB (<2 GB) |
| License | Apache 2.0 |
| RTF | 0.03 on GPU (210x realtime) |

**The efficiency champion.** 82M parameters delivering MOS 4.2 - the highest naturalness score among all open source models. Reached #1 on TTS Arena in January 2026, beating XTTS (467M) and MetaVoice (1.2B).

**Mac M-series:** Runs natively via MLX-Audio (`pip install mlx-audio`). CPU-friendly. Under 2 GB total footprint.

**Strengths:** Tiny, fast, highest MOS, Apache 2.0, runs on anything, 54 voices, excellent for production.

**Weaknesses:** No voice cloning, limited emotional expression, preset voices only.

**Verdict:** Best choice when you need high-quality TTS without voice cloning. Unbeatable efficiency.

---

### 12. Orpheus TTS (Canopy AI)

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/canopyai/Orpheus-TTS |
| HuggingFace | canopylabs/orpheus-3b-0.1-ft |
| Parameters | 3B / 1B / 400M / 150M |
| MOS | 4.6 |
| Voice Cloning | Yes - short audio sample, no fine-tuning |
| Languages | English |
| License | Apache 2.0 |
| Streaming Latency | 25-50ms |

**Emotional expression:** Tags like `<laugh>`, `<sigh>`, `<chuckle>` control tone inline. Trained on 100,000+ hours of English speech.

**Model sizes:** Four variants (3B down to 150M) let you trade quality for speed/resources.

**Strengths:** Very high MOS (4.6), Apache 2.0, excellent emotion tags, fast streaming (25-50ms), multiple size options, built on Llama architecture.

**Weaknesses:** English only, 3B model needs decent GPU.

**Verdict:** Best open source model for expressive/emotional English speech. Apache 2.0 makes it commercially viable.

---

### 13. Voxtral TTS (Mistral AI)

| Attribute | Value |
|-----------|-------|
| HuggingFace | mistralai/Voxtral-4B-TTS-2603 |
| Parameters | 4B |
| Voice Cloning | Yes - 2-3 second clip, no transcript needed |
| Languages | 9 (en, fr, es, de, it, pt, nl, ar, hi) |
| Streaming | Yes - ~90ms TTFA |
| License | CC-BY-NC 4.0 (commercial via API) |
| Blind Test | Beat ElevenLabs 68.4% overall, 87.8% for Spanish |

**Released March 26, 2026.** Newest major entrant. Beat ElevenLabs Flash v2.5 in 68.4% of blind tests, with devastating leads in Spanish (87.8%), Hindi (79.8%), and Arabic (72.9%).

**Voice cloning:** Only needs 2-3 seconds. No transcript required. 20 preset voices included.

**Strengths:** Highest blind test win rate vs ElevenLabs, excellent multilingual quality, very low latency streaming, Mistral backing.

**Weaknesses:** CC-BY-NC license (non-commercial), 4B params needs GPU, only 9 languages.

**Verdict:** Best multilingual quality, especially for Spanish/Hindi/Arabic. License limits commercial self-hosting - use Mistral API for commercial.

---

### 14. Sesame CSM (Conversational Speech Model)

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/SesameAILabs/csm |
| HuggingFace | sesame/csm-1b |
| Parameters | 1B |
| MOS | 4.7 (highest reported for any open source model) |
| Voice Cloning | Yes - via audio conditioning |
| Languages | 1 (English) |
| License | Apache 2.0 |

**Conversational focus:** Models natural conversation patterns - turn-taking timing, backchannel responses ("mm-hmm"), emotional reactions, conversational flow. Llama backbone + audio decoder producing Mimi audio codes.

**MLX support:** Runs on Apple Silicon via mlx-audio and community ports.

**Strengths:** Highest MOS (4.7), conversational realism unmatched, Apache 2.0, designed for dialogue.

**Weaknesses:** English only, 1B params, not designed for long-form narration.

**Verdict:** Best for conversational AI / voice agents where natural dialogue matters. The MOS of 4.7 approaches human speech (4.5-4.8 range).

---

### 15. Dia (Nari Labs) -- BEST FOR DIALOGUE

| Attribute | Value |
|-----------|-------|
| GitHub | https://github.com/nari-labs/dia |
| Parameters | 1.6B |
| MOS | 4.0 |
| Voice Cloning | Yes - via audio prompt |
| Languages | 1 (English) |
| VRAM | ~10 GB |
| License | Apache 2.0 |

**Multi-speaker dialogue:** Tag speakers with `[S1]` and `[S2]` to generate two-voice conversations in a single pass. Maintains voice consistency throughout.

**Non-verbal:** Supports laughter, coughing, throat clearing, and other natural sounds.

**Strengths:** Only model purpose-built for two-speaker dialogue, Apache 2.0, natural non-verbal sounds.

**Weaknesses:** English only, 10 GB VRAM, slower inference than lighter models.

**Verdict:** Best choice for podcast-style content, dialogues, and two-character scenes.

---

### 16. CosyVoice2 -- BEST FOR REAL-TIME STREAMING

| Attribute | Value |
|-----------|-------|
| Parameters | 0.5B |
| Streaming Latency | 150ms |
| Voice Cloning | Yes |
| Languages | Multilingual |

**Ultra-low latency:** 150ms in streaming mode while maintaining quality identical to non-streaming mode.

**Strengths:** Fastest streaming, quality parity between streaming and batch, excellent voice cloning.

**Verdict:** Top pick for real-time voice agents where latency is critical.

---

### 17. IndexTTS-2 -- BEST FOR ACCURACY

| Attribute | Value |
|-----------|-------|
| WER | 0.2418 (lowest among open source) |
| Voice Cloning | Yes - zero-shot |

**Word accuracy champion:** Lowest Word Error Rate of any tested model. Best for audiobooks, educational content, and anywhere content fidelity matters.

---

### 18. Bonus: Newer Models to Watch

- **Qwen3-TTS (Alibaba):** Voice cloning from 3 seconds, multilingual, available via MLX-Audio
- **VibeVoice (Microsoft):** Long-form multi-speaker synthesis
- **NeuTTS Air (Neuphonic):** 0.5B, voice cloning from 3 seconds, GGUF format for on-device
- **FireRedTTS-2:** Multi-speaker (up to 4) dialogue, 140ms first-packet latency, cross-lingual cloning
- **OmniVoice:** 600+ languages, voice design via attributes, compact model
- **LongCat-AudioDiT:** SOTA speaker similarity (0.818), 1B and 3.5B variants

---

## Part 3: Master Comparison Table

| Model | Params | MOS | Clone? | Clone Audio | Languages | RTF | VRAM | License | Streaming |
|-------|--------|-----|--------|-------------|-----------|-----|------|---------|-----------|
| Kokoro | 82M | 4.2 | No | - | 9 | 0.03 | <1GB | Apache 2.0 | Yes |
| Sesame CSM | 1B | 4.7 | Yes | Short clip | 1 (EN) | - | ~4GB | Apache 2.0 | Yes (MLX) |
| Orpheus | 150M-3B | 4.6 | Yes | Short clip | 1 (EN) | - | Varies | Apache 2.0 | 25-50ms |
| Fish Speech | 500M-4B | 4.1 | Yes | 10-30s | 80+ | 0.12 | ~4GB | CC-BY-NC | Yes |
| Chatterbox | 350M-600M | ~4.3 | Yes | Few secs | 23 | - | Low | MIT | <200ms |
| F5-TTS | 336M | 4.1 | Yes | 5-15s | 2 | 0.14 | ~4GB | CC-BY-NC | Yes |
| Voxtral | 4B | ~4.4 | Yes | 2-3s | 9 | - | Large | CC-BY-NC | 90ms |
| XTTS v2 | 467M | 4.0 | Yes | 6s | 17 | 0.18 | ~4GB | CPML | <150ms |
| Dia | 1.6B | 4.0 | Yes | Audio prompt | 1 (EN) | 0.15 | ~10GB | Apache 2.0 | Yes |
| OpenVoice v2 | - | ~3.9 | Yes | 30s | 6+ | - | - | MIT | - |
| MARS5 | 1.2B | ~4.0 | Yes | 5s | 1 (EN) | - | ~6GB | AGPL 3.0 | - |
| Parler TTS | 880M | 3.8 | No | - | 1 (EN) | 0.22 | ~4GB | Apache 2.0 | - |
| Bark | 900M | 3.7 | Limited | Presets | 13 | 0.85 | ~6GB | MIT | No |
| Piper | 6-60M | 3.5 | No | - | 30+ | 0.008 | <100MB | MIT | Yes |
| Tortoise | ~1B | ~4.0 | Yes | 20+ min | 1 (EN) | Very slow | ~6GB | Apache 2.0 | No |
| CosyVoice2 | 0.5B | - | Yes | - | Multi | - | - | - | 150ms |
| IndexTTS-2 | - | - | Yes | - | Multi | - | - | - | - |

---

## Part 4: Mac M-Series Compatibility

### MLX-Audio (Best Path for Apple Silicon)

**Repo:** https://github.com/Blaizzy/mlx-audio

```bash
pip install mlx-audio
```

Models optimized for Apple Silicon via MLX:
- Kokoro (82M) - runs effortlessly, sub-200ms latency
- Qwen3-TTS - voice cloning + voice design
- Sesame CSM - conversational speech
- Voxtral TTS - 4B model, streaming
- Chatterbox / Soprano / OuteTTS / Spark - various options

Features: streaming (`--stream`), speed control, 3-8 bit quantization, OpenAI-compatible REST API.

### CPU-Only Feasible Models

| Model | CPU Performance | Notes |
|-------|----------------|-------|
| Kokoro | Excellent | 82M params, designed for CPU |
| Piper | Excellent | Runs on Raspberry Pi |
| Chatterbox | Usable | Falls back to CPU on Apple Silicon (MPS issues) |
| Orpheus 150M | Good | Smallest variant |
| NeuTTS Air | Good | GGUF format, designed for on-device |

### MimikaStudio (Mac Desktop App)

https://github.com/BoltzmannEntropy/MimikaStudio - Local-first macOS app for Apple Silicon with Kokoro and Supertonic models, agentic MCP support.

---

## Part 5: Voice Cloning Comparison

### Audio Sample Requirements

| Model | Minimum Audio | Optimal Audio | Quality vs ElevenLabs PVC |
|-------|--------------|---------------|--------------------------|
| Voxtral | 2-3 seconds | 5-10 seconds | Competitive (68% blind test win) |
| Qwen3-TTS | 3 seconds | 10+ seconds | Good |
| NeuTTS Air | 3 seconds | 10+ seconds | Good |
| MARS5 | 5 seconds | 5s + transcript | Good (deep clone improves) |
| F5-TTS | 5 seconds | 15 seconds | Strong |
| XTTS v2 | 6 seconds | 15+ seconds | Decent |
| Chatterbox | Few seconds | 10+ seconds | Strong (63% blind test win) |
| Fish Speech | 10 seconds | 30 seconds | Very strong (Turing test parity) |
| OpenVoice v2 | 30 seconds | 30+ seconds | Decent |
| Tortoise | 20+ minutes | Hours | Was strong, now outclassed |

**ElevenLabs PVC comparison:** ElevenLabs Professional Voice Clone needs ~30 minutes of high-quality audio. Their Instant Voice Clone needs ~1 minute. Open source models now match or beat ElevenLabs Instant Clone quality with 3-6 seconds of audio. PVC quality gap still exists but is narrowing.

---

## Part 6: Emotional / Expressive Speech

| Model | Emotion Approach | Control Granularity | Quality |
|-------|-----------------|--------------------:|---------|
| Fish Speech S2 | Free-form bracket tags | 15,000+ tags, natural language | Best |
| Orpheus | Inline tags (`<laugh>`, `<sigh>`) | ~10 emotion tags | Very good |
| Chatterbox | Emotion exaggeration parameter | Continuous dial | Very good |
| Dia | Non-verbal cues | Laughter, coughing, etc. | Good |
| Parler Expresso | Text-described emotions | happy, confused, laughing, sad | Moderate |
| Sesame CSM | Conversational context | Automatic from context | Natural |
| Bark | Inherent in generation | Not directly controllable | Moderate |
| XTTS v2 | Style transfer from reference | Clone the emotion from audio | Moderate |

**ElevenLabs comparison:** ElevenLabs offers emotion presets + Style Exaggeration slider. Fish Speech's free-form system is actually more flexible - you can describe any emotion in natural language rather than selecting from presets.

---

## Part 7: Integration & Deployment

### OpenAI-Compatible API Servers

Several projects wrap open source TTS in OpenAI-compatible `/v1/audio/speech` endpoints, enabling drop-in replacement:

- **Chatterbox-TTS-Server** (https://github.com/devnen/Chatterbox-TTS-Server) - Web UI + API, voice cloning, CUDA/ROCm/CPU
- **chatterbox-tts-api** (https://github.com/travisvn/chatterbox-tts-api) - OpenAI-compatible, works with Open WebUI, AnythingLLM
- **Dia-TTS-Server** (https://github.com/devnen/Dia-TTS-Server) - Web UI + API for Dia
- **Local-TTS-Service** (https://github.com/samni728/Local-TTS-Service) - Multi-model, OpenAI-compatible
- **Sesame CSM OpenAI** (https://github.com/phildougherty/sesame_csm_openai) - CSM + Dia with voice cloning from file/YouTube
- **MLX-Audio** - Built-in OpenAI-compatible endpoints for Apple Silicon

### Docker Containers

Most models have Docker images available:
- Coqui TTS: Official Docker support (`docker run` one-liner)
- Chatterbox-TTS-Server: Full Docker Compose setup
- Piper: Multiple community Docker images
- tts-api (https://github.com/pedroetb/tts-api): Multi-engine REST API in Docker

### Python Libraries

```bash
pip install TTS              # Coqui TTS (XTTS v2 + many models)
pip install chatterbox-tts   # Chatterbox
pip install piper-tts        # Piper
pip install mlx-audio        # Apple Silicon optimized (multiple models)
pip install kokoro           # Kokoro standalone
```

---

## Part 8: Streaming / Real-Time for Voice Agents

**Best options ranked by latency:**

1. **Orpheus TTS** - 25-50ms streaming latency, Apache 2.0
2. **Voxtral TTS** - 70-90ms TTFA, CC-BY-NC
3. **CosyVoice2** - 150ms streaming, quality = non-streaming
4. **Chatterbox Turbo** - <200ms, MIT license
5. **XTTS v2** - <150ms on consumer GPU
6. **Fish Speech** - ~100ms TTFA (on H200)

**Target for voice agents:** Sub-200ms TTFB for natural turn-taking in conversations.

**Commercial comparison:**
- LMNT: <200ms (purpose-built for agents)
- Hume Octave 2: ~100ms
- Cartesia: Ultra-low (telephony-grade)
- ElevenLabs Turbo: ~200ms

Open source is now competitive with commercial for real-time applications, especially Orpheus and Voxtral.

---

## Part 9: Recommendations by Use Case

### Voice Agent / Conversational AI
**Pick: Sesame CSM** (conversational patterns) + **Orpheus** (emotion + speed) + **CosyVoice2** (lowest latency)

### Voice Cloning (Best Quality)
**Pick: Fish Speech S2 Pro** (Turing test parity) or **Chatterbox** (MIT license, blind test winner)

### Voice Cloning (Easiest Setup)
**Pick: Voxtral** (2-3 seconds, no transcript) or **Chatterbox** (pip install + go)

### Multilingual
**Pick: Fish Speech** (80+ languages) or **Chatterbox Multilingual** (23 languages, MIT)

### Podcast / Dialogue Generation
**Pick: Dia** (two-speaker in one pass) or **Sesame CSM** (conversational realism)

### Audiobook Production
**Pick: IndexTTS-2** (lowest WER) or **Orpheus 3B** (highest expressiveness)

### Embedded / IoT / Raspberry Pi
**Pick: Piper** (runs on Pi 4, MIT, 30+ languages)

### Mac M-Series Local
**Pick: Kokoro via MLX-Audio** (fastest, highest MOS) or **Chatterbox** (voice cloning, CPU mode)

### Emotional / Expressive Speech
**Pick: Fish Speech S2** (15K+ emotion tags) or **Orpheus** (inline emotion tags)

### Commercial Use (License-Safe)
**Pick: Chatterbox (MIT)**, **Kokoro (Apache 2.0)**, **Orpheus (Apache 2.0)**, **Dia (Apache 2.0)**, **Sesame CSM (Apache 2.0)**

### Avoid for Commercial (License Issues)
- Fish Speech (CC-BY-NC) - need commercial license
- Voxtral (CC-BY-NC) - use Mistral API
- F5-TTS (CC-BY-NC)
- MARS5 (AGPL)
- XTTS v2 (CPML)

---

## Part 10: The Bottom Line

**If you want one model:** Chatterbox. MIT license, beats ElevenLabs in blind tests, voice cloning from seconds of audio, emotion control, 23 languages, fast Turbo variant. It is the complete package.

**If you need the absolute highest quality:** Sesame CSM (4.7 MOS) for conversation, Orpheus (4.6 MOS) for narration, Fish Speech S2 for multilingual + emotion.

**If you need it on a Mac with no GPU:** Kokoro via MLX-Audio. 82M params, MOS 4.2, runs on CPU.

**If you need voice cloning that rivals ElevenLabs:** Fish Speech S2 Pro (passed Audio Turing Test) or Voxtral (68.4% blind test win vs ElevenLabs).

**The quality gap is closed.** Open source TTS in April 2026 matches or exceeds ElevenLabs in blind listening tests. The remaining advantages of ElevenLabs are: turnkey API convenience, PVC quality with extensive training data, and the fully managed infrastructure. For self-hosted use cases, open source is now the better choice.

---

## Sources

- [Coqui TTS GitHub](https://github.com/coqui-ai/TTS)
- [XTTS-v2 HuggingFace](https://huggingface.co/coqui/XTTS-v2)
- [Bark GitHub](https://github.com/suno-ai/bark)
- [bark-with-voice-clone](https://github.com/serp-ai/bark-with-voice-clone)
- [Tortoise TTS GitHub](https://github.com/neonbjb/tortoise-tts)
- [Piper GitHub](https://github.com/rhasspy/piper)
- [Fish Speech GitHub](https://github.com/fishaudio/fish-speech)
- [Parler TTS GitHub](https://github.com/huggingface/parler-tts)
- [MARS5 GitHub](https://github.com/Camb-ai/MARS5-TTS)
- [OpenVoice GitHub](https://github.com/myshell-ai/OpenVoice)
- [F5-TTS GitHub](https://github.com/SWivid/F5-TTS)
- [Chatterbox GitHub](https://github.com/resemble-ai/chatterbox)
- [Chatterbox-TTS-Server](https://github.com/devnen/Chatterbox-TTS-Server)
- [Kokoro HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M)
- [Orpheus TTS GitHub](https://github.com/canopyai/Orpheus-TTS)
- [Voxtral TTS HuggingFace](https://huggingface.co/mistralai/Voxtral-4B-TTS-2603)
- [Voxtral TTS Docs](https://docs.mistral.ai/models/voxtral-tts-26-03)
- [Sesame CSM GitHub](https://github.com/SesameAILabs/csm)
- [Dia GitHub](https://github.com/nari-labs/dia)
- [MLX-Audio GitHub](https://github.com/Blaizzy/mlx-audio)
- [MimikaStudio GitHub](https://github.com/BoltzmannEntropy/MimikaStudio)
- [BentoML TTS Comparison 2026](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models)
- [CodeSOTA TTS Benchmarks](https://www.codesota.com/guides/tts-models)
- [CodeSOTA Speech AI Leaderboard](https://www.codesota.com/speech)
- [SiliconFlow Best Open Source TTS 2026](https://www.siliconflow.com/articles/en/best-open-source-text-to-speech-models)
- [SiliconFlow Voice Cloning Guide 2026](https://www.siliconflow.com/articles/en/best-open-source-models-for-voice-cloning)
- [Geeky Gadgets TTS Comparison 2026](https://www.geeky-gadgets.com/text-to-speech-tts-ai-models/)
- [Chatterbox vs ElevenLabs Blind Test](https://www.genmedialab.com/news/chatterbox-open-source-tts-elevenlabs-alternative/)
- [Voxtral vs ElevenLabs HuggingFace Blog](https://huggingface.co/blog/azhan77168/voxtral-tts)
- [ElevenLabs Alternatives Comparison](https://ocdevel.com/blog/20250720-tts)
- [TTS Model Comparison Benchmark Repo](https://github.com/reilxlx/TTS-Model-Comparison)
- [Firethering Voice Cloning Analysis](https://firethering.com/open-source-tts-voice-cloning/)
- [Fish Audio Blog TTS Ranking 2026](https://fish.audio/blog/best-text-to-speech-tool-2026-ranking/)
- [Chatterbox Multilingual Announcement](https://www.resemble.ai/introducing-chatterbox-multilingual-open-source-tts-for-23-languages/)
- [Chatterbox Turbo](https://www.resemble.ai/chatterbox-turbo/)
- [Kokoro CPU-Friendly TTS](https://ariya.io/2026/03/local-cpu-friendly-high-quality-tts-text-to-speech-with-kokoro)
