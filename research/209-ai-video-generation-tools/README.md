# 209 — AI Video Generation Tools for ZAO OS

> **Status:** Research complete
> **Date:** March 29, 2026
> **Goal:** Evaluate AI video generation tools for music video creation, viral content, and visual storytelling within the ZAO music community

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **General-purpose video gen** | USE **Seedance 2.0** via CapCut/Dreamina — cheapest per-second ($0.05/5s at 720p), native audio generation, accepts 9 reference images + 3 video clips + 3 audio tracks. Chinese-language prompts resolve tighter for material/environment descriptions due to ByteDance training data |
| **Music video (beat-synced)** | USE **Neural Frames** ($19/mo) — only tool with 8-stem audio analysis, beat/BPM detection, audio-reactive visuals, lip-sync, up to 10-minute 4K output. Wraps Kling + Seedance + Runway in one subscription |
| **Budget music video alt** | USE **Freebeat** ($9.99/mo standard) — beat-synced generation, 70+ magic effects, lyric video mode, integrates Veo3/Runway/Luma under one roof. 500 free credits on signup |
| **Highest quality (cinematic)** | USE **Runway Gen-4** ($28/mo Pro) — best temporal consistency, professional grade, but no audio awareness and no beat sync |
| **Cheapest bulk generation** | USE **Kling 3.0** ($6.99/mo) — 66 free credits/day, $0.029/sec API, 4K/60fps output. Best for volume |
| **API integration into ZAO OS** | SKIP for now — no tool has a stable, generally-available API for music video gen. Neural Frames has an API waitlist (Google Form). Seedance 2.0 official API "does not yet support API calls" as of March 27, 2026. Third-party wrappers (fal.ai, PiAPI) exist but are unstable. Revisit Q3 2026 |
| **Workflow for ZAO artists** | USE the "shots not videos" approach from the Seedance playbook — break videos into 5-15 second scenes, generate individually, stitch in CapCut. One action per generation, 5-block prompt structure (Subject, Action, Camera, Style, Quality) |

## Comparison of Options

### General-Purpose AI Video Generators

| Tool | Max Duration | Resolution | Audio Support | Price/mo | API Available | Best For |
|------|-------------|------------|---------------|----------|---------------|----------|
| **Seedance 2.0** (ByteDance) | 20 sec | 720p-1080p | Yes (native, 3 audio tracks) | ~$9.60 (Dreamina) or free via CapCut+VPN | No official API yet; third-party wrappers | Cheapest per-second, reference image control |
| **Sora 2** (OpenAI) | 25 sec | 1080p | No | $20 (ChatGPT Plus) | Multiple resellers | Physics simulation, realistic motion |
| **Veo 3.1** (Google) | 30-40 sec | 1080p | Yes (native) | $0.75/sec on Vertex AI | Gemini API, Vertex AI | Longest clips, cinema-grade color science |
| **Kling 3.0** (Kuaishou) | 10 sec | 4K/60fps | No | $6.99 | Official + Replicate | Cheapest bulk, highest resolution |
| **Runway Gen-4** | ~10 sec | 1080p | No | $12-76 (tiers) | No public API | Best temporal consistency, pro quality |

### Music-Specific Video Generators

| Tool | Price/mo | Beat Sync | Lip Sync | Audio-Reactive | Max Duration | Max Resolution | Models Used |
|------|----------|-----------|----------|----------------|-------------|---------------|-------------|
| **Neural Frames** | $19 | Yes (8-stem) | Yes | Yes (10+ params) | 10 min | 4K (upscaled) | Kling, Seedance, Runway |
| **Freebeat** | $9.99 | Yes (BPM) | No | Yes (rhythm/mood) | 30 sec (free), longer paid | 1080p (Pro) | Veo3, Runway, Luma |
| **BeatViz** | $18 (Basic) | Yes (BPM/mood) | Yes | Yes (auto-sync) | Variable | 1080p (paid) | Proprietary |
| **OneMoreShot** | $8.25 | Mood-based | Yes | Basic | Variable | 720p | Proprietary |

### Cost for 50 Videos/Month

| Tool | Est. Monthly Cost |
|------|------------------|
| Kling 3.0 | $7.25 |
| Seedance 2.0 (Dreamina) | ~$9.60 |
| Freebeat Standard | $9.99 |
| Neural Frames | $19.00 |
| Sora 2 (ChatGPT Plus) | $20-125 |
| Runway Pro | $28.00 |
| Veo 3.1 (Vertex AI) | ~$187.50 |

## Seedance 2.0 Deep Dive (from @starks_arq Playbook)

The most detailed production workflow comes from Amir D (@starks_arq), who runs an AI film studio and documented a complete Seedance 2.0 playbook:

### Access
- Download CapCut, set VPN to Indonesia (also available in Brazil, Malaysia, Mexico, Philippines, Thailand, Vietnam)
- No waitlist, no API application needed
- 260 free credits on Dreamina platform (~13 free videos)

### Constraints
- Max 15 seconds per clip at 720p in CapCut
- Build videos from individual shots (5, 10, or 15 sec), stitch in post
- No photorealistic human generation inside CapCut (blocked)

### 5-Block Prompt Structure
1. **SUBJECT** — Who/what, wardrobe, setting, mood (be physical and specific)
2. **ACTION** — One single verb. One motion. Multiple verbs confuse the model
3. **CAMERA** — Framing + movement. Key terms: "slow dolly push-in," "lateral tracking shot," "static locked-off frame," "Steadicam follow," "POV shot"
4. **STYLE** — Reinforcement pairs, not single keywords. "Motivated warm lighting, natural film grain, shallow depth of field, lifted blacks" not just "cinematic." Film stock anchors: "Kodak Vision3 500T" (warm), "ARRI Alexa color science" (digital), "35mm film grain" (indie)
5. **QUALITY SUFFIX** — Always append: "4K, Ultra HD, Rich details, Sharp clarity, Cinematic texture, Natural colors, Stable picture"

### Prompt Length Rules
- Text-to-video: 120-280 words (below 30 = random, above 280 = drops instructions)
- Image-to-video: 50-80 words max (image carries identity, long prompts erode reference)
- Never use negative prompts — Seedance rejects them. Positive framing only

### Reference Image System
- Up to 12 references: 9 images, 3 videos, 3 audio
- @Image1 gets 40-50% more attention weight than other slots
- 3 images per character (front, three-quarter, profile) = 75-85% identity consistency
- Individual face crops, never grid sheets (causes mosaic confusion)
- Identity lock: "Same person as @Image1. Do not alter facial proportions, eye shape, or hairstyle"

### Chinese Prompt Technique
- Model trained heavily on Mandarin data — spatial relationships, fabric textures, weather, architecture resolve tighter in Chinese
- Write in English (5-block), translate to Mandarin, run both versions
- Chinese version nails material properties and environmental nuance where English stays soft

### Character Consistency
- Animated/illustrated: Build storyboard frames in Nano Banana Pro first (thinking step self-corrects for consistency), then use as image-to-video input
- Realistic humans: Not possible in CapCut (blocks photorealistic human gen). Separate workflow required

### Viral Content Strategy
- Monitor Polymarket for trending topics
- Generate 4-5 scenes within hours of a spike
- First mover advantage: you're the only supply for massive demand
- Example: Meek Mill viral video — 74-word prompt, image-to-video, stitched from start frames

## ZAO OS Integration

### Current State
No AI video generation exists in the ZAO OS codebase. Relevant existing infrastructure:
- `src/components/spaces/` — Live rooms with screen share, camera, video elements (could host video previews)
- `src/components/music/` — 30+ music components, player architecture, queue system
- `src/providers/audio/` — `PlayerProvider.tsx`, `HTMLAudioProvider.tsx` — audio pipeline that could feed into video gen
- `src/app/api/broadcast/` — Multi-platform broadcasting (Farcaster, X, Bluesky, Kick, Facebook)
- `community.config.ts` — Branding, channels, nav pillars — would need a "Create" or "Visual" pillar

### Integration Paths (When APIs Stabilize)

**Path A: External Tool Links (Zero Code)**
Add curated links to Neural Frames, Freebeat, and Seedance/CapCut in the ZAO OS nav or a "Creator Tools" section. Artists use external tools, share results back to the community feed.

**Path B: Embed-Based (Low Code)**
Neural Frames and Freebeat both offer embeddable players. Add an embed component in `src/components/music/` that renders music video outputs alongside tracks.

**Path C: API Integration (Medium Code, Q3+ 2026)**
When Seedance 2.0 or Neural Frames APIs become generally available:
- New route: `src/app/api/video/generate/route.ts` — submit generation jobs
- New component: `src/components/music/MusicVideoGenerator.tsx` — prompt builder with the 5-block structure
- Queue system: generation takes 30-120 seconds, needs async job polling
- Storage: generated videos to Arweave (permanent) or Supabase Storage (temporary)
- Feed integration: auto-post generated videos to the Farcaster channel

**Path D: Beat-Synced Generation (High Code)**
Pipe the existing audio analysis from `src/providers/audio/` into a video generation API:
- Extract BPM/beats from currently playing track
- Auto-generate scene prompts per song section
- Submit to Neural Frames API (when available)
- This would make ZAO OS a music video creation platform, not just a social client

### Recommended Approach for Now
1. **Immediate**: Share this research with ZAO artists as a guide — the Seedance playbook alone is production-ready
2. **Short-term**: Add a "Creator Tools" link section in the app pointing to Neural Frames + Freebeat + CapCut
3. **Medium-term**: Monitor Seedance 2.0 and Neural Frames API availability. Build Path C when stable
4. **Long-term**: Path D (beat-synced generation) aligns with ZAO's music-first identity

## Sources

- [Seedance 2.0 on Dreamina/CapCut](https://dreamina.capcut.com/tools/seedance-2-0) — ByteDance official
- [AI Video Generation Models 2026 Comparison Guide](https://www.xugj520.cn/en/archives/ai-video-generation-models-comparison-guide-2026.html) — Sora vs Veo vs Kling vs Seedance specs
- [AI Video API Pricing 2026](https://devtk.ai/en/blog/ai-video-generation-pricing-2026/) — per-second cost breakdown
- [Neural Frames](https://www.neuralframes.com/ai-music-video-generator) — music-specific video gen, 23K+ artists, 2M+ videos
- [Freebeat.ai](https://freebeat.ai/) — beat-synced music video generator
- [BeatViz AI Music Video Generators 2026](https://beatviz.ai/blog/best-ai-music-video-generator) — BeatViz, Freebeat, OneMoreShot comparison
- [ByteDance Seedance 2.0 Comes to CapCut (TechCrunch)](https://techcrunch.com/2026/03/26/bytedances-new-ai-video-generation-model-dreamina-seedance-2-0-comes-to-capcut/) — March 26, 2026 rollout
- [Seedance 2.0 API Developer Guide](https://www.nxcode.io/resources/news/seedance-2-0-api-guide-pricing-setup-2026) — API status and third-party access
- [@starks_arq Seedance 2.0 Complete Guide](https://x.com/starks_arq) — production playbook (March 28, 2026 thread)
- [fal.ai AI Video Generators 2026](https://fal.ai/learn/tools/ai-video-generators) — market overview
