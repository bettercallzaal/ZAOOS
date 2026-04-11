# Doc 320: AI-Generated Music for Games, Interactive Media & Roblox (2026)

**Created:** 2026-04-11
**Category:** Music / Business / Technology
**Status:** Deep Dive Complete

---

## Table of Contents

1. [Roblox Music - Getting In, Licensing & Revenue](#1-roblox-music)
2. [Unity + AI Music - Adaptive Systems & Middleware](#2-unity--ai-music)
3. [Procedural Music Generation for Games](#3-procedural-music-generation)
4. [Music Licensing for Indie Game Developers](#4-music-licensing-for-indie-devs)
5. [Selling Music Packs - Unity Asset Store & itch.io](#5-selling-music-packs)
6. [Interactive Music on the Web - Web Audio API & Tone.js](#6-interactive-web-music)
7. [Music NFTs as In-Game Items](#7-music-nfts-in-games)
8. [Generative Music Apps - Brian Eno Style](#8-generative-music-apps)
9. [VR/AR Music Experiences](#9-vrar-music)
10. [Twitch/Streaming Music for AI Tracks](#10-twitch-streaming-music)
11. [Game Music Composer Earnings vs Streaming](#11-composer-earnings)
12. [AI Adaptive Soundtrack Tools](#12-ai-adaptive-tools)
13. [Audio Middleware Ecosystem - How Game Audio Works](#13-audio-middleware)
14. [Case Studies - AI Music in Shipping Games](#14-case-studies)
15. [Building a Festival Music Installation (ZAO Stock)](#15-festival-installation)

---

## 1. Roblox Music

### How to Get Music Into Roblox

**Two main paths:**

1. **DistroKid / Distributor route** - Submit through DistroKid (or similar distributor) to Roblox's Creator Store. DistroKid specifically offers Roblox as a distribution target. However, the store is **curated** - submission does not guarantee acceptance. If accepted, your tracks appear when Roblox creators search for music to use in their experiences. Roblox claims 77 million daily active users.

2. **Direct upload** - Creators can upload audio directly, but must own all rights or have obtained all necessary licenses. After Roblox's 2022 audio privacy changes, only the uploader and those with explicit permission can use uploaded audio, making marketplace audio more valuable.

### Licensing Requirements

- Must own or have paid for all licenses for sound recordings AND musical works
- Public performance licenses required
- Platform enforces DMCA compliance
- Roblox has blanket deals with APM Music (hundreds of thousands of pre-cleared tracks) and Monstercat (EDM catalog)
- NMPA settled a copyright lawsuit with Roblox, launching formal licensing talks

### Revenue Model

- Revenue details are opaque - Roblox has not publicly detailed comprehensive musician revenue-sharing percentages
- Monetization happens through the Creator Store marketplace where other developers purchase/license your audio
- The platform is evolving its licensing platform with major entertainment partners
- Audio assets purchased on marketplace come with permissions for use in Roblox experiences

### Key Takeaway for Musicians

Roblox is a **discovery platform** more than a revenue platform right now. The audience is massive (66-77M daily users), but the monetization path for individual musicians is still maturing. Best strategy: use it for exposure and sync placement rather than expecting streaming-level royalties.

---

## 2. Unity + AI Music

### Audio Middleware Options

| Middleware | Best For | Pricing | Learning Curve |
|-----------|----------|---------|----------------|
| **FMOD** | Indie games, beginners | Free under $200K revenue | Lower - DAW-like interface |
| **Wwise** | AAA games, complex systems | Free under 200 sound assets | Higher - object-based architecture |
| **MetaSounds** | Unreal Engine only | Built into UE5 | Medium |

### How FMOD Works with Unity

- FMOD provides an end-to-end audio solution for Unity
- Events are self-contained with timeline-based audio
- Download FMOD Studio + Unity plugin
- Build adaptive audio systems in the FMOD editor
- Hear results in-game through the FMOD Engine

### How Wwise Works

- Object-based architecture - sounds managed as hierarchy of containers, actors, events
- Data-driven model treating every sound as a logical component
- More powerful but steeper learning curve
- Dominates AAA game audio

### AI Integration Points

- AI music generators (Soundverse, Beatoven, Mubert) produce stems/tracks
- Export stems in loop-ready formats
- Import into FMOD/Wwise for adaptive layering
- Set up game parameters that trigger transitions between musical states
- Middleware handles the real-time mixing, crossfading, and spatialization

---

## 3. Procedural Music Generation

### Current State (2026)

The technology has reached maturity. Games now use procedural music that:
- Adapts to player location, health, mission progress, combat intensity
- Creates infinite variations (No Man's Sky model)
- Shifts seamlessly between exploration, combat, storytelling (Red Dead Redemption 2 model)
- Can respond to biometric data (heart rate sensors)

### How It Works Technically

1. **Game State Monitor** - System reads gameplay variables (tension level, location, time of day)
2. **Emotional Model** - Variables mapped to emotional dimensions (valence/arousal model)
3. **Composition Engine** - AI generates symbolic music data (MIDI-like)
4. **Performance Layer** - Virtual instruments render the symbolic data
5. **Production Layer** - Effects, mixing, spatialization applied in real-time
6. **Output** - Final audio sent to game engine

### Key Tools for Procedural Music

| Tool | Approach | Engine Support |
|------|----------|---------------|
| **Melodrive** | AI composer, infinite stream, emotional API | Unity |
| **Reactional Engine** | Note-by-note generation, sub-5ms latency | Unity, Unreal, Godot (soon) |
| **Soundverse** | Text-to-music, loop generation | Export to any engine |
| **Beatoven.ai** | Mood-based generation | Export to any engine |
| **AIVA** | Orchestral/cinematic AI composition | Export to any engine |
| **Mubert** | Infinite AI streaming music | API integration |

---

## 4. Music Licensing for Indie Devs

### Pricing Landscape

| Tier | Cost Per Track | Notes |
|------|---------------|-------|
| AI-generated | $0-50 | Subscription or per-generation fee |
| Royalty-free library | $15-50 | One-time purchase, no backend |
| Indie composer | $200-1,000/minute | Custom work, usually buyout |
| Mid-tier composer | $500-2,000/track | Synchtank 2024 data |
| AAA composer | $1,000-2,500/minute | Often with backend royalties |
| Licensed popular song | $10,000-50,000+ | Trailer/main theme |

### Deal Structures

1. **Buyout (Work-for-hire)** - One-time fee, developer owns everything. Most common in games. Typical for indie: $200-1,000/min
2. **Royalty arrangement** - Percentage of net/gross game revenue. Can include "step-down" clauses where % decreases over time
3. **Revenue share** - Common for indie teams with no budget. Composer gets % of game sales
4. **Subscription library** - Epidemic Sound, Artlist, etc. Monthly fee, unlimited use

### Key Licensing Platforms

- **Epidemic Sound** - 40,000+ tracks, direct licensing, no PROs involved
- **Artlist** - Subscription model, all genres
- **IndieGameMusic.com** - Royalty-free, one-time fee
- **UnitedMasters** - Connects artists with game studios (2K Sports, ESPN, NBA)
- **Soundverse AI** - Generate custom tracks from prompts
- **Beatoven.ai** - AI generation with game-specific modes

### AI Music Copyright Warning

Copyright ownership of AI-generated music remains legally gray in 2026. Key concerns:
- US Copyright Office requires human authorship for registration
- AI-generated works may not be copyrightable
- Some platforms (Soundverse) address this with "Trace" provenance systems
- Always check the platform's licensing terms for commercial game use

---

## 5. Selling Music Packs

### Unity Asset Store

- **Revenue split:** 70% to publisher / 30% to Unity
- **Payment:** Monthly, net-45, via PayPal or wire transfer, $50 minimum
- **Review time:** 2-4 weeks for new submissions
- **Audio pack pricing:** $5-10 (budget), $10-20 (standard), $20-30+ (premium)
- **Key stat:** 3.3 million active Unity developers, 100,000+ assets available

**Realistic earnings by tier:**
| Tier | Monthly Revenue | Assets Needed |
|------|----------------|---------------|
| Hobbyist | $50-200 | 1-3 |
| Active | $200-1,000 | 5-15 |
| Part-time pro | $1,000-5,000 | 10-30 |
| Full-time | $5,000-15,000 | 20-50+ |
| Top publisher | $15,000-50,000+ | 50+ or flagship |

Audio packs provide "steady recurring income" since they're engine-agnostic with long sales tails.

### itch.io

- **Revenue split:** 90%+ to creator (10% or less commission)
- **Flexibility:** Set your own pricing, bundle deals
- **Audience:** Indie-focused, smaller but engaged
- **Caveat:** 30% US withholding tax for non-US creators on US buyer payments
- **Top sellers:** Ambience packs, chiptune collections, genre-specific bundles

### Other Marketplaces

- **Fab (formerly Unreal Marketplace)** - Unreal-focused but accepts audio
- **GameDev Market** - Smaller, game-specific
- **Bandcamp** - Not game-focused but musicians use it for soundtrack sales

### Strategy for AI-Assisted Music Packs

1. Use AI to generate base compositions
2. Human-curate, edit, and polish for quality
3. Ensure all tracks loop cleanly
4. Package with documentation (BPM, key, mood tags)
5. Include demo scenes if possible
6. Price competitively ($10-20 for 10-20 tracks)
7. Market on Reddit r/gamedev, X, Discord communities

---

## 6. Interactive Web Music

### Core Technologies

**Web Audio API** (Native browser)
- AudioContext for managing audio graph
- OscillatorNode for synthesis
- AnalyserNode for visualization
- ConvolverNode for reverb/effects
- Supports real-time DSP processing

**Tone.js** (Framework built on Web Audio API)
- Prebuilt synths: Tone.Synth, Tone.FMSynth, Tone.AMSynth, Tone.NoiseSynth
- Prebuilt effects: Tone.Distortion, Tone.Filter, Tone.FeedbackDelay
- Global transport for scheduling and synchronization
- DAW-like features in the browser
- Install via npm or CDN
- MIT licensed, actively maintained

### Other Web Audio Libraries

- **Howler.js** - Simplified audio playback
- **Pizzicato.js** - Effects and filters
- **Wavesurfer.js** - Waveform visualization
- **p5.sound** - Creative coding audio
- **Elementary Audio** - Functional reactive audio

### Project Ideas for Musicians

1. **Interactive album** - Listeners manipulate parameters of songs in real-time
2. **Generative soundscape** - Ambient music that evolves based on time of day, weather API data
3. **Collaborative music canvas** - Multiple users contribute to a shared composition
4. **Music visualization** - Real-time visual art responding to audio analysis
5. **Remix tool** - Let fans remix tracks with stem separation + effects
6. **Binaural beat generator** - (ZAO OS already has this!)

### ZAO OS Relevance

ZAO OS already uses Web Audio API extensively:
- BinauralBeats.tsx - binaural beats with ambient mixer
- HTMLAudioProvider.tsx - dual audio element engine with crossfade
- PlayerProvider.tsx - MediaSession, Wake Lock, haptics
- This infrastructure could be extended for interactive music experiences

---

## 7. Music NFTs in Games

### Current State (2026)

Music NFTs have moved past the hype cycle into functional niche use cases. The speculation-driven market failed, but specific models work:

**What's Working:**
| Model | Revenue Range | How It Works |
|-------|--------------|--------------|
| Limited editions | $10-100 per edition, 100-1,000 copies | Scarcity + streaming alternative |
| Royalty splits | $1,000-10,000 upfront | Sell 10% of song royalties to collectors |
| Access/membership | Varies | NFT = community token, Discord, exclusives |
| Generative/collaborative | Varies | Stems for remixing, interactive art |

**Revenue expectations:**
- Crypto-native audience: $1,000-50,000+ per drop
- Traditional audience: $500-5,000 per drop
- New artists: Build fanbase first, NFTs second

### Active Platforms (2026)

| Platform | Model | Best For |
|----------|-------|----------|
| Sound.xyz | Limited editions, listening parties | Electronic, indie, experimental |
| Catalog | 1/1 collector pieces | High-value collectors |
| Mint Songs | Free mints, social | Mainstream crossover |
| Zora | Open minting, low fees | DIY web3 artists |

### Gaming Crossover

- **Phygital music collectibles** jumped 60%, $5.6B market cap
- Blockchain games use NFTs for asset ownership but **music-specific NFT-as-in-game-item is still rare**
- Best current use: Music NFTs as access tokens to exclusive in-game content
- Potential: NFT soundtracks that unlock in multiple games
- No major shipping games have built music NFTs into core gameplay mechanics yet

### Opportunity Gap

There is a clear gap between music NFT platforms and game engines. Someone who builds the bridge - making it easy to mint a music NFT and use it as a playable/equippable item in Unity/Unreal/Roblox - would capture an underserved market.

---

## 8. Generative Music Apps

### Brian Eno's Pioneering Apps

| App | Year | Description |
|-----|------|-------------|
| Bloom | 2008 | Tap screen to create melodies, generative player takes over when idle |
| Trope | 2009 | Evolving ambient soundscapes |
| Scape | 2012 | Landscape-based composition |
| Reflection | 2017 | Most sophisticated - creates endless, endlessly changing ambient music |

All built with Peter Chilvers. Reflection represents the current gold standard for generative ambient apps.

### Other Generative Music Tools

- **Wotja** - Free generative music lab, evolved from SSEYO Koan software. Features "Text to Music" using stochastic techniques
- **Endel** - AI-powered soundscapes that adapt to time, weather, heart rate. Has Apple Watch integration
- **Mubert** - Infinite AI-generated music streams, API available
- **AIVA** - Orchestral composition AI, generates original scored pieces

### Building Your Own Generative Music App

**Technical stack options:**
1. **Web app** - Tone.js + Web Audio API + React (simplest to ship)
2. **Mobile app** - AudioKit (iOS) or Oboe (Android)
3. **Desktop** - Max/MSP, SuperCollider, Pure Data
4. **Embedded** - Raspberry Pi + Pure Data for installations

**Key design principles (from Eno):**
- System should be interesting when left alone
- User interaction should be simple but meaningful
- No two listens should be identical
- Musical rules (scales, harmonies) constrain randomness
- Visual feedback enhances the experience

**AI-enhanced approach (2026):**
- Use a fine-tuned model to generate MIDI sequences
- Feed sequences to Tone.js synthesizers in real-time
- Allow user parameters (mood, energy, complexity) to guide generation
- Add generative visuals (Three.js, p5.js)

---

## 9. VR/AR Music Experiences

### Major Platforms (2026)

- **Meta Quest 3S / Quest Pro 2** - Audio SDK with full 3D spatial audio
- **Apple Vision Pro 2** - Native spatial audio, high-fidelity
- **Sony PSVR 3** - Integrated spatial audio
- **MelodyVR / Venues** - Virtual concert attendance

### Immersive Audio Standards

**MPEG-I Immersive Audio** - New global standard supporting:
- Full 6DoF (six degrees of freedom) movement
- Realistic acoustic modeling (reflections, reverb, occlusion, diffraction, Doppler)
- Cross-platform consistency

**Meta Audio SDK features:**
- 3D sound source positioning
- Room acoustics simulation
- Head-related transfer functions (HRTF)
- Ambisonic audio support

### Revenue Opportunity

- Immersive entertainment sector: **$114 billion** in 2025, projected **$442 billion by 2030**
- Virtual concerts (Fortnite/Travis Scott model) proved massive reach
- VR music creation tools (Beat Saber-like experiences) are a growing category
- AR music experiences (location-based, phone-triggered) are early-stage

### Tools for Building VR/AR Music Experiences

- **Unity + FMOD/Wwise** - Most common pipeline for VR audio
- **Unreal Engine + MetaSounds** - Built-in spatial audio
- **Meta Audio SDK** - Purpose-built for Quest development
- **Resonance Audio** (Google) - Cross-platform spatial audio SDK
- **Steam Audio** - Physics-based spatial audio

---

## 10. Twitch/Streaming Music

### The DMCA Problem

Streamers face constant DMCA takedown risk. In 2026, compliance requires **provenance transparency** - platforms and creators must show where music came from and how it's licensed.

### AI Music Solutions for Streamers

| Platform | Tracks | Pricing | Key Feature |
|----------|--------|---------|-------------|
| **Epidemic Sound** | 40,000+ | Subscription | Highest quality, pre-cleared |
| **StreamBeats** | 1,500+ | Free | Made by Harris Heller, registered with Twitch/YouTube |
| **OWN3D** | 200+ | Free | LoFi and Synthwave focus |
| **Soundverse AI** | Unlimited | Freemium | Generate custom tracks from prompts |
| **Mubert** | Infinite | Freemium | AI-generated, never-repeating streams |
| **NoBan Stream** | Library | Subscription | Copyright-free guaranteed |
| **TunePocket** | Library | Subscription | Curated for Twitch |

### Opportunity for Musicians

- Create DMCA-safe music packs specifically for streamers
- AI-assisted production to scale output
- Build a brand around "streamer-safe" music
- Offer custom channel music (intros, outros, alerts)
- StreamBeats proved the model: free music builds audience, monetize through brand deals

### Revenue Model

- Subscription platforms pay per-stream or flat licensing fees
- Direct sales of packs: $10-50 per pack
- Patreon/supporter model for ongoing content
- Brand partnerships once audience grows
- Streamers pay $5-15/month for music subscriptions

---

## 11. Composer Earnings

### Games vs Streaming Revenue Comparison

| Revenue Source | Typical Amount | Notes |
|---------------|---------------|-------|
| **Game composition (indie)** | $200-1,000/min | Usually buyout, no backend |
| **Game composition (AAA)** | $1,000-2,500/min | May include backend |
| **Soundtrack streaming** | Minimal | Games lack metadata standards |
| **Spotify streaming** | $0.003-0.005/stream | Need millions for significant income |
| **Sync placement (game trailer)** | $10,000-50,000 | One-time, high-value |
| **Music pack sales** | $50-200/month starting | Passive, scales with catalog |
| **AI music generation** | $0-50/track | Near-zero marginal cost |

### The Fundamental Disparity

- Film/TV composers receive **performance royalties** (ASCAP/BMI) + mechanicals
- Game composers typically get **buyout only** - no backend royalties
- This means upfront game fees tend to be higher to compensate
- Streaming platforms barely have a fraction of game music due to poor metadata practices

### Budget Ranges for Full Projects

| Project Size | Music Duration | Budget |
|-------------|---------------|--------|
| Small indie | 30-45 min | $3,000-15,000 |
| Mid-sized indie | 1-2 hours | $15,000-50,000 |
| AA game | 2-4 hours | $50,000-200,000 |
| AAA game | 4+ hours | $200,000-2,000,000+ |

### Why Games Can Be Better Than Streaming

Despite lower per-stream rates, games offer:
1. **Higher upfront payment** than most streaming will ever generate
2. **Long tail** - games stay in market for years
3. **Portfolio building** - credits lead to bigger gigs
4. **Soundtrack releases** - secondary revenue from OST on Spotify/Bandcamp
5. **AI leverage** - Use AI to produce faster, keep more of the upfront fee

---

## 12. AI Adaptive Soundtrack Tools

### Comprehensive Tool Comparison (2026)

| Tool | Type | Real-Time? | Engine Support | Pricing |
|------|------|-----------|----------------|---------|
| **Reactional Engine** | Note-by-note generator | Yes, sub-5ms | Unity, Unreal, Godot (soon) | Not public |
| **Melodrive** | AI emotional composer | Yes | Unity | Free lite beta |
| **Soundverse** | Text-to-music + loops | No (pre-generate) | Export to any | Freemium + API |
| **Beatoven.ai** | Mood-based generator | No | Export to any | Freemium |
| **AIVA** | Orchestral AI composer | No | Export to any | Free tier + Pro |
| **Mubert** | Infinite AI streams | Near-real-time | API integration | Freemium |
| **SOUNDRAW** | AI beat/track generator | No | Export to any | Subscription |

### Reactional Engine - Deep Dive (Most Advanced)

- Generates music **note-by-note** with virtual instruments
- Sub-5ms latency for gameplay reactions
- Two-way communication: game <-> music system
- Dynamic key, scale, tempo, instrumentation changes
- API functions: Play/Stop/Pause, SetControl, TriggerStinger, OnBarBeat, OnNoteOn
- Can integrate commercial tracks alongside generated music
- Available on: Windows, Mac, Linux, iOS, Android, WebGL, PS4/PS5, Xbox, Switch
- Works with Wwise (Audio Input plugin) and FMOD (Programmer Sound Event)

### Melodrive - Deep Dive

- First AI music system to compose infinite original music in real-time
- Uses emotional API based on Valence/Arousal model
- Game events -> emotional state -> symbolic music -> virtual instruments -> rendered audio
- Unity plugin available
- Generates music from scratch, not from pre-composed stems

---

## 13. Audio Middleware Ecosystem

### What Middleware Actually Does

Audio middleware sits between your audio assets and the game engine, handling:
1. **Event-based audio** - Complex audio behaviors without programming
2. **Adaptive music systems** - Automatic transitions and layering
3. **Mixing and ducking** - Professional DSP effects
4. **Profiling and optimization** - Audio performance monitoring
5. **Real-time parameter control** - Link audio to gameplay variables
6. **Spatial audio** - 3D positioning, occlusion, reverb zones

### FMOD Architecture

```
Audio Assets (WAV/OGG) -> FMOD Studio (authoring)
                              |
                          Events (timeline-based, DAW-like)
                              |
                          Parameters (game state mappings)
                              |
                          FMOD Engine (runtime) -> Game Engine (Unity/Unreal)
```

- Events are self-contained with timeline
- Audio bin holds all assets
- DAW-like interface - intuitive for musicians
- Free for projects under $200K revenue

### Wwise Architecture

```
Audio Assets -> Wwise Authoring Tool
                    |
                Hierarchy of Containers
                    |
                Actors & Events (object-based)
                    |
                SoundBanks (packaged data)
                    |
                Wwise SDK (runtime) -> Game Engine
```

- Object-based architecture
- Data-driven: every sound is a logical component in a larger system
- More powerful for complex audio systems
- Free for up to 200 sound assets in a project
- Industry standard for AAA

### The Pipeline for a Musician

1. **Create/generate music** (AI tools, DAW, or both)
2. **Export stems** (drums, bass, melody, pads, etc.)
3. **Import into middleware** (FMOD or Wwise)
4. **Set up adaptive behaviors** (transitions, layers, stingers)
5. **Define game parameters** (tension, location, combat state)
6. **Map parameters to music changes** (fade layers, switch variants)
7. **Export to game engine** (Unity/Unreal plugin handles runtime)
8. **Test and iterate** in-game

---

## 14. Case Studies - AI Music in Games

### Notable Examples

**No Man's Sky** (Hello Games)
- Procedural audio creates infinite background music variations
- Music matches the endless procedural exploration
- One of the most cited examples of procedural music in a shipping game

**Red Dead Redemption 2** (Rockstar)
- Musical score adjusts based on player actions
- Smooth transitions between exploration, combat, storytelling
- Uses layered adaptive system with middleware

**AI-Enhanced Development (2026 trends):**
- Studios using AI for rapid prototyping of musical ideas
- AI-generated placeholder music during development, replaced or refined for ship
- Some indie studios shipping with AI-generated soundtracks (cost savings for small teams)
- AI tools used to generate variations of human-composed themes

### Industry Concerns

- "AI slop" risk - low-quality, generic music flooding game marketplaces
- Copyright uncertainty - unclear ownership of AI-generated game music
- Quality gap - AI music still recognizably "AI" for complex orchestral/emotional scores
- Human composers concerned about job displacement

### What's Actually Shipping

Most AI music in games is currently:
1. **Background/ambient** - Where generic quality is acceptable
2. **Procedural variations** - AI creates variants of human-composed themes
3. **Indie games** - Where budget constraints make AI the only option
4. **Mobile/casual games** - Lower quality bar, high volume needed

AAA games still overwhelmingly use human composers, sometimes AI-assisted.

---

## 15. Festival Installation (ZAO Stock)

### Interactive Music Installation Concepts for ZAO Stock (Oct 3, 2026)

**Venue:** Franklin St Parklet, Ellsworth

Given the outdoor parklet setting and the music community context, here are buildable installation concepts:

### Concept A: Collaborative Soundscape Wall

**What:** Large touchscreen or projection where attendees tap/draw to add musical elements to a shared ambient composition
**Tech stack:**
- Raspberry Pi or laptop running Tone.js web app
- Projected onto a wall or large monitor
- WebSocket for multi-user input (phones as controllers)
- Speakers positioned around the space

**Budget:** $500-2,000 (screen/projector + speakers + Pi)

### Concept B: Sensor-Driven Ambient Music

**What:** Environmental sensors (temperature, light, sound level, crowd movement) drive a generative music system
**Tech stack:**
- Arduino/Raspberry Pi with sensors
- Max/MSP or Pure Data for audio generation
- Or TouchDesigner + Max/MSP via OSC protocol
- Speakers hidden in the space

**Budget:** $300-1,500

### Concept C: AI DJ Booth

**What:** Attendees speak/type moods or descriptions, AI generates music in real-time
**Tech stack:**
- Laptop running Soundverse API or local Mubert integration
- Tablet for input
- PA speakers
- Visual feedback on screen showing what the AI is "thinking"

**Budget:** $200-1,000

### Concept D: Musical Stepping Stones

**What:** Pressure-sensitive pads on the ground that trigger musical phrases when stepped on
**Tech stack:**
- DIY pressure pads (Velostat + Arduino)
- MIDI output to Ableton Live or Tone.js
- Amplified speakers
- LED strips under translucent pads for visual feedback

**Budget:** $500-2,500

### Tools for Building Installations

| Tool | Use Case | Cost |
|------|----------|------|
| **TouchDesigner** | Visuals + sensor integration | Free (non-commercial) |
| **Max/MSP** | Audio processing + generative music | $399 or subscription |
| **Pure Data** | Open-source Max alternative | Free |
| **SuperCollider** | Algorithmic composition | Free |
| **Tone.js** | Browser-based interactive audio | Free |
| **Arduino** | Sensor input | $20-50 per board |
| **Raspberry Pi** | Compact computer for installations | $35-75 |

### 2026 Festival Trends

- Festivals increasingly blend art, tech, workshops alongside music
- Tech zones with VR/AR, gaming areas, drone shows
- Experimance Festival (Germany) actively seeking sound art installations
- Bright Festival (Florence) features immersive audiovisual works
- Interactive installations drive higher social media buzz and loyalty

---

## Summary: Actionable Opportunities for a Musician (2026)

### Highest ROI Activities

1. **Sell music packs on Unity Asset Store + itch.io** - AI-assisted production, human curation. $10-20 per pack, passive income. Unity's 70/30 split is favorable.

2. **Create DMCA-safe music for streamers** - Massive underserved market. StreamBeats proved the model. AI-generate at scale, brand around quality.

3. **License to indie game devs directly** - $200-1,000/min for custom work. Find devs on r/gamedev, IndieDB, game jams. AI tools let you deliver faster.

4. **Build an interactive music web experience** - Tone.js + Web Audio API. Low cost, high differentiation. Portfolio piece that demonstrates technical + musical skills.

5. **Submit to Roblox via DistroKid** - Low effort, massive potential audience. Curated so quality matters.

### Medium-Term Plays

6. **Learn FMOD or Wwise** - Essential for serious game audio work. FMOD recommended for musicians (DAW-like interface, free for indie).

7. **Experiment with Reactional Engine** - Cutting edge of adaptive game music. Early adoption = competitive advantage.

8. **Build a generative music app** - Tone.js for web, or AudioKit for iOS. Eno-style ambient generators have proven market.

9. **Create a ZAO Stock installation** - Interactive music + tech = memorable, Instagrammable, builds reputation.

### Watch / Wait

10. **Music NFTs in games** - Gap exists but market is niche. Wait for clearer infrastructure before investing heavily.

11. **VR music experiences** - Market growing fast ($114B -> $442B by 2030) but hardware adoption still limited.

12. **AI adaptive soundtracks** - Technology is ready but market adoption is early. Position for when it becomes standard.

---

## Sources

- [Roblox Music Licensing Platform - Music Ally](https://musically.com/2025/07/16/robloxs-new-licensing-platform-could-be-good-news-for-music/)
- [Roblox Audio Upload License Agreement](https://en.help.roblox.com/hc/en-us/articles/23359485439124-Audio-Upload-License-Agreement)
- [DistroKid Roblox Distribution](https://distrokid.com/roblox/)
- [AI Music for Game Developers: Complete Guide 2026 - Soundverse](https://www.soundverse.ai/blog/article/ai-music-for-game-developers-complete-guide-1309)
- [Adaptive Music Software Roundup - Blips.fm](https://blog.blips.fm/articles/adaptive-music-software-a-round-up-of-the-best-options-for-video-games)
- [Wwise vs FMOD vs MetaSounds 2026 - StraySpark](https://www.strayspark.studio/blog/wwise-fmod-metasounds-audio-middleware-comparison)
- [FMOD for Unity](https://www.fmod.com/unity)
- [Procedural Music Generation in Video Games - arXiv](https://arxiv.org/abs/2512.12834)
- [AI Music in Gaming 2026 - Soundverse](https://www.soundverse.ai/blog/article/ai-music-in-gaming)
- [Indie Game Music Licensing](https://www.indiegamemusic.com/licenses.php)
- [Music Licensing for Video Games Guide - ThatPitch](https://thatpitch.com/blog/music-licensing-for-video-games/)
- [Video Game Music Cost Guide - Twine](https://www.twine.net/blog/video-game-music-cost-guide/)
- [Epidemic Sound for Games](https://www.epidemicsound.com/blog/music-licensing-for-video-games/)
- [Top Sync Licensing Companies 2026 - BlakMarigold](https://www.blakmarigold.com/blog/top-18-music-sync-licensing-companies-and-how-to-get-your-music-placed)
- [Unity Asset Store Selling Guide 2026](https://generalistprogrammer.com/tutorials/unity-asset-store-selling-guide-revenue)
- [Selling Music on Asset Stores - WOW Sound](https://wowsound.com/game-asset-store-profitable-business/)
- [Tone.js](https://tonejs.github.io/)
- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Awesome WebAudio - GitHub](https://github.com/notthetup/awesome-webaudio)
- [Music NFTs in 2026 - Orphiq](https://orphiq.com/resources/music-nfts-2026)
- [Generative Music Apps - Eno & Chilvers](https://www.generativemusic.com/)
- [Wotja Generative Music](https://wotja.com/music/)
- [AI Music for VR Experiences 2026 - Soundverse](https://www.soundverse.ai/blog/article/ai-music-for-vr-experiences-0935)
- [Meta Audio SDK](https://developers.meta.com/horizon/blog/build-immersive-audio-experiences-meta-quest-sdk/)
- [AI Music for Twitch DMCA Compliance 2026 - Soundverse](https://www.soundverse.ai/blog/article/ai-music-for-twitch-streamers-dmca-compliance-0837)
- [Royalty-Free Music for Twitch 2026 - Kudos.tv](https://kudos.tv/blogs/stream-blog/royalty-free-music-for-twitch)
- [StreamBeats & Streaming Music - StreamScheme](https://www.streamscheme.com/royalty-free-music-twitch/)
- [Gaming Music Pricing - Berklee](https://online.berklee.edu/takenote/gaming-music-how-to-price-composition-work/)
- [Video Game Composer Royalties - GameSoundCon](https://www.gamesoundcon.com/post/2019/06/15/can-video-game-composers-get-royalties)
- [Indie Game Music Composer Costs - Ninichi](https://ninichimusic.com/blog/understanding-how-much-an-indie-game-music-composer-costs)
- [Reactional Engine](https://reactionalmusic.com/engine/)
- [Melodrive AI Music](https://melodrive.com/whyMelodrive.php)
- [Beatoven.ai for Game Dev](https://www.beatoven.ai/usecase/game-dev)
- [Audio Middleware Guide - Game Audio Learning](https://www.gameaudiolearning.com/knowledgebase/audio-middleware-and-how-to-use-it)
- [FMOD vs Wwise Guide - TheGameAudioCo](https://www.thegameaudioco.com/wwise-or-fmod-a-guide-to-choosing-the-right-audio-tool-for-every-game-developer)
- [AI in Game Development Case Studies 2026 - DigitalDefynd](https://digitaldefynd.com/IQ/ai-in-game-development-case-studies/)
- [Festival Tech & Art Trends 2026 - TicketFairy](https://www.ticketfairy.com/blog/beyond-music-how-2026-festivals-are-blending-art-tech-and-culture-to-stand-out)
- [Experimance Festival 2026 Sound Art Call](https://on-the-move.org/news/experimance-festival-call-sound-art-and-experimental-music-projects-2026-germany)
- [TouchDesigner + Max/MSP Integration](https://interactiveimmersive.io/blog/touchdesigner-integrations/building-instruments-with-touchdesigner-and-max/)
- [Room to Play - Tinderbox Collective](https://tinderboxcollective.org/room-to-play/)
