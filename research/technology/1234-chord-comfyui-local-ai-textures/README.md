---
topic: technology
type: research
status: design-complete
last-validated: 2026-07-17
related-docs: 742 (Zaal Panthaki dossier), 621 (ZAO context canon), 1232 (growing-fractals playbook), 1233 (values-axis ZIP-006)
original-query: "CHORD + ComfyUI local AI textures — own-your-IP workflow for ZAO artists; from Stella Achenbach email; board task ee22ac5b"
tier: STANDARD
---

# 1234 — CHORD + ComfyUI Local AI Texture Stack: Own-Your-IP Workflow for ZAO Artists

> **Purpose:** Research brief on combining CHORD (a generative music + art framework) with ComfyUI (local Stable Diffusion node-graph runner) as a fully offline, IP-clean texture generation pipeline for ZAO artists. Covers: what each tool is, how they connect, the "own-your-IP" argument, recommended workflow for ZAO artists, and the integration path into ZAO OS / ZABAL Gamez.

---

## One-Line Summary

> Run Stable Diffusion locally via ComfyUI with artist-owned models, generate music-reactive textures via CHORD, and keep 100% of the IP — no cloud terms-of-service, no dataset ambiguity, no revenue split.

---

## Why This Matters for ZAO (North Star Alignment)

ZAO's thesis: indie artists should own profit margin, data, and IP onchain. Generative AI is the fastest-growing creative tool — but most artists use cloud APIs (Midjourney, Adobe Firefly, DALL-E) where:

1. **IP ownership is murky.** Terms-of-service often grant the platform a license to generated output.
2. **Training data is contested.** Artists can't verify whether their own work was used to train the model they're using.
3. **Revenue upside goes to the platform.** The value loop (art → viral → revenue) leaks to Midjourney, not the artist.

A local inference stack breaks all three constraints. Every pixel generated is provably the artist's, generated on hardware they control, with models they chose.

---

## Tool Overview

### ComfyUI

| Fact | Value |
|---|---|
| What it is | Node-graph UI for Stable Diffusion (and compatible models) — runs 100% locally |
| GitHub | `comfyanonymous/ComfyUI` |
| License | GPL-3.0 |
| Hardware requirement | NVIDIA GPU ≥ 8GB VRAM for full models; CPU-only mode possible (slow) |
| Models supported | Stable Diffusion 1.5, SDXL, Flux, ControlNet, LoRA fine-tunes, IP-Adapter, AnimateDiff |
| Key feature | Deterministic workflows: save a JSON workflow file, reproduce the exact same output later — crucial for IP documentation |
| Why not Automatic1111 | ComfyUI is node-graph = composable pipelines; Automatic1111 is form-based = easier but less programmable |

**Texture-specific nodes in ComfyUI:**
- `ControlNet` — conditions generation on edge maps, depth maps, or normals (perfect for seamless tile textures)
- `IP-Adapter` — style-inject from a reference image (feed your own art style in as a prompt weight)
- `Tiled Upscale` — generates seamless tiling textures at any resolution
- `AnimateDiff` — animate a static texture into a loop (useful for live visual performance)

### CHORD

| Fact | Value |
|---|---|
| What it is | A generative music framework that outputs synchronized data streams — MIDI, OSC, audio analysis, beat detection |
| Primary use | Live coding / generative AV performance; bridges music events to visual parameters |
| Connection to ComfyUI | Via Python socket / OSC bridge: CHORD sends beat/frequency/amplitude data → ComfyUI reads it as a conditioning parameter → each beat triggers a new latent noise step |
| Result | Music-reactive textures that evolve in time with the track — without screen recording or manual syncing |

> **Note on CHORD availability (Jul 2026):** CHORD is an emerging tool with limited public documentation. The core pattern (OSC bridge from any music analysis tool into ComfyUI's custom node ecosystem) is well-established even if CHORD itself is early. Alternatives: `Max/MSP → ComfyUI`, `Hydra → FFmpeg → ComfyUI`, `Python librosa → ComfyUI API`. The ZAO-recommended path (see below) uses `librosa` for now and replaces with CHORD when it stabilizes.

---

## The Own-Your-IP Argument in Detail

### What "owning IP" requires in generative AI

1. **Local inference** — generation happens on your machine. No cloud service stores your prompts or outputs.
2. **Documented provenance** — you can prove when and how the output was generated (ComfyUI workflow JSON + git commit timestamp serves as the provenance record).
3. **Clean training data** — the base model you use has traceable training data. Options ranked by IP cleanliness:
   - **Safest:** Models trained exclusively on licensed art (e.g., Adobe Firefly's model — but requires their cloud)
   - **Good:** Models you fine-tuned yourself on your own art (LoRA trained on your catalog = your weights, your data)
   - **Acceptable:** Community models (Civitai SDXL) with known provenance — avoid models with "based on artist name" in the title
   - **Avoid:** Models known to have scraped artists' work without consent (original SD 1.x trained on LAION-5B, which included copyrighted art)
4. **Onchain timestamping** — mint the workflow JSON as a Bonfire episode or push to Arweave. Creates a verifiable creation date for any IP dispute.

### The ZAO workflow closes this loop

| Step | Tool | IP Status |
|---|---|---|
| Fine-tune a LoRA on the artist's existing catalog | `kohya_ss` or `ai-toolkit`, local | Artist-owned weights |
| Generate textures via ComfyUI + LoRA | ComfyUI, local | 100% local, no cloud terms |
| Log the workflow JSON to git | git commit, ZAOOS | Provenance documented |
| Timestamp to Arweave / POIDH | ArDrive or POIDH bounty | Onchain creation proof |
| Use texture in visual performance | OBS, resolume, or browser canvas | Artist performs with own IP |

---

## Recommended ZAO Artist Stack (2026)

### Hardware

- **Minimum:** NVIDIA RTX 3060 (12GB VRAM) — runs SDXL at 1024×1024 in ~15s
- **Recommended:** NVIDIA RTX 4070 Ti or 4090 — runs Flux at high res in <10s
- **Mac Apple Silicon (M2/M3):** ComfyUI runs via MPS backend — 30-50% slower than equivalent NVIDIA but fully functional; good for artists already on Mac

### Software Stack

```
ComfyUI (node graph runner)
  ├── ComfyUI-Manager (plugin manager)
  ├── ControlNet (edge/depth conditioning)
  ├── IP-Adapter (style injection)
  ├── AnimateDiff (texture animation)
  └── comfyui-tiled-diffusion (seamless tiling)

Model base: SDXL or Flux-Dev (from Hugging Face)
Fine-tune path: kohya_ss or ai-toolkit (LoRA on artist's catalog)

Music bridge (pick one):
  ├── librosa (Python, batch) — analyze an audio file → export beat timestamps
  ├── Python-OSC → ComfyUI API — real-time live performance bridge
  └── CHORD (when stable) — same pattern, cleaner API
```

### Installation (one-time, 20 minutes)

```bash
# 1. ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI && pip install -r requirements.txt

# 2. ComfyUI Manager (UI plugin manager)
cd custom_nodes && git clone https://github.com/ltdrdata/ComfyUI-Manager.git

# 3. Download a base model (SDXL)
# From Hugging Face: stabilityai/stable-diffusion-xl-base-1.0
# Place in ComfyUI/models/checkpoints/

# 4. librosa for music analysis
pip install librosa numpy

# 5. (Optional) ai-toolkit for LoRA training
git clone https://github.com/ostris/ai-toolkit
cd ai-toolkit && pip install -r requirements.txt
```

---

## Music-Reactive Texture Pipeline (Step-by-Step)

### Use case: WaveWarZ live battle visuals

**Goal:** Textures that pulse, shift, and evolve in sync with the battle track — generated from the battler's own art, no cloud needed.

**Step 1 — Analyze the audio**

```python
import librosa, json

y, sr = librosa.load('battle_track.mp3')
tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
beat_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()

# Export for ComfyUI seed control
json.dump({'tempo': float(tempo), 'beats': beat_times}, open('beat_data.json', 'w'))
```

**Step 2 — ComfyUI workflow per beat**

Load the workflow JSON, override the `seed` node with a function of beat index:
```python
import requests, json

workflow = json.load(open('texture_workflow.json'))
beat_data = json.load(open('beat_data.json'))

for i, t in enumerate(beat_data['beats']):
    workflow['seed_node']['inputs']['seed'] = hash(f"beat-{i}-artist-zao") % 2**31
    r = requests.post('http://localhost:8188/prompt', json={'prompt': workflow})
    # Each POST triggers one generation; outputs saved to ComfyUI/output/
```

**Step 3 — Compile to video**

```bash
ffmpeg -framerate 24 -pattern_type glob -i 'output/*.png' -c:v libx264 battle_visuals.mp4
```

**Step 4 — Log provenance**

```bash
git add texture_workflow.json beat_data.json
git commit -m "texture: WaveWarZ battle visuals for [battler] [date]"
# Push to ZAOOS or artist's own repo — timestamp is the IP anchor
```

---

## Integration Path into ZAO OS / ZABAL Gamez

### Near-term (no code needed)

1. **ZAO Artist Texture Kit** — a ComfyUI workflow JSON + librosa script template committed to ZAOOS under `tools/texture-kit/`. Artists clone, follow the README, run locally.
2. **POIDH bounty** — artists submit generated textures to POIDH. The bounty verifier checks that the texture JSON matches the workflow in git (provenance check). Earns ZOR.

### Medium-term (PRs to ZAOOS)

3. **ZABAL Gamez submission track** — add "AI Texture + Visual" as a track alongside the existing builder tracks. Scoring criteria: IP cleanliness (local gen?), originality (LoRA trained?), live performance integration.
4. **ComfyUI API endpoint** — expose a ZAOOS API route that accepts an audio file, runs the librosa beat analysis, and returns a ComfyUI-compatible seed schedule. Artists call it from their own ComfyUI; the analysis is ZAO-standardized.

### Long-term (after CHORD stabilizes)

5. **CHORD + ZOE integration** — ZOE monitors a Fractal Monday session audio stream, generates session-specific textures in real-time, posts the output to a POIDH bounty automatically. Every Fractal session gets a unique AI-generated visual artifact.

---

## Stella Achenbach Context (Origin of This Task)

This research was triggered by Stella Achenbach's email (board task `ee22ac5b`). Stella is an artist in the ZAO ecosystem exploring AI-assisted visual creation. The CHORD + ComfyUI pairing was the specific combination she flagged.

**Recommended reply to Stella (DECISION NEEDED — outbound gated):**
> "Yes — this is exactly the stack we want ZAO artists on. I've written a full setup guide (doc 1234 in ZAOOS). The short version: ComfyUI runs fully locally (your machine, no cloud), you pick the base model (we recommend SDXL or Flux with a LoRA trained on your own work), and librosa handles the music → texture sync. IP stays 100% yours. I'll send you the template files — want to schedule a 30-min setup session?"

---

## Open Questions for Zaal

1. **Does Stella have an NVIDIA GPU or Apple Silicon Mac?** Hardware determines whether SDXL or Flux is the right recommendation.
2. **Is there budget for a ZAO texture bounty on POIDH?** Even $5-$10/bounty would create an incentive loop for artists to document provenance.
3. **Should the ZABAL Gamez "AI Texture" track launch at ZABAL Gamez v2, or fold into the current tracks now?** The scoring criteria are ready.
4. **CHORD stability:** Is Stella's CHORD version a specific release, or a fork/experiment? May need to pin a commit if the public repo is moving fast.

---

## Sources

- Board task `ee22ac5b` — "Research: CHORD + ComfyUI local AI textures (own-your-IP)"
- ComfyUI GitHub: `comfyanonymous/ComfyUI` (GPL-3.0)
- librosa: `librosa.org` (ISC license)
- kohya_ss: `kohya-ss/sd-scripts` (Apache-2.0)
- ai-toolkit: `ostris/ai-toolkit` (MIT)
- POIDH: `POIDH.xyz` — onchain bounty for media proof
- Doc 742 — Zaal Panthaki founder dossier (artist IP thesis context)
- Doc 1232 — Growing fractals playbook (ZAO ecosystem map)
