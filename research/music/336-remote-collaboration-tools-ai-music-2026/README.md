# Doc 336 - Remote Collaboration Tools for AI Music Production (2026)

**Created:** 2026-04-11
**Category:** Music / Collaboration / AI Tools
**Use Case:** 188-member decentralized music community (The ZAO) collaborating on AI-generated music across the US

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Comparison Matrix](#2-platform-comparison-matrix)
3. [Cloud DAWs with Collaboration](#3-cloud-daws-with-collaboration)
4. [Sample & Stem Sharing Platforms](#4-sample--stem-sharing-platforms)
5. [Real-Time Jamming Tools](#5-real-time-jamming-tools)
6. [AI-Powered Collaboration Tools](#6-ai-powered-collaboration-tools)
7. [Version Control for Music](#7-version-control-for-music)
8. [Sharing AI-Generated Stems](#8-sharing-ai-generated-stems)
9. [Discord Bots for Music Collaboration](#9-discord-bots-for-music-collaboration)
10. [Running Virtual Studio Sessions](#10-running-virtual-studio-sessions)
11. [Asynchronous Collaboration Workflows](#11-asynchronous-collaboration-workflows)
12. [Project Management for Music](#12-project-management-for-music)
13. [Revenue Splitting Tools](#13-revenue-splitting-tools)
14. [Building a Community Music Catalog](#14-building-a-community-music-catalog)
15. [ZAO-Specific Recommendations](#15-zao-specific-recommendations)

---

## 1. Executive Summary

Remote music collaboration in 2026 has matured significantly. The pandemic-era tools have evolved into polished platforms, and AI music generation has created entirely new collaboration paradigms. For a community like The ZAO (188 members, geographically distributed across the US), the key insight is:

**Asynchronous file exchange is what 90% of remote music production actually uses.** Real-time jamming is technically demanding and distance-limited. The winning strategy for ZAO is to build workflows around async collaboration with occasional real-time sessions for creative sparks.

### Top-Line Recommendations for ZAO

| Need | Recommended Tool | Cost | Why |
|------|-----------------|------|-----|
| **Primary collaboration hub** | BandLab | Free | 100M+ users, browser-based, real-time collab, AI tools, free |
| **Stem sharing & feedback** | Boombox.io or Muse | Freemium | Version control, timestamped comments, any-DAW support |
| **AI music generation** | Suno v5.5 + ElevenLabs | $10-22/mo | Best vocals + best voice cloning (see Doc 313) |
| **Revenue splitting (onchain)** | 0xSplits on Base | Free (gas only) | Already integrated in ZAO OS (see Doc 143) |
| **Revenue splitting (streaming)** | DistroKid Splits | $22.99/yr | Automatic royalty distribution to collaborators |
| **Project management** | Notion (music template) | Free tier | Song tracking, collaborator assignments, release pipeline |
| **Real-time sessions** | Endlesss (loops) or LANDR Sessions (pro) | Free / $12.50/mo | Low-friction jamming vs. professional quality |
| **Community catalog** | Supabase + Arweave | Existing infra | Builds on ZAO OS music player, permanent storage |

---

## 2. Platform Comparison Matrix

### Cloud DAWs

| Platform | Price | Real-Time Collab | AI Features | Max Tracks | Export | Mobile | Best For |
|----------|-------|-----------------|-------------|------------|--------|--------|----------|
| **BandLab** | Free ($14.95/mo Pro) | Yes, multi-user | 7 AI tools (SongStarter, AutoMix, Splitter, Voice Cleaner, FX Preset Gen) | 16 (32 Pro) | WAV/MP3 | Yes | Beginners, community collab |
| **SoundTrap** | Free ($10-11/mo paid) | Yes, video chat | Basic loops, podcast tools | Varies | WAV/MP3 | Yes | Education, podcasts |
| **Amped Studio** | Free | Yes | AI composition | Varies | WAV/MIDI | No | Quick ideas |

### Real-Time Jamming

| Platform | Price | Latency | Distance Limit | Audio Quality | Open Source |
|----------|-------|---------|----------------|---------------|-------------|
| **JamKazam** | Free | 30-40ms usable | ~500 miles | Good | No |
| **Jamulus** | Free | <45ms in 70mi | ~70 miles ideal | High (uncompressed) | Yes |
| **JackTrip** | Free | Lowest possible | Network-dependent | Studio-grade (uncompressed) | Yes |
| **Endlesss** | Free | N/A (async loops) | Unlimited | Good | No |

### Professional Remote Tools

| Platform | Price | Key Feature | Best For |
|----------|-------|-------------|----------|
| **Sessionwire** | $29/mo | Studio-quality 48kHz streaming, HD video, screen share | Pro sessions |
| **LANDR Sessions** | $12.50/mo | Video + DAW audio streaming, AI mastering | Producer feedback |
| **Audiomovers LISTENTO** | $99-275/yr | 128-channel lossless, talkback, guest passes | Mixing/mastering review |
| **Muse** | Freemium | Timestamped waveform comments, version control | Async feedback |
| **Boombox.io** | Freemium | All-in-one: stems, mastering, distribution, comments | Full pipeline |

---

## 3. Cloud DAWs with Collaboration

### BandLab - The Community Choice

**Why it matters for ZAO:** Free, browser-based, 100M+ users, works on phone/tablet/computer. The lowest barrier to entry for getting 188 members making music together.

**AI Features (April 2026):**
- **SongStarter** - AI generates musical ideas from a text prompt to kick off a track
- **Voice Cleaner** - AI noise reduction for vocal recordings
- **AutoMix** - AI-balanced mix of all tracks
- **Splitter** - AI stem separation (vocals, drums, bass, other)
- **AI FX Preset Generator** - Generate custom FX chains from text prompts (e.g., "warm vinyl lo-fi vocals")
- **Creator Kit** - Sample packs and loops

**Collaboration Features:**
- Real-time multi-user editing on the same project
- Cross-device (phone, tablet, desktop browser)
- Unlimited cloud storage (free tier)
- Social feed for sharing and discovering music
- Comments and reactions on tracks
- Fork/remix other users' public tracks

**Limitations:**
- 16 tracks per project (32 on $14.95/mo Membership)
- Not a professional-grade DAW - limited mixing/mastering tools
- AI features gated behind Membership tier
- Distribution requires Membership

**Verdict:** Best entry point for community-wide participation. Every ZAO member can sign up free and start contributing to collaborative tracks immediately.

### SoundTrap (by Spotify)

**Key features:**
- Real-time collaboration with integrated video chat
- Built-in loops, instruments, and effects
- Podcast creation tools (Storyteller feature)
- Spotify Premium bundle at $19.99/mo

**Pricing:**
- Free tier with limited features
- Music Makers: ~$10/mo
- Complete: ~$11/mo
- Spotify bundle: $19.99/mo (includes Spotify Premium)

**Limitations:**
- Less robust AI features than BandLab
- Smaller community
- More education-focused than music production-focused

**Verdict:** Good for members already in the Spotify ecosystem, but BandLab is more capable and free.

---

## 4. Sample & Stem Sharing Platforms

### Splice

**Current state (2026):** Splice shut down its Studio collaboration feature in March 2023. It is no longer a direct collaboration platform. However, it remains the gold standard for sample libraries.

**What still works:**
- 100M+ royalty-free samples, loops, and presets
- Sounds Plugin (beta) - browse/preview/drag samples directly in DAW
- AI "Stacks" - curates loops matching your project's key and BPM
- Rent-to-own plugins (Serum, Arturia, etc.)
- Cloud backup with version history for DAW projects

**Pricing:** Subscription model starting ~$9.99/mo for 100 credits

**For ZAO:** Useful as a shared sample library. Members on paid plans can share sample packs and presets. Not a collaboration platform anymore.

### Boombox.io

**The all-in-one contender:**
- Stem separation via "Boombot" AI
- AI mastering
- Version control with timestamped waveform comments
- Auto-tags files with BPM, key, genre
- Distribution to streaming platforms
- Replaces 3-4 separate subscriptions

**For ZAO:** Strong candidate for the community's primary collaboration hub if members want more professional tools than BandLab.

### Muse (musesessions.co)

**Purpose-built for async music feedback:**
- Upload mixes to shared workspace
- Timestamped feedback on waveform
- Automatic version control
- Works with any DAW
- Eliminates "which version is the latest?" chaos

**For ZAO:** Ideal for the feedback/review phase of collaborative tracks.

---

## 5. Real-Time Jamming Tools

### The Latency Problem

Real-time music jamming over the internet has a fundamental physics constraint: sound travels at the speed of light through fiber, but network routing adds unpredictable latency. Here are the practical thresholds:

| Latency | Experience |
|---------|-----------|
| <25ms | Feels like being in the same room |
| 25-35ms | Usable for most genres, slight lag on fast passages |
| 35-45ms | Workable for loose grooves, old-time music, ambient |
| >45ms | Unplayable for synchronized performance |

**Critical factors:**
- Wired ethernet required (WiFi adds 5-20ms jitter)
- Distance matters: ~500 miles max for JamKazam, ~70 miles ideal for Jamulus
- ISP routing is unpredictable - two people 50 miles apart might route through servers hundreds of miles away
- Upload speed: minimum 1Mbps, recommended 5-10Mbps

### JamKazam

- Free to use
- Best within 500-mile radius
- Audio-only (no video built in)
- Dedicated hardware ("JamBlaster") available for lowest latency
- Active community of jammers

### Jamulus (Open Source)

- Free, open source (github.com/jamulussoftware/jamulus)
- Designed for high quality, low-latency
- Within 70 miles: <45ms achievable
- Run your own server for best performance
- Audio-only
- Active development community

### JackTrip (Open Source, Stanford)

- Free, open source (developed at Stanford CCRMA)
- Highest quality: uncompressed, bidirectional audio
- Supports any number of channels
- More complex setup than Jamulus
- Cloud-hosted option available (JackTrip Virtual Studio)
- Best for institutions/communities willing to manage infrastructure

### Endlesss - The Better Approach for Distributed Communities

**Why this matters most for ZAO:** Endlesss solves the latency problem by not trying to be synchronous. Instead, it uses an additive loop workflow.

**How it works:**
1. Someone starts a "Jam" - a shared collaborative space
2. Players add short loops ("Rifffs") - drums, bass, notes, sampler, or recorded input
3. Loops quantize and stack - building up a track collaboratively
4. Works live (everyone online) or async (add your loop whenever)
5. Mobile app for sketching ideas on the go
6. Endlesss Studio for desktop/DAW integration

**Why it beats real-time jamming for ZAO:**
- No latency constraints - members in NYC and LA can collaborate
- Lower barrier to entry than configuring JamKazam
- Mobile-first (aligned with ZAO's design philosophy)
- Social/community features built in
- Export loops and arrangements to DAW for polishing

**Verdict for ZAO:** Endlesss is the strongest fit for real-time-ish community music creation. It turns the latency problem from a bug into a feature.

---

## 6. AI-Powered Collaboration Tools

### Google Magenta Studio (Open Source)

**What it is:** Collection of open-source AI tools and plugins from Google's Magenta research project.

**Tools available:**
- **Drumify** - Generate drum patterns from any audio
- **Continue** - AI extends your melody
- **Interpolate** - Morph between two musical ideas
- **NSynth** - Create new sounds by blending instruments
- **Groove** - Humanize drum patterns
- **Magenta RT** - Real-time generative music (open-weights cousin of Lyria RealTime)

**Integration:** VST/AU plugins for Ableton Live and other DAWs

**For ZAO:** Free, open-source AI tools that any member can add to their DAW. Good for generating starting ideas that others can build on. Magenta RT is especially interesting for live performance experiments.

### Soundverse API

Enterprise-grade API for AI music generation and modification. Developers can build bots and apps with:
- Text-to-music generation
- Stem separation
- Audio modification
- Integration with Discord, Slack, custom apps

**For ZAO:** Could power a custom bot in ZAO's communication channels that generates music from prompts.

### Mureka O1 (via Discord/API)

AI music model with MusiCoT (Chain-of-Thought) reasoning:
- Generate original tracks from text prompts
- Stem exports for remixing
- Can be integrated into Discord bots
- Generates royalty-free music

**For ZAO:** A Discord bot that generates music in voice channels could be a fun community engagement tool.

---

## 7. Version Control for Music

### Can You Git Music Projects?

**Yes, but with significant caveats.**

**What works:**
- DAW project files (Ableton .als, Logic .logicx, Reaper .rpp) can be committed
- Full git history: branch, merge, revert, compare versions
- Descriptive commits: "bass vst settings adjusted", "added bridge section"
- Branching: try experimental versions without losing the original

**What doesn't work well:**
- Audio files (WAV, AIFF) are large binaries - git struggles with them
- Can't meaningfully diff audio files
- Repository size explodes quickly with audio
- Proprietary DAW files aren't human-readable

**Solutions:**

| Approach | How | Pros | Cons |
|----------|-----|------|------|
| **Git + Git LFS** | Store audio in LFS, project files in git | Full version history | LFS hosting costs, still large |
| **Git + .gitignore audio** | Only version the project file, keep audio separate | Lightweight repos | Audio not versioned |
| **Splice Cloud** | Built-in versioning for DAW projects | Automatic, easy | Splice ecosystem only |
| **Boombox.io** | Version control + timestamped comments | Purpose-built for music | Subscription |
| **Muse** | Automatic versioning on upload | Simple, any-DAW | Limited to mix/master phase |
| **DawLab** | "GitHub for Musicians" - new tool | Designed for this exact problem | Early-stage |

**Recommendation for ZAO:** Don't force git on musicians. Use a purpose-built tool (Boombox.io or Muse) for version control, and reserve git for the ZAO OS codebase. Musicians should never need to learn git to collaborate.

---

## 8. Sharing AI-Generated Stems

### Best Formats for Collaboration

| Format | Use Case | Quality | File Size | Compatibility |
|--------|----------|---------|-----------|---------------|
| **WAV 48kHz/24-bit** | Production stems | Lossless | Large (~30MB/min stereo) | Universal |
| **WAV 44.1kHz/16-bit** | Final masters | CD quality | Medium (~10MB/min) | Universal |
| **FLAC** | Archival/sharing | Lossless compressed | 50-60% of WAV | Most DAWs |
| **MP3 320kbps** | Quick previews/feedback | Lossy | Small (~2.5MB/min) | Universal |
| **MIDI** | Melodic/harmonic data | Perfect (data, not audio) | Tiny (<100KB) | Universal |

### Stem Naming Convention

For a community catalog, standardize names:
```
[song-slug]_[stem-type]_[version]_[bpm]_[key].wav

Examples:
summer-groove_drums_v2_120bpm_Cmaj.wav
summer-groove_bass_v1_120bpm_Cmaj.wav
summer-groove_vocals_v3_120bpm_Cmaj.wav
summer-groove_synth-pad_v1_120bpm_Cmaj.wav
```

### Cloud Storage Options

| Service | Free Tier | Best For | Collaboration Features |
|---------|-----------|----------|----------------------|
| **Google Drive** | 15GB | Small teams | Shared folders, comments |
| **Dropbox** | 2GB | DAW integration | Selective sync, file requests |
| **Backblaze B2** | 10GB | Bulk storage | S3-compatible API, cheap at scale |
| **Arweave** | Pay-per-upload | Permanent storage | Immutable, decentralized |
| **IPFS/Filecoin** | Varies | Web3 native | Content-addressed, decentralized |
| **Hugging Face** | Free | AI model artifacts | Git-based, large file support |
| **Fast.io** | Varies | AI agent workflows | MCP server with 251 tools |

### Recommended Workflow for ZAO

1. **Generate** stems using Suno/ElevenLabs/ACE-Step (see Doc 313)
2. **Separate** into individual stems using Demucs v4 or BandLab Splitter
3. **Name** using the convention above
4. **Upload** to shared Google Drive or Boombox.io workspace
5. **Tag** with BPM, key, genre, creator, license
6. **Archive** finals to Arweave for permanent, decentralized storage
7. **Index** in the ZAO OS music catalog (Supabase)

---

## 9. Discord Bots for Music Collaboration

### The 2026 Landscape

Discord has 650M+ registered accounts and remains the primary real-time communication platform for music communities. AI-powered music bots have evolved significantly.

### Key Bots and Integrations

| Bot/Tool | What It Does | AI Features |
|----------|-------------|-------------|
| **Mureka Bot** | Generate music from text prompts in voice channels | MusiCoT reasoning, stem exports |
| **Soundverse API** | Build custom bots with AI music generation | Text-to-music, stem separation, audio modification |
| **Boombot (Boombox)** | Stem separation, auto-tagging (BPM, key, genre) | AI-powered analysis |
| **Jukebox Bot** | Play music in voice channels | Basic playback |

### Building a ZAO Music Bot

A custom Discord/Farcaster bot could:
1. Accept text prompts from members ("make a lo-fi beat in C minor, 85bpm")
2. Generate music via Suno/Soundverse/Mureka API
3. Post stems to a shared channel
4. Allow members to download, remix, and re-upload
5. Track contributions and collaborators
6. Trigger 0xSplits distribution when a track is released

**Implementation consideration:** ZAO OS already has a Farcaster-based architecture. A music generation bot that works in Farcaster channels (via Neynar) would be more aligned than Discord - though many ZAO members are active on Discord too.

---

## 10. Running Virtual Studio Sessions

### Session Types

| Type | Duration | Participants | Tools | Best For |
|------|----------|-------------|-------|----------|
| **Writing Room** | 2-4 hours | 2-5 people | Video call + shared doc + AI generator | Songwriting, concept development |
| **Beat Battle** | 1-2 hours | 5-20 people | AI music generator + shared listening | Community engagement, ideation |
| **Production Sprint** | 4-8 hours | 2-4 people | BandLab or shared DAW + video call | Taking a song from idea to rough mix |
| **Listening Session** | 1 hour | Any size | ZAO OS listening room + voice chat | Feedback, A/B comparisons |
| **Mix Review** | 1-2 hours | 2-3 people | LANDR Sessions or Audiomovers | Professional feedback on mixes |

### How to Run a Virtual Studio Session

**Pre-session (24 hours before):**
1. Define the goal: "We're writing a summer anthem" or "We're finishing the bridge on Track 3"
2. Assign roles: songwriter, producer, vocalist, engineer
3. Share reference tracks and any existing stems
4. Confirm everyone has the tools installed and tested
5. Set the session schedule with breaks

**During session:**
1. Start with a 10-minute vibe check - listen to references together
2. Use video for creative discussion, mute when recording
3. One person drives the DAW, others contribute via voice/chat
4. Save versions every 30 minutes with descriptive names
5. Record the session (screen + audio) for members who couldn't attend

**Post-session:**
1. Export stems and rough mix
2. Upload to shared workspace (Boombox.io/Muse/Drive)
3. Post summary to ZAO OS channel with next steps
4. Allow 48 hours for async feedback before next session

### Tools Stack for Sessions

- **Video:** Zoom/Discord/Google Meet (familiar, reliable)
- **Audio streaming:** LANDR Sessions ($12.50/mo) or Sessionwire ($29/mo)
- **DAW sharing:** BandLab (free, browser) or screen share + Audiomovers
- **Chat/notes:** Notion or shared Google Doc
- **Recording:** OBS (free) for screen + audio capture

---

## 11. Asynchronous Collaboration Workflows

### The Relay Race Model

This is how 90% of remote music is actually made. Each person works on their own schedule, passing the project forward.

```
Phase 1: CONCEPT (Songwriter)
  - Write lyrics + melody sketch
  - Record voice memo or use AI to generate demo
  - Share concept brief: mood, references, tempo, key
  - Upload to shared workspace
       |
       v
Phase 2: PRODUCTION (Producer/Beatmaker)
  - Generate beat using AI tools (Suno, ACE-Step) or produce from scratch
  - Arrange song structure (intro, verse, chorus, bridge, outro)
  - Export stems: drums, bass, harmony, melody
  - Upload stems with naming convention
       |
       v
Phase 3: VOCALS (Vocalist)
  - Download instrumental stems
  - Record vocals over the beat (home studio or phone)
  - Option: use AI voice cloning for demo vocals (ElevenLabs, Kits.ai)
  - Upload vocal stems (dry + wet versions)
       |
       v
Phase 4: MIXING (Engineer)
  - Download all stems
  - Mix in DAW (or use AI mastering via LANDR/Boombox)
  - Upload rough mix for feedback
  - Iterate based on timestamped comments
       |
       v
Phase 5: MASTERING & RELEASE (Community)
  - Final master (AI or human)
  - Set up 0xSplits contract for all contributors
  - Distribute via DistroKid/RouteNote
  - Publish to ZAO OS music catalog
  - Cross-post announcement to Farcaster/X/Bluesky
```

### Timing for a Community of 188

| Phase | Realistic Timeline | Bottleneck |
|-------|-------------------|------------|
| Concept | 1-3 days | Songwriter availability |
| Production | 3-7 days | Producer queue |
| Vocals | 3-7 days | Vocalist scheduling, recording quality |
| Mixing | 3-5 days | Engineer availability |
| Mastering & Release | 1-2 days | Admin/distribution setup |
| **Total** | **2-4 weeks per track** | **Vocalist recording is usually the bottleneck** |

### Speeding It Up with AI

- **Phase 1:** Use Claude/Llama to brainstorm lyrics (see Doc 329)
- **Phase 2:** Generate beat in minutes with Suno v5.5 (see Doc 321)
- **Phase 3:** Use ElevenLabs voice clone for demo vocals, replace with real vocals later
- **Phase 4:** AI mastering via LANDR gets you 80% there in seconds
- **Total with AI assist:** **3-7 days per track** (human vocal recording is still the bottleneck)

---

## 12. Project Management for Music

### Notion Templates for Song Tracking

**Recommended structure for ZAO:**

```
ZAO Music Production
├── Song Pipeline (Kanban board)
│   ├── Ideas / Concepts
│   ├── In Production
│   ├── Recording Vocals
│   ├── Mixing
│   ├── Mastering
│   ├── Ready for Release
│   └── Released
│
├── Song Database (table)
│   ├── Title
│   ├── BPM / Key / Genre
│   ├── Songwriter(s)
│   ├── Producer(s)
│   ├── Vocalist(s)
│   ├── Engineer
│   ├── Status
│   ├── Split percentages
│   ├── Stems link
│   ├── Release date
│   └── Streaming links
│
├── Collaborator Directory
│   ├── Name / Handle
│   ├── Skills (vocals, production, lyrics, mixing)
│   ├── Wallet address (for 0xSplits)
│   ├── Availability
│   └── Past contributions
│
└── Release Calendar
    ├── Weekly release schedule
    ├── Marketing tasks
    └── Cross-platform posting checklist
```

### Trello vs. Notion

| Feature | Trello | Notion |
|---------|--------|--------|
| Visual workflow | Excellent (Kanban native) | Good (Kanban view available) |
| Database/relations | Limited | Powerful (linked databases) |
| Documentation | Weak | Excellent |
| Templates | Moderate library | 10,000+ community templates |
| Free tier | Generous | Generous |
| Music-specific templates | Few | Several purpose-built ones |
| Mobile app | Good | Good |

**Recommendation:** Notion. The linked database feature lets you connect songs to collaborators, releases to marketing tasks, and stems to cloud storage links. Trello is fine for simple task tracking but can't handle the relational data a music production pipeline needs.

---

## 13. Revenue Splitting Tools

### Overview of Options

| Tool | Type | Best For | Fees | Chains/Platforms |
|------|------|----------|------|-----------------|
| **0xSplits** | Onchain smart contract | NFT/onchain revenue | No protocol fees (gas only) | Ethereum, Base, Optimism, Arbitrum, Zora, Polygon |
| **DistroKid Splits** | Streaming distributor | Spotify/Apple Music royalties | $22.99/yr base plan | All major streaming platforms |
| **RouteNote** | Free distributor | Budget-conscious artists | Free tier (85% royalties) or $9.99 (100%) | All major streaming platforms |
| **SplitSheet** | Legal agreement | Formalizing splits before release | Free (generates PDF) | N/A (legal document) |
| **Stem** | Distribution + splits | Indie labels | Varies | Streaming platforms |

### 0xSplits (Onchain) - Already in ZAO OS

See Doc 143 for full implementation guide. Key points:
- Open-source, audited, non-upgradeable contracts
- Processed $500M+ in distributions
- No protocol fees
- Supports: Split (percentage-based), Waterfall (sequential/recoup), Liquid Splits (tokenized positions), Swapper (auto-convert tokens), Vesting
- Native on Base (same chain as ZOUNZ)
- Used by Sound, Zora, Art Blocks, Nouns DAO

**ZAO default split:** Artist 80% / ZAO Treasury 10% / Curator 10% (configurable per release)

### DistroKid Splits (Streaming)

- Set split percentages per song/album
- Collaborators don't need their own DistroKid account ($10/yr guest access)
- Privacy: collaborators can't see each other's percentages
- Recoupment feature: pay back expenses (beats, music videos) before splits kick in
- Automatic payment distribution

### SplitSheet.com

Free tool that generates a legal PDF agreement documenting:
- Song title and description
- All collaborators and their roles
- Percentage splits
- Signatures

**For ZAO:** Use SplitSheet to formalize agreements BEFORE starting production. Then implement the agreed splits via 0xSplits (onchain) and DistroKid (streaming).

### Recommended Revenue Stack for ZAO

```
Song Revenue
├── Onchain (NFT mints, tips, streaming tokens)
│   └── 0xSplits on Base (automatic, trustless)
│
├── Streaming (Spotify, Apple Music, etc.)
│   └── DistroKid Splits (automatic distribution)
│
├── Sync/Licensing
│   └── Manual distribution per SplitSheet agreement
│
└── Legal Documentation
    └── SplitSheet PDF for every collaboration
```

---

## 14. Building a Community Music Catalog

### What a ZAO Music Catalog Needs

1. **Searchable database** of all community-created music
2. **Metadata** for every track: title, BPM, key, genre, contributors, stems available, license
3. **Playback** integrated into ZAO OS (already exists - music player)
4. **Stem downloads** for remixing and collaboration
5. **Contribution tracking** - who made what, for Respect weighting
6. **Permanent storage** - tracks should exist forever, not depend on a platform
7. **Revenue distribution** - automated splits when tracks earn money

### Architecture (Building on Existing ZAO OS Infrastructure)

```
┌─────────────────────────────────────┐
│          ZAO OS Frontend            │
│  (Music Player, Catalog Browser)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Supabase (PostgreSQL)        │
│  - songs table (metadata, links)    │
│  - contributors table (splits)      │
│  - stems table (per-song files)     │
│  - reactions/respect votes          │
└──────┬──────────────┬───────────────┘
       │              │
┌──────▼──────┐ ┌─────▼──────────────┐
│  Arweave    │ │  Streaming CDN     │
│  (permanent │ │  (Cloudflare R2 or │
│   storage)  │ │   Backblaze B2)    │
└─────────────┘ └────────────────────┘
```

### Contribution Model

Members can contribute:
- **Original AI-generated tracks** (full songs via Suno/ElevenLabs)
- **Stems** (individual instrument layers for remixing)
- **Remixes** of other members' tracks
- **Lyrics** (text, attached to song entries)
- **Cover art** (AI-generated or original)
- **Vocal recordings** over community beats

### Respect Integration

ZAO's existing Respect-weighted curation system (Doc 138, `src/lib/music/curationWeight.ts`) can be extended:
- Tracks with more Respect float to the top of the catalog
- Contributors earn Respect for catalog contributions
- Community votes on which tracks to officially release/distribute
- High-Respect tracks auto-qualify for community distribution

---

## 15. ZAO-Specific Recommendations

### Phase 1: Quick Wins (This Month)

1. **Create a BandLab community workspace** - invite all 188 members, start collaborative tracks
2. **Set up a Notion music production board** - song pipeline, collaborator directory
3. **Standardize stem naming convention** (see Section 8)
4. **Run a "Beat Battle"** - members generate beats with Suno, community votes on favorites
5. **Document the async relay workflow** in ZAO OS docs

### Phase 2: Infrastructure (Next 2-3 Months)

1. **Add a community catalog page** to ZAO OS - browse/search all community music
2. **Integrate Boombox.io or Muse** for version-controlled stem sharing
3. **Build a music submission flow** in ZAO OS - upload stems, tag metadata, set splits
4. **Connect 0xSplits** for automatic revenue distribution (Doc 143 has the implementation)
5. **Set up DistroKid** for community releases with automatic splits

### Phase 3: Advanced (3-6 Months)

1. **Build a Farcaster music bot** - generate AI music from prompts in ZAO channels
2. **Integrate Endlesss** for community jam sessions
3. **Arweave archival** for permanent storage of released tracks
4. **AI-assisted mixing/mastering pipeline** - LANDR or Boombox integration
5. **Community radio station** - curated playlist of all community music in the ZAO OS player

### Cost Estimate for 188 Members

| Item | Cost | Who Pays |
|------|------|----------|
| BandLab | Free | Members |
| Notion (free tier) | Free | ZAO |
| Suno Pro (for power users) | $10/mo per user | Individual members |
| DistroKid | $22.99/yr | ZAO Treasury |
| 0xSplits | Gas only (~$0.50/split) | ZAO Treasury |
| Endlesss | Free | Members |
| LANDR Sessions (for session leads) | $12.50/mo x 2-3 leads | ZAO Treasury |
| **Total ZAO cost** | **~$50-75/mo** | **ZAO Treasury** |

---

## Sources

- [BandLab - From DAW to GAW](https://www.makingascene.org/from-daw-to-gaw-how-bandlab-studio-is-using-ai-to-redefine-music-production/)
- [BandLab Reviews 2026](https://checkthat.ai/brands/bandlab/reviews)
- [SoundTrap Pricing](https://www.soundtrap.com/pricing)
- [Audiomovers LISTENTO Update](https://www.soundonsound.com/news/audiomovers-update-listento)
- [Audiomovers LISTENTO Review](https://producelikeapro.com/blog/audiomovers-listento-review/)
- [Splice Wikipedia](https://en.wikipedia.org/wiki/Splice_(platform))
- [Splice Collaboration Shutdown](https://musically.com/2023/03/10/splice-shuts-down-its-studio-feature-for-music-collaboration/)
- [Endlesss App Store](https://apps.apple.com/us/app/endlesss-multiplayer-music/id1439811325)
- [Google Magenta](https://magenta.withgoogle.com/)
- [Magenta RealTime](https://magenta.withgoogle.com/magenta-realtime)
- [Git for Music Production](https://grechin.org/2023/05/06/git-and-reaper.html)
- [JamKazam Latency Forum](https://forum.jamkazam.com/showthread.php?tid=963)
- [Jamulus GitHub](https://github.com/jamulussoftware/jamulus)
- [JackTrip FAQ](https://support.jacktrip.com/virtual-studio-frequently-asked-questions-faqs)
- [0xSplits / Splits.org](https://splits.org/)
- [Splits Documentation](https://docs.splits.org/)
- [DistroKid Splits](https://support.distrokid.com/hc/en-us/articles/360013534394-Using-Splits-To-Pay-Your-Collaborators-Automatically)
- [Remote Music Collaboration Guide](https://aliada.io/blog/how-to-collaborate-on-music-remotely)
- [12 AI Music Collaboration Platforms 2026](https://www.makeasong.co/ai-music-collaboration-platforms/)
- [12 Online Platforms for Music Collaboration 2026](https://www.makeasong.co/online-platforms-for-music-collaboration/)
- [Remote Music Production Tips 2026](https://www.makeasong.co/remote-music-production-workflow-tips/)
- [Sessionwire](https://www.sessionwire.com/)
- [LANDR Sessions](https://www.landr.com/sessions)
- [Muse Sessions](https://www.musesessions.co/)
- [Boombox.io](https://boombox.io/)
- [Notion Music Templates](https://super.so/templates/notion-music-templates)
- [Soundverse API](https://www.soundverse.ai/blog/article/how-to-build-a-music-ai-workflow-for-creators-0051)
- [Discord Music Bots 2026](https://skywork.ai/skypage/en/discord-music-bot-guide/2034468992538128384)
- [Water & Music - Web3 Splits](https://www.waterandmusic.com/splitting-the-difference-music-and-web3s-multiplayer-problem)

---

## Cross-References

- **Doc 143** - 0xSplits Revenue Distribution (implementation guide)
- **Doc 313** - AI Music Production Workflows 2026 (generation tools)
- **Doc 321** - Suno AI Platform 2026
- **Doc 322** - AI Music Distribution & Marketing
- **Doc 323** - Mixing & Mastering AI Music DAW Guide
- **Doc 326** - AI Songwriting Collaborator Guide
- **Doc 329** - The $0 Music Production Stack
- **Doc 330** - Open Source Stem Separation Tools
- **Doc 332** - Farcaster Music Distribution Infrastructure
- **Doc 335** - Live AI Music Performance & Festival Guide
- **Doc 138** - Play Counting & Stream Attribution
- **Doc 185** - Synchronized Listening Rooms
