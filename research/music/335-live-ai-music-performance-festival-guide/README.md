# Doc 335: Live AI Music Performance & Festival Guide (2026)

> Deep dive on performing AI-generated music live at festivals and events.
> Context: ZAO Stock (October 3, 2026, Franklin St Parklet, Ellsworth Maine).
> Performer has a DJ deck, is building a custom Serato-like app ("audruoru").

---

## Table of Contents

1. [How AI Musicians Perform Live](#1-how-ai-musicians-perform-live)
2. [DJing AI-Generated Tracks vs Regular Tracks](#2-djing-ai-generated-tracks-vs-regular-tracks)
3. [Real-Time AI Music Generation Tools](#3-real-time-ai-music-generation-tools)
4. [DJ Software Comparison for AI Music Sets](#4-dj-software-comparison-for-ai-music-sets)
5. [Building a Custom DJ App - Open Source Libraries](#5-building-a-custom-dj-app---open-source-libraries)
6. [Live Stem Mixing](#6-live-stem-mixing)
7. [Real-Time Voice Conversion (RVC/W-OKADA)](#7-real-time-voice-conversion)
8. [AI Visuals Synced to Live Music](#8-ai-visuals-synced-to-live-music)
9. [Festival Tech Setup - Outdoor Equipment](#9-festival-tech-setup---outdoor-equipment)
10. [Artist Case Studies - Holly Herndon, Grimes, Anyma](#10-artist-case-studies)
11. [Ableton Live + AI Plugins](#11-ableton-live--ai-plugins)
12. [Live Looping + AI](#12-live-looping--ai)
13. [Legal Considerations](#13-legal-considerations)
14. [Making AI Sets Feel Authentic](#14-making-ai-sets-feel-authentic)
15. [Audience Experience Design](#15-audience-experience-design)
16. [Building a Setlist - Transitions, Key Matching, BPM Flow](#16-building-a-setlist)

---

## 1. How AI Musicians Perform Live

### What the Set Actually Looks Like

There is no single "AI live performance" format. In 2026, AI music performance falls into three tiers:

**Tier 1: DJ Set with AI-Generated Catalog**
- Performer plays pre-generated AI tracks on standard DJ equipment (decks, controller, laptop)
- Visually identical to a normal DJ set
- The AI part is invisible to the audience - it happened in the studio
- Lowest technical risk, highest reliability for outdoor festivals

**Tier 2: Hybrid Performance with Real-Time AI Elements**
- Performer DJs pre-made tracks BUT adds real-time AI processing on top
- Real-time voice conversion, AI-generated stems mixed in, live stem separation
- Requires laptop running AI models alongside DJ software
- Moderate technical risk - if the AI fails, the base set continues

**Tier 3: Full Real-Time AI Generation**
- AI generates music live based on prompts, audience feedback, performer steering
- Uses models like Lyria RealTime or Magenta RT
- Highest "wow factor" but highest failure risk
- Requires stable internet (Lyria) or powerful GPU (Magenta RT)
- NOT recommended as the sole source of music for an outdoor festival gig

### The AI DJ Project (Qosmo Lab) - A Real Example

One of the most documented human-AI DJ collaborations:
- Human DJ and AI take turns selecting and playing tracks ("back to back" format)
- AI uses three deep neural networks for genre inference, instrument detection, and drum machine identification
- Each network analyzes audio spectrograms to find compatible tracks from a 350+ track library
- Hardware: Custom-modified Technics SL-1200 turntable with a robot finger mechanism for beat-phase adjustment
- Audience tracking: Camera system using OpenPose library quantifies dance movements
- When audience engagement drops below a threshold, the AI introduces randomized noise into its selection vectors, encouraging musical exploration
- Visual display shows 3D spatial mapping of tracks and beat alignment quality

### ZAO Stock Recommendation

For a first outdoor festival performance: **Tier 1 as your foundation, with Tier 2 elements layered on top.** Pre-generate your AI catalog, build your setlist with proper BPM/key flow, then add live AI elements (voice conversion, stem manipulation, one or two real-time generated interludes) as your "flex" moments. If any real-time element fails, you still have a complete set.

---

## 2. DJing AI-Generated Tracks vs Regular Tracks

### Key Differences

**Audio Quality:**
- AI tracks from Suno v4/Udio v2 have improved dramatically but still have artifacts
- Common issues: slightly compressed dynamics, occasional harmonic inconsistencies, micro-stutters in transitions
- Solution: Run AI tracks through a proper mastering chain (LANDR, iZotope Ozone, or manual) before performing

**Metadata:**
- AI tracks typically lack proper BPM tags, key detection, waveform analysis
- You MUST analyze them in your DJ software before performing
- Rekordbox/Serato/Traktor will auto-analyze, but verify the results manually

**Track Length:**
- Most AI generators produce 2-4 minute tracks
- For DJ sets, you may need to extend tracks by generating continuations or creating loops
- Suno/Udio support "extend" features - use them to build 5-7 minute versions with proper intros/outros

**Stems:**
- Udio offers stem downloads (bass, drums, vocals separated)
- This is a major advantage for live stem mixing
- Even if you use Suno, you can run tracks through Demucs for stem separation pre-performance

**Structure:**
- AI tracks often lack DJ-friendly structures (long intros, outros, breakdown sections)
- Edit your AI tracks in a DAW (Ableton, Logic) to add 16/32-bar intros and outros
- This is the single most important prep step for a smooth DJ set

### Practical Workflow

1. Generate tracks in Suno/Udio/ACE-Step with specific BPM and genre prompts
2. Download at highest quality available
3. Master each track (normalize loudness, EQ, light compression)
4. Add DJ-friendly intros/outros in a DAW
5. Run through Demucs to pre-separate stems
6. Import everything into your DJ software
7. Analyze BPM and key
8. Build your setlist using harmonic mixing principles

---

## 3. Real-Time AI Music Generation Tools

### Production-Ready Tools (April 2026)

**Lyria RealTime (Google) - Cloud API**
- Persistent bidirectional WebSocket connection
- Output: 48kHz stereo, 16-bit PCM
- Controls: BPM (60-200), density, brightness, scale, stem muting
- Guidance parameter (0.0-6.0) controls prompt adherence
- Instrumental only (no vocals)
- Can mute/isolate bass, drums, or toggle vocalization mode
- Drastic BPM/scale changes require context reset
- Requires internet connection - NOT ideal for outdoor festivals without reliable WiFi
- Audio includes watermarking

**Magenta RealTime (Google) - Open Source, On-Device**
- 800M parameter autoregressive transformer
- Trained on ~190K hours of stock music
- Generates in 2-second chunks with 10-second context window
- Real-time factor of 1.6-1.8x on TPU/GPU
- Runs on free-tier Colab TPUs (v2-8)
- Open weights: https://github.com/magenta/magenta-realtime
- Install: Python 3.12, pip install from git
- Steered by text prompts, audio examples, or weighted combinations

**The Infinite Crate (Magenta/Google) - DAW Plugin**
- Open source VST3/AU plugin built on Lyria RealTime
- Built with TypeScript/React (UI) + C++/JUCE (audio)
- Mix together text prompts to steer live music generation
- Feeds audio directly into your DAW
- Use as a practice partner, sample generator, or live performance tool
- Download: https://magenta.withgoogle.com/infinite-crate
- Apache 2.0 license

**Project LYDIA (Roland + Neutone)**
- Hardware prototype on Raspberry Pi 5
- "Neural sampling" using autoencoder neural network
- Learns tonal characteristics of any sound source
- Applies those characteristics to incoming audio in real-time
- Designed for stage performers who want hardware, not laptops

### Research/Experimental (Not Yet Reliable for Live)

- OpenAI real-time VST (community project, early stage)
- LoopGen (training-free loopable music generation)
- Various MAX/MSP + latent diffusion experiments for accompaniment

### For ZAO Stock

The Infinite Crate plugin is the most practical option - load it in Ableton or your DAW, use it to generate ambient interludes or backing textures during your set. If internet is available at Franklin St Parklet, it works via the Lyria API. Pre-generate backup material in case connectivity drops.

---

## 4. DJ Software Comparison for AI Music Sets

### For Experimental/Electronic/AI Music

| Feature | Traktor Pro | Rekordbox | Serato DJ | VirtualDJ |
|---------|------------|-----------|-----------|-----------|
| Best For | Experimental sets, techno, creative mixing | Club/festival, CDJ prep | Controller DJs, hip-hop, reliability | Mobile DJs, video, stem separation |
| Stems | Remix Decks, native stems | Basic | Basic | Best real-time stem separation |
| Effects | Deepest FX engine, fully customizable | Good | Good | Good + video FX |
| MIDI Map | Most flexible, JavaScript scripting | Good | Controller-locked | Flexible |
| Video | No | No | Video expansion | Built-in |
| AI Features | Minimal | Minimal | Minimal | AI stem separation, automix |
| Price | ~$99 one-time | Free (export) / $10-15/mo | $10/mo or $199 one-time | Free / $19/mo pro |
| Stability | Rock solid | Rock solid | Rock solid | Good |

### Recommendation for AI Music Sets

**Primary: Traktor Pro** - If you're building a custom app anyway and want maximum creative control, Traktor's Remix Decks let you load stems and trigger them freely. Its effects engine is the deepest. The MIDI mapping with JavaScript gives you the most flexibility to integrate external tools.

**Alternative: VirtualDJ** - If you want the best built-in stem separation (10x better than Serato) and don't need Traktor's depth. Its AI-powered features are the most developed of any mainstream DJ software.

**For the custom app (audruoru):** Building your own makes sense if you want to integrate AI generation, stem mixing, and performance in a single interface. No existing DJ software natively integrates with Lyria/Magenta RT.

---

## 5. Building a Custom DJ App - Open Source Libraries

### Core Architecture for a Web/Electron DJ App

```
Audio Engine Layer (Web Audio API / Tone.js)
    |
    +-- Playback Engine (dual audio elements, crossfade)
    +-- Effects Chain (EQ, filters, reverb, delay)
    +-- BPM/Beat Detection
    +-- Pitch Shifting / Time Stretching
    |
Visualization Layer (wavesurfer.js / Canvas)
    |
    +-- Waveform display
    +-- Spectrum analyzer
    +-- Beat grid overlay
    |
AI Integration Layer
    |
    +-- Lyria RealTime WebSocket client
    +-- Magenta RT local inference
    +-- Stem separation (Demucs via WASM or server)
    +-- Voice conversion pipeline
    |
MIDI/Controller Layer (WebMIDI API)
    |
    +-- Hardware controller mapping
    +-- DJ deck integration
```

### Essential Libraries

**Audio Playback & Effects:**
- **Tone.js** (https://github.com/Tonejs/Tone.js) - Full Web Audio framework. Synthesis, effects, transport, scheduling. THE foundation for any web audio app.
- **Howler.js** (https://github.com/goldfire/howler.js) - Simpler playback with HTML5 Audio fallback. Good for reliable multi-track playback.
- **Tuna** (https://github.com/Theodeus/tuna) - Pre-built audio effects library (overdrive, phaser, chorus, etc.)

**Waveform & Visualization:**
- **wavesurfer.js** (https://github.com/katspaugh/wavesurfer.js) - Industry standard for waveform visualization. Interactive, navigable, customizable. Can connect directly to Tone.js effects chains.
- **Meyda** (https://github.com/meyda/meyda) - Audio feature extraction (spectral, temporal features). Useful for beat detection and analysis.

**Beat Detection & BPM:**
- **bpm-detective** (https://github.com/tornqvist/bpm-detective) - BPM detection from audio samples
- **web-audio-beat-detector** - Real-time beat detection

**MIDI Integration:**
- **WEBMIDI.js** (https://webmidijs.org/) - Clean abstraction over Web MIDI API
- **JZZ** (https://github.com/jazz-soft/JZZ) - Full MIDI library for Node.js and browsers

**Mixing & EQ:**
- **dsssp** (https://github.com/NumberOneBot/dsssp) - React component library for audio filter visualization with drag-and-drop
- **web-audio-mixer** (https://github.com/jamesfiltness/web-audio-mixer) - Multi-channel mixer

**Full Reference Apps (Study These):**
- **Mixpoint** (https://github.com/jgentes/mixpoint) - Web app for multi-track mixing with wavesurfer, great architecture reference
- **Bassline** (https://github.com/fwcd/bassline) - Electron DJ app with 4 decks and 2D crossfader
- **Giada** (https://www.giadamusic.com/) - Open source loop machine
- **SoundCycle** (https://github.com/scriptify/soundcycle) - Web Audio loopstation with effects
- **LoopDrop** (https://github.com/mmckegg/loop-drop-app) - MIDI looper/sampler/synth
- **Mixxx** (https://github.com/mixxxdj/mixxx) - The full open-source DJ platform (C++, not web, but study its architecture)

### Connecting wavesurfer.js to Tone.js

This is a critical integration for any custom DJ app:
```javascript
// Get Web Audio source node from wavesurfer
const mediaNode = wavesurfer.getMediaElement();
const source = Tone.context.createMediaElementSource(mediaNode);

// Connect to Tone.js effects chain
const eq = new Tone.EQ3();
const filter = new Tone.Filter();
source.connect(eq);
eq.connect(filter);
filter.toDestination();
```

### Tech Stack Recommendation for audruoru

- **Framework:** Electron (desktop) or Next.js/Tauri (modern alternative)
- **Audio:** Tone.js + wavesurfer.js as the foundation
- **UI:** React + Tailwind (matches ZAO OS stack)
- **AI:** Lyria RealTime WebSocket client for generation, Demucs (Python backend) for stem separation
- **MIDI:** WEBMIDI.js for hardware controller support
- **State:** React hooks or Zustand for audio state management

---

## 6. Live Stem Mixing

### What It Is

Splitting any track into its component parts (vocals, drums, bass, other) and mixing them independently during a live performance. This gives you control over individual elements - drop the vocals from one track over the drums of another, create a cappella breakdowns, isolate bass lines for transitions.

### Best Stem Separation Models (2026)

| Model | Quality | Speed | Open Source | Best For |
|-------|---------|-------|-------------|----------|
| Demucs (htdemucs_ft) | Highest | Slow (offline) | Yes | Pre-show preparation |
| VirtualDJ Stems | Good | Real-time | No (built in) | Live performance |
| Moises | Very Good | Near real-time | No (service) | Quick separation |
| Spleeter | Decent | Fast | Yes | Batch processing |
| Music Demixer | Good | Moderate | Yes | Browser-based |

### Live Performance Strategy

**DO NOT rely on real-time stem separation for a festival set.** "Real-time stem separation can be creatively powerful, but it introduces reliability risks when systems are under load" (DJ.Studio, 2026).

**Pre-separate your stems during prep:**
1. Run all tracks through Demucs htdemucs_ft (highest quality model)
2. Export 4-stem or 6-stem versions
3. Load pre-separated stems into your DJ software or custom app
4. Mix stems live with zero latency and zero CPU risk

**If using VirtualDJ:** Its built-in real-time stem separation is the best of any DJ software (10x better than Serato's). Acceptable for non-critical moments but have a fallback.

### Creative Stem Mixing Techniques for AI Sets

- Drop AI-generated vocals over a live drummer's groove
- Isolate the harmonic content from an AI track and layer it over human-performed bass
- Use stem isolation for dramatic breakdowns - mute everything except drums, then bring elements back one by one
- Cross-stem transitions: fade out Track A's melody while fading in Track B's, keep Track A's drums going

---

## 7. Real-Time Voice Conversion

### W-OKADA Voice Changer

The leading open-source real-time voice conversion tool:
- Supports RVC, MMVCv13, MMVCv15, So-vits-svcv40 models
- Runs 100% locally - no cloud, no data leaks
- Free, unlimited use with model swapping
- GitHub: https://github.com/w-okada/voice-changer

**Hardware Requirements:**
- Minimum: GTX 1050 Ti (4GB VRAM), quad-core CPU, 16GB RAM
- Recommended: RTX 3060+ (8GB VRAM), Apple M1+
- Latency: Under 200ms on RTX 30-series with chunk 256-512, extra 8192-16384

**Live Performance Setup:**
1. Route microphone input through W-OKADA
2. Set chunk size to 256-512 for low latency
3. Output to your mixer or DAW as a virtual audio device
4. Switch between voice models live with zero downtime

### Performance Applications

- Sing/rap in your own voice, have it converted to an AI voice model in real-time
- Create "duets" with yourself using different voice models
- Process spoken word/MC segments through artistic voice models
- Apply subtle vocal character changes throughout the set

### For ZAO Stock

If incorporating live vocals or MC work: install W-OKADA on a dedicated laptop (not the one running your DJ software). Route mic through it via a virtual audio device (VB-Cable or Loopback), output to your mixer. Test extensively before the show - outdoor environments with wind/crowd noise affect RVC quality.

---

## 8. AI Visuals Synced to Live Music

### Software Stack (Ranked by Complexity)

**Beginner-Friendly:**
- **REACT by Compeller** - ML-powered, automatically understands music's emotional content and generates visuals. Lowest learning curve.
- **Synesthesia** - Audio-reactive visual presets, works as a standalone app or plugin

**Intermediate:**
- **Resolume Arena** - Industry standard for VJing. Real-time performance, intuitive interface, supports AI-generated content. Handles audio-reactive triggers natively.
- **VDMX** (Mac only) - Powerful live visual mixing

**Advanced:**
- **TouchDesigner** - Node-based, infinitely customizable. Sound data (kick drum, frequency bands) controls visual parameters (position, color, scale, speed). The deepest tool but steepest learning curve.
- **Unreal Engine 5** - What Anyma uses for his Sphere show. Real-time 3D rendering. Overkill for most situations but unmatched fidelity.

### Integration Architecture

```
Audio Source (DJ software / mixer)
    |
    +-- Ableton Link (BPM sync over local network)
    |
    +-- OSC (Open Sound Control) for parameter data
    |
    +-- Spout (Windows) / Syphon (Mac) for video transfer
    |
Visual Engine (TouchDesigner / Resolume)
    |
    +-- Audio analysis (FFT, beat detection)
    +-- AI-generated visual elements
    +-- DMX output for lighting
    |
Output (Projector / LED screen)
```

### For ZAO Stock (Outdoor Festival)

Equipment needed:
- Projector (min 5000 lumens for outdoor daytime, 3000 for evening)
- Projection surface (white screen, building wall, or inflatable screen)
- Laptop running Resolume Arena (simplest for a festival debut)
- Audio feed from mixer to visual laptop (3.5mm or USB audio interface)
- Set up Ableton Link between DJ software and Resolume for BPM sync

Practical tip: Outdoor projection works much better after sunset. If ZAO Stock runs during daylight, use LED panels instead of projection, or save visuals for the evening portion.

---

## 9. Festival Tech Setup - Outdoor Equipment

### Power

**Generator Sizing:**
- Standard DJ rig (speakers, laptop, controller, monitors): 2,000-2,800 watts
- Add AI processing laptop: +300-500 watts
- Add visual laptop + projector: +500-1,500 watts
- **Total recommended: 4,000-5,000 watt generator** for full AI+visuals setup
- Rule of thumb: total equipment draw should be 20-30% less than generator rating

**Generator Type:**
- Lithium-powered portable stations (EcoFlow, Jackery) run SILENTLY - no hum behind speakers
- Pure sine wave inverter is ESSENTIAL for audio equipment and laptops - "dirty power" from cheap generators damages sensitive electronics
- Gas generators work but require distance from stage (noise, fumes)
- Always use a trip/breaker device between generator and equipment

### PA System (Small Outdoor Festival)

- 2-4 PA speakers on stands + 1-2 subwoofers
- Angle speakers slightly inward toward crowd
- For Franklin St Parklet size: 2x JBL EON715 (or similar 15" powered speakers) + 1x JBL EON718S sub
- Powered speakers simplify setup - no separate amplifier needed
- Budget option: QSC CP series or Yamaha DXR

### Essential Equipment Checklist

**Audio:**
- [ ] DJ controller or decks
- [ ] Laptop (primary - DJ software)
- [ ] Laptop (secondary - AI processing/visuals)
- [ ] Audio interface (if needed for multi-output)
- [ ] Mixer (if running multiple sources)
- [ ] PA speakers + sub
- [ ] Speaker stands
- [ ] Monitor speaker (for DJ booth)
- [ ] XLR cables (spares!)
- [ ] 1/4" and 3.5mm adapter cables
- [ ] Headphones

**Power:**
- [ ] Generator or battery station (pure sine wave, 4000W+)
- [ ] Heavy-duty extension cords (outdoor rated)
- [ ] Power strip/surge protector
- [ ] Backup batteries for laptops

**Protection:**
- [ ] Pop-up tent/canopy for shade and rain protection
- [ ] Table for equipment
- [ ] Cable covers/tape for trip hazards
- [ ] Gaffer tape (lots of it)
- [ ] Plastic bags/tarps for emergency rain cover

**Connectivity:**
- [ ] Mobile hotspot (if using Lyria RealTime API)
- [ ] Ethernet cable (if venue has wired internet)
- [ ] USB cables and hubs

---

## 10. Artist Case Studies

### Holly Herndon - "Protocol Art" Pioneer

**What she does:** Created "Holly+" - a digital twin of her voice. Performers can sing through Holly+ and have their voice converted to Herndon's vocal style in real time.

**Technical approach:**
- Training datasets are custom-composed, not scraped
- Describes her work as "protocol art" - designing systems that create music, not composing directly
- Uses NBHS (Never Before Heard Sounds) technology
- Live performances blend human singing with AI voice transformation
- Recent installation "Starmirror" at KW Institute for Contemporary Art, Berlin

**Key insight:** Herndon treats the AI model itself as the artistic medium. She curates unique sonic palettes - like an electronic musician building custom samples, but at the system level. The creative act shifts from composing to designing the training data and system architecture.

### Anyma (Tale of Us) - Immersive Scale

**What he does:** Next-generation immersive shows with real-time AI-driven visuals and electronic music.

**Technical setup:**
- Unreal Engine 5 for real-time 3D rendering (not pre-recorded video)
- Nanite virtualized geometry + Lumen global illumination
- Machine learning algorithms create procedural animations reacting to music
- AI-assisted generative design for visual elements
- Sharp laser beams move dynamically with every drop and transition
- Self-playing cello robots as physical stage elements
- Sphere show: 16K resolution display, spatial audio (Holoplot), haptic feedback seats

**Key insight:** Anyma proves AI visuals can be the star of the show. The music drives everything - visuals react in real-time to audio analysis. But this requires a massive production team and budget. For ZAO Stock, study the principles (audio-reactive, real-time generation) but scale to your context.

### Grimes - AI Voice and Collaboration

**What she does:** Embraced AI voice cloning, encouraged fans to use her voice model, experiments with AI-generated content.

**Key insight:** Grimes treats AI as a collaborator and distribution mechanism. Her approach is more about enabling a creative ecosystem than a specific technical performance setup.

### Nao Tokui (Qosmo Lab) - AI DJ Project

**What he does:** Human-AI back-to-back DJ sets with a physical robot.

**Technical setup:** (Detailed in Section 1)
- Three neural networks for music analysis
- Custom-modified turntable with robotic controls
- Audience motion tracking via camera + OpenPose
- The robot has a physical presence (head that nods, GoPro for first-person view)

**Key insight:** The most transferable model for ZAO Stock. A human DJ performing WITH an AI system creates more interesting dynamics than either alone.

---

## 11. Ableton Live + AI Plugins

### Native AI Features (Live 12)

- **MIDI Generators** - Set constraints, let the generator create melodies, chords, rhythms
- Useful for live sets: generate variation on the fly within harmonic constraints

### AI Plugins Worth Using Live

**The Infinite Crate (Magenta/Google)**
- Free VST3/AU plugin
- Mix text prompts to steer real-time music generation via Lyria RealTime
- Feed audio directly into Ableton for sampling or live performance
- Use it to generate dynamic backing tracks that evolve as you play
- Apache 2.0 open source

**MIDI Agent**
- Generates melodies, chords, drums from text prompts using GPT/Claude/Gemini
- Works directly in Ableton sessions
- Good for generating MIDI patterns during soundcheck or between songs

**ChatDSP (Dillon Bastan)**
- Describe a Max for Live device in text, AI generates it
- Create custom instruments and effects on the fly
- Uses OpenAI or Anthropic APIs

**Combobulator**
- AI synth that runs audio through neural networks
- Creates new sounds based on "Artist Brain" models
- Rebuilds audio input using trained AI models

**Co-Producer**
- Analyzes your audio in real-time
- Suggests matching samples from a library
- Natural language prompts for finding sounds that fit

### Live Performance Setup with Ableton

```
Ableton Live Session
    |
    +-- Track 1-4: Pre-made AI tracks (stems)
    +-- Track 5-6: Live inputs (controller, mic)
    +-- Track 7: The Infinite Crate (AI generation)
    +-- Track 8: Effects return tracks
    +-- Master: Final mix + Ableton Link (sync to visuals)
```

Use Session View for live performance - launch clips, trigger scenes, and improvise with AI-generated elements alongside your prepared material.

---

## 12. Live Looping + AI

### Software Options

**Loopy Pro (iOS/iPadOS)**
- Record and layer sounds in real-time
- Advanced workflow customization
- Connect instruments, effects, and external gear
- Best mobile option for live looping

**LiveLoop**
- Professional desktop looping software
- Multi-layered, complex rhythms, quantized to beat
- Real-time performance focused

**Giada**
- Open source loop machine
- MIDI-driven, sequencer-based
- Good for electronic musicians who want precise control

**SoundCycle** (https://github.com/scriptify/soundcycle)
- Web Audio-based loopstation
- Multiple looping modes with effects
- Open source - could be integrated into audruoru

### AI + Looping Workflow

1. Record a live loop (vocal phrase, instrument riff, percussion)
2. Process through AI in near-real-time:
   - Voice conversion via RVC/W-OKADA
   - Style transfer via neural audio models
   - Stem separation to isolate elements
3. Layer the AI-processed version over the original
4. Build up complexity with each pass

### For ZAO Stock

The Boss RC-505 Mk2 is the gold standard hardware looper (5 stereo tracks, 49 input FX, 53 track FX). Combined with W-OKADA for voice conversion, you could build entire songs live from a single vocal input - record a phrase, clone it in a different voice, add drums from another loop, layer harmonies. This is extremely audience-engaging because people can SEE you building the music.

---

## 13. Legal Considerations

### Copyright Status of AI Music (April 2026)

**US Copyright Office position:** "Prompts alone do not provide sufficient human control to make users of an AI system the authors of the output." Purely AI-generated music (type a prompt, click generate) is NOT copyrightable.

**However:** The more human creative input in the final work, the stronger the copyright claim. Editing, arranging, mixing, adding human performances, and curating AI outputs all strengthen your position.

**Major settlements in 2025:**
- Warner Music Group settled with Suno AND Udio (November 2025) - licensed training with artist opt-in
- Universal Music Group settled with Udio (October 2025) - licensed platform launching 2026
- UMG v. Suno fair use ruling expected summer 2026

**Suno's updated terms (post-December 2025):** "Suno is ultimately responsible for the output itself" and users "generally are not considered the owner of the songs." This is a significant change from earlier, more permissive terms.

### What This Means for Live Performance

1. **You CAN perform AI-generated music live.** No law prohibits this.
2. **Check your platform's commercial use terms.** Paid tiers of Suno/Udio generally grant commercial use rights, but this is a contractual license, not copyright ownership.
3. **Document your creative process.** The more human intervention you can demonstrate (arrangement, mixing, stem editing, live performance elements), the stronger your position.
4. **You likely cannot stop others from copying your AI-generated tracks** since you may not own the copyright.
5. **YouTube/streaming disclosure:** If you record and post your set, platforms may require AI content disclosure.

### For ZAO Stock

Low legal risk for a live festival performance. You're performing the music, not distributing recordings. Add human elements (live mixing, voice processing, live looping, arrangement decisions) to strengthen any future copyright claims if you want to release recordings.

---

## 14. Making AI Sets Feel Authentic

### The "Pressing Play" Problem

The eternal criticism of electronic music - "they're just pressing play." With AI music, this doubles: "they didn't even MAKE the music, AND they're just pressing play."

### How to Beat This

**Visible Interaction:**
- Use physical controllers that the audience can see you manipulating
- Exaggerate movements slightly (twist knobs, push faders) so the audience connects your actions to sound changes
- A DJ deck with platters is more visually engaging than a laptop
- Consider a camera on your hands/controller projected to a screen

**Real-Time Decision Making:**
- Read the crowd and adjust your set on the fly
- Have more tracks prepared than you'll play - make selection choices live
- React to the energy - don't follow a rigid setlist
- Leave room for improvisation (unused slots in your set for spontaneous choices)

**Live Processing:**
- Apply effects in real-time (not pre-programmed automation)
- Use stem mixing to create unique combinations the audience hasn't heard
- Process your voice through RVC for live MC segments
- Trigger one-shots and samples that react to the moment

**The AI Story:**
- Tell the audience what's happening. "This next track was generated by AI this morning" creates a narrative
- Show the generation process on screen if possible
- Frame it as a collaboration: you AND the AI made this together
- The novelty of AI music is still a draw in 2026 - lean into it

**Live Elements:**
- Sing or rap live (even if processed through voice conversion)
- Use a loop station to build something from scratch
- Invite a musician to play a live instrument over AI tracks
- Physical movement, dancing, energy - this is what audiences respond to most

### The Holly Herndon Principle

"The creative act shifts from composing with instruments to designing the very systems that create." Frame yourself not as someone pressing play on AI tracks, but as the person who designed the creative system, curated the outputs, and is steering the performance in real-time.

---

## 15. Audience Experience Design

### What Makes AI Performances Engaging

**The Spectacle Factor:**
- AI visuals that react to music in real-time create genuine "wow" moments
- Anyma's Sphere show proves that when visuals and music sync perfectly, audiences are captivated
- Even at small scale, a projector with audio-reactive visuals elevates the experience dramatically

**The Narrative:**
- Give the performance a story or concept
- "These are songs that didn't exist until this week" is inherently interesting
- Show the process - generation, curation, arrangement
- Let the audience feel like they're witnessing something being created, not just consumed

**The Human Connection:**
- AI cannot establish personal rapport with an audience
- Human DJs infuse events with emotional depth through spontaneous interaction
- Your ability to read subtle mood changes and respond is your superpower
- Talk to the crowd, share the story, make eye contact, dance

**Interactivity:**
- Let the audience influence the set (genre requests, prompt suggestions)
- Use crowd energy measurement (even informal) to adjust
- "I asked the AI to generate a track based on [audience suggestion]" is compelling content
- Consider a live prompt display showing what you're telling the AI

### What Makes AI Performances Boring

- Static visuals or no visuals at all
- No explanation of what's AI vs human
- Performer standing behind laptop not moving
- Pre-programmed set with no live decisions
- No audience interaction
- Poor sound quality (unmastered AI tracks through a bad PA)

### For ZAO Stock

Franklin St Parklet is intimate enough for direct audience connection. Use this:
1. Open with a brief explanation of what AI music is and what you're about to do
2. Mix pre-made AI tracks for the first section (prove the music sounds good)
3. Do a live generation/looping section where the audience sees creation happening
4. Close with your best tracks, full energy
5. Have visuals running throughout (even simple audio-reactive patterns add enormously)

---

## 16. Building a Setlist

### AI-Specific Setlist Tools

**SetFlow** (https://setflow.app/) - Automatic BPM matching, Camelot key mixing, energy curves
**DJ.Studio Harmonize** - Analyzes millions of possible orderings, returns highest-compatibility sequence
**MixOrMiss** (https://www.mixormiss.com/setlist-builder) - Free AI setlist builder with Camelot wheel
**PulseDJ** - Recommendations based on 1M+ analyzed real-world DJ sets
**AI DJ Sets** (https://aidjsets.com/) - AI builds sets using harmonic mixing, BPM progression, energy flow

### Harmonic Mixing with the Camelot Wheel

The Camelot Wheel maps all 24 musical keys into a numbered/lettered system:
- Move to adjacent numbers (8A to 7A or 9A) for smooth key transitions
- Move between A and B at the same number (8A to 8B) for energy shifts
- Jump 2+ numbers for dramatic key changes (use sparingly)

### BPM Flow Architecture

For a 60-minute AI music set:

```
Opening (0-10 min): 110-118 BPM
  - Ambient/downtempo AI tracks
  - Establish mood, let audience settle
  - Simple visuals

Build (10-25 min): 118-126 BPM
  - Introduce rhythmic elements
  - First stem mixing transitions
  - Energy rising gradually

Peak (25-45 min): 126-135 BPM
  - Highest energy tracks
  - Live voice conversion moments
  - AI generation demo (if doing one)
  - Most complex visual sync

Cool Down (45-55 min): 126-118 BPM
  - Gradual energy decrease
  - More melodic/emotional tracks
  - Let the audience breathe

Closer (55-60 min): 110-118 BPM
  - Memorable final track
  - Strong ending (don't fade out - end with impact)
```

### Transition Techniques for AI Tracks

1. **Stem swap:** Fade out Track A's melody, keep drums, bring in Track B's melody
2. **Filter sweep:** High-pass filter Track A while low-pass filtering Track B in
3. **Breakdown bridge:** Use an AI-generated ambient interlude between two tracks
4. **Key lock:** Match keys using harmonic mixing, pitch-shift if needed
5. **Echo out:** Apply echo/delay to Track A's last phrase while introducing Track B
6. **The "AI reveal":** Play a section that sounds "normal," then peel back the stems to show it's AI-generated

### Prep Workflow

1. Generate 30-40 AI tracks in your target BPM/genre range
2. Master all tracks to consistent loudness (-14 LUFS for streaming, -8 to -6 for club/festival)
3. Analyze BPM and key in your DJ software
4. Sort by Camelot key
5. Use SetFlow or MixOrMiss to find optimal ordering
6. Pre-separate stems for tracks where you want live stem control
7. Mark transition points and techniques for each pair
8. Practice the full set at least 3 times
9. Have 10+ backup tracks for on-the-fly substitutions

---

## Appendix: ZAO Stock Performance Checklist

### 3 Months Before (July 2026)
- [ ] Generate initial track catalog (40+ tracks across target genres)
- [ ] Master all tracks
- [ ] Begin building setlist
- [ ] Order any equipment not yet owned
- [ ] Test audruoru with basic playback

### 1 Month Before (September 2026)
- [ ] Finalize 60-minute setlist with transitions
- [ ] Pre-separate all stems via Demucs
- [ ] Set up visual system (Resolume or REACT)
- [ ] Full rehearsal of set with visuals
- [ ] Test generator/power setup
- [ ] Confirm PA system specs with festival organizers

### 1 Week Before
- [ ] Final rehearsal
- [ ] Backup all music to USB drive AND cloud
- [ ] Test all cables and connections
- [ ] Charge all batteries
- [ ] Create a "disaster recovery" plan (what if laptop crashes, internet drops, etc.)
- [ ] Pack gaffer tape, adapters, spare cables

### Day Of
- [ ] Arrive 2+ hours before set time
- [ ] Set up and test PA system first
- [ ] Run full soundcheck
- [ ] Test AI real-time features if using them
- [ ] Verify power stability
- [ ] Test visual system with daylight conditions
- [ ] Have backup USB with pre-mixed set (absolute last resort)

---

## Sources

- [AI Acts at 2026 Festivals: Futuristic Showstoppers or Novelty Gimmick?](https://www.ticketfairy.com/blog/ai-acts-at-2026-festivals-futuristic-showstoppers-or-novelty-gimmick)
- [Live Music Models: Real-Time AI Music](https://www.emergentmind.com/topics/live-music-models)
- [Real-time music generation using Lyria RealTime](https://ai.google.dev/gemini-api/docs/realtime-music-generation)
- [Magenta RealTime: An Open-Weights Live Music Model](https://magenta.withgoogle.com/magenta-realtime)
- [Magenta RealTime GitHub](https://github.com/magenta/magenta-realtime)
- [The Infinite Crate - DAW Plugin](https://magenta.withgoogle.com/infinite-crate)
- [The Infinite Crate GitHub](https://github.com/magenta/the-infinite-crate)
- [AI DJ Project - Qosmo Lab](https://medium.com/qosmo-lab/ai-dj-project-a-dialog-between-human-and-ai-through-music-abca9fd4a45d)
- [Holly Herndon's AI-Powered Creativity](https://gradeup.org.ua/en/2026/03/04/uk-uaii-u-tvorchosti-bachennja-holli-herndon-pro-majbutnye-muziki-ru/amp/)
- [Holly+ Digital AI Voice Twin](https://www.soundingfuture.com/en/article/holly-holly-herndons-digital-ai-voice-twin)
- [Anyma at the Sphere - Technical Breakdown](https://ymcinema.com/2025/01/30/the-making-of-anymas-the-end-of-genesys-at-the-las-vegas-sphere-a-groundbreaking-fusion-of-music-and-technology/)
- [How Anyma's Shows Use Unreal Engine](https://midnightrebels.com/how-anymas-live-shows-use-unreal-engine-to-create-a-cybernetic-opera/)
- [2026 Guide to DJ Stem Separation](https://dj.studio/blog/evidence-based-guide-dj-stem-separation)
- [W-OKADA Voice Changer GitHub](https://github.com/w-okada/voice-changer)
- [W-OKADA Real-Time Voice Cloning Guide](https://huggingface.co/blog/Lenylvt/w-okada)
- [Audio Reactive Visuals Software Guide](https://audioreactivevisuals.com/audio-reactive-software-guide.html)
- [TouchDesigner Audio Reactive Visuals](https://interactiveimmersive.io/blog/touchdesigner-3d/audio-reactive-visuals-a-beginner-guide/)
- [Resolume vs TouchDesigner](https://interactiveimmersive.io/blog/technology/resolume-vs-touchdesigner/)
- [DJ Software Comparison 2025-2026](https://www.recordcase.de/en/dj-software-comparison-2025-rekordbox-serato-traktor-virtualdj-explained)
- [Traktor vs Serato 2026](https://www.deejayplaza.com/en/articles/traktor-vs-serato)
- [AI Music Copyright 2026](https://jam.com/resources/ai-music-copyright-2026)
- [US Copyright Office AI Guidance](https://www.copyright.gov/ai/)
- [Suno vs Udio Comparison 2026](https://superprompt.com/blog/best-ai-music-generators)
- [DJ Power Requirements Guide](https://www.ecoflow.com/us/blog/dj-power-portable-solutions-guide)
- [Generator Size Guide for DJs](https://startingtodj.com/dj-equipment-generator/)
- [Outdoor PA System Setup](https://www.gear4music.com/blog/how-to-set-up-an-outdoor-pa-system/)
- [Awesome Web Audio Libraries](https://github.com/notthetup/awesome-webaudio)
- [Tone.js](https://tonejs.github.io/)
- [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js)
- [Mixxx Open Source DJ Software](https://mixxx.org/)
- [SetFlow DJ Set Generator](https://setflow.app/)
- [MixOrMiss Harmonic Mixing Tool](https://www.mixormiss.com/)
- [AI Futures - DJ Mag](https://djmag.com/longreads/ai-futures-how-artificial-intelligence-infiltrating-dj-booth)
- [Ableton Live AI - MIDI Agent](https://www.midiagent.com/ai-midi-generator-for-ableton-live)
- [Magenta Studio for Ableton](https://www.ableton.com/en/blog/magenta-studio-free-ai-tools-ableton-live/)
- [Giada Loop Machine](https://www.giadamusic.com/)
